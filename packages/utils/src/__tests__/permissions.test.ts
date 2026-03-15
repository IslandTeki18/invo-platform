import { describe, it, expect } from "vitest";
import {
  canSendInvoice,
  canManageMembers,
  canManageBilling,
  canDeleteOrganization,
  canEditDraft,
  canAccessAdminPanel,
} from "../permissions";
import { OrganizationRole } from "@repo/types";

describe("canSendInvoice", () => {
  it("returns true for OWNER", () => {
    expect(canSendInvoice(OrganizationRole.OWNER)).toBe(true);
  });

  it("returns true for ADMIN", () => {
    expect(canSendInvoice(OrganizationRole.ADMIN)).toBe(true);
  });

  it("returns false for MEMBER", () => {
    expect(canSendInvoice(OrganizationRole.MEMBER)).toBe(false);
  });
});

describe("canManageMembers", () => {
  it("returns true for OWNER", () => {
    expect(canManageMembers(OrganizationRole.OWNER)).toBe(true);
  });

  it("returns true for ADMIN", () => {
    expect(canManageMembers(OrganizationRole.ADMIN)).toBe(true);
  });

  it("returns false for MEMBER", () => {
    expect(canManageMembers(OrganizationRole.MEMBER)).toBe(false);
  });
});

describe("canManageBilling", () => {
  it("returns true for OWNER", () => {
    expect(canManageBilling(OrganizationRole.OWNER)).toBe(true);
  });

  it("returns false for ADMIN", () => {
    expect(canManageBilling(OrganizationRole.ADMIN)).toBe(false);
  });

  it("returns false for MEMBER", () => {
    expect(canManageBilling(OrganizationRole.MEMBER)).toBe(false);
  });
});

describe("canDeleteOrganization", () => {
  it("returns true for OWNER", () => {
    expect(canDeleteOrganization(OrganizationRole.OWNER)).toBe(true);
  });

  it("returns false for ADMIN", () => {
    expect(canDeleteOrganization(OrganizationRole.ADMIN)).toBe(false);
  });

  it("returns false for MEMBER", () => {
    expect(canDeleteOrganization(OrganizationRole.MEMBER)).toBe(false);
  });
});

describe("canEditDraft", () => {
  it("returns true for OWNER", () => {
    expect(canEditDraft(OrganizationRole.OWNER)).toBe(true);
  });

  it("returns true for ADMIN", () => {
    expect(canEditDraft(OrganizationRole.ADMIN)).toBe(true);
  });

  it("returns true for MEMBER", () => {
    expect(canEditDraft(OrganizationRole.MEMBER)).toBe(true);
  });
});

describe("canAccessAdminPanel", () => {
  it("returns true when isAdmin is true", () => {
    expect(canAccessAdminPanel(true)).toBe(true);
  });

  it("returns false when isAdmin is false", () => {
    expect(canAccessAdminPanel(false)).toBe(false);
  });
});
