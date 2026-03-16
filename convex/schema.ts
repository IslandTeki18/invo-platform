import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    subscriptionTier: v.union(
      v.literal("BASE"),
      v.literal("PLUS"),
      v.literal("PRO"),
    ),
    orgCountLimit: v.number(),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // Minimal memberships table — needed by auth guards (section 3.4).
  // Section 4 will expand this with additional fields if needed.
  memberships: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: v.union(
      v.literal("OWNER"),
      v.literal("ADMIN"),
      v.literal("MEMBER"),
    ),
    joinedAt: v.number(),
  }).index("by_orgId_userId", ["orgId", "userId"]),

  // Minimal organizations table — referenced by memberships.
  // Section 4 will expand this with additional fields.
  organizations: defineTable({
    name: v.string(),
    subdomain: v.string(),
    businessAddress: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
    ),
    logoUrl: v.optional(v.string()),
    storageUsed: v.number(),
    createdAt: v.number(),
  }).index("by_subdomain", ["subdomain"]),
});
