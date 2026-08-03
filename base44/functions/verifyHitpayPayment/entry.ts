import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const bookingId = body?.bookingId;

    if (!bookingId) {
      return Response.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const HITPAY_API_KEY = secrets.get("HITPAY_API_KEY");
    if (!HITPAY_API_KEY) {
      return Response.json({ error: 'HitPay API key not configured' }, { status: 500 });
    }

    const baseUrl = "https://api.hit-pay.com/v1/payment-requests";

    // Look up the payment request on HitPay by the booking reference number.
    const searchUrl = `${baseUrl}?search=${encodeURIComponent(bookingId)}&per_page=50&current_page=1`;
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "X-BUSINESS-API-KEY": HITPAY_API_KEY,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    console.log("📥 HitPay verify response:", response.status, JSON.stringify(data));

    if (!response.ok) {
      return Response.json({ error: 'Failed to verify payment', details: data }, { status: response.status });
    }

    const requests = Array.isArray(data) ? data : (data.data || []);
    // HitPay search is a partial match — pick the exact reference_number match.
    const paymentRequest = (requests as any[]).find(
      (r) => r && r.reference_number === bookingId
    );

    if (!paymentRequest) {
      // No payment request found yet on HitPay — payment may not have completed.
      const current = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
      return Response.json({ booking_status: current?.booking_status || 'pending', hitpay_status: 'not_found' });
    }

    const hitpayStatus = String(paymentRequest.status || '').toLowerCase();
    const isCompleted = hitpayStatus === 'completed';

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (isCompleted) {
      if (booking.booking_status !== 'confirmed') {
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          booking_status: "confirmed",
          confirmation_date: booking.confirmation_date || new Date().toISOString(),
        });
        console.log(`✅ Booking ${bookingId} confirmed via verifyHitpayPayment`);

        try {
          const refreshed = await base44.asServiceRole.entities.Booking.get(bookingId);
          await base44.asServiceRole.functions.invoke('sendBookingConfirmation', { booking: refreshed });
        } catch (notifError) {
          console.error("⚠️ Notification dispatch failed:", notifError);
        }
      }
      return Response.json({ booking_status: 'confirmed', hitpay_status: hitpayStatus });
    }

    if (hitpayStatus === 'failed' || hitpayStatus === 'voided' || hitpayStatus === 'expired') {
      if (booking.booking_status !== 'confirmed') {
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          booking_status: "failed",
        });
      }
      return Response.json({ booking_status: 'failed', hitpay_status: hitpayStatus });
    }

    // Still pending / other
    return Response.json({ booking_status: booking.booking_status, hitpay_status: hitpayStatus });
  } catch (error) {
    console.error("❌ verifyHitpayPayment error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}