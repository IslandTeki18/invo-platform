import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";
import {
  calculateInvoiceTotal,
  calculateLineItemTotal,
} from "@repo/utils";
import { InvoiceStatus } from "@repo/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID();
}

function validateLineItems(
  lineItems: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxable: boolean;
  }>,
): void {
  if (lineItems.length === 0) {
    throw new ConvexError({
      code: "VALIDATION_ERROR",
      message: "At least one line item is required.",
    });
  }

  for (const item of lineItems) {
    const name = item.name.trim();
    if (name.length === 0 || name.length > 200) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Line item name must be between 1 and 200 characters.",
      });
    }
    if (item.quantity <= 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Line item quantity must be greater than 0.",
      });
    }
    if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Line item unit price must be a non-negative integer (cents).",
      });
    }
  }
}

function validateDiscount(
  discount: { type: "percentage" | "fixed"; value: number },
  subtotal: number,
): void {
  if (discount.type === "percentage") {
    if (discount.value < 0 || discount.value > 100) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Percentage discount must be between 0 and 100.",
      });
    }
  } else {
    if (discount.value < 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Fixed discount must be non-negative.",
      });
    }
    if (discount.value > subtotal) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message:
          "Fixed discount cannot exceed the subtotal.",
      });
    }
  }
}

function validateTaxRate(taxRate: number): void {
  if (taxRate < 0 || taxRate > 100) {
    throw new ConvexError({
      code: "VALIDATION_ERROR",
      message: "Tax rate must be between 0 and 100.",
    });
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const get = query({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Invoice not found.",
      });
    }

    await requireOrgMember(ctx, invoice.orgId);

    return invoice;
  },
});

export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId_status", (q) => q.eq("orgId", args.orgId))
      .collect();

    return invoices.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listByOrgGroupedByStatus = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId_status", (q) => q.eq("orgId", args.orgId))
      .collect();

    const grouped: Record<string, typeof invoices> = {
      [InvoiceStatus.DRAFT]: [],
      [InvoiceStatus.SENT]: [],
      [InvoiceStatus.VIEWED]: [],
      [InvoiceStatus.PAID]: [],
      [InvoiceStatus.VOID]: [],
    };

    for (const invoice of invoices) {
      grouped[invoice.status].push(invoice);
    }

    for (const status of Object.keys(grouped)) {
      grouped[status].sort((a, b) => b.createdAt - a.createdAt);
    }

    return grouped;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    clientId: v.id("clients"),
    lineItems: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.number(),
        taxable: v.boolean(),
      }),
    ),
    expenses: v.optional(v.array(v.id("expenses"))),
    discount: v.optional(
      v.union(
        v.object({
          type: v.union(v.literal("percentage"), v.literal("fixed")),
          value: v.number(),
        }),
        v.null(),
      ),
    ),
    taxRate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    // Validate client
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Client not found.",
      });
    }
    if (client.orgId !== args.orgId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Client does not belong to this organization.",
      });
    }
    if (client.archived) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Cannot create an invoice for an archived client.",
      });
    }

    // Validate line items
    validateLineItems(args.lineItems);

    // Validate tax rate
    const taxRate = args.taxRate ?? 0;
    validateTaxRate(taxRate);

    // Validate due date
    if (args.dueDate !== undefined && args.dueDate <= 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Due date must be a positive timestamp.",
      });
    }

    // Calculate totals server-side
    const { subtotal, tax, total } = calculateInvoiceTotal({
      lineItems: args.lineItems,
      discount: args.discount ?? null,
      taxRate,
    });

    // Validate discount against computed subtotal
    const discount = args.discount ?? null;
    if (discount) {
      validateDiscount(discount, subtotal);
    }

    // Build line items with server-generated IDs and computed totals
    const lineItems = args.lineItems.map((item) => ({
      id: generateId(),
      name: item.name.trim(),
      description: item.description?.trim() || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxable: item.taxable,
      total: calculateLineItemTotal(item.quantity, item.unitPrice),
    }));

    // Build expense snapshots
    const expenseSnapshots: Array<{
      id: string;
      description: string;
      amount: number;
      category?: string;
      orgId: string;
    }> = [];

    if (args.expenses && args.expenses.length > 0) {
      for (const expenseId of args.expenses) {
        const expense = await ctx.db.get(expenseId);
        if (!expense) {
          throw new ConvexError({
            code: "NOT_FOUND",
            message: `Expense ${expenseId} not found.`,
          });
        }
        if (expense.orgId !== args.orgId) {
          throw new ConvexError({
            code: "FORBIDDEN",
            message: `Expense ${expenseId} does not belong to this organization.`,
          });
        }
        expenseSnapshots.push({
          id: expense._id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          orgId: expense.orgId as string,
        });
      }
    }

    // Build client snapshot
    const clientSnapshot = {
      name: client.name,
      email: client.email,
      phone: client.phone,
    };

    const now = Date.now();

    const invoiceId = await ctx.db.insert("invoices", {
      orgId: args.orgId,
      clientSnapshot,
      lineItems,
      expenses: expenseSnapshots,
      subtotal,
      discount: discount ?? undefined,
      tax,
      total,
      status: InvoiceStatus.DRAFT,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
    });

    return invoiceId;
  },
});

