"use node";

import { ConvexError, v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import Stripe from "stripe";
import { INVOICE_CURRENCY, StripeWebhookEventType } from "@repo/types";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  return new Stripe(secretKey);
}

export const createCheckoutSession = action({
  args: {
    invoiceId: v.id("invoices"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.runQuery(internal.payments.getForCheckout, args);
    if (!invoice) throw new ConvexError({ code: "NOT_FOUND" });
    if (!invoice.stripeAccountId) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "This organization cannot accept payments yet.",
      });
    }

    const appUrl = getAppUrl();

    const metadata = {
      invoiceId: invoice.invoiceId as string,
      orgId: invoice.orgId as string,
    };
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: invoice.clientEmail ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: INVOICE_CURRENCY,
            unit_amount: invoice.total,
            product_data: { name: `Invoice from ${invoice.orgName}` },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        transfer_data: { destination: invoice.stripeAccountId },
        metadata,
      },
      success_url: `${appUrl}/invoice/${invoice.invoiceId}/paid?token=${encodeURIComponent(args.token)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/invoice/${invoice.invoiceId}?token=${encodeURIComponent(args.token)}&payment=cancelled`,
    });
    if (!session.url) throw new Error("Stripe Checkout Session did not include a URL");

    await ctx.runMutation(internal.payments.recordCheckoutSession, {
      stripeSessionId: session.id,
      invoiceId: invoice.invoiceId,
      amount: invoice.total,
    });

    return { url: session.url };
  },
});

function getAppUrl() {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) throw new Error("Missing APP_URL environment variable");
  return appUrl;
}

export const createConnectOnboardingLink = action({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(internal.connect.getByOrg, {
      orgId: args.orgId,
      requireOwner: true,
    });
    const stripe = getStripe();

    let accountId = existing?.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { orgId: args.orgId },
      });
      accountId = account.id;
      await ctx.runMutation(internal.connect.upsert, {
        stripeAccountId: accountId,
        orgId: args.orgId,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
      });
    }

    const returnUrl = `${getAppUrl()}/connect/return`;
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: `${returnUrl}?refresh=1`,
    });
    return { url: link.url };
  },
});

export const refreshConnectStatus = action({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(internal.connect.getByOrg, {
      orgId: args.orgId,
      requireOwner: false,
    });
    if (!existing) return null;
    const account = await getStripe().accounts.retrieve(existing.stripeAccountId);
    await ctx.runMutation(internal.connect.upsert, {
      stripeAccountId: account.id,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });
    return { chargesEnabled: account.charges_enabled };
  },
});

export const handleWebhook = internalAction({
  args: {
    payload: v.string(),
    signature: v.string(),
    secretEnvVar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env[args.secretEnvVar ?? "STRIPE_WEBHOOK_SECRET"];
    if (!webhookSecret) return { ok: false };

    let event: Stripe.Event;
    try {
      event = await getStripe().webhooks.constructEventAsync(
        args.payload,
        args.signature,
        webhookSecret,
      );
    } catch {
      return { ok: false };
    }

    if (event.type === StripeWebhookEventType.CHECKOUT_SESSION_COMPLETED) {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;
      if (session.payment_status !== "paid" || !invoiceId || session.amount_total == null) {
        return { ok: true };
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await ctx.runMutation(internal.payments.fulfillCheckout, {
        stripeSessionId: session.id,
        invoiceId: invoiceId as Id<"invoices">,
        paymentIntentId,
        amountTotal: session.amount_total,
      });
    } else if (event.type === StripeWebhookEventType.CHECKOUT_SESSION_EXPIRED) {
      await ctx.runMutation(internal.payments.expireCheckout, {
        stripeSessionId: event.data.object.id,
      });
    } else if (event.type === StripeWebhookEventType.ACCOUNT_UPDATED) {
      const account = event.data.object;
      const orgId = account.metadata?.orgId;
      await ctx.runMutation(internal.connect.upsert, {
        stripeAccountId: account.id,
        orgId: orgId ? (orgId as Id<"organizations">) : undefined,
        chargesEnabled: account.charges_enabled ?? false,
        detailsSubmitted: account.details_submitted ?? false,
      });
    }

    return { ok: true };
  },
});
