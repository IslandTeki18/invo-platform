import type { Client } from "./client";
import type { Invoice } from "./invoice";
import type { Expense } from "./expense";
import type { Membership } from "./membership";
import type { Organization } from "./organization";

export interface ExportPayload {
  orgId: string;
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  memberships: Membership[];
  settings: Organization;
  exportedAt: number;
}
