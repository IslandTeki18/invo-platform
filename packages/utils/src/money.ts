export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatMoney(cents: number): string {
  return `$${centsToDollars(cents).toFixed(2)}`;
}

export function parseDecimalQuantity(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    throw new Error(`Invalid decimal quantity: "${value}"`);
  }
  return parsed;
}
