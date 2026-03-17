import type { Discount, TaxData } from "@repo/types";

export function calculateLineItemTotal(
  quantity: number,
  unitPriceCents: number,
): number {
  return Math.round(quantity * unitPriceCents);
}

export function calculateSubtotal(
  lineItems: Array<{ quantity: number; unitPrice: number }>,
): number {
  return lineItems.reduce(
    (sum, item) => sum + calculateLineItemTotal(item.quantity, item.unitPrice),
    0,
  );
}

export function applyDiscount(
  subtotal: number,
  discount: Discount | null,
): number {
  if (discount === null) {
    return subtotal;
  }
  if (discount.type === "percentage") {
    return Math.max(0, Math.round(subtotal * (1 - discount.value / 100)));
  }
  return Math.max(0, subtotal - discount.value);
}

export function calculateTax(
  subtotalAfterDiscount: number,
  taxableSubtotal: number,
  subtotal: number,
  taxRate: number,
): TaxData {
  if (subtotal === 0) {
    return { rate: taxRate, amount: 0, taxableSubtotal: 0 };
  }
  const taxableAfterDiscount = Math.round(
    taxableSubtotal * (subtotalAfterDiscount / subtotal),
  );
  const amount = Math.round((taxableAfterDiscount * taxRate) / 100);
  return { rate: taxRate, amount, taxableSubtotal: taxableAfterDiscount };
}

export function calculateInvoiceTotal(params: {
  lineItems: Array<{ quantity: number; unitPrice: number; taxable: boolean }>;
  discount: Discount | null;
  taxRate: number;
}): {
  subtotal: number;
  discountedSubtotal: number;
  tax: TaxData;
  total: number;
} {
  const { lineItems, discount, taxRate } = params;

  const subtotal = calculateSubtotal(lineItems);
  const discountedSubtotal = applyDiscount(subtotal, discount);

  const taxableSubtotal = calculateSubtotal(
    lineItems.filter((item) => item.taxable),
  );

  const tax = calculateTax(
    discountedSubtotal,
    taxableSubtotal,
    subtotal,
    taxRate,
  );

  const total = discountedSubtotal + tax.amount;

  return { subtotal, discountedSubtotal, tax, total };
}
