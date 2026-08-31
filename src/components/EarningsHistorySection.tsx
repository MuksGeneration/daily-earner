import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  Coins, 
  Calendar, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  ArrowDownRight, 
  Zap, 
  Bot, 
  Copy, 
  Check, 
  ChevronRight, 
  Wallet,
  ArrowUpRight,
  Info,
  Table as TableIcon,
  LayoutList
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EarningsHistorySectionProps {
  compact?: boolean;
  onExploreStore?: () => void;
}

export const EarningsHistorySection: React.FC<EarningsHistorySectionProps> = ({ 
  compact = false,
  onExploreStore 
}) => {
  const { 
    currentUser, 
    ledger, 
    licenses, 
    products, 
    triggerMidnightYield,
    countdownFormatted,
    todayBotEarningsUgx,
    totalActiveBotsCount,
    setActiveTab
  } = useApp();

  const [selectedBotFilter, setSelectedBotFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filter ledger entries for automated daily bot yield for current user
  const userYieldLedger = useMemo(() => {
    return ledger.filter(entry => 
      entry.user_id === currentUser.id && 
      entry.reason === 'bot_daily_yield'
    );
  }, [ledger, currentUser.id]);

  // Derive unique bot names/models for the filter chips
  const botOptions = useMemo(() => {
    const set = new Set<string>();
    userYieldLedger.forEach(entry => {
      if (entry.product_name) set.add(entry.product_name);
    });
    return Array.from(set);
  }, [userYieldLedger]);

  // Filter & sort the entries
  const filteredEntries = useMemo(() => {
    return userYieldLedger
      .filter(entry => {
        const matchesBot = selectedBotFilter === 'ALL' || entry.product_name === selectedBotFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
          (entry.product_name || '').toLowerCase().includes(q) ||
          (entry.note || '').toLowerCase().includes(q) ||
          entry.amount_ugx.toString().includes(q) ||
          entry.created_at.toLowerCase().includes(q);
        return matchesBot && matchesSearch;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortOrder === 'highest') {
          return b.amount_ugx - a.amount_ugx;
        }
        // Default newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [userYieldLedger, selectedBotFilter, searchQuery, sortOrder]);

  // Aggregate stats
  const totalEarnedUgx = useMemo(() => {
    return userYieldLedger.reduce((sum, item) => sum + (item.amount_ugx || 0), 0);
  }, [userYieldLedger]);

  const averageDailyPayout = useMemo(() => {
    if (userYieldLedger.length === 0) return 0;
    return Math.round(totalEarnedUgx / userYieldLedger.length);
  }, [userYieldLedger, totalEarnedUgx]);

  const handleSimulate = () => {
    setIsSimulating(true);
    const result = triggerMidnightYield(true);
    setToastMessage(result.message);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCopyStatement = () => {
    const summaryText = `DAILY EARNER AUTOMATED PAYOUT STATEMENT\nUser: ${currentUser.name} (${currentUser.phone})\nTotal Payouts: UGX ${totalEarnedUgx.toLocaleString()}\nTotal Payout Events: ${userYieldLedger.length}\nActive Bots: ${totalActiveBotsCount} running (${todayBotEarningsUgx.toLocaleString()} UGX/day)\nGenerated: ${new Date().toLocaleString()}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  return (
    <div className="space-y-4" id="earnings-history-section">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className="bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-emerald-500 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-emerald-200 hover:text-white text-xs font-black ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Aggregate Yield Metrics Header - Styled with identical light emerald + white UI palette */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-200 p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>AUTOMATED LEDGER PAYOUTS</span>
            </div>
            <h2 className="text-lg font-heading font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Earnings History</span>
              <span className="text-xs font-mono font-bold bg-emerald-100/80 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200">
                {userYieldLedger.length} Records
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Real-time statement of daily automated bot yields credited directly to your prepaid wallet.
            </p>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            id="btn-simulate-history-midnight"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm shadow-emerald-600/20"
            title="Trigger an automated daily payout for demo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Simulate Midnight</span>
          </button>
        </div>

        {/* 3-Column Statistical Summary Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-emerald-200/70">
          <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-semibold">Total Earned</span>
            <div className="font-mono font-black text-sm sm:text-base text-emerald-800 mt-0.5 truncate">
              UGX {totalEarnedUgx.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5">Lifetime Yield</span>
          </div>

          <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-semibold">Active Rate</span>
            <div className="font-mono font-black text-sm sm:text-base text-[#059669] mt-0.5 truncate">
              UGX {todayBotEarningsUgx.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5">/ day yield</span>
          </div>

          <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-semibold">Next Payout</span>
            <div className="font-mono font-bold text-xs sm:text-sm text-amber-700 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{countdownFormatted}</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5">At 12:00 AM</span>
          </div>
        </div>
      </div>

      {/* Action and Filter Controls Bar */}
      <div className="space-y-2.5 bg-white border border-emerald-100 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bot model, note, or date..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: View Mode Toggle, Sort Selector & Copy Statement button */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table Layout"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' 
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Layout"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Yield</option>
              </select>
            </div>

            <button
              onClick={handleCopyStatement}
              className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="Copy statement summary"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bot Model Filter Chips (if more than 1 option) */}
        {botOptions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Filter:
            </span>
            <button
              onClick={() => setSelectedBotFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedBotFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Models ({userYieldLedger.length})
            </button>
            {botOptions.map(botName => {
              const count = userYieldLedger.filter(l => l.product_name === botName).length;
              return (
                <button
                  key={botName}
                  onClick={() => setSelectedBotFilter(botName)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedBotFilter === botName
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {botName} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Earnings History List / Table */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
            <Coins className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-xs mx-auto">
            <h3 className="font-heading font-black text-base text-slate-900">
              {searchQuery || selectedBotFilter !== 'ALL' 
                ? 'No matching payouts found' 
                : 'No Automated Payouts Recorded Yet'}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {searchQuery || selectedBotFilter !== 'ALL'
                ? 'Try clearing your search query or selecting "All Models".'
                : 'When your smart bots run, their automated daily yields will be credited here every night at 12:00 AM.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Simulate First Midnight Payout</span>
            </button>

            {onExploreStore && (
              <button
                onClick={onExploreStore}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                <span>Browse Bots Store</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Refined, Clean Table Layout with Alternating Emerald-50 Rows and text-slate-700 */
        <div className="bg-white border border-emerald-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-emerald-100 text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                  <th className="py-2.5 px-3.5">Date & Time</th>
                  <th className="py-2.5 px-3.5">Bot Model & Rig</th>
                  <th className="py-2.5 px-3.5 text-right">Daily Yield</th>
                  <th className="py-2.5 px-3.5 text-right">Status & Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/70 text-xs">
                {filteredEntries.map((entry, idx) => {
                  const relatedProduct = products.find(p => p.name === entry.product_name || p.model_code === entry.product_name);
                  const formattedDate = new Date(entry.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const formattedTime = new Date(entry.created_at).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const isEven = idx % 2 === 1;

                  return (
                    <tr
                      key={entry.id}
                      id={`ledger-payout-row-${entry.id}`}
                      className={`transition-colors text-slate-700 ${
                        isEven ? 'bg-emerald-50/60 hover:bg-emerald-100/50' : 'bg-white hover:bg-emerald-50/40'
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 ml-5">
                          {formattedTime}
                        </div>
                      </td>

                      {/* Bot Model */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100/80 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-heading font-black text-slate-900">
                                {entry.product_name || 'Smart Bot'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                                {relatedProduct?.model_code || 'BOT'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 line-clamp-1 mt-0.5 font-medium">
                              {entry.note || 'Automated Daily Yield Calculation'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right align-middle">
                        <div className="font-mono font-black text-sm sm:text-base text-[#059669]">
                          +UGX {entry.amount_ugx.toLocaleString()}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          Credited
                        </span>
                      </td>

                      {/* Status & Ref */}
                      <td className="py-3 px-3.5 text-right align-middle">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span>Wallet Autocredit</span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 mt-1">
                          Ref #L{entry.id.toString().slice(-4)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Alternating Refined List / Card Layout with Emerald-50 and text-slate-700 */
        <div className="space-y-2 border border-emerald-100 rounded-2xl overflow-hidden p-2 bg-white shadow-xs">
          {filteredEntries.map((entry, idx) => {
            const relatedProduct = products.find(p => p.name === entry.product_name || p.model_code === entry.product_name);
            const formattedDate = new Date(entry.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            const formattedTime = new Date(entry.created_at).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            });
            const isEven = idx % 2 === 1;

            return (
              <div
                key={entry.id}
                id={`ledger-payout-card-${entry.id}`}
                className={`border border-emerald-100/80 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all space-y-2 text-slate-700 group ${
                  isEven ? 'bg-emerald-50/60 hover:bg-emerald-100/50' : 'bg-white hover:bg-emerald-50/40'
                }`}
              >
                {/* Top Row: Amount & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200/90 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4 fill-emerald-500/20" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-black text-sm text-slate-900">
                          {entry.product_name || 'Smart Bot'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                          {relatedProduct?.model_code || 'BOT'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium line-clamp-1 mt-0.5">
                        {entry.note || 'Automated Daily Yield Calculation'}
                      </p>
                    </div>
                  </div>

                  {/* Payout Amount Monospace Badge */}
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-base text-[#059669] leading-tight">
                      +UGX {entry.amount_ugx.toLocaleString()}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      Daily Yield
                    </span>
                  </div>
                </div>

                {/* Bottom Meta Bar: Timestamp, Destination, and Ref */}
                <div className="pt-2 border-t border-emerald-100/60 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{formattedDate} • {formattedTime}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>Credited to Wallet Balance</span>
                    </div>
                    <span className="text-slate-500 font-mono">
                      #L{entry.id.toString().slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety & Ledger Audit Transparency Footer */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed space-y-0.5">
          <span className="font-bold text-emerald-900 block">Ledger Verification & Wallet Autocredit:</span>
          <span>
            Every midnight, active bot licenses calculate their daily yield rate and immediately record an immutable ledger entry. Funds are added to your available prepaid wallet balance with zero transaction fees.
          </span>
        </div>
      </div>
    </div>
  );
};
