import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Radio, 
  TrendingUp, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Flame, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Info,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const SignalsTab: React.FC = () => {
  const { signals, beginnerMode, products } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(signals[0]?.id || null);

  const filteredSignals = signals.filter(s => {
    if (filterType === 'ALL') return true;
    return s.type === filterType;
  });

  const toggleExpand = (id: string) => {
    setExpandedSignalId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Radar Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Bot Radar Active</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">24/7 Multi-Feed</span>
        </div>

        <h1 className="text-base font-heading font-extrabold text-white mt-1.5 leading-tight">
          Real-Time Market Signals & Arbitrage Gaps
        </h1>
        
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          {beginnerMode ? (
            <span>Here are real-time price differences detected right now across Ugandan Mobile Money exchanges and global markets.</span>
          ) : (
            <span>Algorithmic anomaly detection across Binance P2P, YellowCard, Chipper, MT5, and Ugandan sports markets.</span>
          )}
        </p>

        {/* Live Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-800/80 mt-3 no-scrollbar">
          {['ALL', 'ARBITRAGE', 'BUY_SIGNAL', 'BREAKOUT'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-indigo-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Signals' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Feed List */}
      <div className="space-y-3">
        {filteredSignals.map(sig => {
          const isExpanded = expandedSignalId === sig.id;
          const isArb = sig.type === 'ARBITRAGE';
          
          return (
            <div
              key={sig.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isArb 
                  ? 'bg-slate-900/95 border-emerald-500/40 shadow-md shadow-emerald-950/20' 
                  : 'bg-slate-900/90 border-slate-800/90'
              }`}
            >
              {/* Signal Card Header */}
              <div 
                onClick={() => toggleExpand(sig.id)}
                className="p-3.5 cursor-pointer hover:bg-slate-850/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        sig.type === 'ARBITRAGE' 
                          ? 'bg-emerald-500 text-slate-950' 
                          : sig.type === 'BUY_SIGNAL'
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        {sig.type}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {sig.timestamp}
                      </span>
                    </div>

                    <h2 className="font-heading font-bold text-sm text-slate-100 mt-1.5">
                      {sig.pair}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium truncate max-w-[240px]">
                      {sig.bot_name}
                    </p>
                  </div>

                  {/* Profit & Confidence Metric Pill */}
                  <div className="text-right shrink-0">
                    <div className="text-emerald-400 font-mono font-extrabold text-sm flex items-center justify-end gap-0.5">
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      +{sig.expected_profit_pct}% ROI
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 font-medium">
                      Confidence: {sig.confidence}%
                    </span>
                  </div>
                </div>

                {/* Exchanges / Fast Preview */}
                {sig.exchange_a && sig.exchange_b && (
                  <div className="mt-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800/70 text-xs flex items-center justify-between text-slate-300">
                    <div className="truncate text-[11px]">
                      <span className="text-slate-400 block text-[9px]">BUY AT:</span>
                      <strong className="text-emerald-300">{sig.exchange_a}</strong>
                    </div>
                    <span className="text-slate-500 font-bold px-1.5">➔</span>
                    <div className="truncate text-[11px] text-right">
                      <span className="text-slate-400 block text-[9px]">SELL AT:</span>
                      <strong className="text-sky-300">{sig.exchange_b}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Action & Step-by-Step Guide */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5">
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Signal Details</div>
                    {sig.details}
                  </div>

                  {/* Beginner Execution Steps */}
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>How to execute this opportunity:</span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p>1. Open your verified exchange account or MetaTrader terminal.</p>
                      <p>2. Set order with specified Stop-Loss and Take-Profit limits.</p>
                      <p>3. With Pro tier bot, webhooks execute this trade automatically within 200ms.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
