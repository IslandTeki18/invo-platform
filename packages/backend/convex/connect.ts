import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";
import { StripeConnectAccountStatus } from "@repo/types";

function deriveStatus(chargesEnabled: boolean, detailsSubmitted: boolean) {
  if (chargesEnabled) return StripeConnectAccountStatus.CHARGES_ENABLED;
  if (detailsSubmitted) return StripeConnectAccountStatus.CONNECTED;
  return StripeConnectAccountStatus.PENDING;
}

export const getForOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);
    const account = await ctx.db
      .query("stripeConnectAccounts")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .unique();
    if (!account) return null;
    return {
      status: account.status,
      chargesEnabled: account.chargesEnabled,
      detailsSubmitted: account.detailsSubmitted,
    };
  },
});

export const getByOrg = internalQuery({
  args: { orgId: v.id("organizations"), requireOwner: v.boolean() },
  handler: async (ctx, args) => {
    const { membership } = await requireOrgMember(ctx, args.orgId);
    if (args.requireOwner && membership.role !== "OWNER") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only the owner can connect Stripe.",
      });
    }
    return ctx.db
      .query("stripeConnectAccounts")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .unique();
  },
});

export const upsert = internalMutation({
  args: {
    stripeAccountId: v.string(),
    orgId: v.optional(v.id("organizations")),
    chargesEnabled: v.boolean(),
    detailsSubmitted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeConnectAccounts")
      .withIndex("by_stripeAccountId", (q) => q.eq("stripeAccountId", args.stripeAccountId))
      .unique();
    const status = deriveStatus(args.chargesEnabled, args.detailsSubmitted);

    if (existing) {
      await ctx.db.patch(existing._id, {
        chargesEnabled: args.chargesEnabled,
        detailsSubmitted: args.detailsSubmitted,
        status,
      });
      return;
    }
    if (!args.orgId) return;
    await ctx.db.insert("stripeConnectAccounts", {
      stripeAccountId: args.stripeAccountId,
      orgId: args.orgId,
      chargesEnabled: args.chargesEnabled,
      detailsSubmitted: args.detailsSubmitted,
      status,
    });
  },
});
