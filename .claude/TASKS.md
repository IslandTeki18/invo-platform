# Invoicing Platform

A thorough implementation checklist based on the blueprint. Ordered to reduce rework and keep each phase shippable.

---

## 0. Project setup and delivery rules

- [x] Confirm canonical product domains for: (see `docs/decisions/001-domains.md`)
  - [x] marketing site — `invo.app`
  - [x] admin panel — `admin.invo.app`
  - [x] public invoice viewer — `view.invo.app/invoice/{id}?token={token}`
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
- [ ] Initialize Turborepo at root
- [ ] Create `apps/mobile-app`
- [ ] Create `apps/invoice-viewer`
- [ ] Create `apps/marketing-site`
- [ ] Create `apps/admin-panel`
- [ ] Create `packages/ui`
- [ ] Create `packages/utils`
- [ ] Create `packages/types`
- [ ] Add root `package.json`
- [ ] Add root Turbo config
- [ ] Add root TypeScript config
- [ ] Add root ESLint config
- [ ] Add root Prettier config
- [ ] Add `.editorconfig`
- [ ] Add `.gitignore`
- [ ] Add `.env.example` files

### 1.2 App shells
- [ ] Boot Expo app shell for mobile app
- [ ] Boot Vite React app shell for invoice viewer
- [ ] Boot Vite React app shell for marketing site
- [ ] Boot Vite React app shell for admin panel
- [ ] Verify each app runs independently
- [ ] Verify each app can import from shared packages

### 1.3 Shared workspace tooling
- [ ] Configure workspace package manager
- [ ] Configure TS path aliases across apps/packages
- [ ] Configure shared build pipeline for packages
- [ ] Add root scripts for:
  - [ ] `dev`
  - [ ] `build`
  - [ ] `lint`
  - [ ] `format`
  - [ ] `typecheck`
  - [ ] `test`
- [ ] Add per-app scripts where needed

### 1.4 CI
- [ ] Add CI workflow for install
- [ ] Add CI workflow for lint
- [ ] Add CI workflow for typecheck
- [ ] Add CI workflow for build
- [ ] Add preview deployment wiring
- [ ] Verify CI passes on clean repo

---

## 2. Shared contracts and utilities

### 2.1 Shared enums and constants
- [ ] Define subscription tier enum
- [ ] Define organization role enum
- [ ] Define invoice status enum
- [ ] Define invitation status enum
- [ ] Define log event type enum
- [ ] Define manual payment method enum
- [ ] Define file type allowlist constants
- [ ] Define storage quota constants by tier
- [ ] Define org count limit constants by tier
- [ ] Define email rate limit constants
- [ ] Define payment attempt rate limit constants

### 2.2 Shared DTOs and types
- [ ] Define user DTO
- [ ] Define organization DTO
- [ ] Define membership DTO
- [ ] Define invitation DTO
- [ ] Define client DTO
- [ ] Define item preset DTO
- [ ] Define expense DTO
- [ ] Define invoice DTO
- [ ] Define line item DTO
- [ ] Define attachment DTO
- [ ] Define file metadata DTO
- [ ] Define log event DTO
- [ ] Define export payload DTO

### 2.3 Validation schemas
- [ ] Create user validation schema
- [ ] Create organization validation schema
- [ ] Create client validation schema
- [ ] Create item preset validation schema
- [ ] Create expense validation schema
- [ ] Create invoice draft validation schema
- [ ] Create invoice send validation schema
- [ ] Create invitation validation schema
- [ ] Create file upload validation schema

### 2.4 Shared utility modules
- [ ] Create money conversion helpers
- [ ] Create money formatting helpers
- [ ] Create decimal quantity parsing helpers
- [ ] Create invoice calculation engine
- [ ] Create token generation helper
- [ ] Create org subdomain generation helper
- [ ] Create permission check helpers
- [ ] Create rate limit key helpers
- [ ] Create file size formatting helper
- [ ] Create date/due-date helpers

