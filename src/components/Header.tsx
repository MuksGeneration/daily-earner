import React from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { 
  Sparkles, 
  HelpCircle, 
  UserCheck, 
  ShieldAlert, 
  Wallet, 
  Coins, 
  ChevronDown
} from 'lucide-react';

export const Header: React.FC<{ onOpenAuth: () => void; onOpenUserSwitch: () => void }> = ({ 
  onOpenAuth, 
  onOpenUserSwitch 
}) => {
  const { 
    currentUser, 
    beginnerMode, 
    setBeginnerMode, 
    getReferralBalance, 
    orders, 
    withdrawals, 
    deposits,
    activeTab,
    setActiveTab
  } = useApp();

  const referralBalance = (getReferralBalance && currentUser?.id) ? (getReferralBalance(currentUser.id) ?? 0) : 0;
  const pendingOrdersCount = orders?.filter(o => o.status === 'pending').length ?? 0;
  const pendingWithdrawalsCount = withdrawals?.filter(w => w.status === 'pending').length ?? 0;
  const pendingDepositsCount = deposits?.filter(d => d.status === 'pending').length ?? 0;
  const totalAdminPending = pendingOrdersCount + pendingWithdrawalsCount + pendingDepositsCount;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-2.5 shadow-xs transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('store')}>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs flex items-center justify-center">
            <DailyEarnerLogo className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-sm tracking-tight text-slate-900">Daily Earner</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                10% REWARD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Smart Bot Store & Referral Hub</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Beginner Mode Toggle */}
          <button
            onClick={() => setBeginnerMode(!beginnerMode)}
            id="btn-toggle-beginner"
            className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all border ${
              beginnerMode
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Simple / Beginner Friendly Explanations"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px]">{beginnerMode ? 'Easy ON' : 'Easy Mode'}</span>
          </button>

          {/* User Profile Pill / Switcher */}
          <button
            onClick={onOpenUserSwitch}
            id="btn-user-switcher"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-1 pr-2 transition-all text-left shadow-2xs"
          >
            <img 
              src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.name || 'User'}`} 
              alt={currentUser?.name || 'User'} 
              className="w-7 h-7 rounded-lg bg-slate-100 object-cover border border-slate-200"
            />
            <div className="hidden sm:block text-left">
              <div className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[80px]">
                {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">
                {currentUser?.is_admin ? 'Admin' : 'Customer'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Balance Bar & Quick Stats Strip (Mobile View) */}
      <div className="max-w-md mx-auto mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        {/* Referral Earnings Chip */}
        <div 
          onClick={() => setActiveTab('referrals')}
          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-all"
        >
          <Coins className="w-3.5 h-3.5 text-emerald-700" />
          <div>
            <span className="text-[9px] text-slate-500 block leading-none font-medium">Referral Balance:</span>
            <span className="font-mono font-extrabold text-emerald-800 text-xs leading-tight">
              UGX {(referralBalance ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Prepaid Wallet Chip */}
        <div 
          onClick={() => setActiveTab('wallet')}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer transition-all"
        >
          <Wallet className="w-3.5 h-3.5 text-slate-600" />
          <div>
            <span className="text-[9px] text-slate-500 block leading-none font-medium">Prepaid Wallet:</span>
            <span className="font-mono font-extrabold text-slate-800 text-xs leading-tight">
              UGX {(currentUser?.wallet_balance_ugx ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Admin Shortcut if user is Admin */}
        {currentUser?.is_admin && (
          <button
            onClick={() => setActiveTab('admin')}
            id="btn-admin-pill"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] border transition-all ${
              activeTab === 'admin' 
                ? 'bg-emerald-700 text-white border-emerald-700' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
            {totalAdminPending > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                {totalAdminPending}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
