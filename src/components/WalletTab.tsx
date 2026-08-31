import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { EarningsHistorySection } from './EarningsHistorySection';
import { 
  WalletCards, 
  PlusCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  Info, 
  Clock, 
  CheckCircle2, 
  Smartphone,
  Copy,
  Check,
  X,
  Zap,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WalletTab: React.FC = () => {
  const { 
    currentUser, 
    deposits, 
    orders, 
    ledger,
    createDeposit, 
    initiateMarzPayTopUp,
    checkMarzPayStatus,
    completeMarzPayDeposit,
    simulateMarzPayConfirm,
    settings, 
    beginnerMode,
    setActiveTab
  } = useApp();

  const [walletSubTab, setWalletSubTab] = useState<'deposits' | 'earnings'>('deposits');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('50000');
  const [depositMethod, setDepositMethod] = useState<'marzpay' | 'mtn_momo' | 'airtel_money'>('marzpay');
  const [depositPhone, setDepositPhone] = useState<string>(currentUser?.phone || '+256700000000');
  const [depositRef, setDepositRef] = useState<string>('');
  const [copiedMerchant, setCopiedMerchant] = useState(false);
  
  // MarzPay Prompt & Verification State
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [marzPayActiveTx, setMarzPayActiveTx] = useState<{
    uuid: string;
    reference: string;
    amount: number;
    phone: string;
    network?: string;
  } | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'waiting_pin' | 'verifying' | 'success' | 'failed' | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update phone if currentUser changes
  useEffect(() => {
    if (currentUser?.phone) {
      setDepositPhone(currentUser.phone);
    }
  }, [currentUser?.phone]);

  const userDeposits = deposits.filter(d => d.user_id === currentUser?.id);
  const userWalletOrders = orders.filter(o => o.user_id === currentUser?.id && (o.wallet_applied_ugx ?? 0) > 0);

  const activeMerchantNumber = depositMethod === 'mtn_momo' ? (settings?.mtn_merchant_number || '') : (settings?.airtel_merchant_number || '');
  const activeMerchantName = depositMethod === 'mtn_momo' ? (settings?.mtn_merchant_name || '') : (settings?.airtel_merchant_name || '');

  const copyMerchant = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(activeMerchantNumber.replace(/\s+/g, ''));
    }
    setCopiedMerchant(true);
    setTimeout(() => setCopiedMerchant(false), 2000);
  };

  // Cleanup polling timer
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  // Poll MarzPay Status when active
  useEffect(() => {
    if (!marzPayActiveTx || pollingStatus === 'success' || pollingStatus === 'failed') {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await checkMarzPayStatus(marzPayActiveTx.uuid);
        if (res.success && res.status === 'paid') {
          setPollingStatus('success');
          completeMarzPayDeposit(marzPayActiveTx.amount, marzPayActiveTx.uuid, marzPayActiveTx.reference);
          setStatusMsg({
            type: 'success',
            message: `UGX ${marzPayActiveTx.amount.toLocaleString()} successfully credited via MarzPay!`
          });
          clearInterval(interval);
          setTimeout(() => {
            setShowTopUpModal(false);
            setMarzPayActiveTx(null);
            setPollingStatus(null);
            setStatusMsg(null);
          }, 2400);
        }
      } catch (err) {
        console.warn('Polling status error:', err);
      }
    }, 3000);

    pollingTimerRef.current = interval;

    return () => clearInterval(interval);
  }, [marzPayActiveTx, pollingStatus]);

  // Handle Manual Status Verification
  const handleManualCheck = async () => {
    if (!marzPayActiveTx) return;
    setPollingStatus('verifying');
    setStatusMsg({ type: 'info', message: 'Checking transaction status with MarzPay gateway...' });

    const res = await checkMarzPayStatus(marzPayActiveTx.uuid);
    if (res.success && res.status === 'paid') {
      setPollingStatus('success');
      completeMarzPayDeposit(marzPayActiveTx.amount, marzPayActiveTx.uuid, marzPayActiveTx.reference);
      setStatusMsg({
        type: 'success',
        message: `Payment Confirmed! UGX ${marzPayActiveTx.amount.toLocaleString()} credited to your wallet.`
      });
      setTimeout(() => {
        setShowTopUpModal(false);
        setMarzPayActiveTx(null);
        setPollingStatus(null);
        setStatusMsg(null);
      }, 2000);
    } else {
      setPollingStatus('waiting_pin');
      setStatusMsg({
        type: 'info',
        message: 'Awaiting PIN authorization on your phone. Please confirm the prompt on your mobile screen.'
      });
    }
  };

  // Instant simulation fallback (useful for testing or if prompt is approved offline)
  const handleSimulatePaymentApproval = async () => {
    if (!marzPayActiveTx) return;
    setPollingStatus('verifying');
    await simulateMarzPayConfirm(marzPayActiveTx.uuid);
    setPollingStatus('success');
    completeMarzPayDeposit(marzPayActiveTx.amount, marzPayActiveTx.uuid, marzPayActiveTx.reference, `MP-MOMO-${Date.now()}`);
    setStatusMsg({
      type: 'success',
      message: `Verified! UGX ${marzPayActiveTx.amount.toLocaleString()} added to your wallet balance!`
    });
    setTimeout(() => {
      setShowTopUpModal(false);
      setMarzPayActiveTx(null);
      setPollingStatus(null);
      setStatusMsg(null);
    }, 2000);
  };

  // Form Submission
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const amount = parseInt(depositAmount, 10);
    if (isNaN(amount) || amount < 5000) {
      setStatusMsg({ type: 'error', message: 'Minimum deposit amount is UGX 5,000.' });
      return;
    }

    if (depositMethod === 'marzpay') {
      if (!depositPhone.trim()) {
        setStatusMsg({ type: 'error', message: 'Please enter your Mobile Money phone number.' });
        return;
      }

      setIsPromptLoading(true);
      const res = await initiateMarzPayTopUp(amount, depositPhone.trim());
      setIsPromptLoading(false);

      if (res.success && res.transaction_uuid) {
        setMarzPayActiveTx({
          uuid: res.transaction_uuid,
          reference: res.reference || `TOPUP-${Date.now()}`,
          amount,
          phone: depositPhone,
          network: res.network
        });
        setPollingStatus('waiting_pin');
        setStatusMsg({
          type: 'info',
          message: res.message || 'MoMo PIN prompt sent to your phone! Please enter your PIN to authorize payment.'
        });
      } else {
        setStatusMsg({ 
          type: 'error', 
          message: res.message || 'Could not send Mobile Money prompt. Please check your phone number.' 
        });
      }
    } else {
      // Manual MoMo Reference verification
      if (!depositRef.trim()) {
        setStatusMsg({ type: 'error', message: 'Please enter the SMS transaction reference code.' });
        return;
      }

      const res = createDeposit(amount, depositMethod, depositRef);
      if (res.success) {
        setStatusMsg({ type: 'success', message: res.message });
        try {
          confetti({ particleCount: 50, spread: 45, origin: { y: 0.6 } });
        } catch {}
        setTimeout(() => {
          setShowTopUpModal(false);
          setStatusMsg(null);
          setDepositRef('');
        }, 2200);
      } else {
        setStatusMsg({ type: 'error', message: res.message });
      }
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Wallet Balance Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <WalletCards className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Prepaid Wallet Balance</span>
              <h1 className="font-heading font-extrabold text-xl text-emerald-800 font-mono">
                UGX {(currentUser?.wallet_balance_ugx ?? 0).toLocaleString()}
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              setMarzPayActiveTx(null);
              setPollingStatus(null);
              setStatusMsg(null);
              setShowTopUpModal(true);
            }}
            id="btn-topup-wallet"
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Top Up</span>
          </button>
        </div>

        {/* Quick MarzPay Banner */}
        <div className="mt-3 pt-3 border-t border-emerald-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Instant MoMo Top-Up powered by <strong>MarzPay</strong></span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
            0% Fees
          </span>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl bg-white border border-emerald-100 p-3.5 text-xs text-slate-600 flex items-start gap-2.5 shadow-xs">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          {beginnerMode ? (
            <span>Use your prepaid wallet to activate smart bots instantly without manually sending individual MoMo payments each time. Top up once, scan and upgrade anytime!</span>
          ) : (
            <span>Prepaid balance automatically applies at checkout. Supports instant USSD prompt via <strong>MarzPay</strong> (MTN MoMo & Airtel Money) or manual merchant code reference.</span>
          )}
        </p>
      </div>

      {/* Sub-Tab Switcher: Top-Up History vs Bot Daily Yields */}
      <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
        <button
          onClick={() => setWalletSubTab('deposits')}
          className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            walletSubTab === 'deposits'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Top-Up Deposits ({userDeposits.length})</span>
        </button>

        <button
          onClick={() => setWalletSubTab('earnings')}
          className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            walletSubTab === 'earnings'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bot Daily Yields ({ledger.filter(l => l.user_id === currentUser.id && l.reason === 'bot_daily_yield').length})</span>
        </button>
      </div>

      {walletSubTab === 'earnings' ? (
        <EarningsHistorySection onExploreStore={() => setActiveTab('store')} />
      ) : (
        /* Deposits History Section */
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Top-Up & Deposit History</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              {userDeposits.length} Records
            </span>
          </div>

          {userDeposits.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <Smartphone className="w-6 h-6 mx-auto text-slate-400 opacity-60 mb-1" />
              <p className="text-xs text-slate-700 font-medium">No deposit transactions yet.</p>
              <p className="text-[10px] text-slate-500">Click "Top Up" above to add UGX to your prepaid wallet balance.</p>
            </div>
          ) : (
            <div className="border border-emerald-100/90 rounded-xl overflow-hidden divide-y divide-emerald-100/70 shadow-2xs">
              {userDeposits.map((dep, idx) => {
                const isEven = idx % 2 === 1;
                return (
                  <div 
                    key={dep.id}
                    className={`p-3 transition-colors flex items-center justify-between text-xs text-slate-700 ${
                      isEven ? 'bg-emerald-50/60 hover:bg-emerald-100/40' : 'bg-white hover:bg-emerald-50/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-[#059669] text-sm">
                          +UGX {(dep.amount_ugx ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {dep.payment_method === 'marzpay' ? '⚡ MarzPay Auto' : dep.payment_method === 'mtn_momo' ? 'MTN MoMo' : 'Airtel Money'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 font-mono truncate max-w-[200px]">
                        Ref: {dep.payment_ref}
                      </div>
                      {dep.admin_note && (
                        <div className="text-[9px] text-slate-700 italic mt-0.5">
                          {dep.admin_note}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        dep.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : dep.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {dep.status}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-1">
                        {dep.created_at || 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white border border-emerald-100 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-slideUp max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-900">Top Up Prepaid Wallet</h3>
                  <p className="text-[11px] text-slate-500">Instant MTN & Airtel Mobile Money top-up</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTopUpModal(false);
                  setMarzPayActiveTx(null);
                  setPollingStatus(null);
                }} 
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MARZPAY LIVE PROMPT STATE */}
            {marzPayActiveTx && pollingStatus !== 'success' ? (
              <div className="space-y-4 py-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600 relative">
                  <Smartphone className="w-7 h-7 animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    MoMo PIN Prompt Sent!
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Please check the screen of <strong className="font-mono text-slate-900">{marzPayActiveTx.phone}</strong> and enter your Mobile Money PIN to approve:
                  </p>
                </div>

                {/* Amount Box */}
                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Amount to Authorize</span>
                  <span className="font-mono font-extrabold text-xl text-emerald-800">
                    UGX {marzPayActiveTx.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-mono mt-0.5">
                    Ref: {marzPayActiveTx.reference}
                  </span>
                </div>

                {/* Live Polling Status */}
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 bg-slate-50 py-2 px-3 rounded-lg border border-slate-200">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Waiting for PIN entry & telco approval...</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleManualCheck}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>I Have Entered My PIN (Check Status)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulatePaymentApproval}
                    className="w-full py-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant Auto-Verify (Sandbox / Direct Confirm)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMarzPayActiveTx(null);
                      setPollingStatus(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 py-1"
                  >
                    Cancel or change phone number
                  </button>
                </div>
              </div>
            ) : (
              /* FORM STATE */
              <form onSubmit={handleDepositSubmit} className="space-y-3.5 text-xs">
                {/* Method Selector */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Select Payment Gateway</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDepositMethod('marzpay')}
                      className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                        depositMethod === 'marzpay'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/30 font-extrabold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                        <span className="text-[11px] font-bold">MarzPay</span>
                      </div>
                      <span className="text-[9px] text-emerald-700 block font-semibold">Auto MoMo Push</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDepositMethod('mtn_momo')}
                      className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                        depositMethod === 'mtn_momo'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/30 font-extrabold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-[11px] font-bold block">MTN MoMo</span>
                      <span className="text-[9px] text-slate-500 block">Manual Ref</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDepositMethod('airtel_money')}
                      className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                        depositMethod === 'airtel_money'
                          ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-400/30 font-extrabold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-[11px] font-bold block">Airtel Money</span>
                      <span className="text-[9px] text-slate-500 block">Manual Ref</span>
                    </button>
                  </div>
                </div>

                {/* MarzPay Phone Input */}
                {depositMethod === 'marzpay' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-bold block">
                        Mobile Money Phone Number
                      </label>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        MTN or Airtel Uganda
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        value={depositPhone}
                        onChange={(e) => setDepositPhone(e.target.value)}
                        placeholder="e.g. 0771234567 or +256701234567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none pl-9"
                        required
                      />
                      <Smartphone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      A USSD payment prompt will pop up on this phone automatically.
                    </p>
                  </div>
                ) : (
                  /* Manual Merchant Info */
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Merchant Code:</span>
                      <button
                        type="button"
                        onClick={copyMerchant}
                        className="font-mono font-extrabold text-emerald-800 flex items-center gap-1 bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-2xs"
                      >
                        <span>{activeMerchantNumber}</span>
                        {copiedMerchant ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Merchant Name:</span>
                      <span className="font-bold text-slate-800">{activeMerchantName}</span>
                    </div>
                  </div>
                )}

                {/* Amount Section */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Deposit Amount (UGX)</label>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {['10000', '20000', '50000', '100000', '200000', '500000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          depositAmount === amt 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        UGX {parseInt(amt, 10).toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount (min 5,000)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                {/* Manual Reference Input for standard momo */}
                {depositMethod !== 'marzpay' && (
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      MoMo SMS Transaction ID / Reference
                    </label>
                    <input
                      type="text"
                      value={depositRef}
                      onChange={(e) => setDepositRef(e.target.value)}
                      placeholder="e.g. 19284712048 or MP240..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                )}

                {/* Status Message */}
                {statusMsg && (
                  <div className={`p-2.5 rounded-xl text-xs font-medium ${
                    statusMsg.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : statusMsg.type === 'info'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {statusMsg.message}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPromptLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  {isPromptLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending MoMo Prompt via MarzPay...</span>
                    </>
                  ) : depositMethod === 'marzpay' ? (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Send MoMo PIN Prompt (MarzPay)</span>
                    </>
                  ) : (
                    <span>Submit Deposit Reference</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
