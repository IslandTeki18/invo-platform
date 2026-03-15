import { z } from "zod/v4";

export const businessAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

export type BusinessAddressInput = z.infer<typeof businessAddressSchema>;

export const organizationCreateSchema = z.object({
  name: z.string().min(1).max(100),
});

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;

export const organizationSettingsUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  businessAddress: businessAddressSchema.optional(),
  logoUrl: z.string().url().nullable().optional(),
});

export type OrganizationSettingsUpdateInput = z.infer<
  typeof organizationSettingsUpdateSchema
>;
