import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
    console.log("🚀 verifyRazorpayPayment function triggered");

    try {
        const base44 = createClientFromRequest(req);

        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            bookingId,
        } = await req.json();

        console.log("📋 Verification request:", { razorpay_payment_id, razorpay_order_id, bookingId });

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
            return Response.json({ error: 'Missing required payment verification fields' }, { status: 400 });
        }

        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
        if (!RAZORPAY_KEY_SECRET) {
            return Response.json({ error: 'Razorpay key secret not configured' }, { status: 500 });
        }

        // Verify signature: HMAC-SHA256(order_id|payment_id, key_secret)
        const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.warn("❌ Razorpay signature mismatch");
            return Response.json({ error: 'Invalid payment signature' }, { status: 403 });
        }

        console.log("✅ Razorpay signature verified");

        // Check current booking state to avoid overwriting confirmation_date
        const allBookingsCheck = await base44.asServiceRole.entities.Booking.list();
        const currentBooking = allBookingsCheck.find((b: any) => b.id === bookingId);

        if (currentBooking?.booking_status === 'confirmed') {
            console.log(`ℹ️ Booking ${bookingId} already confirmed`);
            return Response.json({ status: 'confirmed', bookingId });
        }

        await base44.asServiceRole.entities.Booking.update(bookingId, {
            booking_status: "confirmed",
            confirmation_date: new Date().toISOString(),
        });
        console.log(`✅ Booking ${bookingId} confirmed`);

        // Re-fetch the confirmed booking once for notifications
        const refreshedBookings = await base44.asServiceRole.entities.Booking.list();
        const booking = refreshedBookings.find((b: any) => b.id === bookingId);

        // Delegate to sendBookingConfirmation which handles both WhatsApp + Email
        if (booking) {
            try {
                await base44.asServiceRole.functions.invoke('sendBookingConfirmation', { booking });
                console.log(`✅ Notifications dispatched for ${bookingId}`);
            } catch (notifError) {
                console.error("⚠️ Notification dispatch failed:", notifError);
            }
        }

        return Response.json({ status: 'confirmed', bookingId });

    } catch (error) {
        console.error("❌ verifyRazorpayPayment error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
