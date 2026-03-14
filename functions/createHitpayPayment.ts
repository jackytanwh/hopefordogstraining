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
        const HITPAY_API_BASE_URL = Deno.env.get("HITPAY_API_BASE_URL") || "https://api.sandbox.hit-pay.com/v1";
        const APP_DOMAIN = Deno.env.get("APP_DOMAIN");

        console.log("🔑 Credentials check - API Key:", HITPAY_API_KEY ? "SET" : "MISSING");
        console.log("🔑 Credentials check - App Domain:", APP_DOMAIN ? APP_DOMAIN : "MISSING");
        console.log("🔑 Credentials check - API Base URL:", HITPAY_API_BASE_URL);

        if (!HITPAY_API_KEY || !APP_DOMAIN) {
            console.log("❌ HitPay API key or App Domain not configured");
            return Response.json({ error: 'HitPay API key or App Domain not configured' }, { status: 500 });
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return Response.json({ error: 'Invalid amount provided' }, { status: 400 });
        }

        const paymentRequestBody = {
            amount: parsedAmount.toFixed(2),
            currency: "SGD",
            name: clientName,
            email: clientEmail,
            phone: clientMobile || "",
            reference_number: bookingId,
            redirect_url: `${APP_DOMAIN}/PaymentSuccess?booking_id=${bookingId}`,
            webhook: `${APP_DOMAIN}/_base44_functions/hitpayWebhook`,
        };

        console.log("📤 HitPay request payload:", JSON.stringify(paymentRequestBody, null, 2));

        console.log("🌐 Making request to HitPay API...");
        const response = await fetch(`${HITPAY_API_BASE_URL}/payment-requests`, {
            method: "POST",
            headers: {
                "X-BUSINESS-API-KEY": HITPAY_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: new URLSearchParams(paymentRequestBody).toString(),
        });

        console.log("📥 HitPay API Response Status:", response.status);
        
        let data;
        try {
            data = await response.json();
            console.log("📥 HitPay API Response Body:", JSON.stringify(data, null, 2));
        } catch (parseError) {
            console.error("❌ Failed to parse HitPay response as JSON");
            const text = await response.text();
            console.error("Raw response:", text);
            return Response.json({ error: 'Invalid response from HitPay', details: text }, { status: 500 });
        }

        if (!response.ok) {
            console.error("❌ HitPay API Error - Status:", response.status);
            console.error("❌ HitPay API Error - Details:", JSON.stringify(data, null, 2));
            return Response.json({ 
                error: 'Failed to create HitPay payment', 
                details: data,
                status: response.status 
            }, { status: response.status });
        }

        if (!data.url) {
            console.error("❌ HitPay response missing 'url' field");
            console.error("Response data:", JSON.stringify(data, null, 2));
            return Response.json({ 
                error: 'Payment URL not returned by HitPay', 
                details: data 
            }, { status: 500 });
        }

        console.log("✅ HitPay payment request created successfully!");
        console.log("✅ Payment URL:", data.url);
        console.log("✅ Payment ID:", data.id);
        
        return Response.json({ 
            payment_url: data.url,
            payment_id: data.id 
        });

    } catch (error) {
        console.error("Error in createHitpayPayment:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});