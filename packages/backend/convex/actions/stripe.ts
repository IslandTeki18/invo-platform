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

    const appUrl = process.env.APP_URL?.replace(/\/$/, "");
    if (!appUrl) throw new Error("Missing APP_URL environment variable");

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

export const handleWebhook = internalAction({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
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
    }

    return { ok: true };
  },
});
