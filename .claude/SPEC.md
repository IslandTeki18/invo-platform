Specification Document
Invoicing Platform

1. Architecture

Monorepo managed with Turborepo

Projects:

apps/
  mobile-app
  invoice-viewer
  marketing-site
  admin-panel

packages/
  ui
  utils
  types

Stack:

Mobile App
React Native
Expo
TypeScript
NativeWind

Web Apps
React
Vite
Tailwind
ShadCN (shared components)

Backend
Convex

Auth
Clerk

Payments
Stripe
Stripe Billing
Stripe Tax

Email
Resend

PDF Generation
Server-side render of HTML invoice template

⸻

2. Core System Concepts

User

Authenticated via Clerk.

User properties

id
email
createdAt
subscriptionTier
orgCountLimit

Subscription tiers:

Tier	Price	Org Limit
Base	$19	1
Plus	$49	5
Pro	$99	10

Billing is per user account.

Organization limits enforced during creation.

⸻

3. Organization

Business workspace container.

Contains:

• clients
• invoices
• expenses
• items
• members
• billing data
• branding
• storage usage

Fields

id
name
businessAddress
logoUrl
subdomain
createdAt
tier
storageUsed

Subdomain:

<12 char random string>.yourapp.com

Immutable once generated.

⸻

4. Membership

Roles:

Owner
Admin
Member

Owner
Full control.

Permissions
• delete organization
• manage billing
• invite members
• remove members
• edit roles
• create invoices
• edit invoices
• delete invoices
• manage clients
• manage items
• manage expenses

Admin

Permissions
• invite members
• remove members
• create invoices
• edit invoices
• manage clients
• manage items
• manage expenses

Restrictions
• cannot delete organization
• cannot manage billing

Member

Permissions
• create draft invoices
• manage clients

Restrictions
• cannot send invoices
• cannot invite members
• cannot manage billing

⸻

5. Invitation System

Invite by email.

Invitation flow

Owner/Admin sends invite
↓
User opens web invite page
↓
Clerk authentication required
↓
User joins organization
↓
Web page deep links to mobile app

Invitation rules

• expires after 24 hours
• inviter can revoke
• only existing users can be invited
• role defaults to Member
• role editable after join

⸻

6. Onboarding Flow

Required steps

Account
↓
Organization creation
↓
Business information
↓
Stripe Connect setup

Invoices cannot be sent until

• organization name set
• business address set
• Stripe connected

⸻

7. Invoice System

Statuses

draft
sent
viewed
paid
void

Status behavior

draft
not visible to client

sent
public link generated

viewed
triggered first time invoice loads

paid
Stripe payment completed

void
payment disabled

⸻

8. Invoice Structure

Fields

id
orgId
clientSnapshot
lineItems
expenses
subtotal
discount
tax
total
status
createdAt
updatedAt
isInvoiceEdited
accessToken
stripeSessionId

Access token

32-character hex string

⸻

9. Invoice Public URL

https://<org-subdomain>.yourapp.com/invoice/<invoiceId>?token=<32charhex>

Access token required.

⸻

10. Line Items

Fields

name
description
quantity
unitPrice
imageUrl
taxable
lineTotal

Quantity supports decimals

Rounding rule

round at line item level

⸻

11. Discount Rules

Discount types

• percentage
• fixed amount

Discount applied

subtotal
↓
discount
↓
tax
↓
total


⸻

12. Taxes

Stripe Tax used.

Tax configured per invoice.

⸻

13. Expenses

Expenses can attach to multiple invoices.

Expense duplicated per invoice.

Example

Home Depot materials purchase
Amount: $120
Attached to 3 invoices
Each invoice shows $120 expense

Expenses visible to client.

⸻

14. Attachments

Allowed types

• images
• PDFs

Limits

max 2 attachments
max 5MB per file

Attachments visible to client.

Attachments count toward organization storage quota.

⸻

15. Storage Limits

