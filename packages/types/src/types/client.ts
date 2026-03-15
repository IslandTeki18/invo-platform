export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  archived: boolean;
  orgId: string;
}
