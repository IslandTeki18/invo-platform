export interface ItemPreset {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: number;
  taxable: boolean;
  userId: string;
}
