import { Product, User, PaymentSettings, Order, Deposit, License, Withdrawal, AuditLog, FraudFlag, MarketSignal, LedgerEntry } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    slug: 'fx1-hood-machine',
    model_code: 'FX1',
    series_name: 'ANTMINER T SERIES',
    name: 'FX1',
    category: 'Crypto Arbitrage',
    tagline: 'Automated high-frequency arbitrage scanner with guaranteed daily profit yield.',
    description: 'High-speed algorithmic trading machine that continuously analyzes micro-spreads on USDT/UGX across Binance P2P, YellowCard, Chipper, and SunZu. Generates steady daily yield with automatic lifetime payout.',
    icon: 'Cpu',
    image_url: '/src/assets/images/fx1_hood_machine_1788192740797.jpg',
    daily_earning_ugx: 5000,
    stock_available: 14,
    total_stock: 20,
    duration_days: 0,
    lifetime_license: true,
    active: true,
    sort_order: 1,
    avg_daily_signals: 24,
    historical_accuracy: 94.2,
    created_at: '2026-01-10 08:00:00',
    tiers: [
      {
        id: 101,
        product_id: 1,
        name: 'Basic',
        price_ugx: 20000,
        daily_earning_ugx: 5000,
        capacity_note: 'Daily Yield UGX 5,000/day • Lifetime License • 25 alerts/day',
        sort_order: 1,
        features: [
          'Automatic Daily Yield: UGX 5,000/day credited at midnight',
          'Lifetime Software License (0 expiry)',
          'Binance P2P & YellowCard Feeds',
          'Instant Telegram Alert Channel',
          'Standard Profit Margin Filter (>1.5%)'
        ]
      },
      {
        id: 102,
        product_id: 1,
        name: 'Pro',
        price_ugx: 50000,
        daily_earning_ugx: 12500,
        capacity_note: 'Daily Yield UGX 12,500/day • Unlimited Feeds • 6 Exchanges',
        sort_order: 2,
        features: [
          'Automatic Daily Yield: UGX 12,500/day credited at midnight',
          'Lifetime License with VIP Priority Hash',
          'All 6 East African & Global Exchanges',
          'Webhook & Custom API Integration',
          'Priority VIP Trading Group Access'
        ]
      }
    ]
  },
  {
    id: 2,
    slug: 'fx2-quantum-machine',
    model_code: 'FX2',
    series_name: 'ANTMINER T SERIES',
    name: 'FX2 Quantum',
    category: 'Forex Scalping',
    tagline: 'AI-driven momentum breakouts on Gold and Major FX pairs with tight Stop Loss.',
    description: 'Proprietary multi-timeframe algorithm designed for MT4/MT5 with automated trend detection, London & New York session volume spikes, and smart trailing take-profit.',
    icon: 'TrendingUp',
    image_url: '/src/assets/images/fx2_quantum_machine_1788192754154.jpg',
    daily_earning_ugx: 12500,
    stock_available: 9,
    total_stock: 15,
    duration_days: 0,
    lifetime_license: true,
    active: true,
    sort_order: 2,
    avg_daily_signals: 18,
    historical_accuracy: 89.6,
    created_at: '2026-01-15 10:30:00',
    tiers: [
      {
        id: 201,
        product_id: 2,
        name: 'Basic',
        price_ugx: 50000,
        daily_earning_ugx: 12500,
        capacity_note: 'Daily Yield UGX 12,500/day • 3 Currency Pairs',
        sort_order: 1,
        features: [
          'Automatic Daily Yield: UGX 12,500/day at midnight',
          'Lifetime License (0 days expiry)',
          'EUR/USD, GBP/USD & USD/JPY Pairs',
          'Clear Entry, Stop-Loss & Take-Profit levels'
        ]
      },
      {
        id: 202,
        product_id: 2,
        name: 'Pro',
        price_ugx: 120000,
        daily_earning_ugx: 30000,
        capacity_note: 'Daily Yield UGX 30,000/day • Gold (XAU/USD) & US30',
        sort_order: 2,
        features: [
          'Automatic Daily Yield: UGX 30,000/day at midnight',
          'Unlimited Scalping Signals 24/5',
          'XAU/USD (Gold) & US30 Index Signals',
          'Direct MetaTrader 4/5 EA Copier Script'
        ]
      }
    ]
  },
  {
    id: 3,
    slug: 'fx3-titan-machine',
    model_code: 'FX3',
    series_name: 'ANTMINER T SERIES',
    name: 'FX3 Titan',
    category: 'Sports Value',
    tagline: 'Mathematical sure-bet and value margin scanner across Ugandan & global bookmakers.',
    description: 'Cross-checks live market odds between Fortebet, Betpawa, 1xBet, and Pinnacle. Pinpoints mathematical discrepancies with positive expected value (+EV) and steady yield.',
    icon: 'Zap',
    image_url: '/src/assets/images/fx3_titan_machine_1788192766311.jpg',
    daily_earning_ugx: 25000,
    stock_available: 6,
    total_stock: 10,
    duration_days: 0,
    lifetime_license: true,
    active: true,
    sort_order: 3,
    avg_daily_signals: 32,
    historical_accuracy: 91.5,
    created_at: '2026-01-20 14:00:00',
    tiers: [
      {
        id: 301,
        product_id: 3,
        name: 'Basic',
        price_ugx: 100000,
        daily_earning_ugx: 25000,
        capacity_note: 'Daily Yield UGX 25,000/day • Fortebet + Betpawa focus',
        sort_order: 1,
        features: [
          'Automatic Daily Yield: UGX 25,000/day at midnight',
          'Lifetime License (0 days expiry)',
          'Focus on Premier League, UCL & La Liga',
          'Fortebet & Betpawa Direct Odds Links'
        ]
      },
      {
        id: 302,
        product_id: 3,
        name: 'Pro',
        price_ugx: 220000,
        daily_earning_ugx: 55000,
        capacity_note: 'Daily Yield UGX 55,000/day • 12 Bookmakers',
        sort_order: 2,
        features: [
          'Automatic Daily Yield: UGX 55,000/day at midnight',
          'Guaranteed Zero-Risk SureBet Opportunities',
          '12 Ugandan & International Sportsbooks',
          'Sound Ping for Sub-2-Minute Odds Gaps'
        ]
      }
    ]
  },
  {
    id: 4,
    slug: 'fx4-apex-machine',
    model_code: 'FX4',
    series_name: 'ANTMINER T SERIES',
    name: 'FX4 Apex',
    category: 'Crypto Arbitrage',
    tagline: 'Algorithmic Dollar-Cost Averaging and high-yield automated crypto accumulation.',
    description: 'Automates systematic crypto accumulation and smart yield harvesting by buying heavier during oversold RSI dips and locking profits automatically.',
    icon: 'ShieldCheck',
    image_url: '/src/assets/images/fx4_apex_machine_1788192778770.jpg',
    daily_earning_ugx: 50000,
    stock_available: 3,
    total_stock: 5,
    duration_days: 0,
    lifetime_license: true,
    active: true,
    sort_order: 4,
    avg_daily_signals: 12,
    historical_accuracy: 96.0,
    created_at: '2026-02-01 09:00:00',
    tiers: [
      {
        id: 401,
        product_id: 4,
        name: 'Basic',
        price_ugx: 200000,
        daily_earning_ugx: 50000,
        capacity_note: 'Daily Yield UGX 50,000/day • BTC & ETH accumulator',
        sort_order: 1,
        features: [
          'Automatic Daily Yield: UGX 50,000/day at midnight',
          'Lifetime License (0 days expiry)',
          'BTC & ETH Dip-Buy Triggers',
          'Fear & Greed Index Milestone Alerts'
        ]
      },
      {
        id: 402,
        product_id: 4,
        name: 'Pro',
        price_ugx: 450000,
        daily_earning_ugx: 115000,
        capacity_note: 'Daily Yield UGX 115,000/day • Top 25 Crypto Assets',
        sort_order: 2,
        features: [
          'Automatic Daily Yield: UGX 115,000/day at midnight',
          'Full Top 25 Crypto Asset Monitoring',
          'Automated API Key Buy Execution',
          'Smart Take-Profit Ladder Strategies'
        ]
      }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: 'Mukula David (Admin)',
    phone: '+256760605911',
    payout_phone: '+256760605911',
    payout_name: 'Mukula David',
    payout_network: 'MTN Mobile Money',
    referral_code: 'MUKULA256',
    is_admin: true,
    wallet_balance_ugx: 250000,
    created_at: '2026-01-01 10:00:00',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    name: 'Sarah Namukasa',
    phone: '+256772123456',
    payout_phone: '+256772123456',
    payout_name: 'Sarah Namukasa',
    payout_network: 'MTN Mobile Money',
    referral_code: 'SARAH_BOTS',
    referred_by_id: 1,
    is_admin: false,
    wallet_balance_ugx: 45000,
    created_at: '2026-01-12 11:20:00',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    name: 'Denis Kigozi',
    phone: '+256701987654',
    payout_phone: '+256701987654',
    payout_name: 'Denis Kigozi',
    payout_network: 'Airtel Money',
    referral_code: 'DENIS_EARN',
    referred_by_id: 2,
    is_admin: false,
    wallet_balance_ugx: 80000,
    created_at: '2026-01-25 15:45:00',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    name: 'Mugisha Ronald (New Member)',
    phone: '+256755443322',
    payout_phone: '+256755443322',
    payout_name: 'Mugisha Ronald',
    payout_network: 'Airtel Money',
    referral_code: 'RONALD_VIP',
    referred_by_id: 3,
    is_admin: false,
    wallet_balance_ugx: 0,
    created_at: '2026-02-18 09:10:00',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_SETTINGS: PaymentSettings = {
  mtn_merchant_number: '0772 889 900',
  mtn_merchant_name: 'DAILY EARNER TECH LTD (MTN MoMoPay: 654321)',
  airtel_merchant_number: '0755 112 233',
  airtel_merchant_name: 'DAILY EARNER SERVICES (Airtel Pay: 98765)',
  referral_commission_rate: 0.10, // 10% strictly
  min_withdrawal_ugx: 5000,
  marzpay_enabled: true,
  support_phone: '+256 760 605 911',
  support_whatsapp: '+256760605911'
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 1001,
    user_id: 2,
    user_name: 'Sarah Namukasa',
    user_phone: '+256772123456',
    product_id: 1,
    product_name: 'Binance & YellowCard Arbitrage Bot',
    tier_id: 102,
    tier_name: 'Pro',
    kind: 'purchase',
    amount_ugx: 140000,
    wallet_applied_ugx: 0,
    status: 'paid',
    payment_method: 'mtn_momo',
    payment_ref: 'MM260112.1120.G89421',
    created_at: '2026-01-12 11:25:00',
    decided_at: '2026-01-12 11:28:00',
    decided_by: 1
  },
  {
    id: 1002,
    user_id: 3,
    user_name: 'Denis Kigozi',
    user_phone: '+256701987654',
    product_id: 2,
    product_name: 'EUR/USD & XAU Trend Sniper Bot',
    tier_id: 201,
    tier_name: 'Basic',
    kind: 'purchase',
    amount_ugx: 60000,
    wallet_applied_ugx: 0,
    status: 'paid',
    payment_method: 'airtel_money',
    payment_ref: 'AM-TX-998241',
    created_at: '2026-01-25 16:00:00',
    decided_at: '2026-01-25 16:05:00',
    decided_by: 1
  },
  {
    id: 1003,
    user_id: 4,
    user_name: 'Mugisha Ronald (New Member)',
    user_phone: '+256755443322',
    product_id: 3,
    product_name: 'Sports Arbitrage & Value Odds Bot',
    tier_id: 301,
    tier_name: 'Basic',
    kind: 'purchase',
    amount_ugx: 40000,
    wallet_applied_ugx: 0,
    status: 'pending',
    payment_method: 'mtn_momo',
    payment_ref: 'MM260218.0930.P44102',
    created_at: '2026-02-18 09:30:00'
  }
];

export const INITIAL_DEPOSITS: Deposit[] = [
  {
    id: 501,
    user_id: 2,
    user_name: 'Sarah Namukasa',
    user_phone: '+256772123456',
    amount_ugx: 50000,
    payment_method: 'mtn_momo',
    payment_ref: 'DEP-MTN-88123',
    status: 'paid',
    created_at: '2026-01-14 10:00:00',
    decided_at: '2026-01-14 10:04:00',
    decided_by: 1
  },
  {
    id: 502,
    user_id: 3,
    user_name: 'Denis Kigozi',
    user_phone: '+256701987654',
    amount_ugx: 80000,
    payment_method: 'airtel_money',
    payment_ref: 'DEP-AIR-33412',
    status: 'paid',
    created_at: '2026-01-26 12:10:00',
    decided_at: '2026-01-26 12:15:00',
    decided_by: 1
  },
  {
    id: 503,
    user_id: 4,
    user_name: 'Mugisha Ronald (New Member)',
    user_phone: '+256755443322',
    amount_ugx: 25000,
    payment_method: 'mtn_momo',
    payment_ref: 'DEP-MTN-99001',
    status: 'pending',
    created_at: '2026-02-18 09:40:00'
  }
];

export const INITIAL_LICENSES: License[] = [
  {
    id: 1,
    user_id: 2,
    product_id: 1,
    tier_id: 102,
    order_id: 1001,
    license_key: 'DE-ARB-PRO-9842-8812',
    status: 'active',
    daily_earning_ugx: 12500,
    total_earned_ugx: 62500,
    last_yield_date: '2026-08-30',
    alerts_today: 19,
    uptime_pct: 99.8,
    created_at: '2026-01-12 11:28:00',
    last_active: '2 mins ago',
    config: {
      risk_level: 'moderate',
      auto_execute: false,
      notify_sms: true,
      notify_telegram: true
    }
  },
  {
    id: 2,
    user_id: 3,
    product_id: 2,
    tier_id: 201,
    order_id: 1002,
    license_key: 'DE-FX-BSC-5512-3329',
    status: 'active',
    daily_earning_ugx: 12500,
    total_earned_ugx: 37500,
    last_yield_date: '2026-08-30',
    alerts_today: 8,
    uptime_pct: 99.4,
    created_at: '2026-01-25 16:05:00',
    last_active: '14 mins ago',
    config: {
      risk_level: 'conservative',
      auto_execute: false,
      notify_sms: false,
      notify_telegram: true
    }
  },
  {
    id: 3,
    user_id: 1, // David Mukula
    product_id: 3, // FX3 Titan
    tier_id: 301,
    order_id: 1000,
    license_key: 'DE-TITAN-BSC-9102-4411',
    status: 'active',
    daily_earning_ugx: 25000,
    total_earned_ugx: 75000,
    last_yield_date: '2026-08-30',
    alerts_today: 14,
    uptime_pct: 99.9,
    created_at: '2026-01-10 09:00:00',
    last_active: 'Just now',
    config: {
      risk_level: 'moderate',
      auto_execute: true,
      notify_sms: true,
      notify_telegram: true
    }
  }
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 101,
    user_id: 1,
    amount_ugx: 25000,
    reason: 'bot_daily_yield',
    related_license_id: 3,
    product_name: 'FX3 Titan',
    note: 'Midnight Bot Yield: FX3 Titan (+UGX 25,000)',
    created_at: '2026-08-30 00:00:00'
  },
  {
    id: 102,
    user_id: 1,
    amount_ugx: 25000,
    reason: 'bot_daily_yield',
    related_license_id: 3,
    product_name: 'FX3 Titan',
    note: 'Midnight Bot Yield: FX3 Titan (+UGX 25,000)',
    created_at: '2026-08-29 00:00:00'
  },
  {
    id: 103,
    user_id: 1,
    amount_ugx: 25000,
    reason: 'bot_daily_yield',
    related_license_id: 3,
    product_name: 'FX3 Titan',
    note: 'Midnight Bot Yield: FX3 Titan (+UGX 25,000)',
    created_at: '2026-08-28 00:00:00'
  },
  {
    id: 104,
    user_id: 2,
    amount_ugx: 12500,
    reason: 'bot_daily_yield',
    related_license_id: 1,
    product_name: 'FX1',
    note: 'Midnight Bot Yield: FX1 (+UGX 12,500)',
    created_at: '2026-08-30 00:00:00'
  },
  {
    id: 105,
    user_id: 2,
    amount_ugx: 12500,
    reason: 'bot_daily_yield',
    related_license_id: 1,
    product_name: 'FX1',
    note: 'Midnight Bot Yield: FX1 (+UGX 12,500)',
    created_at: '2026-08-29 00:00:00'
  },
  {
    id: 106,
    user_id: 3,
    amount_ugx: 12500,
    reason: 'bot_daily_yield',
    related_license_id: 2,
    product_name: 'FX2 Quantum',
    note: 'Midnight Bot Yield: FX2 Quantum (+UGX 12,500)',
    created_at: '2026-08-30 00:00:00'
  },
  {
    id: 1,
    user_id: 1, // Mukula referred Sarah
    amount_ugx: 14000, // 10% of 140,000 UGX
    reason: 'referral_commission',
    related_order_id: 1001,
    note: '10% Commission from Sarah Namukasa (Arbitrage Bot Pro)',
    created_at: '2026-01-12 11:28:00'
  },
  {
    id: 2,
    user_id: 2, // Sarah referred Denis
    amount_ugx: 6000, // 10% of 60,000 UGX
    reason: 'referral_commission',
    related_order_id: 1002,
    note: '10% Commission from Denis Kigozi (Forex Sniper Basic)',
    created_at: '2026-01-25 16:05:00'
  }
];

