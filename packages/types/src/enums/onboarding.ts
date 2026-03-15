export const OnboardingStep = {
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  ORG_CREATED: "ORG_CREATED",
  BUSINESS_INFO_SET: "BUSINESS_INFO_SET",
  STRIPE_CONNECTED: "STRIPE_CONNECTED",
} as const;

export type OnboardingStep =
  (typeof OnboardingStep)[keyof typeof OnboardingStep];
