/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileHeader, MobileNavigation } from './components/MobileNavigation';
import { StoreTab } from './components/StoreTab';
import { MyBotsTab } from './components/MyBotsTab';
import { ReferralsTab } from './components/ReferralsTab';
import { WalletTab } from './components/WalletTab';
import { AdminTab } from './components/AdminTab';
import { CheckoutModal } from './components/CheckoutModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { DailyEarnerLogo } from './components/DailyEarnerLogo';
import { Smartphone, Monitor, Sparkles, HelpCircle } from 'lucide-react';

function MainApp() {
  const { activeTab, currentUser } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [phoneFrameMode, setPhoneFrameMode] = useState(true);

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-emerald-600 selection:text-white">
      {/* Top Device Preview Bar on desktop screens */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-4xl px-4 py-2.5 text-xs text-slate-600 border-b border-emerald-100 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2">
          <DailyEarnerLogo className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-slate-800">Daily Earner Mobile App</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            Uganda & East Africa
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPhoneFrameMode(!phoneFrameMode)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
              phoneFrameMode 
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {phoneFrameMode ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span>{phoneFrameMode ? 'Phone Frame: 390px' : 'Fluid Responsive'}</span>
          </button>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Main Mobile App Container */}
      <div 
        className={`w-full transition-all duration-300 bg-white flex flex-col min-h-screen relative ${
          phoneFrameMode 
            ? 'max-w-[430px] shadow-2xl shadow-emerald-950/10 sm:my-4 sm:rounded-[36px] sm:border sm:border-emerald-100 sm:ring-1 sm:ring-emerald-200/50 sm:overflow-hidden' 
            : 'max-w-xl'
        }`}
      >
        {/* Mobile Header */}
        <MobileHeader 
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* Content View Based on Active Tab */}
        <main className="flex-1 px-4 py-4 overflow-y-auto bg-slate-50/60">
          {activeTab === 'store' && <StoreTab />}
          {activeTab === 'my-bots' && <MyBotsTab />}
          {activeTab === 'referrals' && <ReferralsTab />}
          {activeTab === 'wallet' && <WalletTab />}
          {activeTab === 'admin' && currentUser.is_admin && <AdminTab />}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNavigation />

        {/* Interactive Modals */}
        <CheckoutModal />
        <UserSwitcherModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <HelpGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

