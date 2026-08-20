import { v, ConvexError } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import { requireOrgMember } from "./lib/auth";
import {
  calculateInvoiceTotal,
  calculateLineItemTotal,
  calculateSubtotal,
  canAcceptPayment,
  accessTokenSchema,
  canSendInvoice,
  generateAccessTokenWeb,
  isReadyToSendInvoice,
  isValidStatusTransition,
} from "@repo/utils";
import { InvoiceStatus, LogEventType } from "@repo/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID();
}

type RawLineItem = {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
};

type ExpenseSnapshot = {
  id: string;
  description: string;
  amount: number;
  category?: string;
  orgId: string;
};

function validateLineItems(lineItems: RawLineItem[]): void {
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
        message: "Fixed discount cannot exceed the subtotal.",
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

function buildLineItems(rawItems: RawLineItem[]) {
  return rawItems.map((item) => ({
    id: generateId(),
    name: item.name.trim(),
    description: item.description?.trim() || undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxable: item.taxable,
    total: calculateLineItemTotal(item.quantity, item.unitPrice),
  }));
}

async function resolveClientSnapshot(
  ctx: { db: DatabaseReader },
  clientId: Id<"clients">,
  orgId: Id<"organizations">,
) {
  const client = await ctx.db.get(clientId);
  if (!client) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Client not found.",
    });
  }
  if (client.orgId !== orgId) {
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
  return { name: client.name, email: client.email, phone: client.phone };
}

async function resolveExpenseSnapshots(
  ctx: { db: DatabaseReader },
  expenseIds: Id<"expenses">[],
  orgId: Id<"organizations">,
): Promise<ExpenseSnapshot[]> {
  const snapshots: ExpenseSnapshot[] = [];
  for (const expenseId of expenseIds) {
    const expense = await ctx.db.get(expenseId);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: `Expense ${expenseId} not found.`,
      });
    }
    if (expense.orgId !== orgId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: `Expense ${expenseId} does not belong to this organization.`,
      });
    }
    snapshots.push({
      id: expense._id as string,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      orgId: expense.orgId as string,
    });
  }
  return snapshots;
}

