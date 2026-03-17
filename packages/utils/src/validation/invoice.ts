import { z } from "zod/v4";
import { InvoiceStatus } from "@repo/types";
import { lineItemSchema } from "./line-item";

const ALLOWED_TRANSITIONS: ReadonlyArray<
  [string, string]
> = [
  [InvoiceStatus.DRAFT, InvoiceStatus.SENT],
  [InvoiceStatus.SENT, InvoiceStatus.VIEWED],
  [InvoiceStatus.SENT, InvoiceStatus.PAID],
  [InvoiceStatus.VIEWED, InvoiceStatus.PAID],
  [InvoiceStatus.DRAFT, InvoiceStatus.VOID],
  [InvoiceStatus.SENT, InvoiceStatus.VOID],
  [InvoiceStatus.VIEWED, InvoiceStatus.VOID],
];

export const invoiceDraftSchema = z.object({
  clientId: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1),
  expenses: z
    .array(
      z.object({
        expenseId: z.string(),
      }),
    )
    .optional(),
  discount: z
    .object({
      type: z.enum(["percentage", "fixed"]),
      value: z.number().nonnegative().max(100),
    })
    .nullable()
    .optional(),
  taxRate: z.number().nonnegative().max(100).optional(),
  dueDate: z.number().int().positive().optional(),
});

export type InvoiceDraftInput = z.infer<typeof invoiceDraftSchema>;

export const invoiceSendSchema = z.object({
  invoiceId: z.string().min(1),
});

export type InvoiceSendInput = z.infer<typeof invoiceSendSchema>;

const invoiceStatusValues = [
  InvoiceStatus.DRAFT,
  InvoiceStatus.SENT,
  InvoiceStatus.VIEWED,
  InvoiceStatus.PAID,
  InvoiceStatus.VOID,
] as const;

export const invoiceStatusTransitionSchema = z
  .object({
    invoiceId: z.string().min(1),
    from: z.enum(invoiceStatusValues),
    to: z.enum(invoiceStatusValues),
  })
  .refine(
    (data) =>
      ALLOWED_TRANSITIONS.some(
        ([from, to]) => from === data.from && to === data.to,
      ),
    {
      message: "Invalid status transition",
      path: ["to"],
    },
  );

export type InvoiceStatusTransitionInput = z.infer<
  typeof invoiceStatusTransitionSchema
>;
