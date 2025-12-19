
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wallet, TrendingUp, DollarSign, Plus, FileText, 
  Landmark, CreditCard, Sparkles, Loader2, X,
  Search, Activity, Gem, ShoppingBag, BarChart3, ArrowDown, ArrowUp, 
  AlertTriangle, ShieldCheck, ChevronRight, Clock, Filter, CheckCircle2,
  Receipt, ArrowUpRight, ArrowDownLeft, Tag, Download, Zap, MoreHorizontal,
  Layers, RefreshCw, BarChart4, PieChart, Coins, Box, Boxes
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';
import { Transaction, TransactionCategory, PaymentMethod, TransactionType } from '../types';
import { GoogleGenAI } from "@google/genai";

type ViewMode = 'overview' | 'ledger' | 'penetration';

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'Revenue': '#10b981',   // Emerald
  'COGS': '#f59e0b',      // Amber
  'Logistics': '#3b82f6',  // Blue
  'Marketing': '#ec4899',  // Pink
  'Software': '#8b5cf6',   // Violet
  'Office': '#94a3b8',     // Slate
  'Payroll': '#6366f1',    // Indigo
  'Other': '#475569'       // Dark Slate
};

const Finance: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const EXCHANGE_RATE = 7.23;

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

  // --- 核心计算引擎 (关联库存与流水) ---
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;

    // 1. 流水计算
    state.transactions.forEach(t => {
      const val = t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount;
      if (t.type === 'income') {
        if (t.status === 'completed') income += val;
        else pendingIncome += val;
      } else {
        if (t.status === 'completed') expense += val;
        else pendingExpense += val;
      }
    });

    // 2. 库存资产核算 (关联智能备货数据)
    let inventoryCostValue = 0;
    let inventoryLogisticsValue = 0;

    state.products.filter(p => !p.deletedAt).forEach(p => {
        const stock = p.stock || 0;
        // 采购货值
        inventoryCostValue += stock * (p.costPrice || 0);
        
        // 头程物流资产 (已支付运费但在库中)
        const unitFreight = (p.logistics?.unitFreightCost || 0) * (p.unitWeight || 0.5);
        inventoryLogisticsValue += stock * unitFreight;
    });

    const cashBalance = income - expense;
    const totalAssetValue = cashBalance + inventoryCostValue + inventoryLogisticsValue;

    return { 
        income, 
        expense, 
        cashBalance, 
        pendingIncome, 
        pendingExpense,
        inventoryValue: inventoryCostValue,
        inventoryLogisticsValue,
        totalAssetValue
    };
  }, [state.transactions, state.products]);

  // --- 资产分配图表数据 ---
  const assetDistribution = useMemo(() => [
      { name: '现金余额', value: Math.max(0, stats.cashBalance), color: '#6366f1' },
      { name: '备货货值', value: stats.inventoryValue, color: '#f59e0b' },
      { name: '在途/在库运费', value: stats.inventoryLogisticsValue, color: '#3b82f6' }
  ], [stats]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    state.transactions.filter(t => t.type === 'expense').forEach(t => {
      const val = t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount;
      data[t.category] = (data[t.category] || 0) + val;
    });
    return Object.keys(data).map(k => ({ name: k, value: data[k] }));
  }, [state.transactions]);

  const filteredLedger = useMemo(() => {
    return [...state.transactions]
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, searchTerm]);

  // --- AI 财务智能诊断 (引入库存维度) ---
  const handleAiAudit = async () => {
    setIsAiAnalyzing(true);
    setAiReport(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        你是一个资深跨境电商财务官。分析当前财务与库存勾稽数据：
        现金余额: ¥${stats.cashBalance.toLocaleString()}, 
        库存资产占用: ¥${stats.inventoryValue.toLocaleString()},
        在库物流成本: ¥${stats.inventoryLogisticsValue.toLocaleString()},
        待收账款: ¥${stats.pendingIncome.toLocaleString()}。
        请评估资金流动性，特别是库存占用是否过高。给出简洁的资金链建议，使用 HTML 格式。
      `;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiReport(response.text);
    } catch (e) {
      setAiReport("<b>系统繁忙:</b> 无法连接到量子审计引擎。");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAddTransaction = () => {
    if (!formData.amount || !formData.description) return showToast('请填写金额和摘要', 'warning');
    const newTx: Transaction = {
      ...formData as any,
      id: `TRX-${Date.now()}`
    };
    dispatch({ type: 'HYDRATE_STATE', payload: { transactions: [newTx, ...state.transactions] } });
    showToast('交易已记入量子账本', 'success');
    setIsAddModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      {/* 顶部导航与快捷操作 */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3 italic">
            <Wallet className="w-9 h-9 text-violet-500" />
            量子财务中枢 (资产全景)
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500" /> 财务与库存实时勾稽协议已开启 • 汇率: 1:{EXCHANGE_RATE}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>总览地图</button>
              <button onClick={() => setViewMode('ledger')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>流水明细</button>
              <button onClick={() => setViewMode('penetration')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'penetration' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>盈利穿透</button>
           </div>
           <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-violet-900/30 transition-all active:scale-95"
           >
              <Plus className="w-4 h-4" /> 记录新交易
           </button>
        </div>
      </div>

      {/* 核心资产看板 - 引入库存资金 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="ios-glass-card p-6 border-l-4 border-l-violet-500 relative overflow-hidden group">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] group-hover:scale-110 transition-transform"><Landmark className="w-32 h-32 text-white"/></div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">现金账户余额</div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">¥ {stats.cashBalance.toLocaleString()}</div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 w-fit px-2 py-0.5 rounded border border-emerald-500/20">
                <Activity className="w-3 h-3"/> 流动性: 正常
            </div>
        </div>
        <div className="ios-glass-card p-6 border-l-4 border-l-amber-500 relative group">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05] group-hover:rotate-12 transition-transform"><Boxes className="w-24 h-24 text-white"/></div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">库存资金占用 (货值)</div>
            <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">¥ {stats.inventoryValue.toLocaleString()}</div>
            <div className="mt-4 text-[10px] text-slate-500 font-bold">涉及 SKU: <span className="text-white">{state.products.length} 款</span></div>
        </div>
        <div className="ios-glass-card p-6 border-l-4 border-l-blue-500">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">已付物流资产 (在库)</div>
            <div className="text-3xl font-black text-blue-400 font-mono tracking-tight">¥ {stats.inventoryLogisticsValue.toLocaleString()}</div>
            <div className="mt-4 text-[10px] text-slate-500 font-bold">计费分摊中...</div>
        </div>
        <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-500/10 to-transparent">
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">全域资产估值 (Equity)</div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
                ¥ {stats.totalAssetValue.toLocaleString()}
            </div>
            <div className="mt-4 text-[10px] text-slate-500 font-bold">含待入账: <span className="text-white">¥ {stats.pendingIncome.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {viewMode === 'overview' && (
          <div className="grid grid-cols-12 gap-6 h-full animate-in fade-in slide-in-from-bottom-4">
            {/* 资产结构与支出结构 */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="ios-glass-panel p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><PieChart className="w-4 h-4 text-indigo-500"/> 资产分布结构 (Asset Allocation)</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={assetDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {assetDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{backgroundColor:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px'}}
                                    itemStyle={{color: '#fff'}}
                                    labelStyle={{color: '#fff'}}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        {assetDistribution.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-2 text-slate-300 font-medium">
                                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></span> 
                                    {item.name}
                                </span>
                                <span className="text-slate-200 font-mono font-bold tracking-tight">¥{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ios-glass-panel p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><BarChart4 className="w-4 h-4 text-pink-500"/> 累计分类支出 (Expense)</h3>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as TransactionCategory] || '#444'} />)}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{backgroundColor:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px'}}
                                    itemStyle={{color: '#fff'}}
                                    labelStyle={{color: '#fff'}}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                        {categoryData.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-[9px]">
                                <span className="flex items-center gap-1.5 text-slate-400 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor: CATEGORY_COLORS[item.name as TransactionCategory]}}></span> 
                                    {item.name}
                                </span>
                                <span className="text-slate-300 font-mono">¥{(item.value / 1000).toFixed(1)}k</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI 诊断与现金流趋势 */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="ios-glass-card p-1 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Zap className="w-6 h-6 fill-current"/></div>
                      <div>
                        <h3 className="text-lg font-bold text-white">AI 智能资产负载审计</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Cross-Inventory Financial Analysis v4.0</p>
                      </div>
                    </div>
                    <button onClick={handleAiAudit} disabled={isAiAnalyzing} className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all shadow-xl">
                      {isAiAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "执行深度勾稽"}
                    </button>
                  </div>
                  {aiReport && (
                    <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                       <div className="p-5 bg-black/40 rounded-2xl border border-indigo-500/30 text-indigo-100 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: aiReport }}></div>
                    </div>
                  )}
              </div>

              <div className="ios-glass-panel p-6 flex-1 min-h-[300px]">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400"/> 资金流转轨迹 (流水趋势)</h3>
                <div className="h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={state.transactions.slice(-15).reverse().map(t => ({ date: t.date, amount: t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount }))}>
                        <defs>
                          <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false}/>
                        <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false}/>
                        <Tooltip 
                            contentStyle={{backgroundColor:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px'}}
                            itemStyle={{color: '#fff'}}
                            labelStyle={{color: '#fff'}}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3}/>
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'ledger' && (
          <div className="h-full flex flex-col ios-glass-panel rounded-2xl overflow-hidden animate-in fade-in">
             <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input type="text" placeholder="搜索收支摘要、分类或终端..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none w-80"/>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5"><Filter className="w-5 h-5"/></button>
                  <button className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5"><Download className="w-5 h-5"/></button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                   <thead className="bg-black/40 sticky top-0 z-10 border-b border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      <tr>
                        <th className="p-4">节点日期</th>
                        <th className="p-4">业务类目</th>
                        <th className="p-4">交易实体/摘要</th>
                        <th className="p-4">结算方式</th>
                        <th className="p-4 text-right">变动金额</th>
                        <th className="p-4 text-center">原子状态</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {filteredLedger.map(tx => (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                          <td className="p-4 text-slate-400">{tx.date}</td>
                          <td className="p-4">
                            <span className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#fff' }}></span>
                              <span className="text-slate-200 font-bold">{tx.category}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-100 font-medium truncate max-w-xs">{tx.description}</div>
                            <div className="text-[9px] text-slate-600 uppercase mt-1">ID: {tx.id}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-slate-500">
                               <CreditCard className="w-3.5 h-3.5"/> {tx.paymentMethod}
                            </div>
                          </td>
                          <td className={`p-4 text-right font-black text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {viewMode === 'penetration' && (
          <div className="h-full ios-glass-panel p-10 flex flex-col items-center justify-center text-slate-500">
             <Layers className="w-16 h-16 mb-4 opacity-10 animate-pulse" />
             <h3 className="text-sm font-bold uppercase tracking-[0.3em]">SKU 盈利穿透引擎 (测试版)</h3>
             <p className="text-[10px] mt-2 uppercase tracking-widest text-slate-600">正在与库存及订单模块进行财务勾稽中...</p>
             <button onClick={() => setViewMode('overview')} className="mt-8 px-6 py-2 border border-white/10 rounded-xl text-xs hover:bg-white/5 transition-all">返回概览</button>
          </div>
        )}
      </div>

      {/* 新增交易侧边面板 (快速入账) - 使用 Portal 挂载到 body 顶层 */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
           <div className="w-full max-w-md bg-[#0f0f12] border-l border-white/10 h-full relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-500"/> 录入财务流水</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-500"><X className="w-6 h-6"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                 {/* 交易类型选择 */}
                 <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                   <button onClick={() => setFormData({...formData, type: 'income'})} className={`py-3 rounded-lg text-xs font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>收入 (+ 进账)</button>
                   <button onClick={() => setFormData({...formData, type: 'expense'})} className={`py-3 rounded-lg text-xs font-bold transition-all ${formData.type === 'expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>支出 (- 出账)</button>
                 </div>

                 <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">交易摘要/实体</label>
                      <input type="text" placeholder="例如：物流费、货款、广告预充值..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">金额 (数额)</label>
                        <input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-lg font-black text-white focus:border-indigo-500 outline-none font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">币种</label>
                        <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none">
                          <option value="CNY">CNY (人民币)</option>
                          <option value="USD">USD (美元)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">业务分类 (类目)</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none">
                        {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">交易日期</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">结算方式</label>
                        <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none">
                          <option value="Bank">银行转账</option>
                          <option value="PayPal">PayPal</option>
                          <option value="AliPay">支付宝</option>
                          <option value="CreditCard">信用卡</option>
                          <option value="Payoneer">派安盈</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">入账状态</label>
                      <div className="flex gap-2">
                        <button onClick={() => setFormData({...formData, status: 'completed'})} className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${formData.status === 'completed' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg' : 'bg-black/40 border-white/10 text-slate-500'}`}>已结算 (完成)</button>
                        <button onClick={() => setFormData({...formData, status: 'pending'})} className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${formData.status === 'pending' ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-lg' : 'bg-black/40 border-white/10 text-slate-500'}`}>待核销 (挂账)</button>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-white/10 bg-white/5">
                <button onClick={handleAddTransaction} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                  <CheckCircle2 className="w-5 h-5"/> 执行记账协议
                </button>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Finance;
