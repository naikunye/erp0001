
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
  const { showToast } = useTanxing();
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
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);

  // --- Helpers ---
  const convertToActive = (amount: number, currency: string) => {
    if (currency === activeCurrency) return amount;
    
    // Normalize to USD first (Mock rates)
    let valInUSD = amount;
    if (currency === 'CNY') valInUSD = amount / 7.2;
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

  // --- Data Processing ---
  
  // 1. Filtered Transactions (Global)
  const filteredData = useMemo(() => {
      return transactions.filter(t => {
          const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
          // Simulate platform tagging based on description if tags are empty (for demo)
          const derivedPlatform = t.tags?.find(tag => PLATFORM_FILTERS.includes(tag)) || 
                                  (t.description.toLowerCase().includes('tiktok') ? 'TikTok' : 
                                   t.description.toLowerCase().includes('amazon') ? 'Amazon' : 'Offline');
          const matchesPlatform = selectedPlatform === 'All' || derivedPlatform === selectedPlatform;
          
          return matchesSearch && matchesCategory && matchesPlatform;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, selectedCategory, selectedPlatform]);

  // 2. Pagination
  const paginatedData = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // 3. Overview Stats
  const stats = useMemo(() => {
    let totalRevenue = 0, totalCOGS = 0, totalAds = 0, totalLogistics = 0;
    
    filteredData.forEach(t => {
      const val = convertToActive(t.amount, t.currency);
      if (t.type === 'income') totalRevenue += val;
      else {
          if (t.category === 'COGS') totalCOGS += val;
          if (t.category === 'Marketing') totalAds += val;
          if (t.category === 'Logistics') totalLogistics += val;
      }
    });
    
    const grossProfit = totalRevenue - totalCOGS - totalLogistics - totalAds;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCOGS, totalAds, totalLogistics, grossProfit, margin };
  }, [filteredData, activeCurrency, exchangeRate]);

  // 4. TikTok Specific Logic
  const tiktokStats = useMemo(() => {
      const tiktokTx = transactions.filter(t => 
          t.description.toLowerCase().includes('tiktok') || t.tags?.includes('TikTok')
      );
      
      let revenue = 0, ads = 0, commission = 0, productCost = 0;
      
      tiktokTx.forEach(t => {
          const val = convertToActive(t.amount, t.currency);
          if (t.type === 'income') revenue += val;
          else {
              if (t.category === 'Marketing') ads += val;
              if (t.description.includes('Commission') || t.category === 'Software') commission += val; // Mock logic
              if (t.category === 'COGS') productCost += val;
          }
      });

      const net = revenue - ads - commission - productCost;
      
      return { 
          revenue, ads, commission, productCost, net,
          roi: ads > 0 ? (revenue / ads) : 0
      };
  }, [transactions, activeCurrency, exchangeRate]);

  // 5. Inventory (Stocking) Analysis
  const inventoryStats = useMemo(() => {
      const stockTx = transactions.filter(t => t.category === 'COGS' || t.category === 'Logistics');
      
      let productCost = 0;
      let freightCost = 0;
      
      stockTx.forEach(t => {
          const val = convertToActive(t.amount, t.currency);
          if (t.category === 'COGS') productCost += val;
          if (t.category === 'Logistics') freightCost += val;
      });

      return { productCost, freightCost, total: productCost + freightCost };
  }, [transactions, activeCurrency, exchangeRate]);


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
      status: newTx.status as any,
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
            Example Tags: TikTok, Restock, Amazon, Ads.
        `;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt, config: { responseMimeType: "application/json" } });
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
            Analyze these financials (${activeCurrency}):
            
            1. TikTok Channel:
               - Revenue: ${formatMoney(tiktokStats.revenue)}
               - Ad Spend: ${formatMoney(tiktokStats.ads)} (ROI: ${tiktokStats.roi.toFixed(2)})
               - Net Profit: ${formatMoney(tiktokStats.net)}
            
            2. Inventory Supply Chain:
               - Product Cost: ${formatMoney(inventoryStats.productCost)}
               - Logistics/Freight: ${formatMoney(inventoryStats.freightCost)}
               - Freight Ratio: ${((inventoryStats.freightCost / inventoryStats.total)*100).toFixed(1)}%

            Task: Provide 3 strategic insights focusing on "Cost Control" and "TikTok Profitability".
            Output HTML with bold tags for key numbers.
          `;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
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
          tx.date,
          tx.id,
          tx.category,
          `"${tx.description.replace(/"/g, '""')}"`,
          tx.amount,
          tx.currency,
          tx.type,
          tx.status
      ].join(','));
      
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Finance_Export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('财务报表 CSV 已下载', 'success');
  };

  const handleBatchImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      // In a real app, parse CSV/Excel here.
      // For mock:
      setTimeout(() => {
          showToast(`已成功导入文件: ${file.name} (模拟)`, 'success');
      }, 800);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* 1. Top Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                  财务资金 (Finance)
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                  {activeCurrency} 本位币汇率: 1 USD = {exchangeRate} CNY
              </p>
          </div>
          
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setViewMode('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <Activity className="w-3.5 h-3.5" /> 总览
              </button>
              <button onClick={() => setViewMode('ledger')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <FileText className="w-3.5 h-3.5" /> 流水账 (Ledger)
              </button>
              <button onClick={() => setViewMode('analysis')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <PieIcon className="w-3.5 h-3.5" /> 成本智脑
              </button>
          </div>

          <div className="flex gap-2">
              <button onClick={() => setActiveCurrency(activeCurrency === 'CNY' ? 'USD' : 'CNY')} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/5 font-mono">
                  {activeCurrency}
              </button>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                  <Plus className="w-4 h-4" /> 记一笔
              </button>
          </div>
      </div>

      {/* --- VIEW 1: OVERVIEW --- */}
      {viewMode === 'overview' && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="ios-glass-card p-5">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><DollarSign className="w-3 h-3 text-emerald-400"/> 总收入 (Revenue)</div>
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(stats.totalRevenue)}</div>
                  </div>
                  <div className="ios-glass-card p-5">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><ShoppingBag className="w-3 h-3 text-blue-400"/> 采购成本 (COGS)</div>
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(stats.totalCOGS)}</div>
                  </div>
                  <div className="ios-glass-card p-5">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><Megaphone className="w-3 h-3 text-pink-400"/> 营销支出 (Ads)</div>
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(stats.totalAds)}</div>
                  </div>
                  <div className="ios-glass-card p-5 relative overflow-hidden">
                      <div className="absolute right-0 top-0 p-4 opacity-10"><Wallet className="w-16 h-16 text-white"/></div>
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2">毛利润 (Gross Profit)</div>
                      <div className={`text-2xl font-mono font-bold ${stats.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatMoney(stats.grossProfit)}</div>
                      <div className="text-xs text-slate-400 mt-1">Margin: {stats.margin.toFixed(1)}%</div>
                  </div>
              </div>

              {/* Cashflow Chart */}
              <div className="ios-glass-card p-6 h-96">
                  <h3 className="text-sm font-bold text-white mb-6">资金流向趋势 (Cash Flow Trend)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredData.slice(0, 30).reverse()} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                          <defs>
                              <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickFormatter={(v) => v.slice(5)} />
                          <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                          <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333', color:'#fff'}} />
                          <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#colorInc)" strokeWidth={2} name="Flow" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      {/* --- VIEW 2: LEDGER (High Density) --- */}
      {viewMode === 'ledger' && (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in bg-black/20 border border-white/10 rounded-xl overflow-hidden">
              {/* Ledger Toolbar */}
              <div className="p-3 border-b border-white/10 bg-white/5 flex flex-wrap gap-3 items-center">
                  <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input 
                          type="text" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="搜索流水号/备注..." 
                          className="pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white w-64 focus:border-indigo-500 outline-none"
                      />
                  </div>
                  <div className="h-6 w-px bg-white/10 mx-1"></div>
                  
                  <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)} className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none">
                      {PLATFORM_FILTERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none">
                      {CATEGORY_FILTERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <div className="ml-auto flex gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs flex items-center gap-2 border border-white/10"
                      >
                          <Upload className="w-3.5 h-3.5" /> 批量导入
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleBatchImport} accept=".csv,.xlsx" />
                      
                      <button 
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs flex items-center gap-2 border border-white/10"
                      >
                          <Download className="w-3.5 h-3.5" /> 导出 CSV
                      </button>
                  </div>
              </div>

              {/* High Density Table */}
              <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                          <tr>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">日期 (Date)</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">流水号 (ID)</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">类别 (Category)</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">描述 (Description)</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">标签 (Tags)</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">金额 (Amount)</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {paginatedData.map((tx, idx) => (
                              <tr key={tx.id} className="hover:bg-white/5 transition-colors group text-xs">
                                  <td className="px-4 py-2 text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                  <td className="px-4 py-2 text-slate-400 font-mono">{tx.date}</td>
                                  <td className="px-4 py-2 text-slate-500 font-mono">{tx.id}</td>
                                  <td className="px-4 py-2">
                                      <span className={`px-1.5 py-0.5 rounded border ${
                                          tx.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                                      }`}>
                                          {tx.category}
                                      </span>
                                  </td>
                                  <td className="px-4 py-2 text-white font-medium truncate max-w-[200px]" title={tx.description}>{tx.description}</td>
                                  <td className="px-4 py-2">
                                      <div className="flex gap-1">
                                          {tx.tags?.map(tag => <span key={tag} className="bg-white/10 px-1 rounded text-[10px] text-slate-300">{tag}</span>)}
                                          {!tx.tags?.length && <span className="text-slate-700">-</span>}
                                      </div>
                                  </td>
                                  <td className={`px-4 py-2 text-right font-mono font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                      {tx.type === 'income' ? '+' : '-'}{tx.currency === 'USD' ? '$' : '¥'}{tx.amount.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                      <button className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                          <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {paginatedData.length === 0 && <div className="p-10 text-center text-slate-500 text-sm">暂无符合条件的记录</div>}
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-white/10 bg-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Showing {paginatedData.length} of {filteredData.length} records</span>
                  <div className="flex gap-1">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded border border-white/10 hover:bg-white/10 disabled:opacity-50"><ChevronLeft className="w-3.5 h-3.5"/></button>
                      <span className="px-3 py-1.5 text-slate-300">Page {currentPage} / {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded border border-white/10 hover:bg-white/10 disabled:opacity-50"><ChevronRight className="w-3.5 h-3.5"/></button>
                  </div>
              </div>
          </div>
      )}

      {/* --- VIEW 3: COST ANALYSIS (TikTok & Supply Chain) --- */}
      {viewMode === 'analysis' && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/> 成本与利润深度透视</h2>
                  <button 
                      onClick={handleAiDeepDive}
                      disabled={isAiThinking}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                      {isAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                      生成 CFO 诊断报告
                  </button>
              </div>

              {aiAnalysis && (
                  <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl animate-in fade-in">
                      <div className="text-sm text-indigo-100 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
                  </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: TikTok Profitability */}
                  <div className="ios-glass-card p-6 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-pink-500" /> TikTok 渠道盈亏 (P&L)
                              </h3>
                              <p className="text-[10px] text-slate-500 mt-1">基于 "{activeCurrency}" 本位币核算</p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold border ${tiktokStats.net >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              净利: {formatMoney(tiktokStats.net)}
                          </div>
                      </div>

                      <div className="flex-1 w-full min-h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                  { name: 'Revenue', value: tiktokStats.revenue, fill: '#10b981' },
                                  { name: 'Ads', value: tiktokStats.ads, fill: '#ec4899' },
                                  { name: 'Comm.', value: tiktokStats.commission, fill: '#8b5cf6' },
                                  { name: 'COGS', value: tiktokStats.productCost, fill: '#3b82f6' }
                              ]} layout="vertical" margin={{left: 10, right: 30}}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v/1000}k`} />
                                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={50} />
                                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#000', borderColor: '#333'}} />
                                  <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                          <div className="bg-pink-500/10 p-2 rounded border border-pink-500/20">
                              <div className="text-[10px] text-pink-300">ROI (Ads)</div>
                              <div className="font-bold text-white">{tiktokStats.roi.toFixed(2)}</div>
                          </div>
                          <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                              <div className="text-[10px] text-purple-300">佣金占比</div>
                              <div className="font-bold text-white">{tiktokStats.revenue > 0 ? ((tiktokStats.commission/tiktokStats.revenue)*100).toFixed(1) : 0}%</div>
                          </div>
                          <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                              <div className="text-[10px] text-blue-300">货值占比</div>
                              <div className="font-bold text-white">{tiktokStats.revenue > 0 ? ((tiktokStats.productCost/tiktokStats.revenue)*100).toFixed(1) : 0}%</div>
                          </div>
                      </div>
                  </div>

                  {/* Card 2: Supply Chain Breakdown */}
                  <div className="ios-glass-card p-6 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-orange-500" /> 供应链备货资金 (Supply Chain)
                              </h3>
                              <p className="text-[10px] text-slate-500 mt-1">采购货值 vs 头程运费</p>
                          </div>
                          <div className="text-right">
                              <div className="text-xs text-slate-500">总投入</div>
                              <div className="font-bold text-white font-mono">{formatMoney(inventoryStats.total)}</div>
                          </div>
                      </div>

                      <div className="flex-1 flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height={250}>
                              <PieChart>
                                  <Pie
                                      data={[
                                          { name: '产品货值 (Goods)', value: inventoryStats.productCost, fill: '#3b82f6' },
                                          { name: '头程运费 (Freight)', value: inventoryStats.freightCost, fill: '#f59e0b' }
                                      ]}
                                      cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                                      paddingAngle={5} dataKey="value" stroke="none"
                                  >
                                      <Cell fill="#3b82f6" />
                                      <Cell fill="#f59e0b" />
                                  </Pie>
                                  <Tooltip formatter={(v:number) => formatMoney(v)} contentStyle={{backgroundColor: '#000', borderColor: '#333'}} />
                                  <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                          </ResponsiveContainer>
                          {/* Inner Text */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                              <div className="text-center">
                                  <div className="text-[10px] text-slate-500">运费占比</div>
                                  <div className="text-xl font-bold text-orange-400">
                                      {inventoryStats.total > 0 ? ((inventoryStats.freightCost / inventoryStats.total) * 100).toFixed(1) : 0}%
                                  </div>
                              </div>
                          </div>
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
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-indigo-500" />
                          记一笔 (New Entry)
                      </h3>
                      <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white"/></button>
                  </div>
                  
                  {/* AI Smart Fill */}
                  <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 mb-4 flex gap-2">
                      <input 
                          type="text" 
                          value={smartInput}
                          onChange={(e) => setSmartInput(e.target.value)}
                          placeholder='AI 智能填单: "昨天支付了 5000 元备货款给工厂"'
                          className="flex-1 bg-black/40 border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button onClick={handleSmartFill} disabled={isSmartFilling} className="px-3 bg-indigo-600 rounded-lg text-white text-xs font-bold disabled:opacity-50">
                          {isSmartFilling ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                      </button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setNewTx({...newTx, type: 'income'})} className={`py-2 text-sm font-bold rounded-lg border ${newTx.type === 'income' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-black/40 border-white/10 text-slate-400'}`}>收入 Income</button>
                          <button onClick={() => setNewTx({...newTx, type: 'expense'})} className={`py-2 text-sm font-bold rounded-lg border ${newTx.type === 'expense' ? 'bg-red-600 border-red-500 text-white' : 'bg-black/40 border-white/10 text-slate-400'}`}>支出 Expense</button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1">
                              <label className="text-xs text-slate-400 block mb-1">货币</label>
                              <select value={newTx.currency} onChange={(e) => setNewTx({...newTx, currency: e.target.value as any})} className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-2 py-2 outline-none">
                                  <option value="CNY">CNY</option>
                                  <option value="USD">USD</option>
                              </select>
                          </div>
                          <div className="col-span-2">
                              <label className="text-xs text-slate-400 block mb-1">金额</label>
                              <input type="number" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" placeholder="0.00" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">分类</label>
                              <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value as any})} className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-2 py-2 outline-none">
                                  {CATEGORY_FILTERS.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">日期</label>
                              <input type="date" value={newTx.date} onChange={(e) => setNewTx({...newTx, date: e.target.value})} className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs text-slate-400 block mb-1">平台/业务标签 (Tags)</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                              {['TikTok', 'Amazon', 'Restock', 'Ads', 'Commission'].map(tag => (
                                  <button 
                                    key={tag}
                                    onClick={() => {
                                        const tags = newTx.tags || [];
                                        if (tags.includes(tag)) setNewTx({...newTx, tags: tags.filter(t => t !== tag)});
                                        else setNewTx({...newTx, tags: [...tags, tag]});
                                    }}
                                    className={`px-2 py-1 text-[10px] rounded border transition-colors ${newTx.tags?.includes(tag) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-white/10 text-slate-400'}`}
                                  >
                                      {tag}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="text-xs text-slate-400 block mb-1">备注说明</label>
                          <input type="text" value={newTx.description || ''} onChange={(e) => setNewTx({...newTx, description: e.target.value})} className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" placeholder="交易详情..." />
                      </div>
                  </div>

                  <button onClick={handleAddTransaction} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-6 shadow-lg transition-all active:scale-95">保存交易</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;
