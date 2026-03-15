import { OrganizationRole } from "@repo/types";

export function canSendInvoice(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export function canManageMembers(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export function canManageBilling(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}

export function canDeleteOrganization(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}

export function canEditDraft(role: OrganizationRole): boolean {
  return (
    role === OrganizationRole.OWNER ||
    role === OrganizationRole.ADMIN ||
    role === OrganizationRole.MEMBER
  );
}

export function canAccessAdminPanel(isAdmin: boolean): boolean {
  return isAdmin;
}
