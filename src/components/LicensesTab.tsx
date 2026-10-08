import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  KeyRound, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Sliders, 
  Cpu, 
  Send, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  ExternalLink,
  HelpCircle,
  ShoppingBag,
  Bell
} from 'lucide-react';

export const LicensesTab: React.FC<{ onGoToStore: () => void }> = ({ onGoToStore }) => {
  const { 
    currentUser, 
    licenses, 
    products, 
    toggleLicenseStatus, 
    updateLicenseConfig, 
    openCheckout,
    beginnerMode 
  } = useApp();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState<number | null>(null);

  const userLicenses = licenses.filter(l => l.user_id === currentUser?.id);

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Tab Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-700" />
            <h1 className="text-base font-heading font-extrabold text-slate-900">My Active Bot Licenses</h1>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {userLicenses.length} Owned
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {beginnerMode ? (
            <span>Manage your purchased bot keys, toggle automated scanning on/off, and connect alerts to Telegram or WhatsApp.</span>
          ) : (
            <span>Manage software keys, MT4/MT5 EA copy trading parameters, and webhook triggers.</span>
          )}
        </p>
      </div>

      {/* Empty State if user owns no licenses */}
      {userLicenses.length === 0 ? (
        <div className="rounded-2xl bg-white border border-emerald-100 p-6 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-bold text-sm text-slate-900">
            No Smart Bot Licenses Yet
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Purchase a smart bot license using MTN MoMo or Airtel Money to start receiving automated arbitrage and trading triggers.
          </p>
          <button
            onClick={onGoToStore}
            id="btn-empty-store-cta"
            className="mt-2 py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Bot Store</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userLicenses.map(license => {
            const product = products.find(p => p.id === license.product_id);
            const tier = product?.tiers.find(t => t.id === license.tier_id);
            const isBasic = tier?.name === 'Basic';
            const proTier = product?.tiers.find(t => t.name === 'Pro');
            const upgradeDiff = (proTier && tier) ? ((proTier.price_ugx ?? 0) - (tier.price_ugx ?? 0)) : 0;
            const isConfigOpen = activeConfigTab === license.id;

            return (
              <div 
                key={license.id}
                className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        license.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        {license.status === 'active' ? 'Running 24/7' : 'Paused'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {tier?.name || 'Standard'} Plan
                      </span>
                    </div>
                    <h2 className="font-heading font-bold text-sm text-slate-900 mt-1 leading-snug">
                      {product?.name || 'Smart Bot'}
                    </h2>
                  </div>

                  {/* Toggle Bot Status */}
                  <button
                    onClick={() => toggleLicenseStatus(license.id)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      license.status === 'active'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    {license.status === 'active' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>
                </div>

                {/* License Key Box */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Your Software Key:</span>
                    <span className="font-mono text-xs font-bold text-emerald-800 truncate block">
                      {license.license_key}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(license.license_key)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0 text-xs flex items-center gap-1 transition-colors"
                    title="Copy License Key"
                  >
                    {copiedKey === license.license_key ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">Alerts Today</span>
                    <span className="font-mono font-bold text-xs text-slate-900">{license.alerts_today ?? 0}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">Uptime</span>
                    <span className="font-mono font-bold text-xs text-emerald-700">{license.uptime_pct ?? 99.9}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 block">Risk Profile</span>
                    <span className="font-mono font-bold text-xs capitalize text-slate-800">{license.config?.risk_level || 'moderate'}</span>
                  </div>
                </div>

                {/* Upgrade Banner if on Basic plan */}
                {isBasic && proTier && (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-emerald-900 text-[11px]">Upgrade to Pro Plan</div>
                      <div className="text-[10px] text-slate-600">Unlock unlimited scans & sub-second webhooks</div>
                    </div>
                    <button
                      onClick={() => product && openCheckout(product, proTier, 'upgrade')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shrink-0"
                    >
                      Pay UGX {(upgradeDiff ?? 0).toLocaleString()}
                    </button>
                  </div>
                )}

                {/* Config Accordion Toggle */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setActiveConfigTab(isConfigOpen ? null : license.id)}
                    className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isConfigOpen ? 'Hide Bot Settings' : 'Configure Bot Parameters'}</span>
                  </button>

                  <span className="text-slate-500 text-xs font-semibold flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                    <span>Auto-Monitoring</span>
                  </span>
                </div>

                {/* Configuration Panel */}
                {isConfigOpen && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    {/* Risk Level Selector */}
                    <div>
                      <label className="text-[10px] text-slate-600 uppercase font-bold tracking-wider block mb-1.5">
                        Trading Risk Sensitivity:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['conservative', 'moderate', 'aggressive'] as const).map(risk => (
                          <button
                            key={risk}
                            onClick={() => updateLicenseConfig(license.id, { ...license.config, risk_level: risk })}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                              license.config?.risk_level === risk
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            {risk}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notification Toggles */}
                    <div className="space-y-2 pt-1 border-t border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 text-[11px]">Instant Telegram Alerts:</span>
                        <input
                          type="checkbox"
                          checked={license.config?.notify_telegram ?? false}
                          onChange={(e) => updateLicenseConfig(license.id, { ...license.config, notify_telegram: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 text-[11px]">SMS High-Value Triggers:</span>
                        <input
                          type="checkbox"
                          checked={license.config?.notify_sms ?? false}
                          onChange={(e) => updateLicenseConfig(license.id, { ...license.config, notify_sms: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
