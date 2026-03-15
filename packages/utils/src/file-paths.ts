export function orgLogoPath(orgId: string, ext: string): string {
  return `orgs/${orgId}/logo.${ext}`;
}

export function invoiceAttachmentPath(
  orgId: string,
  invoiceId: string,
  fileId: string,
  ext: string,
): string {
  return `orgs/${orgId}/invoices/${invoiceId}/attachments/${fileId}.${ext}`;
}

export function lineItemImagePath(
  orgId: string,
  invoiceId: string,
  itemId: string,
  ext: string,
): string {
  return `orgs/${orgId}/invoices/${invoiceId}/items/${itemId}.${ext}`;
}

export function invoicePdfPath(orgId: string, invoiceId: string): string {
  return `orgs/${orgId}/invoices/${invoiceId}/invoice.pdf`;
}
