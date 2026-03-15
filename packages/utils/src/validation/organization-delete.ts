import { z } from "zod/v4";

export const organizationDeleteConfirmationSchema = z
  .object({
    orgId: z.string().min(1),
    confirmationName: z.string().min(1),
    orgName: z.string().min(1),
  })
  .refine((data) => data.confirmationName === data.orgName, {
    message: "Confirmation name must match organization name",
    path: ["confirmationName"],
  });

export type OrganizationDeleteConfirmationInput = z.infer<
  typeof organizationDeleteConfirmationSchema
>;
