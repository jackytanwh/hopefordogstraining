HitPay Endpoints For This Gig
1. Create Payment Request
POST https://api.sandbox.hit-pay.com/v1/payment-requests
Headers:
X-BUSINESS-API-KEY: your_api_key
Content-Type: application/x-www-form-urlencoded
X-Requested-With: XMLHttpRequest
Key body params: amount, currency, email, name, reference_number, redirect_url
Response gives you back a url — redirect the user there to pay.

2. Webhook (Inbound — HitPay calls YOU)
You don't call this. HitPay POSTs to whatever URL you register in their dashboard.
Register it at: Dashboard → Developers → Webhook Endpoints → New Webhook
Subscribe to: payment_request.completed
Validate every webhook like this (Node.js):
jsconst crypto = require('crypto');

function validateWebhook(rawBody, signature, salt) {
  const computed = crypto.createHmac('sha256', salt).update(rawBody).digest('hex');
  return computed === signature;
}

// In your handler:
const sig = req.headers['hitpay-signature'];
if (!validateWebhook(rawBody, sig, process.env.HITPAY_SALT)) {
  return res.status(401).send('Invalid signature');
}
```

---

### 3. When Go Live
Just swap the base URL:
```
https://api.hit-pay.com/v1/payment-requests