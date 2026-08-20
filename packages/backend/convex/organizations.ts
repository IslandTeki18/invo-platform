import { v, ConvexError } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAuth, requireOrgMember } from "./lib/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a 12-character hex subdomain.
 * Uses Math.random (Convex runtime does not have Node crypto).
 * Uniqueness is enforced by the caller via index lookup + retry.
 */
function generateSubdomain(): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new organization.
 *
 * - Enforces the user's org count limit (derived from subscription tier).
 * - Generates an immutable random subdomain, retrying on collision.
 * - Creates an OWNER membership for the calling user.
 */
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const name = args.name.trim();
    if (name.length === 0 || name.length > 100) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Organization name must be between 1 and 100 characters.",
      });
    }

    // --- Org count enforcement (5.2) ---
    const existingMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const ownedCount = existingMemberships.filter(
      (m) => m.role === "OWNER",
    ).length;

    if (ownedCount >= user.orgCountLimit) {
      throw new ConvexError({
        code: "ORG_LIMIT_REACHED",
        message: `You have reached your organization limit (${user.orgCountLimit}). Upgrade your plan to create more.`,
      });
    }

    // --- Generate unique subdomain ---
    let subdomain = generateSubdomain();
    let collision = await ctx.db
      .query("organizations")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", subdomain))
      .unique();

    let attempts = 0;
    while (collision && attempts < 5) {
      subdomain = generateSubdomain();
      collision = await ctx.db
        .query("organizations")
        .withIndex("by_subdomain", (q) => q.eq("subdomain", subdomain))
        .unique();
      attempts++;
    }

    if (collision) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: "Failed to generate a unique subdomain. Please try again.",
      });
    }

    // --- Insert organization ---
    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name,
      subdomain,
      storageUsed: 0,
      createdAt: now,
    });

    // --- Create owner membership ---
    await ctx.db.insert("memberships", {
      userId: user._id,
      orgId,
      role: "OWNER",
      joinedAt: now,
    });

    return orgId;
  },
});

/**
 * Update organization settings.
 *
 * - Only OWNER or ADMIN can update.
 * - Subdomain is immutable (rejected if present).
 * - Accepts partial updates to name, businessAddress, logoUrl.
 */
export const update = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    businessAddress: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
    ),
    logoUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOrgMember(ctx, args.orgId);

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only owners and admins can update organization settings.",
      });
    }

    const patch: Record<string, unknown> = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name.length === 0 || name.length > 100) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Organization name must be between 1 and 100 characters.",
        });
      }
      patch.name = name;
    }

    if (args.businessAddress !== undefined) {
      const addr = args.businessAddress;
      if (
        !addr.street.trim() ||
        !addr.city.trim() ||
        !addr.state.trim() ||
        !addr.postalCode.trim() ||
        !addr.country.trim()
      ) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "All business address fields are required.",
        });
      }
      patch.businessAddress = addr;
    }

    if (args.logoUrl !== undefined) {
      patch.logoUrl = args.logoUrl ?? undefined;
    }

    if (Object.keys(patch).length === 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "No fields to update.",
      });
    }

    await ctx.db.patch(args.orgId, patch);
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all organizations the current user is a member of,
 * along with their role in each.
 */
export const listMyOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const orgs = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.orgId);
        if (!org) return null;
        return {
          ...org,
          role: m.role,
          joinedAt: m.joinedAt,
        };
      }),
    );

    return orgs.filter((o) => o !== null);
  },
});

/**
 * Get a single organization by ID.
 * Requires the caller to be a member.
 */
export const get = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOrgMember(ctx, args.orgId);
    const org = await ctx.db.get(args.orgId);

    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Organization not found.",
      });
    }

    return {
      ...org,
      role: membership.role,
    };
  },
});

// ---------------------------------------------------------------------------
// Internal queries (for use by actions)
// ---------------------------------------------------------------------------

export const getInternal = internalQuery({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new ConvexError({ code: "NOT_FOUND", message: "Organization not found." });
    return org;
  },
});
