Blueprint Document

Invoicing Platform — Implementation Blueprint

This is a multi-app product with shared business logic, auth, billing, file storage, public invoice delivery, and admin tooling. The safest build order is:
	1.	establish repo and shared contracts
	2.	build backend domain and permission model
	3.	build onboarding and organization lifecycle
	4.	build core invoice creation flow
	5.	build public invoice delivery and payments
	6.	add email, PDF, attachments, and storage enforcement
	7.	add membership, billing upgrades/downgrades, exports, admin tooling
	8.	harden with limits, logs, and cleanup jobs

The system should be built vertically, not by isolated technical layer only. Each phase should end in something usable.

⸻

1. Build Strategy

Product surfaces
	•	apps/mobile-app — primary authenticated product
	•	apps/invoice-viewer — public invoice experience on org subdomain
	•	apps/marketing-site — pricing, auth entry, payment success page
	•	apps/admin-panel — internal support/admin tools

Shared packages
	•	packages/ui — cross-platform design primitives where feasible
	•	packages/utils — formatting, math, validation, permissions, storage helpers, token helpers
	•	packages/types — DTOs, enums, schema-derived types, shared API contracts

Core dependencies between systems
	•	Clerk identity drives all authenticated user identity
	•	Convex is source of truth for app data, permissions, logs, rate limits, invitations
	•	Stripe Billing manages user subscription tier
	•	Stripe Checkout handles invoice payment
	•	Stripe Tax calculates invoice tax
	•	Resend handles outbound email
	•	storage quota logic sits in Convex and is enforced before file writes
	•	public invoice delivery depends on org subdomain + invoice token + invoice status

Recommended delivery order
	•	foundation
	•	auth + users + organizations
	•	onboarding gate
	•	clients/items/expenses
	•	invoice draft flow
	•	invoice send flow
	•	public viewer
	•	payment flow
	•	PDF generation
	•	email + reminders
	•	attachments + storage quota
	•	memberships + invitations
	•	subscription enforcement
	•	admin panel
	•	exports/logging/security hardening
	•	final QA and release

⸻

2. System Design Blueprint

2.1 Domain model

User

Represents authenticated account and billing owner.

Key responsibilities:
	•	maps Clerk user to internal user record
	•	stores subscription tier
	•	enforces org count limit
	•	owns user-level item presets

Organization

Represents workspace/business.

Key responsibilities:
	•	contains operational data
	•	has immutable random subdomain
	•	stores business info and branding
	•	stores storage usage
	•	gates invoice sending until onboarding complete

Membership

Represents user access within an org.

Key responsibilities:
	•	role assignment
	•	permission enforcement
	•	owner/admin continuity rules

Invitation

Represents pending org invitation.

Key responsibilities:
	•	invite existing user by email
	•	expires after 24 hours
	•	revocable
	•	role defaults to member

Client

Represents invoice recipient.

Key responsibilities:
	•	org scoped
	•	duplicate email blocked within org
	•	archival instead of deletion

Item Preset

Represents reusable invoice line item template.

Key responsibilities:
	•	user scoped
	•	invoice-safe deletion behavior

Expense

Represents reusable cost entry.

Key responsibilities:
	•	org scoped
	•	may be attached to multiple invoices through duplication into invoice snapshot

Invoice

Represents commercial document and payment container.

Key responsibilities:
	•	stores snapshots for immutable invoice rendering
	•	manages lifecycle statuses
	•	owns tokenized public access
	•	links to payment and PDF artifacts

Invoice View Event

Represents public invoice views.

Key responsibilities:
	•	append-only tracking
	•	timestamped
	•	internal only in V1

Log Event

Represents audit/system logging.

Key responsibilities:
	•	event filtering in admin panel
	•	30-day retention

Rate Limit Bucket

Represents usage throttle state.

Key responsibilities:
	•	payment attempt enforcement
	•	email send enforcement

⸻

2.2 Critical architecture decisions

Decision: snapshot invoice data at send time

Do not rely only on live client/item/expense data when rendering sent invoices. Sent invoices should include:
	•	client snapshot
	•	line item snapshot
	•	expense snapshot
	•	totals snapshot
	•	tax snapshot
	•	branding snapshot if needed for exact historical rendering

Reason:
	•	future edits to client/items must not mutate historical sent invoices unexpectedly

Decision: keep draft invoice editable, sent invoice controlled

Use two modes:
	•	draft invoice: editable document builder
	•	sent/viewed/paid/void invoice: restricted update rules

Reason:
	•	avoids ambiguous historical payment records
	•	aligns with auditability

Decision: store money in integer cents everywhere

All monetary values:
	•	unit price
	•	subtotal
	•	discount
	•	tax
	•	total
	•	expenses

Reason:
	•	avoids floating point errors

Decision: compute invoice totals in shared pure utility layer

One canonical invoice math engine used by:
	•	mobile draft preview
	•	backend validation
	•	public viewer formatting
	•	PDF generation

