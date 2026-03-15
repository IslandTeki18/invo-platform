export const StripeConnectAccountStatus = {
  NOT_CONNECTED: "NOT_CONNECTED",
  PENDING: "PENDING",
  CONNECTED: "CONNECTED",
  CHARGES_ENABLED: "CHARGES_ENABLED",
} as const;

export type StripeConnectAccountStatus =
  (typeof StripeConnectAccountStatus)[keyof typeof StripeConnectAccountStatus];

export const StripeWebhookEventType = {
  CHECKOUT_SESSION_COMPLETED: "checkout.session.completed",
  CHECKOUT_SESSION_EXPIRED: "checkout.session.expired",
  CUSTOMER_SUBSCRIPTION_CREATED: "customer.subscription.created",
  CUSTOMER_SUBSCRIPTION_UPDATED: "customer.subscription.updated",
  CUSTOMER_SUBSCRIPTION_DELETED: "customer.subscription.deleted",
  ACCOUNT_UPDATED: "account.updated",
  CHARGE_REFUNDED: "charge.refunded",
} as const;

export type StripeWebhookEventType =
  (typeof StripeWebhookEventType)[keyof typeof StripeWebhookEventType];
