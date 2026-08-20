import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Auth guard helpers for Convex functions.
 *
 * These are called at the start of query/mutation handlers to verify
 * authentication and authorization. They throw ConvexError on failure
 * with a structured { code, message } payload.
 *
 * Usage:
 *   const user = await requireAuth(ctx);
 *   const user = await requireAdmin(ctx);
 *   const membership = await requireOrgMember(ctx, orgId);
 */

type AuthCtx = QueryCtx | MutationCtx;

/**
 * Require that the caller is authenticated and has an internal user record.
 * Returns the internal user document.
 *
 * Throws if:
 * - No Clerk identity on the context (not signed in)
 * - No internal user record exists for the Clerk identity (pre-bootstrap)
 */
export async function requireAuth(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to perform this action.",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "USER_NOT_FOUND",
      message:
        "Internal user record not found. Please sign in again to complete setup.",
    });
  }

  return user;
}

/**
 * Require that the caller is an internal admin.
 * Checks Clerk's publicMetadata.isAdmin flag via the JWT identity.
 * Returns the internal user document.
 *
 * Throws if:
 * - Not authenticated
 * - publicMetadata.isAdmin is not true
 */
export async function requireAdmin(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to perform this action.",
    });
  }

  // Clerk populates custom claims from publicMetadata into the JWT.
  // The isAdmin flag is set via Clerk Dashboard or Backend API.
  const isAdmin = (identity as Record<string, unknown>).isAdmin === true;
  if (!isAdmin) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Admin access required.",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "USER_NOT_FOUND",
      message:
        "Internal user record not found. Please sign in again to complete setup.",
    });
  }

  return user;
}

/**
 * Require that the caller is a member of the specified organization.
 * Returns both the internal user and their membership document.
 *
 * Throws if:
 * - Not authenticated
 * - User is not a member of the organization
 */
export async function requireOrgMember(
  ctx: AuthCtx,
  orgId: Id<"organizations">,
): Promise<{ user: Doc<"users">; membership: Doc<"memberships"> }> {
  const user = await requireAuth(ctx);

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_orgId_userId", (q) =>
      q.eq("orgId", orgId).eq("userId", user._id),
    )
    .unique();

  if (!membership) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization.",
    });
  }

  return { user, membership };
}
