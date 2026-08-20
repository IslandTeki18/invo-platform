"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Resend } from "resend";
import { buildInvoiceUrl, emailRateLimitKey } from "@repo/utils";
import {
  EMAIL_RATE_LIMIT_MAX,
  EMAIL_RATE_LIMIT_WINDOW_MS,
  LogEventType,
} from "@repo/types";
import { buildInvoiceSendHtml } from "./emailTemplate";


export const sendInvoiceEmail = internalAction({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.runQuery(internal.invoices.getInternal, {
      invoiceId: args.invoiceId,
    });
    const org = await ctx.runQuery(internal.organizations.getInternal, {
      orgId: invoice.orgId,
    });

    if (!invoice.clientSnapshot?.email || !invoice.accessToken) {
      console.warn(`Skipping email for invoice ${args.invoiceId}: missing client email or access token`);
      return;
    }

    // Rate limit check
    const rateLimitKey = emailRateLimitKey(invoice.orgId as string);
    const bucket = await ctx.runQuery(internal.internal.getRateLimit, {
      key: rateLimitKey,
    });
    if (
      bucket &&
      bucket.windowEnd > Date.now() &&
      bucket.count >= EMAIL_RATE_LIMIT_MAX
    ) {
      console.warn(`Email rate limit exceeded for org ${invoice.orgId}`);
      return;
    }

    // Get org owner email for Reply-To
    const owner = await ctx.runQuery(internal.memberships.getOrgOwner, {
      orgId: invoice.orgId,
    });

    // Build email
    const invoiceUrl = buildInvoiceUrl(
      process.env.APP_URL!,
      args.invoiceId as string,
      invoice.accessToken,
    );

    const html = buildInvoiceSendHtml({
      invoiceUrl,
      clientName: invoice.clientSnapshot.name,
      orgName: org.name,
      amount: invoice.total,
      dueDate: invoice.dueDate ?? null,
    });

    // Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `${org.name} <invoices@invo.app>`,
      to: [invoice.clientSnapshot.email],
      replyTo: owner.email,
      subject: `Invoice from ${org.name}`,
      html,
    });

    // Increment rate limit
    await ctx.runMutation(internal.internal.upsertRateLimit, {
      key: rateLimitKey,
      windowMs: EMAIL_RATE_LIMIT_WINDOW_MS,
    });

    // Log
    await ctx.runMutation(internal.internal.writeLog, {
      eventType: LogEventType.EMAIL_SENT,
      orgId: invoice.orgId as string,
      entityType: "invoice",
      entityId: args.invoiceId as string,
      metadata: { recipient: invoice.clientSnapshot.email },
    });
  },
});