Reason:
	•	eliminates mismatch between surfaces

Decision: separate private file storage metadata from invoice snapshot refs

Files should have storage records with:
	•	orgId
	•	owner entity type/id
	•	size
	•	mime type
	•	storage path
	•	visibility mode
	•	uploadedAt

Reason:
	•	central quota enforcement
	•	simplifies cleanup on deletion

⸻

3. Phase-by-Phase Blueprint

Phase 0 — Foundation and repo setup

Goals
	•	monorepo structure working
	•	type-safe shared packages in place
	•	local development stable
	•	CI basics established

Deliverables
	•	Turborepo configured
	•	app shells booting
	•	packages linked
	•	lint/typecheck/format scripts
	•	environment variable strategy
	•	deployment targets identified

Work
	1.	initialize monorepo
	2.	create all app folders
	3.	create shared ui, utils, types
	4.	set TS project references or path aliasing
	5.	standardize ESLint, Prettier, TS configs
	6.	set env loading strategy per app
	7.	add basic CI pipeline:
	•	install
	•	lint
	•	typecheck
	•	build impacted apps
	8.	add branch protection and preview deployments

Exit criteria
	•	all apps run
	•	shared packages import cleanly
	•	CI passes on empty app shells

⸻

Phase 1 — Backend schema and auth foundation

Goals
	•	internal user record exists
	•	org model exists
	•	membership and permission model exists
	•	Clerk identity mapped into Convex

Deliverables
	•	Convex schema for core entities
	•	auth helpers
	•	role permission helpers
	•	current user bootstrap flow

Work
	1.	define enums:
	•	subscription tiers
	•	org roles
	•	invoice statuses
	•	invite statuses
	•	log event types
	2.	create Convex schema tables
	3.	add Clerk webhook or lazy-sync path to create internal user record
	4.	create current-user query
	5.	create organization creation mutation
	6.	create membership creation on org creation
	7.	implement org limit enforcement by user subscription tier
	8.	create permission utility layer:
	•	canManageBilling
	•	canInviteMembers
	•	canSendInvoices
	•	canManageExpenses
	•	etc.

Exit criteria
	•	authenticated user gets internal profile
	•	user can create org within tier limit
	•	unauthorized role access blocked on backend

⸻

Phase 2 — Onboarding and organization readiness

Goals
	•	force minimal setup before sending invoices
	•	store org business data
	•	prepare Stripe connect dependency boundary

Deliverables
	•	onboarding state model
	•	org profile editor
	•	readiness checks

Work
	1.	create onboarding progress model
	2.	implement organization business info update
	3.	add immutable org subdomain generation at creation
	4.	add subdomain uniqueness enforcement
	5.	add readiness helper:
	•	org name present
	•	business address present
	•	Stripe connected
	6.	create UI gate in mobile app/dashboard
	7.	create onboarding completion screens
	8.	stub Stripe connect integration state if full connect arrives later in sequence

Exit criteria
	•	org exists with immutable subdomain
	•	invoice sending blocked until readiness true

⸻

Phase 3 — Clients, item presets, expenses

Goals
	•	business data entry foundation exists
	•	invoice composer has supporting entities

Deliverables
	•	CRUD for clients
	•	CRUD for item presets
	•	CRUD for expenses
	•	archival behavior for clients

Work
	1.	client create/edit/archive/restore
	2.	duplicate email prevention within org
	3.	item preset create/edit/delete
	4.	item preset user-level scoping
	5.	expense create/edit/archive if needed
	6.	expense selection helpers for invoice building
	7.	list screens in mobile app
	8.	basic validation and empty states

Exit criteria
	•	org user can manage clients/items/expenses with role enforcement
	•	archived clients hidden from invoice selection

⸻

Phase 4 — Draft invoice system

Goals
	•	create invoice drafts in mobile app
	•	math rules centralized
	•	invoice data model stable before send flow

Deliverables
	•	invoice draft schema
	•	line item editing UI
	•	discount/tax/total calculation engine
	•	draft invoice list grouped by status

Work
	1.	define invoice schema
	2.	define line item and expense snapshot substructures
	3.	implement invoice math utility:
	•	decimal quantity support
	•	line-level rounding
	•	discount before tax
	4.	create draft invoice mutation
	5.	build invoice composer UI
	6.	add client picker
	7.	add line items add/edit/remove/reorder
	8.	add expenses attach flow
	9.	add discount selection
	10.	add tax configuration placeholder/data structure
	11.	create invoice preview query
	12.	create invoice list grouped by status

Exit criteria
	•	member can create draft invoice
	•	totals consistent across client and backend validation
	•	draft persists and reloads correctly

⸻

Phase 5 — Invoice sending and public access

Goals
	•	sent invoices become publicly viewable by secure tokenized URL
	•	invoice status transitions start functioning

Deliverables
	•	send invoice mutation
	•	access token generation
	•	public invoice viewer resolver
	•	first-view tracking
	•	status transition logic

