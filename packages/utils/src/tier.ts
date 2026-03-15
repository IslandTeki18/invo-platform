import {
  SubscriptionTier,
  STORAGE_QUOTA_BY_TIER,
  ORG_COUNT_LIMIT_BY_TIER,
  SUBSCRIPTION_PRICING,
} from "@repo/types";

export function getStorageQuota(tier: SubscriptionTier): number {
  return STORAGE_QUOTA_BY_TIER[tier];
}

export function getOrgCountLimit(tier: SubscriptionTier): number {
  return ORG_COUNT_LIMIT_BY_TIER[tier];
}

export function getSubscriptionPrice(tier: SubscriptionTier): number {
  return SUBSCRIPTION_PRICING[tier];
}