export async function resolvePublicInvoice(
  ctx: { db: DatabaseReader },
  invoiceId: Id<"invoices">,
  token: string,
): Promise<Doc<"invoices"> | null> {
  if (!accessTokenSchema.safeParse(token).success) return null;

  const invoice = await ctx.db.get(invoiceId);
  if (!invoice || invoice.status === InvoiceStatus.DRAFT || invoice.accessToken !== token) {
    return null;
  }

  return invoice;
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

export const getPublic = query({
  args: {
    invoiceId: v.id("invoices"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await resolvePublicInvoice(ctx, args.invoiceId, args.token);
    if (!invoice) return null;

    const org = await ctx.db.get(invoice.orgId);
    if (!org) return null;

    const attachmentRows = await ctx.db
      .query("attachments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();
    const files = await Promise.all(
      attachmentRows.map(async (attachment) => {
        const file = await ctx.db.get(attachment.fileId);
        if (!file) return null;
        return {
          displayName: attachment.displayName,
          mimeType: file.mimeType,
          ownerEntityType: file.ownerEntityType,
          logicalPath: file.logicalPath,
          url: await ctx.storage.getUrl(file.storageId as Id<"_storage">),
        };
      }),
    );
    const availableFiles = files.filter(
      (file): file is NonNullable<typeof file> & { url: string } => file?.url != null,
    );
    const pdf = availableFiles.find(
      (file) =>
        file.ownerEntityType === "invoice" &&
        file.mimeType === "application/pdf" && file.logicalPath?.endsWith("/invoice.pdf"),
    );

    return {
      status: invoice.status,
      sentAt: invoice.sentAt,
      paidAt: invoice.paidAt,
      voidedAt: invoice.voidedAt,
      dueDate: invoice.dueDate,
      clientSnapshot: invoice.clientSnapshot,
      lineItems: invoice.lineItems,
      expenses: invoice.expenses,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      total: invoice.total,
      org: {
        name: org.name,
        businessAddress: org.businessAddress,
        logoUrl: org.logoUrl,
      },
      attachments: availableFiles
        .filter((file) => file !== pdf)
        .map(({ displayName, mimeType, url }) => ({ displayName, mimeType, url })),
      pdfUrl: canAcceptPayment(invoice.status) ? (pdf?.url ?? null) : null,
    };
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

export const getDashboardSummary = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.orgId);

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId_status", (q) => q.eq("orgId", args.orgId))
      .collect();

    let unpaidCount = 0;
    let unpaidTotal = 0;
    for (const inv of invoices) {
      if (inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.VIEWED) {
        unpaidCount++;
        unpaidTotal += inv.total;
      }
    }

    const sorted = [...invoices].sort((a, b) => b.createdAt - a.createdAt);
    const recentInvoices = sorted.slice(0, 5).map((inv) => ({
      _id: inv._id,
      clientSnapshot: inv.clientSnapshot,
      total: inv.total,
      status: inv.status,
      createdAt: inv.createdAt,
    }));

    return { unpaidCount, unpaidTotal, recentInvoices };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const recordView = mutation({
  args: {
    invoiceId: v.id("invoices"),
    token: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoice = await resolvePublicInvoice(ctx, args.invoiceId, args.token);
    if (!invoice) throw new ConvexError({ code: "NOT_FOUND" });

    const now = Date.now();
    const isFirstView = invoice.status === InvoiceStatus.SENT;
    await ctx.db.insert("invoiceViewEvents", {
      invoiceId: args.invoiceId,
      timestamp: now,
      userAgent: args.userAgent,
      isFirstView,
    });

    if (isFirstView && isValidStatusTransition(invoice.status, InvoiceStatus.VIEWED)) {
      await ctx.db.patch(args.invoiceId, { status: InvoiceStatus.VIEWED, updatedAt: now });
      await ctx.db.insert("logs", {
        eventType: LogEventType.INVOICE_VIEWED,
        orgId: invoice.orgId as string,
        entityType: "invoice",
        entityId: args.invoiceId as string,
        createdAt: now,
      });
    }
  },
});

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

    const clientSnapshot = await resolveClientSnapshot(ctx, args.clientId, args.orgId);

    validateLineItems(args.lineItems);

    const taxRate = args.taxRate ?? 0;
    validateTaxRate(taxRate);

    if (args.dueDate !== undefined && args.dueDate <= 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Due date must be a positive timestamp.",
      });
    }

    // Validate discount before calculating totals
    const discount = args.discount ?? null;
    if (discount) {
      const subtotal = calculateSubtotal(args.lineItems);
      validateDiscount(discount, subtotal);
    }

    const { subtotal, tax, total } = calculateInvoiceTotal({
      lineItems: args.lineItems,
      discount,
      taxRate,
    });

    const lineItems = buildLineItems(args.lineItems);

    const expenseSnapshots = args.expenses?.length
      ? await resolveExpenseSnapshots(ctx, args.expenses, args.orgId)
      : [];

    const now = Date.now();

    const invoiceId = await ctx.db.insert("invoices", {
      orgId: args.orgId,
      clientId: args.clientId,
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

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Only draft invoices can be edited.",
      });
    }

    const patch: Partial<Doc<"invoices">> = {};

    if (args.clientId !== undefined) {
      patch.clientSnapshot = await resolveClientSnapshot(ctx, args.clientId, invoice.orgId);
      patch.clientId = args.clientId;
    }

    if (args.lineItems !== undefined) {
      validateLineItems(args.lineItems);
      patch.lineItems = buildLineItems(args.lineItems);
    }

    if (args.expenses !== undefined) {
      patch.expenses = args.expenses.length
        ? await resolveExpenseSnapshots(ctx, args.expenses, invoice.orgId)
        : [];
    }

    if (args.discount !== undefined) {
      patch.discount = args.discount ?? undefined;
    }

    if (args.taxRate !== undefined) {
      validateTaxRate(args.taxRate);
    }

    if (args.dueDate !== undefined) {
      if (args.dueDate !== null && args.dueDate <= 0) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Due date must be a positive timestamp.",
        });
      }
      patch.dueDate = args.dueDate ?? undefined;
    }

    // Resolve effective values for recalculation
    const effectiveLineItems = patch.lineItems ?? invoice.lineItems;
    const effectiveDiscount =
      args.discount !== undefined
        ? (args.discount ?? null)
        : (invoice.discount ?? null);
    const effectiveTaxRate =
      args.taxRate !== undefined
        ? args.taxRate
        : (invoice.tax?.rate ?? 0);

    // Validate discount before calculating totals
    if (effectiveDiscount) {
      const subtotal = calculateSubtotal(effectiveLineItems);
      validateDiscount(effectiveDiscount, subtotal);
    }

    const { subtotal, tax, total } = calculateInvoiceTotal({
      lineItems: effectiveLineItems,
      discount: effectiveDiscount,
      taxRate: effectiveTaxRate,
    });

    patch.subtotal = subtotal;
    patch.tax = tax;
    patch.total = total;
    patch.updatedAt = Date.now();

    await ctx.db.patch(args.invoiceId, patch);
  },
});

