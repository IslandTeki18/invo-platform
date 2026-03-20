# Blueprint Document

## Invoicing Platform — Implementation Blueprint

This is a multi-app product with shared business logic, auth, billing, file storage, public invoice delivery, and admin tooling. The safest build order is:
 1. establish repo and shared contracts
 2. build backend domain and permission model
 3. build onboarding and organization lifecycle
 4. build core invoice creation flow
 5. build public invoice delivery and payments
 6. add email, PDF, attachments, and storage enforcement
 7. add membership, billing upgrades/downgrades, exports, admin tooling
 8. harden with limits, logs, and cleanup jobs

The system should be built vertically, not by isolated technical layer only. Each phase should end in something usable.

⸻

## 1. Build Strategy

### Product surfaces
- apps/mobile-app — primary authenticated product
- apps/invoice-viewer — public invoice experience on org subdomain
- apps/marketing-site — pricing, auth entry, payment success page
- apps/admin-panel — internal support/admin tools

### Shared packages
- packages/ui — cross-platform design primitives where feasible
- packages/utils — formatting, math, validation, permissions, storage helpers, token helpers
- packages/types — DTOs, enums, schema-derived types, shared API contracts

### Core dependencies between systems
- Clerk identity drives all authenticated user identity
- Convex is source of truth for app data, permissions, logs, rate limits, invitations
- Stripe Billing manages user subscription tier
- Stripe Checkout handles invoice payment
- Stripe Tax calculates invoice tax
- Resend handles outbound email
- storage quota logic sits in Convex and is enforced before file writes
- public invoice delivery depends on org subdomain + invoice token + invoice status

### Recommended delivery order
- foundation
- auth + users + organizations
- onboarding gate
- clients/items/expenses
- invoice draft flow
- invoice send flow
- public viewer
- payment flow
- PDF generation
- email + reminders
- attachments + storage quota
- memberships + invitations
- subscription enforcement
- admin panel
- exports/logging/security hardening
- final QA and release

---

## 2. System Design Blueprint

### 2.1 Domain Model

#### User
Represents authenticated account and billing owner.

**Key responsibilities:**
- Maps Clerk user to internal user record
- Stores subscription tier
- Enforces org count limit
- Owns user-level item presets

---

#### Organization
Represents workspace/business.

**Key responsibilities:**
- Contains operational data
- Has immutable random subdomain
- Stores business info and branding
- Stores storage usage
- Gates invoice sending until onboarding complete

---

#### Membership
Represents user access within an org.

**Key responsibilities:**
- Role assignment
- Permission enforcement
- Owner/admin continuity rules

---

#### Invitation
Represents pending org invitation.

**Key responsibilities:**
- Invite existing user by email
- Expires after 24 hours
- Revocable
- Role defaults to member

---

#### Client
Represents invoice recipient.

**Key responsibilities:**
- Org scoped
- Duplicate email blocked within org
- Archival instead of deletion

---

#### Item Preset
Represents reusable invoice line item template.

**Key responsibilities:**
- User scoped
- Invoice-safe deletion behavior

---

#### Expense
Represents reusable cost entry.

**Key responsibilities:**
- Org scoped
- May be attached to multiple invoices through duplication into invoice snapshot

---

#### Invoice
Represents commercial document and payment container.

**Key responsibilities:**
- Stores snapshots for immutable invoice rendering
- Manages lifecycle statuses
- Owns tokenized public access
- Links to payment and PDF artifacts

---

#### Invoice View Event
Represents public invoice views.

**Key responsibilities:**
- Append-only tracking
- Timestamped
- Internal only in V1

---

#### Log Event
Represents audit/system logging.

**Key responsibilities:**
- Event filtering in admin panel
- 30-day retention

---

#### Rate Limit Bucket
Represents usage throttle state.

**Key responsibilities:**
- Payment attempt enforcement
- Email send enforcement

---

### 2.2 Critical Architecture Decisions

#### Decision: Snapshot invoice data at send time

Do not rely only on live client/item/expense data when rendering sent invoices. Sent invoices should include:

- Client snapshot  
- Line item snapshot  
- Expense snapshot  
- Totals snapshot  
- Tax snapshot  
- Branding snapshot (if needed for exact historical rendering)

**Reason:**
- Future edits to client/items must not mutate historical sent invoices unexpectedly

---

#### Decision: Keep draft invoice editable, sent invoice controlled

Use two modes:

- Draft invoice → editable document builder  
- Sent / viewed / paid / void invoice → restricted update rules  

**Reason:**
- Avoids ambiguous historical payment records  
- Aligns with auditability  

---

#### Decision: Store money in integer cents everywhere

All monetary values:

- Unit price  
- Subtotal  
- Discount  
- Tax  
- Total  
- Expenses  

**Reason:**
- Avoids floating point errors  

---

