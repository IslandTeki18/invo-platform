# 007 - File Storage Strategy

**Date:** 2026-03-15
**Status:** Confirmed

---

## Decision

Use **Convex File Storage** (built-in `storage.store()`) as the file storage provider for invo-platform.

---

## Rationale

Convex File Storage was selected for the following reasons:

- **Zero configuration:** No external bucket setup, IAM policies, or CORS rules required.
- **Integrated auth:** Access control is enforced through Convex mutations and queries. No presigned URL logic is needed; auth is automatic and co-located with business logic.
- **Automatic CDN:** Files are served via Convex's CDN without additional infrastructure.
- **Quota enforcement:** Storage quotas can be checked and enforced inside Convex mutations before any file is stored, keeping enforcement logic close to the storage call.
- **Operational simplicity for V1:** Eliminates a dependency on an external provider (S3/R2) and reduces surface area during initial development.

---

## Alternatives Considered

### Amazon S3 / Cloudflare R2

- Requires presigned URL generation, separate bucket configuration, and CORS policy management.
- Provides greater control at scale and lower per-GB cost for high-volume workloads.
- Supports path-based organization natively.
- **Not selected for V1** due to added configuration overhead and unnecessary complexity at current scale.
- Deferred to V2 if storage volume or cost profile requires migration.

---

## Metadata Model

Convex File Storage assigns opaque, system-generated storage IDs to files. It does not support path-based keys or folder hierarchies natively. All logical organization is tracked in a dedicated metadata table.

### Metadata Table Fields

| Field            | Type     | Description                                                    |
|------------------|----------|----------------------------------------------------------------|
| `orgId`          | string   | ID of the organization that owns the file                      |
| `ownerEntityType`| string   | Type of the owning entity (e.g., `invoice`, `org`, `lineItem`) |
| `ownerEntityId`  | string   | ID of the owning entity                                        |
| `mimeType`       | string   | MIME type of the stored file                                   |
| `sizeBytes`      | number   | File size in bytes at time of upload                           |
| `storageId`      | string   | Opaque Convex storage ID returned by `storage.store()`         |
| `uploadedAt`     | number   | Unix timestamp of upload                                       |

Queries for files by entity are performed against this metadata table, not against storage paths.

---

## Logical Path Convention

To support display, querying, and future migration, each file record carries a logical path string stored in the metadata table. These paths are **not** actual storage paths — Convex does not use them for retrieval. They exist solely for human readability and structured querying.

| File Category         | Logical Path Pattern                                                  |
|-----------------------|-----------------------------------------------------------------------|
| Org logo              | `orgs/{orgId}/logo.{ext}`                                             |
| Invoice attachment    | `orgs/{orgId}/invoices/{invoiceId}/attachments/{fileId}.{ext}`        |
| Line item image       | `orgs/{orgId}/invoices/{invoiceId}/items/{itemId}.{ext}`              |
| Generated PDF         | `orgs/{orgId}/invoices/{invoiceId}/invoice.pdf`                       |

---

## Implications

### Quota Enforcement

- Quota checks are performed inside Convex mutations before calling `storage.store()`.
- The `sizeBytes` field in the metadata table is used to compute current usage per org.
- Uploads that would exceed quota are rejected before any storage write occurs.

### Deletion

- Deleting a file requires two steps: delete the metadata record and call `storage.delete(storageId)`.
- Metadata and storage deletion should be co-located in a single mutation to avoid orphaned storage entries.
- If a metadata record is deleted without deleting the storage entry, the file becomes unreachable but still consumes quota. Defensive cleanup should be considered.

### CDN Access

- Convex generates public-accessible URLs for stored files via `storage.getUrl(storageId)`.
- URL generation should be performed at query time and not persisted, as URLs may change.
- Access control is enforced at the query level by verifying `orgId` membership before returning a URL.

---

## V2 Considerations

If storage volume, cost, or latency requirements exceed what Convex File Storage can provide:

- Migrate to Cloudflare R2 or Amazon S3.
- The metadata table design is provider-agnostic. The `storageId` field can be repurposed to store an external object key.
- The logical path convention maps directly to S3/R2 key naming, simplifying migration.
- Presigned URL generation and CORS configuration would need to be introduced at migration time.
- No changes to the metadata schema are expected to be required for migration.
