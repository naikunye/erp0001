import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wallet, TrendingUp, DollarSign, Plus, FileText, 
  Landmark, CreditCard, Sparkles, Loader2, X,
  Search, Activity, Gem, ShoppingBag, BarChart3, ArrowDown, ArrowUp, 
  AlertTriangle, ShieldCheck, ChevronRight, Clock, Filter, CheckCircle2,
  Receipt, ArrowUpRight, ArrowDownLeft, Tag, Download, Zap, MoreHorizontal,
  Layers, RefreshCw, BarChart4, PieChart, Coins, Box, Boxes, Percent, ShieldAlert, Trash2
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';
import { Transaction, TransactionCategory, PaymentMethod, TransactionType } from '../types';
import { GoogleGenAI } from "@google/genai";

type ViewMode = 'overview' | 'ledger' | 'penetration';

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'Revenue': '#10b981',
  'COGS': '#f59e0b',
  'Logistics': '#3b82f6',
  'Marketing': '#ec4899',
  'Software': '#8b5cf6',
  'Office': '#94a3b8',
  'Payroll': '#6366f1',
  'Other': '#475569'
};

const Finance: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // 压力测试参数
  const [stressLogistics, setStressLogistics] = useState(100); // %
  const [stressExchangeRate, setStressExchangeRate] = useState(7.2);

  const EXCHANGE_RATE = stressExchangeRate;

  // --- 交易入账表单状态 ---
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    category: 'Logistics',
    amount: 0,
    currency: 'CNY',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'completed',
    paymentMethod: 'Bank'
  });

  // --- 核心计算引擎 (联动库存与流水) ---
  const stats = useMemo(() => {
    let income = 0; let expense = 0; let pendingIncome = 0;
    state.transactions.forEach(t => {
      const val = t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount;
      if (t.type === 'income') { 
        if (t.status === 'completed') income += val; else pendingIncome += val; 
      } else { 
        if (t.status === 'completed') expense += val; 
      }
    });

    let inventoryCostValue = 0;
    let inventoryLogisticsValue = 0;

    const penetrationMatrix = state.products.filter(p => !p.deletedAt).map(p => {
        const stock = Math.max(p.stock || 0, 0);
        const cogs = stock * (p.costPrice || 0);
        inventoryCostValue += cogs;

        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const autoUnitWeight = Math.max(p.unitWeight || 0, unitVolWeight);
        
        let activeWeight = (p.logistics?.billingWeight && p.logistics.billingWeight > 0) 
            ? p.logistics.billingWeight 
            : (autoUnitWeight * stock);
        
        const baseRate = p.logistics?.unitFreightCost || 0;
        const rate = baseRate * (stressLogistics / 100); 
        const totalFreight = (activeWeight * rate) + (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0) + ((p.logistics?.consumablesFee || 0) * stock);
        inventoryLogisticsValue += totalFreight;

        const priceUSD = p.price || 0;
        const eco = p.economics;
        const platformUSD = priceUSD * (((eco?.platformFeePercent || 0) + (eco?.creatorFeePercent || 0)) / 100);
        const fixedUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
        const refundUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

        const totalCostUSD = (p.costPrice || 0) / EXCHANGE_RATE + (totalFreight / Math.max(1, stock)) / EXCHANGE_RATE + platformUSD + fixedUSD + refundUSD;
        const unitProfit = priceUSD - totalCostUSD;
        const totalProfit = unitProfit * stock;

        return {
            sku: p.sku, name: p.name, stock, price: priceUSD,
            unitProfit, totalProfit,
            margin: priceUSD > 0 ? (unitProfit / priceUSD) * 100 : 0,
            costs: [
                { name: '采购', value: (p.costPrice || 0) / EXCHANGE_RATE, color: '#f59e0b' },
                { name: '物流', value: (totalFreight / Math.max(1, stock)) / EXCHANGE_RATE, color: '#3b82f6' },
                { name: '运营', value: platformUSD + fixedUSD + refundUSD, color: '#8b5cf6' },
                { name: '净利', value: Math.max(0, unitProfit), color: '#10b981' }
            ]
        };
    });

    const cashBalance = income - expense;
    return { 
        cashBalance, inventoryValue: inventoryCostValue, inventoryLogisticsValue,
        totalAssetValue: cashBalance + inventoryCostValue + inventoryLogisticsValue,
        pendingIncome, penetrationMatrix
    };
  }, [state.transactions, state.products, stressLogistics, stressExchangeRate, EXCHANGE_RATE]);

  const assetDistribution = [
      { name: '可用现金', value: Math.max(0, stats.cashBalance), color: '#6366f1' },
      { name: '库存货值', value: stats.inventoryValue, color: '#f59e0b' },
      { name: '预付物流', value: stats.inventoryLogisticsValue, color: '#3b82f6' }
  ];

  const handleAiAudit = async () => {
    setIsAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `资产审计报表：现金 ¥${stats.cashBalance.toLocaleString()}, 库存 ¥${stats.inventoryValue.toLocaleString()}, 物流分摊 ¥${stats.inventoryLogisticsValue.toLocaleString()}。请分析资产流动性并指出最危险的 SKU。HTML 格式。`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiReport(response.text);
    } catch (e) { setAiReport("审计引擎离线。"); } finally { setIsAiAnalyzing(false); }
  };

  const handleAddTransaction = () => {
    if (!formData.amount || !formData.description) {
        showToast('请填写完整摘要和金额', 'warning');
        return;
    }
    const newTx: Transaction = {
        ...formData as Transaction,
        id: `TRX-${Date.now()}`
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTx });
    showToast('交易已固化至量子账本', 'success');
    setIsAddModalOpen(false);
    setFormData({
        type: 'expense', category: 'Logistics', amount: 0, currency: 'CNY',
        date: new Date().toISOString().split('T')[0], description: '', status: 'completed', paymentMethod: 'Bank'
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('确认作废此财务节点？该操作不可逆。')) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: id });
        showToast('交易节点已销毁', 'info');
    }
  };

  const filteredLedger = useMemo(() => {
    return state.transactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.transactions, searchTerm]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3 italic">
            <Wallet className="w-9 h-9 text-violet-500" />
            量子财务中枢
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-400" /> REAL-TIME PENETRATION ACTIVE
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>资产地图</button>
              <button onClick={() => setViewMode('ledger')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>流水明细</button>
              <button onClick={() => setViewMode('penetration')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'penetration' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>利润穿透</button>
           </div>
           <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-violet-900/30 transition-all active:scale-95"><Plus className="w-4 h-4" /> 记账</button>
        </div>
      </div>

      {viewMode === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-2">
                <div className="ios-glass-card p-6 border-l-4 border-l-violet-500"><div className="text-[10px] text-slate-500 font-bold uppercase mb-1">现金余额</div><div className="text-3xl font-black text-white font-mono">¥ {stats.cashBalance.toLocaleString()}</div></div>
                <div className="ios-glass-card p-6 border-l-4 border-l-amber-500"><div className="text-[10px] text-slate-500 font-bold uppercase mb-1">库存货值</div><div className="text-3xl font-black text-amber-400 font-mono">¥ {stats.inventoryValue.toLocaleString()}</div></div>
                <div className="ios-glass-card p-6 border-l-4 border-l-blue-500"><div className="text-[10px] text-slate-500 font-bold uppercase mb-1">物流资产</div><div className="text-3xl font-black text-blue-400 font-mono">¥ {stats.inventoryLogisticsValue.toLocaleString()}</div></div>
                <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500 bg-indigo-500/5"><div className="text-[10px] text-indigo-400 font-bold uppercase mb-1">权益总额</div><div className="text-3xl font-black text-white font-mono">¥ {stats.totalAssetValue.toLocaleString()}</div></div>
            </div>
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="col-span-12 lg:col-span-4 ios-glass-panel p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-6 flex items-center gap-2"><PieChart className="w-4 h-4 text-indigo-500"/> 资产分布 (Asset Mix)</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart><Pie data={assetDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{assetDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{backgroundColor:'#000', border:'none', borderRadius:'12px'}}/></RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-8 ios-glass-panel p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400"/> AI 资产穿透建议</h3><button onClick={handleAiAudit} disabled={isAiAnalyzing} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white/10">{isAiAnalyzing ? '分析中...' : '生成报告'}</button></div>
                    {aiReport ? <div className="p-5 bg-black/40 rounded-2xl border border-indigo-500/20 text-xs text-indigo-100 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiReport }}></div> : <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-20"><Gem className="w-12 h-12 mb-2"/><p className="text-[10px] uppercase font-bold tracking-widest">Awaiting Analysis Intelligence</p></div>}
                </div>
            </div>
          </>
      )}

      {viewMode === 'penetration' && (
          <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
              <div className="ios-glass-panel p-6 bg-indigo-900/10 border-indigo-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg"><ShieldAlert className="w-6 h-6"/></div>
                      <div><h2 className="text-lg font-bold text-white uppercase italic">极端成本压力测试 (Stress Test)</h2><p className="text-[10px] text-slate-500 uppercase font-mono mt-1 tracking-widest">模拟供应链波动对 SKU 获利能力的影响</p></div>
                  </div>
                  <div className="flex gap-10">
                      <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase"><span>运费波动系数</span><span>{stressLogistics}%</span></div>
                          <input type="range" min="50" max="300" step="10" value={stressLogistics} onChange={e=>setStressLogistics(parseInt(e.target.value))} className="w-48 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-emerald-400 uppercase"><span>预测汇率 (USD/CNY)</span><span>{stressExchangeRate}</span></div>
                          <input type="range" min="6.5" max="8.0" step="0.05" value={stressExchangeRate} onChange={e=>setStressExchangeRate(parseFloat(e.target.value))} className="w-48 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                      </div>
                  </div>
              </div>

              <div className="ios-glass-panel flex-1 overflow-hidden flex flex-col rounded-3xl">
                  <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-400"/> SKU 利润全景矩阵</h3>
                      <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> 采购</div>
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> 物流分摊</div>
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span> 运营/广告/佣金</div>
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span> 预期净利</div>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                      {stats.penetrationMatrix.map(sku => (
                          <div key={sku.sku} className="ios-glass-card p-5 hover:border-indigo-500/40 transition-all group overflow-hidden">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-4">
                                      <div className="text-lg font-black text-white font-mono">{sku.sku}</div>
                                      <div className="text-xs text-slate-500 font-medium truncate max-w-xs">{sku.name}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className={`text-lg font-black font-mono ${sku.totalProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${sku.totalProfit.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                      <div className="text-[10px] text-slate-500 font-bold uppercase">当前持仓预期总利</div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="flex-1 space-y-1">
                                      <div className="flex h-3 w-full rounded-full overflow-hidden border border-white/5">
                                          {sku.costs.map((c, i) => (
                                              <div key={i} style={{width: `${(c.value / sku.price) * 100}%`, backgroundColor: c.color}} className="h-full transition-all duration-700" title={`${c.name}: $${c.value.toFixed(2)}`}></div>
                                          ))}
                                      </div>
                                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                                          <span className="text-slate-500">Unit Price: <span className="text-white">${sku.price}</span></span>
                                          <span className={`${sku.margin > 20 ? 'text-emerald-400' : sku.margin > 0 ? 'text-amber-400' : 'text-red-500'}`}>Margin: {sku.margin.toFixed(1)}%</span>
                                      </div>
                                  </div>
                                  <div className="w-px h-8 bg-white/10"></div>
                                  <div className="flex flex-col items-center min-w-[60px]">
                                      <span className="text-[8px] text-slate-600 font-black uppercase">Stock</span>
                                      <span className="text-sm font-bold text-slate-300 font-mono">{sku.stock}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {viewMode === 'ledger' && (
          <div className="flex-1 ios-glass-panel rounded-3xl overflow-hidden animate-in fade-in">
              <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
                  <div className="relative"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" /><input type="text" placeholder="搜索收支协议..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none w-80"/></div>
              </div>
              <div className="overflow-y-auto h-[600px] custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-black/40 sticky top-0 z-10 border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest"><tr className="backdrop-blur-md">
                        <th className="p-5">日期</th><th className="p-5">类目</th><th className="p-5">摘要</th><th className="p-5 text-right">金额</th><th className="p-5 text-center">状态</th><th className="p-5 text-right">操作</th>
                      </tr></thead>
                      <tbody className="divide-y divide-white/5 font-mono text-xs">
                          {filteredLedger.map(t => (
                              <tr key={t.id} className="hover:bg-white/2 transition-colors group">
                                  <td className="p-5 text-slate-400">{t.date}</td>
                                  <td className="p-5 font-bold"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: CATEGORY_COLORS[t.category]}}></span>{t.category}</span></td>
                                  <td className="p-5 text-slate-100 truncate max-w-xs">{t.description}</td>
                                  <td className={`p-5 text-right font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {t.currency}</td>
                                  <td className="p-5 text-center"><span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${t.status === 'completed' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>{t.status}</span></td>
                                  <td className="p-5 text-right">
                                      <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
           <div className="w-full max-w-md bg-[#0a0a0c] border-l border-white/10 h-full relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/2">
                <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-500"/> 录入财务载荷</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-500"><X className="w-6 h-6"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                   <button onClick={() => setFormData({...formData, type: 'income'})} className={`py-3 rounded-lg text-xs font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>收入 (+)</button>
                   <button onClick={() => setFormData({...formData, type: 'expense'})} className={`py-3 rounded-lg text-xs font-bold transition-all ${formData.type === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}>支出 (-)</button>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">业务摘要</label>
                    <input type="text" placeholder="摘要..." value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-indigo-500" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="金额" value={formData.amount || ''} onChange={e=>setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-lg font-black text-white" />
                        <select value={formData.currency} onChange={e=>setFormData({...formData, currency: e.target.value as any})} className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-white"><option value="CNY">CNY</option><option value="USD">USD</option></select>
                    </div>
                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value as any})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-white">
                        {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-white" />
                        <select value={formData.paymentMethod} onChange={e=>setFormData({...formData, paymentMethod: e.target.value as any})} className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-white">
                            <option value="Bank">Bank Transfer</option>
                            <option value="PayPal">PayPal</option>
                            <option value="AliPay">AliPay</option>
                            <option value="Payoneer">Payoneer</option>
                            <option value="CreditCard">Credit Card</option>
                        </select>
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-white/10 bg-white/2">
                <button onClick={handleAddTransaction} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95"><CheckCircle2 className="w-5 h-5"/> 执行记账协议</button>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Finance;