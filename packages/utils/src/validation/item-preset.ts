import { z } from "zod/v4";

export const itemPresetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  defaultPrice: z.number().int().nonnegative(),
  taxable: z.boolean(),
});

export type ItemPresetInput = z.infer<typeof itemPresetSchema>;