### 2.5 Tests for shared logic
- [ ] Add invoice math unit tests
- [ ] Add rounding edge case tests
- [ ] Add discount ordering tests
- [ ] Add tax calculation tests
- [ ] Add token generator tests
- [ ] Add permission helper tests

---

## 3. Auth and user bootstrap

### 3.1 Clerk integration
- [ ] Integrate Clerk in mobile app
- [ ] Integrate Clerk in marketing site auth entry points
- [ ] Integrate Clerk in admin panel
- [ ] Integrate Clerk in invite acceptance page
- [ ] Verify authenticated route protection works

### 3.2 Internal user model
- [ ] Create Convex schema for users
- [ ] Store Clerk user ID on internal user
- [ ] Store email on internal user
- [ ] Store `createdAt` on internal user
- [ ] Store subscription tier on internal user
- [ ] Store `orgCountLimit` on internal user

### 3.3 User bootstrap flow
- [ ] Implement first-login user bootstrap path
- [ ] Implement current-user query
- [ ] Handle returning users cleanly
- [ ] Backfill missing internal user records if needed
- [ ] Prevent duplicate user creation

### 3.4 Auth guards
- [ ] Build authenticated mutation guard
- [ ] Build authenticated query guard
- [ ] Build admin-panel-only guard
- [ ] Build org membership access guard

---

## 4. Convex schema foundation

### 4.1 Core tables
- [ ] Create users table
- [ ] Create organizations table
- [ ] Create memberships table
- [ ] Create invitations table
- [ ] Create clients table
- [ ] Create item presets table
- [ ] Create expenses table
- [ ] Create invoices table
- [ ] Create invoice view events table
- [ ] Create files table
- [ ] Create logs table
- [ ] Create rate-limit table/buckets
- [ ] Create downgrade/grace tracking table if separate

### 4.2 Indexes and query planning
- [ ] Add user lookup by Clerk ID
- [ ] Add user lookup by email
- [ ] Add org lookup by subdomain
- [ ] Add membership lookup by orgId + userId
- [ ] Add invitation lookup by email + orgId
- [ ] Add client lookup by orgId + email
- [ ] Add invoice lookup by orgId + status
- [ ] Add invoice lookup by access token if needed
- [ ] Add logs lookup by event type
- [ ] Add logs lookup by `createdAt`
- [ ] Add files lookup by orgId

---

## 5. Organization core

### 5.1 Organization creation
- [ ] Create organization mutation
- [ ] Generate immutable random subdomain
- [ ] Enforce subdomain uniqueness
- [ ] Store name
- [ ] Store business address fields
- [ ] Store `logoUrl` placeholder
- [ ] Store `createdAt`
- [ ] Store tier or derived billing state as designed
- [ ] Store `storageUsed`
- [ ] Create owner membership automatically

### 5.2 Org count enforcement
- [ ] Enforce org limit on create
- [ ] Return clear over-limit error
- [ ] Verify Base tier org cap = 1
- [ ] Verify Plus tier org cap = 5
- [ ] Verify Pro tier org cap = 10

### 5.3 Current org selection
- [ ] Add current organization query
- [ ] Add org switcher support
- [ ] Persist selected org state in app
- [ ] Handle no-org state cleanly

### 5.4 Organization settings
- [ ] Build org settings update mutation
- [ ] Build org profile screen
- [ ] Make subdomain read-only after creation
- [ ] Display storage usage in org settings

---

## 6. Memberships and roles

### 6.1 Permission matrix implementation
- [ ] Implement Owner permissions
- [ ] Implement Admin permissions
- [ ] Implement Member permissions
- [ ] Block Member from sending invoices
- [ ] Block Member from inviting members
- [ ] Block Admin from managing billing
- [ ] Block Admin from deleting organization

