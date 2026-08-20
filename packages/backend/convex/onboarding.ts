import { v, ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";

/**
 * Get the onboarding status for a specific organization.
 *
 * Derives status from existing data rather than storing it separately:
 * - accountCreated: always true (user is authenticated)
 * - orgCreated: always true (org exists if we pass the member guard)
 * - businessInfoSet: org has a complete business address
 * - stripeConnected: Stripe Connect account exists with charges enabled
 */
export const getStatus = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Organization not found.",
      });
    }

    // Business address: all fields must be non-empty
    let businessInfoSet = false;
    if (org.businessAddress) {
      const { street, city, state, postalCode, country } = org.businessAddress;
      businessInfoSet = [street, city, state, postalCode, country].every(
        (field) => field.trim().length > 0,
      );
    }

    // Stripe Connect: account must exist with charges enabled
    const stripeAccount = await ctx.db
      .query("stripeConnectAccounts")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .unique();

    const stripeConnected =
      stripeAccount !== null && stripeAccount.chargesEnabled;

    return {
      accountCreated: true,
      orgCreated: true,
      businessInfoSet,
      stripeConnected,
      readyToSendInvoice:
        org.name.trim().length > 0 && businessInfoSet && stripeConnected,
    };
  },
});

/**
 * Get onboarding status without an org context.
 *
 * Used before the user has created their first organization.
 * Returns which top-level steps are complete.
 */
export const getAccountStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        accountCreated: false,
        orgCreated: false,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return {
        accountCreated: false,
        orgCreated: false,
      };
    }

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return {
      accountCreated: true,
      orgCreated: memberships.length > 0,
    };
  },
});
