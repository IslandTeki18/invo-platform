import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Bootstrap: called on first auth. Creates an internal user record if one
 * does not already exist for the authenticated Clerk user.
 *
 * Idempotent — safe to call on every login. If a user record already exists
 * for the authenticated Clerk user, it returns the existing record's ID without
 * mutation.
 *
 * Race-condition handling: two simultaneous first-logins for the same Clerk
 * user will both query by clerkId. The first to write wins; the second sees
 * the existing record and returns early.
 */
export const bootstrap = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED" });
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      subscriptionTier: "BASE",
      orgCountLimit: 1,
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Get the current user's internal record by their Clerk ID.
 * Returns null if no internal user exists yet (pre-bootstrap).
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

/**
 * Get a user by their Clerk ID. Used internally by other Convex functions.
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});
