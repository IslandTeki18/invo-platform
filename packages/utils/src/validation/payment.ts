import { z } from "zod/v4";
import { ManualPaymentMethod, ACCESS_TOKEN_LENGTH } from "@repo/types";

export const manualPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  method: z.enum([
    ManualPaymentMethod.CASH,
    ManualPaymentMethod.CHECK,
    ManualPaymentMethod.OTHER,
  ]),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;

export const accessTokenSchema = z
  .string()
  .regex(new RegExp(`^[a-f0-9]{${ACCESS_TOKEN_LENGTH}}$`));

export type AccessToken = z.infer<typeof accessTokenSchema>;
