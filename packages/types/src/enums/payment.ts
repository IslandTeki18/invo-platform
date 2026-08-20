export const ManualPaymentMethod = {
  CASH: "CASH",
  CHECK: "CHECK",
  OTHER: "OTHER",
} as const;

export type ManualPaymentMethod =
  (typeof ManualPaymentMethod)[keyof typeof ManualPaymentMethod];

export const PaymentMethod = {
  ...ManualPaymentMethod,
  STRIPE: "STRIPE",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
