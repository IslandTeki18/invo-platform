# 009 — Owner-Leaving Behavior

**Date:** 2026-03-15
**Status:** Confirmed

---

## Decision

When an org owner attempts to leave their organization, they are routed through the org deletion confirmation flow. Ownership transfer is not supported in V1. Leaving as an owner is equivalent to deleting the organization.

---

## Rationale

- Allowing an owner to leave without deleting the org requires a transfer mechanism (select new owner, notify, confirm). This is non-trivial and deferred to V2.
- Routing the owner through deletion is the simplest correct behavior: no ambiguous state, no orphaned orgs.
- A confirmation gate (typing the org name) prevents accidental destruction.

---

## UX Flow

1. Owner navigates to org settings and selects "Leave organization."
2. System detects the user is the owner.
3. User is redirected to the org deletion confirmation screen (not a generic leave flow).
4. Deletion confirmation screen presents:
   - Explanation that leaving as the owner deletes the entire organization.
   - A "Download export" option (JSON format) before proceeding.
   - A text input requiring the user to type the exact organization name to confirm.
   - A destructive "Delete organization" button that becomes active only after the name matches.
5. On confirmation, a full hard-delete is triggered.
6. Non-owner members attempting to leave are unaffected by this flow and use the standard member-leave path.

---

## Data Export Prompt

- The deletion confirmation screen presents a "Download export" option.
- Export format: JSON (per TASKS.md section 29).
- Export is not required — the user may skip it and proceed directly to deletion.
- No gate or blocking enforced on export completion.

---

## What Gets Deleted

A confirmed org deletion triggers a full hard-delete of all associated data:

- All invoices
- All generated invoice PDFs
- All files and file attachments
- All clients
- All memberships (including the owner)
- All expenses
- All invitations (pending and accepted)
- All audit/activity logs
- All Stripe references (customer records, subscription references, payment method references)

No soft-delete or recovery path exists in V1.

---

## V2 Considerations

- **Ownership transfer:** Allow the owner to designate another org admin as the new owner, then leave without triggering deletion.
- **Grace period:** Introduce a delay between deletion confirmation and execution (e.g., 24–72 hours), allowing the owner to cancel.
- **Mandatory export:** Require a successful export download before the deletion confirmation input is unlocked.
