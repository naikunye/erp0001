
import React, { useState, useMemo, useRef } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Plus, FileText, 
  PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Filter, Calendar, 
  Landmark, CreditCard, Sparkles, Bot, Loader2, X, Download, Upload,
  Wand2, Receipt, Search, BarChart3, Activity, AlertCircle, CheckCircle2, Trash2,
  Layers, ShoppingBag, Truck, Tag, RefreshCcw, ChevronLeft, ChevronRight, MoreHorizontal,
  Megaphone
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { MOCK_TRANSACTIONS } from '../constants';
import { Transaction, PaymentMethod } from '../types';
import { useTanxing } from '../context/TanxingContext';

// --- Types & Constants ---
type ViewMode = 'overview' | 'ledger' | 'analysis';

const PLATFORM_FILTERS = ['All', 'TikTok', 'Amazon', 'Shopify', 'Offline'];
const CATEGORY_FILTERS = ['All', 'Revenue', 'COGS', 'Logistics', 'Marketing', 'Software', 'Office', 'Payroll', 'Other'];

const Finance: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [activeCurrency, setActiveCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [exchangeRate, setExchangeRate] = useState(7.2); 
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Ledger State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Transaction State
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'expense',
    currency: 'CNY',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    paymentMethod: 'Bank',
    tags: []
  });

  // AI State
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [smartInput, setSmartInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);

  // --- Helpers ---
  const convertToActive = (amount: number, currency: string) => {
    if (currency === activeCurrency) return amount;
    
    // Normalize to USD first
    let valInUSD = amount;
    if (currency === 'CNY') valInUSD = amount / exchangeRate;
    else if (currency === 'EUR') valInUSD = amount * 1.08;
    
    // Convert to target currency
    if (activeCurrency === 'USD') return valInUSD;
    if (activeCurrency === 'CNY') return valInUSD * exchangeRate;
    
    return amount;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(activeCurrency === 'CNY' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // --- REAL DATA CALCULATION ENGINE ---
  // We prioritize pulling from Inventory and Orders for REALITY

  const realFinanceData = useMemo(() => {
    const activeProducts = state.products.filter(p => !p.deletedAt);
    const activeOrders = state.orders.filter(o => !o.deletedAt && o.status !== 'cancelled');

    // 1. Calculate Real Revenue (from Orders)
    const totalRevenueUSD = activeOrders.reduce((sum, o) => sum + o.total, 0);

    // 2. Calculate Real COGS (from Inventory)
    const totalCogsCNY = activeProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0);

    // 3. Calculate Real Logistics (from Inventory)
    let totalLogisticsCNY = 0;
    activeProducts.forEach(p => {
        const unitRealWeight = p.unitWeight || 0;
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const autoUnitChargeableWeight = Math.max(unitRealWeight, unitVolWeight);
        
        let activeTotalBillingWeight = 0;
        if (p.logistics?.billingWeight && p.logistics.billingWeight > 0) {
            activeTotalBillingWeight = p.logistics.billingWeight;
        } else if (p.logistics?.unitBillingWeight && p.logistics.unitBillingWeight > 0) {
            activeTotalBillingWeight = p.logistics.unitBillingWeight * p.stock;
        } else {
            activeTotalBillingWeight = autoUnitChargeableWeight * p.stock;
        }

        const rate = p.logistics?.unitFreightCost || 0;
        const baseFreightCost = activeTotalBillingWeight * rate;
        const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
        const autoTotalFreightCNY = baseFreightCost + batchFeesCNY;
        const manualTotalFreightCNY = p.logistics?.totalFreightCost;
        const effectiveTotalFreightCNY = manualTotalFreightCNY ?? autoTotalFreightCNY;
        
        const unitConsumablesCNY = (p.logistics?.consumablesFee || 0);
        const totalFreightDisplayCNY = effectiveTotalFreightCNY + (unitConsumablesCNY * p.stock);
        
        totalLogisticsCNY += totalFreightDisplayCNY;
    });

    // 4. Marketing/Ads (Pull from Transactions as they aren't in Inventory yet)
    const totalAdsUSD = transactions
        .filter(t => t.category === 'Marketing')
        .reduce((sum, t) => sum + (t.currency === 'CNY' ? t.amount / exchangeRate : t.amount), 0);

    return {
        revenueUSD: totalRevenueUSD,
        cogsUSD: totalCogsCNY / exchangeRate,
        logisticsUSD: totalLogisticsCNY / exchangeRate,
        adsUSD: totalAdsUSD
    };
  }, [state.products, state.orders, transactions, exchangeRate]);

  // --- Ledger Processing ---
  
  const filteredData = useMemo(() => {
      return transactions.filter(t => {
          const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
          const derivedPlatform = t.tags?.find(tag => PLATFORM_FILTERS.includes(tag)) || 
                                  (t.description.toLowerCase().includes('tiktok') ? 'TikTok' : 
                                   t.description.toLowerCase().includes('amazon') ? 'Amazon' : 'Offline');
          const matchesPlatform = selectedPlatform === 'All' || derivedPlatform === selectedPlatform;
          
          return matchesSearch && matchesCategory && matchesPlatform;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, selectedCategory, selectedPlatform]);

  const paginatedData = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const stats = useMemo(() => {
    const totalRevenue = convertToActive(realFinanceData.revenueUSD, 'USD');
    const totalCOGS = convertToActive(realFinanceData.cogsUSD, 'USD');
    const totalLogistics = convertToActive(realFinanceData.logisticsUSD, 'USD');
    const totalAds = convertToActive(realFinanceData.adsUSD, 'USD');
    
    const grossProfit = totalRevenue - totalCOGS - totalLogistics - totalAds;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCOGS, totalAds, totalLogistics, grossProfit, margin };
  }, [realFinanceData, activeCurrency, exchangeRate]);

  // --- Handlers ---
  const handleAddTransaction = () => {
    if (!newTx.amount || !newTx.description) return;
    const tx: Transaction = {
      id: `TRX-${Date.now()}`,
      amount: Number(newTx.amount),
      category: newTx.category as any,
      currency: newTx.currency as any,
      date: newTx.date!,
      description: newTx.description!,
      status: 'completed',
      type: newTx.type as any,
      paymentMethod: newTx.paymentMethod as any,
      tags: newTx.tags
    };
    setTransactions([tx, ...transactions]);
    setShowAddModal(false);
    setSmartInput('');
    showToast("交易已入账", "success");
  };

  const handleSmartFill = async () => {
    if (!smartInput.trim()) return;
    setIsSmartFilling(true);
    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Parse this financial text: "${smartInput}". 
            Context: E-commerce business. 
            Return JSON: { "amount": number, "currency": "CNY"|"USD", "type": "income"|"expense", "category": "CategoryString", "description": "String", "tags": ["String"] }
            Categories: Revenue, COGS, Logistics, Marketing, Other.
        `;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
        const result = JSON.parse(response.text || '{}');
        setNewTx(prev => ({ ...prev, ...result, date: new Date().toISOString().split('T')[0] }));
        showToast("AI 识别成功", "success");
    } catch (e) {
        showToast("识别失败", "error");
    } finally {
        setIsSmartFilling(false);
    }
  };

  const handleAiDeepDive = async () => {
      setIsAiThinking(true);
      setAiAnalysis(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            Act as a CFO for a Cross-border E-commerce brand.
            Current Stats:
            - Revenue: ${formatMoney(stats.totalRevenue)}
            - COGS (Inventory Value): ${formatMoney(stats.totalCOGS)}
            - Logistics (Total Freight): ${formatMoney(stats.totalLogistics)}
            - Ads: ${formatMoney(stats.totalAds)}
            - Net Margin: ${stats.margin.toFixed(2)}%

            Task: Provide 3 strategic financial insights focusing on Inventory Asset Health and ROI.
            Output HTML. Language: Chinese.
          `;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiAnalysis(response.text);
      } catch (e) {
          setAiAnalysis("AI 服务暂时不可用。");
      } finally {
          setIsAiThinking(false);
      }
  };

  const handleExportCSV = () => {
      const headers = ['Date', 'ID', 'Category', 'Description', 'Amount', 'Currency', 'Type', 'Status'];
      const rows = filteredData.map(tx => [
          tx.date, tx.id, tx.category, `"${tx.description.replace(/"/g, '""')}"`, tx.amount, tx.currency, tx.type, tx.status
      ].join(','));
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Finance_Export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      showToast('财务报表 CSV 已下载', 'success');
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* 1. Top Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                  财务资金 (Finance Center)
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                  已同步智能备货与订单数据 • 汇率: 1 USD = {exchangeRate} CNY
              </p>
          </div>
          
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setViewMode('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <Activity className="w-3.5 h-3.5" /> 资产总览
              </button>
              <button onClick={() => setViewMode('ledger')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <FileText className="w-3.5 h-3.5" /> 现金流水
              </button>
              <button onClick={() => setViewMode('analysis')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <PieIcon className="w-3.5 h-3.5" /> 成本分析
              </button>
          </div>

          <div className="flex gap-2">
              <button onClick={() => setActiveCurrency(activeCurrency === 'CNY' ? 'USD' : 'CNY')} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/5 font-mono">
                  {activeCurrency}
              </button>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
                  <Plus className="w-4 h-4" /> 记录流水
              </button>
          </div>
      </div>

      {/* --- VIEW 1: OVERVIEW --- */}
      {viewMode === 'overview' && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* KPIs - Linked to REAL Inventory & Order Data */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="ios-glass-card p-5 border-l-4 border-l-emerald-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><DollarSign className="w-3 h-3 text-emerald-400"/> 订单总营收 (Real Sales)</div>
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(stats.totalRevenue)}</div>
                      <div className="text-[10px] text-slate-500 mt-1">源自已支付订单汇总</div>
                  </div>
                  <div className="ios-glass-card p-5 border-l-4 border-l-blue-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><ShoppingBag className="w-3 h-3 text-blue-400"/> 库存资产价值 (Assets)</div>
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(stats.totalCOGS)}</div>
                      <div className="text-[10px] text-slate-500 mt-1">源自备货清单采购总额</div>
                  </div>
                  <div className="ios-glass-card p-5 border-l-4 border-l-orange-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><Truck className="w-3 h-3 text-orange-400"/> 累计运费投入 (Logistics)</div>
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(stats.totalLogistics)}</div>
                      <div className="text-[10px] text-slate-500 mt-1">源自备货清单头程汇总</div>
                  </div>
                  <div className="ios-glass-card p-5 relative overflow-hidden border-l-4 border-l-purple-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2">预估总利润 (EBIT)</div>
                      <div className={`text-2xl font-mono font-bold ${stats.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatMoney(stats.grossProfit)}</div>
                      <div className="text-xs text-slate-400 mt-1">Margin: {stats.margin.toFixed(1)}%</div>
                  </div>
              </div>

              {/* Chart */}
              <div className="ios-glass-card p-6 h-96">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400"/> 近期现金流趋势 (Cashflow Sync)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredData.slice(0, 20).reverse()} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                          <defs>
                              <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickFormatter={(v) => v.slice(5)} />
                          <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                          <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333', color:'#fff'}} />
                          <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#colorInc)" strokeWidth={2} name="Transaction" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      {/* --- VIEW 2: LEDGER --- */}
      {viewMode === 'ledger' && (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in bg-black/20 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-white/10 bg-white/5 flex flex-wrap gap-3 items-center">
                  <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索流水号/备注..." className="pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white w-64 focus:border-indigo-500 outline-none" />
                  </div>
                  <div className="h-6 w-px bg-white/10 mx-1"></div>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none">
                      {CATEGORY_FILTERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="ml-auto flex gap-2">
                      <button onClick={handleExportCSV} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs flex items-center gap-2 border border-white/10">
                          <Download className="w-3.5 h-3.5" /> 导出报表
                      </button>
                  </div>
              </div>

              <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                          <tr>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase w-12">#</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">日期</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">类别</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">描述</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">金额</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">状态</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {paginatedData.map((tx, idx) => (
                              <tr key={tx.id} className="hover:bg-white/5 transition-colors text-xs">
                                  <td className="px-4 py-2 text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                  <td className="px-4 py-2 text-slate-400 font-mono">{tx.date}</td>
                                  <td className="px-4 py-2">
                                      <span className={`px-1.5 py-0.5 rounded border ${tx.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{tx.category}</span>
                                  </td>
                                  <td className="px-4 py-2 text-white font-medium truncate max-w-[200px]">{tx.description}</td>
                                  <td className={`px-4 py-2 text-right font-mono font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                      {tx.type === 'income' ? '+' : '-'}{tx.currency === 'USD' ? '$' : '¥'}{tx.amount.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                      <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Success</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- VIEW 3: ANALYSIS --- */}
      {viewMode === 'analysis' && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/> CFO 成本结构智脑分析</h2>
                  <button onClick={handleAiDeepDive} disabled={isAiThinking} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                      {isAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                      生成深度诊断报告
                  </button>
              </div>

              {aiAnalysis && (
                  <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl animate-in fade-in text-sm text-indigo-100 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Expense Breakdown Pie */}
                  <div className="ios-glass-card p-6 flex flex-col h-[400px]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><Truck className="w-4 h-4 text-orange-500" /> 库存资产构成 (Asset Breakdown)</h3>
                      <div className="flex-1 relative">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={[
                                          { name: '采购成本 (COGS)', value: realFinanceData.cogsUSD },
                                          { name: '物流支出 (Logistics)', value: realFinanceData.logisticsUSD },
                                          { name: '广告支出 (Ads)', value: realFinanceData.adsUSD }
                                      ]}
                                      innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none"
                                  >
                                      <Cell fill="#3b82f6" /> <Cell fill="#f59e0b" /> <Cell fill="#ec4899" />
                                  </Pie>
                                  <Tooltip formatter={(v:number) => `$${v.toLocaleString()}`} contentStyle={{backgroundColor: '#000', borderColor: '#333'}} />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                  
                  <div className="ios-glass-card p-6 flex flex-col h-[400px]">
                       <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> 利润贡献分析 (Profitability)</h3>
                       <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{name: 'Current Stock Potentail', revenue: realFinanceData.revenueUSD, cost: realFinanceData.cogsUSD + realFinanceData.logisticsUSD + realFinanceData.adsUSD}]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333'}} />
                                    <Bar dataKey="revenue" name="Expected Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                                    <Bar dataKey="cost" name="Total Investment" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
              <div className="ios-glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500" /> 新增流水 (Entry)</h3>
                      <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white"/></button>
                  </div>
                  
                  <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 mb-4 flex gap-2">
                      <input type="text" value={smartInput} onChange={(e) => setSmartInput(e.target.value)} placeholder='AI 智能填单: "昨天支付了 5000 元备货款"' className="flex-1 bg-black/40 border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                      <button onClick={handleSmartFill} disabled={isSmartFilling} className="px-3 bg-indigo-600 rounded-lg text-white text-xs font-bold disabled:opacity-50">
                          {isSmartFilling ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setNewTx({...newTx, type: 'income'})} className={`py-2 text-sm font-bold rounded-lg border ${newTx.type === 'income' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-black/40 border-white/10 text-slate-400'}`}>收入</button>
                          <button onClick={() => setNewTx({...newTx, type: 'expense'})} className={`py-2 text-sm font-bold rounded-lg border ${newTx.type === 'expense' ? 'bg-red-600 border-red-500 text-white' : 'bg-black/40 border-white/10 text-slate-400'}`}>支出</button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          <select value={newTx.currency} onChange={(e) => setNewTx({...newTx, currency: e.target.value as any})} className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-2 py-2">
                              <option value="CNY">CNY</option> <option value="USD">USD</option>
                          </select>
                          <input type="number" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: parseFloat(e.target.value)})} className="col-span-2 bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2" placeholder="金额" />
                      </div>
                      <input type="text" value={newTx.description || ''} onChange={(e) => setNewTx({...newTx, description: e.target.value})} className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2" placeholder="备注说明" />
                  </div>
                  <button onClick={handleAddTransaction} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-6 shadow-lg active:scale-95">确认入账</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;
