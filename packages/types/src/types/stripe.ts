import type { SubscriptionTier, SubscriptionStatus } from "../enums/subscription";
import type { StripeConnectAccountStatus } from "../enums/stripe";

export interface StripeSubscription {
  id: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
}

export interface StripeConnectAccount {
  id: string;
  stripeAccountId: string;
  orgId: string;
  status: StripeConnectAccountStatus;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
}