Work
	1.	implement send-invoice validation:
	•	role allowed
	•	org ready
	•	client email exists
	•	invoice total valid
	2.	generate 32-char hex access token
	3.	generate invoice public URL using org subdomain
	4.	set status from draft to sent
	5.	record sent timestamp
	6.	build public invoice lookup by:
	•	org subdomain
	•	invoiceId
	•	token
	7.	mark status viewed on first successful load
	8.	append view event on every load
	9.	disable access when void
	10.	build viewer states:

	•	unpaid
	•	paid
	•	void

Exit criteria
	•	sent invoice opens publicly only with valid token
	•	first public load marks invoice viewed
	•	void invoice disables payment actions

⸻

Phase 6 — Stripe Checkout and payment lifecycle

Goals
	•	invoices can be paid online
	•	payment state reconciles safely
	•	payment attempt limits enforced

Deliverables
	•	checkout session creation
	•	post-payment webhook handling
	•	payment success page
	•	rate limit logic

Work
	1.	create checkout session from sent/viewed unpaid invoice
	2.	include invoice metadata in Stripe session
	3.	configure Stripe Tax input path
	4.	redirect success to marketing-site page
	5.	implement Stripe webhook for successful payment
	6.	mark invoice paid on verified webhook
	7.	persist Stripe session/reference ids
	8.	add manual paid mark flow in mobile app with payment method note
	9.	implement payment attempt rate limit:
	•	10 attempts per hour
	•	15-minute lock
	10.	log failures and lockouts
	11.	update public viewer banner when paid

Exit criteria
	•	valid invoice can be paid
	•	webhook marks invoice paid exactly once
	•	abuse attempts are limited

⸻

Phase 7 — PDF generation

Goals
	•	invoice PDF generation is reliable and consistent with public HTML rendering
	•	preview and send flows can reuse same template

Deliverables
	•	HTML invoice rendering layer
	•	server-side PDF generation pipeline
	•	cached preview behavior
	•	stored PDF metadata

Work
	1.	define render model for invoice HTML template
	2.	create invoice template component independent from app chrome
	3.	create server render function
	4.	create PDF generation function
	5.	store generated PDF file record
	6.	generate on send
	7.	generate on preview request
	8.	implement 5-minute preview cache
	9.	allow PDF download only when unpaid
	10.	ensure images and branding render correctly

Exit criteria
	•	generated PDF matches invoice viewer content closely
	•	preview requests reuse cache within 5 minutes

⸻

Phase 8 — Attachments, logos, file storage, quotas

Goals
	•	support attachments and branding safely
	•	enforce tier storage limits consistently

Deliverables
	•	file upload pipeline
	•	file validation
	•	quota enforcement
	•	cleanup behavior on deletion

Work
	1.	create file metadata table
	2.	create quota helper by subscription tier
	3.	validate file type:
	•	images
	•	PDFs
	4.	validate file count max 2 per invoice
	5.	validate file size max 5MB each
	6.	enforce org storage quota before upload
	7.	support org logo upload
	8.	support line item image refs
	9.	support invoice attachments visible to client
	10.	count stored PDFs toward quota
	11.	decrement quota on hard delete

Exit criteria
	•	storage used reflects uploads accurately
	•	over-quota uploads blocked cleanly

⸻

Phase 9 — Email system and reminders

Goals
	•	emails are sent safely with limits
	•	reminders stop after payment

Deliverables
	•	invoice send email
	•	payment receipt email
	•	reminder scheduler
	•	hourly org email rate limit

Work
	1.	design email templates
	2.	send invoice email at send time
	3.	send payment receipt after payment confirmed
	4.	add reminder scheduling model
	5.	create scheduled job:
	•	3 days before due
	•	on due date
	6.	suppress reminders if invoice paid or void
	7.	implement org email rate limit:
	•	50 per hour
	8.	no auto retry on limit breach
	9.	log send attempts and failures
	10.	add resend action in mobile app

Exit criteria
	•	invoice emails deliver with public link
	•	reminders stop immediately after payment

⸻

Phase 10 — Memberships and invitations

Goals
	•	owner/admin can manage team access
	•	invite flow works with existing users only
	•	role safety rules enforced

Deliverables
	•	invitation CRUD
	•	invite accept page on web
	•	member management UI
	•	leave/remove/role-change rules

Work
	1.	invitation create with email and org role
	2.	require invited email to match existing user
	3.	create expiration after 24 hours
	4.	support revoke
	5.	build invite acceptance web page
	6.	require Clerk auth before accept
	7.	create membership on accept
	8.	deep link to mobile app after join
	9.	support member removal
	10.	support role changes
	11.	enforce:

	•	owner cannot be removed
	•	at least one admin/owner must remain

	12.	support leave organization
	13.	if owner leaves, trigger destructive delete confirmation flow

Exit criteria
	•	invite lifecycle is complete and permission safe
	•	org cannot lose all admins/owners

