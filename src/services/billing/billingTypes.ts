/**
 * Google Play Billing Product IDs and Types for BatteryFlow
 */

export const GOOGLE_PLAY_PRODUCTS = {
  BATTERYFLOW_PREMIUM_MONTHLY: 'batteryflow_premium_monthly',
  BATTERYFLOW_PREMIUM_6_MONTH: 'batteryflow_premium_6_month',
  BATTERYFLOW_PREMIUM_YEARLY: 'batteryflow_premium_yearly',
} as const;

export type SubscriptionProductId = typeof GOOGLE_PLAY_PRODUCTS[keyof typeof GOOGLE_PLAY_PRODUCTS];

export interface SubscriptionPlanDetails {
  productId: SubscriptionProductId;
  title: string;
  price: string;
  priceNumeric: number;
  period: string;
  durationMonths: number;
  approxMonthlyPrice: string;
  badge?: string;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    productId: GOOGLE_PLAY_PRODUCTS.BATTERYFLOW_PREMIUM_MONTHLY,
    title: 'Monthly Subscription',
    price: '$2.50',
    priceNumeric: 2.50,
    period: 'month',
    durationMonths: 1,
    approxMonthlyPrice: '$2.50 / month',
    description: 'Billed monthly. Cancel anytime in Google Play Store.',
  },
  {
    productId: GOOGLE_PLAY_PRODUCTS.BATTERYFLOW_PREMIUM_6_MONTH,
    title: '6-Month Pass',
    price: '$15.00',
    priceNumeric: 15.00,
    period: '6 months',
    durationMonths: 6,
    approxMonthlyPrice: '$2.50 / month',
    badge: 'POPULAR',
    description: 'Billed every 6 months. Ideal for seasonal battery tracking.',
  },
  {
    productId: GOOGLE_PLAY_PRODUCTS.BATTERYFLOW_PREMIUM_YEARLY,
    title: 'Annual Pro',
    price: '$30.00',
    priceNumeric: 30.00,
    period: 'year',
    durationMonths: 12,
    approxMonthlyPrice: '$2.50 / month',
    badge: 'BEST VALUE',
    description: 'Billed annually ($30.00). Full access to all current and future Pro features.',
  },
];

export type SubscriptionStatus =
  | 'FREE'
  | 'PENDING'          // Google Play pending transactions (UPI, cash, banking clearance)
  | 'ACTIVE'           // Verified active subscription
  | 'IN_GRACE_PERIOD'  // Renewal payment failed, inside Play Store grace window
  | 'CANCELLED_ACTIVE' // User canceled auto-renew in Play Store, access remains until expiry
  | 'EXPIRED';         // Billing period elapsed without renewal

export type BillingErrorCode =
  | 'USER_CANCELED'
  | 'NETWORK_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BILLING_UNAVAILABLE'
  | 'ITEM_ALREADY_OWNED'
  | 'ITEM_UNAVAILABLE'
  | 'DEVELOPER_ERROR'
  | 'VERIFICATION_FAILED'
  | 'UNKNOWN';

export interface BillingErrorPayload {
  code: BillingErrorCode;
  userFriendlyMessage: string;
  debugMessage: string;
}

export type PremiumFeatureKey =
  | 'ADVANCED_ANALYTICS'
  | 'CHARGING_SESSION_HISTORY'
  | 'HISTORICAL_BATTERY_CHARTS'
  | 'CHARGING_SPEED_ANALYSIS'
  | 'BATTERY_DRAIN_ANALYSIS'
  | 'DETAILED_CHARGING_STATS'
  | 'ADVANCED_REPORTS'
  | 'ADVANCED_CHARGING_SCREEN_CUSTOMIZATION'
  | 'PREMIUM_WALLPAPERS_THEMES'
  | 'AD_FREE_EXPERIENCE';

export interface VerifiedSubscriptionState {
  status: SubscriptionStatus;
  productId: SubscriptionProductId | null;
  orderId: string | null;
  purchaseToken: string | null;
  purchaseTime: number;
  expiryTime: number;
  isAutoRenewing: boolean;
  isVerified: boolean;
  lastVerifiedAt: number;
  signature: string | null;
}
