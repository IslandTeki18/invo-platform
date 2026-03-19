import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const writeLog = internalMutation({
  args: {
    eventType: v.string(),
    actorId: v.optional(v.string()),
    orgId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("logs", { ...args, createdAt: Date.now() });
  },
});

export const getRateLimit = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

export const upsertRateLimit = internalMutation({
  args: { key: v.string(), windowMs: v.number() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing && existing.windowEnd > now) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
      return existing.count + 1;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        count: 1,
        windowStart: now,
        windowEnd: now + args.windowMs,
      });
    } else {
      await ctx.db.insert("rateLimitBuckets", {
        key: args.key,
        count: 1,
        windowStart: now,
        windowEnd: now + args.windowMs,
      });
    }
    return 1;
  },
});

export const linkPdfToInvoice = internalMutation({
  args: {
    orgId: v.id("organizations"),
    invoiceId: v.id("invoices"),
    storageId: v.string(),
    sizeBytes: v.number(),
    logicalPath: v.string(),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      orgId: args.orgId,
      ownerEntityType: "invoice",
      ownerEntityId: args.invoiceId as string,
      mimeType: "application/pdf",
      sizeBytes: args.sizeBytes,
      storageId: args.storageId,
      logicalPath: args.logicalPath,
      uploadedAt: Date.now(),
    });
    await ctx.db.insert("attachments", {
      fileId,
      invoiceId: args.invoiceId,
      displayName: "invoice.pdf",
    });
  },
});