#### Decision: Compute invoice totals in shared pure utility layer

One canonical invoice math engine used by:

- Mobile draft preview  
- Backend validation  
- Public viewer formatting  
- PDF generation  

**Reason:**
- Eliminates mismatch between surfaces  

---

#### Decision: Separate private file storage metadata from invoice snapshot refs

Files should have storage records with:

- orgId  
- owner entity type/id  
- size  
- mime type  
- storage path  
- visibility mode  
- uploadedAt  

**Reason:**
- Central quota enforcement  
- Simplifies cleanup on deletion  

---

## 3. Phase-by-Phase Blueprint

---

### Phase 0 — Foundation and Repo Setup

#### Goals
- Monorepo structure working
- Type-safe shared packages in place
- Local development stable
- CI basics established

#### Deliverables
- Turborepo configured
- App shells booting
- Packages linked
- Lint / typecheck / format scripts
- Environment variable strategy
- Deployment targets identified

#### Work
1. Initialize monorepo  
2. Create all app folders  
3. Create shared `ui`, `utils`, `types`  
4. Set TS project references or path aliasing  
5. Standardize ESLint, Prettier, TS configs  
6. Set env loading strategy per app  
7. Add basic CI pipeline:
   - install
   - lint
   - typecheck
   - build impacted apps  
8. Add branch protection and preview deployments  

#### Exit Criteria
- All apps run  
- Shared packages import cleanly  
- CI passes on empty app shells  

---

### Phase 1 — Backend Schema and Auth Foundation

#### Goals
- Internal user record exists  
- Org model exists  
- Membership and permission model exists  
- Clerk identity mapped into Convex  

#### Deliverables
- Convex schema for core entities  
- Auth helpers  
- Role permission helpers  
- Current user bootstrap flow  

#### Work
1. Define enums:
   - subscription tiers  
   - org roles  
   - invoice statuses  
   - invite statuses  
   - log event types  
2. Create Convex schema tables  
3. Add Clerk webhook or lazy-sync path to create internal user record  
4. Create current-user query  
5. Create organization creation mutation  
6. Create membership on org creation  
7. Implement org limit enforcement by subscription tier  
8. Create permission utility layer:
   - `canManageBilling`  
   - `canInviteMembers`  
   - `canSendInvoices`  
   - `canManageExpenses`  

#### Exit Criteria
- Authenticated user gets internal profile  
- User can create org within tier limit  
- Unauthorized access blocked at backend  

---

### Phase 2 — Onboarding and Organization Readiness

#### Goals
- Force minimal setup before sending invoices  
- Store org business data  
- Prepare Stripe connect dependency boundary  

#### Deliverables
- Onboarding state model  
- Org profile editor  
- Readiness checks  

#### Work
1. Create onboarding progress model  
2. Implement organization business info update  
3. Add immutable org subdomain generation  
4. Enforce subdomain uniqueness  
5. Add readiness helper:
   - org name present  
   - business address present  
   - Stripe connected  
6. Create UI gate in app  
7. Create onboarding completion screens  
8. Stub Stripe connect state  

#### Exit Criteria
- Org exists with immutable subdomain  
- Invoice sending blocked until ready  

---

### Phase 3 — Clients, Item Presets, Expenses

#### Goals
- Business data entry foundation exists  
- Invoice composer dependencies exist  

#### Deliverables
- CRUD for clients  
- CRUD for item presets  
- CRUD for expenses  
- Client archival behavior  

#### Work
1. Client create/edit/archive/restore  
2. Prevent duplicate email per org  
3. Item preset create/edit/delete  
4. User-scoped item presets  
5. Expense create/edit/archive  
6. Expense selection helpers  
7. List screens  
8. Validation and empty states  

#### Exit Criteria
- Data managed with role enforcement  
- Archived clients excluded from selection  

---

### Phase 4 — Draft Invoice System

#### Goals
- Draft invoices created in app  
- Centralized math rules  
- Stable data model before send  

#### Deliverables
- Invoice draft schema  
- Line item UI  
- Calculation engine  
- Draft list grouped by status  

#### Work
1. Define invoice schema  
2. Define snapshot substructures  
3. Implement math utility:
   - decimal quantities  
   - line rounding  
   - discount before tax  
4. Create draft mutation  
5. Build composer UI  
6. Add client picker  
7. Add line item CRUD  
8. Add expense attach flow  
9. Add discount selection  
10. Add tax structure  
11. Create preview query  
12. Create grouped invoice list  

#### Exit Criteria
- Draft creation works  
- Totals consistent across systems  
- Draft persists correctly  

---

### Phase 5 — Invoice Sending and Public Access

#### Goals
- Public invoice access via token  
- Status transitions active  

#### Deliverables
- Send mutation  
- Token generation  
- Public resolver  
- View tracking  
- Status transitions  

