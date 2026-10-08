import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Send, 
  QrCode, 
  ArrowDownCircle, 
  Coins, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Users,
  CheckCircle2,
  PhoneCall,
  X,
  Phone,
  User,
  Edit3,
  Smartphone,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ReferralsTab: React.FC = () => {
  const { 
    currentUser, 
    getReferralStats, 
    ledger, 
    withdrawals, 
    requestWithdrawal, 
    updatePayoutAccount,
    settings,
    beginnerMode 
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPayoutAccountModal, setShowPayoutAccountModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Withdrawal Form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'MTN Mobile Money' | 'Airtel Money'>('MTN Mobile Money');
  const [payoutPhone, setPayoutPhone] = useState(currentUser?.payout_phone || currentUser?.phone || '');
  const [payoutName, setPayoutName] = useState(currentUser?.payout_name || currentUser?.name || '');
  const [tradePassword, setTradePassword] = useState<string>('');
  const [withdrawStatus, setWithdrawStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Payout Account Edit Form state
  const [editPhone, setEditPhone] = useState(currentUser?.payout_phone || currentUser?.phone || '');
  const [editName, setEditName] = useState(currentUser?.payout_name || currentUser?.name || '');
  const [editNetwork, setEditNetwork] = useState<'MTN Mobile Money' | 'Airtel Money'>(currentUser?.payout_network || 'MTN Mobile Money');
  const [editStatus, setEditStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Keep fields synchronized when currentUser profile changes
  useEffect(() => {
    if (currentUser) {
      const initialPhone = currentUser.payout_phone || currentUser.phone || '';
      const initialName = currentUser.payout_name || currentUser.name || '';
      const initialNetwork = currentUser.payout_network || (initialPhone.includes('77') || initialPhone.includes('78') || initialPhone.includes('76') ? 'MTN Mobile Money' : 'Airtel Money');
      
      setPayoutPhone(initialPhone);
      setPayoutName(initialName);
      setWithdrawNetwork(initialNetwork);

      setEditPhone(initialPhone);
      setEditName(initialName);
      setEditNetwork(initialNetwork);
    }
  }, [currentUser]);

  // Auto-detect network when phone number is typed
  const detectNetworkFromPhone = (phoneStr: string): 'MTN Mobile Money' | 'Airtel Money' | null => {
    const cleaned = phoneStr.replace(/\D/g, '');
    // MTN prefixes in Uganda: 077, 078, 076, 25677, 25678, 25676
    if (cleaned.startsWith('077') || cleaned.startsWith('078') || cleaned.startsWith('076') ||
        cleaned.startsWith('25677') || cleaned.startsWith('25678') || cleaned.startsWith('25676') ||
        cleaned.startsWith('77') || cleaned.startsWith('78') || cleaned.startsWith('76')) {
      return 'MTN Mobile Money';
    }
    // Airtel prefixes in Uganda: 075, 070, 074, 25675, 25670, 25674
    if (cleaned.startsWith('075') || cleaned.startsWith('070') || cleaned.startsWith('074') ||
        cleaned.startsWith('25675') || cleaned.startsWith('25670') || cleaned.startsWith('25674') ||
        cleaned.startsWith('75') || cleaned.startsWith('70') || cleaned.startsWith('74')) {
      return 'Airtel Money';
    }
    return null;
  };

  const handlePayoutPhoneChange = (val: string) => {
    setPayoutPhone(val);
    const detected = detectNetworkFromPhone(val);
    if (detected) {
      setWithdrawNetwork(detected);
    }
  };

  const handleEditPhoneChange = (val: string) => {
    setEditPhone(val);
    const detected = detectNetworkFromPhone(val);
    if (detected) {
      setEditNetwork(detected);
    }
  };

  const stats = getReferralStats(currentUser?.id ?? 0);
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/r/${currentUser?.referral_code || 'VIP'}` : '';

  const userLedger = ledger.filter(l => l.user_id === currentUser?.id);
  const userWithdrawals = withdrawals.filter(w => w.user_id === currentUser?.id);

  const availableBalance = stats?.availableBalanceUgx ?? 0;
  const totalEarned = stats?.totalEarnedUgx ?? 0;
  const totalWithdrawn = stats?.withdrawnUgx ?? 0;
  const refereesCount = stats?.refereesCount ?? 0;
  const minWithdrawal = settings?.min_withdrawal_ugx ?? 0;

  const copyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(referralLink);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = () => {
    if (navigator?.clipboard && currentUser?.referral_code) {
      navigator.clipboard.writeText(currentUser.referral_code);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Check out Daily Earner's smart trading & arbitrage bots. They scan cross-exchange spreads in Uganda (USDT/UGX) with instant Mobile Money setup.\n\nUse my link to get instant bot access:\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSavePayoutAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setEditStatus(null);
    if (!editPhone.trim()) {
      setEditStatus({ type: 'error', message: 'Payout account phone number is required.' });
      return;
    }
    if (!editName.trim() || editName.trim().length < 2) {
      setEditStatus({ type: 'error', message: 'Registered SIM account name is required.' });
      return;
    }

    const res = updatePayoutAccount(editPhone, editName, editNetwork);
    if (res.success) {
      setEditStatus({ type: 'success', message: res.message });
      setPayoutPhone(editPhone.trim());
      setPayoutName(editName.trim());
      setWithdrawNetwork(editNetwork);
      setTimeout(() => {
        setShowPayoutAccountModal(false);
        setEditStatus(null);
      }, 1500);
    } else {
      setEditStatus({ type: 'error', message: res.message });
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawStatus(null);
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawStatus({ type: 'error', message: 'Please enter a valid amount in UGX.' });
      return;
    }
    if (!payoutPhone.trim()) {
      setWithdrawStatus({ type: 'error', message: 'Payout account phone number is required.' });
      return;
    }
    if (!payoutName.trim() || payoutName.trim().length < 2) {
      setWithdrawStatus({ type: 'error', message: 'Registered SIM account name is required for payout.' });
      return;
    }
    if (!tradePassword.trim()) {
      setWithdrawStatus({ type: 'error', message: 'Trade password is required for withdrawal security.' });
      return;
    }

    const res = await requestWithdrawal(amount, withdrawNetwork, payoutPhone, payoutName, tradePassword);
    if (res.success) {
      setWithdrawStatus({ type: 'success', message: res.message });
      setWithdrawAmount('');
      setTradePassword('');
      try {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
      } catch {}
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawStatus(null);
      }, 2500);
    } else {
      setWithdrawStatus({ type: 'error', message: res.message });
    }
  };

  const hasConfiguredPayoutAccount = Boolean(currentUser?.payout_phone && currentUser?.payout_name);

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Referral Program Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-200 p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[10px] font-extrabold text-emerald-800">
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
            <span>TRANSPARENT 10% CASH REWARDS</span>
          </div>
          <DailyEarnerLogo className="w-6 h-6 text-emerald-600" />
        </div>

        <h1 className="font-heading font-extrabold text-lg text-slate-900 mt-2">
          Refer Friends, Earn 10% Commission
        </h1>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {beginnerMode ? (
            <span>Share your personal link. Whenever someone buys a bot license, you get <strong>10% cash in your wallet</strong> instantly. Direct 1-level commission only — no hidden cuts!</span>
          ) : (
            <span>Single-tier direct referral model. Receive instant 10% commission on every lifetime license purchased by your referees. Cash out via MTN or Airtel MoMo.</span>
          )}
        </p>

        {/* Balance & Cashout Trigger */}
        <div className="mt-4 p-3.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Available Payout</span>
            <div className="font-heading font-extrabold text-xl text-emerald-700 font-mono">
              UGX {availableBalance.toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => {
              setWithdrawStatus(null);
              setPayoutPhone(currentUser?.payout_phone || currentUser?.phone || '');
              setPayoutName(currentUser?.payout_name || currentUser?.name || '');
              setShowWithdrawModal(true);
            }}
            id="btn-open-withdraw"
            disabled={availableBalance < minWithdrawal}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
              availableBalance >= minWithdrawal
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Withdraw MoMo</span>
          </button>
        </div>

        {availableBalance < minWithdrawal && (
          <p className="text-[10px] text-slate-500 mt-1.5 text-right">
            Min cashout: UGX {minWithdrawal.toLocaleString()}
          </p>
        )}
      </div>

      {/* Payout Account Configuration Card */}
      <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xs text-slate-900 uppercase tracking-wider">
                Payout Account Details
              </h2>
              <p className="text-[10px] text-slate-500">Destination Mobile Money for cashout & earnings</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditPhone(currentUser?.payout_phone || currentUser?.phone || '');
              setEditName(currentUser?.payout_name || currentUser?.name || '');
              setEditNetwork(currentUser?.payout_network || 'MTN Mobile Money');
              setEditStatus(null);
              setShowPayoutAccountModal(true);
            }}
            id="btn-configure-payout-account"
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{hasConfiguredPayoutAccount ? 'Edit Account' : 'Set Payout Account'}</span>
          </button>
        </div>

        {/* Account Info Details Box */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Payout Account (Phone):
            </span>
            <span className="font-mono font-bold text-slate-900 text-xs">
              {currentUser?.payout_phone || currentUser?.phone || 'Not Set'}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Registered SIM Account Name:
            </span>
            <span className="font-bold text-slate-900 text-xs">
              {currentUser?.payout_name || currentUser?.name || 'Not Set'}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
            <span className="text-slate-500 text-[11px] font-medium">Telecom Network:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              {currentUser?.payout_network || (currentUser?.phone?.includes('77') || currentUser?.phone?.includes('78') ? 'MTN Mobile Money' : 'Airtel Money')}
            </span>
          </div>
        </div>

        {!hasConfiguredPayoutAccount && (
          <div className="flex items-start gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Set your registered MoMo phone number and SIM holder names so your cashouts can be approved instantly.</span>
          </div>
        )}
      </div>

      {/* Referral Link & WhatsApp Share Hub */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
        <span className="text-xs font-bold text-slate-900 block">Your Exclusive Referral Link</span>
        
        {/* Link Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 truncate select-all">
            {referralLink}
          </div>
          <button
            onClick={copyLink}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 shrink-0 transition-colors"
            title="Copy Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 shrink-0 transition-colors"
            title="Show QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp 1-Click Action */}
        <button
          onClick={shareViaWhatsApp}
          id="btn-whatsapp-share"
          className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Directly on WhatsApp</span>
        </button>

        {/* Referral Code Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">Your Referral Code:</span>
          <button 
            onClick={copyCode}
            className="font-mono font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-emerald-100"
          >
            <span>{currentUser?.referral_code || '---'}</span>
            {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Referral Statistics Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-emerald-100 rounded-2xl p-3 text-center shadow-xs">
          <span className="text-[10px] text-slate-500 block font-medium">Invited</span>
          <span className="font-heading font-extrabold text-lg text-slate-900 block font-mono mt-0.5">
            {refereesCount}
          </span>
          <span className="text-[9px] text-slate-400">friends</span>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-3 text-center shadow-xs">
          <span className="text-[10px] text-slate-500 block font-medium">Total Earned</span>
          <span className="font-heading font-extrabold text-lg text-emerald-700 block font-mono mt-0.5">
            {totalEarned.toLocaleString()}
          </span>
          <span className="text-[9px] text-emerald-600 font-bold">10% cash</span>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-3 text-center shadow-xs">
          <span className="text-[10px] text-slate-500 block font-medium">Paid Out</span>
          <span className="font-heading font-extrabold text-lg text-slate-800 block font-mono mt-0.5">
            {totalWithdrawn.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-400">UGX sent</span>
        </div>
      </div>

      {/* Transparent Ledger History */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-xs text-slate-900 uppercase tracking-wider">
            Commission Ledger ({userLedger.length})
          </h3>
          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Real-Time Accounting
          </span>
        </div>

        {userLedger.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            No commission entries yet. Share your referral link above to earn your first 10% reward!
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {userLedger.map((entry) => (
              <div 
                key={entry.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 leading-snug">
                    {entry.note || (entry.reason === 'referral_commission' ? 'Referral Commission' : 'Withdrawal Payout')}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {entry.created_at || 'Recently recorded'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-extrabold text-xs block ${
                    entry.amount_ugx >= 0 ? 'text-emerald-700' : 'text-slate-700'
                  }`}>
                    {entry.amount_ugx >= 0 ? '+' : ''}UGX {(entry.amount_ugx ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">
                    {entry.reason.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Requests History */}
      {userWithdrawals.length > 0 && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-heading font-bold text-xs text-slate-900 uppercase tracking-wider">
            MoMo Cashout Requests
          </h3>
          <div className="space-y-2">
            {userWithdrawals.map((w) => (
              <div 
                key={w.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    UGX {(w.amount_ugx ?? 0).toLocaleString()} ({w.momo_network})
                  </div>
                  <div className="text-[10px] text-slate-500">
                    To: {w.payout_phone} • {w.payout_name ? `(${w.payout_name}) • ` : ''}{w.created_at || 'Pending'}
                  </div>
                  {w.admin_note && (
                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                      Note: {w.admin_note}
                    </div>
                  )}
                  {w.payout_tx_id && (
                    <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                      TxID: {w.payout_tx_id}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  w.status === 'paid' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : w.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Set / Edit Payout Account Modal */}
      {showPayoutAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white border border-emerald-100 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-900">Set Payout Account Details</h3>
                  <p className="text-[11px] text-slate-500">Configure your registered Mobile Money recipient</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowPayoutAccountModal(false);
                  setEditStatus(null);
                }} 
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayoutAccount} className="space-y-3.5 text-xs">
              {/* Network Selector */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Mobile Money Network</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['MTN Mobile Money', 'Airtel Money'] as const).map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setEditNetwork(net)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        editNetwork === net 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout Phone Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold block">
                    Payout Account Number (Phone Number) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Uganda MoMo</span>
                </div>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => handleEditPhoneChange(e.target.value)}
                  placeholder="e.g. 0772123456 or +256701234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter the phone number registered to your Mobile Money wallet.
                </p>
              </div>

              {/* Registered SIM Names */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold block">
                    Names Registered in Account (SIM Holder) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Exact ID match</span>
                </div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Mukula David (Full Name on SIM)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Must match the name registered on the National ID / Telecom record for this SIM number.
                </p>
              </div>

              {/* Informational security banner */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2 text-[11px] text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-tight">
                  All automated daily yields and referral payouts will be disbursed directly to this registered number and name.
                </p>
              </div>

              {editStatus && (
                <div className={`p-2.5 rounded-xl text-xs font-medium ${
                  editStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {editStatus.message}
                </div>
              )}

              <button
                type="submit"
                id="btn-save-payout-account-submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                Save Payout Account Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Payout / Withdrawal Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white border border-emerald-100 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-900">Request Cashout Payout</h3>
                  <p className="text-[11px] text-slate-500">Disbursed to your registered MoMo line</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawStatus(null);
                }} 
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3 text-xs">
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <span className="text-base leading-none">⏰</span>
                <p className="text-[11px] leading-relaxed"><strong>Withdrawal hours:</strong> Requests are accepted daily from <strong>5:00 AM to 5:00 PM</strong> East Africa Time (EAT).</p>
              </div>
              {/* Amount to Withdraw */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold block">
                    Amount to Cash Out (UGX) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold font-mono">
                    Avail: UGX {availableBalance.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Min UGX ${minWithdrawal.toLocaleString()}`}
                  max={availableBalance}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[
                    { label: 'Min', val: minWithdrawal },
                    { label: '50%', val: Math.floor(availableBalance * 0.5) },
                    { label: 'Max / All', val: availableBalance }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setWithdrawAmount(preset.val.toString())}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      {preset.label} ({preset.val.toLocaleString()})
                    </button>
                  ))}
                </div>
              </div>

              {/* MoMo Network Selector */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Mobile Money Network</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['MTN Mobile Money', 'Airtel Money'] as const).map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setWithdrawNetwork(net)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        withdrawNetwork === net 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient MoMo Phone Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold block">
                    Payout Account Number (Phone Number) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">MoMo Phone</span>
                </div>
                <input
                  type="tel"
                  value={payoutPhone}
                  onChange={(e) => handlePayoutPhoneChange(e.target.value)}
                  placeholder="e.g. 0772123456 or +256701234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              {/* Registered SIM Account Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold block">
                    Names Registered in Account (SIM Holder) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Exact SIM Name</span>
                </div>
                <input
                  type="text"
                  value={payoutName}
                  onChange={(e) => setPayoutName(e.target.value)}
                  placeholder="Full name registered on SIM (e.g. Mukula David)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Funds will be credited to this name & phone. Payout details will be remembered for future cashouts.
                </p>
              </div>

              {/* Trade Password Security Confirmation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold block flex items-center gap-1">
                    🔐 Trade Password (6 digits) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Security</span>
                </div>
                <input
                  type="password"
                  value={tradePassword}
                  onChange={(e) => setTradePassword(e.target.value.slice(0, 6))}
                  placeholder="Enter your 6-digit trade password"
                  maxLength={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Confirm with your trade password set during registration for security.
                </p>
              </div>

              {/* Verification Summary Card */}
              {payoutPhone && payoutName && withdrawAmount && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-emerald-200/80 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Amount Requested:</span>
                    <strong className="text-slate-900 font-mono">UGX {parseInt(withdrawAmount, 10).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Withdrawal Fee (15%):</span>
                    <strong className="text-rose-700 font-mono">UGX {Math.round(parseInt(withdrawAmount, 10) * 0.15).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700 border-t border-emerald-200 pt-1">
                    <span>Net Amount to Receive:</span>
                    <strong className="text-emerald-800 font-mono">{Math.round(parseInt(withdrawAmount, 10) * 0.85).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Disbursement Target:</span>
                    <strong className="text-slate-900 font-mono">{payoutPhone}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Registered Name:</span>
                    <strong className="text-slate-900">{payoutName}</strong>
                  </div>
                </div>
              )}

              {withdrawStatus && (
                <div className={`p-2.5 rounded-xl text-xs font-medium ${
                  withdrawStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {withdrawStatus.message}
                </div>
              )}

              <button
                type="submit"
                id="btn-submit-cashout"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                Submit Payout Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-emerald-100 rounded-2xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-900">Your Referral QR Code</span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 inline-block">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}`} 
                alt="Referral QR Code"
                className="w-44 h-44 mx-auto rounded-lg"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Ask your friends to scan this with their phone camera to open your referral link.
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
