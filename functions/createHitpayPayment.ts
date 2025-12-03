import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log("🚀 createHitpayPayment function triggered");
    
    try {
        const base44 = createClientFromRequest(req);

        const { bookingId, amount, clientName, clientEmail, clientMobile } = await req.json();

        console.log("📋 Payment request details:", { bookingId, amount, clientName, clientEmail });

        if (!bookingId || !amount || !clientName || !clientEmail) {
            console.log("❌ Missing required booking details");
            return Response.json({ error: 'Missing required booking details' }, { status: 400 });
        }

        const HITPAY_API_KEY = Deno.env.get("HITPAY_API_KEY");
        const APP_DOMAIN = Deno.env.get("APP_DOMAIN");

        console.log("🔑 Credentials check - API Key:", HITPAY_API_KEY ? "SET" : "MISSING");
        console.log("🔑 Credentials check - App Domain:", APP_DOMAIN ? APP_DOMAIN : "MISSING");

        if (!HITPAY_API_KEY || !APP_DOMAIN) {
            console.log("❌ HitPay API key or App Domain not configured");
            return Response.json({ error: 'HitPay API key or App Domain not configured' }, { status: 500 });
        }

        const paymentRequestBody = {
            amount: parseFloat(amount).toFixed(2),
            currency: "SGD",
            name: clientName,
            email: clientEmail,
            phone: clientMobile || "",
            reference_number: bookingId,
            redirect_url: `${APP_DOMAIN}/PaymentSuccess?booking_id=${bookingId}`,
            webhook: `${APP_DOMAIN}/_base44_functions/hitpayWebhook`,
        };

        console.log("📤 HitPay request payload:", JSON.stringify(paymentRequestBody, null, 2));

        const response = await fetch("https://api.hit-pay.com/v1/payment-requests", {
            method: "POST",
            headers: {
                "X-BUSINESS-API-KEY": HITPAY_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(paymentRequestBody).toString(),
        });

        const data = await response.json();
        console.log("📥 HitPay API Response Status:", response.status);
        console.log("📥 HitPay API Response Body:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error("❌ HitPay API Error:", data);
            return Response.json({ error: 'Failed to create HitPay payment', details: data }, { status: response.status });
        }

        console.log("✅ HitPay payment request created successfully!");
        return Response.json({ 
            payment_url: data.url,
            payment_id: data.id 
        });

    } catch (error) {
        console.error("Error in createHitpayPayment:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});