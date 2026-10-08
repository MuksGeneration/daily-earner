import { useEffect, useState, type FormEvent } from 'react';

type Campaign = { id: number; code: string; max_reward_ugx: number; redemption_count: number; status: 'active' | 'expired' };

export const AdminTreasurePanel = () => {
  const [amount, setAmount] = useState('20000');
  const [status, setStatus] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const token = () => localStorage.getItem('daily_earner_auth_token');
  const load = async () => {
    const response = await fetch('/api/admin/treasure-chests', { headers: { Authorization: `Bearer ${token() || ''}` } });
    const data = await response.json();
    setCampaigns(data.chests || []);
  };
  useEffect(() => { void load(); }, []);
  const create = async (event: FormEvent) => {
    event.preventDefault(); setStatus('');
    const response = await fetch('/api/admin/treasure-chests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token() || ''}` }, body: JSON.stringify({ rewardAmount: Number(amount) }) });
    const data = await response.json(); setStatus(data.message || (response.ok ? 'Shared code created.' : 'Could not create code.'));
    if (response.ok) void load();
  };
  return <section className="space-y-3 rounded-2xl border border-amber-200 bg-white p-4">
    <h2 className="font-bold text-slate-900">🎁 Shared Treasure Chest</h2>
    <p className="text-xs text-slate-500">One code works for every user once. Each redemption receives a random reward up to the selected cap.</p>
    <form onSubmit={create} className="space-y-2"><select value={amount} onChange={event => setAmount(event.target.value)} className="w-full rounded-xl border p-2 text-sm">{[5000, 10000, 15000, 20000].map(value => <option value={value} key={value}>Random reward up to UGX {value.toLocaleString()}</option>)}</select><button className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-white">Create shared code</button></form>
    {status && <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">{status}</p>}
    <div className="max-h-48 overflow-auto text-xs">{campaigns.map(campaign => <p className="border-b py-2" key={campaign.id}><b>{campaign.code}</b> · up to UGX {Number(campaign.max_reward_ugx).toLocaleString()} · {campaign.redemption_count} redeemed · {campaign.status}</p>)}</div>
  </section>;
};
