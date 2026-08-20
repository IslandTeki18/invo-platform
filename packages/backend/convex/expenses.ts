import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List expenses for an organization.
 */
export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    return ctx.db
      .query("expenses")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

/**
 * Get a single expense by ID.
 * Caller must be a member of the expense's organization.
 */
export const get = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found.",
      });
    }

    await requireOrgMember(ctx, expense.orgId);

    return expense;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new expense within an organization.
 */
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const description = args.description.trim();
    if (description.length === 0 || description.length > 500) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Expense description must be between 1 and 500 characters.",
      });
    }

    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Amount must be a positive integer (cents).",
      });
    }

    const expenseId = await ctx.db.insert("expenses", {
      description,
      amount: args.amount,
      category: args.category?.trim() || undefined,
      orgId: args.orgId,
    });

    return expenseId;
  },
});

/**
 * Update an existing expense.
 * Caller must be a member of the expense's organization.
 */
export const update = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found.",
      });
    }

    await requireOrgMember(ctx, expense.orgId);

    const patch: Record<string, unknown> = {};

    if (args.description !== undefined) {
      const description = args.description.trim();
      if (description.length === 0 || description.length > 500) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Expense description must be between 1 and 500 characters.",
        });
      }
      patch.description = description;
    }

    if (args.amount !== undefined) {
      if (!Number.isInteger(args.amount) || args.amount <= 0) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Amount must be a positive integer (cents).",
        });
      }
      patch.amount = args.amount;
    }

    if (args.category !== undefined) {
      patch.category = args.category?.trim() || undefined;
    }

    if (Object.keys(patch).length === 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "No fields to update.",
      });
    }

    await ctx.db.patch(args.expenseId, patch);
  },
});

/**
 * Delete an expense.
 * Caller must be a member of the expense's organization.
 * Safe to delete — invoices store expense snapshots with no foreign key
 * back to the expenses table.
 */
export const remove = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found.",
      });
    }

    await requireOrgMember(ctx, expense.orgId);

    await ctx.db.delete(args.expenseId);
  },
});
