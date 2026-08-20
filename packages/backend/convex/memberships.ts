import { v, ConvexError } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth, requireOrgMember } from "./lib/auth";
import { OrganizationRole } from "@repo/types";

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function getOrgMembership(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  userId: Id<"users">,
) {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_orgId_userId", (q) =>
      q.eq("orgId", orgId).eq("userId", userId),
    )
    .unique();

  if (!membership) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Membership not found.",
    });
  }

  return membership;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const results = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          _id: m._id,
          userId: m.userId,
          orgId: m.orgId,
          role: m.role,
          joinedAt: m.joinedAt,
          email: user?.email ?? "",
        };
      }),
    );

    return results;
  },
});

export const get = query({
  args: {
    membershipId: v.id("memberships"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Membership not found.",
      });
    }

    await requireOrgMember(ctx, membership.orgId);

    const user = await ctx.db.get(membership.userId);

    return {
      _id: membership._id,
      userId: membership.userId,
      orgId: membership.orgId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      email: user?.email ?? "",
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const updateRole = mutation({
  args: {
    orgId: v.id("organizations"),
    targetUserId: v.id("users"),
    newRole: v.union(v.literal("ADMIN"), v.literal("MEMBER")),
  },
  handler: async (ctx, args) => {
    const { user, membership: callerMembership } = await requireOrgMember(
      ctx,
      args.orgId,
    );

    if (
      callerMembership.role !== "OWNER" &&
      callerMembership.role !== "ADMIN"
    ) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only owners and admins can manage members.",
      });
    }

    if (user._id === args.targetUserId) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "You cannot change your own role.",
      });
    }

    const targetMembership = await getOrgMembership(
      ctx,
      args.orgId,
      args.targetUserId,
    );

    if (targetMembership.role === "OWNER") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "The owner role cannot be changed.",
      });
    }

    await ctx.db.patch(targetMembership._id, { role: args.newRole });
  },
});

export const remove = mutation({
  args: {
    orgId: v.id("organizations"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user, membership: callerMembership } = await requireOrgMember(
      ctx,
      args.orgId,
    );

    if (
      callerMembership.role !== "OWNER" &&
      callerMembership.role !== "ADMIN"
    ) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only owners and admins can remove members.",
      });
    }

    if (user._id === args.targetUserId) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "You cannot remove yourself. Use leave instead.",
      });
    }

    const targetMembership = await getOrgMembership(
      ctx,
      args.orgId,
      args.targetUserId,
    );

    if (targetMembership.role === "OWNER") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "The organization owner cannot be removed.",
      });
    }

    await ctx.db.delete(targetMembership._id);
  },
});

export const leave = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOrgMember(ctx, args.orgId);

    if (membership.role === "OWNER") {
      throw new ConvexError({
        code: "OWNER_MUST_DELETE_ORG",
        message:
          "As the organization owner, you must delete the organization instead of leaving.",
      });
    }

    await ctx.db.delete(membership._id);
  },
});

// ---------------------------------------------------------------------------
// Internal queries (for use by actions)
// ---------------------------------------------------------------------------

export const getOrgOwner = internalQuery({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
    const owner = memberships.find((m) => m.role === OrganizationRole.OWNER);
    if (!owner) throw new ConvexError({ code: "NOT_FOUND", message: "Org owner not found." });
    const user = await ctx.db.get(owner.userId);
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "Owner user not found." });
    return { email: user.email, userId: user._id };
  },
});
