import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all item presets for the authenticated user.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    return ctx.db
      .query("itemPresets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * Get a single item preset by ID.
 * Caller must own the preset.
 */
export const get = query({
  args: {
    presetId: v.id("itemPresets"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const preset = await ctx.db.get(args.presetId);
    if (!preset) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Item preset not found.",
      });
    }

    if (preset.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not own this item preset.",
      });
    }

    return preset;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new item preset for the authenticated user.
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    defaultPrice: v.number(),
    taxable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const name = args.name.trim();
    if (name.length === 0 || name.length > 200) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Preset name must be between 1 and 200 characters.",
      });
    }

    if (!Number.isInteger(args.defaultPrice) || args.defaultPrice < 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Default price must be a non-negative integer (cents).",
      });
    }

    const presetId = await ctx.db.insert("itemPresets", {
      name,
      description: args.description?.trim() || undefined,
      defaultPrice: args.defaultPrice,
      taxable: args.taxable,
      userId: user._id,
    });

    return presetId;
  },
});

/**
 * Update an existing item preset.
 * Caller must own the preset.
 */
export const update = mutation({
  args: {
    presetId: v.id("itemPresets"),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    defaultPrice: v.optional(v.number()),
    taxable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const preset = await ctx.db.get(args.presetId);
    if (!preset) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Item preset not found.",
      });
    }

    if (preset.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not own this item preset.",
      });
    }

    const patch: Record<string, unknown> = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name.length === 0 || name.length > 200) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Preset name must be between 1 and 200 characters.",
        });
      }
      patch.name = name;
    }

    if (args.description !== undefined) {
      patch.description = args.description?.trim() || undefined;
    }

    if (args.defaultPrice !== undefined) {
      if (!Number.isInteger(args.defaultPrice) || args.defaultPrice < 0) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Default price must be a non-negative integer (cents).",
        });
      }
      patch.defaultPrice = args.defaultPrice;
    }

    if (args.taxable !== undefined) {
      patch.taxable = args.taxable;
    }

    if (Object.keys(patch).length === 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "No fields to update.",
      });
    }

    await ctx.db.patch(args.presetId, patch);
  },
});

/**
 * Delete an item preset.
 * Caller must own the preset.
 * Safe to delete — line items in invoices are embedded snapshots with no
 * foreign key to presets.
 */
export const remove = mutation({
  args: {
    presetId: v.id("itemPresets"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const preset = await ctx.db.get(args.presetId);
    if (!preset) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Item preset not found.",
      });
    }

    if (preset.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not own this item preset.",
      });
    }

    await ctx.db.delete(args.presetId);
  },
});
