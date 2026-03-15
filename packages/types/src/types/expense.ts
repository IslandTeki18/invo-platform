export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  orgId: string;
}