### 6.2 Membership queries and mutations
- [ ] Add membership list query by org
- [ ] Add membership detail query
- [ ] Add role update mutation
- [ ] Add remove member mutation
- [ ] Add leave organization mutation

### 6.3 Continuity rules
- [ ] Block owner removal
- [ ] Ensure org always has at least one admin/owner
- [ ] Prevent invalid role change that leaves no admin/owner
- [ ] Handle owner leaving with destructive confirmation flow

### 6.4 Permission tests
- [ ] Test Owner full access
- [ ] Test Admin restrictions
- [ ] Test Member restrictions
- [ ] Test continuity rules

---

## 7. Onboarding system

### 7.1 Onboarding state
- [ ] Define onboarding steps data model
- [ ] Create onboarding status query
- [ ] Track account completion
- [ ] Track organization creation completion
- [ ] Track business information completion
- [ ] Track Stripe Connect setup completion

### 7.2 Readiness gates
- [ ] Create helper: organization name set
- [ ] Create helper: business address set
- [ ] Create helper: Stripe connected
- [ ] Create helper: can send invoice
- [ ] Enforce send block if onboarding incomplete

### 7.3 UI
- [ ] Build onboarding checklist screen in mobile app
- [ ] Add business information form
- [ ] Add Stripe connection action/state UI
- [ ] Add completion indicators

---

## 8. Client system

### 8.1 Data model
- [ ] Create client fields:
  - [ ] `name`
  - [ ] `email`
  - [ ] `phone`
  - [ ] `notes`
  - [ ] `archived`
  - [ ] `orgId`
- [ ] Make email required
- [ ] Scope clients by organization

### 8.2 CRUD
- [ ] Add create client mutation
- [ ] Add edit client mutation
- [ ] Add archive client mutation
- [ ] Add restore client mutation
- [ ] Block hard delete in normal flow

### 8.3 Rules
- [ ] Block duplicate email within organization
- [ ] Hide archived clients from picker
- [ ] Support viewing archived clients separately

### 8.4 UI
- [ ] Build client list screen
- [ ] Build create client screen
- [ ] Build edit client screen
- [ ] Build archive/restore controls

---

## 9. Item presets

### 9.1 Data model
- [ ] Create item preset fields:
  - [ ] `name`
  - [ ] `description`
  - [ ] `defaultPrice`
  - [ ] `taxable`
  - [ ] `userId`
- [ ] Confirm no image support in V1

### 9.2 CRUD
- [ ] Add create preset mutation
- [ ] Add edit preset mutation
- [ ] Add delete preset mutation
- [ ] Add list presets query

### 9.3 UI
- [ ] Build item preset list
- [ ] Build create/edit preset flow
- [ ] Build preset picker inside invoice editor

### 9.4 Safety
- [ ] Verify deleting preset does not mutate existing invoices

---

## 10. Expenses

### 10.1 Data model
- [ ] Create expense fields
- [ ] Scope expenses by organization
- [ ] Support amount stored in cents
- [ ] Support attachment to multiple invoices via duplication

### 10.2 CRUD
- [ ] Add create expense mutation
- [ ] Add edit expense mutation
- [ ] Add archive/delete strategy if needed
- [ ] Add list expenses query

### 10.3 UI
- [ ] Build expense list screen
- [ ] Build create expense screen
- [ ] Build edit expense screen
- [ ] Build expense picker in invoice composer

### 10.4 Rules
- [ ] Ensure each attached expense is duplicated into invoice snapshot
- [ ] Ensure original expense edits do not mutate sent invoice data

---

## 11. Invoice domain model

### 11.1 Invoice fields
- [ ] Create invoice fields:
  - [ ] `id`
  - [ ] `orgId`
  - [ ] `clientSnapshot`
  - [ ] `lineItems`
  - [ ] `expenses`
  - [ ] `subtotal`
  - [ ] `discount`
  - [ ] `tax`
  - [ ] `total`
  - [ ] `status`
  - [ ] `createdAt`
  - [ ] `updatedAt`
  - [ ] `isInvoiceEdited`
  - [ ] `accessToken`
  - [ ] `stripeSessionId`