export const update = mutation({
  args: {
    invoiceId: v.id("invoices"),
    clientId: v.optional(v.id("clients")),
    lineItems: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
          quantity: v.number(),
          unitPrice: v.number(),
          taxable: v.boolean(),
        }),
      ),
    ),
    expenses: v.optional(v.array(v.id("expenses"))),
    discount: v.optional(
      v.union(
        v.object({
          type: v.union(v.literal("percentage"), v.literal("fixed")),
          value: v.number(),
        }),
        v.null(),
      ),
    ),
    taxRate: v.optional(v.number()),
    dueDate: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Invoice not found.",
      });
    }

    await requireOrgMember(ctx, invoice.orgId);

    // Only DRAFT invoices can be edited
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Only draft invoices can be edited.",
      });
    }

    const patch: Record<string, unknown> = {};

    // Update client snapshot if clientId changed
    if (args.clientId !== undefined) {
      const client = await ctx.db.get(args.clientId);
      if (!client) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Client not found.",
        });
      }
      if (client.orgId !== invoice.orgId) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Client does not belong to this organization.",
        });
      }
      if (client.archived) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Cannot assign an archived client to an invoice.",
        });
      }
      patch.clientSnapshot = {
        name: client.name,
        email: client.email,
        phone: client.phone,
      };
    }

    // Update line items
    if (args.lineItems !== undefined) {
      validateLineItems(args.lineItems);
      patch.lineItems = args.lineItems.map((item) => ({
        id: generateId(),
        name: item.name.trim(),
        description: item.description?.trim() || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxable: item.taxable,
        total: calculateLineItemTotal(item.quantity, item.unitPrice),
      }));
    }

    // Update expenses
    if (args.expenses !== undefined) {
      const expenseSnapshots: Array<{
        id: string;
        description: string;
        amount: number;
        category?: string;
        orgId: string;
      }> = [];

      for (const expenseId of args.expenses) {
        const expense = await ctx.db.get(expenseId);
        if (!expense) {
          throw new ConvexError({
            code: "NOT_FOUND",
            message: `Expense ${expenseId} not found.`,
          });
        }
        if (expense.orgId !== invoice.orgId) {
          throw new ConvexError({
            code: "FORBIDDEN",
            message: `Expense ${expenseId} does not belong to this organization.`,
          });
        }
        expenseSnapshots.push({
          id: expense._id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          orgId: expense.orgId as string,
        });
      }
      patch.expenses = expenseSnapshots;
    }

    // Update discount
    if (args.discount !== undefined) {
      patch.discount = args.discount ?? undefined;
    }

    // Update tax rate
    if (args.taxRate !== undefined) {
      validateTaxRate(args.taxRate);
    }

    // Update due date
    if (args.dueDate !== undefined) {
      if (args.dueDate !== null && args.dueDate <= 0) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Due date must be a positive timestamp.",
        });
      }
      patch.dueDate = args.dueDate ?? undefined;
    }

    // Recalculate totals using current or new values
    const effectiveLineItems = (patch.lineItems as typeof invoice.lineItems) ?? invoice.lineItems;
    const effectiveDiscount =
      args.discount !== undefined
        ? (args.discount ?? null)
        : (invoice.discount ?? null);
    const effectiveTaxRate =
      args.taxRate !== undefined
        ? args.taxRate
        : (invoice.tax?.rate ?? 0);

    const { subtotal, tax, total } = calculateInvoiceTotal({
      lineItems: effectiveLineItems,
      discount: effectiveDiscount,
      taxRate: effectiveTaxRate,
    });

    // Validate discount against computed subtotal
    if (effectiveDiscount) {
      validateDiscount(effectiveDiscount, subtotal);
    }

    patch.subtotal = subtotal;
    patch.tax = tax;
    patch.total = total;
    patch.updatedAt = Date.now();

    await ctx.db.patch(args.invoiceId, patch);
  },
});