⸻

Phase 11 — Subscription billing and org-limit enforcement

Goals
	•	user subscription tier affects org count and storage
	•	downgrade grace behavior enforced

Deliverables
	•	Stripe Billing integration
	•	subscription sync
	•	downgrade workflow
	•	grace-period enforcement

Work
	1.	map Stripe subscription to internal tier
	2.	sync subscription changes by webhook
	3.	enforce org creation limit by tier
	4.	enforce storage quota by tier
	5.	handle upgrade immediately and prorated
	6.	on downgrade, calculate org excess
	7.	require user to choose orgs to delete
	8.	mark excess orgs read-only during 7-day grace
	9.	schedule deletion after grace
	10.	cancel deletion if upgrade happens during grace

Exit criteria
	•	tier changes affect capabilities correctly
	•	downgrade path is deterministic and auditable

⸻

Phase 12 — Data export and organization deletion

Goals
	•	destructive actions are deliberate
	•	user can extract org data
	•	deletion fully cleans up dependencies

Deliverables
	•	JSON export
	•	org hard delete workflow
	•	cleanup jobs

Work
	1.	create org export assembler
	2.	include clients, invoices, expenses, memberships, logs as allowed
	3.	implement export generation endpoint/job
	4.	implement org delete confirmation requiring exact name
	5.	hard delete org data
	6.	delete file metadata and actual stored files
	7.	remove Stripe references where needed
	8.	log deletion event

Exit criteria
	•	export works
	•	deleted org is fully removed with no orphan files

⸻

Phase 13 — Dashboard, polish, and usability layers

Goals
	•	product is usable day-to-day
	•	key operational views exist

Deliverables
	•	dashboard
	•	recent invoices
	•	unpaid totals
	•	quick actions
	•	dark/light theme support
	•	biometric unlock in mobile

Work
	1.	dashboard data aggregation queries
	2.	quick action buttons
	3.	recent invoices list
	4.	unpaid amount and count widgets
	5.	invoice list grouped by status and newest first
	6.	theme support in mobile
	7.	system theme detection in public viewer
	8.	biometric unlock in mobile
	9.	persistent login handling

Exit criteria
	•	owner/admin can run daily invoicing workflow from mobile

⸻

Phase 14 — Admin panel

Goals
	•	internal operators can support users and investigate issues

Deliverables
	•	user search
	•	invoice search
	•	logs viewer
	•	refunds trigger
	•	impersonation
	•	delete user

Work
	1.	admin auth boundary
	2.	search users by email or ID
	3.	search invoices
	4.	log filtering by event type
	5.	trigger refunds flow
	6.	impersonation with audit logging
	7.	delete users
	8.	explicitly block invoice editing in admin panel

Exit criteria
	•	support staff can inspect and act without direct DB access

⸻

Phase 15 — Logging, security, cleanup, release hardening

Goals
	•	auditable behavior
	•	abuse resistance
	•	operational readiness

Deliverables
	•	centralized logs
	•	cleanup jobs
	•	retention policies
	•	final QA matrix

Work
	1.	create log write helper
	2.	log:
	•	payments
	•	email sends
	•	auth events
	•	invoice changes
	•	membership changes
	3.	add 30-day retention cleanup job
	4.	verify token entropy and generation
	5.	verify access-control coverage
	6.	verify rate-limit buckets
	7.	test destructive actions
	8.	test failure/retry cases
	9.	monitor metrics and alerting hooks if available

Exit criteria
	•	production-ready baseline with safe failure behavior

⸻

4. Initial Chunk Breakdown

These are the first-pass implementation chunks. Each chunk should leave the repo in a working state.

Chunk 1 — Monorepo foundation

Repo, apps, packages, tooling, CI.

Chunk 2 — Auth and internal user bootstrap

Clerk to Convex identity sync, current user query, user tier model.

Chunk 3 — Organizations and memberships

Org creation, membership records, role utilities, org limit enforcement.

Chunk 4 — Onboarding and org settings

Business info, immutable subdomain, readiness gating.

Chunk 5 — Clients, items, expenses

CRUD and validation for supporting invoice entities.

Chunk 6 — Draft invoice composer

Invoice schema, line items, totals engine, mobile invoice draft UI.

Chunk 7 — Invoice send and public link

Token generation, sent transition, public viewer foundation.

Chunk 8 — Stripe Checkout and paid status

Checkout session, webhook reconciliation, success page.

Chunk 9 — PDF generation

Shared HTML invoice template, server render, preview/send generation.

Chunk 10 — Attachments and storage quotas

Uploads, validation, quota accounting, logo support.

Chunk 11 — Email system

Invoice email, receipt email, reminders, resend flow, rate limits.

Chunk 12 — Invitations and membership management

Invite, accept, revoke, role changes, leave/remove rules.

Chunk 13 — Billing tiers and downgrade grace

Stripe Billing sync, org overage handling, grace state.