Tier	Storage
Base	500MB
Plus	10GB
Pro	100GB

Files counted

• item images
• attachments
• organization logo
• stored PDFs

⸻

16. PDF Generation

Server generated.

Based on same HTML template as invoice viewer.

PDF includes

• logo
• line items
• line item images

Filename

invoice_<invoiceId>.pdf

PDF generated

• when invoice sent
• when preview requested

Preview cache

5 minutes


⸻

17. Public Invoice Viewer

States

UNPAID
PAID
VOID

Banner colors

Green — paid
Yellow — unpaid
Gray — draft
Red — void

Features

• pay button
• line item images
• attachments
• dark mode support

PDF download allowed only when invoice unpaid

⸻

18. Payments

Stripe Checkout.

Checkout session created when invoice sent.

Payment methods

• card
• Apple Pay
• Google Pay

After payment

redirect to marketing domain success page.

⸻

19. Payment Success Page

Marketing site route.

Displays

Payment received

Invoice page shows Paid banner.

⸻

20. Payment Security

Limits

10 attempts per hour

Lock duration

15 minutes

Message

Too many payment attempts. Try again later.

Failures logged.

⸻

21. Email System

Provider

Resend

Emails

• invoice send
• payment receipt
• reminders

Reminder schedule

3 days before due
on due date

Reminder stops if invoice paid.

⸻

22. Email Limits

Per organization

50 emails per hour

Limit message

Email limit reached. Try again later.

No automatic retry.

⸻

23. Mobile App

Primary application.

Capabilities

• create invoices
• manage clients
• manage items
• manage expenses
• send invoices
• preview PDFs
• resend invoice emails
• mark invoice paid manually

Manual payment prompt

payment method
cash / check / other


⸻

24. Dashboard

Displays

• total unpaid amount
• number of unpaid invoices
• recent invoices (5)

Quick actions

• create invoice
• add client

⸻

25. Invoice List

Grouped by status

Draft
Sent
Viewed
Paid
Void

Order

newest first

Search and filters v2

⸻

26. Client System

Clients isolated per organization.

Fields

name
email
phone
notes
archived

Rules

• email required
• duplicate email blocked
• deletion replaced with archive

Archived clients

• hidden from selection
• restorable

⸻

27. Item Presets

Stored at user level

Fields

name
description
defaultPrice
taxable

Images not supported until V2.

Deleting preset does not affect invoices.

⸻

28. Billing System

Stripe Billing.

Subscription changes

immediate
prorated

Downgrade handling

User must choose orgs to delete.

Grace period

7 days

During grace

• excess orgs read-only

After grace

• automatic deletion

Upgrade during grace cancels deletion.

⸻

29. Organization Deletion

Hard delete.

Requires typing org name.

Deletes

• invoices
• attachments
• files
• Stripe references

⸻

30. Data Export

Organization data export

Format

JSON


⸻

31. Admin Panel

Admin capabilities

• view users
• delete users
• search users (email or ID)
• search invoices
• trigger refunds
• view logs
• impersonate users

Editing invoices disabled.

⸻

32. Logging

Logs stored in Convex.

Retention

30 days

Logged events

• payments
• email sends
• auth
• invoice changes
• membership changes

Admin panel supports filtering by event type.

⸻

33. Security

Tokens

32 char hex invoice access token.

Sensitive operations

no re-auth required.

Rate limits

• payment attempts
• email sends

⸻

34. Themes

Mobile app

• dark mode
• light mode

Invoice viewer

• system theme detection

⸻

35. Mobile Security

Features

• biometric unlock
• persistent login

Logout does not require biometrics.

⸻

36. View Tracking

Invoice viewer records

timestamp

Every view stored.

Not exposed until V2.

⸻

37. Organization Membership

Features

• invite members
• remove members
• role changes
• leave organization

Restrictions

• owner cannot be removed
• org must always have at least one admin/owner

Owner leaving

deletes organization

Requires typing org name.