export const INITIAL_WITHDRAWALS: Withdrawal[] = [
  {
    id: 801,
    user_id: 1,
    user_name: 'Mukula David',
    user_phone: '+256760605911',
    amount_ugx: 10000,
    momo_network: 'MTN Mobile Money',
    payout_phone: '+256760605911',
    payout_name: 'Mukula David',
    status: 'paid',
    payout_tx_id: 'TX-PAY-882190',
    created_at: '2026-01-15 08:30:00',
    decided_at: '2026-01-15 08:45:00',
    decided_by: 1
  }
];

export const INITIAL_AUDIT_LOG: AuditLog[] = [
  {
    id: 1,
    admin_id: 1,
    admin_name: 'Mukula David',
    action: 'order_approved',
    target_type: 'order',
    target_id: 1001,
    details: 'Approved Order #1001 for Sarah Namukasa (UGX 140,000) & generated License #1. Credited 10% (UGX 14,000) referral commission to referrer.',
    created_at: '2026-01-12 11:28:00'
  },
  {
    id: 2,
    admin_id: 1,
    admin_name: 'Mukula David',
    action: 'order_approved',
    target_type: 'order',
    target_id: 1002,
    details: 'Approved Order #1002 for Denis Kigozi (UGX 60,000) & credited UGX 6,000 to Sarah Namukasa.',
    created_at: '2026-01-25 16:05:00'
  }
];

