import type { ManualPaymentMethod } from "../enums/payment";

export interface CheckoutSession {
  id: string;
  stripeSessionId: string;
  invoiceId: string;
  amount: number;
  status: string;
  createdAt: number;
  completedAt: number | null;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  method: ManualPaymentMethod;
  amount: number;
  reference: string | null;
  paidAt: number;
  paidBy: string;
}

export interface PaymentAttempt {
  id: string;
  invoiceId: string;
  ip: string;
  timestamp: number;
  success: boolean;
}
