import { v } from "convex/values";
import type { Validator } from "convex/values";
import {
  SubscriptionTier,
  SubscriptionStatus,
  OrganizationRole,
  InvoiceStatus,
  InvitationStatus,
  PaymentMethod,
  StripeConnectAccountStatus,
  GracePeriodState,
} from "@repo/types";

// ---------------------------------------------------------------------------
// Generic helper: converts an `as const` enum object into a Convex union
// ---------------------------------------------------------------------------

function enumValidator<T extends Record<string, string>>(enumObj: T): Validator<T[keyof T], "required", never> {
  const literals = Object.values(enumObj).map((val) => v.literal(val));
  const [first, second, ...rest] = literals;
  // v.union requires at least 2 members; cast narrows the widened `string` union back to the enum's literals
  return v.union(first!, second!, ...rest) as unknown as Validator<T[keyof T], "required", never>;
}

// ---------------------------------------------------------------------------
// Enum validators (9)
// ---------------------------------------------------------------------------

export const subscriptionTierValidator = enumValidator(SubscriptionTier);
export const subscriptionStatusValidator = enumValidator(SubscriptionStatus);
export const organizationRoleValidator = enumValidator(OrganizationRole);
export const invoiceStatusValidator = enumValidator(InvoiceStatus);
export const invitationStatusValidator = enumValidator(InvitationStatus);
export const paymentMethodValidator = enumValidator(PaymentMethod);
export const stripeConnectAccountStatusValidator = enumValidator(
  StripeConnectAccountStatus,
);
export const gracePeriodStateValidator = enumValidator(GracePeriodState);
export const discountTypeValidator = v.union(
  v.literal("percentage"),
  v.literal("fixed"),
);

// ---------------------------------------------------------------------------
// Object shape validators (6)
// ---------------------------------------------------------------------------

export const businessAddressValidator = v.object({
  street: v.string(),
  city: v.string(),
  state: v.string(),
  postalCode: v.string(),
  country: v.string(),
});

export const clientSnapshotValidator = v.object({
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
});

export const lineItemValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  quantity: v.number(),
  unitPrice: v.number(),
  taxable: v.boolean(),
  total: v.number(),
  imageUrl: v.optional(v.string()),
});

export const discountValidator = v.object({
  type: discountTypeValidator,
  value: v.number(),
});

export const taxDataValidator = v.object({
  rate: v.number(),
  amount: v.number(),
  taxableSubtotal: v.number(),
});

export const expenseSnapshotValidator = v.object({
  id: v.string(),
  description: v.string(),
  amount: v.number(),
  category: v.optional(v.string()),
  orgId: v.string(),
});
