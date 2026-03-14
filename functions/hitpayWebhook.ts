import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Resend } from 'npm:resend';

type HitPayPayload = Record<string, string>;

const normalizePaymentStatus = (payload: HitPayPayload): 'completed' | 'failed' | 'cancelled' | 'unknown' => {
    const rawStatus = String(payload.status || '').toLowerCase();
    const rawEvent = String(payload.event || '').toLowerCase();
    const rawType = String(payload.type || '').toLowerCase();
    const signal = [rawStatus, rawEvent, rawType].filter(Boolean).join(' ');

    if (signal.includes('payment.completed') || signal.includes('completed') || signal.includes('succeeded')) {
        return 'completed';
    }
    if (signal.includes('payment.failed') || signal.includes('failed')) {
        return 'failed';
    }
    if (signal.includes('payment.cancelled') || signal.includes('payment.canceled') || signal.includes('cancelled') || signal.includes('canceled')) {
        return 'cancelled';
    }
    return 'unknown';
};

const extractClientEmail = (booking: any): string | null => {
    if (booking?.client_email) return String(booking.client_email);
    if (Array.isArray(booking?.clients)) {
        for (const client of booking.clients) {
            if (client?.client_email) return String(client.client_email);
            if (client?.clientEmail) return String(client.clientEmail);
        }
    }
    return null;
};

const extractClientName = (booking: any): string => {
    if (booking?.client_name) return String(booking.client_name);
    if (Array.isArray(booking?.clients) && booking.clients[0]) {
        return String(booking.clients[0].client_name || booking.clients[0].clientName || 'Client');
    }
    return 'Client';
};

const sendPaymentEmail = async ({
    resendApiKey,
    fromEmail,
    booking,
    paymentStatus
}: {
    resendApiKey: string;
    fromEmail: string;
    booking: any;
    paymentStatus: 'completed' | 'failed' | 'cancelled';
}) => {
    const toEmail = extractClientEmail(booking);
    if (!toEmail) {
        console.log(`ℹ️ No recipient email found for booking ${booking?.id}. Skipping email notification.`);
        return;
    }

    const clientName = extractClientName(booking);
    const serviceName = booking?.service_name || 'Training Service';
    const amount = Number(booking?.total_price || 0);
    const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : '0.00';

    const resend = new Resend(resendApiKey);
    const isSuccess = paymentStatus === 'completed';
    const subject = isSuccess
        ? `Booking Confirmed: ${serviceName}`
        : `Payment ${paymentStatus === 'cancelled' ? 'Cancelled' : 'Failed'}: ${serviceName}`;
    const html = isSuccess
        ? `
            <p>Hi ${clientName},</p>
            <p>Your payment has been received and your booking is now confirmed.</p>
            <p><strong>Service:</strong> ${serviceName}<br/>
            <strong>Booking ID:</strong> ${booking?.id}<br/>
            <strong>Amount Paid:</strong> SGD ${formattedAmount}</p>
            <p>Thank you for choosing Hope For Dogs Training.</p>
          `
        : `
            <p>Hi ${clientName},</p>
            <p>Your booking payment was not completed (${paymentStatus}).</p>
            <p><strong>Service:</strong> ${serviceName}<br/>
            <strong>Booking ID:</strong> ${booking?.id}<br/>
            <strong>Amount:</strong> SGD ${formattedAmount}</p>
            <p>Please retry your booking payment. If you need help, contact our team.</p>
          `;

    await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject,
        html
    });
};

const verifyWebhookSignature = ({
    payload,
    rawBody,
    hitpaySalt,
    headerSignature
}: {
    payload: HitPayPayload;
    rawBody: string;
    hitpaySalt: string;
    headerSignature: string;
}): { valid: boolean; mode: 'header' | 'payload_hmac' | 'none' } => {
    // Preferred mode: signature in header, HMAC over raw body.
    if (headerSignature) {
        const expectedFromRaw = createHmac('sha256', hitpaySalt).update(rawBody).digest('hex');
        const encoder = new TextEncoder();
        const receivedBuf = encoder.encode(headerSignature);
        const expectedBuf = encoder.encode(expectedFromRaw);
        if (receivedBuf.byteLength === expectedBuf.byteLength && timingSafeEqual(receivedBuf, expectedBuf)) {
            return { valid: true, mode: 'header' };
        }
    }

    // Backward-compatible mode: hmac field in payload, HMAC over sorted key/value pairs excluding hmac.
    const payloadHmac = payload.hmac || '';
    if (payloadHmac) {
        const clonedPayload: HitPayPayload = { ...payload };
        delete clonedPayload.hmac;
        const sortedKeys = Object.keys(clonedPayload).sort();
        const signatureString = sortedKeys.map(key => `${key}${clonedPayload[key]}`).join('');
        const expectedFromPayload = createHmac('sha256', hitpaySalt).update(signatureString).digest('hex');
        const encoder = new TextEncoder();
        const receivedBuf = encoder.encode(payloadHmac);
        const expectedBuf = encoder.encode(expectedFromPayload);
        if (receivedBuf.byteLength === expectedBuf.byteLength && timingSafeEqual(receivedBuf, expectedBuf)) {
            return { valid: true, mode: 'payload_hmac' };
        }
    }

    return { valid: false, mode: 'none' };
};

