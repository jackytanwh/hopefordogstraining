import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac } from 'node:crypto';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const HITPAY_SALT = secrets.get("HITPAY_SALT");
    if (!HITPAY_SALT) {
      console.error("❌ HITPAY_SALT not configured");
      return Response.json({ error: 'Webhook salt not configured' }, { status: 500 });
    }

    const rawBody = await req.text();
    const receivedSignature = req.headers.get('hitpay-signature') || '';

    if (!receivedSignature) {
      console.warn("❌ Missing hitpay-signature header");
      return Response.json({ error: 'Missing signature' }, { status: 403 });
    }

    const expectedSignature = createHmac('sha256', HITPAY_SALT)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== receivedSignature) {
      console.warn("❌ Webhook signature mismatch");
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    console.log("✅ HitPay webhook signature verified");

    const payload = JSON.parse(rawBody);
    const status = payload.status;
    const reference = payload.reference_number;

    console.log(`📋 HitPay webhook status: ${status}, reference: ${reference}`);

    if (!reference) {
      console.warn("⚠️ No reference_number in payload");
      return Response.json({ status: 'ignored', reason: 'no_reference' });
    }

    const bookingId = reference;

    const allBookings = await base44.asServiceRole.entities.Booking.list();
    const booking = allBookings.find((b) => b.id === bookingId);

    if (!booking) {
      console.warn(`⚠️ Booking ${bookingId} not found`);
      return Response.json({ status: 'ignored', reason: 'booking_not_found' });
    }

    if (status === 'completed') {
      if (booking.booking_status === 'confirmed') {
        console.log(`ℹ️ Booking ${bookingId} already confirmed, skipping`);
        return Response.json({ status: 'already_confirmed' });
      }

      await base44.asServiceRole.entities.Booking.update(bookingId, {
        booking_status: "confirmed",
        confirmation_date: booking.confirmation_date || new Date().toISOString(),
      });
      console.log(`✅ Booking ${bookingId} confirmed via webhook`);

      // Send notifications (WhatsApp + Email)
      try {
        const refreshed = await base44.asServiceRole.entities.Booking.list();
        const updated = refreshed.find((b) => b.id === bookingId) || booking;
        await base44.asServiceRole.functions.invoke('sendBookingConfirmation', { booking: updated });
      } catch (notifError) {
        console.error("⚠️ Notification dispatch failed:", notifError);
      }
    } else {
      // Failed / other statuses
      if (booking.booking_status === 'confirmed') {
        return Response.json({ status: 'ignored', reason: 'already_confirmed' });
      }
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        booking_status: "failed",
      });
      console.log(`✅ Booking ${bookingId} marked as failed via webhook`);

      try {
        const clientName = booking.client_name || booking.clients?.[0]?.client_name || 'Unknown';
        const clientEmail = booking.client_email || booking.clients?.[0]?.client_email || '';
        const clientMobile = booking.client_mobile || booking.clients?.[0]?.client_mobile || '';
        await base44.asServiceRole.functions.invoke('sendFailedBookingAlert', {
          bookingId,
          clientName,
          clientEmail,
          clientMobile,
          serviceName: booking.service_name || '',
          errorReason: `Payment ${status || 'failed'}`,
        });
      } catch (alertErr) {
        console.warn('⚠️ Failed booking alert not sent:', alertErr);
      }
    }

    return Response.json({ status: 'success' });

  } catch (error) {
    console.error("❌ hitpayWebhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}