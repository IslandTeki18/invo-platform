import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  subscriptionTierValidator,
  subscriptionStatusValidator,
  organizationRoleValidator,
  invoiceStatusValidator,
  invitationStatusValidator,
  manualPaymentMethodValidator,
  stripeConnectAccountStatusValidator,
  gracePeriodStateValidator,
  businessAddressValidator,
  clientSnapshotValidator,
  lineItemValidator,
  discountValidator,
  taxDataValidator,
  expenseSnapshotValidator,
} from "./lib/validators";

export default defineSchema({
  // --- Core entity tables ---

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    subscriptionTier: subscriptionTierValidator,
    orgCountLimit: v.number(),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  organizations: defineTable({
    name: v.string(),
    subdomain: v.string(),
    businessAddress: v.optional(businessAddressValidator),
    logoUrl: v.optional(v.string()),
    storageUsed: v.number(),
    createdAt: v.number(),
  }).index("by_subdomain", ["subdomain"]),

  memberships: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: organizationRoleValidator,
    joinedAt: v.number(),
  })
    .index("by_orgId_userId", ["orgId", "userId"])
    .index("by_userId", ["userId"]),

  invitations: defineTable({
    orgId: v.id("organizations"),
    inviterId: v.id("users"),
    email: v.string(),
    role: organizationRoleValidator,
    createdAt: v.number(),
    expiresAt: v.number(),
    status: invitationStatusValidator,
  })
    .index("by_email_orgId", ["email", "orgId"])
    .index("by_orgId", ["orgId"]),

  clients: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    archived: v.boolean(),
    orgId: v.id("organizations"),
  })
    .index("by_orgId_email", ["orgId", "email"])
    .index("by_orgId", ["orgId"]),

  itemPresets: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    defaultPrice: v.number(),
    taxable: v.boolean(),
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),

  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    orgId: v.id("organizations"),
  }).index("by_orgId", ["orgId"]),

  // --- Invoice tables ---

  invoices: defineTable({
    orgId: v.id("organizations"),
    clientSnapshot: v.optional(clientSnapshotValidator),
    lineItems: v.array(lineItemValidator),
    expenses: v.array(expenseSnapshotValidator),
    subtotal: v.number(),
    discount: v.optional(discountValidator),
    tax: v.optional(taxDataValidator),
    total: v.number(),
    status: invoiceStatusValidator,
    accessToken: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    voidedAt: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId_status", ["orgId", "status"])
    .index("by_accessToken", ["accessToken"]),

  invoiceViewEvents: defineTable({
    invoiceId: v.id("invoices"),
    timestamp: v.number(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    isFirstView: v.boolean(),
  }).index("by_invoiceId", ["invoiceId"]),

  // --- File and attachment tables ---

  files: defineTable({
    orgId: v.id("organizations"),
    ownerEntityType: v.string(),
    ownerEntityId: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    storageId: v.string(),
    logicalPath: v.optional(v.string()),
    uploadedAt: v.number(),
  }).index("by_orgId", ["orgId"]),

  attachments: defineTable({
    fileId: v.id("files"),
    invoiceId: v.id("invoices"),
    displayName: v.string(),
  }).index("by_invoiceId", ["invoiceId"]),

  // --- Operational tables ---

  logs: defineTable({
    eventType: v.string(),
    actorId: v.optional(v.string()),
    orgId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_eventType", ["eventType"])
    .index("by_createdAt", ["createdAt"]),

  rateLimitBuckets: defineTable({
    key: v.string(),
    count: v.number(),
    windowStart: v.number(),
    windowEnd: v.number(),
  }).index("by_key", ["key"]),

  downgradeGracePeriods: defineTable({
    userId: v.id("users"),
    excessOrgIds: v.array(v.id("organizations")),
    graceStartDate: v.number(),
    graceEndDate: v.number(),
    state: gracePeriodStateValidator,
  }).index("by_userId", ["userId"]),

  // --- Stripe integration tables ---

  stripeSubscriptions: defineTable({
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    userId: v.id("users"),
    tier: subscriptionTierValidator,
    status: subscriptionStatusValidator,
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

  stripeConnectAccounts: defineTable({
    stripeAccountId: v.string(),
    orgId: v.id("organizations"),
    status: stripeConnectAccountStatusValidator,
    chargesEnabled: v.boolean(),
    detailsSubmitted: v.boolean(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_stripeAccountId", ["stripeAccountId"]),

  // --- Payment tables ---

  checkoutSessions: defineTable({
    stripeSessionId: v.string(),
    invoiceId: v.id("invoices"),
    amount: v.number(),
    status: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_stripeSessionId", ["stripeSessionId"])
    .index("by_invoiceId", ["invoiceId"]),

  paymentRecords: defineTable({
    invoiceId: v.id("invoices"),
    method: manualPaymentMethodValidator,
    amount: v.number(),
    reference: v.optional(v.string()),
    paidAt: v.number(),
    paidBy: v.string(),
  }).index("by_invoiceId", ["invoiceId"]),

  paymentAttempts: defineTable({
    invoiceId: v.id("invoices"),
    ip: v.string(),
    timestamp: v.number(),
    success: v.boolean(),
  }).index("by_invoiceId", ["invoiceId"]),
});