Chunk 14 — Export and deletion

JSON export, destructive delete flow, cleanup.

Chunk 15 — Admin panel and logs

Search, refund trigger, impersonation, event filtering.

Chunk 16 — Security hardening and final QA

Rate limit completion, retention jobs, full regression pass.

⸻

5. Second-Pass Breakdown Into Smaller Iterative Chunks

Now reduce the chunk size further so each one is safe and testable.

Iteration A — Foundation
	1.	create monorepo folders and base package manifests
	2.	add TS configs and path aliasing
	3.	add lint/format/typecheck scripts
	4.	boot empty mobile/web/admin apps
	5.	verify shared package imports
	6.	add CI

Iteration B — Identity and permissions
	7.	add Clerk integration to mobile/web shells
	8.	create internal user table
	9.	add user bootstrap sync
	10.	add subscription tier enums and defaults
	11.	create membership and role enums
	12.	create permission helper functions
	13.	write backend auth guards

Iteration C — Organizations
	14.	create org schema
	15.	implement org creation mutation
	16.	generate immutable random subdomain
	17.	enforce subdomain uniqueness
	18.	create owner membership on org creation
	19.	enforce org count limit by tier
	20.	add org picker/current-org state

Iteration D — Onboarding
	21.	add org settings fields
	22.	add business info form
	23.	add onboarding status query
	24.	add readiness validator
	25.	block send actions when incomplete
	26.	create setup checklist UI

Iteration E — Supporting entities
	27.	add client schema and validation
	28.	build client create/edit/archive flow
	29.	enforce duplicate email block
	30.	add item preset schema and CRUD
	31.	add expense schema and CRUD
	32.	list screens for clients/items/expenses

Iteration F — Invoice draft core
	33.	add invoice schema
	34.	add line item substructure
	35.	add expense snapshot structure
	36.	implement money helpers
	37.	implement line-level rounding
	38.	implement discount math
	39.	implement tax-before-total order correctly
	40.	create draft invoice mutation
	41.	create invoice edit mutation
	42.	create invoice preview query

Iteration G — Invoice composer UI
	43.	create draft invoice screen shell
	44.	add client selector
	45.	add line item editor
	46.	add expense attach flow
	47.	add discount input
	48.	add totals summary
	49.	save and reload draft state
	50.	list drafts grouped by status

Iteration H — Send flow and public viewer
	51.	add send invoice validation
	52.	generate invoice token
	53.	generate public URL
	54.	mark status sent
	55.	create public invoice fetch route
	56.	validate token/subdomain/invoice match
	57.	add first-view tracking
	58.	mark invoice viewed on first load
	59.	render public invoice states

Iteration I — Payments
	60.	create checkout session mutation
	61.	attach Stripe metadata
	62.	add payment success page
	63.	implement webhook signature verification
	64.	mark invoice paid on successful webhook
	65.	save payment refs
	66.	add manual mark-paid flow
	67.	add payment attempt limit and lock

Iteration J — PDFs
	68.	build shared invoice render model
	69.	create HTML invoice template
	70.	add server-side render function
	71.	add PDF generation endpoint/job
	72.	store generated PDF metadata
	73.	generate on send
	74.	add preview generation
	75.	add 5-minute cache
	76.	restrict PDF download when paid/void per spec

Iteration K — Files and quotas
	77.	create file metadata schema
	78.	add upload validation
	79.	add attachment count limit
	80.	add attachment size/type limit
	81.	add org logo upload
	82.	add invoice attachments
	83.	add line item image refs
	84.	add storage quota accounting
	85.	block uploads over tier quota
	86.	implement delete cleanup and quota decrement

Iteration L — Emails
	87.	create email templates
	88.	send invoice email on send
	89.	send payment receipt on pay
	90.	create reminder job model
	91.	schedule reminder jobs
	92.	suppress reminders when paid
	93.	add resend flow
	94.	add org email hourly limit
	95.	log email failures

Iteration M — Team management
	96.	add invitation schema
	97.	validate invited email belongs to existing user
	98.	add create invite mutation
	99.	add revoke mutation
	100.	add 24-hour expiry enforcement
	101.	build invite accept page
	102.	create membership on accept
	103.	deep link to mobile app
	104.	add role change flow
	105.	add remove member flow
	106.	enforce admin/owner continuity rules
	107.	add leave org flow
	108.	add owner-leave delete flow

Iteration N — Subscription and downgrade
	109.	integrate Stripe Billing for account subscriptions
	110.	sync tier from Stripe webhooks
	111.	update org limit enforcement from live tier
	112.	update storage quota enforcement from live tier
	113.	implement downgrade detection
	114.	add org selection for deletion
	115.	mark excess orgs read-only
	116.	add 7-day grace scheduler
	117.	auto-delete after grace
	118.	cancel pending deletion on upgrade

