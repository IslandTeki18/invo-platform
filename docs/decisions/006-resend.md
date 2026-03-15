# 006 - Resend Domain and Sending Identity

**Date:** 2026-03-15
**Status:** Confirmed

---

## Sending Domain

**Domain:** `mail.invo.app`

This is a subdomain of the apex domain `invo.app`. Using a dedicated subdomain for sending protects the apex domain's reputation and follows standard email deliverability best practices.

### Required DNS Records

Resend provides the exact record values during domain verification in the dashboard. The following record types must be configured:

| Record Type | Purpose |
|-------------|---------|
| MX | Inbound routing (required by some providers for SPF alignment) |
| SPF (TXT) | Authorizes Resend's servers to send on behalf of `mail.invo.app` |
| DKIM (CNAME) | Cryptographic signing of outbound messages |

---

## Sender Identities

| Use Case | From Address | Notes |
|----------|-------------|-------|
| Invoice emails | `invoices@invo.app` | Sent when an invoice is delivered to a client |
| System emails | `noreply@invo.app` | Password resets, notifications, platform alerts |

Both addresses use `mail.invo.app` as the sending domain at the SMTP/DNS level.

---

## Reply-To Strategy

The `Reply-To` header on all outbound emails is set to the org owner's email address, not the From address.

**Rationale:** Clients who reply to an invoice or notification should reach the business that issued it, not the platform. This preserves the expected communication flow and avoids confusion.

- Invoice emails: `Reply-To: <org_owner_email>`
- System emails: `Reply-To` omitted (replies to `noreply@invo.app` are not expected or monitored)

---

## V1 Email Types

| Email | Trigger | From |
|-------|---------|------|
| Invoice send notification | Org owner sends invoice to client | `invoices@invo.app` |
| Payment receipt | Payment recorded against an invoice | `invoices@invo.app` |
| Due date reminder (3 days before) | Scheduled job, 3 days before due date | `invoices@invo.app` |
| Due date reminder (on due date) | Scheduled job, on due date | `invoices@invo.app` |

### Rate Limit

- **50 emails per hour per organization**
- Enforced at the application layer before invoking the Resend API.

---

## Implications

### DNS Setup

DNS records for `mail.invo.app` must be added to the registrar/DNS provider for `invo.app` before any email can be sent in production. Resend's dashboard provides the exact TXT/CNAME/MX values after domain registration.

### Resend Dashboard Configuration

- Register `mail.invo.app` as a verified sending domain.
- Verify domain by confirming all DNS records are propagated.
- Create sender identities for `invoices@invo.app` and `noreply@invo.app` under the verified domain.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | API key for authenticating requests to the Resend API |

This key must be present in the server-side environment of any service that sends email. It must not be exposed to the client.
