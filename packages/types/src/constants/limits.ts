import type { SubscriptionTier } from "../enums/subscription";

export const STORAGE_QUOTA_BY_TIER: Record<SubscriptionTier, number> = {
  BASE: 500 * 1024 * 1024, // 500 MB
  PLUS: 10 * 1024 * 1024 * 1024, // 10 GB
  PRO: 100 * 1024 * 1024 * 1024, // 100 GB
} as const;

export const ORG_COUNT_LIMIT_BY_TIER: Record<SubscriptionTier, number> = {
  BASE: 1,
  PLUS: 5,
  PRO: 25,
} as const;

/** Subscription pricing in cents (USD) per month */
export const SUBSCRIPTION_PRICING: Record<SubscriptionTier, number> = {
  BASE: 0, // Free
  PLUS: 1_999, // $19.99
  PRO: 4_999, // $49.99
} as const;

export const ACCESS_TOKEN_LENGTH = 32 as const;
