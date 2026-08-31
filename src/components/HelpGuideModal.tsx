import React from 'react';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { 
  X, 
  HelpCircle, 
  Bot, 
  DollarSign, 
  ShieldCheck, 
  CreditCard, 
  Share2, 
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';

export const HelpGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-emerald-100 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DailyEarnerLogo className="w-6 h-6 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">How Daily Earner Works</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          {/* Step 1 */}
          <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
              <span>Explore & Buy Bot Licenses</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Browse high-accuracy Crypto Arbitrage, Forex Trend, and Sports Value bots. Pay with MTN MoMo, Airtel Money, or your Prepaid Wallet. You own the license outright.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
              <span>Receive Real-Time Signals & Trade</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Active bots monitor cross-exchange price gaps 24/7. Signals stream directly to your My Bots dashboard and connected Telegram channel with clear buy/sell margins.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
              <span>Share & Earn 10% Cash Commission</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Share your link via WhatsApp or SMS. Whenever someone buys any bot using your link, you instantly earn a 10% commission credited to your ledger in cash.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">4</span>
              <span>Withdraw Instantly to Mobile Money</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Request withdrawal anytime. No fees, no hidden deduction cuts, and no minimum tiers required.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
        >
          Got It, Let's Start!
        </button>
      </div>
    </div>
  );
};