Iteration O — Admin and operations
	119.	add log schema and helper
	120.	log core event types
	121.	build admin auth boundary
	122.	user search
	123.	invoice search
	124.	log filtering UI
	125.	refund trigger
	126.	impersonation with audit logging
	127.	user deletion
	128.	add 30-day log retention cleanup

Iteration P — Export, deletion, polish
	129.	JSON export assembler
	130.	export trigger/download flow
	131.	org delete confirmation by name
	132.	hard delete org data/files/refs
	133.	dashboard aggregates
	134.	unpaid widgets
	135.	recent invoice list
	136.	theme support
	137.	biometric unlock
	138.	regression testing and production checklist

⸻

6. Third-Pass Breakdown Into Right-Sized Implementation Steps

This is the practical build queue. Each step is small enough for one focused implementation cycle, but large enough to create forward movement.

Stage 1 — Repository and tooling
	1.	initialize Turborepo and root scripts
	2.	create app shells for mobile, invoice-viewer, marketing-site, admin-panel
	3.	create ui, utils, types packages
	4.	wire TypeScript path aliases and shared build config
	5.	add lint, format, typecheck, test command scaffolding
	6.	add CI pipeline for lint + typecheck + build

Stage 2 — Shared contracts
	7.	define shared enums for tiers, roles, invoice status, log types
	8.	define shared money, invoice, client, org DTO types
	9.	create validation schemas for major entities
	10.	create shared utility modules:

	•	money conversion
	•	invoice calculations
	•	token generation
	•	permission checks

Stage 3 — Auth bootstrap
	11.	integrate Clerk in authenticated app shells
	12.	create Convex user table
	13.	create user bootstrap mutation/query path
	14.	map Clerk user to internal user on first auth
	15.	store default subscription tier and org count limit
	16.	expose current authenticated user query

Stage 4 — Organization core
	17.	create organization table/schema
	18.	create membership table/schema
	19.	build organization creation mutation
	20.	generate immutable 12-char random subdomain
	21.	ensure subdomain uniqueness before insert
	22.	create owner membership automatically
	23.	enforce tier-based org count cap
	24.	build current organization selection/query logic

Stage 5 — Role enforcement
	25.	implement backend permission guards per role
	26.	create reusable role-check helpers for org actions
	27.	write tests for owner/admin/member access boundaries
	28.	apply guards to organization, client, and invoice mutations

Stage 6 — Onboarding
	29.	add org fields: business address, logo, storage used, tier
	30.	create business information update flow
	31.	create onboarding readiness query
	32.	add placeholder Stripe connected field/state
	33.	block invoice-send mutation when org incomplete
	34.	build onboarding checklist UI in mobile app

Stage 7 — Client management
	35.	create client schema
	36.	add create client mutation with required email validation
	37.	block duplicate client email within org
	38.	add edit client mutation
	39.	add archive and restore behavior
	40.	build client list and edit screens

Stage 8 — Item presets
	41.	create item preset schema at user level
	42.	add create/edit/delete item preset mutations
	43.	build item preset picker UI
	44.	confirm deleting preset never mutates invoices

Stage 9 — Expenses
	45.	create expense schema
	46.	add expense CRUD mutations
	47.	build expense list/create/edit screens
	48.	add expense selection support for invoice drafts

Stage 10 — Invoice math engine
	49.	implement cents-based money helpers
	50.	implement decimal quantity handling
	51.	implement line-total rounding at item level
	52.	implement discount ordering
	53.	implement tax-after-discount calculation structure
	54.	add test coverage for math edge cases

Stage 11 — Invoice schema
	55.	create invoice table/schema
	56.	store client snapshot
	57.	store line item snapshots
	58.	store expense snapshots
	59.	store totals and invoice status
	60.	add created/updated timestamps and edited flag

Stage 12 — Draft invoice backend
	61.	add create draft invoice mutation
	62.	add update draft invoice mutation
	63.	add fetch invoice detail query
	64.	add invoice list query grouped by status
	65.	sort newest first within groups

Stage 13 — Draft composer UI
	66.	build invoice draft screen scaffold
	67.	add client picker
	68.	add line item add/edit/remove flow
	69.	add preset-to-line-item insertion
	70.	add expense attach flow
	71.	add discount editor
	72.	add totals preview panel
	73.	save draft changes and restore on reload

Stage 14 — Invoice send transition
	74.	add send validation rules
	75.	generate 32-char hex access token
	76.	generate public invoice URL from org subdomain + invoiceId + token
	77.	transition invoice status to sent
	78.	save sent timestamp and initial Stripe session placeholder

Stage 15 — Public invoice viewer foundation
	79.	set up invoice-viewer routing for org subdomain and invoice route
	80.	fetch invoice by subdomain + id + token
	81.	reject invalid token or invoice mismatch
	82.	render unpaid/paid/void state shells
	83.	render line items, expenses, attachments placeholders
	84.	record first view and update status to viewed
	85.	append view log on each load

