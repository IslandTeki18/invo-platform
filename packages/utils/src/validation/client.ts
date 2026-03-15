import { z } from "zod/v4";

export const clientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
