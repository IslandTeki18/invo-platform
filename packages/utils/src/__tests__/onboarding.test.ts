import { describe, it, expect } from "vitest";
import {
  isOrgNameSet,
  isBusinessAddressSet,
  isStripeConnected,
  isReadyToSendInvoice,
} from "../onboarding";

const validAddress = {
  street: "123 Main St",
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  country: "US",
};

describe("isOrgNameSet", () => {
  it("returns true when name is set", () => {
    expect(isOrgNameSet({ name: "Acme Corp", businessAddress: null })).toBe(true);
  });

  it("returns false when name is empty", () => {
    expect(isOrgNameSet({ name: "", businessAddress: null })).toBe(false);
  });

  it("returns false when name is only whitespace", () => {
    expect(isOrgNameSet({ name: "   ", businessAddress: null })).toBe(false);
  });
});

describe("isBusinessAddressSet", () => {
  it("returns true when all address fields are populated", () => {
    expect(isBusinessAddressSet({ name: "Test", businessAddress: validAddress })).toBe(true);
  });

  it("returns false when businessAddress is null", () => {
    expect(isBusinessAddressSet({ name: "Test", businessAddress: null })).toBe(false);
  });

  it("returns false when any address field is empty", () => {
    expect(
      isBusinessAddressSet({
        name: "Test",
        businessAddress: { ...validAddress, city: "" },
      }),
    ).toBe(false);
  });

  it("returns false when any address field is whitespace", () => {
    expect(
      isBusinessAddressSet({
        name: "Test",
        businessAddress: { ...validAddress, state: "  " },
      }),
    ).toBe(false);
  });
});

describe("isStripeConnected", () => {
  it("returns true with accountId and chargesEnabled", () => {
    expect(
      isStripeConnected({
        name: "Test",
        businessAddress: null,
        stripeAccountId: "acct_123",
        chargesEnabled: true,
      }),
    ).toBe(true);
  });

  it("returns false when stripeAccountId is null", () => {
    expect(
      isStripeConnected({
        name: "Test",
        businessAddress: null,
        stripeAccountId: null,
        chargesEnabled: true,
      }),
    ).toBe(false);
  });

  it("returns false when chargesEnabled is false", () => {
    expect(
      isStripeConnected({
        name: "Test",
        businessAddress: null,
        stripeAccountId: "acct_123",
        chargesEnabled: false,
      }),
    ).toBe(false);
  });
});

describe("isReadyToSendInvoice", () => {
  const readyOrg = {
    name: "Acme Corp",
    businessAddress: validAddress,
    stripeAccountId: "acct_123",
    chargesEnabled: true,
  };

  it("returns true when all checks pass", () => {
    expect(isReadyToSendInvoice(readyOrg)).toBe(true);
  });

  it("returns false when name is empty", () => {
    expect(isReadyToSendInvoice({ ...readyOrg, name: "" })).toBe(false);
  });

  it("returns false when address is null", () => {
    expect(isReadyToSendInvoice({ ...readyOrg, businessAddress: null })).toBe(false);
  });

  it("returns false when stripe is not connected", () => {
    expect(isReadyToSendInvoice({ ...readyOrg, stripeAccountId: null })).toBe(false);
  });
});
