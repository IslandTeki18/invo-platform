import { z } from "zod/v4";

export const lineItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().int().nonnegative(),
  taxable: z.boolean(),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;
