import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductTier } from '../types';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { BotDetailModal } from './BotDetailModal';
import { 
  Cpu, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  ArrowRight, 
  ArrowUpRight, 
  Gift, 
  Info,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Clock,
  Coins,
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';

export const StoreTab: React.FC = () => {
  const { 
    products, 
    licenses, 
    currentUser, 
    openCheckout, 
    beginnerMode,
    settings,
    nextMidnightSeconds,
    countdownFormatted,
    todayBotEarningsUgx,
    totalActiveBotsCount,
    triggerMidnightYield
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTiers, setSelectedTiers] = useState<Record<number, number>>({
    1: 101,
    2: 201,
    3: 301,
    4: 401
  });
  const [localSearch, setLocalSearch] = useState<string>('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ['All', 'Crypto Arbitrage', 'Forex Scalping', 'Sports Value'];

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const query = (localSearch || '').toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesSearch = (p.name || '').toLowerCase().includes(query) || 
                          (p.model_code || '').toLowerCase().includes(query) ||
                          (p.series_name || '').toLowerCase().includes(query) ||
                          (p.tagline || '').toLowerCase().includes(query) ||
                          (p.category || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleTierChange = (productId: number, tierId: number) => {
    setSelectedTiers(prev => ({ ...prev, [productId]: tierId }));
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="sticky top-14 z-40 bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-emerald-500 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-emerald-200 hover:text-white text-xs font-black ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Automated Midnight Earnings Status Bar */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700/80 p-4 text-white shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-extrabold text-emerald-300 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AUTOMATIC MIDNIGHT ENGINE</span>
            </div>
            <h2 className="text-base font-heading font-black tracking-tight text-white">
              Daily Bot Earnings
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Next Midnight Payout</span>
            <div className="inline-flex items-center gap-1 font-mono font-extrabold text-xs text-emerald-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{countdownFormatted}</span>
            </div>
          </div>
        </div>

        {/* Live Active Bots Earnings Counter */}
        <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Your Active Daily Yield:</span>
            <span className="font-mono font-black text-sm text-[#10b981]">
              UGX {todayBotEarningsUgx.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal"> / day</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Active Bots Owned:</span>
            <span className="font-mono font-extrabold text-sm text-slate-100">
              {totalActiveBotsCount} Running
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-start pt-2 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Auto-credits to wallet balance at 12:00 AM</span>
          </span>
        </div>
      </div>

      {/* Hero Welcome / Value Proposition Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/80 border border-emerald-200 p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 text-[10px] font-extrabold text-emerald-800 mb-1.5">
              <Flame className="w-3 h-3 text-emerald-600" />
              <span>OFFICIAL HARDWARE & ALGO STORE</span>
            </div>
            <h1 className="text-lg font-heading font-extrabold text-slate-900 tracking-tight leading-snug">
              Automated Earnings Store
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Buy lifetime bot software licenses with Mobile Money. Money earned is automatically added daily at midnight to your prepaid wallet balance.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-center shrink-0">
            <DailyEarnerLogo className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-100 text-[10px] text-slate-700 font-medium">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Lifetime License</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Daily Midnight Yield</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-emerald-800 font-bold">10% Referral Cash</span>
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search smart bots (FX1, FX2, Arbitrage, Gold)..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-2xs"
          />
          {localSearch && (
            <button 
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards List in exact requested format */}
      <div className="space-y-4">
        {filteredProducts.map(product => {
          const currentSelectedTierId = selectedTiers[product.id] || product.tiers[0].id;
          const selectedTier = product.tiers.find(t => t.id === currentSelectedTierId) || product.tiers[0];

          // Check if current user already owns a license for this product
          const userLicense = licenses.find(l => l.user_id === currentUser.id && l.product_id === product.id);
          const ownedTier = userLicense ? product.tiers.find(t => t.id === userLicense.tier_id) : null;
          const isOwned = Boolean(userLicense);
          const isOwnedSameTier = ownedTier?.id === selectedTier.id;
          const isUpgradePossible = ownedTier && selectedTier.price_ugx > ownedTier.price_ugx;
          const upgradePriceDiff = isUpgradePossible ? selectedTier.price_ugx - ownedTier.price_ugx : 0;

          // 10% commission calculation for preview
          const referralCommission = Math.round(selectedTier.price_ugx * settings.referral_commission_rate);
          const dailyYieldUgx = selectedTier.daily_earning_ugx || product.daily_earning_ugx || 5000;
          const stockAvailable = product.stock_available ?? 14;
          const totalStock = product.total_stock ?? 20;
          const isSoldOut = stockAvailable <= 0;

          return (
            <div 
              key={product.id}
              id={`store-card-${product.id}`}
              className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              {/* Top Machine Hardware Image Container with Stock Pill */}
              <div 
                onClick={() => setDetailProduct(product)}
                className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group cursor-pointer"
              >
                <img 
                  referrerPolicy="no-referrer"
                  src={product.icon_svg ? `data:image/svg+xml,${encodeURIComponent(product.icon_svg)}` : product.image_url || `https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&auto=format&fit=crop&q=80`} 
                  alt={product.name}
                  className={`w-full ${product.icon_svg ? 'h-56 object-contain p-4' : 'h-44 object-cover object-center'} group-hover:scale-105 transition-transform duration-500`}
                />

                {/* Stock Available Pill Badge in Top Right */}
                <div className="absolute top-2.5 right-2.5 bg-[#10b981] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md">
                  {stockAvailable}/{totalStock} available
                </div>

                {/* Active Owned Badge (if owned) */}
                {isOwned && (
                  <div className="absolute top-2.5 left-2.5 bg-emerald-900/90 border border-emerald-400/40 text-emerald-200 text-[10px] font-black px-2.5 py-0.8 rounded-lg backdrop-blur-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Active License</span>
                  </div>
                )}

                {/* Category Chip in Bottom Left */}
                <div className="absolute bottom-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-slate-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-slate-700">
                  {product.category}
                </div>
              </div>

              {/* Card Meta and Content */}
              <div className="space-y-1.5 px-0.5">
                {/* Series Tracking Header */}
                <div className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                  {product.series_name || 'ANTMINER T SERIES'}
                </div>

                {/* Main 2-Column Model Code & Yield Row */}
                <div className="flex items-end justify-between gap-2 pt-0.5">
                  {/* Left Column: Model Code & Price */}
                  <div>
                    <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 leading-none">
                      {product.model_code || product.name}
                    </h3>
                    <div className="font-mono font-black text-base sm:text-lg text-[#ea580c] mt-1 leading-tight">
                      UGX {selectedTier.price_ugx.toLocaleString()}
                    </div>
                  </div>

                  {/* Right Column: Duration & Daily Earnings Rate */}
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-semibold text-slate-500">
                      {product.duration_days ? `${product.duration_days} days` : 'Lifetime License'}
                    </div>
                    <div className="font-mono font-black text-base sm:text-lg text-[#059669] mt-1 leading-tight">
                      UGX {dailyYieldUgx.toLocaleString()}/day
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Tier Selector (e.g. Basic vs Pro) */}
              <div className="p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-1 text-xs">
                {product.tiers.map(tier => {
                  const isSelected = tier.id === selectedTier.id;
                  const isOwnedThisTier = ownedTier?.id === tier.id;
                  const tierDaily = tier.daily_earning_ugx || product.daily_earning_ugx || 5000;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleTierChange(product.id, tier.id)}
                      className={`py-1.5 px-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-xs border border-emerald-300 ring-1 ring-emerald-500/20'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[11px] ${isSelected ? 'text-emerald-900' : ''}`}>{tier.name}</span>
                        {isOwnedThisTier && (
                          <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">OWNED</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between font-mono mt-0.5 text-[10px]">
                        <span className="text-[#ea580c] font-bold">UGX {tier.price_ugx.toLocaleString()}</span>
                        <span className="text-[#059669] font-bold">+{tierDaily.toLocaleString()}/d</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 10% Referral Reward & View Details Row */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1 text-[11px] text-emerald-900 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <Gift className="w-3 h-3 text-emerald-700" />
                  <span>Referral: <strong className="font-mono text-emerald-800">+UGX {referralCommission.toLocaleString()}</strong></span>
                </div>

                <button
                  onClick={() => setDetailProduct(product)}
                  className="text-xs font-bold text-[#c2410c] hover:text-[#9a3412] hover:underline cursor-pointer flex items-center gap-0.5 transition-colors"
                >
                  <span>View Details & Purchase</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Action Button */}
              <div className="pt-0.5">
                {isSoldOut && !isOwned ? (
                  <button disabled className="w-full py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed">Currently unavailable</button>
                ) : isOwnedSameTier ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Active License (Earning UGX {dailyYieldUgx.toLocaleString()}/day)</span>
                  </button>
                ) : isUpgradePossible ? (
                  <button
                    onClick={() => openCheckout(product, selectedTier, 'upgrade')}
                    id={`btn-upgrade-${product.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all"
                  >
                    <span>Upgrade to {selectedTier.name} Plan</span>
                    <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                      Pay Diff: UGX {upgradePriceDiff.toLocaleString()}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => openCheckout(product, selectedTier, 'purchase')}
                    id={`btn-buy-${product.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all"
                  >
                    <span>Buy {product.model_code || product.name} — UGX {selectedTier.price_ugx.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bot Detail Modal Popup */}
      <BotDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
      />
    </div>
  );
};
