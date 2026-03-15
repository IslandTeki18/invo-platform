# 001 - Canonical Product Domains

**Date:** 2026-03-15
**Status:** Confirmed

---

## Decision Summary

The invo-platform uses a fixed subdomain strategy. Each product surface has a canonical domain. Org-specific subdomains are deferred to V2. Token-based access controls invoice security at the URL level without requiring wildcard DNS or per-org TLS provisioning.

---

## Surfaces and URLs

| Surface | URL | Rationale |
|---|---|---|
| Marketing site | `invo.app` | Apex domain. Maximizes brand exposure. Standard for public marketing sites. |
| Admin panel | `admin.invo.app` | Fixed subdomain. Simplifies auth cookie scoping. Clearly separated from public surface. |
| Invoice viewer | `invo.app/invoice/{invoiceId}?token={accessToken}` | Route within the marketing app. No separate subdomain or deployment required. Token in query string provides access control regardless of org identity. |

---

## Deferred to V2

**Org subdomain routing** (e.g., `{org}.invo.app`) is not implemented in V1.

Reasons deferred:
- Requires wildcard DNS (`*.invo.app`) and wildcard TLS provisioning.
- Adds complexity to routing, middleware, and tenant resolution.
- Adds complexity to invoice viewer auth (org must be resolved before token validation).
- The access token on `invo.app/invoice/...` already provides sufficient security without org-scoped URLs.
- No V1 user story requires branded invoice URLs.

V2 can introduce org subdomains for branding purposes once the core product is stable.

---

## Implications for Other Systems

### DNS

- `invo.app` — A/AAAA record pointing to the marketing site host (also serves the invoice viewer route).
- `admin.invo.app` — A/AAAA or CNAME pointing to the admin app host.
- No wildcard DNS record required in V1.

### Deployment

- Two distinct deployment targets: marketing (includes invoice viewer), admin.
- Each subdomain maps 1:1 to an app. No shared-host subdomain routing logic needed in V1.
- TLS certificates are per-subdomain (two certs or a single SAN cert). No wildcard cert required.

### Auth

- Auth cookies can be scoped to `admin.invo.app` only, isolating session state from the public marketing site and invoice viewer.
- The invoice viewer (`invo.app/invoice/...`) is unauthenticated at the session level. Access is granted via a signed or opaque `token` query parameter validated server-side.
- No cross-subdomain session sharing is needed in V1.

### Stripe Connect Redirects

- OAuth redirect URIs registered with Stripe must use the `admin.invo.app` domain (e.g., `https://admin.invo.app/connect/callback`).
- Return URLs for Stripe-hosted flows (e.g., onboarding) must also point to `admin.invo.app`.
- No invoice viewer URLs are involved in Stripe flows.

### Resend Sender Domain

- Transactional email (invoice delivery, notifications) should use a sender address on `invo.app` or a subdomain (e.g., `mail.invo.app` or `noreply@invo.app`).
- Resend domain verification must be completed for the chosen sender domain.
- Invoice emails will link to `invo.app/invoice/{invoiceId}?token={accessToken}`.

### Invoice Viewer Architecture

- The viewer is a route within the marketing app at `invo.app/invoice/{invoiceId}`.
- Route structure: `/invoice/{invoiceId}` with `?token={accessToken}` query parameter.
- The server (or edge function) validates the token against the invoiceId before rendering.
- No org context is resolved at the routing layer in V1.