- [ ] Add due date if needed for reminders
- [ ] Add `sentAt` if needed
- [ ] Add `paidAt` if needed
- [ ] Add `voidedAt` if needed
- [ ] Add manual payment metadata if needed

### 11.2 Status lifecycle
- [ ] Define valid transitions:
  - [ ] `draft -> sent`
  - [ ] `sent -> viewed`
  - [ ] `sent/viewed -> paid`
  - [ ] `draft/sent/viewed -> void`
- [ ] Block invalid transitions

### 11.3 Snapshot policy
- [ ] Snapshot client data into invoice
- [ ] Snapshot line item data into invoice
- [ ] Snapshot expense data into invoice
- [ ] Decide whether branding snapshot is needed for historical accuracy

---

## 12. Invoice math engine

### 12.1 Money rules
- [ ] Store all money in cents
- [ ] Format money with exactly two decimals in UI
- [ ] Support decimal quantity for line items
- [ ] Round at line-item level

### 12.2 Calculation order
- [ ] Calculate line totals first
- [ ] Sum line totals into subtotal
- [ ] Apply discount to subtotal
- [ ] Apply tax after discount
- [ ] Calculate final total

### 12.3 Discount support
- [ ] Support percentage discount
- [ ] Support fixed-amount discount
- [ ] Prevent discount from producing invalid negative totals unless explicitly allowed

### 12.4 Tax support
- [ ] Integrate Stripe Tax-compatible calculation inputs
- [ ] Store tax result on invoice
- [ ] Ensure tax can be configured per invoice

### 12.5 Tests
- [ ] Test decimal quantity cases
- [ ] Test rounding edge cases
- [ ] Test fixed discount cases
- [ ] Test percentage discount cases
- [ ] Test zero-tax cases
- [ ] Test multi-line mixed-taxable cases

---

## 13. Draft invoice backend

### 13.1 Core mutations and queries
- [ ] Add create draft invoice mutation
- [ ] Add update draft invoice mutation
- [ ] Add fetch invoice detail query
- [ ] Add list invoices by org query
- [ ] Add list invoices grouped by status query
- [ ] Sort invoices newest first

### 13.2 Draft restrictions
- [ ] Allow Member to create draft invoices
- [ ] Allow Member to edit permitted draft fields
- [ ] Block Member from sending invoices

### 13.3 Integrity
- [ ] Recalculate totals server-side on save
- [ ] Validate client snapshot exists on save
- [ ] Validate line items on save
- [ ] Validate attached expenses on save

---

## 14. Mobile invoice composer UI

### 14.1 Screen structure
- [ ] Build invoice draft screen shell
- [ ] Build invoice draft header
- [ ] Build client selection section
- [ ] Build line items section
- [ ] Build expenses section
- [ ] Build discount section
- [ ] Build totals section
- [ ] Build actions footer

### 14.2 Client flow
- [ ] Add client picker
- [ ] Add quick-create client option
- [ ] Handle archived client exclusion

### 14.3 Line item flow
- [ ] Add new line-item action
- [ ] Add edit line-item action
- [ ] Add remove line-item action
- [ ] Add quantity input with decimal support
- [ ] Add taxable toggle
- [ ] Add optional image placeholder support if included in V1 line items
- [ ] Add line-item preview totals

### 14.4 Preset flow
- [ ] Add insert-from-preset action
- [ ] Map preset into draft line-item fields

### 14.5 Expense flow
- [ ] Add attach expense action
- [ ] Add remove attached expense action
- [ ] Show duplicated expense cost in invoice summary

### 14.6 Save behavior
- [ ] Save draft changes
- [ ] Restore draft on reload
- [ ] Show validation errors clearly

