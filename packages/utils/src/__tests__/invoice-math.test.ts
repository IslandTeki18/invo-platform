import { describe, it, expect } from "vitest";
import {
  calculateLineItemTotal,
  calculateSubtotal,
  applyDiscount,
  calculateTax,
  calculateInvoiceTotal,
} from "../invoice-math";
import type { Discount } from "@repo/types";

describe("calculateLineItemTotal", () => {
  it("calculates total for integer quantity", () => {
    expect(calculateLineItemTotal(2, 1000)).toBe(2000);
  });

  it("calculates total for decimal quantity", () => {
    expect(calculateLineItemTotal(1.5, 1000)).toBe(1500);
  });

  it("rounds fractional cents", () => {
    // 3 * 333 = 999, but 0.33 * 1000 = 330
    expect(calculateLineItemTotal(0.33, 1000)).toBe(330);
    // 1.5 * 999 = 1498.5 -> rounds to 1499
    expect(calculateLineItemTotal(1.5, 999)).toBe(1499);
  });

  it("returns zero for zero price", () => {
    expect(calculateLineItemTotal(5, 0)).toBe(0);
  });

  it("returns zero for zero quantity", () => {
    expect(calculateLineItemTotal(0, 1000)).toBe(0);
  });
});

describe("calculateSubtotal", () => {
  it("sums multiple line items", () => {
    const items = [
      { quantity: 2, unitPrice: 1000 },
      { quantity: 1, unitPrice: 500 },
    ];
    expect(calculateSubtotal(items)).toBe(2500);
  });

  it("returns zero for empty array", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("handles single item", () => {
    expect(calculateSubtotal([{ quantity: 3, unitPrice: 1500 }])).toBe(4500);
  });
});

describe("applyDiscount", () => {
  it("returns subtotal when discount is null", () => {
    expect(applyDiscount(10000, null)).toBe(10000);
  });

  describe("percentage discount", () => {
    it("applies 10% discount", () => {
      const discount: Discount = { type: "percentage", value: 10 };
      expect(applyDiscount(10000, discount)).toBe(9000);
    });

    it("applies 50% discount", () => {
      const discount: Discount = { type: "percentage", value: 50 };
      expect(applyDiscount(10000, discount)).toBe(5000);
    });

    it("applies 100% discount", () => {
      const discount: Discount = { type: "percentage", value: 100 };
      expect(applyDiscount(10000, discount)).toBe(0);
    });
  });

  describe("fixed discount", () => {
    it("applies fixed discount less than subtotal", () => {
      const discount: Discount = { type: "fixed", value: 2000 };
      expect(applyDiscount(10000, discount)).toBe(8000);
    });

    it("applies fixed discount equal to subtotal", () => {
      const discount: Discount = { type: "fixed", value: 10000 };
      expect(applyDiscount(10000, discount)).toBe(0);
    });

    it("clamps to zero when fixed discount exceeds subtotal", () => {
      const discount: Discount = { type: "fixed", value: 15000 };
      expect(applyDiscount(10000, discount)).toBe(0);
    });
  });
});

describe("calculateTax", () => {
  it("calculates tax when all items are taxable", () => {
    const result = calculateTax(10000, 10000, 10000, 10);
    expect(result.rate).toBe(10);
    expect(result.amount).toBe(1000);
    expect(result.taxableSubtotal).toBe(10000);
  });

  it("calculates tax with mixed taxable/non-taxable items", () => {
    // subtotal 10000, taxable 5000, after discount 8000
    // taxableAfterDiscount = round(5000 * (8000 / 10000)) = 4000
    // tax = round(4000 * 10 / 100) = 400
    const result = calculateTax(8000, 5000, 10000, 10);
    expect(result.amount).toBe(400);
    expect(result.taxableSubtotal).toBe(4000);
  });

  it("returns zero amount for zero tax rate", () => {
    const result = calculateTax(10000, 10000, 10000, 0);
    expect(result.amount).toBe(0);
  });

  it("returns zero when subtotal is zero", () => {
    const result = calculateTax(0, 0, 0, 10);
    expect(result.amount).toBe(0);
    expect(result.taxableSubtotal).toBe(0);
  });
});

describe("calculateInvoiceTotal", () => {
  it("calculates full invoice total end-to-end", () => {
    const result = calculateInvoiceTotal({
      lineItems: [
        { quantity: 2, unitPrice: 5000, taxable: true },
        { quantity: 1, unitPrice: 3000, taxable: false },
      ],
      discount: { type: "percentage", value: 10 },
      taxRate: 8,
    });

    expect(result.subtotal).toBe(13000);
    // 13000 * 0.9 = 11700
    expect(result.discountedSubtotal).toBe(11700);
    // taxable subtotal = 10000
    // taxableAfterDiscount = round(10000 * (11700 / 13000)) = 9000
    // tax = round(9000 * 8 / 100) = 720
    expect(result.tax.amount).toBe(720);
    expect(result.total).toBe(11700 + 720);
  });

  it("handles zero-amount invoice", () => {
    const result = calculateInvoiceTotal({
      lineItems: [{ quantity: 0, unitPrice: 1000, taxable: true }],
      discount: null,
      taxRate: 10,
    });

    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it("discount larger than subtotal does not produce negative total", () => {
    const result = calculateInvoiceTotal({
      lineItems: [{ quantity: 1, unitPrice: 1000, taxable: true }],
      discount: { type: "fixed", value: 5000 },
      taxRate: 10,
    });

    expect(result.discountedSubtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it("handles rounding edge case with fractional cents", () => {
    // 3 * 333 = 999
    const result = calculateInvoiceTotal({
      lineItems: [{ quantity: 3, unitPrice: 333, taxable: true }],
      discount: null,
      taxRate: 7,
    });

    expect(result.subtotal).toBe(999);
    // tax = round(999 * 7 / 100) = round(69.93) = 70
    expect(result.tax.amount).toBe(70);
    expect(result.total).toBe(999 + 70);
  });
});
