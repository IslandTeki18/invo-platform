# Invoicing Platform

A thorough implementation checklist based on the blueprint. Ordered to reduce rework and keep each phase shippable.

---

## 0. Project setup and delivery rules

- [x] Confirm canonical product domains for: (see `docs/decisions/001-domains.md`)
  - [x] marketing site — `invo.app`
  - [x] admin panel — `admin.invo.app`
  - [x] public invoice viewer — `invo.app/invoice/{id}?token={token}` (route in marketing app)
  - [x] org subdomain routing — deferred to V2; token-based access sufficient
- [x] Confirm environment strategy for local, preview, production (see `docs/decisions/002-environments.md`)
- [x] Confirm deployment targets for each app (see `docs/decisions/003-deployment.md`)
- [x] Confirm Stripe account structure: (see `docs/decisions/004-stripe.md`)
  - [x] Stripe Billing for app subscriptions — 3 tiers via Customer Portal
  - [x] Stripe Checkout for invoice payments — `payment` mode sessions
  - [x] Stripe Tax usage model — manual entry, Stripe Tax deferred to V2
  - [x] Stripe Connect ownership model and payout flow — Express Connect, destination charges
- [x] Confirm Clerk instance setup for all authenticated surfaces (see `docs/decisions/005-clerk.md`)
- [x] Confirm Resend domain and sending identity (see `docs/decisions/006-resend.md`)
- [x] Confirm file storage provider/path strategy used by Convex (see `docs/decisions/007-file-storage.md`)
- [x] Confirm PDF rendering approach works in target deployment environment (see `docs/decisions/008-pdf-rendering.md`)
- [x] Confirm owner-leaving behavior should delete organization exactly as specified (see `docs/decisions/009-owner-leaving.md`)
- [x] Confirm sent-invoice edit policy before implementation begins (see `docs/decisions/010-sent-invoice-edits.md`)

---

## 1. Monorepo foundation

### 1.1 Repo structure
- [x] Initialize Turborepo at root
- [x] Create `apps/mobile`
- [x] Create `apps/marketing`
- [x] Create `apps/admin`
- [x] Create `packages/ui`
- [x] Create `packages/utils`
- [x] Create `packages/types`
- [x] Add root `package.json`
- [x] Add root Turbo config
- [x] Add root TypeScript config
- [x] Add root ESLint config
- [x] Add root Prettier config
- [x] Add `.editorconfig`
- [x] Add `.gitignore`
- [x] Add `.env.example` files

### 1.2 App shells
- [x] Boot Expo app shell for mobile app
- [x] Boot Vite React app shell for marketing site (includes invoice viewer route)
- [x] Boot Vite React app shell for admin panel
- [x] Verify each app runs independently
- [x] Verify each app can import from shared packages

### 1.3 Shared workspace tooling
- [x] Configure workspace package manager
- [x] Configure TS path aliases across apps/packages
- [x] Configure shared build pipeline for packages
- [x] Add root scripts for:
  - [x] `dev`
  - [x] `build`
  - [x] `lint`
  - [x] `format`
  - [x] `typecheck`
  - [x] `test`
- [x] Add per-app scripts where needed

### 1.4 CI
- [x] Add CI workflow for install
- [x] Add CI workflow for lint
- [x] Add CI workflow for typecheck
- [x] Add CI workflow for build
- [x] Add preview deployment wiring
- [ ] Verify CI passes on clean repo

---

## 2. Shared contracts and utilities

### 2.1 Shared enums and constants

