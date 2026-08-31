import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { 
  X, 
  ShoppingBag, 
  Smartphone, 
  Copy, 
  Check, 
  Wallet, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Sparkles,
  Zap,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CheckoutModal: React.FC = () => {
  const { 
    checkoutModal, 
    closeCheckout, 
    currentUser, 
    licenses, 
    settings, 
    createOrder,
    initiateMarzPayTopUp,
    beginnerMode 
  } = useApp();

  const { isOpen, product, tier, kind = 'purchase' } = checkoutModal;

  const [paymentMethod, setPaymentMethod] = useState<'marzpay' | 'mtn_momo' | 'airtel_money' | 'wallet_only'>('marzpay');
  const [applyWallet, setApplyWallet] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState(currentUser?.phone || '+256700000000');
  const [paymentRef, setPaymentRef] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatusMsg(null);
      setPaymentRef('');
      setPaymentPhone(currentUser?.phone || '+256700000000');
      setApplyWallet((currentUser?.wallet_balance_ugx ?? 0) > 0);
    }
  }, [isOpen, currentUser?.wallet_balance_ugx, currentUser?.phone]);

  if (!isOpen || !product || !tier) return null;

  // Calculate prices
  const basePrice = tier?.price_ugx ?? 0;
  const isUpgrade = kind === 'upgrade';
  
  // Find current license tier for price difference calculation
  const existingLicense = licenses.find(l => l.user_id === currentUser?.id && l.product_id === product.id);
  const currentTier = existingLicense ? product.tiers.find(t => t.id === existingLicense.tier_id) : null;
  const currentPaid = isUpgrade && currentTier ? (currentTier.price_ugx ?? 0) : 0;
  const netDuePrice = isUpgrade ? Math.max(0, basePrice - currentPaid) : basePrice;

  // Wallet deduction calculation
  const userWalletBal = currentUser?.wallet_balance_ugx ?? 0;
  const walletAppliedAmount = applyWallet ? Math.min(userWalletBal, netDuePrice) : 0;
  const finalCashRequired = Math.max(0, netDuePrice - walletAppliedAmount);

  // Check if wallet only is possible
  const canPayWithWalletOnly = userWalletBal >= netDuePrice;

  // Active Merchant Info
  const activeMerchantNumber = paymentMethod === 'mtn_momo' ? (settings?.mtn_merchant_number || '') : (settings?.airtel_merchant_number || '');
  const activeMerchantName = paymentMethod === 'mtn_momo' ? (settings?.mtn_merchant_name || '') : (settings?.airtel_merchant_name || '');
  const activeUssdCode = paymentMethod === 'mtn_momo' ? '*165*3#' : '*185*9#';

  const copyText = (txt: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(txt.replace(/\s+/g, ''));
    }
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSubmitting(true);

    const actualMethod = (applyWallet && finalCashRequired === 0) ? 'wallet_only' : paymentMethod;

    if (actualMethod === 'marzpay' && finalCashRequired > 0) {
      if (!paymentPhone.trim()) {
        setStatusMsg({ type: 'error', message: 'Please enter your Mobile Money phone number.' });
        setIsSubmitting(false);
        return;
      }

      setStatusMsg({ type: 'info', message: 'Sending instant MoMo prompt via MarzPay...' });
      const promptRes = await initiateMarzPayTopUp(finalCashRequired, paymentPhone.trim());

      const orderRef = promptRes.transaction_uuid || `MP-ORDER-${Date.now()}`;
      const res = createOrder({
        productId: product.id,
        tierId: tier.id,
        kind,
        paymentMethod: 'marzpay',
        paymentRef: orderRef,
        applyWallet
      });

      setIsSubmitting(false);

      if (res.success) {
        setStatusMsg({ 
          type: 'success', 
          message: `MoMo Prompt sent to ${paymentPhone}! License activated successfully.` 
        });
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch {}
        setTimeout(() => {
          closeCheckout();
        }, 2200);
      } else {
        setStatusMsg({ type: 'error', message: res.message || 'Failed to place order.' });
      }
      return;
    }

    if (actualMethod !== 'wallet_only' && actualMethod !== 'marzpay' && !paymentRef.trim()) {
      setStatusMsg({ type: 'error', message: 'Please enter the Mobile Money transaction reference from your SMS.' });
      setIsSubmitting(false);
      return;
    }

    const res = createOrder({
      productId: product.id,
      tierId: tier.id,
      kind,
      paymentMethod: actualMethod,
      paymentRef: paymentRef.trim(),
      applyWallet
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatusMsg({ type: 'success', message: res.message });
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        closeCheckout();
      }, 2400);
    } else {
      setStatusMsg({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white border border-emerald-100 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-sm text-slate-900">
                {isUpgrade ? 'Upgrade Bot License' : 'Activate Bot License'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Instant lifetime activation & referral tracking
              </p>
            </div>
          </div>
          <button
            onClick={closeCheckout}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product & Plan Summary Box */}
        <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2 text-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                {product.category}
              </span>
              <h3 className="font-heading font-extrabold text-sm text-slate-900 mt-1">
                {product.name}
              </h3>
              <p className="text-[11px] text-slate-500">{tier.name} Plan • {tier.capacity_note}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block">Tier Price</span>
              <span className="font-extrabold text-sm text-emerald-800">
                UGX {(basePrice ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {isUpgrade && currentTier && (
            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Credit from {currentTier.name} Plan:</span>
              <span className="font-mono text-slate-700 font-bold">-UGX {(currentPaid ?? 0).toLocaleString()}</span>
            </div>
          )}

          <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Net Plan Cost:</span>
            <span className="font-mono text-emerald-800 text-sm">UGX {(netDuePrice ?? 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Prepaid Wallet Balance Deduction Toggle */}
        {userWalletBal > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-800 text-[11px]">
                  Use Prepaid Wallet Balance
                </div>
                <div className="text-[10px] text-slate-500">
                  Available: UGX {(userWalletBal ?? 0).toLocaleString()} 
                  {applyWallet && walletAppliedAmount > 0 && (
                    <span className="text-emerald-700 font-bold ml-1">
                      (Deducting UGX {walletAppliedAmount.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={applyWallet}
              onChange={(e) => setApplyWallet(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Payment Methods */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {finalCashRequired > 0 ? (
            <>
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Select Mobile Money Payment Gateway
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('marzpay')}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      paymentMethod === 'marzpay'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-extrabold ring-1 ring-emerald-500 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                      <span className="text-[11px]">MarzPay</span>
                    </div>
                    <span className="text-[9px] text-emerald-700 font-bold">Auto MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mtn_momo')}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      paymentMethod === 'mtn_momo'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold ring-1 ring-amber-400 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px]">MTN MoMo</span>
                    <span className="text-[9px] text-slate-400">*165*3#</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('airtel_money')}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      paymentMethod === 'airtel_money'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 font-extrabold ring-1 ring-rose-400 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px]">Airtel Money</span>
                    <span className="text-[9px] text-slate-400">*185*9#</span>
                  </button>
                </div>
              </div>

              {/* MarzPay Auto Prompt Phone Field */}
              {paymentMethod === 'marzpay' ? (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800">
                      Mobile Money Number for Prompt:
                    </label>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-white border border-emerald-200 px-1.5 py-0.2 rounded">
                      MTN & Airtel
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="e.g. 0771234567 or +256701234567"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none pl-9 text-xs"
                      required
                    />
                    <Smartphone className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    A USSD prompt will be sent automatically to this phone via MarzPay gateway.
                  </p>
                </div>
              ) : (
                /* Instructions Box for Direct Manual MoMo */
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] text-slate-700 leading-snug">
                    Dial <strong className="text-slate-900 font-mono">{activeUssdCode}</strong> and pay exactly <strong className="text-emerald-700 font-mono">UGX {(finalCashRequired ?? 0).toLocaleString()}</strong> to merchant:
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Merchant Code:</span>
                      <span className="font-mono font-extrabold text-xs text-slate-900">{activeMerchantNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(activeMerchantNumber, 'merchant')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-[10px] flex items-center gap-1"
                    >
                      {copiedCode === 'merchant' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                    <span>Account Name:</span>
                    <span className="font-bold text-slate-800">{activeMerchantName}</span>
                  </div>
                </div>
              )}

              {/* Reference Input for Manual MoMo */}
              {paymentMethod !== 'marzpay' && (
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Enter MoMo SMS Transaction ID / Reference
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. 1928471928 or MP240..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full amount covered by your prepaid wallet balance! Click below for 1-tap instant activation.</span>
            </div>
          )}

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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : paymentMethod === 'marzpay' && finalCashRequired > 0 ? (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Authorize UGX {(finalCashRequired ?? 0).toLocaleString()} via MarzPay</span>
              </>
            ) : (
              <>
                <span>
                  {finalCashRequired === 0 
                    ? 'Activate License Instantly with Wallet' 
                    : `Complete Order (UGX ${(finalCashRequired ?? 0).toLocaleString()})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
