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

        // Send WhatsApp notification (fire and forget)
        try {
            const allBookings = await base44.asServiceRole.entities.Booking.list();
            const booking = allBookings.find((b: any) => b.id === bookingId);

            if (booking?.whatsapp_consent) {
                await base44.asServiceRole.functions.invoke('sendWhatsappBookingConfirmation', { booking });
                console.log(`✅ WhatsApp confirmation sent for ${bookingId}`);
            }
        } catch (notifError) {
            console.error("⚠️ WhatsApp notification failed:", notifError);
        }

        // Send email notification if Resend is configured
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

        if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
            try {
                const { Resend } = await import('npm:resend');
                const allBookings = await base44.asServiceRole.entities.Booking.list();
                const booking = allBookings.find((b: any) => b.id === bookingId);

                const toEmail =
                    booking?.client_email ||
                    booking?.clients?.[0]?.client_email ||
                    booking?.clients?.[0]?.clientEmail ||
                    '';

                if (toEmail) {
                    const clientName =
                        booking?.client_name ||
                        booking?.clients?.[0]?.client_name ||
                        booking?.clients?.[0]?.clientName ||
                        'Client';
                    const serviceName = booking?.service_name || 'Training Service';
                    const totalPrice = Number(booking?.total_price || 0).toFixed(2);

                    const resend = new Resend(RESEND_API_KEY);
                    await resend.emails.send({
                        from: RESEND_FROM_EMAIL,
                        to: [toEmail],
                        subject: `Booking Confirmed: ${serviceName}`,
                        html: `
                            <p>Hi ${clientName},</p>
                            <p>Your payment has been received and your booking is now confirmed.</p>
                            <p><strong>Service:</strong> ${serviceName}<br/>
                            <strong>Booking ID:</strong> ${bookingId}<br/>
                            <strong>Amount Paid:</strong> SGD ${totalPrice}</p>
                            <p>Thank you for choosing Hope For Dogs Training.</p>
                        `,
                    });
                    console.log(`✅ Confirmation email sent to ${toEmail}`);
                }
            } catch (emailError) {
                console.error("⚠️ Email notification failed:", emailError);
            }
        }

        return Response.json({ status: 'confirmed', bookingId });

    } catch (error) {
        console.error("❌ verifyRazorpayPayment error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
