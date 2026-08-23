# CLAUDE.md

## Product

**invo-platform** is an invoicing SaaS. Users create organizations, manage clients, build invoices, send them via tokenized public links, and collect payments through Stripe. The mobile app is the primary product surface.

## Monorepo

Turborepo + pnpm (v10, `shamefully-hoist=true`, `auto-install-peers=true`).

```
apps/
  mobile/      — Expo 55, React Native 0.83, expo-router (file-based), NativeWind
  marketing/   — Vite 8, React 19, react-router-dom 7, Tailwind CSS 4
  admin/       — Vite 8, React 19, react-router-dom 7, Tailwind CSS 4

packages/
  types/       — Shared enums, DTOs, constants (@repo/types)
  utils/       — Shared logic: invoice math, permissions, validation, token helpers (@repo/utils)
  ui/          — Shared UI components (@repo/ui)
  backend/     — Convex functions, schema, actions (@repo/backend); run `convex dev` here
```

Package aliases resolve via root `tsconfig.json` paths: `@repo/types`, `@repo/ui`, `@repo/utils` → `packages/*/src`; `@repo/backend/*` → `packages/backend/*`.

Mobile app uses `@/*` → `./src/*` and `@/assets/*` → `./assets/*`.

## Stack

| Layer | Tool |
|-------|------|
| Backend + DB | Convex |
| Auth | Clerk (`@clerk/clerk-react` web, `@clerk/clerk-expo` mobile) |
| Payments | Stripe Billing (subscriptions), Stripe Checkout (invoice payments), Stripe Connect (org payouts) |
| Email | Resend |
| PDF | Server-side HTML-to-PDF |
| Styling (web) | Tailwind CSS 4 + ShadCN |
| Styling (mobile) | NativeWind |

## Commands

```sh
pnpm dev                # all apps
pnpm dev:mobile         # mobile only
pnpm dev:admin          # admin only
pnpm dev:marketing      # marketing only
pnpm build              # build all
pnpm lint               # ESLint all
pnpm typecheck          # tsc all
pnpm format             # Prettier write
pnpm format:check       # Prettier check
```

## Architecture Decisions

All recorded in `docs/decisions/`. Read the relevant decision doc before working in that area.

| Doc | Topic |
|-----|-------|
| 001-domains.md | URL structure — no org subdomains in V1, token-based access |
| 002-environments.md | Local / preview / production env strategy |
| 003-deployment.md | Deploy targets per app |
| 004-stripe.md | Billing tiers, Connect (Express, destination charges), Checkout (payment mode) |
| 005-clerk.md | Clerk instance setup |
| 006-resend.md | Email domain and identity |
| 007-file-storage.md | Convex file storage paths and conventions |
| 008-pdf-rendering.md | PDF generation approach |
| 009-owner-leaving.md | Owner leave = org deletion |
| 010-sent-invoice-edits.md | Sent invoice edit policy |

## Domain Model

### Key Entities (Convex tables)

**users** — Clerk-mapped. Stores subscriptionTier, orgCountLimit.
**organizations** — Workspace container. Immutable subdomain. Stores businessAddress, logoUrl, storageUsed.
**memberships** — User ↔ Org with role (OWNER | ADMIN | MEMBER).
**invitations** — Email invite, 24hr expiry, revocable.
**clients** — Org-scoped. Email required + unique per org. Archive instead of delete.
**itemPresets** — User-scoped reusable line item templates. No images in V1.
**expenses** — Org-scoped. Duplicated into invoice snapshot on attach.
**invoices** — Core entity. Contains clientSnapshot, lineItems, expenses (all snapshotted at send time), discount, tax, total, status, accessToken.
**invoiceViewEvents** — Append-only view tracking. Internal only in V1.
**files** — Org-scoped file metadata (orgId, ownerEntityType, ownerEntityId, mimeType, sizeBytes, storageId).
**attachments** — Links files to invoices. Max 2 per invoice, max 5MB each.
**logs** — Audit log. 30-day retention.
**rateLimitBuckets** — Payment attempts (10/hr, 15min lockout) and email sends (50/hr per org).
**stripeSubscriptions** — Synced from Stripe Billing webhooks.
**stripeConnectAccounts** — Per-org Stripe Connect state.
**checkoutSessions** — Stripe Checkout session records.
**paymentRecords** — Completed payments (Stripe or manual: cash/check/other).
**paymentAttempts** — Rate limit tracking for payment abuse.
**downgradeGracePeriods** — 7-day grace on tier downgrade; excess orgs go read-only then auto-delete.

### Invoice Status Machine

```
draft → sent → viewed → paid
                  ↘       ↗
draft/sent/viewed → void
```

Valid transitions only: `draft→sent`, `sent→viewed`, `sent/viewed→paid`, `draft/sent/viewed→void`.

### Subscription Tiers

