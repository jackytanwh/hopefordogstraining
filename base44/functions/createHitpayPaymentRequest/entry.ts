import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, amount, clientEmail, clientName } = await req.json();

    if (!bookingId || amount === undefined || amount === null) {
      return Response.json({ error: 'bookingId and amount are required' }, { status: 400 });
    }

    const HITPAY_API_KEY = secrets.get("HITPAY_API_KEY");
    const APP_DOMAIN = secrets.get("APP_DOMAIN");

    if (!HITPAY_API_KEY) {
      console.error("❌ HITPAY_API_KEY not configured");
      return Response.json({ error: 'HitPay API key not configured' }, { status: 500 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    let appDomain = (APP_DOMAIN || '').trim().replace(/\/$/, '');
    if (!appDomain) {
      return Response.json({ error: 'APP_DOMAIN not configured' }, { status: 500 });
    }
    if (!/^https?:\/\//i.test(appDomain)) {
      appDomain = `https://${appDomain}`;
    }

    const redirectUrl = `${appDomain}/PaymentSuccess?booking_id=${bookingId}`;

    const body = new URLSearchParams();
    body.append('amount', numericAmount.toFixed(2));
    body.append('currency', 'SGD');
    body.append('reference_number', bookingId);
    body.append('redirect_url', redirectUrl);
    if (clientEmail) body.append('email', clientEmail);
    if (clientName) body.append('name', clientName);

    // Live endpoint. For sandbox testing, use https://api.sandbox.hit-pay.com/v1/payment-requests
    const baseUrl = "https://api.hit-pay.com/v1/payment-requests";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "X-BUSINESS-API-KEY": HITPAY_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json",
      },
      body: body.toString(),
    });

    const data = await response.json();
    console.log("📥 HitPay response:", response.status, JSON.stringify(data));

    if (!response.ok) {
      return Response.json({
        error: 'Failed to create HitPay payment request',
        details: data,
      }, { status: response.status });
    }

    return Response.json({
      payment_request_id: data.id,
      url: data.url,
      amount: numericAmount,
      currency: 'SGD',
    });

  } catch (error) {
    console.error("❌ createHitpayPaymentRequest error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}