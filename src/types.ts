export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  phone: string; // e.g. +2567XXXXXXXX
  name: string;
  referral_code: string;
  referred_by_id?: number | null;
  is_admin: boolean;
  wallet_balance_ugx: number; // Prepaid deposit wallet (for bot purchases)
  bot_earnings_ugx?: number; // Total bot daily yields earned
  last_midnight_yield_at?: string; // e.g. "2026-08-31 00:00:00"
  signup_ip?: string;
  created_at: string;
  avatar_url?: string;
  payout_phone?: string; // Registered MoMo phone number for payouts
  payout_name?: string;  // Names registered on the SIM card
  payout_network?: 'MTN Mobile Money' | 'Airtel Money';
  trade_password?: string; // 6-digit password set during registration for withdrawal security
}

export interface ProductTier {
  id: number;
  product_id: number;
  name: string; // 'Basic' | 'Pro' | 'Enterprise'
  price_ugx: number;
  daily_earning_ugx?: number;
  capacity_note: string; // e.g. "50 alerts/day, 2 exchange connections"
  sort_order: number;
  features: string[];
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  model_code?: string; // e.g. 'FX1', 'FX2'
  series_name?: string; // e.g. 'ANTMINER T SERIES'
  category: 'Crypto Arbitrage' | 'Forex Scalping' | 'Commodities' | 'Sports Value';
  tagline: string;
  description: string;
  icon: string;
  icon_svg?: string;
  image_url?: string;
  daily_earning_ugx: number; // Daily yield in UGX
  stock_available: number; // e.g. 14
  total_stock: number; // e.g. 20
  duration_days: number; // 0 for lifetime
  lifetime_license: boolean;
  active: boolean;
  sort_order: number;
  tiers: ProductTier[];
  created_at: string;
  avg_daily_signals: number;
  historical_accuracy: number; // percentage
}

export type OrderStatus = 'pending' | 'paid' | 'rejected' | 'refunded';
export type OrderKind = 'purchase' | 'upgrade';

export interface Order {
  id: number;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  product_id: number;
  product_name?: string;
  tier_id: number;
  tier_name?: string;
  kind: OrderKind;
  amount_ugx: number;
  wallet_applied_ugx: number;
  status: OrderStatus;
  payment_method: 'mtn_momo' | 'airtel_money' | 'marzpay' | 'wallet_only';
  payment_ref: string;
  marzpay_reference?: string;
  marzpay_charged_ugx?: number;
  admin_note?: string;
  created_at: string;
  decided_at?: string;
  decided_by?: number;
}

export interface Deposit {
  id: number;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  amount_ugx: number;
  payment_method: 'mtn_momo' | 'airtel_money' | 'marzpay';
  payment_ref: string;
  status: 'pending' | 'paid' | 'rejected';
  admin_note?: string;
  created_at: string;
  decided_at?: string;
  decided_by?: number;
}

export interface License {
  id: number;
  user_id: number;
  product_id: number;
  tier_id: number;
  order_id: number;
  license_key: string;
  status: 'active' | 'paused';
  daily_earning_ugx?: number; // Daily yield rate
  total_earned_ugx?: number; // Total cumulative daily yield earned
  last_yield_date?: string; // e.g. "2026-08-31"
  alerts_today: number;
  uptime_pct: number;
  created_at: string;
  last_active: string;
  config: {
    risk_level: 'conservative' | 'moderate' | 'aggressive';
    auto_execute: boolean;
    notify_sms: boolean;
    notify_telegram: boolean;
  };
}

export interface Referral {
  id: number;
  referrer_id: number;
  referee_id: number;
  referee_name: string;
  referee_phone: string;
  created_at: string;
  total_spent_ugx: number;
  commission_earned_ugx: number;
}

export interface ReferralEarning {
  id: number;
  referrer_id: number;
  order_id: number;
  order_amount_ugx: number;
  amount_ugx: number; // 10% of order_amount_ugx
  referee_name: string;
  product_name: string;
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  user_id: number;
  amount_ugx: number; // positive = commission or yield, negative = withdrawal payout
  reason: 'referral_commission' | 'withdrawal_payout' | 'bot_daily_yield';
  related_order_id?: number;
  related_withdrawal_id?: number;
  related_license_id?: number;
  product_name?: string;
  note?: string;
  created_at: string;
}

export interface DailyYieldRecord {
  id: number;
  user_id: number;
  license_id: number;
  product_id: number;
  product_name: string;
  model_code: string;
  amount_ugx: number;
  yield_date: string; // e.g. "2026-08-31"
  created_at: string;
}

export interface Withdrawal {
  id: number;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  amount_ugx: number;
  momo_network: 'MTN Mobile Money' | 'Airtel Money';
  payout_phone: string;
  payout_name: string;
  status: 'pending' | 'paid' | 'rejected';
  admin_note?: string;
  payout_tx_id?: string;
  created_at: string;
  decided_at?: string;
  decided_by?: number;
}

export interface PaymentSettings {
  mtn_merchant_number: string;
  mtn_merchant_name: string;
  airtel_merchant_number: string;
  airtel_merchant_name: string;
  referral_commission_rate: number; // 0.10 (10%)
  min_withdrawal_ugx: number; // 0
  marzpay_enabled: boolean;
  support_phone: string;
  support_whatsapp: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  target_type: 'order' | 'withdrawal' | 'deposit' | 'product' | 'settings' | 'user';
  target_id?: number;
  details: string;
  created_at: string;
}

export interface FraudFlag {
  id: number;
  user_id: number;
  user_name: string;
  reason: 'self_referral' | 'device_match' | 'rapid_signup_burst' | 'mismatched_payout';
  details: string;
  created_at: string;
  status: 'open' | 'investigated' | 'dismissed';
}

export interface MarketSignal {
  id: string;
  bot_slug: string;
  bot_name: string;
  pair: string;
  type: 'ARBITRAGE' | 'BUY_SIGNAL' | 'SELL_SIGNAL' | 'BREAKOUT';
  confidence: number;
  expected_profit_pct: number;
  timestamp: string;
  exchange_a?: string;
  exchange_b?: string;
  details: string;
}
