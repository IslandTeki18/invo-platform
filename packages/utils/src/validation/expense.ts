import { z } from "zod/v4";

export const expenseSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().int().positive(),
  category: z.string().nullable().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
