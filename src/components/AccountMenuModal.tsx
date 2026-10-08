import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, KeyRound, Landmark, LockKeyhole, MessageCircleMore, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

type View = 'menu' | 'balance' | 'messages' | 'login' | 'trade';

export const AccountMenuModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, ledger, setActiveTab } = useApp();
  const [view, setView] = useState<View>('menu');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: number; subject: string; body: string; created_at: string; sender_name: string }>>([]);
  const close = () => { setView('menu'); setStatus(null); setCurrentPassword(''); setNewPassword(''); onClose(); };
  const transactions = useMemo(() => ledger.filter(item => item.user_id === currentUser.id).slice(0, 8), [ledger, currentUser.id]);
  useEffect(() => { if (!isOpen) return; const token = localStorage.getItem('daily_earner_auth_token'); fetch('/api/messages', { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.json()).then(data => setMessages(data.messages || [])).catch(() => undefined); }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;
  const changePassword = async (kind: 'login' | 'trade') => {
    setStatus(null);
    try {
      const token = localStorage.getItem('daily_earner_auth_token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ kind, currentPassword, newPassword })
      });
      const data = await response.json();
      setStatus(data.message || (response.ok ? 'Password updated.' : 'Could not update password.'));
      if (response.ok) { setCurrentPassword(''); setNewPassword(''); }
    } catch { setStatus('Unable to contact the server.'); }
  };
  const rows = [
    { id: 'balance' as const, icon: Landmark, title: 'Balance Record', subtitle: 'Transaction history', tone: 'bg-emerald-100 text-emerald-700' },
    { id: 'messages' as const, icon: MessageCircleMore, title: 'Messages', subtitle: 'Notifications & mail', tone: 'bg-amber-100 text-amber-700' },
    { id: 'login' as const, icon: LockKeyhole, title: 'Login Password', subtitle: 'Change login password', tone: 'bg-violet-100 text-violet-700' },
    { id: 'trade' as const, icon: KeyRound, title: 'Trade Password', subtitle: 'Change trade PIN', tone: 'bg-yellow-100 text-yellow-700' }
  ];

  return <div onClick={close} className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm flex items-start justify-center px-3 pt-16 sm:pt-20">
    <section onClick={event => event.stopPropagation()} className="w-full max-w-md max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl origin-top animate-[menuDrop_180ms_ease-out]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
        <div className="flex items-center gap-2">{view !== 'menu' && <button onClick={() => { setView('menu'); setStatus(null); }} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Back to account menu"><ArrowLeft className="w-5 h-5" /></button>}<div><h2 className="font-serif font-bold text-lg text-slate-800">{view === 'menu' ? 'My Account' : view === 'balance' ? 'Balance Record' : view === 'messages' ? 'Messages' : `Change ${view === 'trade' ? 'Trade' : 'Login'} Password`}</h2><p className="text-xs text-slate-500">{currentUser.name} · User ID: DE-{String(currentUser.id).padStart(6, '0')}</p></div></div>
        <button onClick={close} className="p-2 rounded-full text-slate-400 hover:bg-slate-100" aria-label="Close account menu"><X className="w-5 h-5" /></button>
      </div>
      {view === 'menu' && <div className="divide-y divide-emerald-100">{rows.map(row => { const Icon = row.icon; return <button key={row.id} onClick={() => setView(row.id)} className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-emerald-50/50"><span className={`grid place-items-center w-12 h-12 rounded-2xl ${row.tone}`}><Icon className="w-6 h-6" /></span><span className="flex-1"><span className="block font-serif font-bold text-lg text-slate-800">{row.title}</span><span className="text-sm text-slate-400">{row.subtitle}</span></span><ChevronRight className="w-5 h-5 text-sky-300" /></button>; })}</div>}
      {view === 'balance' && <div className="p-5 space-y-3 max-h-[60vh] overflow-auto">{transactions.length ? transactions.map(item => <div key={item.id} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"><div><p className="font-semibold text-slate-800">{item.reason.replace(/_/g, ' ')}</p><p className="text-xs text-slate-400">{item.created_at}</p></div><b className={item.amount_ugx >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{item.amount_ugx >= 0 ? '+' : ''}UGX {item.amount_ugx.toLocaleString()}</b></div>) : <p className="py-8 text-center text-sm text-slate-500">No transactions yet.</p>}<button onClick={() => { setActiveTab('wallet'); close(); }} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white">Open Wallet</button></div>}
      {view === 'messages' && <div className="p-5 space-y-3 max-h-[60vh] overflow-auto">{messages.length ? messages.map(message => <article key={message.id} className="rounded-xl border border-emerald-100 p-3"><p className="font-bold text-slate-800">{message.subject}</p><p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{message.body}</p><p className="mt-2 text-[11px] text-slate-400">From {message.sender_name} · {new Date(message.created_at).toLocaleString()}</p></article>) : <div className="py-8 text-center text-sm text-slate-500"><MessageCircleMore className="w-10 h-10 mx-auto mb-3 text-emerald-300" />You have no messages.</div>}</div>}
      {(view === 'login' || view === 'trade') && <div className="p-5 space-y-3"><input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" placeholder={`Current ${view === 'trade' ? 'trade PIN' : 'password'}`} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /><input value={newPassword} onChange={e => setNewPassword(e.target.value)} inputMode={view === 'trade' ? 'numeric' : undefined} maxLength={view === 'trade' ? 6 : undefined} type="password" placeholder={view === 'trade' ? 'New 6-digit trade PIN' : 'New login password (6+ characters)'} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />{status && <p className="text-sm text-slate-600">{status}</p>}<button onClick={() => changePassword(view)} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white">Update Password</button></div>}
    </section>
  </div>;
};
