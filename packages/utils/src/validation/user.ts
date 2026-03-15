import { z } from "zod/v4";
import { SubscriptionTier } from "@repo/types";

export const userSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  subscriptionTier: z.enum([
    SubscriptionTier.BASE,
    SubscriptionTier.PLUS,
    SubscriptionTier.PRO,
  ]),
  orgCountLimit: z.number().int().positive(),
});

export type UserInput = z.infer<typeof userSchema>;
