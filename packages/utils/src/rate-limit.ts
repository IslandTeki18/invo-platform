export function emailRateLimitKey(orgId: string): string {
  return `email:${orgId}`;
}

export function paymentRateLimitKey(invoiceId: string): string {
  return `payment:${invoiceId}`;
}

export function isWithinRateLimit(count: number, max: number): boolean {
  return count < max;
}

export function isWindowExpired(
  windowStart: number,
  windowMs: number,
  now?: number,
): boolean {
  return (now ?? Date.now()) - windowStart >= windowMs;
}
