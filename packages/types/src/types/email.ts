export interface InvoiceSendEmailData {
  invoiceUrl: string;
  clientName: string;
  orgName: string;
  amount: number;
  dueDate: number | null;
}

export interface PaymentReceiptEmailData {
  clientName: string;
  orgName: string;
  amount: number;
  paidAt: number;
  invoiceUrl: string;
}

export interface ReminderEmailData {
  clientName: string;
  orgName: string;
  amount: number;
  dueDate: number;
  invoiceUrl: string;
  reminderType: "before_due" | "on_due";
}