Deno.serve(async (req) => {
    console.log("🚀 hitpayWebhook function triggered");
    
    try {
        const base44 = createClientFromRequest(req);

        const HITPAY_SALT = Deno.env.get("HITPAY_SALT");
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
        if (!HITPAY_SALT) {
            console.error("❌ HITPAY_SALT not configured");
            return Response.json({ error: 'HitPay Salt not configured' }, { status: 500 });
        }

        // Parse raw body first for signature validation compatibility.
        const rawBody = await req.text();
        const formData = new URLSearchParams(rawBody);
        const payload: HitPayPayload = {};
        for (const [key, value] of formData) {
            payload[key] = String(value);
        }

        console.log("📥 Webhook payload received:", JSON.stringify(payload, null, 2));

        const headerSignature =
            req.headers.get('hitpay-signature') ||
            req.headers.get('x-hitpay-signature') ||
            '';

        console.log("🔐 Signature verification:");
        console.log("   Header Signature Present:", Boolean(headerSignature));
        console.log("   Payload HMAC Present:", Boolean(payload.hmac));

        const signatureResult = verifyWebhookSignature({
            payload,
            rawBody,
            hitpaySalt: HITPAY_SALT,
            headerSignature
        });

        if (!signatureResult.valid) {
            console.warn("❌ Webhook signature mismatch. Request rejected.");
            return Response.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log(`✅ Signature verified successfully using ${signatureResult.mode}`);

        const referenceNumber = payload.reference_number || '';
        const paymentId = payload.payment_id || '';
        const normalizedStatus = normalizePaymentStatus(payload);

        console.log(`📋 Payment details: Reference=${referenceNumber}, Status=${normalizedStatus}, PaymentID=${paymentId}`);

        if (!referenceNumber) {
            return Response.json({ error: 'Missing reference_number in webhook payload' }, { status: 400 });
        }

        const bookingId = referenceNumber;
        const allBookings = await base44.asServiceRole.entities.Booking.list();
        const currentBooking = allBookings.find((b: any) => b.id === bookingId);

        if (!currentBooking) {
            console.warn(`⚠️ Booking not found for reference_number=${bookingId}`);
            return Response.json({ status: 'ignored', reason: 'booking_not_found' });
        }

        if (normalizedStatus === 'completed') {
            console.log(`💳 Payment completed for booking ${bookingId}`);
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                booking_status: "confirmed",
                confirmation_date: currentBooking.confirmation_date || new Date().toISOString()
            });
            console.log(`✅ Booking ${bookingId} status updated to 'confirmed'`);

            if (currentBooking.whatsapp_consent) {
                console.log(`📱 Sending WhatsApp confirmation for booking ${bookingId}...`);
                try {
                    const refreshedBookings = await base44.asServiceRole.entities.Booking.list();
                    const updatedBooking = refreshedBookings.find((b: any) => b.id === bookingId) || currentBooking;
                    await base44.asServiceRole.functions.invoke('sendWhatsappBookingConfirmation', { booking: updatedBooking });
                    console.log(`✅ WhatsApp confirmation sent successfully for booking ${bookingId}`);
                } catch (whatsappError) {
                    console.error(`❌ WhatsApp notification failed for booking ${bookingId}:`, whatsappError);
                }
            } else {
                console.log(`ℹ️ WhatsApp confirmation skipped for booking ${bookingId} (no consent or booking not found)`);
            }

            if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
                try {
                    const refreshedBookings = await base44.asServiceRole.entities.Booking.list();
                    const updatedBooking = refreshedBookings.find((b: any) => b.id === bookingId) || currentBooking;
                    await sendPaymentEmail({
                        resendApiKey: RESEND_API_KEY,
                        fromEmail: RESEND_FROM_EMAIL,
                        booking: updatedBooking,
                        paymentStatus: 'completed'
                    });
                    console.log(`✅ Payment success email sent for booking ${bookingId}`);
                } catch (emailError) {
                    console.error(`❌ Failed sending success email for booking ${bookingId}:`, emailError);
                }
            } else {
                console.log("ℹ️ RESEND_API_KEY or RESEND_FROM_EMAIL missing - skipping success email");
            }
        } else if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
            console.log(`💳 Payment ${normalizedStatus} for booking ${bookingId}`);
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                booking_status: "failed"
            });
            console.log(`✅ Booking ${bookingId} status updated to 'failed'`);

            if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
                try {
                    const refreshedBookings = await base44.asServiceRole.entities.Booking.list();
                    const updatedBooking = refreshedBookings.find((b: any) => b.id === bookingId) || currentBooking;
                    await sendPaymentEmail({
                        resendApiKey: RESEND_API_KEY,
                        fromEmail: RESEND_FROM_EMAIL,
                        booking: updatedBooking,
                        paymentStatus: normalizedStatus
                    });
                    console.log(`✅ Payment failure email sent for booking ${bookingId}`);
                } catch (emailError) {
                    console.error(`❌ Failed sending failure email for booking ${bookingId}:`, emailError);
                }
            } else {
                console.log("ℹ️ RESEND_API_KEY or RESEND_FROM_EMAIL missing - skipping failure email");
            }
        } else {
            console.log(`ℹ️ Unmapped payment status received. Payload status/event ignored.`);
        }

        return Response.json({ status: 'success' });

    } catch (error) {
        console.error("Error in hitpayWebhook:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});