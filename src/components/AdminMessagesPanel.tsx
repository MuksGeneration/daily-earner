import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const AdminMessagesPanel = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const send = async (event: React.FormEvent) => { event.preventDefault(); setStatus(null); const token = localStorage.getItem('daily_earner_auth_token'); try { const response = await fetch('/api/admin/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ subject, body }) }); const data = await response.json(); setStatus(data.message || (response.ok ? 'Message sent.' : 'Could not send message.')); if (response.ok) { setSubject(''); setBody(''); } } catch { setStatus('Unable to contact the server.'); } };
  return <form onSubmit={send} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3"><h2 className="font-heading font-bold text-sm text-slate-900 flex gap-2 items-center"><Send className="w-4 h-4 text-emerald-600" />Broadcast message</h2><p className="text-xs text-slate-500">This message will be delivered to every registered user.</p><input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><textarea required value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />{status && <p className="text-xs text-slate-600">{status}</p>}<button className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">Send to all users</button></form>;
};
