import React, { useState } from 'react';
import { Product, ProductTier } from '../types';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Cpu, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Activity,
  Layers,
  Terminal,
  Gift,
  Clock,
  Coins,
  Flame,
  CheckCircle2
} from 'lucide-react';

export const BotDetailModal: React.FC<{
  product: Product | null;
  onClose: () => void;
}> = ({ product, onClose }) => {
  const { openCheckout, settings, countdownFormatted } = useApp();
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);

  if (!product) return null;

  const currentTier = product.tiers.find(t => t.id === (selectedTierId || product.tiers[0].id)) || product.tiers[0];
  const dailyEarning = currentTier.daily_earning_ugx || product.daily_earning_ugx || 5000;
  const stockAvailable = product.stock_available ?? 14;
  const totalStock = product.total_stock ?? 20;
  const isSoldOut = stockAvailable <= 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-slideUp">
        {/* Header with Close */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              {product.series_name || 'ANTMINER T SERIES'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="font-heading font-black text-xl text-slate-900 leading-tight">
                {product.model_code || product.name}
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                LIFETIME LICENSE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Machine Rig Image with Stock badge */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
          <img 
            referrerPolicy="no-referrer"
            src={product.image_url || `https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&auto=format&fit=crop&q=80`} 
            alt={product.name}
            className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          {/* Stock Available Badge */}
          <div className="absolute top-3 right-3 bg-[#10b981] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md">
            {stockAvailable}/{totalStock} available
          </div>
          {/* Category Chip */}
          <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700/60">
            {product.category}
          </div>
        </div>

        {/* Key Metrics Banner: Daily Yield & Midnight Engine */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Daily Automatic Earnings:
              </span>
              <span className="font-mono font-black text-xl text-[#059669]">
                UGX {dailyEarning.toLocaleString()}<span className="text-xs text-slate-500 font-normal"> / day</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Next Midnight Payout:
              </span>
              <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                {countdownFormatted}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-900 font-medium mt-2 pt-2 border-t border-emerald-200/60 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Money earned is automatically added to your wallet daily at 12:00 AM Midnight.</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
          {product.description}
        </p>

        {/* Tier Plans Breakdown */}
        <div className="space-y-2.5">
          <h3 className="font-heading font-bold text-xs text-slate-800 uppercase tracking-wider">
            Choose License Plan:
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {product.tiers.map(tier => {
              const isSelected = tier.id === currentTier.id;
              const tierYield = tier.daily_earning_ugx || product.daily_earning_ugx || 5000;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{tier.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="font-mono font-black text-sm text-[#ea580c] mt-1">
                    UGX {tier.price_ugx.toLocaleString()}
                  </div>
                  <div className="font-mono font-bold text-[11px] text-[#059669] mt-0.5">
                    +UGX {tierYield.toLocaleString()}/day
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan Features */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-700">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">Features Included:</span>
          {currentTier.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* 10% Referral Cash Callout */}
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
          <div className="flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-emerald-700" />
            <span>Referral Reward (10%):</span>
          </div>
          <span className="font-mono font-black text-emerald-800">
            +UGX {Math.round(currentTier.price_ugx * settings.referral_commission_rate).toLocaleString()} cash
          </span>
        </div>

        {/* Checkout Button */}
        <button
          disabled={isSoldOut}
          onClick={() => {
            onClose();
            openCheckout(product, currentTier, 'purchase');
          }}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
        >
          <span>Purchase {product.model_code || product.name} — UGX {currentTier.price_ugx.toLocaleString()}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
