import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { EarningsHistorySection } from './EarningsHistorySection';
import { TreasureChest } from './TreasureChest';
import { 
  Sliders, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Send, 
  Activity, 
  Bell, 
  ShieldAlert, 
  Zap, 
  ExternalLink,
  Bot,
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Coins,
  Clock,
  History
} from 'lucide-react';

export const MyBotsTab: React.FC = () => {
  const { 
    currentUser, 
    licenses, 
    products, 
    ledger,
    toggleLicenseStatus, 
    updateLicenseConfig, 
    signals,
    setActiveTab,
    beginnerMode,
    todayBotEarningsUgx,
    countdownFormatted
  } = useApp();

  const userLicenses = licenses.filter(l => l.user_id === currentUser.id);
  const userYieldLedger = ledger.filter(l => l.user_id === currentUser.id && l.reason === 'bot_daily_yield');
  const totalEarnedYield = userYieldLedger.reduce((sum, item) => sum + (item.amount_ugx || 0), 0);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSignalTab, setActiveSignalTab] = useState<'signals' | 'config' | 'earnings'>('signals');

  const copyLicenseKey = (key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  if (userLicenses.length === 0 && userYieldLedger.length === 0) {
    return (
      <div className="space-y-4 pb-20 text-center py-10 max-w-md mx-auto">
        <TreasureChest />
        <div className="w-18 h-18 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
          <DailyEarnerLogo className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="max-w-xs mx-auto space-y-2">
          <h2 className="text-lg font-bold text-slate-900">No Active Bot Licenses Yet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You have not activated any automated smart bots. Browse the store to get your first crypto, forex, or sports arbitrage license with daily midnight payouts.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('store')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>Explore Bots Store</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto">
      <TreasureChest />
      {/* Beginner Mode Helper */}
      {beginnerMode && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-emerald-900">How to Use Your Active Bots & Daily Earnings</div>
            <p className="text-slate-600 leading-relaxed">
              Your bots run 24/7 in the cloud. They stream real-time price arbitrage alerts, and their daily earnings are automatically credited to your wallet every night at 12:00 AM.
            </p>
          </div>
        </div>
      )}

      {/* Header stats: 3 Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-emerald-100 rounded-2xl p-3 space-y-1 shadow-xs">
          <span className="text-[10px] text-slate-500 font-medium block">Active Bots</span>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            {userLicenses.filter(l => l.status === 'active').length} of {userLicenses.length}
          </div>
          <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <span>Online</span>
          </span>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-3 space-y-1 shadow-xs">
          <span className="text-[10px] text-slate-500 font-medium block">Daily Yield</span>
          <div className="text-base font-extrabold text-[#059669] font-mono truncate">
            +{todayBotEarningsUgx.toLocaleString()}
          </div>
          <span className="text-[9px] text-slate-400 block truncate">
            UGX / day
          </span>
        </div>

        <div 
          onClick={() => setActiveSignalTab('earnings')}
          className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl p-3 space-y-1 shadow-xs cursor-pointer transition-colors group"
          title="View full Earnings History"
        >
          <span className="text-[10px] text-slate-500 font-medium block flex items-center justify-between">
            <span>Total Yield</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </span>
          <div className="text-base font-extrabold text-emerald-700 font-mono truncate">
            UGX {totalEarnedYield.toLocaleString()}
          </div>
          <span className="text-[9px] text-emerald-800 font-extrabold block">
            {userYieldLedger.length} Payouts
          </span>
        </div>
      </div>

      {/* 3-Way Tab Switch: Signals Feed vs My Bot Licenses vs Earnings History */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
        <button
          onClick={() => setActiveSignalTab('signals')}
          id="tab-btn-signals"
          className={`py-1.5 px-1 rounded-lg font-bold transition-all text-center truncate ${
            activeSignalTab === 'signals'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Live Signals ({signals.length})
        </button>

        <button
          onClick={() => setActiveSignalTab('config')}
          id="tab-btn-licenses"
          className={`py-1.5 px-1 rounded-lg font-bold transition-all text-center truncate ${
            activeSignalTab === 'config'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Bots ({userLicenses.length})
        </button>

        <button
          onClick={() => setActiveSignalTab('earnings')}
          id="tab-btn-earnings-history"
          className={`py-1.5 px-1 rounded-lg font-bold transition-all text-center truncate flex items-center justify-center gap-1 ${
            activeSignalTab === 'earnings'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Earnings ({userYieldLedger.length})</span>
        </button>
      </div>

      {/* 1. Live Signals Feed View */}
      {activeSignalTab === 'signals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Real-Time Bot Alerts
            </h3>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              Auto-Generated
            </span>
          </div>

          <div className="space-y-2.5">
            {signals.map((sig) => (
              <div 
                key={sig.id}
                className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      sig.action === 'BUY' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : sig.action === 'SELL' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-teal-100 text-teal-800 border border-teal-200'
                    }`}>
                      {sig.action}
                    </span>
                    <span className="font-heading font-extrabold text-sm text-slate-900">
                      {sig.pair}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {sig.details}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 font-medium">Expected Return / Spread:</span>
                  <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    +{sig.profit_margin}% Net
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Bot Licenses & Config View */}
      {activeSignalTab === 'config' && (
        <div className="space-y-4">
          {userLicenses.map((lic) => {
              const prod = products.find(p => p.id === lic.product_id);
              const tier = prod?.tiers.find(t => t.id === lic.tier_id);
              const isCopied = copiedKey === lic.license_key;
              const dailyRate = lic.daily_earning_ugx || tier?.daily_earning_ugx || prod?.daily_earning_ugx || 5000;
              const totalEarned = lic.total_earned_ugx || 0;

              return (
                <div 
                  key={lic.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3.5"
                >
                  {/* Top Image & Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                      <img 
                        referrerPolicy="no-referrer"
                        src={prod?.image_url || `https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&auto=format&fit=crop&q=80`} 
                        alt={prod?.name || 'Smart Bot'}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-heading font-black text-base text-slate-900 leading-tight">
                          {prod?.model_code || prod?.name || 'Smart Bot'}
                        </h3>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                          {tier?.name || 'Basic'} Plan
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                        {prod?.series_name || 'ANTMINER T SERIES'} • Lifetime
                      </p>
                    </div>

                    {/* Toggle on/off */}
                    <button
                      onClick={() => toggleLicenseStatus(lic.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                        lic.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {lic.status === 'active' ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Running</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Daily Earning & Lifetime Yield Strip */}
                  <div className="grid grid-cols-2 gap-2 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-2.5 rounded-xl border border-emerald-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Daily Midnight Yield:</span>
                      <span className="font-mono font-black text-sm text-[#059669]">
                        +UGX {dailyRate.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-medium block">Total Earned So Far:</span>
                      <span className="font-mono font-black text-sm text-slate-900">
                        UGX {totalEarned.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* License Key Pill */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none mb-1">
                        Hardware License Key:
                      </span>
                      <span className="font-mono text-xs text-slate-800 font-bold select-all">
                        {lic.license_key}
                      </span>
                    </div>
                    <button
                      onClick={() => copyLicenseKey(lic.license_key)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 shrink-0 shadow-2xs cursor-pointer"
                      title="Copy Key"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Execution Risk Profile */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Execution Speed & Mode
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['conservative', 'moderate', 'aggressive'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateLicenseConfig(lic.id, { risk_level: mode })}
                          className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all border cursor-pointer ${
                            lic.config?.risk_level === mode
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                {/* Telegram Alerts Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-medium text-slate-700">Telegram Instant Alerts</span>
                  </div>
                  <button
                    onClick={() => updateLicenseConfig(lic.id, { notify_telegram: !lic.config?.notify_telegram })}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      lic.config?.notify_telegram ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  >
                    <span 
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        lic.config?.notify_telegram ? 'left-4.5' : 'left-0.5'
                      }`} 
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Earnings History View (Derived from Ledger) */}
      {activeSignalTab === 'earnings' && (
        <EarningsHistorySection onExploreStore={() => setActiveTab('store')} />
      )}
    </div>
  );
};