#### Work
1. Validate send:
   - role allowed  
   - org ready  
   - client email exists  
   - total valid  
2. Generate 32-char token  
3. Build public URL  
4. Set status → sent  
5. Record timestamp  
6. Public lookup by:
   - subdomain  
   - invoiceId  
   - token  
7. Mark first view  
8. Append view events  
9. Disable access when void  
10. Viewer states:
   - unpaid  
   - paid  
   - void  

#### Exit Criteria
- Token required for access  
- First view updates status  
- Void disables actions  

---

### Phase 6 — Stripe Checkout and Payment Lifecycle

#### Goals
- Online payments enabled  
- Safe reconciliation  
- Abuse prevention  

#### Deliverables
- Checkout session  
- Webhook handling  
- Success page  
- Rate limiting  

#### Work
1. Create checkout session  
2. Attach invoice metadata  
3. Configure Stripe Tax  
4. Redirect success page  
5. Handle webhook  
6. Mark paid once  
7. Store Stripe references  
8. Manual paid flow  
9. Rate limit:
   - 10/hour  
   - 15-minute lock  
10. Log failures  
11. Update viewer  

#### Exit Criteria
- Payments succeed  
- Webhook idempotent  
- Abuse limited  

---

### Phase 7 — PDF Generation

#### Goals
- Reliable PDF generation  
- Consistent with viewer  

#### Deliverables
- HTML rendering layer  
- PDF pipeline  
- Cache system  
- File metadata  

#### Work
1. Define render model  
2. Build template component  
3. Server render function  
4. PDF generator  
5. Store file record  
6. Generate on send  
7. Generate on preview  
8. Add 5-minute cache  
9. Restrict download when paid rules apply  
10. Ensure branding correctness  

#### Exit Criteria
- PDF matches viewer  
- Cache reused properly  

---

### Phase 8 — Attachments, Logos, Storage, Quotas

#### Goals
- Safe file handling  
- Tier-based limits  

#### Deliverables
- Upload pipeline  
- Validation  
- Quota enforcement  
- Cleanup system  

#### Work
1. File metadata table  
2. Quota helper  
3. Validate types:
   - images  
   - PDFs  
4. Max 2 files per invoice  
5. Max 5MB each  
6. Enforce quota  
7. Org logo upload  
8. Line item images  
9. Invoice attachments  
10. Count PDFs in quota  
11. Decrement on delete  

#### Exit Criteria
- Storage tracked accurately  
- Over-quota blocked  

---

### Phase 9 — Email System and Reminders

#### Goals
- Safe email delivery  
- Controlled reminders  

#### Deliverables
- Send email  
- Receipt email  
- Reminder scheduler  
- Rate limits  

#### Work
1. Design templates  
2. Send invoice email  
3. Send receipt  
4. Add scheduler  
5. Scheduled job:
   - 3 days before  
   - due date  
6. Suppress if paid/void  
7. Rate limit:
   - 50/hour  
8. No auto retry  
9. Log attempts  
10. Resend action  

#### Exit Criteria
- Emails deliver  
- Reminders stop on payment  

---

### Phase 10 — Memberships and Invitations

#### Goals
- Team management  
- Safe role handling  

#### Deliverables
- Invitation system  
- Accept page  
- Member UI  
- Role rules  

#### Work
1. Create invite  
2. Require existing user  
3. Expire after 24h  
4. Revoke support  
5. Accept page  
6. Require auth  
7. Create membership  
8. Deep link to app  
9. Remove members  
10. Change roles  
11. Enforce:
   - owner cannot be removed  
   - at least one admin remains  
12. Leave org  
13. Owner leave triggers delete flow  

#### Exit Criteria
- Full invite lifecycle  
- No orphan orgs  

---

### Phase 11 — Subscription Billing and Org Limits

#### Goals
- Tier-based constraints  
- Controlled downgrade  

#### Deliverables
- Stripe Billing  
- Sync system  
- Downgrade workflow  
- Grace logic  

#### Work
1. Map Stripe → internal tier  
2. Sync via webhook  
3. Enforce org limits  
4. Enforce storage limits  
5. Handle upgrades  
6. Calculate excess on downgrade  
7. Require org selection for deletion  
8. Mark read-only during 7-day grace  
9. Schedule deletion  
10. Cancel if upgraded  

#### Exit Criteria
- Tier enforcement correct  
- Downgrade deterministic  

---

### Phase 12 — Data Export and Org Deletion

#### Goals
- Safe destructive actions  
- Full data removal  

#### Deliverables
- JSON export  
- Delete workflow  
- Cleanup jobs  

#### Work
1. Build export assembler  
2. Include:
   - clients  
   - invoices  
   - expenses  
   - memberships  
   - logs  
3. Export endpoint/job  
4. Require name confirmation  
5. Hard delete data  
6. Delete files  
7. Remove Stripe references  
8. Log deletion  

