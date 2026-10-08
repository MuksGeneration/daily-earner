import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Settings, 
  Package, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Users, 
  Send, 
  Sparkles, 
  Search,
  X,
  ArrowDownCircle,
  WalletCards,
  Check
  ,Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminMessagesPanel } from './AdminMessagesPanel';
import { AdminUsersPanel } from './AdminUsersPanel';
import { AdminTreasurePanel } from './AdminTreasurePanel';

export const AdminTab: React.FC = () => {
  const { 
    currentUser, 
    orders, 
    deposits, 
    withdrawals, 
    products, 
    settings, 
    auditLogs, 
    fraudFlags, 
    adminApproveOrder, 
    adminRejectOrder, 
    adminApproveDeposit, 
    adminRejectDeposit, 
    adminPayWithdrawal, 
    adminRejectWithdrawal,
    adminUpdateSettings,
    adminAddProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    users
  } = useApp();

  const [adminSubTab, setAdminSubTab] = useState<'pending' | 'products' | 'settings' | 'audit' | 'fraud' | 'messages' | 'users' | 'treasure'>('pending');
  const [payoutTxModal, setPayoutTxModal] = useState<{ 
    isOpen: boolean; 
    withdrawalId?: number; 
    user_name?: string; 
    payout_name?: string;
    payout_phone?: string;
    momo_network?: string;
    amount?: number 
  }>({ isOpen: false });
  const [txIdInput, setTxIdInput] = useState('');
  const [rejectReasonModal, setRejectReasonModal] = useState<{ isOpen: boolean; type?: 'order' | 'deposit' | 'withdrawal'; id?: number }>({ isOpen: false });
  const [rejectReason, setRejectReason] = useState('');

  // Settings form state
  const [mtnNumber, setMtnNumber] = useState(settings.mtn_merchant_number);
  const [mtnName, setMtnName] = useState(settings.mtn_merchant_name);
  const [airtelNumber, setAirtelNumber] = useState(settings.airtel_merchant_number);
  const [airtelName, setAirtelName] = useState(settings.airtel_merchant_name);
  const [minWithdrawal, setMinWithdrawal] = useState(settings.min_withdrawal_ugx.toString());
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Product management state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Crypto Arbitrage' as const,
    tagline: '',
    description: '',
    stockAvailable: '',
    iconSvg: '',
    daily_earning_ugx: '',
    basicPrice: '',
    basicEarning: '',
    proPrice: '',
    proEarning: ''
  });
  const [productSaved, setProductSaved] = useState(false);
  const [productDeleteMessage, setProductDeleteMessage] = useState<string | null>(null);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const totalPending = pendingOrders.length + pendingDeposits.length + pendingWithdrawals.length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateSettings({
      mtn_merchant_number: mtnNumber,
      mtn_merchant_name: mtnName,
      airtel_merchant_number: airtelNumber,
      airtel_merchant_name: airtelName,
      min_withdrawal_ugx: parseInt(minWithdrawal, 10) || 0
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleConfirmPayout = () => {
    if (payoutTxModal.withdrawalId && txIdInput) {
      adminPayWithdrawal(payoutTxModal.withdrawalId, txIdInput);
      try {
        confetti({ particleCount: 50, spread: 45, origin: { y: 0.6 } });
      } catch {}
      setPayoutTxModal({ isOpen: false });
      setTxIdInput('');
    }
  };

  const handleConfirmReject = () => {
    if (rejectReasonModal.id && rejectReasonModal.type) {
      if (rejectReasonModal.type === 'order') {
        adminRejectOrder(rejectReasonModal.id, rejectReason || 'Payment not located on Mobile Money statement');
      } else if (rejectReasonModal.type === 'deposit') {
        adminRejectDeposit(rejectReasonModal.id, rejectReason || 'Transaction reference unverified');
      } else if (rejectReasonModal.type === 'withdrawal') {
        adminRejectWithdrawal(rejectReasonModal.id, rejectReason || 'Account details mismatch');
      }
      setRejectReasonModal({ isOpen: false });
      setRejectReason('');
    }
  };

  const handleOpenProductForm = (productId?: number) => {
    if (productId) {
      const prod = products.find(p => p.id === productId);
      if (prod) {
        const basicTier = prod.tiers.find(t => t.name === 'Basic');
        const proTier = prod.tiers.find(t => t.name === 'Pro');
        setProductForm({
          name: prod.name,
          category: prod.category,
          tagline: prod.tagline,
          description: prod.description,
          stockAvailable: prod.stock_available.toString(),
          iconSvg: prod.icon_svg || '',
          daily_earning_ugx: prod.daily_earning_ugx.toString(),
          basicPrice: basicTier?.price_ugx.toString() || '',
          basicEarning: basicTier?.daily_earning_ugx?.toString() || '',
          proPrice: proTier?.price_ugx.toString() || '',
          proEarning: proTier?.daily_earning_ugx?.toString() || ''
        });
        setEditingProductId(productId);
      }
    } else {
      setProductForm({
        name: '',
        category: 'Crypto Arbitrage',
        tagline: '',
        description: '',
        stockAvailable: '0',
        iconSvg: '',
        daily_earning_ugx: '',
        basicPrice: '',
        basicEarning: '',
        proPrice: '',
        proEarning: ''
      });
      setEditingProductId(null);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const dailyEarning = parseInt(productForm.daily_earning_ugx, 10) || 0;
    const stockAvailable = Math.max(0, parseInt(productForm.stockAvailable, 10) || 0);
    
    if (editingProductId) {
      // Update existing product
      adminUpdateProduct(editingProductId, {
        name: productForm.name,
        category: productForm.category,
        tagline: productForm.tagline,
        description: productForm.description,
        stock_available: stockAvailable,
        icon_svg: productForm.iconSvg || undefined,
        daily_earning_ugx: dailyEarning,
        tiers: [
          {
            id: 100 + editingProductId,
            product_id: editingProductId,
            name: 'Basic',
            price_ugx: parseInt(productForm.basicPrice, 10) || 0,
            daily_earning_ugx: parseInt(productForm.basicEarning, 10) || 0,
            capacity_note: `Daily Yield UGX ${productForm.basicEarning}/day`,
            sort_order: 1,
            features: []
          },
          {
            id: 200 + editingProductId,
            product_id: editingProductId,
            name: 'Pro',
            price_ugx: parseInt(productForm.proPrice, 10) || 0,
            daily_earning_ugx: parseInt(productForm.proEarning, 10) || 0,
            capacity_note: `Daily Yield UGX ${productForm.proEarning}/day`,
            sort_order: 2,
            features: []
          }
        ]
      } as any);
    } else {
      // Add new product
      adminAddProduct({
        name: productForm.name,
        category: productForm.category,
        tagline: productForm.tagline,
        description: productForm.description,
        icon: 'Cpu',
        icon_svg: productForm.iconSvg || undefined,
        daily_earning_ugx: dailyEarning,
        stock_available: stockAvailable,
        total_stock: stockAvailable,
        duration_days: 0,
        lifetime_license: true,
        active: true,
        sort_order: products.length + 1,
        slug: productForm.name.toLowerCase().replace(/\s+/g, '-'),
        avg_daily_signals: 20,
        historical_accuracy: 90,
        tiers: [
          {
            id: 100 + (products.length + 1),
            product_id: products.length + 1,
            name: 'Basic',
            price_ugx: parseInt(productForm.basicPrice, 10) || 0,
            daily_earning_ugx: parseInt(productForm.basicEarning, 10) || 0,
            capacity_note: `Daily Yield UGX ${productForm.basicEarning}/day`,
            sort_order: 1,
            features: []
          },
          {
            id: 200 + (products.length + 1),
            product_id: products.length + 1,
            name: 'Pro',
            price_ugx: parseInt(productForm.proPrice, 10) || 0,
            daily_earning_ugx: parseInt(productForm.proEarning, 10) || 0,
            capacity_note: `Daily Yield UGX ${productForm.proEarning}/day`,
            sort_order: 2,
            features: []
          }
        ]
      } as any);
    }
    setProductSaved(true);
    setTimeout(() => setProductSaved(false), 2000);
    setProductModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Admin Title Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <DailyEarnerLogo className="w-5 h-5 text-white" color="#ffffff" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">Administrator Panel</span>
              <h1 className="font-heading font-extrabold text-sm text-white">Daily Earner Backoffice</h1>
            </div>
          </div>
          <span className="text-[11px] font-mono text-white bg-white/20 px-2 py-0.5 rounded font-bold">
            {currentUser.name.split(' ')[0]} (Admin)
          </span>
        </div>

        {/* Sub-nav Tabs */}
        <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-emerald-600/60 text-center">
          <button
            onClick={() => setAdminSubTab('pending')}
            className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all relative ${
              adminSubTab === 'pending'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <span>Approvals</span>
            {totalPending > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono">
                {totalPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminSubTab('products')}
            className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all ${
              adminSubTab === 'products'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <span>Products</span>
          </button>

          <button
            onClick={() => setAdminSubTab('settings')}
            className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all ${
              adminSubTab === 'settings'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <span>MoMo Config</span>
          </button>

          <button
            onClick={() => setAdminSubTab('audit')}
            className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all ${
              adminSubTab === 'audit'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'bg-emerald-800/60 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <span>Audit Log</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2"><button onClick={() => setAdminSubTab('messages')} className={`py-2 rounded-xl text-xs font-bold ${adminSubTab === 'messages' ? 'bg-emerald-700 text-white' : 'bg-white border border-emerald-200 text-emerald-800'}`}>Messages</button><button onClick={() => setAdminSubTab('users')} className={`py-2 rounded-xl text-xs font-bold ${adminSubTab === 'users' ? 'bg-emerald-700 text-white' : 'bg-white border border-emerald-200 text-emerald-800'}`}>Users</button><button onClick={() => setAdminSubTab('treasure')} className={`py-2 rounded-xl text-xs font-bold ${adminSubTab === 'treasure' ? 'bg-emerald-700 text-white' : 'bg-white border border-emerald-200 text-emerald-800'}`}>Treasure</button></div>

      {/* 1. Pending Approvals View */}
      {adminSubTab === 'messages' && <AdminMessagesPanel />}
      {adminSubTab === 'users' && <AdminUsersPanel />}
      {adminSubTab === 'treasure' && <AdminTreasurePanel />}
      {adminSubTab === 'pending' && (
        <div className="space-y-4">
          {/* Pending Orders */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Pending License Orders</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                {pendingOrders.length}
              </span>
            </div>

            {pendingOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center">No pending license purchases.</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 block">{ord.product_name || 'Bot License'}</span>
                        <span className="text-[11px] text-slate-500">Buyer: {ord.user_name} ({ord.user_phone})</span>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-700">
                        UGX {(ord.amount_ugx ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-0.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-bold text-slate-800">{ord.payment_method.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ref Code:</span>
                        <span className="font-mono font-bold text-slate-900">{ord.payment_ref || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => adminApproveOrder(ord.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Issue License</span>
                      </button>
                      <button
                        onClick={() => setRejectReasonModal({ isOpen: true, type: 'order', id: ord.id })}
                        className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                <span>Pending Referral Cashouts</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                {pendingWithdrawals.length}
              </span>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center">No pending cashout payouts.</p>
            ) : (
              <div className="space-y-3">
                {pendingWithdrawals.map((w) => (
                  <div key={w.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900">{w.user_name || w.payout_name}</span>
                        <span className="text-[11px] text-slate-500 block">{w.momo_network} • {w.payout_phone}</span>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-700 text-sm">
                        UGX {(w.amount_ugx ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setPayoutTxModal({ 
                          isOpen: true, 
                          withdrawalId: w.id, 
                          user_name: w.user_name || 'Member',
                          payout_name: w.payout_name || w.user_name || 'Member',
                          payout_phone: w.payout_phone,
                          momo_network: w.momo_network,
                          amount: w.amount_ugx 
                        })}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm MoMo Payout</span>
                      </button>
                      <button
                        onClick={() => setRejectReasonModal({ isOpen: true, type: 'withdrawal', id: w.id })}
                        className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Wallet Deposits */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <WalletCards className="w-4 h-4 text-emerald-600" />
                <span>Pending Wallet Deposits</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                {pendingDeposits.length}
              </span>
            </div>

            {pendingDeposits.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center">No pending wallet deposits.</p>
            ) : (
              <div className="space-y-3">
                {pendingDeposits.map((dep) => (
                  <div key={dep.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900">{dep.user_name}</span>
                        <span className="text-[11px] text-slate-500 block">{dep.payment_method.toUpperCase()} • Ref: {dep.payment_ref}</span>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-700 text-sm">
                        UGX {(dep.amount_ugx ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => adminApproveDeposit(dep.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Credit User Wallet</span>
                      </button>
                      <button
                        onClick={() => setRejectReasonModal({ isOpen: true, type: 'deposit', id: dep.id })}
                        className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Products Management */}
      {adminSubTab === 'products' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm text-slate-900">
              Active Bot Catalog ({products.length})
            </h2>
            <button
              onClick={() => handleOpenProductForm()}
              className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Bot</span>
            </button>
          </div>

          {productSaved && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              <span>Bot saved successfully!</span>
            </div>
          )}

          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-[11px] text-slate-600">{p.tagline}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                    {p.category}
                  </span>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {p.tiers.map((t) => (
                    <div key={t.id} className="bg-white px-2 py-1.5 rounded border border-slate-200 text-[10px] space-y-0.5">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-slate-600">Price: <span className="font-mono">UGX {t.price_ugx.toLocaleString()}</span></div>
                      <div className="text-emerald-700 font-semibold">Earn: <span className="font-mono">UGX {t.daily_earning_ugx?.toLocaleString() || 0}/day</span></div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleOpenProductForm(p.id)} className="py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all">Edit Bot</button>
                  <button onClick={() => { if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return; const result = adminDeleteProduct(p.id); setProductDeleteMessage(result.message); }} className="py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                </div>
              </div>
            ))}
          </div>
          {productDeleteMessage && <p className="text-xs text-slate-600">{productDeleteMessage}</p>}
        </div>
      )}

      {/* 3. Settings Form */}
      {adminSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3.5 text-xs">
          <h2 className="font-heading font-bold text-sm text-slate-900">
            Mobile Money Merchant Configuration
          </h2>

          <div>
            <label className="text-slate-700 font-bold block mb-1">MTN MoMo Merchant Code (*165*3#)</label>
            <input
              type="text"
              value={mtnNumber}
              onChange={(e) => setMtnNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">MTN Merchant Account Name</label>
            <input
              type="text"
              value={mtnName}
              onChange={(e) => setMtnName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Airtel Money Merchant Code (*185*9#)</label>
            <input
              type="text"
              value={airtelNumber}
              onChange={(e) => setAirtelNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Airtel Merchant Account Name</label>
            <input
              type="text"
              value={airtelName}
              onChange={(e) => setAirtelName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Minimum Referral Cashout (UGX)</label>
            <input
              type="number"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          {settingsSaved && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
              Settings updated successfully!
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-600/20 transition-all"
          >
            Save Merchant Configuration
          </button>
        </form>
      )}

      {/* 4. Audit Log View */}
      {adminSubTab === 'audit' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
          <h2 className="font-heading font-bold text-sm text-slate-900">
            System Security & Audit Trail ({auditLogs.length})
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{log.details}</p>
                <span className="text-[10px] text-emerald-700 font-semibold">By: {log.admin_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-emerald-100 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-xs my-8">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">{editingProductId ? 'Edit Bot' : 'Add New Bot'}</span>
              <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              {/* Bot Name */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Bot Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. FX1 Hood Machine"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Category *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs"
                >
                  <option>Crypto Arbitrage</option>
                  <option>Forex Scalping</option>
                  <option>Commodities</option>
                  <option>Sports Value</option>
                </select>
              </div>

              {/* Tagline */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Tagline *</label>
                <input
                  type="text"
                  value={productForm.tagline}
                  onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                  placeholder="Short description"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Bots Available *</label>
                  <input type="number" min="0" value={productForm.stockAvailable} onChange={(e) => setProductForm({ ...productForm, stockAvailable: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs" required />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Bot icon (SVG)</label>
                  <input type="file" accept="image/svg+xml,.svg" className="w-full text-[10px] pt-1" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 4_000_000) return alert('SVG must be 4 MB or smaller.'); const reader = new FileReader(); reader.onload = () => { const svg = String(reader.result || ''); if (!/^\s*<svg[\s>]/i.test(svg) || /<script|\son\w+\s*=|javascript:/i.test(svg)) return alert('Use a safe SVG file without scripts.'); setProductForm({ ...productForm, iconSvg: svg }); }; reader.readAsText(file); }} />
                </div>
              </div>
              {productForm.iconSvg && <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 flex items-center gap-2"><img src={`data:image/svg+xml,${encodeURIComponent(productForm.iconSvg)}`} className="w-8 h-8" alt="Bot icon preview" /><span className="text-[10px] text-emerald-800">SVG icon ready</span></div>}

              {/* Basic Tier */}
              <div className="border-t border-slate-200 pt-3">
                <h3 className="font-bold text-slate-900 mb-2">Basic Tier</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-slate-700 font-semibold block text-[11px] mb-1">Price (UGX) *</label>
                    <input
                      type="number"
                      value={productForm.basicPrice}
                      onChange={(e) => setProductForm({ ...productForm, basicPrice: e.target.value })}
                      placeholder="20000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block text-[11px] mb-1">Daily Earning (UGX) *</label>
                    <input
                      type="number"
                      value={productForm.basicEarning}
                      onChange={(e) => setProductForm({ ...productForm, basicEarning: e.target.value })}
                      placeholder="5000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pro Tier */}
              <div className="border-t border-slate-200 pt-3">
                <h3 className="font-bold text-slate-900 mb-2">Pro Tier</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-slate-700 font-semibold block text-[11px] mb-1">Price (UGX) *</label>
                    <input
                      type="number"
                      value={productForm.proPrice}
                      onChange={(e) => setProductForm({ ...productForm, proPrice: e.target.value })}
                      placeholder="50000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block text-[11px] mb-1">Daily Earning (UGX) *</label>
                    <input
                      type="number"
                      value={productForm.proEarning}
                      onChange={(e) => setProductForm({ ...productForm, proEarning: e.target.value })}
                      placeholder="12500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {editingProductId ? 'Update Bot' : 'Add Bot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {payoutTxModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-emerald-100 rounded-2xl p-5 max-w-xs w-full space-y-3 shadow-2xl text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Confirm Cashout Disbursement</span>
              <button onClick={() => setPayoutTxModal({ isOpen: false })} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <strong className="text-emerald-700 font-mono">UGX {(payoutTxModal.amount ?? 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payout Phone:</span>
                <strong className="text-slate-900 font-mono">{payoutTxModal.payout_phone || '---'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered SIM Name:</span>
                <strong className="text-slate-900">{payoutTxModal.payout_name || payoutTxModal.user_name || '---'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network:</span>
                <strong className="text-slate-900">{payoutTxModal.momo_network || 'MTN / Airtel'}</strong>
              </div>
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Enter MoMo Telco SMS Tx ID:</label>
              <input
                type="text"
                value={txIdInput}
                onChange={(e) => setTxIdInput(e.target.value)}
                placeholder="e.g. 1948271038"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>
            <button
              onClick={handleConfirmPayout}
              disabled={!txIdInput}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
            >
              Confirm Paid
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectReasonModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-emerald-100 rounded-2xl p-5 max-w-xs w-full space-y-3 shadow-2xl text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Provide Rejection Reason</span>
              <button onClick={() => setRejectReasonModal({ isOpen: false })} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Ref code not found in MoMo statement"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <button
              onClick={handleConfirmReject}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
