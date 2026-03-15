import type { SubscriptionTier } from "../enums/subscription";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  orgCountLimit: number;
  createdAt: number;
}
