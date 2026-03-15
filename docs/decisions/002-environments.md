# 002 — Environment Strategy

**Date:** 2026-03-15
**Status:** Confirmed

---

## Context

The platform runs three applications (admin, marketing, mobile) with distinct environment variable requirements. We need a consistent, explicit strategy for how secrets and configuration values flow from local development through production.

---

## Decision

### Three-Tier Environment Model

| Tier | Name | Source | Git-tracked |
|---|---|---|---|
| 1 | `local` | `.env.local` per-app (gitignored) | No |
| 2 | `preview` | Platform env vars (Vercel) | No |
| 3 | `production` | Platform env vars (Vercel) | No |

`.env.example` files at the root and per-app are tracked in git and serve as the canonical reference for required variables.

### Variable Scoping

Variables are split by consumer:

- **Root `.env.example`** — backend/shared: Convex deployment, Clerk secret, Stripe secret/webhook, Resend, app URLs. These are server-side or not tied to a single app.
- **`apps/admin/.env.example`** — client-exposed variables for the admin Vite app (`VITE_` prefix).
- **`apps/marketing/.env.example`** — client-exposed variables for the marketing Vite app (`VITE_` prefix).
- **`apps/mobile/.env.example`** — client-exposed variables for the Expo app (`EXPO_PUBLIC_` prefix).

### Prefix Rules

| App | Client-exposed prefix | Reason |
|---|---|---|
| admin (Vite) | `VITE_` | Vite strips non-prefixed vars from client bundle |
| marketing (Vite) | `VITE_` | Same as above |
| mobile (Expo) | `EXPO_PUBLIC_` | Expo strips non-prefixed vars from client bundle |

### Local Development Pattern

1. Copy the relevant `.env.example` file to `.env.local` in the app directory (or root for shared vars).
2. Fill in actual values.
3. `.env.local` is gitignored — never commit real secrets.

```
# Example for admin app
cp apps/admin/.env.example apps/admin/.env.local
# Edit apps/admin/.env.local with real values
```

### Vercel Deployment

- Preview and production environments are configured directly in the Vercel project dashboard.
- Per-app env var scoping is handled via Vercel's environment variable UI (assign vars to specific apps in the monorepo).
- No `.env` files are deployed to Vercel.

---

## Variable Reference

### Convex

- `CONVEX_DEPLOYMENT` — Identifies the Convex project/deployment (backend).
- `VITE_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_URL` — Client-side Convex HTTP URL.

### Clerk

- `CLERK_PUBLISHABLE_KEY` — Public key (safe to expose); used server-side or as reference.
- `CLERK_SECRET_KEY` — Secret key; never expose to client.
- `VITE_CLERK_PUBLISHABLE_KEY` / `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Client-exposed publishable key.

### Stripe

- `STRIPE_SECRET_KEY` — Secret key; never expose to client.
- `STRIPE_PUBLISHABLE_KEY` — Public key; safe to expose but used server-side here.
- `STRIPE_WEBHOOK_SECRET` — Used to verify webhook signatures from Stripe.
- `STRIPE_CONNECT_CLIENT_ID` — OAuth client ID for Stripe Connect flows.

### Resend

- `RESEND_API_KEY` — API key for transactional email; backend only.

### App URLs

- `APP_URL` — Base URL for the main app (e.g., `https://invo.app`).
- `ADMIN_URL` — Base URL for the admin dashboard (e.g., `https://admin.invo.app`).
- `INVOICE_VIEWER_URL` — Base URL for the invoice viewer (e.g., `https://view.invo.app`).

---

## Consequences

- All required variables are documented in `.env.example` files — onboarding requires only copying and filling these files.
- No secrets leak to git; no real values exist in tracked files.
- Vite and Expo prefix requirements are enforced at the file level, not at runtime.
- Adding a new variable requires updating the relevant `.env.example` and the Vercel dashboard — no other configuration files need changing.
