import { z } from "zod/v4";
import { OrganizationRole } from "@repo/types";

export const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum([OrganizationRole.ADMIN, OrganizationRole.MEMBER]),
});

export type InvitationInput = z.infer<typeof invitationSchema>;
