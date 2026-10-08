import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Radio, 
  KeyRound, 
  Gift, 
  WalletCards, 
  ShieldCheck 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    licenses, 
    orders, 
    withdrawals, 
    deposits 
  } = useApp();

  const userLicensesCount = licenses.filter(l => l.user_id === currentUser.id).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const pendingAdminItems = pendingOrdersCount + withdrawals.filter(w => w.status === 'pending').length + deposits.filter(d => d.status === 'pending').length;

  const navItems = [
    {
      id: 'store',
      label: 'Bots Store',
      icon: ShoppingBag,
      badge: null
    },
    {
      id: 'signals',
      label: 'Live Radar',
      icon: Radio,
      badge: 'LIVE'
    },
    {
      id: 'licenses',
      label: 'My Bots',
      icon: KeyRound,
      badge: userLicensesCount > 0 ? userLicensesCount : null
    },
    {
      id: 'referrals',
      label: 'Earn 10%',
      icon: Gift,
      badge: 'UGX'
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: WalletCards,
      badge: null
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              id={`nav-item-${item.id}`}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 font-normal'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute -top-1.5 w-7 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge && (
                  <span className={`absolute -top-1.5 -right-2.5 text-[8px] font-extrabold px-1 rounded-full ${
                    item.badge === 'LIVE'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : item.badge === 'UGX'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-indigo-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
