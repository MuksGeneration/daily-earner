import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { AccountMenuModal } from './AccountMenuModal';
import { 
  Bot, 
  DollarSign, 
  Share2, 
  Wallet, 
  ShieldCheck, 
  UserCircle, 
  Bell, 
  HelpCircle, 
  Sparkles, 
  ChevronRight,
  Menu,
  X,
  Phone,
  CheckCircle2,
  Sliders,
  LogOut
} from 'lucide-react';

export const MobileHeader: React.FC<{ onOpenAuth: () => void; onOpenHelp: () => void; onLogout?: () => void }> = ({ onOpenAuth, onOpenHelp, onLogout }) => {
  const { currentUser, getReferralBalance, beginnerMode, setBeginnerMode, signals } = useApp();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const availableBal = getReferralBalance ? getReferralBalance(currentUser?.id ?? 0) ?? 0 : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-2.5 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & User Greeting */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
            <DailyEarnerLogo className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 tracking-tight">Daily Earner</span>
              {currentUser?.is_admin && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[130px] font-medium">
              Hi, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Member'} 👋
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Beginner Mode Switch */}
          <button
            id="btn-beginner-toggle"
            onClick={() => setBeginnerMode(!beginnerMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              beginnerMode
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Simple Guide Mode"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{beginnerMode ? 'Easy ON' : 'Easy Mode'}</span>
          </button>

          {/* Quick Balance Pill */}
          <div 
            onClick={() => setIsAccountMenuOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
            <span className="text-[11px] font-extrabold text-emerald-700 font-mono">
              UGX {(availableBal ?? 0).toLocaleString()}
            </span>
          </div>

          {/* User Profile Avatar / Switcher */}
          <button
            id="btn-user-profile"
            onClick={() => setIsAccountMenuOpen(true)}
            className="w-8 h-8 rounded-full bg-white border border-emerald-200 overflow-hidden flex items-center justify-center text-slate-700 hover:border-emerald-400 transition-colors shadow-2xs"
          >
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-5 h-5 text-emerald-700" />
            )}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors shadow-2xs"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Market Alert Marquee */}
      {signals.length > 0 && (
        <div className="max-w-md mx-auto mt-2 pt-1.5 border-t border-emerald-50 flex items-center gap-2 overflow-hidden text-[11px]">
          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            Live Signal
          </span>
          <div className="truncate text-slate-600">
            <span className="font-bold text-slate-900">{signals[0].pair}</span>: {signals[0].details}
          </div>
        </div>
      )}
      <AccountMenuModal isOpen={isAccountMenuOpen} onClose={() => setIsAccountMenuOpen(false)} />
    </header>
  );
};

export const MobileNavigation: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, licenses, orders } = useApp();

  const activeLicensesCount = licenses.filter(l => l.user_id === currentUser.id && l.status === 'active').length;
  const pendingOrdersCount = currentUser.is_admin 
    ? orders.filter(o => o.status === 'pending').length 
    : orders.filter(o => o.user_id === currentUser.id && o.status === 'pending').length;

  const navItems = [
    { id: 'store', label: 'Store', icon: Bot },
    { 
      id: 'my-bots', 
      label: 'My Bots', 
      icon: Sliders,
      badge: activeLicensesCount > 0 ? activeLicensesCount : undefined,
      badgeColor: 'bg-emerald-600 text-white'
    },
    { 
      id: 'referrals', 
      label: 'Refer & Earn', 
      icon: DollarSign,
      highlight: true
    },
    { 
      id: 'wallet', 
      label: 'Wallet', 
      icon: Wallet 
    },
    ...(currentUser.is_admin ? [{
      id: 'admin',
      label: 'Admin',
      icon: ShieldCheck,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-emerald-700 text-white'
    }] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-emerald-100/90 pb-safe shadow-lg shadow-emerald-950/5">
      <div className="max-w-md mx-auto grid grid-cols-4 sm:grid-cols-5 gap-1 px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 bg-emerald-50/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-emerald-600 scale-105' : 'stroke-[1.8px]'} transition-transform`} />
                {item.badge !== undefined && (
                  <span className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full shadow-xs ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate w-full text-center">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0.5 w-6 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