#### Exit Criteria
- Export complete  
- No orphan data  

---

### Phase 13 — Dashboard and Usability

#### Goals
- Daily usability  
- Operational visibility  

#### Deliverables
- Dashboard  
- Recent invoices  
- Unpaid totals  
- Quick actions  
- Theme support  
- Biometric unlock  

#### Work
1. Aggregation queries  
2. Quick actions  
3. Recent list  
4. Unpaid widgets  
5. Grouped invoice list  
6. Theme support  
7. Viewer theme sync  
8. Biometric unlock  
9. Persistent login  

#### Exit Criteria
- Full daily workflow supported  

---

### Phase 14 — Admin Panel

#### Goals
- Internal support tooling  

#### Deliverables
- User search  
- Invoice search  
- Logs viewer  
- Refund trigger  
- Impersonation  
- User deletion  

#### Work
1. Admin auth boundary  
2. Search users  
3. Search invoices  
4. Log filtering  
5. Refund flow  
6. Impersonation with audit  
7. Delete users  
8. Block invoice editing  

#### Exit Criteria
- Support without DB access  

---

### Phase 15 — Logging, Security, Cleanup, Release Hardening

#### Goals
- Auditability  
- Abuse resistance  
- Production readiness  

#### Deliverables
- Central logs  
- Cleanup jobs  
- Retention rules  
- QA matrix  

#### Work
1. Log helper  
2. Log:
   - payments  
   - emails  
   - auth  
   - invoice changes  
   - membership changes  
3. 30-day retention job  
4. Verify token entropy  
5. Verify access control  
6. Verify rate limits  
7. Test destructive actions  
8. Test failure cases  
9. Add monitoring hooks  

#### Exit Criteria
- Production-ready baseline  
- Safe failure handling  

---

## 4. Initial Chunk Breakdown

These are the first-pass implementation chunks. Each chunk should leave the repo in a working state.

### Chunk 1 — Monorepo Foundation
Repo, apps, packages, tooling, CI.

### Chunk 2 — Auth and Internal User Bootstrap
Clerk to Convex identity sync, current user query, user tier model.

### Chunk 3 — Organizations and Memberships
Org creation, membership records, role utilities, org limit enforcement.

### Chunk 4 — Onboarding and Org Settings
Business info, immutable subdomain, readiness gating.

### Chunk 5 — Clients, Items, Expenses
CRUD and validation for supporting invoice entities.

### Chunk 6 — Draft Invoice Composer
Invoice schema, line items, totals engine, mobile invoice draft UI.

### Chunk 7 — Invoice Send and Public Link
Token generation, sent transition, public viewer foundation.

### Chunk 8 — Stripe Checkout and Paid Status
Checkout session, webhook reconciliation, success page.

### Chunk 9 — PDF Generation
Shared HTML invoice template, server render, preview/send generation.

### Chunk 10 — Attachments and Storage Quotas
Uploads, validation, quota accounting, logo support.

### Chunk 11 — Email System
Invoice email, receipt email, reminders, resend flow, rate limits.

### Chunk 12 — Invitations and Membership Management
Invite, accept, revoke, role changes, leave/remove rules.

### Chunk 13 — Billing Tiers and Downgrade Grace
Stripe Billing sync, org overage handling, grace state.

### Chunk 14 — Export and Deletion
JSON export, destructive delete flow, cleanup.

### Chunk 15 — Admin Panel and Logs
Search, refund trigger, impersonation, event filtering.

### Chunk 16 — Security Hardening and Final QA
Rate limit completion, retention jobs, full regression pass.

---

## 5. Second-Pass Breakdown Into Smaller Iterative Chunks

Now reduce the chunk size further so each one is safe and testable.

### Iteration A — Foundation
1. Create monorepo folders and base package manifests  
2. Add TS configs and path aliasing  
3. Add lint / format / typecheck scripts  
4. Boot empty mobile / web / admin apps  
5. Verify shared package imports  
6. Add CI  

---

### Iteration B — Identity and Permissions
7. Add Clerk integration to mobile / web shells  
8. Create internal user table  
9. Add user bootstrap sync  
10. Add subscription tier enums and defaults  
11. Create membership and role enums  
12. Create permission helper functions  
13. Write backend auth guards  

---

### Iteration C — Organizations
14. Create org schema  
15. Implement org creation mutation  
16. Generate immutable random subdomain  
17. Enforce subdomain uniqueness  
18. Create owner membership on org creation  
19. Enforce org count limit by tier  
20. Add org picker / current-org state  

---

### Iteration D — Onboarding
21. Add org settings fields  
22. Add business info form  
23. Add onboarding status query  
24. Add readiness validator  
25. Block send actions when incomplete  
26. Create setup checklist UI  

---

