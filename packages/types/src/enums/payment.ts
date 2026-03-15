export const ManualPaymentMethod = {
  CASH: "CASH",
  CHECK: "CHECK",
  OTHER: "OTHER",
} as const;

export type ManualPaymentMethod =
  (typeof ManualPaymentMethod)[keyof typeof ManualPaymentMethod];
