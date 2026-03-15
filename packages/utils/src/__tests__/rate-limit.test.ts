import { describe, it, expect } from "vitest";
import {
  emailRateLimitKey,
  paymentRateLimitKey,
  isWithinRateLimit,
  isWindowExpired,
} from "../rate-limit";

describe("emailRateLimitKey", () => {
  it("returns formatted key with orgId", () => {
    expect(emailRateLimitKey("org_123")).toBe("email:org_123");
  });
});

describe("paymentRateLimitKey", () => {
  it("returns formatted key with invoiceId", () => {
    expect(paymentRateLimitKey("inv_456")).toBe("payment:inv_456");
  });
});

describe("isWithinRateLimit", () => {
  it("returns true when count is under the limit", () => {
    expect(isWithinRateLimit(3, 10)).toBe(true);
  });

  it("returns false when count equals the limit", () => {
    expect(isWithinRateLimit(10, 10)).toBe(false);
  });

  it("returns false when count exceeds the limit", () => {
    expect(isWithinRateLimit(15, 10)).toBe(false);
  });
});

describe("isWindowExpired", () => {
  it("returns true when window has expired", () => {
    const windowStart = 1000;
    const windowMs = 500;
    const now = 2000;
    expect(isWindowExpired(windowStart, windowMs, now)).toBe(true);
  });

  it("returns false when window has not expired", () => {
    const windowStart = 1000;
    const windowMs = 5000;
    const now = 2000;
    expect(isWindowExpired(windowStart, windowMs, now)).toBe(false);
  });

  it("returns true at exact boundary (elapsed === windowMs)", () => {
    const windowStart = 1000;
    const windowMs = 1000;
    const now = 2000;
    expect(isWindowExpired(windowStart, windowMs, now)).toBe(true);
  });

  it("returns false one ms before expiry", () => {
    const windowStart = 1000;
    const windowMs = 1000;
    const now = 1999;
    expect(isWindowExpired(windowStart, windowMs, now)).toBe(false);
  });
});
