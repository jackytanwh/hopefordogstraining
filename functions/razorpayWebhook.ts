import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
    console.log("🚀 razorpayWebhook function triggered");

    try {
        const base44 = createClientFromRequest(req);

        const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
        if (!RAZORPAY_WEBHOOK_SECRET) {
            console.error("❌ RAZORPAY_WEBHOOK_SECRET not configured");
            return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        const rawBody = await req.text();
        const receivedSignature = req.headers.get('x-razorpay-signature') || '';

        if (!receivedSignature) {
            console.warn("❌ Missing x-razorpay-signature header");
            return Response.json({ error: 'Missing signature' }, { status: 403 });
        }

        const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== receivedSignature) {
            console.warn("❌ Webhook signature mismatch");
            return Response.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log("✅ Webhook signature verified");

        const payload = JSON.parse(rawBody);
        const event = payload.event || '';
        const paymentEntity = payload.payload?.payment?.entity;

        console.log(`📋 Event: ${event}`);

        if (!paymentEntity) {
            console.log("ℹ️ No payment entity in payload, ignoring");
            return Response.json({ status: 'ignored' });
        }

        const bookingId =
            paymentEntity.notes?.booking_id ||
            paymentEntity.description ||
            '';

        if (!bookingId) {
            console.warn("⚠️ No booking_id found in payment notes");
            return Response.json({ status: 'ignored', reason: 'no_booking_id' });
        }

        const allBookings = await base44.asServiceRole.entities.Booking.list();
        const booking = allBookings.find((b: any) => b.id === bookingId);

        if (!booking) {
            console.warn(`⚠️ Booking ${bookingId} not found`);
            return Response.json({ status: 'ignored', reason: 'booking_not_found' });
        }

        if (event === 'payment.captured') {
            if (booking.booking_status === 'confirmed') {
                console.log(`ℹ️ Booking ${bookingId} already confirmed, skipping`);
                return Response.json({ status: 'already_confirmed' });
            }

            await base44.asServiceRole.entities.Booking.update(bookingId, {
                booking_status: "confirmed",
                confirmation_date: booking.confirmation_date || new Date().toISOString(),
            });
            console.log(`✅ Booking ${bookingId} confirmed via webhook`);

            if (booking.whatsapp_consent) {
                try {
                    const refreshed = await base44.asServiceRole.entities.Booking.list();
                    const updated = refreshed.find((b: any) => b.id === bookingId) || booking;
                    await base44.asServiceRole.functions.invoke('sendWhatsappBookingConfirmation', { booking: updated });
                } catch (e) {
                    console.error("⚠️ WhatsApp failed:", e);
                }
            }
        } else if (event === 'payment.failed') {
            if (booking.booking_status === 'confirmed') {
                console.log(`ℹ️ Booking ${bookingId} already confirmed, ignoring failure`);
                return Response.json({ status: 'ignored', reason: 'already_confirmed' });
            }

            await base44.asServiceRole.entities.Booking.update(bookingId, {
                booking_status: "failed",
            });
            console.log(`✅ Booking ${bookingId} marked as failed via webhook`);
        } else {
            console.log(`ℹ️ Unhandled event: ${event}`);
        }

        return Response.json({ status: 'success' });

    } catch (error) {
        console.error("❌ razorpayWebhook error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
