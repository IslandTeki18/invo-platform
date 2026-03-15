# 003 — Deployment Targets

**Date:** 2026-03-15
**Status:** Confirmed

---

## Decision

Each application in the monorepo has a distinct deployment target suited to its runtime requirements.

| App / Service | Platform |
|---|---|
| apps/marketing | Vercel |
| apps/admin | Vercel |
| apps/mobile | EAS Build + App Store / Google Play |
| Backend | Convex Cloud |

---

## Deployment Targets

### Web Apps: Vercel

**Applies to:** `apps/admin`, `apps/marketing`

**Rationale:**

- Native Turborepo support (Vercel and Turborepo are the same company); monorepo detection is automatic.
- Supports subdomain routing: `invo.app` (marketing + invoice viewer), `admin.invo.app` (admin).
- Each app is deployed as a separate Vercel project within the monorepo, using the root directory override to point at the relevant app.
- Preview deploys are generated automatically per pull request.

**Plan:** Vercel Pro ($20/mo) is likely required for team access, custom domains on multiple projects, and higher build concurrency.

**Config files:** None required at this time. Vercel auto-detects Vite apps in monorepos. A `vercel.json` will be added per-app only when custom rewrites or redirects are needed (e.g., SPA fallback for the invoice viewer route at `/invoice/:invoiceId`).

---

### Mobile App: EAS Build + App Store / Google Play

**Applies to:** `apps/mobile`

**Rationale:**

- Standard Expo deployment path for React Native apps using Expo SDK.
- EAS Build handles CI/CD for both iOS (TestFlight / App Store) and Android (Play Store).
- EAS Update enables over-the-air (OTA) updates for JS-only changes without a full store submission.

**Config files:** `eas.json` will be added to `apps/mobile` when mobile deployment is set up. Not needed at this stage.

---

### Backend: Convex Cloud

**Rationale:**

- Convex Cloud is the only production-supported hosting target for Convex.
- Handles serverless functions, the database, file storage, and scheduled jobs within a single platform.
- Deployments are managed via the Convex CLI (`npx convex deploy`) and can be integrated into the Vercel build pipeline.

---

## Alternatives Considered

| Platform | Reason Not Selected |
|---|---|
| Cloudflare Pages | No native Turborepo integration; edge runtime has compatibility limitations with some Node APIs. |
| Netlify | Comparable to Vercel for static/Vite apps but lacks the same Turborepo-first DX; Vercel preferred given toolchain alignment. |

---

## Cost Considerations

- **Vercel Pro:** ~$20/month. Required for multiple projects under one team, custom domains, and preview deploy controls.
- **EAS:** Free tier covers low build volumes. Paid plan needed for concurrent builds or faster queues as team scales.
- **Convex Cloud:** Free tier available. Paid plan scales with storage and function invocations.

---

## Constraints

- **Vercel serverless function size limit (50MB):** Relevant if PDF generation is handled in a Vercel serverless function. PDF libraries (e.g., Puppeteer, pdf-lib) can approach or exceed this limit. If PDF generation is required, it should be offloaded to Convex actions or a dedicated serverless environment rather than a Vercel API route.

---

## Preview Deploy Strategy

- Vercel generates a unique preview URL per pull request for both `apps/admin` and `apps/marketing`.
- Preview deploys connect to a Convex preview/staging deployment (configured via environment variables per Vercel environment).
- Mobile previews use Expo Go or development builds distributed via EAS; no equivalent of Vercel preview URLs for native apps.

---

## Context

- **Domain decisions:** `invo.app` (marketing + invoice viewer), `admin.invo.app` (admin) — see `001-domains.md`.
- **Environment decisions:** local, preview (Vercel preview deploys), production — see `002-environments.md`.
