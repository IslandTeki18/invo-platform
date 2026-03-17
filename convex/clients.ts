import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List clients for an organization.
 * By default returns only active (non-archived) clients.
 * Pass includeArchived: true to include archived clients.
 */
export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    if (args.includeArchived) {
      return clients;
    }

    return clients.filter((c) => !c.archived);
  },
});

/**
 * Get a single client by ID.
 * Caller must be a member of the client's organization.
 */
export const get = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Client not found.",
      });
    }

    await requireOrgMember(ctx, client.orgId);

    return client;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new client within an organization.
 * Enforces unique email per org.
 */
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const name = args.name.trim();
    if (name.length === 0 || name.length > 200) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Client name must be between 1 and 200 characters.",
      });
    }

    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "A valid email address is required.",
      });
    }

    // Duplicate email check within org
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_orgId_email", (q) =>
        q.eq("orgId", args.orgId).eq("email", email),
      )
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE_EMAIL",
        message: "A client with this email already exists in this organization.",
      });
    }

    const clientId = await ctx.db.insert("clients", {
      name,
      email,
      phone: args.phone?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      archived: false,
      orgId: args.orgId,
    });

    return clientId;
  },
});

/**
 * Update an existing client.
 * Enforces unique email per org (excluding self).
 */
export const update = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Client not found.",
      });
    }

    await requireOrgMember(ctx, client.orgId);

    const patch: Record<string, unknown> = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name.length === 0 || name.length > 200) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Client name must be between 1 and 200 characters.",
        });
      }
      patch.name = name;
    }

    if (args.email !== undefined) {
      const email = args.email.trim().toLowerCase();
      if (!email.includes("@")) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "A valid email address is required.",
        });
      }

      // Duplicate email check (excluding self)
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_orgId_email", (q) =>
          q.eq("orgId", client.orgId).eq("email", email),
        )
        .unique();

      if (existing && existing._id !== args.clientId) {
        throw new ConvexError({
          code: "DUPLICATE_EMAIL",
          message:
            "A client with this email already exists in this organization.",
        });
      }

      patch.email = email;
    }

    if (args.phone !== undefined) {
      patch.phone = args.phone?.trim() || undefined;
    }

    if (args.notes !== undefined) {
      patch.notes = args.notes?.trim() || undefined;
    }

    if (Object.keys(patch).length === 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "No fields to update.",
      });
    }

    await ctx.db.patch(args.clientId, patch);
  },
});

/**
 * Archive a client. Archived clients are hidden from the client picker
 * but remain visible in a separate archived view.
 */
export const archive = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Client not found.",
      });
    }

    await requireOrgMember(ctx, client.orgId);

    if (client.archived) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Client is already archived.",
      });
    }

    await ctx.db.patch(args.clientId, { archived: true });
  },
});

/**
 * Restore an archived client.
 */
export const restore = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Client not found.",
      });
    }

    await requireOrgMember(ctx, client.orgId);

    if (!client.archived) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Client is not archived.",
      });
    }

    await ctx.db.patch(args.clientId, { archived: false });
  },
});
