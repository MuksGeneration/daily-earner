import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

type ManagedUser = { id: number; name: string; phone: string; is_admin: number; created_at: string };

export const AdminUsersPanel = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const token = () => localStorage.getItem('daily_earner_auth_token');
  const load = () => fetch('/api/admin/users', { headers: token() ? { Authorization: `Bearer ${token()}` } : {} }).then(r => r.json()).then(data => setUsers(data.users || [])).catch(() => setStatus('Could not load users.'));
  useEffect(() => { load(); }, []);
  const setRole = async (user: ManagedUser, isAdmin: boolean) => { setStatus(null); try { const response = await fetch(`/api/admin/users/${user.id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) }, body: JSON.stringify({ isAdmin }) }); const data = await response.json(); setStatus(data.message); if (response.ok) load(); } catch { setStatus('Unable to contact the server.'); } };
  return <section className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3"><h2 className="font-heading font-bold text-sm text-slate-900 flex gap-2 items-center"><ShieldCheck className="w-4 h-4 text-emerald-600" />User access</h2><p className="text-xs text-slate-500">Grant administrator access only to trusted staff.</p>{status && <p className="text-xs text-slate-600">{status}</p>}<div className="space-y-2">{users.map(user => <div key={user.id} className="rounded-xl border border-slate-100 p-3 flex items-center gap-2"><div className="min-w-0 flex-1"><p className="font-bold text-xs text-slate-800 truncate">{user.name}</p><p className="text-[11px] text-slate-400">{user.phone}</p></div><button onClick={() => setRole(user, !Boolean(user.is_admin))} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${user.is_admin ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-600 text-white'}`}>{user.is_admin ? 'Remove admin' : 'Make admin'}</button></div>)}</div></section>;
};
