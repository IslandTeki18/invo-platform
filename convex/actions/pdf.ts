"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { renderToBuffer } from "@react-pdf/renderer";
import { invoicePdfPath } from "@repo/utils";
import { InvoicePdf } from "./pdfTemplate";
import React from "react";

export const generate = internalAction({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    try {
      // Fetch invoice and org data via internal queries
      const invoice = await ctx.runQuery(internal.invoices.getInternal, {
        invoiceId: args.invoiceId,
      });
      const org = await ctx.runQuery(internal.organizations.getInternal, {
        orgId: invoice.orgId,
      });

      // Render PDF to buffer
      // Cast required: renderToBuffer expects ReactElement<DocumentProps> but our
      // component wraps <Document> internally, which satisfies the runtime contract.
      const element = React.createElement(InvoicePdf, { invoice, org });
      const buffer = await renderToBuffer(
        element as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>,
      );

      // Store in Convex file storage
      const blob = new Blob([buffer], { type: "application/pdf" });
      const storageId = await ctx.storage.store(blob);

      // Link the PDF file to the invoice
      await ctx.runMutation(internal.internal.linkPdfToInvoice, {
        orgId: invoice.orgId,
        invoiceId: args.invoiceId,
        storageId: storageId as string,
        sizeBytes: buffer.length,
        logicalPath: invoicePdfPath(
          invoice.orgId as string,
          args.invoiceId as string,
        ),
      });
    } catch (error) {
      console.error(`PDF generation failed for invoice ${args.invoiceId}:`, error);
      throw error;
    }
  },
});
