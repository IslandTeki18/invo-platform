import type { GracePeriodState } from "../enums/grace-period";

export interface OnboardingStatus {
  accountCreated: boolean;
  orgCreated: boolean;
  businessInfoSet: boolean;
  stripeConnected: boolean;
}

export interface DowngradeGracePeriod {
  id: string;
  userId: string;
  excessOrgIds: string[];
  graceStartDate: number;
  graceEndDate: number;
  state: GracePeriodState;
}

export interface InvoiceViewEvent {
  id: string;
  invoiceId: string;
  timestamp: number;
  ip: string | null;
  userAgent: string | null;
  isFirstView: boolean;
}

export interface RateLimitBucket {
  key: string;
  count: number;
  windowStart: number;
  windowEnd: number;
}
