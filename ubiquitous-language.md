# Invo Platform

Invoicing SaaS. A person subscribes, creates one or more Organizations, adds Clients, composes Invoices, sends them as tokenized public links, and collects payment through Stripe. The mobile app is the primary surface.

This file is a glossary only. Implementation detail lives in `.claude/CLAUDE.md`, `docs/decisions/`, and the code.

## Accounts and Tenancy

**User**:
A person authenticated through Clerk with a mirrored internal record. Owns the Subscription and the Item Presets; everything else belongs to an Organization.
_Avoid_: Account, profile

**Bootstrap**:
The first-sign-in step that creates the internal User record from a Clerk identity. Idempotent.
_Avoid_: Sync, provisioning

**Organization**:
The tenant and billing-independent workspace that owns Clients, Invoices, Expenses, files, and members. Has an immutable Subdomain.
_Avoid_: Org (fine in code, not in prose), workspace, company, team, tenant

**Subdomain**:
A random 12-hex-character identifier assigned to an Organization at creation and never changed. Reserved for V2 branded URLs; not used for routing in V1.
_Avoid_: Slug, handle

**Business Address**:
The Organization's street, city, state, postal code, and country. All five fields required for the Organization to be Ready to Send.
_Avoid_: Address (ambiguous with the Client's), location

**Membership**:
The link between a User and an Organization carrying exactly one Role.
_Avoid_: Seat, member record

**Role**:
One of Owner, Admin, Member. Fixed per Membership.

**Owner**:
The single User who created the Organization. Sole holder of billing and deletion rights. Cannot be removed, demoted, or replaced in V1; an Owner who leaves deletes the Organization.
_Avoid_: Creator, account holder, primary admin

**Admin**:
A Role with every Owner capability except billing and Organization deletion.

**Member**:
The lowest Role. Can create Draft Invoices and manage Clients; cannot send Invoices or manage Memberships.
_Avoid_: Using "member" to mean any person in the Organization (say "participant" or name the Role)

**Invitation**:
An emailed offer of Membership at a given Role. Pending, Accepted, Expired (24h), or Revoked.
_Avoid_: Invite (noun), request

**Internal Admin**:
An Invo staff User flagged `isAdmin` in Clerk metadata with access to the Admin Panel. Unrelated to the Organization Admin Role.
_Avoid_: Superuser, admin (unqualified)

## Subscription

**Subscription**:
A User-level Stripe Billing plan that determines the Tier. Synced from Stripe webhooks.
_Avoid_: Plan (use Tier), license

**Tier**:
Base, Plus, or Pro. Determines Org Count Limit and Storage Quota.
_Avoid_: Plan, level, package

**Org Count Limit**:
The maximum number of Organizations a User may Own under their Tier (1 / 5 / 25).
_Avoid_: Seat limit, workspace cap

**Storage Quota**:
The per-Organization file storage ceiling set by the Owner's Tier (500 MB / 10 GB / 100 GB).
_Avoid_: Disk limit

**Downgrade Grace Period**:
The 7-day window after a Tier downgrade during which Excess Organizations are read-only before automatic deletion.
_Avoid_: Grace window, cooldown

**Excess Organization**:
An Organization that exceeds the Org Count Limit after a downgrade.

## Onboarding

**Onboarding Step**:
One of: Account Created, Org Created, Business Info Set, Stripe Connected. Derived from data, never stored.

**Ready to Send**:
The state in which an Organization has a name, a complete Business Address, and Stripe Connected. The gate on sending any Invoice.
_Avoid_: Onboarded, verified, complete

**Stripe Connected**:
The Organization has a Connect Account with charges enabled. Account existence alone is not enough.

## Clients and Catalog

**Client**:
An Organization-scoped party that receives Invoices. Email is required and unique within the Organization. Archived, never deleted.
_Avoid_: Customer (reserved for Stripe Billing customers of Invo itself), contact, payer, recipient

**Archived Client**:
A Client hidden from pickers and blocked from new Invoices but preserved for history.
_Avoid_: Deleted, inactive, disabled

**Item Preset**:
A User-scoped reusable template for a Line Item (name, description, default price, taxable flag). Copied into an Invoice, never referenced.
_Avoid_: Product, service, catalog item, SKU, template

**Expense**:
An Organization-scoped cost record (description, amount, category) that can be attached to an Invoice. Copied in as an Expense Snapshot; not part of the Total.
_Avoid_: Cost, reimbursable, pass-through

## Invoice Composition

**Invoice**:
The core document: a Client Snapshot, Line Items, Expense Snapshots, optional Discount, Tax, Total, Status, and (once sent) an Access Token.
_Avoid_: Bill, receipt, estimate, quote

**Draft**:
An Invoice Status in which every field is editable and no Access Token exists.

**Line Item**:
A named quantity × Unit Price entry on an Invoice, each with its own Line Total and taxable flag.
_Avoid_: Item, product line, entry, row

**Unit Price**:
The per-unit amount of a Line Item, in Cents.
_Avoid_: Rate, price (unqualified)

**Line Total**:
`round(quantity × Unit Price)` for one Line Item. Rounding happens here and only here.
_Avoid_: Amount, extended price

**Cents**:
The unit of every stored monetary value. Integers only; dollars appear only in the UI.
_Avoid_: Dollars, amount in decimal, float money

**Subtotal**:
The sum of all Line Totals before Discount and Tax.

**Discount**:
A percentage (0–100) or fixed (Cents, ≤ Subtotal) reduction applied to the Subtotal before Tax.
_Avoid_: Coupon, promo, markdown

**Discounted Subtotal**:
Subtotal after Discount. The base for Tax proration.

**Tax**:
A single manually entered percentage rate applied to the taxable share of the Discounted Subtotal. Automatic tax calculation is out of scope for V1.
_Avoid_: VAT, sales tax (unless meaning the rate's source), Stripe Tax

**Taxable Subtotal**:
The portion of the Discounted Subtotal attributable to Line Items marked taxable, prorated by the Discount.

**Total**:
Discounted Subtotal + Tax amount. The amount the Client pays. Must be greater than zero to send.
_Avoid_: Grand total, amount due, balance

**Calculation Order**:
Subtotal → Discount → Tax → Total. Computed by the single Invoice Math engine, always re-run server-side on save and send.

**Due Date**:
Optional timestamp by which payment is expected. Drives Overdue and reminder timing.
_Avoid_: Deadline, terms

**Overdue**:
An unpaid Invoice whose Due Date has passed. Derived, not a Status.

## Snapshotting

**Snapshot**:
A frozen copy of source data embedded in an Invoice so later edits to the source do not change the Invoice.
_Avoid_: Copy, cache, reference, denormalized

**Client Snapshot**:
The Client's name, email, and phone as captured on the Invoice. Taken at Draft creation and retaken at Send.

**Expense Snapshot**:
An Expense copied onto the Invoice at the time it is attached.

**Locked**:
The condition of any Invoice past Draft: no field may change. Corrections require Void and a new Invoice.
_Avoid_: Frozen, finalized, immutable (in prose)

## Invoice Lifecycle

**Status**:
One of Draft, Sent, Viewed, Paid, Void. Only these transitions exist: Draft→Sent, Sent→Viewed, Sent/Viewed→Paid, Draft/Sent/Viewed→Void. Paid and Void are terminal.
_Avoid_: State, stage, phase

**Send**:
The transition Draft→Sent. Requires Owner or Admin, a Ready to Send Organization, a Client, and a positive Total. Re-snapshots the Client, recalculates totals, mints the Access Token, records Sent At, and schedules PDF generation and the Invoice Email.
_Avoid_: Publish, issue, finalize, submit

**Sent**:
Status after Send and before the Client first opens the Public Link.

**Viewed**:
Status after the first Client open of the Public Link.
_Avoid_: Opened, seen, read

**View Event**:
An append-only record of a Public Link open (timestamp, IP, user agent, first-view flag). Internal only in V1.

**Paid**:
Terminal Status reached through a completed Checkout Session or a Manual Payment.
_Avoid_: Settled, closed, complete

**Void**:
Terminal Status that cancels an Invoice without deleting it. The only way to "edit" a sent Invoice is Void + recreate.
_Avoid_: Cancel, delete, archive, reverse

**Unpaid**:
Collective term for Sent and Viewed Invoices. Used for dashboard metrics; not a Status.
_Avoid_: Outstanding, open, pending

## Public Access

**Access Token**:
A 32-character lowercase-hex secret minted at Send and required to view an Invoice publicly. Unique per Invoice.
_Avoid_: Token (unqualified), key, secret link, share code

**Public Link**:
`{APP_URL}/invoice/{invoiceId}?token={accessToken}`. The only way a Client reaches an Invoice. Unauthenticated at the session level; the Access Token is the credential.
_Avoid_: Share link, invoice URL, viewer link

**Public Viewer**:
The unauthenticated web page (route inside the marketing app) that renders an Invoice from a Public Link and hosts the pay button.
_Avoid_: Portal, client portal, payment page

**Invoice PDF**:
The server-rendered document generated at Send and attached to the Invoice. Authoritative because the Invoice is Locked.

**Invoice Email**:
The Resend message delivering the Public Link to the Client, sent from the Organization's name with Reply-To the Owner. Subject to the Email Rate Limit.
_Avoid_: Notification, reminder (a distinct, future concept)

## Payments

**Connect Account**:
The Organization's Stripe Express account that receives Invoice payouts. Has a status of Not Connected, Pending, Connected, or Charges Enabled.
_Avoid_: Stripe account (ambiguous with Invo's platform account), payout account, merchant account

**Checkout Session**:
A Stripe Checkout (payment mode) session created per payment attempt for an Invoice, with funds routed to the Connect Account as a destination charge.
_Avoid_: Payment intent, transaction, order

**Manual Payment**:
A payment recorded by an Organization participant outside Stripe: Cash, Check, or Other, with an optional reference.
_Avoid_: Offline payment, external payment

**Payment Record**:
The durable record of a completed payment, Stripe or Manual, against an Invoice.
_Avoid_: Transaction, receipt

**Payment Attempt**:
A single try to pay an Invoice from a given IP. Counted for the Payment Rate Limit.

## Files

**File**:
Organization-scoped metadata for a stored blob (owner entity, MIME type, size, storage id, logical path). Counts toward Storage Quota.
_Avoid_: Upload, asset, blob (in prose)

**Attachment**:
A File linked to an Invoice for the Client to see. Max 2 per Invoice, 5 MB each; PDF, PNG, JPEG, WebP only.
_Avoid_: Document, enclosure

**Logo**:
The Organization's image File shown on Invoices, PDFs, and emails.

**Logical Path**:
The human-readable location convention for a File (`orgs/{orgId}/...`). Convex storage ids are opaque; the Logical Path is the bookkeeping name.

## Operations

**Rate Limit Bucket**:
A keyed counter with a time window. Two kinds exist: Email Rate Limit (50 Invoice Emails per Organization per hour) and Payment Rate Limit (10 Payment Attempts per Invoice per hour, then a 15-minute lockout).
_Avoid_: Throttle, quota (reserved for storage)

**Log**:
An audit entry (event type, actor, Organization, entity) kept 30 days.
_Avoid_: Event (ambiguous with View Event and Stripe webhook events), activity

**Export**:
A JSON dump of an Organization's data, offered before Organization deletion.
_Avoid_: Backup, download

**Organization Deletion**:
A hard delete of an Organization and everything it owns, confirmed by typing the Organization's name. Triggered explicitly or by an Owner leaving.
_Avoid_: Deactivation, closing, archiving
