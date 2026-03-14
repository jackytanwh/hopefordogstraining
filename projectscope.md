# Hope For Dogs Training — Project Brief

## Stack
- Frontend: React + Vite + Tailwind
- Backend: `/functions` folder — Base44 serverless functions (Base44 handles hosting, no Firebase or Netlify involved)
- Payment Gateway: HitPay
- Email Service: Resend

---

## The Problem
A previous developer attempted to integrate HitPay payments into this booking app but left it broken. The full payment lifecycle was never completed. Specifically:

- Payment API was partially connected but the full flow doesn't work
- No proper HitPay webhook listener was implemented
- No signature verification on incoming webhook events
- Booking status is never updated after payment completes
- No automated email notifications after payment success/failure

---

## Booking Flow (as client described)
1. User selects date and time
2. User inputs personal details
3. User inputs dog details
4. User selects products to purchase
5. User reviews booking and proceeds to payment
6. After payment → show thank you page + send email with booking details

---

## What Needs To Be Built

### 1. HitPay Payment Integration
- Create a payment request to HitPay when user proceeds to checkout
- Handle the redirect/checkout flow back to the app
- Verify HitPay HMAC signature on all incoming events (use the Salt key)
- Credentials:
  - API Key: `9e349acf79f8af2e448dac5e35fc32c7ab013daf97d356c6dcad4768dd676ad2`
  - Salt: `MJb3Pe6bnV1748FEpx6f8xQHssORF6F0w1VpPtCCziGLAZsTJUNRSqaXmOrqNVGf`
  - Environment: **Sandbox** (test mode for now)

### 2. Webhook Handler
- Build a webhook endpoint inside `/functions`
- Listen for HitPay payment events: `payment.completed`, `payment.failed`, `payment.cancelled`
- Verify the HMAC signature using the Salt before processing anything
- Update the booking record status based on the event received:
  - `payment.completed` → booking confirmed
  - `payment.failed` or `payment.cancelled` → booking marked failed

### 3. Email Notifications via Resend
- Trigger automated emails based on payment webhook events
- Emails needed:
  - **Booking confirmation** (payment success)
  - **Payment failed** notification
- Emails must fire from backend events, not manually
- Resend credentials: to be provided by client

---

## What To Investigate First
1. Open `/functions` — look at what Base44 functions already exist and what the previous dev attempted
2. Check `/src` for existing booking and payment related components
3. Look for any existing HitPay API calls or payment logic that the previous dev left behind
4. Identify where booking data is stored inside Base44

---

## Rules
- Never confirm a booking unless payment webhook is verified and successful
- Always verify HitPay HMAC signature before trusting any webhook payload
- Use environment variables for all API keys — never hardcode
- Test end-to-end in sandbox before touching live credentials