### Iteration E — Supporting Entities
27. Add client schema and validation  
28. Build client create / edit / archive flow  
29. Enforce duplicate email block  
30. Add item preset schema and CRUD  
31. Add expense schema and CRUD  
32. List screens for clients / items / expenses  

---

### Iteration F — Invoice Draft Core
33. Add invoice schema  
34. Add line item substructure  
35. Add expense snapshot structure  
36. Implement money helpers  
37. Implement line-level rounding  
38. Implement discount math  
39. Implement tax-before-total order correctly  
40. Create draft invoice mutation  
41. Create invoice edit mutation  
42. Create invoice preview query  

---

### Iteration G — Invoice Composer UI
43. Create draft invoice screen shell  
44. Add client selector  
45. Add line item editor  
46. Add expense attach flow  
47. Add discount input  
48. Add totals summary  
49. Save and reload draft state  
50. List drafts grouped by status  

---

### Iteration H — Send Flow and Public Viewer
51. Add send invoice validation  
52. Generate invoice token  
53. Generate public URL  
54. Mark status sent  
55. Create public invoice fetch route  
56. Validate token / subdomain / invoice match  
57. Add first-view tracking  
58. Mark invoice viewed on first load  
59. Render public invoice states  

---

### Iteration I — Payments
60. Create checkout session mutation  
61. Attach Stripe metadata  
62. Add payment success page  
63. Implement webhook signature verification  
64. Mark invoice paid on successful webhook  
65. Save payment refs  
66. Add manual mark-paid flow  
67. Add payment attempt limit and lock  

---

### Iteration J — PDFs
68. Build shared invoice render model  
69. Create HTML invoice template  
70. Add server-side render function  
71. Add PDF generation endpoint / job  
72. Store generated PDF metadata  
73. Generate on send  
74. Add preview generation  
75. Add 5-minute cache  
76. Restrict PDF download when paid / void per spec  

---

### Iteration K — Files and Quotas
77. Create file metadata schema  
78. Add upload validation  
79. Add attachment count limit  
80. Add attachment size / type limit  
81. Add org logo upload  
82. Add invoice attachments  
83. Add line item image refs  
84. Add storage quota accounting  
85. Block uploads over tier quota  
86. Implement delete cleanup and quota decrement  

---

### Iteration L — Emails
87. Create email templates  
88. Send invoice email on send  
89. Send payment receipt on pay  
90. Create reminder job model  
91. Schedule reminder jobs  
92. Suppress reminders when paid  
93. Add resend flow  
94. Add org email hourly limit  
95. Log email failures  

---

### Iteration M — Team Management
96. Add invitation schema  
97. Validate invited email belongs to existing user  
98. Add create invite mutation  
99. Add revoke mutation  
100. Add 24-hour expiry enforcement  
101. Build invite accept page  
102. Create membership on accept  
103. Deep link to mobile app  
104. Add role change flow  
105. Add remove member flow  
106. Enforce admin / owner continuity rules  
107. Add leave org flow  
108. Add owner-leave delete flow  

---

### Iteration N — Subscription and Downgrade
109. Integrate Stripe Billing for account subscriptions  
110. Sync tier from Stripe webhooks  
111. Update org limit enforcement from live tier  
112. Update storage quota enforcement from live tier  
113. Implement downgrade detection  
114. Add org selection for deletion  
115. Mark excess orgs read-only  
116. Add 7-day grace scheduler  
117. Auto-delete after grace  
118. Cancel pending deletion on upgrade  

---

### Iteration O — Admin and Operations
119. Add log schema and helper  
120. Log core event types  
121. Build admin auth boundary  
122. User search  
123. Invoice search  
124. Log filtering UI  
125. Refund trigger  
126. Impersonation with audit logging  
127. User deletion  
128. Add 30-day log retention cleanup  

---

### Iteration P — Export, Deletion, Polish
129. JSON export assembler  
130. Export trigger / download flow  
131. Org delete confirmation by name  
132. Hard delete org data / files / refs  
133. Dashboard aggregates  
134. Unpaid widgets  
135. Recent invoice list  
136. Theme support  
137. Biometric unlock  
138. Regression testing and production checklist  

---

## 6. Third-Pass Breakdown Into Right-Sized Implementation Steps

This is the practical build queue. Each step is small enough for one focused implementation cycle, but large enough to create forward movement.

---

### Stage 1 — Repository and Tooling
1. Initialize Turborepo and root scripts  
2. Create app shells for `mobile`, `invoice-viewer`, `marketing-site`, `admin-panel`  
3. Create `ui`, `utils`, `types` packages  
4. Wire TypeScript path aliases and shared build config  
5. Add lint, format, typecheck, test command scaffolding  
6. Add CI pipeline for lint + typecheck + build  

---

