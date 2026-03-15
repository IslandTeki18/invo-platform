# 010 - Sent Invoice Edit Policy

**Date:** 2026-03-15
**Status:** Confirmed

---

## Decision Summary

Invoices are fully locked after they are sent. No fields can be modified once an invoice reaches the `sent` status. To correct a sent invoice, the user must void it and create a new one. This is the standard pattern for professional invoicing software.

---

## Decision

**Option A: Fully locked after send.**

Once an invoice transitions to `sent` status:
- No fields are editable (line items, amounts, due date, client, notes, etc.)
- The only permitted status transition from `sent` is to `void` or `paid`
- Corrections require the void-and-recreate workflow

---

## Rationale

- **Avoids partial payment conflicts.** If a client makes a partial payment against an invoice, changing the line items or total creates ambiguity about what was agreed to. Locking prevents this class of inconsistency entirely.
- **No stale PDF problem.** A locked invoice means the PDF generated at send time remains the authoritative document. There is no risk of the PDF and the data record diverging.
- **No re-notification logic.** Edit-after-send would require re-sending the invoice email or notifying the client of changes. Locking eliminates this requirement.
- **Clean audit trail.** Void + new invoice is an explicit, auditable record of the correction. The original and corrected invoices both remain in the system.
- **Simpler data model.** No edit history, change log, or `isInvoiceEdited` flag is needed.

---

## Alternatives Considered

### Option B: Limited edits after send (e.g., notes only)

Allow edits to non-financial fields (e.g., notes, internal reference) while locking financial fields.

**Rejected because:**
- Introduces a two-tier field classification that must be maintained as the schema evolves.
- Still requires deciding whether limited edits trigger re-notification.
- Adds ambiguity about what constitutes a "safe" edit.
- The complexity is not justified by a V1 user story.

### Option C: Full edit with isInvoiceEdited flag

Allow edits to any field after send, setting `isInvoiceEdited = true` to indicate the record has changed.

**Rejected because:**
- The flag alone does not resolve the partial payment conflict problem.
- Requires PDF regeneration logic.
- Requires re-notification to the client or a decision not to re-notify (either has consequences).
- Adds ambiguity about which version of the invoice the client has seen.
- The original spec included `isInvoiceEdited` but it is unnecessary under a fully locked policy.

---

## Edge Cases This Policy Avoids

| Edge Case | How it is avoided |
|---|---|
| Client pays partial amount; sender changes total | Locking prevents the total from changing after partial payment |
| PDF delivered to client does not match current record | Locking guarantees the data record and PDF never diverge post-send |
| Client receives original email and later receives a "corrected" email with different amounts | No re-send notification is needed; void makes the correction explicit |
| Audit shows invoice was edited without a clear record | Void + new invoice creates an unambiguous paper trail |
| Sender edits invoice after client already accepted/disputed it | Locking prevents edit; dispute must be resolved through void and reissue |

---

## Impact on Data Model

**`isInvoiceEdited` is not included in the V1 schema.**

The field appeared in the original spec (TASKS.md 11.1) but is unnecessary under a fully locked policy. Including it would be misleading — it would always be `false` in V1, since edits after send are not permitted.

The field can be added in V2 if edit-after-send functionality is introduced at that time.

**V1 invoice status transitions:**

```
draft -> sent -> paid
              -> void
draft -> void
```

No additional status values or edit flags are required.

---

## Void-and-Recreate Workflow

When a sent invoice contains an error:

1. **User voids the sent invoice.**
   - Status transitions from `sent` to `void`.
   - The voided invoice remains in the system and is visible to both sender and client.
   - The client-facing invoice viewer displays a void banner on the voided invoice.

2. **User creates a new draft invoice.**
   - The new invoice can be created manually or copied from the voided invoice.
   - The voided invoice ID should be referenceable (e.g., as a note or metadata field) for audit purposes.

3. **User sends the new invoice.**
   - A new invoice email is sent to the client with a link to the new invoice.
   - The new invoice has its own ID, access token, and PDF.

4. **Both invoices remain in the system.**
   - The voided invoice is retained for audit purposes.
   - No records are deleted.

---

## V2 Considerations

If edit-after-send is introduced in a future version, the following concerns must be addressed before implementation:

- **`isInvoiceEdited` flag** — can be added to the invoice schema at that time.
- **Edit history / changelog** — required to maintain audit trail of what changed and when.
- **PDF regeneration** — a new PDF must be generated and stored; the old PDF should be archived, not overwritten.
- **Re-notification policy** — must decide whether the client is re-notified of changes and what the email content looks like.
- **Partial payment handling** — must define behavior when line items or totals change after a partial payment has been recorded.
- **Field-level lock classification** — if only some fields are editable, the classification must be explicit and enforced at the schema and API layers.

No V1 user story requires edit-after-send. This decision is deferred without prejudice.
