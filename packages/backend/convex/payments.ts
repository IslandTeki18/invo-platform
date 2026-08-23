import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { canAcceptPayment, canRecordManualPayment, isValidStatusTransition } from "@repo/utils";
import { InvoiceStatus, LogEventType, PaymentMethod, STRIPE_PAID_BY } from "@repo/types";
import { resolvePublicInvoice } from "./invoices";
import { requireOrgMember } from "./lib/auth";
import { manualPaymentMethodValidator } from "./lib/validators";

export const getForCheckout = internalQuery({
  args: {
    invoiceId: v.id("invoices"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await resolvePublicInvoice(ctx, args.invoiceId, args.token);
    if (!invoice || !canAcceptPayment(invoice.status)) return null;

    const [org, account] = await Promise.all([
      ctx.db.get(invoice.orgId),
      ctx.db
        .query("stripeConnectAccounts")
        .withIndex("by_orgId", (q) => q.eq("orgId", invoice.orgId))
        .first(),
    ]);
    if (!org) return null;

    return {
      invoiceId: invoice._id,
      orgId: invoice.orgId,
      total: invoice.total,
      orgName: org.name,
      clientEmail: invoice.clientSnapshot?.email ?? null,
      stripeAccountId: account?.chargesEnabled ? account.stripeAccountId : null,
    };
  },
});

export const recordCheckoutSession = internalMutation({
  args: {
    stripeSessionId: v.string(),
    invoiceId: v.id("invoices"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("checkoutSessions", {
      ...args,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const fulfillCheckout = internalMutation({
  args: {
    stripeSessionId: v.string(),
    invoiceId: v.id("invoices"),
    paymentIntentId: v.optional(v.string()),
    amountTotal: v.number(),
  },
  handler: async (ctx, args) => {
    let checkout = await ctx.db
      .query("checkoutSessions")
      .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();

    if (!checkout) {
      const id = await ctx.db.insert("checkoutSessions", {
        stripeSessionId: args.stripeSessionId,
        invoiceId: args.invoiceId,
        amount: args.amountTotal,
        status: "open",
        createdAt: Date.now(),
      });
      checkout = await ctx.db.get(id);
    }
    if (!checkout || checkout.status === "complete") {
      return { outcome: "duplicate" as const };
    }

    const invoice = await ctx.db.get(checkout.invoiceId);
    if (!invoice) return { outcome: "missing-invoice" as const };

    const now = Date.now();
    if (invoice.status === InvoiceStatus.PAID) {
      await ctx.db.patch(checkout._id, { status: "complete", completedAt: now });
      await ctx.db.insert("logs", {
        eventType: LogEventType.PAYMENT_RECEIVED,
        orgId: invoice.orgId as string,
        entityType: "invoice",
        entityId: invoice._id as string,
        metadata: {
          stripeSessionId: args.stripeSessionId,
          note: "invoice already paid",
        },
        createdAt: now,
      });
      return { outcome: "already-paid" as const };
    }

    if (!isValidStatusTransition(invoice.status, InvoiceStatus.PAID)) {
      await ctx.db.patch(checkout._id, { status: "complete", completedAt: now });
      await ctx.db.insert("logs", {
        eventType: LogEventType.PAYMENT_FAILED,
        orgId: invoice.orgId as string,
        entityType: "invoice",
        entityId: invoice._id as string,
        metadata: {
          stripeSessionId: args.stripeSessionId,
          reason: "invoice not payable",
        },
        createdAt: now,
      });
      return { outcome: "not-payable" as const };
    }

    await ctx.db.patch(invoice._id, {
      status: InvoiceStatus.PAID,
      paidAt: now,
      stripeSessionId: args.stripeSessionId,
      updatedAt: now,
    });
    await ctx.db.patch(checkout._id, { status: "complete", completedAt: now });
    await ctx.db.insert("paymentRecords", {
      invoiceId: invoice._id,
      method: PaymentMethod.STRIPE,
      amount: args.amountTotal,
      reference: args.paymentIntentId,
      paidAt: now,
      paidBy: STRIPE_PAID_BY,
    });

    const metadata = {
      stripeSessionId: args.stripeSessionId,
      paymentIntentId: args.paymentIntentId,
      amount: args.amountTotal,
    };
    await Promise.all([
      ctx.db.insert("logs", {
        eventType: LogEventType.INVOICE_PAID,
        orgId: invoice.orgId as string,
        entityType: "invoice",
        entityId: invoice._id as string,
        metadata,
        createdAt: now,
      }),
      ctx.db.insert("logs", {
        eventType: LogEventType.PAYMENT_RECEIVED,
        orgId: invoice.orgId as string,
        entityType: "invoice",
        entityId: invoice._id as string,
        metadata,
        createdAt: now,
      }),
    ]);

    return { outcome: "paid" as const };
  },
});

export const expireCheckout = internalMutation({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    const checkout = await ctx.db
      .query("checkoutSessions")
      .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();
    if (!checkout || checkout.status !== "open") return;

    const invoice = await ctx.db.get(checkout.invoiceId);
    const now = Date.now();
    await ctx.db.patch(checkout._id, { status: "expired" });
    await ctx.db.insert("logs", {
      eventType: LogEventType.PAYMENT_FAILED,
      orgId: invoice?.orgId as string | undefined,
      entityType: "invoice",
      entityId: checkout.invoiceId as string,
      metadata: { stripeSessionId: args.stripeSessionId, reason: "expired" },
      createdAt: now,
    });
  },
});

export const recordManualPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    method: manualPaymentMethodValidator,
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Invoice not found." });
    }

    const { user, membership } = await requireOrgMember(ctx, invoice.orgId);
    if (!canRecordManualPayment(membership.role)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have permission to record payments.",
      });
    }

    if (!isValidStatusTransition(invoice.status, InvoiceStatus.PAID)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Only sent or viewed invoices can be marked paid.",
      });
    }

    const now = Date.now();
    const reference = args.reference?.trim() || undefined;

    await ctx.db.patch(invoice._id, {
      status: InvoiceStatus.PAID,
      paidAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("paymentRecords", {
      invoiceId: invoice._id,
      method: args.method,
      amount: invoice.total,
      reference,
      paidAt: now,
      paidBy: user._id as string,
    });

    const metadata = { method: args.method, reference, amount: invoice.total };
    await Promise.all([
      ctx.db.insert("logs", {
        eventType: LogEventType.INVOICE_PAID,
        actorId: user._id as string,
        orgId: invoice.orgId as string,
        entityType: "invoice",
        entityId: invoice._id as string,
        metadata,
        createdAt: now,
      }),
      ctx.db.insert("logs", {
        eventType: LogEventType.PAYMENT_MANUAL_RECORDED,
        actorId: user._id as string,
        orgId: invoice.orgId as string,
        entityType: "invoice",
        entityId: invoice._id as string,
        metadata,
        createdAt: now,
      }),
    ]);
  },
});
