import type { OrganizationRole } from "../enums/organization";
import type { InvitationStatus } from "../enums/invitation";

export interface Invitation {
  id: string;
  orgId: string;
  inviterId: string;
  email: string;
  role: OrganizationRole;
  createdAt: number;
  expiresAt: number;
  status: InvitationStatus;
}