#### Enums
- [x] Define subscription tier enum (`BASE`, `PLUS`, `PRO`)
- [x] Define subscription status enum (`ACTIVE`, `PAST_DUE`, `CANCELED`, `INCOMPLETE`)
- [x] Define organization role enum (`OWNER`, `ADMIN`, `MEMBER`)
- [x] Define invoice status enum (`DRAFT`, `SENT`, `VIEWED`, `PAID`, `VOID`)
- [x] Define invitation status enum (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`)
- [x] Define manual payment method enum (`CASH`, `CHECK`, `OTHER`)
- [x] Define log event type enum:
  - [x] Payment events: `PAYMENT_SUCCESS`, `PAYMENT_FAILURE`, `PAYMENT_LOCKOUT`
  - [x] Email events: `EMAIL_SENT`, `EMAIL_FAILED`, `EMAIL_RATE_LIMITED`
  - [x] Auth events: `USER_LOGIN`, `USER_SIGNUP`
  - [x] Invoice events: `INVOICE_CREATED`, `INVOICE_SENT`, `INVOICE_VIEWED`, `INVOICE_PAID`, `INVOICE_VOIDED`, `INVOICE_EDITED`
  - [x] Membership events: `MEMBER_ADDED`, `MEMBER_REMOVED`, `MEMBER_ROLE_CHANGED`
  - [x] Org events: `ORG_CREATED`, `ORG_DELETED`, `ORG_SETTINGS_UPDATED`
  - [x] Admin events: `ADMIN_REFUND`, `ADMIN_EXPORT`, `ADMIN_IMPERSONATION_START`, `ADMIN_IMPERSONATION_END`
- [x] Define onboarding step enum (`ACCOUNT_CREATED`, `ORG_CREATED`, `BUSINESS_INFO_SET`, `STRIPE_CONNECTED`)
- [x] Define Stripe Connect account status enum (`NOT_CONNECTED`, `PENDING`, `CONNECTED`, `CHARGES_ENABLED`)
- [x] Define downgrade grace period state enum (`ACTIVE`, `EXPIRED`, `CANCELLED`)
- [x] Define Stripe webhook event type constants (`checkout.session.completed`, `checkout.session.expired`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `account.updated`, `charge.refunded`)

#### Constants
- [x] Define file type allowlist (images: jpg/png/webp, documents: pdf)
- [x] Define `MAX_FILE_SIZE_BYTES` (5 MB = 5,242,880)
- [x] Define `MAX_ATTACHMENTS_PER_INVOICE` (2)
- [x] Define `ACCESS_TOKEN_LENGTH` (32 hex chars)
- [x] Define storage quota constants by tier (Base: 500 MB, Plus: 10 GB, Pro: 100 GB)
- [x] Define org count limit constants by tier (Base: 1, Plus: 5, Pro: 10)
- [x] Define subscription pricing constants (Base: $19, Plus: $49, Pro: $99)
- [x] Define email rate limit constants (`EMAIL_RATE_LIMIT_MAX`: 50, `EMAIL_RATE_LIMIT_WINDOW_MS`: 1 hour)
- [x] Define payment attempt rate limit constants (`PAYMENT_MAX_ATTEMPTS`: 10/hr, `PAYMENT_LOCKOUT_DURATION_MS`: 15 min)
- [x] Define `GRACE_PERIOD_DAYS` (7)
- [x] Define `INVITATION_EXPIRY_HOURS` (24)
- [x] Define `REMINDER_DAYS_BEFORE_DUE` (3)
- [x] Define `PDF_PREVIEW_CACHE_TTL_MS` (5 min)

### 2.2 Shared DTOs and types

#### Core entity types
- [x] Define user DTO (clerkId, email, subscriptionTier, orgCountLimit, createdAt)
- [x] Define organization DTO (name, subdomain, businessAddress, logoUrl, storageUsed, createdAt)
- [x] Define business address DTO (street, city, state, postalCode, country)
- [x] Define membership DTO (userId, orgId, role, joinedAt)
- [x] Define invitation DTO (orgId, inviterId, email, role, createdAt, expiresAt, status)
- [x] Define client DTO (name, email, phone, notes, archived, orgId)
- [x] Define item preset DTO (name, description, defaultPrice, taxable, userId)
- [x] Define expense DTO (description, amount, category, orgId)

#### Invoice types
- [x] Define invoice DTO (orgId, clientSnapshot, lineItems, expenses, subtotal, discount, tax, total, status, accessToken, stripeSessionId, sentAt, paidAt, voidedAt, dueDate, isEdited, createdAt, updatedAt)
- [x] Define line item DTO (name, description, quantity, unitPrice, taxable, total, imageUrl)
- [x] Define discount DTO (type: percentage | fixed, value)
- [x] Define tax data DTO (rate, amount, taxableSubtotal)
- [x] Define client snapshot DTO (name, email, phone — frozen at send time)

#### File and attachment types
- [x] Define file metadata DTO (orgId, ownerEntityType, ownerEntityId, mimeType, sizeBytes, storageId, uploadedAt)
- [x] Define attachment DTO (fileId, invoiceId, displayName)

#### Payment types
- [x] Define checkout session DTO (stripeSessionId, invoiceId, amount, status, createdAt, completedAt)
- [x] Define payment record DTO (invoiceId, method, amount, reference, paidAt, paidBy)
- [x] Define payment attempt DTO (invoiceId, ip, timestamp, success)

#### Stripe integration types
- [x] Define Stripe subscription DTO (stripeSubscriptionId, stripeCustomerId, tier, status, currentPeriodStart, currentPeriodEnd)
- [x] Define Stripe Connect account DTO (stripeAccountId, orgId, status, chargesEnabled, detailsSubmitted)

#### Operational types
- [x] Define onboarding status DTO (accountCreated, orgCreated, businessInfoSet, stripeConnected)
- [x] Define downgrade grace period DTO (userId, excessOrgIds, graceStartDate, graceEndDate, state)
- [x] Define invoice view event DTO (invoiceId, timestamp, ip, userAgent, isFirstView)
- [x] Define rate limit bucket DTO (key, count, windowStart, windowEnd)
- [x] Define log event DTO (eventType, actorId, orgId, entityType, entityId, metadata, createdAt)
- [x] Define export payload DTO (orgId, clients, invoices, expenses, memberships, settings, exportedAt)

#### Email template data types
- [x] Define invoice send email data DTO (invoiceUrl, clientName, orgName, amount, dueDate)
- [x] Define payment receipt email data DTO (clientName, orgName, amount, paidAt, invoiceUrl)
- [x] Define reminder email data DTO (clientName, orgName, amount, dueDate, invoiceUrl, reminderType)

### 2.3 Validation schemas
- [x] Create user validation schema
- [x] Create organization creation validation schema
- [x] Create organization settings update validation schema (name, address, logo)
- [x] Create business address validation schema (required/optional fields, format constraints)
- [x] Create client validation schema (email required, unique within org)
- [x] Create item preset validation schema
- [x] Create expense validation schema
- [x] Create line item validation schema (quantity > 0, price >= 0, taxable flag)
- [x] Create invoice draft validation schema (client, line items, discount bounds)
- [x] Create invoice send validation schema (totals valid, client email exists, onboarding complete)
- [x] Create invoice status transition validation (enforce valid state machine: draft->sent, sent->viewed, sent/viewed->paid, draft/sent/viewed->void)
- [x] Create invitation validation schema (valid email, valid role, not already member)
- [x] Create file upload validation schema (MIME type in allowlist, size <= MAX_FILE_SIZE_BYTES)
- [x] Create attachment validation schema (max MAX_ATTACHMENTS_PER_INVOICE per invoice)
- [x] Create manual payment validation schema (valid method enum, optional reference/notes)
- [x] Create invoice access token format validation (32 hex chars)
- [x] Create organization deletion confirmation validation (exact name match)

### 2.4 Shared utility modules

#### Money and math
- [x] Create money conversion helpers (cents to dollars, dollars to cents)
- [x] Create money formatting helpers (display with 2 decimals, currency symbol)
- [x] Create decimal quantity parsing helpers (string to number, precision handling)
- [x] Create line-item rounding function (consistent rounding strategy at line-item level)
- [x] Create invoice calculation engine:
  - [x] Calculate line item totals (quantity * unitPrice, round per line)
  - [x] Sum line totals into subtotal
  - [x] Apply discount (percentage or fixed) to subtotal
  - [x] Filter taxable items and calculate tax after discount
  - [x] Calculate final total

#### Auth and permissions
- [x] Create permission check helpers:
  - [x] `canSendInvoice(role)` — Owner, Admin only
  - [x] `canManageMembers(role)` — Owner, Admin only
  - [x] `canManageBilling(role)` — Owner only
  - [x] `canDeleteOrganization(role)` — Owner only
  - [x] `canEditDraft(role)` — all roles
  - [x] `canAccessAdminPanel(user)` — internal admin only (Clerk publicMetadata.isAdmin)
- [x] Create token generation helper (32-char hex, cryptographically random)

#### URL and path builders
- [x] Create invoice URL builder (`APP_URL/invoice/{id}?token={token}`)
- [x] Create file storage path builder (follows 007-file-storage.md conventions):
  - [x] `orgs/{orgId}/logo.{ext}`
  - [x] `orgs/{orgId}/invoices/{invoiceId}/attachments/{fileId}.{ext}`
  - [x] `orgs/{orgId}/invoices/{invoiceId}/items/{itemId}.{ext}`
  - [x] `orgs/{orgId}/invoices/{invoiceId}/invoice.pdf`
- [x] Create PDF filename generator (`invoice_{invoiceId}.pdf`)
- [x] Create org subdomain generation helper (URL-safe random slug)

#### Rate limiting
- [x] Create rate limit key helpers (generate consistent keys by scope: payment attempts per invoice, emails per org)
- [x] Create rate limit window calculation (rolling window boundaries, check if within limit)

#### Status and state
- [x] Create invoice status transition validator (enforce valid state machine)
- [x] Create payment status checker (can invoice accept payment? — unpaid, not void)
- [x] Create onboarding status checkers:
  - [x] `isOrgNameSet(org)`
  - [x] `isBusinessAddressSet(org)`
  - [x] `isStripeConnected(org)`
  - [x] `canSendInvoice(org)` — all readiness gates pass
- [x] Create subscription tier metadata accessors (get org limit, storage quota, price by tier)

#### Data helpers
- [x] Create email address normalization (lowercase, trim)
- [x] Create date/due-date helpers (calculate due date from terms, check if overdue, compute reminder schedule dates)
- [x] Create file size formatting helper (bytes to human-readable)

### 2.5 Tests for shared logic

#### Invoice math tests
- [x] Add invoice math unit tests (line totals, subtotals, final totals)
- [x] Add rounding edge case tests (fractional cents, large quantities)
- [x] Add discount ordering tests (percentage then total, fixed then total)
- [x] Add tax calculation tests (taxable vs non-taxable items, tax after discount)
- [x] Add zero-amount and negative-edge tests

#### Permission tests
- [x] Add permission helper tests (Owner full access, Admin restrictions, Member restrictions)
- [x] Add admin panel access tests (Clerk metadata gate)

#### Token and security tests
- [x] Add token generator tests (length, hex format, uniqueness)
- [x] Add invoice access token validation tests

#### Status and state machine tests
- [x] Add invoice status transition tests (valid transitions, rejected invalid transitions)
- [x] Add payment status checker tests (payable states, non-payable states)
- [x] Add onboarding readiness gate tests (each gate independently, all gates combined)

#### Rate limiting tests
- [x] Add rate limit key generation tests (consistent keys, scope isolation)
- [x] Add rate limit window calculation tests (within window, expired window, boundary cases)

#### Data helper tests
- [x] Add email address normalization tests (case, whitespace, invalid formats)
- [x] Add money conversion round-trip tests (cents to dollars and back)
- [x] Add date/due-date helper tests (overdue detection, reminder schedule)
- [x] Add invoice URL builder tests (correct format, token encoding)
- [x] Add file storage path builder tests (all path patterns)

---

## 3. Auth and user bootstrap

### 3.2 Internal user model (schema first — bootstrap and guards depend on this)
- [x] Create Convex schema for users (this is the canonical users table — section 4.1 should mark it done, not recreate it)
- [x] Store Clerk user ID on internal user
- [x] Store email on internal user
- [x] Store `createdAt` on internal user
- [x] Store subscription tier on internal user (default: `BASE` per 004-stripe.md)
- [x] Store `orgCountLimit` on internal user (default: `1` per 004-stripe.md)

### 3.1 Clerk integration
- [x] Install `@clerk/clerk-react` in admin app
- [x] Install `@clerk/clerk-react` in marketing app
- [x] Install `@clerk/clerk-expo` in mobile app
- [x] Wrap admin app root with `<ClerkProvider>`
- [x] Wrap marketing app root with `<ClerkProvider>`
- [x] Wrap mobile app root with `<ClerkProvider>` (with Expo token cache)
- [x] Wire `VITE_CLERK_PUBLISHABLE_KEY` env var in admin and marketing apps
- [x] Wire `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` env var in mobile app
- [ ] Configure Clerk Dashboard: enable email+password, Google OAuth, Apple Sign-In
- [ ] Integrate Clerk in mobile app (sign-in/sign-up screens)
- [ ] Integrate Clerk in marketing site auth entry points
- [ ] Integrate Clerk in admin panel
- [ ] Integrate Clerk in invite acceptance page
- [x] Handle auth loading states (render placeholder while Clerk checks session)

### 3.3 User bootstrap flow
- [x] Decide bootstrap trigger mechanism — **Convex mutation on first auth** (client-side, no webhook infrastructure needed)
- [x] Implement first-login user bootstrap path
- [x] Set default `subscriptionTier = BASE` on new user creation
- [x] Set default `orgCountLimit = 1` on new user creation
- [x] Implement current-user query — **Convex-only** (query by clerkId via auth identity)
- [x] Handle returning users cleanly
- [x] Handle race condition: two simultaneous first logins for the same Clerk user
- [x] Prevent duplicate user creation (enforce unique constraint on clerkId)
- [x] Decide backfill strategy — **on-demand at login** (bootstrap mutation handles it)
- [x] Backfill missing internal user records if needed
- [x] Coordinate timing with Stripe webhook for subscription creation — **N/A at bootstrap time** (defaults to BASE; section 27 handles Stripe sync)

### 3.4 Auth guards
- [x] Decide admin guard approach — **`publicMetadata.isAdmin` check** via Clerk JWT identity
- [x] Decide guard implementation pattern — **Convex wrapper functions** (higher-order helpers in `convex/lib/auth.ts`)
- [x] Decide org membership guard query strategy — **DB query per request** (Convex is fast, avoids cache invalidation)
- [x] Define error response format — **`ConvexError({ code, message })`** with codes: `UNAUTHENTICATED`, `USER_NOT_FOUND`, `FORBIDDEN`
- [x] Build authenticated mutation guard (Convex function level)
- [x] Build authenticated query guard (Convex function level)
- [x] Build admin-panel-only guard
- [x] Build org membership access guard
- [ ] Verify authenticated route protection works (depends on Clerk Dashboard setup and sign-in screens)

---

## 4. Convex schema foundation

### 4.1 Core tables
- [x] Create users table (created in 3.2)
- [x] Create organizations table (created in 3.2 — matches Organization type)
- [x] Create memberships table (created in 3.2 — matches Membership type)
- [x] Create invitations table (orgId, inviterId, email, role, createdAt, expiresAt, status)
- [x] Create clients table (name, email, phone?, notes?, archived, orgId)
- [x] Create itemPresets table (name, description?, defaultPrice, taxable, userId)
- [x] Create expenses table (description, amount, category?, orgId)
- [x] Create invoices table (orgId, clientSnapshot?, lineItems, expenses, subtotal, discount?, tax?, total, status, accessToken?, stripeSessionId?, sentAt?, paidAt?, voidedAt?, dueDate?, createdAt, updatedAt)
- [x] Create invoiceViewEvents table (invoiceId, timestamp, ip?, userAgent?, isFirstView)
- [x] Create files table (orgId, ownerEntityType, ownerEntityId, mimeType, sizeBytes, storageId, logicalPath?, uploadedAt)
- [x] Create attachments table (fileId, invoiceId, displayName)
- [x] Create logs table (eventType, actorId?, orgId?, entityType?, entityId?, metadata?, createdAt)
- [x] Create rateLimitBuckets table (key, count, windowStart, windowEnd)
- [x] Create downgradeGracePeriods table (userId, excessOrgIds, graceStartDate, graceEndDate, state)
- [x] Create stripeSubscriptions table (stripeSubscriptionId, stripeCustomerId, userId, tier, status, currentPeriodStart, currentPeriodEnd)
- [x] Create stripeConnectAccounts table (stripeAccountId, orgId, status, chargesEnabled, detailsSubmitted)
- [x] Create checkoutSessions table (stripeSessionId, invoiceId, amount, status, createdAt, completedAt?)
- [x] Create paymentRecords table (invoiceId, method, amount, reference?, paidAt, paidBy)
- [x] Create paymentAttempts table (invoiceId, ip, timestamp, success)

### 4.2 Indexes and query planning
- [x] Add user lookup by Clerk ID (`users.by_clerkId` — created in 3.2)
- [x] Add user lookup by email (`users.by_email` — created in 3.2)
- [x] Add org lookup by subdomain (`organizations.by_subdomain` — created in 3.2)
- [x] Add membership lookup by orgId + userId (`memberships.by_orgId_userId` — created in 3.2)
- [x] Add invitation lookup by email + orgId (`invitations.by_email_orgId`)
- [x] Add invitation lookup by orgId (`invitations.by_orgId`)
- [x] Add client lookup by orgId + email (`clients.by_orgId_email`)
- [x] Add client lookup by orgId (`clients.by_orgId`)
- [x] Add invoice lookup by orgId + status (`invoices.by_orgId_status`)
- [x] Add invoice lookup by access token (`invoices.by_accessToken`)
- [x] Add invoiceViewEvents lookup by invoiceId (`invoiceViewEvents.by_invoiceId`)
- [x] Add files lookup by orgId (`files.by_orgId`)
- [x] Add attachments lookup by invoiceId (`attachments.by_invoiceId`)
- [x] Add logs lookup by event type (`logs.by_eventType`)
- [x] Add logs lookup by createdAt (`logs.by_createdAt`)
- [x] Add rateLimitBuckets lookup by key (`rateLimitBuckets.by_key`)
- [x] Add downgradeGracePeriods lookup by userId (`downgradeGracePeriods.by_userId`)
- [x] Add itemPresets lookup by userId (`itemPresets.by_userId`)
- [x] Add expenses lookup by orgId (`expenses.by_orgId`)
- [x] Add stripeSubscriptions lookup by userId (`stripeSubscriptions.by_userId`)
- [x] Add stripeSubscriptions lookup by stripeSubscriptionId (`stripeSubscriptions.by_stripeSubscriptionId`)
- [x] Add stripeConnectAccounts lookup by orgId (`stripeConnectAccounts.by_orgId`)
- [x] Add stripeConnectAccounts lookup by stripeAccountId (`stripeConnectAccounts.by_stripeAccountId`)
- [x] Add checkoutSessions lookup by stripeSessionId (`checkoutSessions.by_stripeSessionId`)
- [x] Add checkoutSessions lookup by invoiceId (`checkoutSessions.by_invoiceId`)
- [x] Add paymentRecords lookup by invoiceId (`paymentRecords.by_invoiceId`)
- [x] Add paymentAttempts lookup by invoiceId (`paymentAttempts.by_invoiceId`)

---

## 5. Organization core

### 5.1 Organization creation
- [x] Create organization mutation
- [x] Generate immutable random subdomain
- [x] Enforce subdomain uniqueness
- [x] Store name
- [x] Store business address fields
- [x] Store `logoUrl` placeholder
- [x] Store `createdAt`
- [x] Store tier or derived billing state as designed
- [x] Store `storageUsed`
- [x] Create owner membership automatically

### 5.2 Org count enforcement
- [x] Enforce org limit on create
- [x] Return clear over-limit error
- [x] Verify Base tier org cap = 1
- [x] Verify Plus tier org cap = 5
- [x] Verify Pro tier org cap = 25 (corrected from 10 — see `ORG_COUNT_LIMIT_BY_TIER` in constants)

### 5.3 Current org selection
- [x] Add current organization query
- [x] Add org switcher support
- [x] Persist selected org state in app
- [x] Handle no-org state cleanly

### 5.4 Organization settings
- [x] Build org settings update mutation
- [ ] Build org profile screen
- [x] Make subdomain read-only after creation
- [x] Display storage usage in org settings

---

## 6. Memberships and roles

### 6.1 Permission matrix implementation
- [x] Implement Owner permissions
- [x] Implement Admin permissions
- [x] Implement Member permissions
- [x] Block Member from sending invoices
- [x] Block Member from inviting members
- [x] Block Admin from managing billing
- [x] Block Admin from deleting organization

### 6.2 Membership queries and mutations
- [x] Add membership list query by org
- [x] Add membership detail query
- [x] Add role update mutation
- [x] Add remove member mutation
- [x] Add leave organization mutation

### 6.3 Continuity rules
- [x] Block owner removal
- [x] Ensure org always has at least one admin/owner
- [x] Prevent invalid role change that leaves no admin/owner
- [x] Handle owner leaving with destructive confirmation flow

### 6.4 Permission tests
- [x] Test Owner full access
- [x] Test Admin restrictions
- [x] Test Member restrictions
- [ ] Test continuity rules

---

## 7. Onboarding system

### 7.1 Onboarding state
- [x] Define onboarding steps data model
- [x] Create onboarding status query
- [x] Track account completion
- [x] Track organization creation completion
- [x] Track business information completion
- [x] Track Stripe Connect setup completion

### 7.2 Readiness gates
- [x] Create helper: organization name set
- [x] Create helper: business address set
- [x] Create helper: Stripe connected
- [x] Create helper: can send invoice
- [ ] Enforce send block if onboarding incomplete

### 7.3 UI
- [ ] Build onboarding checklist screen in mobile app
- [ ] Add business information form
- [ ] Add Stripe connection action/state UI
- [ ] Add completion indicators

---

## 8. Client system

### 8.1 Data model
- [x] Create client fields:
  - [x] `name`
  - [x] `email`
  - [x] `phone`
  - [x] `notes`
  - [x] `archived`
  - [x] `orgId`
- [x] Make email required
- [x] Scope clients by organization

### 8.2 CRUD
- [x] Add create client mutation
- [x] Add edit client mutation
- [x] Add archive client mutation
- [x] Add restore client mutation
- [x] Block hard delete in normal flow

### 8.3 Rules
- [x] Block duplicate email within organization
- [x] Hide archived clients from picker
- [x] Support viewing archived clients separately

### 8.4 UI
- [ ] Build client list screen
- [ ] Build create client screen
- [ ] Build edit client screen
- [ ] Build archive/restore controls

---

## 9. Item presets

### 9.1 Data model
- [x] Create item preset fields:
  - [x] `name`
  - [x] `description`
  - [x] `defaultPrice`
  - [x] `taxable`
  - [x] `userId`
- [x] Confirm no image support in V1

### 9.2 CRUD
- [x] Add create preset mutation
- [x] Add edit preset mutation
- [x] Add delete preset mutation
- [x] Add list presets query

### 9.3 UI
- [ ] Build item preset list
- [ ] Build create/edit preset flow
- [ ] Build preset picker inside invoice editor

### 9.4 Safety
- [x] Verify deleting preset does not mutate existing invoices

---

## 10. Expenses

### 10.1 Data model
- [x] Create expense fields
- [x] Scope expenses by organization
- [x] Support amount stored in cents
- [x] Support attachment to multiple invoices via duplication

### 10.2 CRUD
- [x] Add create expense mutation
- [x] Add edit expense mutation
- [x] Add archive/delete strategy if needed
- [x] Add list expenses query

### 10.3 UI
- [ ] Build expense list screen
- [ ] Build create expense screen
- [ ] Build edit expense screen
- [ ] Build expense picker in invoice composer

### 10.4 Rules
- [x] Ensure each attached expense is duplicated into invoice snapshot
- [x] Ensure original expense edits do not mutate sent invoice data

---

## 11. Invoice domain model

### 11.1 Invoice fields
- [x] Create invoice fields:
  - [x] `id`
  - [x] `orgId`
  - [x] `clientSnapshot`
  - [x] `lineItems`
  - [x] `expenses`
  - [x] `subtotal`
  - [x] `discount`
  - [x] `tax`
  - [x] `total`
  - [x] `status`
  - [x] `createdAt`
  - [x] `updatedAt`
  - [x] `accessToken`
  - [x] `stripeSessionId`
- [x] Add due date if needed for reminders
- [x] Add `sentAt` if needed
- [x] Add `paidAt` if needed
- [x] Add `voidedAt` if needed
- [x] Add manual payment metadata if needed — stored in separate `paymentRecords` table (normalized)

### 11.2 Status lifecycle
- [x] Define valid transitions:
  - [x] `draft -> sent`
  - [x] `sent -> viewed`
  - [x] `sent/viewed -> paid`
  - [x] `draft/sent/viewed -> void`
- [x] Block invalid transitions

### 11.3 Snapshot policy
- [x] Snapshot client data into invoice
- [x] Snapshot line item data into invoice
- [x] Snapshot expense data into invoice
- [x] Decide whether branding snapshot is needed for historical accuracy — deferred to V2; PDF captures branding at generation time

---

## 12. Invoice math engine

### 12.1 Money rules
- [x] Store all money in cents
- [x] Format money with exactly two decimals in UI
- [x] Support decimal quantity for line items
- [x] Round at line-item level

### 12.2 Calculation order
- [x] Calculate line totals first
- [x] Sum line totals into subtotal
- [x] Apply discount to subtotal
- [x] Apply tax after discount
- [x] Calculate final total

### 12.3 Discount support
- [x] Support percentage discount
- [x] Support fixed-amount discount
- [x] Prevent discount from producing invalid negative totals unless explicitly allowed

### 12.4 Tax support
- [x] Integrate Stripe Tax-compatible calculation inputs
- [x] Store tax result on invoice
- [x] Ensure tax can be configured per invoice

### 12.5 Tests
- [x] Test decimal quantity cases
- [x] Test rounding edge cases
- [x] Test fixed discount cases
- [x] Test percentage discount cases
- [x] Test zero-tax cases
- [x] Test multi-line mixed-taxable cases

---

## 13. Draft invoice backend

### 13.1 Core mutations and queries
- [x] Add create draft invoice mutation
- [x] Add update draft invoice mutation
- [x] Add fetch invoice detail query
- [x] Add list invoices by org query
- [x] Add list invoices grouped by status query
- [x] Sort invoices newest first

### 13.2 Draft restrictions
- [x] Allow Member to create draft invoices
- [x] Allow Member to edit permitted draft fields
- [x] Block Member from sending invoices

### 13.3 Integrity
- [x] Recalculate totals server-side on save
- [x] Validate client snapshot exists on save
- [x] Validate line items on save
- [x] Validate attached expenses on save

---

## 14. Mobile invoice composer UI

### 14.1 Screen structure
- [x] Build invoice draft screen shell
- [x] Build invoice draft header
- [x] Build client selection section
- [x] Build line items section
- [x] Build expenses section
- [x] Build discount section
- [x] Build totals section
- [x] Build actions footer

### 14.2 Client flow
- [x] Add client picker
- [x] Add quick-create client option
- [x] Handle archived client exclusion

### 14.3 Line item flow
- [x] Add new line-item action
- [x] Add edit line-item action
- [x] Add remove line-item action
- [x] Add quantity input with decimal support
- [x] Add taxable toggle
- [ ] Add optional image placeholder support if included in V1 line items
- [x] Add line-item preview totals

### 14.4 Preset flow
- [x] Add insert-from-preset action
- [x] Map preset into draft line-item fields

### 14.5 Expense flow
- [x] Add attach expense action
- [x] Add remove attached expense action
- [x] Show duplicated expense cost in invoice summary

### 14.6 Save behavior
- [x] Save draft changes
- [x] Restore draft on reload
- [x] Show validation errors clearly

---

## 15. Invoice list and dashboard basics

### 15.1 Invoice list
- [x] Build invoice list screen
- [x] Group by Draft, Sent, Viewed, Paid, Void
- [x] Sort each group newest first
- [x] Add empty states per group

### 15.2 Dashboard
- [x] Add total unpaid amount query
- [x] Add unpaid invoice count query
- [x] Add recent invoices query limited to 5
- [x] Add quick actions:
  - [x] create invoice
  - [x] add client
- [x] Build dashboard UI cards

---

## 16. Invoice send flow

### 16.1 Send validation
- [x] Check invoice status is DRAFT (`isValidStatusTransition` from `@repo/utils`)
- [x] Check sender role is OWNER or ADMIN (`canSendInvoice` from `@repo/utils`)
- [x] Check org readiness: name set, business address set, Stripe connected (`isReadyToSendInvoice` from `@repo/utils`)
- [x] Check invoice total > 0 (reject zero-amount invoices)

### 16.2 Send mutation
- [x] Re-snapshot client from source record at send time (freeze current client data, not draft-time snapshot)
- [x] Generate 32-char hex access token (adapt `generateAccessToken` from `@repo/utils` to use `crypto.getRandomValues` for Convex runtime compatibility — Node.js `crypto.randomBytes` is not available in Convex mutations)
- [x] Save access token to invoice
- [x] Transition status from DRAFT to SENT
- [x] Set `sentAt` timestamp
- [x] Recalculate and freeze totals (server-side, per existing pattern)
- [x] Log invoice send event to `logs` table
- [x] Schedule PDF generation action
- [x] Schedule email send action

### 16.3 PDF generation action
- [x] Create Convex action in `convex/actions/pdf.ts`
- [x] Accept invoiceId, fetch invoice data from DB
- [x] Render PDF using `@react-pdf/renderer` (per decision 008)
- [x] Store generated PDF via Convex File Storage
- [x] Link stored file to invoice (create `files` + `attachments` records)

### 16.4 Email send action
- [x] Create Convex action in `convex/actions/email.ts`
- [x] Accept invoiceId and recipient details
- [x] Check email rate limit (50/hr per org, using `rateLimitBuckets` table and helpers from `@repo/utils`)
- [x] Construct email from `InvoiceSendEmailData` type (`@repo/types`)
- [x] Send via Resend API (`RESEND_API_KEY` env var)
- [x] From: `invoices@invo.app`, Reply-To: org owner email (per decision 006)
- [x] Increment rate limit bucket on success
- [x] Handle send failure gracefully (log error, do not roll back invoice status)

### 16.5 Audit
- [x] Log invoice send event with actorId, orgId, entityType, entityId, metadata

---

## 17. Public invoice viewer

### 17.1 Routing (within marketing app)
- [x] Add `/invoice/:invoiceId` route to marketing app router (react router)
- [x] Read `token` from query string
- [x] Resolve invoice by invoiceId + token

### 17.2 Access validation
- [x] Reject invalid token
- [x] Reject token/invoice mismatch
- [x] Reject missing invoice
- [x] Handle void state correctly

### 17.3 Viewer rendering
- [x] Render invoice header and branding (uploads deferred to section 22)
- [x] Render client information
- [x] Render line items
- [x] Render expenses
- [x] Render totals
- [x] Render attachments (uploads deferred to section 22)
- [x] Render line-item images (uploads deferred to section 22)
- [x] Render pay button (disabled until section 18)
- [x] Render dark mode/system theme support

### 17.4 Status banners
- [x] Gray banner for draft if ever visible internally
- [x] Yellow banner for unpaid
- [x] Green banner for paid
- [x] Red banner for void

### 17.5 View tracking
- [x] Record first-view timestamp (IP unavailable from Convex functions)
- [x] Transition `sent -> viewed` on first successful load
- [x] Record every subsequent view event
- [x] Keep view data internal for V1

### 17.6 PDF download rules
- [x] Allow PDF download only when invoice unpaid
- [x] Block PDF download when paid if following spec strictly
- [x] Block PDF download when void if required by policy

---

## 18. Payments via Stripe Checkout

### 18.1 Checkout creation
- [x] Create checkout session action
- [x] Allow only for sent/viewed unpaid invoices
- [x] Include invoice metadata in session
- [x] Include organization metadata in session
- [x] Configure card support
- [x] Configure Apple Pay support — via Checkout `card`; requires Stripe Dashboard domain registration
- [x] Configure Google Pay support — via Checkout `card`
- [x] Configure tax input path — tax is folded into the charged invoice total (decision 004c)

### 18.2 Success handling
- [x] Redirect to marketing site success page
- [x] Build payment success page UI
- [x] Display payment received state

### 18.3 Webhook reconciliation
- [x] Verify Stripe webhook signatures
- [x] Handle checkout success event
- [x] Mark invoice paid on verified payment
- [x] Prevent double-processing and idempotency issues
- [x] Save Stripe session/payment refs
- [x] Log payment success

### 18.4 Failure handling
- [x] Log failed payment attempts — expired sessions logged; per-IP attempts and lockout remain in section 20
- [x] Surface retry path on public viewer

---

## 19. Manual payment support

### 19.1 Backend
- [ ] Add manual mark-paid mutation
- [ ] Restrict to Owner/Admin as intended
- [ ] Require payment method: cash/check/other
- [ ] Store manual payment metadata
- [ ] Set paid status
- [ ] Log manual payment action

### 19.2 Mobile UI
- [ ] Add mark-paid action in invoice detail
- [ ] Add payment method prompt
- [ ] Add confirmation step

---

## 20. Payment security and rate limiting

### 20.1 Rate-limit model
- [ ] Create payment-attempt tracking records
- [ ] Decide limiter key strategy
- [ ] Count attempts in rolling hour window
- [ ] Lock after 10 attempts per hour
- [ ] Enforce 15-minute lock duration

### 20.2 UI and logging
- [ ] Show message: `Too many payment attempts. Try again later.`
- [ ] Log failures
- [ ] Log lockouts

### 20.3 Tests
- [ ] Test limit threshold behavior
- [ ] Test lock expiration behavior
- [ ] Test successful payment after lock expiry

---

## 21. File storage foundation

### 21.1 File metadata
- [ ] Create file metadata model
- [ ] Store `orgId`
- [ ] Store owner entity type
- [ ] Store owner entity ID
- [ ] Store MIME type
- [ ] Store size bytes
- [ ] Store storage path/key
- [ ] Store `uploadedAt`
- [ ] Store visibility metadata if needed

### 21.2 Upload validation
- [ ] Allow images
- [ ] Allow PDFs
- [ ] Block unsupported file types
- [ ] Enforce max 5 MB per file
- [ ] Enforce max 2 attachments per invoice

---

## 22. Attachments, branding, images

### 22.1 Organization branding
- [ ] Add org logo upload flow
- [ ] Save logo metadata
- [ ] Render logo in viewer
- [ ] Render logo in PDF

### 22.2 Invoice attachments
- [ ] Add invoice attachment upload flow
- [ ] Link attachment files to invoice
- [ ] Show attachments in invoice viewer
- [ ] Show attachments in mobile invoice detail if needed

### 22.3 Line-item images
- [ ] Confirm whether line-item images are V1 or only render-ready support
- [ ] Add line-item image upload flow if included in scope
- [ ] Render line-item images in viewer
- [ ] Render line-item images in PDF

---

## 23. Storage quotas

### 23.1 Quota definitions
- [ ] Base = 500 MB
- [ ] Plus = 10 GB
- [ ] Pro = 100 GB

### 23.2 Accounting
- [ ] Count item images toward quota
- [ ] Count attachments toward quota
- [ ] Count org logo toward quota
- [ ] Count stored PDFs toward quota
- [ ] Increment `storageUsed` on upload/generation
- [ ] Decrement `storageUsed` on delete

### 23.3 Enforcement
- [ ] Block upload when over quota
- [ ] Return clear quota-exceeded error
- [ ] Display quota usage in app

### 23.4 Reconciliation
- [ ] Add admin/internal reconciliation path for `storageUsed` drift

---

## 24. PDF generation

### 24.1 Shared rendering layer
- [ ] Create normalized invoice render model
- [ ] Build shared HTML invoice template
- [ ] Ensure template matches public viewer content

### 24.2 Generation pipeline
- [ ] Create server-side HTML render function
- [ ] Create PDF generation function
- [ ] Save PDF file metadata
- [ ] Use filename format `invoice_<invoiceId>.pdf`

### 24.3 Triggers
- [ ] Generate PDF when invoice sent
- [ ] Generate PDF when preview requested
- [ ] Implement 5-minute preview cache

### 24.4 Validation
- [ ] Verify logo renders
- [ ] Verify line-item images render
- [ ] Verify attachments policy for PDF if applicable

---

## 25. Email system with Resend

### 25.1 Templates
- [x] Create invoice send email template
- [ ] Create payment receipt email template
- [ ] Create reminder email template

### 25.2 Core sends
- [x] Send invoice email on invoice send
- [ ] Send payment receipt after payment success
- [ ] Add resend invoice email action

### 25.3 Reminder scheduling
- [ ] Ensure invoice has due-date support
- [ ] Schedule reminder 3 days before due
- [ ] Schedule reminder on due date
- [ ] Stop reminders when invoice paid
- [ ] Stop reminders when invoice voided

### 25.4 Email limits
- [ ] Enforce 50 emails per hour per organization
- [ ] Return limit message: `Email limit reached. Try again later.`
- [ ] Do not auto-retry when limit hit
- [ ] Log blocked sends

---

## 26. Invitation system

### 26.1 Invitation model
- [ ] Store `orgId`
- [ ] Store `inviterId`
- [ ] Store invited email
- [ ] Store invited role
- [ ] Store `createdAt`
- [ ] Store `expiresAt`
- [ ] Store revoked state
- [ ] Store accepted state

### 26.2 Invitation rules
- [ ] Default role to Member
- [ ] Allow Owner/Admin to invite
- [ ] Require invited email belongs to existing user
- [ ] Expire invite after 24 hours
- [ ] Allow inviter to revoke invite

### 26.3 Invite flow
- [ ] Add create invite mutation
- [ ] Add revoke invite mutation
- [ ] Build invite acceptance page
- [ ] Require Clerk auth on invite page
- [ ] Create membership on accept
- [ ] Consume invite after accept
- [ ] Deep link to mobile app after join

### 26.4 Post-join management
- [ ] Allow role edits after join

---

## 27. Billing system for app subscriptions

### 27.1 Stripe Billing setup
- [ ] Create Base price = $19
- [ ] Create Plus price = $49
- [ ] Create Pro price = $99
- [ ] Create billing portal or management flow

### 27.2 Subscription sync
- [ ] Sync user tier from Stripe webhooks
- [ ] Update internal `subscriptionTier` on user
- [ ] Update `orgCountLimit` on user

### 27.3 Upgrade behavior
- [ ] Support immediate upgrade
- [ ] Support prorated upgrade behavior

### 27.4 Downgrade behavior
- [ ] Detect org-count overage on downgrade
- [ ] Prompt user to choose orgs to delete
- [ ] Mark excess orgs read-only during grace period
- [ ] Start 7-day grace timer
- [ ] Auto-delete excess orgs after grace
- [ ] Cancel deletion if user upgrades during grace

### 27.5 Storage plan changes
- [ ] Enforce storage caps from current active tier

---

## 28. Organization deletion

### 28.1 Confirmation flow
- [ ] Require typing org name to confirm deletion
- [ ] Add explicit destructive warning UI
- [ ] Log deletion request and execution

### 28.2 Hard delete process
- [ ] Delete invoices
- [ ] Delete attachments
- [ ] Delete files
- [ ] Delete memberships
- [ ] Delete clients
- [ ] Delete expenses
- [ ] Delete invites
- [ ] Delete logs if desired by policy
- [ ] Remove Stripe references
- [ ] Remove generated PDFs

### 28.3 Owner-leave behavior
- [ ] Route owner leave through org deletion confirmation flow

---

## 29. Data export

### 29.1 Export generation
- [ ] Add organization export action
- [ ] Export format = JSON
- [ ] Include clients
- [ ] Include invoices
- [ ] Include expenses
- [ ] Include memberships as appropriate
- [ ] Include branding/settings as appropriate

### 29.2 Delivery
- [ ] Provide export download flow
- [ ] Log export generation

---

## 30. Admin panel

### 30.1 Access control
- [ ] Restrict admin panel to internal admins only
- [ ] Log admin access events

### 30.2 User tools
- [ ] View users
- [ ] Search users by email
- [ ] Search users by ID
- [ ] Delete users

### 30.3 Invoice tools
- [ ] Search invoices
- [ ] View invoice detail safely
- [ ] Confirm editing invoices is disabled

### 30.4 Support tools
- [ ] Trigger refunds
- [ ] View logs
- [ ] Filter logs by event type
- [ ] Impersonate users
- [ ] Log impersonation events

---

## 31. Logging and retention

### 31.1 Log coverage
- [ ] Log payments
- [ ] Log email sends
- [ ] Log auth events
- [ ] Log invoice changes
- [ ] Log membership changes
- [ ] Log destructive actions
- [ ] Log admin actions

### 31.2 Retention
- [ ] Implement 30-day retention cleanup job
- [ ] Verify cleanup does not remove required active data

---

## 32. Mobile app polish

### 32.1 Primary capabilities
- [ ] Create invoices
- [ ] Manage clients
- [ ] Manage items
- [ ] Manage expenses
- [ ] Send invoices
- [ ] Preview PDFs
- [ ] Resend invoice emails
- [ ] Mark invoice paid manually

### 32.2 Theme and security
- [ ] Add dark mode
- [ ] Add light mode
- [ ] Add biometric unlock
- [ ] Add persistent login
- [ ] Ensure logout does not require biometrics

---

## 33. Invoice viewer polish

### 33.1 UX
- [ ] Support system theme detection
- [ ] Confirm paid banner updates after successful payment
- [ ] Confirm void banner disables payment
- [ ] Confirm unpaid banner shows payment CTA

### 33.2 Content rendering
- [ ] Confirm attachments visible to client
- [ ] Confirm line-item images visible to client
- [ ] Confirm invoice state is correct after view and payment

---

## 34. Security hardening

### 34.1 Token security
- [ ] Verify access token is 32-char hex
- [ ] Verify token generation entropy is sufficient
- [ ] Verify invoice cannot be accessed without valid token

### 34.2 Backend hardening
- [ ] Ensure all sensitive operations are permission-checked server-side
- [ ] Ensure public viewer never leaks private org data
- [ ] Ensure rate limits cannot be bypassed easily
- [ ] Ensure org isolation on all queries/mutations

### 34.3 Webhook hardening
- [ ] Verify Stripe webhook signature checks
- [ ] Verify replay and idempotency handling

### 34.4 File security
- [ ] Prevent unauthorized file access
- [ ] Validate MIME type and extension handling
- [ ] Prevent over-quota bypass paths

---

## 35. Testing checklist

### 35.1 Unit tests
- [ ] Money utilities
- [ ] Invoice math engine
- [ ] Permission helpers
- [ ] Token generation
- [ ] Subdomain generation
- [ ] Rate-limit helpers

### 35.2 Integration tests
- [ ] User bootstrap flow
- [ ] Organization creation flow
- [ ] Membership permission flow
- [ ] Client duplicate email rules
- [ ] Draft invoice save flow
- [ ] Invoice send flow
- [ ] Public invoice access validation
- [ ] Stripe payment reconciliation
- [ ] PDF generation flow
- [ ] Email send flow
- [ ] Invitation accept flow
- [ ] Downgrade grace flow
- [ ] Organization deletion flow

### 35.3 E2E tests
- [ ] Sign up -> create org -> complete onboarding
- [ ] Create client -> create draft invoice -> send invoice
- [ ] Open public invoice -> pay invoice -> see paid state
- [ ] Owner invites member -> member joins -> member creates draft
- [ ] Admin triggers refund from admin panel if included in E2E scope

### 35.4 Manual QA
- [ ] Test mobile dark mode
- [ ] Test viewer dark/system mode
- [ ] Test biometric unlock
- [ ] Test file upload limits
- [ ] Test storage quota edge cases
- [ ] Test payment lockout message
- [ ] Test email limit message
- [ ] Test owner-leave deletion path

---

## 36. Production readiness

### 36.1 Monitoring and operations
- [ ] Add error reporting
- [ ] Add webhook failure monitoring
- [ ] Add email failure monitoring
- [ ] Add PDF generation failure monitoring
- [ ] Add storage drift monitoring if possible

### 36.2 Launch checklist
- [ ] Verify production env vars set
- [ ] Verify Stripe webhooks configured
- [ ] Verify Clerk production config
- [ ] Verify Resend production domain
- [ ] Verify subdomain DNS/routing
- [ ] Verify app pricing and billing flows
- [ ] Verify admin panel access restrictions
- [ ] Verify backup/export path exists

### 36.3 Final signoff
- [ ] Confirm MVP scope lock
- [ ] Confirm V2 items intentionally excluded
- [ ] Confirm release candidate passes regression
- [ ] Cut production release

---

## 37. V1 critical path checklist

Use this as the shortest path to a working product.

- [ ] Monorepo and app shells
- [ ] Shared types and invoice math
- [ ] Clerk auth + internal user bootstrap
- [ ] Organizations + memberships + roles
- [ ] Onboarding readiness gate
- [ ] Clients
- [ ] Item presets
- [ ] Expenses
- [x] Draft invoice backend
- [x] Draft invoice mobile UI
- [ ] Invoice send flow
- [ ] Public invoice viewer
- [ ] Stripe Checkout payment flow
- [ ] Payment webhook reconciliation
- [ ] PDF generation
- [ ] Invoice send email
- [ ] Attachments and logo upload
- [ ] Storage quota enforcement
- [ ] Reminders
- [ ] Invitations and member management
- [ ] Subscription billing sync
- [ ] Downgrade grace flow
- [ ] Admin logs and support tooling
- [ ] Export and organization deletion
- [ ] Security hardening
- [ ] E2E and regression testing