### Stage 2 — Shared Contracts
7. Define shared enums for tiers, roles, invoice status, log types  
8. Define shared money, invoice, client, org DTO types  
9. Create validation schemas for major entities  
10. Create shared utility modules:
   - money conversion  
   - invoice calculations  
   - token generation  
   - permission checks  

---

### Stage 3 — Auth Bootstrap
11. Integrate Clerk in authenticated app shells  
12. Create Convex user table  
13. Create user bootstrap mutation / query path  
14. Map Clerk user to internal user on first auth  
15. Store default subscription tier and org count limit  
16. Expose current authenticated user query  

---

### Stage 4 — Organization Core
17. Create organization table / schema  
18. Create membership table / schema  
19. Build organization creation mutation  
20. Generate immutable 12-char random subdomain  
21. Ensure subdomain uniqueness before insert  
22. Create owner membership automatically  
23. Enforce tier-based org count cap  
24. Build current organization selection / query logic  

---

### Stage 5 — Role Enforcement
25. Implement backend permission guards per role  
26. Create reusable role-check helpers for org actions  
27. Write tests for owner / admin / member access boundaries  
28. Apply guards to organization, client, and invoice mutations  

---

### Stage 6 — Onboarding
29. Add org fields: business address, logo, storage used, tier  
30. Create business information update flow  
31. Create onboarding readiness query  
32. Add placeholder Stripe connected field / state  
33. Block invoice-send mutation when org incomplete  
34. Build onboarding checklist UI in mobile app  

---

### Stage 7 — Client Management
35. Create client schema  
36. Add create client mutation with required email validation  
37. Block duplicate client email within org  
38. Add edit client mutation  
39. Add archive and restore behavior  
40. Build client list and edit screens  

---

### Stage 8 — Item Presets
41. Create item preset schema at user level  
42. Add create / edit / delete item preset mutations  
43. Build item preset picker UI  
44. Confirm deleting preset never mutates invoices  

---

### Stage 9 — Expenses
45. Create expense schema  
46. Add expense CRUD mutations  
47. Build expense list / create / edit screens  
48. Add expense selection support for invoice drafts  

---

### Stage 10 — Invoice Math Engine
49. Implement cents-based money helpers  
50. Implement decimal quantity handling  
51. Implement line-total rounding at item level  
52. Implement discount ordering  
53. Implement tax-after-discount calculation structure  
54. Add test coverage for math edge cases  

---

### Stage 11 — Invoice Schema
55. Create invoice table / schema  
56. Store client snapshot  
57. Store line item snapshots  
58. Store expense snapshots  
59. Store totals and invoice status  
60. Add created / updated timestamps and edited flag  

---

### Stage 12 — Draft Invoice Backend
61. Add create draft invoice mutation  
62. Add update draft invoice mutation  
63. Add fetch invoice detail query  
64. Add invoice list query grouped by status  
65. Sort newest first within groups  

---

### Stage 13 — Draft Composer UI
66. Build invoice draft screen scaffold  
67. Add client picker  
68. Add line item add / edit / remove flow  
69. Add preset-to-line-item insertion  
70. Add expense attach flow  
71. Add discount editor  
72. Add totals preview panel  
73. Save draft changes and restore on reload  

---

### Stage 14 — Invoice Send Transition
74. Add send validation rules  
75. Generate 32-char hex access token  
76. Generate public invoice URL from org subdomain + invoiceId + token  
77. Transition invoice status to sent  
78. Save sent timestamp and initial Stripe session placeholder  

---

### Stage 15 — Public Invoice Viewer Foundation
79. Set up `invoice-viewer` routing for org subdomain and invoice route  
80. Fetch invoice by subdomain + id + token  
81. Reject invalid token or invoice mismatch  
82. Render unpaid / paid / void state shells  
83. Render line items, expenses, attachments placeholders  
84. Record first view and update status to viewed  
85. Append view log on each load  

---

### Stage 16 — Checkout Integration
86. Create Stripe Checkout session mutation  
87. Allow only sent / viewed unpaid invoices  
88. Add supported payment methods  
89. Attach invoice / org metadata for reconciliation  
90. Redirect to marketing success page  
91. Persist checkout session reference on invoice  

---

### Stage 17 — Payment Reconciliation
92. Verify Stripe webhook signatures  
93. Handle checkout success webhook  
94. Mark invoice paid only once  
95. Save payment metadata  
96. Update public viewer banner to paid  
97. Send receipt trigger event  

---

### Stage 18 — Manual Payment Flow
98. Add manual mark-paid mutation for authorized roles  
99. Require payment method selection: `cash` / `check` / `other`  
100. Store manual payment note / metadata  
101. Update invoice status and logs  

---

### Stage 19 — Payment Abuse Protection
102. Create payment attempt rate-limit record model  
103. Count attempts per invoice / token / IP strategy as chosen  
104. Lock after 10 attempts per hour  
105. Enforce 15-minute lock window  
106. Show lock message in viewer  
107. Log failed attempts  

