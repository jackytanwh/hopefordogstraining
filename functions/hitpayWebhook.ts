import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
    console.log("🚀 hitpayWebhook function triggered");
    
    try {
        const base44 = createClientFromRequest(req);

        const HITPAY_SALT = Deno.env.get("HITPAY_SALT");
        if (!HITPAY_SALT) {
            console.error("❌ HITPAY_SALT not configured");
            return Response.json({ error: 'HitPay Salt not configured' }, { status: 500 });
        }

        // Parse form data (HitPay sends as application/x-www-form-urlencoded)
        const formData = await req.formData();
        const payload = {};
        for (const [key, value] of formData.entries()) {
            payload[key] = value;
        }

        console.log("📥 Webhook payload received:", JSON.stringify(payload, null, 2));

        // Extract signature from payload
        const receivedSignature = payload.hmac;
        delete payload.hmac; // Remove hmac from payload before verification

        // Sort keys and create string for signature verification
        const sortedKeys = Object.keys(payload).sort();
        const signatureString = sortedKeys.map(key => `${key}${payload[key]}`).join('');

        // Generate HMAC signature
        const hmac = createHmac('sha256', HITPAY_SALT);
        hmac.update(signatureString);
        const expectedSignature = hmac.digest('hex');

        console.log("🔐 Signature verification:");
        console.log("   Received:", receivedSignature);
        console.log("   Expected:", expectedSignature);

        if (receivedSignature !== expectedSignature) {
            console.warn("❌ Webhook signature mismatch. Request rejected.");
            return Response.json({ error: 'Invalid signature' }, { status: 403 });
        }

        console.log("✅ Signature verified successfully");

        const { reference_number, status, payment_id } = payload;

        console.log(`📋 Payment details: Reference=${reference_number}, Status=${status}, PaymentID=${payment_id}`);

        // Handle successful payment
        if (status === 'completed') {
            const bookingId = reference_number;
            
            console.log(`💳 Payment completed for booking ${bookingId}`);

            // Update Booking status using service role
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                booking_status: "confirmed",
                confirmation_date: new Date().toISOString()
            });
            console.log(`✅ Booking ${bookingId} status updated to 'confirmed'`);
            
        } else {
            console.log(`ℹ️ Payment status '${status}' - no action taken`);
        }

        return Response.json({ status: 'success' });

    } catch (error) {
        console.error("Error in hitpayWebhook:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});