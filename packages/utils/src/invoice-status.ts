import { InvoiceStatus } from "@repo/types";

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT, InvoiceStatus.VOID],
  [InvoiceStatus.SENT]: [
    InvoiceStatus.VIEWED,
    InvoiceStatus.PAID,
    InvoiceStatus.VOID,
  ],
  [InvoiceStatus.VIEWED]: [InvoiceStatus.PAID, InvoiceStatus.VOID],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.VOID]: [],
};

export function isValidStatusTransition(
  from: InvoiceStatus,
  to: InvoiceStatus,
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function canAcceptPayment(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.SENT || status === InvoiceStatus.VIEWED;
}