---

### Stage 20 — HTML / PDF Rendering
108. Build shared invoice render component from normalized invoice data  
109. Ensure same data shape serves viewer and PDF generator  
110. Implement server-side HTML render  
111. Implement PDF generation routine  
112. Generate PDF on send  
113. Generate preview on demand  
114. Cache preview for 5 minutes  
115. Store PDF file metadata and filename  

---

### Stage 21 — Attachments and Branding
116. Create file upload metadata model  
117. Validate mime types and size  
118. Enforce max 2 attachments per invoice  
119. Add org logo upload flow  
120. Add invoice attachment upload flow  
121. Render attachments in public invoice viewer  
122. Render logo and line-item images in HTML / PDF  

---

### Stage 22 — Storage Quota Enforcement
123. Define quota per tier  
124. Compute storage usage from file records  
125. Increment usage on upload / store  
126. Decrement usage on delete  
127. Block over-quota uploads with clear error  
128. Count PDFs, logos, item images, attachments toward usage  

---

### Stage 23 — Email Delivery
129. Build invoice send email template  
130. Build payment receipt email template  
131. Send invoice email from send flow  
132. Send payment receipt from payment confirmation flow  
133. Add resend invoice email action in mobile app  

---

### Stage 24 — Reminder System
134. Add due date support if not already present in invoice model  
135. Schedule 3-days-before reminder job  
136. Schedule due-date reminder job  
137. Suppress / cancel reminders if invoice paid or void  
138. Log reminder attempts and failures  

---

### Stage 25 — Email Rate Limiting
139. Create org email limit model  
140. Enforce 50 emails / hour per org  
141. Return limit error with no auto retry  
142. Log blocked sends  

---

### Stage 26 — Invitations
143. Create invitation table / schema  
144. Add create invitation mutation  
145. Validate invited email belongs to existing user  
146. Add revoke invitation mutation  
147. Enforce 24-hour expiration at accept time  
148. Build invite acceptance page on web  
149. Require Clerk auth on accept  
150. Create membership and consume invite  
151. Deep link to mobile app after acceptance  

---

### Stage 27 — Membership Management
152. Build members list UI  
153. Add role change action  
154. Add remove member action  
155. Block owner removal  
156. Enforce at least one admin / owner remains  
157. Add leave organization flow  
158. Make owner-leave route go through org deletion confirmation  

---

### Stage 28 — Subscription Billing
159. Create Stripe Billing products / prices  
160. Integrate account subscription checkout / portal  
161. Sync active tier to user record via webhook  
162. Update org count limit from active tier  
163. Update storage quota from active tier  

---

### Stage 29 — Downgrade Grace Flow
164. Detect over-limit state after downgrade  
165. Prompt user to choose orgs to keep / delete  
166. Mark excess orgs read-only  
167. Schedule 7-day grace expiration  
168. Auto-delete excess orgs after grace  
169. Cancel scheduled deletion if upgraded during grace  

---

### Stage 30 — Dashboard
170. Add unpaid total aggregate query  
171. Add unpaid invoice count query  
172. Add recent invoices query limited to 5  
173. Build quick actions for create invoice and add client  

---

### Stage 31 — Export and Destructive Actions
174. Assemble org JSON export payload  
175. Create export request / download flow  
176. Build org deletion confirmation requiring typed org name  
177. Hard delete invoices, clients, expenses, memberships, files  
178. Remove storage artifacts and Stripe refs  
179. Write deletion log  

---

### Stage 32 — Logging and Admin Panel
180. Create centralized log helper  
181. Write logs for payments, email, auth, invoice changes, membership changes  
182. Build admin auth boundary  
183. Add user search  
184. Add invoice search  
185. Add log filtering by event type  
186. Add refund trigger flow  
187. Add impersonation with audit log  
188. Add delete-user action  
189. Add 30-day log cleanup job  

---

### Stage 33 — Themes and Mobile Security
190. Add mobile dark / light mode support  
191. Add viewer system theme detection  
192. Add biometric unlock  
193. Verify persistent login behavior and logout rules  

---

### Stage 34 — Final Hardening
194. Write end-to-end tests for core invoice flow  
195. Write access-control regression tests  
196. Test all rate-limit paths  
197. Test file quota boundaries  
198. Test downgrade grace and auto-delete  
199. Test public invoice security with invalid tokens / subdomains  
200. Prepare production release checklist  

---

## 7. Final Recommended Build Order for Real Execution

This is the order that minimizes rework and keeps vertical slices working.

### Milestone 1 — Working Authenticated Skeleton
**Steps 1–28**

**Outcome:**
- Apps boot  
- Auth works  
- Orgs and memberships exist  
- Onboarding gate exists  

---

### Milestone 2 — Core Business Data
**Steps 29–48**