---

## 15. Invoice list and dashboard basics

### 15.1 Invoice list
- [ ] Build invoice list screen
- [ ] Group by Draft, Sent, Viewed, Paid, Void
- [ ] Sort each group newest first
- [ ] Add empty states per group

### 15.2 Dashboard
- [ ] Add total unpaid amount query
- [ ] Add unpaid invoice count query
- [ ] Add recent invoices query limited to 5
- [ ] Add quick actions:
  - [ ] create invoice
  - [ ] add client
- [ ] Build dashboard UI cards

---

## 16. Invoice send flow

### 16.1 Send validation
- [ ] Check sender role is allowed
- [ ] Check org onboarding readiness
- [ ] Check org business info exists
- [ ] Check Stripe connected state exists
- [ ] Check client email exists
- [ ] Check invoice has valid totals
- [ ] Check invoice is not already sent/paid/void in invalid state

### 16.2 Send mutation
- [ ] Generate 32-char hex access token
- [ ] Save access token to invoice
- [ ] Generate public invoice URL
- [ ] Transition status from draft to sent
- [ ] Set sent timestamp
- [ ] Trigger PDF generation job/event
- [ ] Trigger invoice email send job/event

### 16.3 Audit
- [ ] Log invoice send event

---

## 17. Public invoice viewer

### 17.1 Routing and host handling
- [ ] Configure org subdomain routing
- [ ] Configure invoice route `/invoice/:invoiceId`
- [ ] Read token from query string
- [ ] Resolve invoice by subdomain + invoiceId + token

### 17.2 Access validation
- [ ] Reject invalid token
- [ ] Reject token/invoice mismatch
- [ ] Reject wrong subdomain
- [ ] Reject missing invoice
- [ ] Handle void state correctly

### 17.3 Viewer rendering
- [ ] Render invoice header and branding
- [ ] Render client information
- [ ] Render line items
- [ ] Render expenses
- [ ] Render totals
- [ ] Render attachments
- [ ] Render line-item images
- [ ] Render pay button
- [ ] Render dark mode/system theme support

### 17.4 Status banners
- [ ] Gray banner for draft if ever visible internally
- [ ] Yellow banner for unpaid
- [ ] Green banner for paid
- [ ] Red banner for void

### 17.5 View tracking
- [ ] Record first-view timestamp
- [ ] Transition `sent -> viewed` on first successful load
- [ ] Record every subsequent view event
- [ ] Keep view data internal for V1

### 17.6 PDF download rules
- [ ] Allow PDF download only when invoice unpaid
- [ ] Block PDF download when paid if following spec strictly
- [ ] Block PDF download when void if required by policy

---

## 18. Payments via Stripe Checkout

### 18.1 Checkout creation
- [ ] Create checkout session mutation
- [ ] Allow only for sent/viewed unpaid invoices
- [ ] Include invoice metadata in session
- [ ] Include organization metadata in session
- [ ] Configure card support
- [ ] Configure Apple Pay support
- [ ] Configure Google Pay support
- [ ] Configure tax input path

### 18.2 Success handling
- [ ] Redirect to marketing site success page
- [ ] Build payment success page UI
- [ ] Display payment received state

### 18.3 Webhook reconciliation
- [ ] Verify Stripe webhook signatures
- [ ] Handle checkout success event
- [ ] Mark invoice paid on verified payment
- [ ] Prevent double-processing and idempotency issues
- [ ] Save Stripe session/payment refs
- [ ] Log payment success

### 18.4 Failure handling
- [ ] Log failed payment attempts
- [ ] Surface retry path on public viewer

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
- [ ] Create invoice send email template
- [ ] Create payment receipt email template
- [ ] Create reminder email template

### 25.2 Core sends
- [ ] Send invoice email on invoice send
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
- [ ] Draft invoice backend
- [ ] Draft invoice mobile UI
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

