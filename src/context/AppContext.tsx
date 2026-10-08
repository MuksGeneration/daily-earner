import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, Product, ProductTier, Order, Deposit, License, Withdrawal, 
  PaymentSettings, AuditLog, FraudFlag, MarketSignal, LedgerEntry, OrderKind, DailyYieldRecord 
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialData';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentUser: User;
  users: User[];
  products: Product[];
  orders: Order[];
  deposits: Deposit[];
  licenses: License[];
  ledger: LedgerEntry[];
  withdrawals: Withdrawal[];
  settings: PaymentSettings;
  auditLogs: AuditLog[];
  fraudFlags: FraudFlag[];
  signals: MarketSignal[];
  activeTab: string;
  beginnerMode: boolean;
  searchQuery: string;
  checkoutModal: {
    isOpen: boolean;
    product?: Product;
    tier?: ProductTier;
    kind?: OrderKind;
  };
  dailyYieldHistory: DailyYieldRecord[];
  nextMidnightSeconds: number;
  countdownFormatted: string;
  todayBotEarningsUgx: number;
  totalActiveBotsCount: number;
  triggerMidnightYield: (force?: boolean) => { totalCredited: number; botCount: number; message: string };
  setActiveTab: (tab: string) => void;
  setBeginnerMode: (val: boolean) => void;
  setSearchQuery: (query: string) => void;
  switchUser: (userId: number) => void;
  openCheckout: (product: Product, tier: ProductTier, kind?: OrderKind) => void;
  closeCheckout: () => void;
  createOrder: (data: {
    productId: number;
    tierId: number;
    kind: OrderKind;
    paymentMethod: 'mtn_momo' | 'airtel_money' | 'marzpay' | 'wallet_only';
    paymentRef: string;
    applyWallet: boolean;
  }) => { success: boolean; orderId?: number; message?: string };
  createDeposit: (amountUgx: number, method: 'mtn_momo' | 'airtel_money' | 'marzpay', ref: string) => { success: boolean; message: string };
  initiateMarzPayTopUp: (amountUgx: number, phone: string) => Promise<{ success: boolean; transaction_uuid?: string; reference?: string; message: string; network?: string; status?: string; provider_response?: any }>;
  checkMarzPayStatus: (uuidOrRef: string) => Promise<{ success: boolean; status: 'paid' | 'pending' | 'failed'; message?: string; amount?: number; phone?: string }>;
  completeMarzPayDeposit: (amountUgx: number, uuid: string, ref: string, providerTxId?: string) => void;
  updatePayoutAccount: (phone: string, name: string, network?: 'MTN Mobile Money' | 'Airtel Money') => { success: boolean; message: string };
  requestWithdrawal: (amountUgx: number, network: 'MTN Mobile Money' | 'Airtel Money', phone: string, name: string, tradePassword: string) => Promise<{ success: boolean; message: string }>;
  adminApproveOrder: (orderId: number, note?: string) => void;
  adminRejectOrder: (orderId: number, reason: string) => void;
  adminApproveDeposit: (depositId: number, note?: string) => void;
  adminRejectDeposit: (depositId: number, reason: string) => void;
  adminPayWithdrawal: (withdrawalId: number, txId: string, note?: string) => void;
  adminRejectWithdrawal: (withdrawalId: number, reason: string) => void;
  adminUpdateSettings: (newSettings: Partial<PaymentSettings>) => void;
  adminAddProduct: (product: Omit<Product, 'id' | 'created_at'>) => void;
  adminUpdateProduct: (productId: number, data: Partial<Product>) => void;
  adminDeleteProduct: (productId: number) => { success: boolean; message: string };
  toggleLicenseStatus: (licenseId: number) => void;
  updateLicenseConfig: (licenseId: number, config: License['config']) => void;
  getReferralBalance: (userId: number) => number;
  getReferralStats: (userId: number) => {
    refereesCount: number;
    totalEarnedUgx: number;
    withdrawnUgx: number;
    pendingPayoutUgx: number;
    availableBalanceUgx: number;
  };
  registerUser: (name: string, phone: string, password: string, refCode: string | undefined, tradePassword: string) => Promise<{ success: boolean; message?: string }>;
  loginUser: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  restoreAuthenticatedUser: (user: User) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'daily_earner_state_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const [users, setUsers] = useState<User[]>(() => loadStored('users', []));
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const authenticatedUser = loadStored<User | null>('authenticated_user', null);
    if (authenticatedUser) return authenticatedUser;
    const storedUsers = loadStored<User[]>('users', []);
    const storedUserId = loadStored('current_user_id', 0);
    return storedUsers.find((u: User) => u.id === storedUserId) || ({ id: 0, name: '', phone: '', referral_code: '', is_admin: false, wallet_balance_ugx: 0, created_at: '' } as User);
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const storedProducts = loadStored<Product[]>('products', INITIAL_PRODUCTS);
    return storedProducts.map(product => {
      if (!product.image_url?.startsWith('/src/assets/images/')) return product;
      const bundledProduct = INITIAL_PRODUCTS.find(item => item.id === product.id);
      return bundledProduct ? { ...product, image_url: bundledProduct.image_url } : product;
    });
  });
  const [orders, setOrders] = useState<Order[]>(() => loadStored('orders', []));
  const [deposits, setDeposits] = useState<Deposit[]>(() => loadStored('deposits', []));
  const [licenses, setLicenses] = useState<License[]>(() => loadStored('licenses', []));
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => loadStored('ledger', []));
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(() => loadStored('withdrawals', []));
  const [settings, setSettings] = useState<PaymentSettings>(() => loadStored('settings', INITIAL_SETTINGS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored('audit_logs', []));
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>(() => loadStored('fraud_flags', []));
  const [signals, setSignals] = useState<MarketSignal[]>(() => loadStored('signals', []));
  const [dailyYieldHistory, setDailyYieldHistory] = useState<DailyYieldRecord[]>(() => loadStored('daily_yield_history', []));
  const [nextMidnightSeconds, setNextMidnightSeconds] = useState<number>(0);
  const [countdownFormatted, setCountdownFormatted] = useState<string>('00h 00m 00s');

  const [activeTab, setActiveTab] = useState<string>('store');
  const [beginnerMode, setBeginnerMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    product?: Product;
    tier?: ProductTier;
    kind?: OrderKind;
  }>({ isOpen: false });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_current_user_id`, JSON.stringify(currentUser.id));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_deposits`, JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_licenses`, JSON.stringify(licenses));
  }, [licenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ledger`, JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_withdrawals`, JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_fraud_flags`, JSON.stringify(fraudFlags));
  }, [fraudFlags]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_daily_yield_history`, JSON.stringify(dailyYieldHistory));
  }, [dailyYieldHistory]);

  // Keep currentUser state in sync with updated users list
  useEffect(() => {
    const updated = users.find(u => u.id === currentUser.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
      setCurrentUser(updated);
    }
  }, [users, currentUser.id]);

  // Midnight Countdown calculation
  const calculateSecondsToMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    return diff;
  };

  const formatCountdown = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // User active bots summary
  const userActiveLicenses = licenses.filter(l => l.user_id === currentUser.id && l.status === 'active');
  const todayBotEarningsUgx = userActiveLicenses.reduce((acc, l) => {
    const product = products.find(p => p.id === l.product_id);
    const tier = product?.tiers.find(t => t.id === l.tier_id);
    const daily = l.daily_earning_ugx || tier?.daily_earning_ugx || product?.daily_earning_ugx || 5000;
    return acc + daily;
  }, 0);
  const totalActiveBotsCount = userActiveLicenses.length;

  // Automated Midnight Yield Crediting Routine
  const triggerMidnightYield = useCallback((force: boolean = false) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const activeLicenses = licenses.filter(l => l.status === 'active');
    if (activeLicenses.length === 0) {
      return { totalCredited: 0, botCount: 0, message: 'No active bot licenses to credit.' };
    }

    let totalCreditedUgx = 0;
    let affectedBotsCount = 0;
    const newYieldRecords: DailyYieldRecord[] = [];
    const newLedgerEntries: LedgerEntry[] = [];
    let updatedUsers = [...users];

    activeLicenses.forEach(lic => {
      // If not forced and already credited today, skip
      if (!force && lic.last_yield_date === todayStr) {
        return;
      }

      const product = products.find(p => p.id === lic.product_id);
      const tier = product?.tiers.find(t => t.id === lic.tier_id);
      const dailyYield = lic.daily_earning_ugx || tier?.daily_earning_ugx || product?.daily_earning_ugx || 5000;

      totalCreditedUgx += dailyYield;
      affectedBotsCount++;

      // Credit to user's wallet
      const userIndex = updatedUsers.findIndex(u => u.id === lic.user_id);
      if (userIndex !== -1) {
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          wallet_balance_ugx: updatedUsers[userIndex].wallet_balance_ugx + dailyYield,
          bot_earnings_ugx: (updatedUsers[userIndex].bot_earnings_ugx || 0) + dailyYield,
          last_midnight_yield_at: nowStr
        };
      }

      // Record ledger entry
      newLedgerEntries.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        user_id: lic.user_id,
        amount_ugx: dailyYield,
        reason: 'bot_daily_yield',
        related_license_id: lic.id,
        product_name: product?.name || 'Smart Bot',
        note: `Midnight Bot Yield: ${product?.model_code || product?.name || 'Bot'} (+UGX ${dailyYield.toLocaleString()})`,
        created_at: nowStr
      });

      // Record daily yield record
      newYieldRecords.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        user_id: lic.user_id,
        license_id: lic.id,
        product_id: lic.product_id,
        product_name: product?.name || 'Smart Bot',
        model_code: product?.model_code || 'FX',
        amount_ugx: dailyYield,
        yield_date: todayStr,
        created_at: nowStr
      });
    });

    if (affectedBotsCount > 0) {
      setUsers(updatedUsers);
      setLicenses(prev => prev.map(l => {
        if (l.status !== 'active') return l;
        if (!force && l.last_yield_date === todayStr) return l;
        const product = products.find(p => p.id === l.product_id);
        const tier = product?.tiers.find(t => t.id === l.tier_id);
        const dailyYield = l.daily_earning_ugx || tier?.daily_earning_ugx || product?.daily_earning_ugx || 5000;
        return {
          ...l,
          last_yield_date: todayStr,
          total_earned_ugx: (l.total_earned_ugx || 0) + dailyYield
        };
      }));

      if (newLedgerEntries.length > 0) {
        setLedger(prev => [...newLedgerEntries, ...prev]);
      }
      if (newYieldRecords.length > 0) {
        setDailyYieldHistory(prev => [...newYieldRecords, ...prev]);
      }

      // Audit log
      setAuditLogs(prev => [
        {
          id: prev.length + 1,
          admin_id: 1,
          admin_name: 'Midnight Automated Cron',
          action: 'daily_yield_disbursed',
          target_type: 'bot_yield',
          details: `Automatically credited UGX ${totalCreditedUgx.toLocaleString()} daily yield across ${affectedBotsCount} active smart bot licenses at midnight.`,
          created_at: nowStr
        },
        ...prev
      ]);

      try {
        confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
      } catch {}

      return {
        totalCredited: totalCreditedUgx,
        botCount: affectedBotsCount,
        message: `Credited UGX ${totalCreditedUgx.toLocaleString()} from ${affectedBotsCount} active bot(s) to user balance!`
      };
    }

    return {
      totalCredited: 0,
      botCount: 0,
      message: 'Today\'s midnight bot earnings have already been credited.'
    };
  }, [licenses, products, users]);

  // Live midnight countdown ticker and automatic midnight trigger
  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateSecondsToMidnight();
      setNextMidnightSeconds(remaining);
      setCountdownFormatted(formatCountdown(remaining));

      // If midnight strikes (0s or 86399s)
      if (remaining === 0) {
        triggerMidnightYield(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [triggerMidnightYield]);

  const switchUser = (userId: number) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const applyAuthenticatedUser = (user: User, token: string) => {
    localStorage.setItem('daily_earner_auth_token', token);
    localStorage.setItem(`${STORAGE_KEY}_authenticated_user`, JSON.stringify(user));
    setUsers(previous => [...previous.filter(existing => existing.id !== user.id), user]);
    setCurrentUser(user);
  };

  const registerUser = async (name: string, phone: string, password: string, refCode: string | undefined, tradePassword: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, invitationCode: refCode, tradePassword })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Registration failed.' };
      applyAuthenticatedUser(data.user, data.token);
      return { success: true };
    } catch {
      return { success: false, message: 'Unable to contact the server.' };
    }
  };

  const loginUser = async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Login failed.' };
      applyAuthenticatedUser(data.user, data.token);
      return { success: true };
    } catch {
      return { success: false, message: 'Unable to contact the server.' };
    }
  };

  const restoreAuthenticatedUser = useCallback((user: User) => {
    localStorage.setItem(`${STORAGE_KEY}_authenticated_user`, JSON.stringify(user));
    setUsers(previous => [...previous.filter(existing => existing.id !== user.id), user]);
    setCurrentUser(user);
  }, []);

  const openCheckout = (product: Product, tier: ProductTier, kind: OrderKind = 'purchase') => {
    setCheckoutModal({ isOpen: true, product, tier, kind });
  };

  const closeCheckout = () => {
    setCheckoutModal({ isOpen: false });
  };

  // Referral Balance Calculation
  // Derived strictly from ledger: (Total Commissions) - (Total Paid Withdrawals) - (Pending Withdrawals)
  const getReferralBalance = (userId: number): number => {
    const totalCommissions = ledger
      .filter(l => l.user_id === userId && l.reason === 'referral_commission')
      .reduce((sum, item) => sum + item.amount_ugx, 0);

    const totalPaidPayouts = ledger
      .filter(l => l.user_id === userId && l.reason === 'withdrawal_payout')
      .reduce((sum, item) => sum + Math.abs(item.amount_ugx), 0);

    const totalPendingPayouts = withdrawals
      .filter(w => w.user_id === userId && w.status === 'pending')
      .reduce((sum, item) => sum + item.amount_ugx, 0);

    return Math.max(0, totalCommissions - totalPaidPayouts - totalPendingPayouts);
  };

  const getReferralStats = (userId: number) => {
    const referees = users.filter(u => u.referred_by_id === userId);
    const totalCommissions = ledger
      .filter(l => l.user_id === userId && l.reason === 'referral_commission')
      .reduce((sum, item) => sum + item.amount_ugx, 0);

    const totalPaidPayouts = ledger
      .filter(l => l.user_id === userId && l.reason === 'withdrawal_payout')
      .reduce((sum, item) => sum + Math.abs(item.amount_ugx), 0);

    const totalPendingPayouts = withdrawals
      .filter(w => w.user_id === userId && w.status === 'pending')
      .reduce((sum, item) => sum + item.amount_ugx, 0);

    const available = Math.max(0, totalCommissions - totalPaidPayouts - totalPendingPayouts);

    return {
      refereesCount: referees.length,
      totalEarnedUgx: totalCommissions,
      withdrawnUgx: totalPaidPayouts,
      pendingPayoutUgx: totalPendingPayouts,
      availableBalanceUgx: available
    };
  };

  // Create Order (Checkout)
  const createOrder = ({
    productId,
    tierId,
    kind,
    paymentMethod,
    paymentRef,
    applyWallet
  }: {
    productId: number;
    tierId: number;
    kind: OrderKind;
    paymentMethod: 'mtn_momo' | 'airtel_money' | 'marzpay' | 'wallet_only';
    paymentRef: string;
    applyWallet: boolean;
  }) => {
    const product = products.find(p => p.id === productId);
    const tier = product?.tiers.find(t => t.id === tierId);
    if (!product || !tier) {
      return { success: false, message: 'Invalid product or tier selection.' };
    }

    if (kind === 'purchase' && product.stock_available <= 0) {
      return { success: false, message: 'This bot is currently sold out.' };
    }

    let requiredAmount = tier.price_ugx;

    // If upgrading from Basic to Pro, calculate only price difference!
    if (kind === 'upgrade') {
      const existingLicense = licenses.find(l => l.user_id === currentUser.id && l.product_id === productId);
      if (existingLicense) {
        const currentTier = product.tiers.find(t => t.id === existingLicense.tier_id);
        if (currentTier) {
          requiredAmount = Math.max(0, tier.price_ugx - currentTier.price_ugx);
        }
      }
    }

    let walletApplied = 0;
    if (applyWallet && currentUser.wallet_balance_ugx > 0) {
      walletApplied = Math.min(currentUser.wallet_balance_ugx, requiredAmount);
    }

    const remainingCashRequired = requiredAmount - walletApplied;

    if (paymentMethod === 'wallet_only' && remainingCashRequired > 0) {
      return { success: false, message: `Insufficient prepaid wallet balance. Missing UGX ${remainingCashRequired.toLocaleString()}.` };
    }

    // Deduct prepaid wallet balance if applied
    if (walletApplied > 0) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, wallet_balance_ugx: u.wallet_balance_ugx - walletApplied } : u));
    }

    // If paying 100% via wallet or instant MarzPay sandbox, auto-mark paid
    const isAutoPaid = remainingCashRequired === 0 || paymentMethod === 'marzpay';

    const orderId = 1000 + orders.length + 1;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newOrder: Order = {
      id: orderId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_phone: currentUser.phone,
      product_id: productId,
      product_name: product.name,
      tier_id: tierId,
      tier_name: tier.name,
      kind,
      amount_ugx: requiredAmount,
      wallet_applied_ugx: walletApplied,
      status: isAutoPaid ? 'paid' : 'pending',
      payment_method: paymentMethod,
      payment_ref: paymentRef || (isAutoPaid ? `WALLET-TX-${orderId}` : `MOMO-REF-${orderId}`),
      marzpay_reference: paymentMethod === 'marzpay' ? `MARZ-${Date.now()}` : undefined,
      marzpay_charged_ugx: paymentMethod === 'marzpay' ? remainingCashRequired : 0,
      created_at: nowStr,
      decided_at: isAutoPaid ? nowStr : undefined,
      decided_by: isAutoPaid ? 1 : undefined
    };

    setOrders(prev => [newOrder, ...prev]);

    if (isAutoPaid) {
      // Grant license & pay 10% referral commission immediately
      grantLicenseAndPayCommission(newOrder);
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch { /* confetti fallback */ }
    }

    closeCheckout();
    return { 
      success: true, 
      orderId, 
      message: isAutoPaid 
        ? 'Order processed successfully! Your smart bot license is now active.' 
        : 'Payment reference submitted! Admin will verify and activate your bot license shortly.' 
    };
  };

  // Grant License and pay 10% referral commission (Atomic business action)
  const grantLicenseAndPayCommission = (order: Order) => {
    const product = products.find(p => p.id === order.product_id);
    const tier = product?.tiers.find(t => t.id === order.tier_id);
    const buyer = users.find(u => u.id === order.user_id);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const isNewPurchase = order.kind === 'purchase' && !licenses.some(
      license => license.user_id === order.user_id && license.product_id === order.product_id
    );

    // Update or add license
    setLicenses(prev => {
      const existing = prev.find(l => l.user_id === order.user_id && l.product_id === order.product_id);
      if (existing) {
        return prev.map(l => l.id === existing.id ? {
          ...l,
          tier_id: order.tier_id,
          order_id: order.id,
          license_key: `DE-${product?.slug.slice(0, 3).toUpperCase()}-${tier?.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'active',
          last_active: 'Just now'
        } : l);
      } else {
        const newLicense: License = {
          id: prev.length + 1,
          user_id: order.user_id,
          product_id: order.product_id,
          tier_id: order.tier_id,
          order_id: order.id,
          license_key: `DE-${product?.slug.slice(0, 3).toUpperCase()}-${tier?.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'active',
          alerts_today: 0,
          uptime_pct: 99.9,
          created_at: nowStr,
          last_active: 'Just now',
          config: {
            risk_level: 'moderate',
            auto_execute: false,
            notify_sms: true,
            notify_telegram: true
          }
        };
        return [newLicense, ...prev];
      }
    });

    // Stock is consumed only once a new bot license has been activated, never for
    // pending orders or tier upgrades.
    if (isNewPurchase) {
      setProducts(prev => prev.map(item => item.id === order.product_id
        ? { ...item, stock_available: Math.max(0, item.stock_available - 1) }
        : item
      ));
    }

    // 10% Referral Commission payout to referrer (if any)
    if (buyer?.referred_by_id) {
      const referrer = users.find(u => u.id === buyer.referred_by_id);
      if (referrer) {
        const commissionAmount = Math.round(order.amount_ugx * settings.referral_commission_rate);
        if (commissionAmount > 0) {
          const newLedgerEntry: LedgerEntry = {
            id: ledger.length + 1,
            user_id: referrer.id,
            amount_ugx: commissionAmount,
            reason: 'referral_commission',
            related_order_id: order.id,
            note: `10% Commission from ${buyer.name} (${product?.name || 'Bot'} ${tier?.name || ''})`,
            created_at: nowStr
          };
          setLedger(prev => [newLedgerEntry, ...prev]);

          // Audit log entry
          const audit: AuditLog = {
            id: auditLogs.length + 1,
            admin_id: 1,
            admin_name: 'System / Admin',
            action: 'commission_credited',
            target_type: 'order',
            target_id: order.id,
            details: `Credited UGX ${commissionAmount.toLocaleString()} (10%) to referrer ${referrer.name} for Order #${order.id}.`,
            created_at: nowStr
          };
          setAuditLogs(prev => [audit, ...prev]);
        }
      }
    }
  };

  // Create Wallet Deposit
  const createDeposit = (amountUgx: number, method: 'mtn_momo' | 'airtel_money' | 'marzpay', ref: string) => {
    if (amountUgx < 5000) {
      return { success: false, message: 'Minimum deposit is UGX 5,000.' };
    }
    const isAutoPaid = method === 'marzpay';
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const depositId = 500 + deposits.length + 1;

    const newDeposit: Deposit = {
      id: depositId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_phone: currentUser.phone,
      amount_ugx: amountUgx,
      payment_method: method,
      payment_ref: ref || `DEP-MOMO-${depositId}`,
      status: isAutoPaid ? 'paid' : 'pending',
      created_at: nowStr,
      decided_at: isAutoPaid ? nowStr : undefined,
      decided_by: isAutoPaid ? 1 : undefined
    };

    setDeposits(prev => [newDeposit, ...prev]);

    if (isAutoPaid) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, wallet_balance_ugx: u.wallet_balance_ugx + amountUgx } : u));
    }

    return { 
      success: true, 
      message: isAutoPaid 
        ? `UGX ${amountUgx.toLocaleString()} credited to your prepaid wallet balance!` 
        : 'Deposit request submitted. Admin will verify Mobile Money reference and credit your balance.' 
    };
  };

  // MarzPay Top-Up Initiator
  const initiateMarzPayTopUp = async (amountUgx: number, phone: string) => {
    try {
      const token = localStorage.getItem('daily_earner_auth_token');
      const res = await fetch('/api/marzpay/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          amount: amountUgx,
          phone_number: phone,
          user_id: currentUser?.id,
          description: `Prepaid Top Up - ${currentUser?.name || 'Member'}`
        })
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return { 
        success: false, 
        message: err.message || 'Failed to communicate with Lipa Solution.' 
      };
    }
  };

  // MarzPay Status Checker
  const checkMarzPayStatus = async (uuidOrRef: string) => {
    try {
      const token = localStorage.getItem('daily_earner_auth_token');
      const res = await fetch(`/api/marzpay/check-status?uuid=${encodeURIComponent(uuidOrRef)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, status: 'pending' as const, message: err.message };
    }
  };

  // MarzPay Complete Deposit (Auto-Credit)
  const completeMarzPayDeposit = (amountUgx: number, uuid: string, ref: string, providerTxId?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const depositId = 500 + deposits.length + 1;

    const newDeposit: Deposit = {
      id: depositId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_phone: currentUser.phone,
      amount_ugx: amountUgx,
      payment_method: 'marzpay',
      payment_ref: ref || uuid,
      status: 'paid',
      admin_note: `Lipa Solution MoMo Payment Verified (Tx ID: ${providerTxId || uuid})`,
      created_at: nowStr,
      decided_at: nowStr,
      decided_by: 1
    };

    setDeposits(prev => [newDeposit, ...prev]);
    // The server credits MarzPay payments atomically. Refresh the authoritative
    // wallet balance rather than adding the amount in the browser.
    const token = localStorage.getItem('daily_earner_auth_token');
    void fetch('/api/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!data?.user) return;
        setCurrentUser(data.user);
        setUsers(previous => [...previous.filter(existing => existing.id !== data.user.id), data.user]);
      })
      .catch(() => undefined);

    // Audit log
    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: 1,
        admin_name: 'Lipa Solution',
        action: 'marzpay_deposit_credited',
        target_type: 'deposit',
        target_id: depositId,
        details: `Auto-credited UGX ${amountUgx.toLocaleString()} to ${currentUser.name} via Lipa Solution MoMo Prompt (${providerTxId || uuid}).`,
        created_at: nowStr
      },
      ...prev
    ]);

    try {
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
    } catch {}
  };

  // Update and Persist Registered Payout Account Details
  const updatePayoutAccount = (phone: string, name: string, network?: 'MTN Mobile Money' | 'Airtel Money') => {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    if (!cleanPhone) {
      return { success: false, message: 'Please provide a valid Mobile Money payout phone number.' };
    }
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      return { success: false, message: 'Please enter a valid 9 to 12 digit Mobile Money phone number.' };
    }
    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'Please enter the exact name registered on the SIM card.' };
    }

    const updatedUser: User = {
      ...currentUser,
      payout_phone: cleanPhone,
      payout_name: cleanName,
      payout_network: network || currentUser.payout_network || 'MTN Mobile Money'
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    return {
      success: true,
      message: `Payout account saved: ${cleanPhone} (${cleanName})`
    };
  };

  // Request Referral Payout Withdrawal
  const requestWithdrawal = async (amountUgx: number, network: 'MTN Mobile Money' | 'Airtel Money', phone: string, name: string, tradePassword: string) => {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    // Verify trade password
    if (!tradePassword) {
      return { success: false, message: 'Trade password is required for withdrawal security.' };
    }
    try {
      const token = localStorage.getItem('daily_earner_auth_token');
      const response = await fetch('/api/auth/verify-trade-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ tradePassword })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, message: data.message || 'Unable to verify trade password.' };
      }
    } catch {
      return { success: false, message: 'Unable to contact the server to verify your trade password.' };
    }

    if (!cleanPhone) {
      return { success: false, message: 'Payout account phone number is required.' };
    }
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      return { success: false, message: 'Please enter a valid 9 to 12 digit Mobile Money phone number (e.g. 0772123456).' };
    }
    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'Registered account name on SIM card is required for payout verification.' };
    }

    const available = getReferralBalance(currentUser.id);
    if (amountUgx <= 0) {
      return { success: false, message: 'Please enter a valid withdrawal amount.' };
    }
    if (amountUgx > available) {
      return { success: false, message: `Withdrawal amount exceeds available balance (UGX ${available.toLocaleString()}).` };
    }
    if (amountUgx < settings.min_withdrawal_ugx) {
      return { success: false, message: `Minimum withdrawal is UGX ${settings.min_withdrawal_ugx.toLocaleString()}.` };
    }

    // Calculate 15% withdrawal fee
    const withdrawalFeeUgx = Math.round(amountUgx * 0.15);
    const netAmountUgx = amountUgx - withdrawalFeeUgx;

    // Automatically update and persist user's payout credentials for convenience
    const updatedUser: User = {
      ...currentUser,
      payout_phone: cleanPhone,
      payout_name: cleanName,
      payout_network: network
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    const withdrawalId = 800 + withdrawals.length + 1;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_phone: currentUser.phone,
      amount_ugx: netAmountUgx,
      momo_network: network,
      payout_phone: cleanPhone,
      payout_name: cleanName,
      status: 'pending',
      created_at: nowStr
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);

    return {
      success: true,
      message: `Withdrawal request for UGX ${netAmountUgx.toLocaleString()} submitted to ${network} (${cleanPhone} - ${cleanName}).\n\n💰 Withdrawal Fee (15%): UGX ${withdrawalFeeUgx.toLocaleString()}\n💵 Net Amount: UGX ${netAmountUgx.toLocaleString()}`
    };
  };

  // Admin Actions
  const adminApproveOrder = (orderId: number, note?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return;

    const isNewPurchase = order.kind === 'purchase' && !licenses.some(
      license => license.user_id === order.user_id && license.product_id === order.product_id
    );
    const product = products.find(item => item.id === order.product_id);
    if (isNewPurchase && (!product || product.stock_available <= 0)) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updatedOrder: Order = {
      ...order,
      status: 'paid',
      admin_note: note || 'Approved by Admin Mukula David',
      decided_at: nowStr,
      decided_by: currentUser.id
    };

    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    grantLicenseAndPayCommission(updatedOrder);

    // Add Audit Log
    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: currentUser.id,
        admin_name: currentUser.name,
        action: 'order_approved',
        target_type: 'order',
        target_id: orderId,
        details: `Approved Order #${orderId} for ${order.user_name} (UGX ${order.amount_ugx.toLocaleString()}) & activated license.`,
        created_at: nowStr
      },
      ...prev
    ]);
  };

  const adminRejectOrder = (orderId: number, reason: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'rejected',
      admin_note: reason || 'Invalid or unverified Mobile Money reference',
      decided_at: nowStr,
      decided_by: currentUser.id
    } : o));

    // Refund wallet applied if any
    if (order.wallet_applied_ugx > 0) {
      setUsers(prev => prev.map(u => u.id === order.user_id ? { ...u, wallet_balance_ugx: u.wallet_balance_ugx + order.wallet_applied_ugx } : u));
    }

    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: currentUser.id,
        admin_name: currentUser.name,
        action: 'order_rejected',
        target_type: 'order',
        target_id: orderId,
        details: `Rejected Order #${orderId}. Reason: ${reason}`,
        created_at: nowStr
      },
      ...prev
    ]);
  };

  const adminApproveDeposit = (depositId: number, note?: string) => {
    const dep = deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'pending') return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setDeposits(prev => prev.map(d => d.id === depositId ? {
      ...d,
      status: 'paid',
      admin_note: note || 'Deposit verified and credited',
      decided_at: nowStr,
      decided_by: currentUser.id
    } : d));

    // Credit user's wallet
    setUsers(prev => prev.map(u => u.id === dep.user_id ? { ...u, wallet_balance_ugx: u.wallet_balance_ugx + dep.amount_ugx } : u));

    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: currentUser.id,
        admin_name: currentUser.name,
        action: 'deposit_approved',
        target_type: 'deposit',
        target_id: depositId,
        details: `Approved Deposit #${depositId} for ${dep.user_name} (+UGX ${dep.amount_ugx.toLocaleString()}).`,
        created_at: nowStr
      },
      ...prev
    ]);
  };

  const adminRejectDeposit = (depositId: number, reason: string) => {
    const dep = deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'pending') return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setDeposits(prev => prev.map(d => d.id === depositId ? {
      ...d,
      status: 'rejected',
      admin_note: reason || 'Payment transaction could not be located',
      decided_at: nowStr,
      decided_by: currentUser.id
    } : d));

    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: currentUser.id,
        admin_name: currentUser.name,
        action: 'deposit_rejected',
        target_type: 'deposit',
        target_id: depositId,
        details: `Rejected Deposit #${depositId} for ${dep.user_name}. Reason: ${reason}`,
        created_at: nowStr
      },
      ...prev
    ]);
  };

  const adminPayWithdrawal = (withdrawalId: number, txId: string, note?: string) => {
    const w = withdrawals.find(item => item.id === withdrawalId);
    if (!w || w.status !== 'pending') return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setWithdrawals(prev => prev.map(item => item.id === withdrawalId ? {
      ...item,
      status: 'paid',
      payout_tx_id: txId || `MOMO-PAY-${Date.now()}`,
      admin_note: note || 'Dispatched via Mobile Money bulk disbursement',
      decided_at: nowStr,
      decided_by: currentUser.id
    } : item));

    // Ledger deduction entry
    const newLedger: LedgerEntry = {
      id: ledger.length + 1,
      user_id: w.user_id,
      amount_ugx: -w.amount_ugx,
      reason: 'withdrawal_payout',
      related_withdrawal_id: withdrawalId,
      note: `Payout sent to ${w.momo_network} (${w.payout_phone}) - TX: ${txId}`,
      created_at: nowStr
    };
    setLedger(prev => [newLedger, ...prev]);

    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: currentUser.id,
        admin_name: currentUser.name,
        action: 'withdrawal_paid',
        target_type: 'withdrawal',
        target_id: withdrawalId,
        details: `Paid out UGX ${w.amount_ugx.toLocaleString()} to ${w.user_name} (${w.payout_phone}) - TxID: ${txId}.`,
        created_at: nowStr
      },
      ...prev
    ]);
  };

  const adminRejectWithdrawal = (withdrawalId: number, reason: string) => {
    const w = withdrawals.find(item => item.id === withdrawalId);
    if (!w || w.status !== 'pending') return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setWithdrawals(prev => prev.map(item => item.id === withdrawalId ? {
      ...item,
      status: 'rejected',
      admin_note: reason || 'Mismatched Mobile Money account name',
      decided_at: nowStr,
      decided_by: currentUser.id
    } : item));

    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: currentUser.id,
        admin_name: currentUser.name,
        action: 'withdrawal_rejected',
        target_type: 'withdrawal',
        target_id: withdrawalId,
        details: `Rejected Withdrawal #${withdrawalId} for ${w.user_name}. Reason: ${reason}`,
        created_at: nowStr
      },
      ...prev
    ]);
  };

  const adminUpdateSettings = (newSettings: Partial<PaymentSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setAuditLogs(prev => [
      {
        id: prev.length + 1,
        admin_id: currentUser.id,
        admin_name: currentUser.name,
        action: 'settings_updated',
        target_type: 'settings',
        details: `Updated system payment settings & merchant numbers.`,
        created_at: nowStr
      },
      ...prev
    ]);
  };

  const adminAddProduct = (productData: Omit<Product, 'id' | 'created_at'>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newId = products.length + 1;
    const newProd: Product = {
      ...productData,
      id: newId,
      created_at: nowStr
    };
    setProducts(prev => [...prev, newProd]);
  };

  const adminUpdateProduct = (productId: number, data: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
  };

  const adminDeleteProduct = (productId: number) => {
    if (licenses.some(license => license.product_id === productId)) {
      return { success: false, message: 'This bot has existing licenses and cannot be deleted. Set its availability to 0 instead.' };
    }
    setProducts(prev => prev.filter(product => product.id !== productId));
    return { success: true, message: 'Bot deleted.' };
  };

  const toggleLicenseStatus = (licenseId: number) => {
    setLicenses(prev => prev.map(l => l.id === licenseId ? {
      ...l,
      status: l.status === 'active' ? 'paused' : 'active',
      last_active: 'Just now'
    } : l));
  };

  const updateLicenseConfig = (licenseId: number, config: License['config']) => {
    setLicenses(prev => prev.map(l => l.id === licenseId ? {
      ...l,
      config
    } : l));
  };

  const registerOrLoginUser = (name: string, phone: string, refCode?: string, tradePassword?: string) => {
    // This legacy helper is intentionally disabled. Authentication now always
    // goes through the server-side registerUser/loginUser functions above.
    return { success: false, message: 'Demo profile switching is no longer available.' };

    // Normalise phone number to +256 format
    let cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+256' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('256')) {
      cleanPhone = '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+256' + cleanPhone;
    }

    const existing = users.find(u => u.phone === cleanPhone);
    if (existing) {
      setCurrentUser(existing);
      return { success: true, user: existing, message: `Welcome back, ${existing.name}!` };
    }

    // Check referral
    let referrerId: number | null = null;
    if (refCode) {
      const referrer = users.find(u => u.referral_code?.toLowerCase() === refCode.trim().toLowerCase());
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const newId = users.length + 1;
    const generatedRef = name.trim().split(' ')[0].toUpperCase() + Math.floor(100 + Math.random() * 900);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const network: 'MTN Mobile Money' | 'Airtel Money' = 
      (cleanPhone.includes('77') || cleanPhone.includes('78') || cleanPhone.includes('76')) 
        ? 'MTN Mobile Money' 
        : 'Airtel Money';

    const newUser: User = {
      id: newId,
      name: name.trim(),
      phone: cleanPhone,
      payout_phone: cleanPhone,
      payout_name: name.trim(),
      payout_network: network,
      referral_code: generatedRef,
      referred_by_id: referrerId,
      is_admin: false,
      wallet_balance_ugx: 0,
      created_at: nowStr,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      trade_password: tradePassword
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);

    return { success: true, user: newUser, message: `Account created successfully! Your referral code is ${generatedRef}.` };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        products,
        orders,
        deposits,
        licenses,
        ledger,
        withdrawals,
        settings,
        auditLogs,
        fraudFlags,
        signals,
        activeTab,
        beginnerMode,
        searchQuery,
        checkoutModal,
        dailyYieldHistory,
        nextMidnightSeconds,
        countdownFormatted,
        todayBotEarningsUgx,
        totalActiveBotsCount,
        triggerMidnightYield,
        setActiveTab,
        setBeginnerMode,
        setSearchQuery,
        switchUser,
        openCheckout,
        closeCheckout,
        createOrder,
        createDeposit,
        initiateMarzPayTopUp,
        checkMarzPayStatus,
        completeMarzPayDeposit,
        updatePayoutAccount,
        requestWithdrawal,
        adminApproveOrder,
        adminRejectOrder,
        adminApproveDeposit,
        adminRejectDeposit,
        adminPayWithdrawal,
        adminRejectWithdrawal,
        adminUpdateSettings,
        adminAddProduct,
        adminUpdateProduct,
        adminDeleteProduct,
        toggleLicenseStatus,
        updateLicenseConfig,
        getReferralBalance,
        getReferralStats,
        registerUser,
        loginUser,
        restoreAuthenticatedUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
