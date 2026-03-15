import { describe, it, expect } from "vitest";
import { isValidStatusTransition, canAcceptPayment } from "../invoice-status";
import { InvoiceStatus } from "@repo/types";

describe("isValidStatusTransition", () => {
  describe("valid transitions", () => {
    const validCases: [string, string, string][] = [
      ["DRAFT", InvoiceStatus.DRAFT, InvoiceStatus.SENT],
      ["DRAFT", InvoiceStatus.DRAFT, InvoiceStatus.VOID],
      ["SENT", InvoiceStatus.SENT, InvoiceStatus.VIEWED],
      ["SENT", InvoiceStatus.SENT, InvoiceStatus.PAID],
      ["SENT", InvoiceStatus.SENT, InvoiceStatus.VOID],
      ["VIEWED", InvoiceStatus.VIEWED, InvoiceStatus.PAID],
      ["VIEWED", InvoiceStatus.VIEWED, InvoiceStatus.VOID],
    ];

    it.each(validCases)(
      "allows %s -> %s",
      (_label, from, to) => {
        expect(
          isValidStatusTransition(
            from as typeof InvoiceStatus[keyof typeof InvoiceStatus],
            to as typeof InvoiceStatus[keyof typeof InvoiceStatus],
          ),
        ).toBe(true);
      },
    );
  });

  describe("invalid transitions", () => {
    it("rejects PAID -> DRAFT", () => {
      expect(isValidStatusTransition(InvoiceStatus.PAID, InvoiceStatus.DRAFT)).toBe(false);
    });

    it("rejects PAID -> SENT", () => {
      expect(isValidStatusTransition(InvoiceStatus.PAID, InvoiceStatus.SENT)).toBe(false);
    });

    it("rejects PAID -> VOID", () => {
      expect(isValidStatusTransition(InvoiceStatus.PAID, InvoiceStatus.VOID)).toBe(false);
    });

    it("rejects VOID -> DRAFT", () => {
      expect(isValidStatusTransition(InvoiceStatus.VOID, InvoiceStatus.DRAFT)).toBe(false);
    });

    it("rejects VOID -> SENT", () => {
      expect(isValidStatusTransition(InvoiceStatus.VOID, InvoiceStatus.SENT)).toBe(false);
    });

    it("rejects DRAFT -> PAID", () => {
      expect(isValidStatusTransition(InvoiceStatus.DRAFT, InvoiceStatus.PAID)).toBe(false);
    });

    it("rejects DRAFT -> VIEWED", () => {
      expect(isValidStatusTransition(InvoiceStatus.DRAFT, InvoiceStatus.VIEWED)).toBe(false);
    });

    it("rejects SENT -> DRAFT", () => {
      expect(isValidStatusTransition(InvoiceStatus.SENT, InvoiceStatus.DRAFT)).toBe(false);
    });
  });
});

describe("canAcceptPayment", () => {
  it("returns true for SENT", () => {
    expect(canAcceptPayment(InvoiceStatus.SENT)).toBe(true);
  });

  it("returns true for VIEWED", () => {
    expect(canAcceptPayment(InvoiceStatus.VIEWED)).toBe(true);
  });

  it("returns false for DRAFT", () => {
    expect(canAcceptPayment(InvoiceStatus.DRAFT)).toBe(false);
  });

  it("returns false for PAID", () => {
    expect(canAcceptPayment(InvoiceStatus.PAID)).toBe(false);
  });

  it("returns false for VOID", () => {
    expect(canAcceptPayment(InvoiceStatus.VOID)).toBe(false);
  });
});