export const INITIAL_FRAUD_FLAGS: FraudFlag[] = [
  {
    id: 1,
    user_id: 4,
    user_name: 'Mugisha Ronald',
    reason: 'rapid_signup_burst',
    details: 'Device IP 102.89.22.10 generated 2 signups in 5 minutes. Monitored for verification.',
    created_at: '2026-02-18 09:15:00',
    status: 'open'
  }
];

export const LIVE_SIGNALS_SAMPLE: MarketSignal[] = [
  {
    id: 'SIG-901',
    bot_slug: 'crypto-arbitrage-bot',
    bot_name: 'Binance & YellowCard Arbitrage Bot',
    pair: 'USDT / UGX',
    type: 'ARBITRAGE',
    confidence: 98.4,
    expected_profit_pct: 2.85,
    timestamp: 'Just now',
    exchange_a: 'YellowCard (Buy @ 3,680 UGX)',
    exchange_b: 'Binance P2P (Sell @ 3,785 UGX)',
    details: 'Net spread +105 UGX per dollar after 0.2% network fee. Liquid volume: $4,500.'
  },
  {
    id: 'SIG-902',
    bot_slug: 'forex-trend-sniper',
    bot_name: 'EUR/USD & XAU Trend Sniper Bot',
    pair: 'XAU/USD (Gold Spot)',
    type: 'BUY_SIGNAL',
    confidence: 91.0,
    expected_profit_pct: 1.45,
    timestamp: '4 mins ago',
    details: 'Bullish engulfing candle on 15M chart. Entry: 2,742.50 | SL: 2,735.00 | TP1: 2,752.00 | TP2: 2,764.00'
  },
  {
    id: 'SIG-903',
    bot_slug: 'uganda-odd-value-bot',
    bot_name: 'Sports Arbitrage & Value Odds Bot',
    pair: 'Arsenal vs Chelsea (Over 2.5 Goals)',
    type: 'ARBITRAGE',
    confidence: 95.2,
    expected_profit_pct: 4.10,
    timestamp: '9 mins ago',
    exchange_a: 'Fortebet (Over 2.5 @ 1.95)',
    exchange_b: '1xBet (Under 2.5 @ 2.18)',
    details: 'SureBet margin arbitrage: 4.1% guaranteed ROI regardless of match outcome.'
  },
  {
    id: 'SIG-904',
    bot_slug: 'crypto-dca-smart-accumulator',
    bot_name: 'Smart BTC & ETH DCA Accumulator',
    pair: 'BTC / USDT',
    type: 'BREAKOUT',
    confidence: 88.7,
    expected_profit_pct: 3.20,
    timestamp: '16 mins ago',
    details: 'RSI bottom divergence at 4H support. Automated accumulator triggered tranche #3 buy.'
  }
];