| Tier | Price | Org Limit | Storage |
|------|-------|-----------|---------|
| BASE | $19 | 1 | 500MB |
| PLUS | $49 | 5 | 10GB |
| PRO | $99 | 25 | 100GB |

### Role Permissions

**Owner** — full control including billing and org deletion.
**Admin** — everything except billing and org deletion.
**Member** — create drafts and manage clients only. Cannot send invoices or invite members.

## Critical Business Rules

- **Money in cents.** All monetary values stored as integers (cents). Format to 2 decimals only in UI.
- **Round at line-item level.** `quantity × unitPrice` rounded per line, then summed.
- **Calculation order:** subtotal → discount → tax → total.
- **Snapshot at send time.** Client, line items, expenses, and totals are frozen into the invoice when sent. Edits to source entities do not mutate sent invoices.
- **One canonical invoice math engine** in `packages/utils`. Used by mobile preview, backend validation, public viewer, and PDF generation. Never duplicate this logic.
- **Onboarding gate.** Invoices cannot be sent until: org name set, business address set, Stripe connected.
- **Invoice public URL:** `{APP_URL}/invoice/{invoiceId}?token={32charHex}`. Token required for access.
- **Owner leaving deletes the org.** Requires typing org name to confirm.
- **Org must always have ≥1 owner/admin.** Block removals or role changes that violate this.

## Convex Patterns

- Auth guards are higher-order wrappers in `packages/backend/convex/lib/auth.ts`.
- Error format: `ConvexError({ code, message })` with codes `UNAUTHENTICATED`, `USER_NOT_FOUND`, `FORBIDDEN`.
- User bootstrap: client-side Convex mutation on first auth (no webhook). Race-safe with unique constraint on clerkId.
- Admin check: `publicMetadata.isAdmin` from Clerk JWT identity.
- All indexes are defined in `packages/backend/convex/schema.ts`. Check existing indexes before adding queries.
- Stripe webhooks enter through `packages/backend/convex/http.ts`; signature verification runs in Node actions.

## Current Implementation Status

**Complete:** Monorepo structure, shared packages (types/utils with full enums, constants, DTOs, validators), Convex schema (all tables + indexes), auth integration (Clerk providers in all apps), user bootstrap flow, auth guards, organization CRUD with subdomain generation and tier enforcement, membership system with full permission matrix and continuity rules, onboarding state model and readiness helpers, client CRUD with archive/duplicate-email rules, item preset CRUD, expense CRUD with snapshot duplication, invoice math engine with full test coverage, invoice domain model and status machine, draft invoice backend (CRUD mutations and queries), mobile invoice composer UI (form hook, composer shell, all sections and pickers, create/edit/list screens), invoice list screen with status grouping and pull-to-refresh, dashboard with unpaid metrics and quick actions, invoice detail view for all statuses, invoice send flow with validation, client re-snapshot, token generation, PDF generation via @react-pdf/renderer, email delivery via Resend with rate limiting, mobile send UI with confirmation modal, public invoice viewer, Stripe Checkout invoice payments with webhook reconciliation, manual payments, Stripe Connect Express onboarding (account link + status refresh + `account.updated` webhook), onboarding checklist and business info screens, and mobile client/item preset/expense CRUD screens (Clients tab, More tab).

**In progress:** Clerk dashboard config and sign-in screens, org profile screen.

**Not started:** Payment rate limiting, email reminders, file uploads/storage quotas, invitation UI, subscription billing sync, downgrade grace, admin panel, export, security hardening, tests beyond utils.

Reference `docs/TASKS.md` for the full checklist with completion status.

## File Conventions

- Convex functions: `packages/backend/convex/` directory. Mutations, queries, and actions follow Convex conventions.
- Shared logic goes in `packages/utils/src/`. Pure functions, no framework dependencies.
- Shared types go in `packages/types/src/`. Enums, DTOs, constants.
- Mobile screens: `apps/mobile/src/` with expo-router file-based routing.
- Web apps: standard Vite + React structure with react-router-dom.
- File storage paths follow `007-file-storage.md`: `orgs/{orgId}/logo.{ext}`, `orgs/{orgId}/invoices/{invoiceId}/attachments/{fileId}.{ext}`, etc.

## Working Guidelines

1. **Read the decision doc first** if your task touches domains, Stripe, Clerk, file storage, PDF, or deletion behavior.
2. **Check `packages/types/src/`** before defining new types — it likely already exists.
3. **Check `packages/utils/src/`** before writing helpers — permission checks, money math, validation, token generation, rate limit logic, and status checks are already implemented and tested.
4. **Check `packages/backend/convex/schema.ts`** before creating tables or indexes — the full schema is already defined.
5. **Never duplicate invoice math.** Import from `@repo/utils`.
6. **Recalculate totals server-side** on every invoice save. Never trust client-computed totals.
7. **Use existing auth guard wrappers** from `packages/backend/convex/lib/auth.ts` for all mutations and queries requiring auth.
8. **Test against existing test patterns** in `packages/utils/src/` when adding new shared logic.
