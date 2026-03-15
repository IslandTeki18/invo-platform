import { describe, it, expect } from "vitest";
import { normalizeEmail } from "../email-normalize";
import { centsToDollars, dollarsToCents, formatMoney } from "../money";
import { calculateDueDate, isOverdue, calculateReminderDate } from "../dates";
import { buildInvoiceUrl, buildPdfFilename } from "../url-builders";
import {
  orgLogoPath,
  invoiceAttachmentPath,
  lineItemImagePath,
  invoicePdfPath,
} from "../file-paths";
import { formatFileSize } from "../file-size";

describe("normalizeEmail", () => {
  it("lowercases the email", () => {
    expect(normalizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("trims whitespace", () => {
    expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("trims and lowercases", () => {
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });
});

describe("centsToDollars / dollarsToCents", () => {
  it("converts cents to dollars", () => {
    expect(centsToDollars(1500)).toBe(15);
  });

  it("converts dollars to cents", () => {
    expect(dollarsToCents(15)).toBe(1500);
  });

  it("round-trips correctly", () => {
    expect(dollarsToCents(centsToDollars(9999))).toBe(9999);
  });

  it("rounds fractional cents in dollarsToCents", () => {
    expect(dollarsToCents(19.999)).toBe(2000);
  });
});

describe("formatMoney", () => {
  it("formats cents as dollar string", () => {
    expect(formatMoney(1500)).toBe("$15.00");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("formats cents with fractional dollars", () => {
    expect(formatMoney(99)).toBe("$0.99");
  });
});

describe("calculateDueDate", () => {
  it("adds term days to created date", () => {
    const createdAt = 0;
    const termsDays = 30;
    const msPerDay = 24 * 60 * 60 * 1000;
    expect(calculateDueDate(createdAt, termsDays)).toBe(30 * msPerDay);
  });
});

describe("isOverdue", () => {
  it("returns true when now is past due date", () => {
    expect(isOverdue(1000, 2000)).toBe(true);
  });

  it("returns false when now is before due date", () => {
    expect(isOverdue(2000, 1000)).toBe(false);
  });

  it("returns false when now equals due date", () => {
    expect(isOverdue(1000, 1000)).toBe(false);
  });
});

describe("calculateReminderDate", () => {
  it("returns date 3 days before due date", () => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const dueDate = 10 * msPerDay;
    expect(calculateReminderDate(dueDate)).toBe(7 * msPerDay);
  });
});

describe("buildInvoiceUrl", () => {
  it("builds correct URL format", () => {
    expect(buildInvoiceUrl("https://app.invo.com", "inv_123", "tok_abc")).toBe(
      "https://app.invo.com/invoice/inv_123?token=tok_abc",
    );
  });
});

describe("buildPdfFilename", () => {
  it("builds correct filename format", () => {
    expect(buildPdfFilename("inv_123")).toBe("invoice_inv_123.pdf");
  });
});

describe("file path builders", () => {
  it("orgLogoPath returns correct path", () => {
    expect(orgLogoPath("org_1", "png")).toBe("orgs/org_1/logo.png");
  });

  it("invoiceAttachmentPath returns correct path", () => {
    expect(invoiceAttachmentPath("org_1", "inv_2", "file_3", "pdf")).toBe(
      "orgs/org_1/invoices/inv_2/attachments/file_3.pdf",
    );
  });

  it("lineItemImagePath returns correct path", () => {
    expect(lineItemImagePath("org_1", "inv_2", "item_3", "jpg")).toBe(
      "orgs/org_1/invoices/inv_2/items/item_3.jpg",
    );
  });

  it("invoicePdfPath returns correct path", () => {
    expect(invoicePdfPath("org_1", "inv_2")).toBe(
      "orgs/org_1/invoices/inv_2/invoice.pdf",
    );
  });
});

describe("formatFileSize", () => {
  it("formats 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("formats fractional values with up to 2 decimals", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});
