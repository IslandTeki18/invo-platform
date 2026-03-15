import type { OrganizationRole } from "../enums/organization";

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: OrganizationRole;
  joinedAt: number;
}
