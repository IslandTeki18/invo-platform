export function buildInvoiceUrl(
  appUrl: string,
  invoiceId: string,
  token: string,
): string {
  return `${appUrl}/invoice/${invoiceId}?token=${token}`;
}

export function buildPdfFilename(invoiceId: string): string {
  return `invoice_${invoiceId}.pdf`;
}