export const send = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    // 1. Fetch invoice
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new ConvexError({ code: "NOT_FOUND", message: "Invoice not found." });

    // 2. Auth + permission
    const { user, membership } = await requireOrgMember(ctx, invoice.orgId);
    if (!canSendInvoice(membership.role)) {
      throw new ConvexError({ code: "FORBIDDEN", message: "You do not have permission to send invoices." });
    }

    // 3. Status check
    if (!isValidStatusTransition(invoice.status as InvoiceStatus, InvoiceStatus.SENT)) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Only draft invoices can be sent." });
    }

    // 4. Org readiness
    const org = await ctx.db.get(invoice.orgId);
    if (!org) throw new ConvexError({ code: "NOT_FOUND", message: "Organization not found." });

    const stripeAccount = await ctx.db
      .query("stripeConnectAccounts")
      .withIndex("by_orgId", (q) => q.eq("orgId", invoice.orgId))
      .unique();

    const orgReadiness = {
      name: org.name,
      businessAddress: org.businessAddress ?? null,
      stripeAccountId: stripeAccount?.stripeAccountId ?? null,
      chargesEnabled: stripeAccount?.chargesEnabled ?? false,
    };
    if (!isReadyToSendInvoice(orgReadiness)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Organization is not ready to send invoices. Ensure name, business address, and Stripe are configured.",
      });
    }

    // 5. Re-snapshot client (if clientId available)
    let clientSnapshot = invoice.clientSnapshot;
    if (invoice.clientId) {
      clientSnapshot = await resolveClientSnapshot(ctx, invoice.clientId, invoice.orgId);
    }
    if (!clientSnapshot) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Invoice must have a client." });
    }

    // 6. Recalculate totals server-side
    const { subtotal, tax, total } = calculateInvoiceTotal({
      lineItems: invoice.lineItems,
      discount: invoice.discount ?? null,
      taxRate: invoice.tax?.rate ?? 0,
    });

    if (total <= 0) {
      throw new ConvexError({ code: "VALIDATION_ERROR", message: "Invoice total must be greater than zero." });
    }

    // 7. Generate access token
    const accessToken = generateAccessTokenWeb();

    // 8. Patch invoice
    const now = Date.now();
    await ctx.db.patch(args.invoiceId, {
      status: InvoiceStatus.SENT,
      clientSnapshot,
      accessToken,
      sentAt: now,
      subtotal,
      tax,
      total,
      updatedAt: now,
    });

    // 9. Log
    await ctx.db.insert("logs", {
      eventType: LogEventType.INVOICE_SENT,
      actorId: user._id as string,
      orgId: invoice.orgId as string,
      entityType: "invoice",
      entityId: args.invoiceId as string,
      createdAt: now,
    });

    // 10. Schedule async actions
    // NOTE: These references (internal.actions.pdf.generate and internal.actions.email.sendInvoiceEmail)
    // will not exist until Tasks 6 and 7 are implemented. Typecheck errors are expected until then.
    await ctx.scheduler.runAfter(0, internal.actions.pdf.generate, { invoiceId: args.invoiceId });
    await ctx.scheduler.runAfter(0, internal.actions.email.sendInvoiceEmail, { invoiceId: args.invoiceId });

    return { invoiceId: args.invoiceId };
  },
});

// ---------------------------------------------------------------------------
// Internal queries (for use by actions)
// ---------------------------------------------------------------------------

export const getInternal = internalQuery({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new ConvexError({ code: "NOT_FOUND", message: "Invoice not found." });
    return invoice;
  },
});