Stage 16 — Checkout integration
	86.	create Stripe Checkout session mutation
	87.	allow only sent/viewed unpaid invoices
	88.	add supported payment methods
	89.	attach invoice/org metadata for reconciliation
	90.	redirect to marketing success page
	91.	persist checkout session reference on invoice

Stage 17 — Payment reconciliation
	92.	verify Stripe webhook signatures
	93.	handle checkout success webhook
	94.	mark invoice paid only once
	95.	save payment metadata
	96.	update public viewer banner to paid
	97.	send receipt trigger event

Stage 18 — Manual payment flow
	98.	add manual mark-paid mutation for authorized roles
	99.	require payment method selection: cash/check/other
	100.	store manual payment note/metadata
	101.	update invoice status and logs

Stage 19 — Payment abuse protection
	102.	create payment attempt rate-limit record model
	103.	count attempts per invoice/token/IP strategy as chosen
	104.	lock after 10 attempts per hour
	105.	enforce 15-minute lock window
	106.	show lock message in viewer
	107.	log failed attempts

Stage 20 — HTML/PDF rendering
	108.	build shared invoice render component from normalized invoice data
	109.	ensure same data shape serves viewer and PDF generator
	110.	implement server-side HTML render
	111.	implement PDF generation routine
	112.	generate PDF on send
	113.	generate preview on demand
	114.	cache preview for 5 minutes
	115.	store PDF file metadata and filename

Stage 21 — Attachments and branding
	116.	create file upload metadata model
	117.	validate mime types and size
	118.	enforce max 2 attachments per invoice
	119.	add org logo upload flow
	120.	add invoice attachment upload flow
	121.	render attachments in public invoice viewer
	122.	render logo and line-item images in HTML/PDF

Stage 22 — Storage quota enforcement
	123.	define quota per tier
	124.	compute storage usage from file records
	125.	increment usage on upload/store
	126.	decrement usage on delete
	127.	block over-quota uploads with clear error
	128.	count PDFs, logos, item images, attachments toward usage

Stage 23 — Email delivery
	129.	build invoice send email template
	130.	build payment receipt email template
	131.	send invoice email from send flow
	132.	send payment receipt from payment confirmation flow
	133.	add resend invoice email action in mobile app

Stage 24 — Reminder system
	134.	add due date support if not already present in invoice model
	135.	schedule 3-days-before reminder job
	136.	schedule due-date reminder job
	137.	suppress/cancel reminders if invoice paid or void
	138.	log reminder attempts and failures

Stage 25 — Email rate limiting
	139.	create org email limit model
	140.	enforce 50 emails/hour per org
	141.	return limit error with no auto retry
	142.	log blocked sends

Stage 26 — Invitations
	143.	create invitation table/schema
	144.	add create invitation mutation
	145.	validate invited email belongs to existing user
	146.	add revoke invitation mutation
	147.	enforce 24-hour expiration at accept time
	148.	build invite acceptance page on web
	149.	require Clerk auth on accept
	150.	create membership and consume invite
	151.	deep link to mobile app after acceptance

Stage 27 — Membership management
	152.	build members list UI
	153.	add role change action
	154.	add remove member action
	155.	block owner removal
	156.	enforce at least one admin/owner remains
	157.	add leave organization flow
	158.	make owner-leave route go through org deletion confirmation

Stage 28 — Subscription billing
	159.	create Stripe Billing products/prices
	160.	integrate account subscription checkout/portal
	161.	sync active tier to user record via webhook
	162.	update org count limit from active tier
	163.	update storage quota from active tier

Stage 29 — Downgrade grace flow
	164.	detect over-limit state after downgrade
	165.	prompt user to choose orgs to keep/delete
	166.	mark excess orgs read-only
	167.	schedule 7-day grace expiration
	168.	auto-delete excess orgs after grace
	169.	cancel scheduled deletion if upgraded during grace

Stage 30 — Dashboard
	170.	add unpaid total aggregate query
	171.	add unpaid invoice count query
	172.	add recent invoices query limited to 5
	173.	build quick actions for create invoice and add client

Stage 31 — Export and destructive actions
	174.	assemble org JSON export payload
	175.	create export request/download flow
	176.	build org deletion confirmation requiring typed org name
	177.	hard delete invoices, clients, expenses, memberships, files
	178.	remove storage artifacts and Stripe refs
	179.	write deletion log

Stage 32 — Logging and admin panel
	180.	create centralized log helper
	181.	write logs for payments, email, auth, invoice changes, membership changes
	182.	build admin auth boundary
	183.	add user search
	184.	add invoice search
	185.	add log filtering by event type
	186.	add refund trigger flow
	187.	add impersonation with audit log
	188.	add delete-user action
	189.	add 30-day log cleanup job

Stage 33 — Themes and mobile security
	190.	add mobile dark/light mode support
	191.	add viewer system theme detection
	192.	add biometric unlock
	193.	verify persistent login behavior and logout rules

