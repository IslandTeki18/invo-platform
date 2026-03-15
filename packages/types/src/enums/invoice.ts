export const InvoiceStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  VIEWED: "VIEWED",
  PAID: "PAID",
  VOID: "VOID",
} as const;

export type InvoiceStatus =
  (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
