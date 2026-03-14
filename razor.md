# Payment Gateway Change — HitPay → Razorpay

We are switching from HitPay to Razorpay. Remove any existing HitPay code and implement Razorpay instead.

---

## Endpoints

**Base URL:** `https://api.razorpay.com/v1`

**Create Order:**
```
POST https://api.razorpay.com/v1/orders
```

**Get Payment Details:**
```
GET https://api.razorpay.com/v1/payments/:payment_id
```

**Webhook (inbound — Razorpay calls us):**
Register our URL in Razorpay Dashboard → Settings → Webhooks
Verify using `x-razorpay-signature` header with HMAC-SHA256 of raw body using webhook secret.

---

## Auth
Basic Auth: `key_id:key_secret` base64 encoded in Authorization header.

## Events to handle
- `payment.captured` → booking confirmed
- `payment.failed` → booking failed