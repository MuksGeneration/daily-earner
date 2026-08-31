import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { 
  X, 
  UserCheck, 
  ShieldAlert, 
  UserPlus, 
  Phone, 
  Check, 
  LogIn, 
  Sparkles,
  Gift
} from 'lucide-react';

export const UserSwitcherModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ 
  isOpen, 
  onClose 
}) => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    registerOrLoginUser, 
    getReferralBalance 
  } = useApp();

  const [mode, setMode] = useState<'switch' | 'new'>('switch');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [refCodeInput, setRefCodeInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateOrLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !phoneInput.trim()) return;

    const res = registerOrLoginUser(nameInput, phoneInput, refCodeInput);
    if (res.success) {
      setStatusMsg(res.message || 'Switched profile successfully');
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
        setNameInput('');
        setPhoneInput('');
        setRefCodeInput('');
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white border border-emerald-100 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-slideUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-sm text-slate-900">Switch Profile / Demo Users</h2>
              <p className="text-[11px] text-slate-500">Test different user roles & referral journeys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('switch')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'switch' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Demo Accounts ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'new' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            + New / Login Phone
          </button>
        </div>

        {/* 1. Switch Demo List */}
        {mode === 'switch' ? (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {users.map(u => {
              const isSelected = u.id === currentUser?.id;
              const refBal = getReferralBalance(u.id);

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    switchUser(u.id);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`}
                      alt={u.name}
                      className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{u.name}</span>
                        {u.is_admin && (
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">{u.phone}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-emerald-700 block">
                      UGX {(refBal ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">Ref Code: {u.referral_code}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 2. Create / Login Form */
          <form onSubmit={handleCreateOrLogin} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Your Full Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Mukula David"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Mobile Money Phone Number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="e.g. 0772123456"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={refCodeInput}
                onChange={(e) => setRefCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. EARN10 or leave empty"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none uppercase"
              />
            </div>

            {statusMsg && (
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              Sign In / Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
