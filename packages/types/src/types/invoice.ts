import type { InvoiceStatus } from "../enums/invoice";
import type { Expense } from "./expense";

export interface ClientSnapshot {
  name: string;
  email: string;
  phone: string | null;
}

export interface LineItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  total: number;
  imageUrl: string | null;
}

export interface Discount {
  type: "percentage" | "fixed";
  value: number;
}

export interface TaxData {
  rate: number;
  amount: number;
  taxableSubtotal: number;
}

export interface Invoice {
  id: string;
  orgId: string;
  clientSnapshot: ClientSnapshot | null;
  lineItems: LineItem[];
  expenses: Expense[];
  subtotal: number;
  discount: Discount | null;
  tax: TaxData | null;
  total: number;
  status: InvoiceStatus;
  accessToken: string | null;
  stripeSessionId: string | null;
  sentAt: number | null;
  paidAt: number | null;
  voidedAt: number | null;
  dueDate: number | null;
  createdAt: number;
  updatedAt: number;
}
