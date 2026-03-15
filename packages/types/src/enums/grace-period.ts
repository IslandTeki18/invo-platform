export const GracePeriodState = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

export type GracePeriodState =
  (typeof GracePeriodState)[keyof typeof GracePeriodState];