**Outcome:**
- Clients, items, expenses ready  
- Invoice math engine stable  

---

### Milestone 3 — Draft Invoicing
**Steps 49–73**

**Outcome:**
- Draft invoices can be created and edited from mobile  

---

### Milestone 4 — Send and Public Invoice
**Steps 74–85**

**Outcome:**
- Invoices can be sent and viewed publicly  

---

### Milestone 5 — Payments
**Steps 86–107**

**Outcome:**
- Invoices can be paid online or marked paid manually  
- Abuse controls exist  

---

### Milestone 6 — PDFs and Files
**Steps 108–128**

**Outcome:**
- PDFs generate  
- Uploads work  
- Quotas enforced  

---

### Milestone 7 — Email and Reminders
**Steps 129–142**

**Outcome:**
- Send emails, receipts, reminders, resend flow  

---

### Milestone 8 — Team Features
**Steps 143–158**

**Outcome:**
- Invitations and team management complete  

---

### Milestone 9 — Billing Enforcement
**Steps 159–169**

**Outcome:**
- Paid tiers, limits, downgrade grace fully active  

---

### Milestone 10 — Operations and Finish
**Steps 170–200**

**Outcome:**
- Dashboard, exports, deletion, admin panel, themes, security, release readiness  

---

## 8. Risk Areas That Need Early Discipline

### Invoice Mutability
Do not let sent / paid invoices behave like drafts. Define edit policy early.

### Stripe Ownership Model Ambiguity
Your spec mentions Stripe Connect setup and also Stripe Checkout for invoice payments. Decide early whether:

- Platform collects payments, or  
- Each org receives payments directly through connected accounts  

This affects onboarding, checkout, refunds, tax, and payout responsibility.

### Public Subdomain Routing
Multi-subdomain app routing needs early validation in hosting / deployment. Do not wait until late stage.

### PDF Generation Environment
Server-side HTML-to-PDF must be tested in actual deployment environment early.

### File Storage Quota Accounting
Do not compute storage usage only from cached counters without reconciliation tooling. Add a periodic reconciliation path later if possible.

### Organization Deletion During Downgrade
Auto-delete is destructive. Require clear scheduling and audit logs.

### Owner Leave = Org Delete
This is dangerous behavior. Implement very explicit confirmation flow and logging.

---

## 9. Definition of Done Per Major Area

### Organization System
**Done when:**
- User can create org within tier limit  
- Owner membership created automatically  
- Immutable subdomain assigned  
- Readiness state computed correctly  

---

### Invoice Drafting
**Done when:**
- Authorized users create / edit drafts  
- Totals match expected calculations  
- Grouped invoice list works  

---

### Invoice Sending
**Done when:**
- Only valid invoices can be sent  
- Public token URL resolves invoice securely  
- First view changes status to viewed  

---

### Payments
**Done when:**
- Checkout session created only for eligible invoices  
- Successful payment marks invoice paid through webhook  
- Duplicate webhooks do not double-process  

---

### PDFs
**Done when:**
- Preview generates  
- Send triggers stored PDF  
- PDF content matches public invoice content  

---

### Emails
**Done when:**
- Send email, receipt, and reminders work  
- Rate limit enforced  
- No reminders after paid  

---

### Memberships
**Done when:**
- Invite, accept, revoke, role change, remove, leave all work  
- Continuity rules enforced  

---

### Billing
**Done when:**
- User tier syncs from Stripe  
- Org limits and storage quotas reflect tier  
- Downgrade grace state behaves exactly as specified  

---

### Admin
**Done when:**
- Support can search, inspect logs, refund, impersonate  
- Invoice editing remains disabled  

---

## 10. Best First Sprint

Start here:

1. Steps 1–6 → repo / tooling  
2. Steps 7–10 → shared contracts  
3. Steps 11–16 → auth bootstrap  
4. Steps 17–24 → organization core  
5. Steps 25–28 → role enforcement  
6. Steps 29–34 → onboarding  

**Outcome:**
- Stable foundation before invoice complexity  

---

## 11. Best Second Sprint

1. Steps 35–48 → clients / items / expenses / math  
2. Steps 55–73 → invoice schema + draft backend + draft UI  

**Outcome:**
- Usable internal MVP with draft creation  

---

## 12. Best Third Sprint

1. Steps 74–97 → send flow + public viewer + Stripe payment  
2. Steps 108–115 → PDF generation  

**Outcome:**
- First customer-facing slice  

---

## 13. Best Fourth Sprint

1. Steps 116–142 → files + quotas + email + reminders  
2. Steps 143–158 → invitations + membership management  

**Outcome:**
- Transition from MVP to operational product  

---

## 14. Best Fifth Sprint

1. Steps 159–200 → billing enforcement, exports, admin, hardening  

**Outcome:**
- Commercialization and support tooling complete  