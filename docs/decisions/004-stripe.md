# 004 - Stripe Account Structure

**Date:** 2026-03-15
**Status:** Confirmed

---

## Overview

This document records the confirmed decisions for how Stripe is integrated into the invo-platform. The platform has two distinct payment concerns: app subscriptions (billing) and invoice payments (checkout + payouts to connected accounts).

---

## 4a. Stripe Billing (App Subscriptions)

**Decision:** Three-tier subscription model managed via Stripe Customer Portal.

| Tier | Price |
|------|-------|
| Base | $19/mo |
| Plus | $49/mo |
| Pro  | $99/mo |

**Rationale:**
- Customer Portal offloads subscription management UI (plan changes, cancellations, payment method updates) to Stripe, reducing scope.
- Products and Prices are created and managed in the Stripe Dashboard, not programmatically, to keep configuration explicit and auditable.

**Considered:**
- Fully custom subscription management UI — rejected; increases scope with no user benefit in V1.

**Implementation notes:**
- Webhook events required: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CUSTOMER_PORTAL_URL`

---

## 4b. Stripe Checkout (Invoice Payments)

**Decision:** Use Stripe Checkout Sessions in `payment` mode for one-time invoice payments.

**Rationale:**
- Each invoice payment is a discrete one-time transaction — `payment` mode is the correct fit over `subscription` mode.
- Stripe Checkout provides a hosted, PCI-compliant payment UI without custom form development.
- Native support for card, Apple Pay, and Google Pay with no additional integration work.

**Considered:**
- Stripe Elements with a custom payment form — rejected; increases scope and PCI surface area.

**Implementation notes:**
- A new Checkout Session is created per invoice payment attempt.
- Session must include `transfer_data[destination]` pointing to the connected account (see 4d, 4e).
- Webhook events required: `checkout.session.completed`, `checkout.session.expired`
- Payment methods to enable: `card` (includes Apple Pay, Google Pay via browser)

---

## 4c. Stripe Tax

**Decision:** Manual tax rate entry per invoice (Option B). Stripe Tax automatic calculation deferred to V2.

**Rationale:**
- Stripe Tax charges per-transaction; at early stage volumes, cost-to-benefit is unfavorable.
- Manual tax entry keeps the user in control and avoids Stripe Tax configuration complexity (nexus, product tax codes, address validation).
- Users in V1 are expected to know their applicable tax rates.

**Considered:**
- **Option A: Stripe Tax automatic calculation** — per-transaction cost, requires nexus configuration and address validation; deferred to V2.
- **Option B: Manual tax rate/amount entry** — selected; zero per-transaction overhead, simpler implementation.

**V2 consideration:** Revisit Stripe Tax when transaction volume and geographic distribution make automatic calculation worthwhile.

**Implementation notes:**
- Invoice model stores `tax_rate` (percentage) and `tax_amount` (computed or overridden).
- No Stripe Tax API calls in V1.

---

## 4d. Stripe Connect (Payout Flow)

**Decision:** Express Connect.

**Rationale:**
- Stripe-hosted onboarding reduces platform responsibility for KYC/identity verification UI.
- Express accounts give the platform sufficient control over payout timing without requiring full Custom account management.
- Faster time to production compared to Custom Connect.

**Considered:**
- **Standard Connect** — user manages their own Stripe account independently; insufficient platform visibility.
- **Custom Connect** — full platform control but requires building all onboarding UI and accepting more compliance responsibility; rejected for V1.
- **Express Connect** — selected; balance of hosted onboarding and platform control.

**Implementation notes:**
- Onboarding flow: platform creates an Express account, generates an account link, redirects user to Stripe-hosted onboarding, handles return/refresh URLs.
- Webhook events required: `account.updated` (to track onboarding completion and capabilities)
- Env vars: `STRIPE_CONNECT_CLIENT_ID` (for Connect), `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`
- Connect events arrive on a separate Stripe endpoint ("Listen to events on Connected accounts") pointed at `POST /stripe/connect-webhook`, verified with `STRIPE_CONNECT_WEBHOOK_SECRET`.
- Account link return/refresh URL: `{APP_URL}/connect/return` (marketing app), which redirects to `mobile://more/setup`. The mobile app calls `refreshConnectStatus` when the browser session closes, so local development works without Connect webhooks.

---

## 4e. Charge Type

**Decision:** Destination charges using `transfer_data[destination]`.

**Rationale:**
- Payment is collected by the platform and automatically split to the connected account via `transfer_data`.
- Simpler than the separate charges + transfers pattern, which requires managing transfer timing and reconciliation manually.
- Funds flow: payer -> platform Stripe account -> connected account (auto-transfer at settlement).

**Considered:**
- **Separate charges + transfers** — more control over timing but requires explicit transfer creation and increases reconciliation complexity; rejected for V1.
- **Direct charges** — payment processed directly on connected account; platform loses visibility and fee collection ability; rejected.

**Implementation notes:**
- Checkout Session creation must include:
  ```
  transfer_data: {
    destination: connected_account_id,
  }
  ```
- The charge appears on the platform account; the connected account receives the net amount.

---

## 4f. Platform Fee

**Decision:** No platform fee on invoice payments in V1.

**Rationale:**
- Revenue model in V1 is subscription-only. Adding a per-transaction fee introduces complexity (fee calculation, disclosure, connected account net amount changes) with no V1 revenue justification.
- The `application_fee_amount` field on the Checkout Session can be added in V2 without architectural changes.

**Considered:**
- Percentage-based platform fee on each invoice payment — deferred to V2.
- Fixed per-transaction fee — deferred to V2.

**V2 consideration:** Add `application_fee_amount` to Checkout Session creation when platform fee monetization is introduced. No structural changes required.

---

## Webhook Event Summary

| Event | Concern |
|-------|---------|
| `customer.subscription.created` | Billing — provision access |
| `customer.subscription.updated` | Billing — update tier |
| `customer.subscription.deleted` | Billing — revoke access |
| `invoice.payment_succeeded` | Billing — confirm payment |
| `invoice.payment_failed` | Billing — notify user |
| `checkout.session.completed` | Invoice payment — mark paid |
| `checkout.session.expired` | Invoice payment — handle expiry |
| `account.updated` | Connect — onboarding status |

---

## Environment Variables Required

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CUSTOMER_PORTAL_URL
STRIPE_CONNECT_CLIENT_ID
STRIPE_CONNECT_WEBHOOK_SECRET
```

---

## V2 Considerations

- **Stripe Tax** — automatic tax calculation per transaction, triggered by volume/geographic expansion.
- **Platform fees** — `application_fee_amount` on invoice Checkout Sessions once fee monetization is approved.
