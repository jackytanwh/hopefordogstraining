import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// Reconciles bookings that are still "pending" against HitPay: if HitPay
// reports the payment as completed, the booking is confirmed (and the
// confirmation email is sent), so a delayed or missed webhook can never
// leave a paid booking stuck in "Pending".

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const HITPAY_API_KEY = secrets.get("HITPAY_API_KEY");
    if (!HITPAY_API_KEY) {
      return Response.json({ error: 'HitPay API key not configured' }, { status: 500 });
    }

    // Only look at bookings pending in the last 3 days — anything older
    // than that should already have been resolved by webhook or the client.
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const pending = await base44.asServiceRole.entities.Booking.filter({
      booking_status: 'pending',
    });
    const candidates = pending.filter(b => b.created_date && b.created_date >= cutoff);

    if (candidates.length === 0) {
      return Response.json({ ok: true, checked: 0, confirmed: 0 });
    }

    const confirmed: string[] = [];
    const stillPending: string[] = [];
    const errors: { bookingId: string; error: string }[] = [];

    for (const booking of candidates) {
      try {
        const searchUrl = `https://api.hit-pay.com/v1/payment-requests?search=${encodeURIComponent(booking.id)}&per_page=50&current_page=1`;
        const response = await fetch(searchUrl, {
          method: "GET",
          headers: {
            "X-BUSINESS-API-KEY": HITPAY_API_KEY,
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          errors.push({ bookingId: booking.id, error: `HitPay API ${response.status}` });
          continue;
        }

        const data = await response.json();
        const requests = Array.isArray(data) ? data : (data.data || []);
        const paymentRequest = requests.find(
          (r: any) => r && r.reference_number === booking.id
        );

        if (!paymentRequest) {
          stillPending.push(booking.id);
          continue;
        }

        const hitpayStatus = String(paymentRequest.status || '').toLowerCase();
        if (hitpayStatus === 'completed') {
          await base44.asServiceRole.entities.Booking.update(booking.id, {
            booking_status: 'confirmed',
            confirmation_date: booking.confirmation_date || new Date().toISOString(),
          });
          confirmed.push(booking.id);
          console.log(`✅ Reconciled booking ${booking.id} — confirmed from HitPay`);

          try {
            const refreshed = await base44.asServiceRole.entities.Booking.get(booking.id);
            await base44.asServiceRole.functions.invoke('sendBookingConfirmation', { booking: refreshed });
          } catch (notifError) {
            console.error(`⚠️ Confirmation email failed for ${booking.id}:`, notifError);
          }
        } else if (hitpayStatus === 'failed' || hitpayStatus === 'voided' || hitpayStatus === 'expired') {
          stillPending.push(booking.id); // leave for the failed-payment alert path
        } else {
          stillPending.push(booking.id);
        }
      } catch (bookingError: any) {
        errors.push({ bookingId: booking.id, error: bookingError?.message || 'unknown error' });
      }
    }

    return Response.json({
      ok: true,
      checked: candidates.length,
      confirmed,
      still_pending: stillPending,
      errors,
    });
  } catch (error: any) {
    console.error('❌ reconcilePendingPayments error:', error);
    return Response.json({ error: error?.message || 'unknown error' }, { status: 500 });
  }
}