Stage 34 — Final hardening
	194.	write end-to-end tests for core invoice flow
	195.	write access-control regression tests
	196.	test all rate-limit paths
	197.	test file quota boundaries
	198.	test downgrade grace and auto-delete
	199.	test public invoice security with invalid tokens/subdomains
	200.	prepare production release checklist

⸻

7. Final Recommended Build Order for Real Execution

This is the order that minimizes rework and keeps vertical slices working.

Milestone 1 — Working authenticated skeleton

Steps 1–28

Outcome:
	•	apps boot
	•	auth works
	•	orgs and memberships exist
	•	onboarding gate exists

Milestone 2 — Core business data

Steps 29–48

Outcome:
	•	clients, items, expenses ready
	•	invoice math engine stable

Milestone 3 — Draft invoicing

Steps 49–73

Outcome:
	•	draft invoices can be created and edited from mobile

Milestone 4 — Send and public invoice

Steps 74–85

Outcome:
	•	invoices can be sent and viewed publicly

Milestone 5 — Payments

Steps 86–107

Outcome:
	•	invoices can be paid online or marked paid manually
	•	abuse controls exist

Milestone 6 — PDFs and files

Steps 108–128

Outcome:
	•	PDFs generate
	•	uploads work
	•	quotas enforced

Milestone 7 — Email and reminders

Steps 129–142

Outcome:
	•	send emails, receipts, reminders, resend flow

Milestone 8 — Team features

Steps 143–158

Outcome:
	•	invitations and team management complete

Milestone 9 — Billing enforcement

Steps 159–169

Outcome:
	•	paid tiers, limits, downgrade grace fully active

Milestone 10 — Operations and finish

Steps 170–200

Outcome:
	•	dashboard, exports, deletion, admin panel, themes, security, release readiness

⸻

8. Risk Areas That Need Early Discipline

Invoice mutability

Do not let sent/paid invoices behave like drafts. Define edit policy early.

Stripe ownership model ambiguity

Your spec mentions Stripe Connect setup and also Stripe Checkout for invoice payments. Decide early whether:
	•	platform collects payments, or
	•	each org receives payments directly through connected accounts

This affects onboarding, checkout, refunds, tax, and payout responsibility.

Public subdomain routing

Multi-subdomain app routing needs early validation in hosting/deployment. Do not wait until late stage.

PDF generation environment

Server-side HTML-to-PDF must be tested in actual deployment environment early.

File storage quota accounting

Do not compute storage usage only from cached counters without reconciliation tooling. Add a periodic reconciliation path later if possible.

Organization deletion during downgrade

Auto-delete is destructive. Require clear scheduling and audit logs.

Owner leave = org delete

This is dangerous behavior. Implement very explicit confirmation flow and logging.

⸻

9. Definition of Done Per Major Area

Organization system done when
	•	user can create org within tier limit
	•	owner membership created automatically
	•	immutable subdomain assigned
	•	readiness state computed correctly

Invoice drafting done when
	•	authorized users create/edit drafts
	•	totals match expected calculations
	•	grouped invoice list works

Invoice sending done when
	•	only valid invoices can be sent
	•	public token URL resolves invoice securely
	•	first view changes status to viewed

Payments done when
	•	checkout session created only for eligible invoices
	•	successful payment marks invoice paid through webhook
	•	duplicate webhooks do not double-process

PDFs done when
	•	preview generates
	•	send triggers stored PDF
	•	PDF content matches public invoice content

Emails done when
	•	send email, receipt, and reminders work
	•	rate limit enforced
	•	no reminders after paid

Memberships done when
	•	invite, accept, revoke, role change, remove, leave all work
	•	continuity rules enforced

Billing done when
	•	user tier syncs from Stripe
	•	org limits and storage quotas reflect tier
	•	downgrade grace state behaves exactly as specified

Admin done when
	•	support can search, inspect logs, refund, impersonate
	•	invoice editing remains disabled

⸻

10. Best First Sprint

Start here:
	1.	steps 1–6 repo/tooling
	2.	steps 7–10 shared contracts
	3.	steps 11–16 auth bootstrap
	4.	steps 17–24 organization core
	5.	steps 25–28 role enforcement
	6.	steps 29–34 onboarding

That creates a stable foundation before invoice complexity begins.

11. Best Second Sprint
	1.	steps 35–48 clients/items/expenses/math
	2.	steps 55–73 invoice schema + draft backend + draft UI

That gives a usable internal MVP with draft creation.

12. Best Third Sprint
	1.	steps 74–97 send flow + public viewer + Stripe payment
	2.	steps 108–115 PDF generation

That gives the first real customer-facing slice.

13. Best Fourth Sprint
	1.	steps 116–142 files + quotas + email + reminders
	2.	steps 143–158 invitations and membership management

That moves from MVP into operational product.

14. Best Fifth Sprint
	1.	steps 159–200 billing enforcement, exports, admin, hardening

That finishes commercialization and support tooling.