import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log("🚀 createRazorpayOrder function triggered");

    try {
        const base44 = createClientFromRequest(req);
        const { bookingId, amount } = await req.json();

        console.log("📋 Order request:", { bookingId, amount });

        if (!bookingId || amount === undefined || amount === null) {
            return Response.json({ error: 'bookingId and amount are required' }, { status: 400 });
        }

        const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            console.error("❌ Razorpay credentials not configured");
            return Response.json({ error: 'Razorpay credentials not configured' }, { status: 500 });
        }

        const amountInPaise = Math.round(Number(amount) * 100);
        if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
            return Response.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const authHeader = "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

        const orderPayload = {
            amount: amountInPaise,
            currency: "SGD",
            receipt: bookingId,
            notes: {
                booking_id: bookingId,
            },
        };

        console.log("📤 Razorpay order payload:", JSON.stringify(orderPayload));

        const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderPayload),
        });

        const data = await response.json();
        console.log("📥 Razorpay response:", response.status, JSON.stringify(data));

        if (!response.ok) {
            return Response.json({
                error: 'Failed to create Razorpay order',
                details: data,
            }, { status: response.status });
        }

        return Response.json({
            order_id: data.id,
            amount: data.amount,
            currency: data.currency,
            razorpay_key_id: RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error("❌ createRazorpayOrder error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
