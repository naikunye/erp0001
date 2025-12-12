
import React, { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Plus, FileText, 
  PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Filter, Calendar, 
  Landmark, CreditCard, Sparkles, Bot, Loader2, X, Download,
  Wand2, Receipt, Search, BarChart3, Activity, AlertCircle, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { MOCK_TRANSACTIONS } from '../constants';
import { Transaction, PaymentMethod } from '../types';

const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [activeCurrency, setActiveCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [exchangeRate, setExchangeRate] = useState(7.2); // 1 USD = 7.2 CNY
  const [showAddModal, setShowAddModal] = useState(false);
  
  // AI Diagnosis State
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Smart Fill State
  const [smartInput, setSmartInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);

  // New Transaction State
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'expense',
    currency: 'CNY',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    paymentMethod: 'Bank'
  });

  // --- Helpers ---
  const convertToActive = (amount: number, currency: 'USD' | 'CNY') => {
    if (currency === activeCurrency) return amount;
    if (activeCurrency === 'CNY') return amount * exchangeRate; // USD -> CNY
    return amount / exchangeRate; // CNY -> USD
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(activeCurrency === 'CNY' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFilteredTransactions = () => {
      let filtered = transactions;
      if (filterCategory !== 'All') {
          filtered = filtered.filter(t => t.category === filterCategory);
      }
      return filtered;
  };

  const visibleTransactions = getFilteredTransactions();

  // --- Statistics ---
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalOpex = 0;

    transactions.forEach(t => {
      const val = convertToActive(t.amount, t.currency);
      if (t.type === 'income') {
        totalRevenue += val;
      } else {
        if (t.category === 'COGS' || t.category === 'Logistics') {
          totalCOGS += val;
        } else {
          totalOpex += val;
        }
      }
    });

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalOpex;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCOGS, totalOpex, grossProfit, netProfit, grossMargin, netMargin };
  }, [transactions, activeCurrency, exchangeRate]);

  // --- Chart Data (Area Chart) ---
  const chartData = useMemo(() => {
    const data: any[] = [];
    const months = ['5月', '6月', '7月', '8月', '9月', '10月'];
    months.forEach((m, i) => {
      const revenueBase = stats.totalRevenue > 0 ? stats.totalRevenue / 2 : 5000; 
      const expenseBase = (stats.totalCOGS + stats.totalOpex) > 0 ? (stats.totalCOGS + stats.totalOpex) / 2 : 3000;
      const randomFactor = 0.8 + (Math.sin(i) * 0.2 + 0.2); 
      
      data.push({
        name: m,
        income: Math.round(revenueBase * randomFactor),
        expense: Math.round(expenseBase * (randomFactor * 0.9)), 
      });
    });
    return data;
  }, [stats]);

  // --- Pie Chart Data (Expenses by Category) ---
  const expensePieData = useMemo(() => {
      const categoryMap: Record<string, number> = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
          const val = convertToActive(t.amount, t.currency);
          categoryMap[t.category] = (categoryMap[t.category] || 0) + val;
      });
      
      return Object.keys(categoryMap).map(key => ({
          name: key,
          value: categoryMap[key]
      })).sort((a, b) => b.value - a.value); 
  }, [transactions, activeCurrency, exchangeRate]);

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b', '#ef4444', '#6366f1'];

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
      paymentMethod: newTx.paymentMethod as any
    };
    setTransactions([tx, ...transactions]);
    setShowAddModal(false);
    setNewTx({ type: 'expense', currency: 'CNY', category: 'Other', date: new Date().toISOString().split('T')[0], status: 'completed', paymentMethod: 'Bank' });
    setSmartInput('');
  };

  const handleSmartFill = async () => {
    if (!smartInput.trim()) return;
    setIsSmartFilling(true);
    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Extract transaction from: "${smartInput}". Current Date: ${new Date().toISOString().split('T')[0]}. Return JSON {amount:number, currency:"USD"|"CNY", type:"income"|"expense", category:"Revenue"|"COGS"|"Logistics"|"Marketing"|"Software"|"Office"|"Payroll"|"Other", paymentMethod:"Bank"|"PayPal"..., description:string, date:string}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
        const result = JSON.parse(response.text || '{}');
        setNewTx(prev => ({ ...prev, ...result }));
    } catch (e) {
        alert("AI 识别失败");
    } finally {
        setIsSmartFilling(false);
    }
  };

  const handleAIDiagnosis = async () => {
    setIsDiagnosing(true);
    setAiDiagnosis(null);
    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const txSummary = transactions.slice(0, 20).map(t => 
            `${t.date}: [${t.type}] ${t.amount}${t.currency} (${t.category})`
        ).join('\n');

        const prompt = `
            Act as a CFO. Analyze this financial snapshot.
            Metrics (${activeCurrency}):
            - Revenue: ${formatMoney(stats.totalRevenue)}
            - Cost of Goods: ${formatMoney(stats.totalCOGS)}
            - OpEx: ${formatMoney(stats.totalOpex)}
            - Net Profit: ${formatMoney(stats.netProfit)} (Margin: ${stats.netMargin.toFixed(1)}%)
            
            Recent Transactions:
            ${txSummary}

            Task: Provide a "Financial Health Diagnosis".
            Structure your response in HTML:
            1. <div class="mb-2"><span class="font-bold text-lg">健康评分:</span> [Score/100]</div>
            2. <ul class="list-disc pl-4 space-y-1">... 3 bullet points on key risks or opportunities (Chinese) ...</ul>
            3. <div class="mt-2 text-indigo-300 font-bold">建议行动: [One key action]</div>
            
            Keep it concise and professional (in Chinese).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        setAiDiagnosis(response.text);
    } catch (error) {
        setAiDiagnosis("AI 服务暂时不可用。");
    } finally {
        setIsDiagnosing(false);
    }
  };

  // --- Custom Tooltips ---
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#090C14] border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-300 mb-1">{label}</p>
          <div className="flex gap-4">
             <div className="text-emerald-400">收入: {formatMoney(payload[0].value)}</div>
             <div className="text-red-400">支出: {formatMoney(payload[1].value)}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                  财务仪表盘 (Finance Dashboard)
              </h1>
              <p className="text-sm text-slate-500 mt-1">实时监控现金流、利润率与支出结构</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 px-2">本位币:</span>
              <button onClick={() => setActiveCurrency('CNY')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeCurrency === 'CNY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>CNY</button>
              <button onClick={() => setActiveCurrency('USD')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeCurrency === 'USD' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>USD</button>
          </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="star-card rounded-xl p-5 shadow-lg flex flex-col justify-between group">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">总营收 (Revenue)</p>
                  <h3 className="text-2xl font-mono font-bold text-white">{formatMoney(stats.totalRevenue)}</h3>
              </div>
              <div className="flex items-center gap-2 mt-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
                  <span className="text-xs text-emerald-500 font-medium">+12.5% 环比</span>
              </div>
          </div>

          <div className="star-card rounded-xl p-5 shadow-lg flex flex-col justify-between group">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">毛利润 (Gross Profit)</p>
                  <h3 className="text-2xl font-mono font-bold text-white">{formatMoney(stats.grossProfit)}</h3>
              </div>
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{width: `${Math.min(100, Math.max(0, stats.grossMargin))}%`}}></div>
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">毛利率: {stats.grossMargin.toFixed(1)}%</p>
          </div>

          <div className="star-card rounded-xl p-5 shadow-lg flex flex-col justify-between group">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">净利润 (Net Profit)</p>
                  <h3 className={`text-2xl font-mono font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatMoney(stats.netProfit)}</h3>
              </div>
              <div className="flex items-center gap-2 mt-3">
                  <div className={`p-1.5 rounded ${stats.netProfit >=0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-400">净利率: {stats.netMargin.toFixed(1)}%</span>
              </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-center items-center text-center">
              <div className="absolute top-0 right-0 p-3 opacity-10"><Bot className="w-12 h-12" /></div>
              <h3 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI 财务诊断
              </h3>
              <button 
                  onClick={handleAIDiagnosis}
                  disabled={isDiagnosing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                  {isDiagnosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                  一键诊断
              </button>
          </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Charts Area */}
          <div className="lg:col-span-2 space-y-6">
              {/* AI Diagnosis Result */}
              {aiDiagnosis && (
                  <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                      <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0"><Bot className="w-5 h-5 text-indigo-400" /></div>
                          <div className="flex-1">
                              <h4 className="text-sm font-bold text-indigo-300 mb-2">CFO 诊断报告</h4>
                              <div className="text-xs text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiDiagnosis }}></div>
                          </div>
                          <button onClick={() => setAiDiagnosis(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[320px]">
                   {/* Cash Flow Chart */}
                   <div className="lg:col-span-1 star-card rounded-xl p-5 shadow-sm flex flex-col">
                       <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                           <BarChart3 className="w-4 h-4 text-emerald-500" /> 现金流趋势 (Trend)
                       </h3>
                       <div className="flex-1 w-full min-h-0">
                           <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                   <defs>
                                       <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                       </linearGradient>
                                       <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                           <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                       </linearGradient>
                                   </defs>
                                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                   <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                   <YAxis stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                   <Tooltip content={<CustomAreaTooltip />} />
                                   <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                                   <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                               </AreaChart>
                           </ResponsiveContainer>
                       </div>
                   </div>

                   {/* Cost Breakdown Pie Chart */}
                   <div className="lg:col-span-1 star-card rounded-xl p-5 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <PieIcon className="w-4 h-4 text-blue-500" /> 支出结构 (Breakdown)
                            </h3>
                            {filterCategory !== 'All' && (
                                <button onClick={() => setFilterCategory('All')} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white flex items-center gap-1">
                                    <X className="w-3 h-3" /> 清除筛选
                                </button>
                            )}
                        </div>
                        <div className="flex-1 w-full min-h-0 relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expensePieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        onClick={(data) => setFilterCategory(filterCategory === data.name ? 'All' : data.name)}
                                        cursor="pointer"
                                        stroke="none"
                                    >
                                        {expensePieData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                                opacity={filterCategory === 'All' || filterCategory === entry.name ? 1 : 0.3}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: number) => formatMoney(val)} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px', borderRadius: '8px' }} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                                </PieChart>
                             </ResponsiveContainer>
                             {/* Center Label */}
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-14">
                                 <div className="text-center">
                                     <div className="text-[10px] text-slate-500">总支出</div>
                                     <div className="text-sm font-bold text-white">{formatMoney(stats.totalCOGS + stats.totalOpex)}</div>
                                 </div>
                             </div>
                        </div>
                   </div>
              </div>
          </div>

          {/* Right: Transactions List */}
          <div className="star-card rounded-xl p-0 shadow-sm flex flex-col h-[500px] lg:h-auto overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" /> 
                      账目明细 (Ledger)
                  </h3>
                  <button onClick={() => setShowAddModal(true)} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg shadow-indigo-900/20">
                      <Plus className="w-3.5 h-3.5" />
                  </button>
              </div>
              
              <div className="p-2 border-b border-slate-800 bg-slate-900 flex gap-2">
                   <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className={`bg-slate-950 border text-[10px] rounded px-2 py-1.5 focus:outline-none flex-1 transition-colors ${filterCategory !== 'All' ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-400'}`}
                   >
                      <option value="All">全部分类</option>
                      <option value="Revenue">收入 (Revenue)</option>
                      <option value="COGS">采购成本 (COGS)</option>
                      <option value="Logistics">物流运费 (Logistics)</option>
                      <option value="Marketing">市场营销 (Marketing)</option>
                      <option value="Software">软件服务 (Software)</option>
                      <option value="Office">办公费用 (Office)</option>
                      <option value="Payroll">薪资人力 (Payroll)</option>
                   </select>
              </div>

              <div className="flex-1 overflow-auto divide-y divide-slate-800/50">
                  {visibleTransactions.map(tx => (
                      <div key={tx.id} className="p-3 hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {tx.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div className="overflow-hidden">
                                  <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]" title={tx.description}>{tx.description}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                      <span className="font-mono">{tx.date}</span>
                                      <span className="bg-slate-800 px-1 rounded border border-slate-700">{tx.category}</span>
                                  </div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className={`text-xs font-bold font-mono ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {tx.type === 'income' ? '+' : '-'}{tx.currency === 'USD' ? '$' : '¥'}{tx.amount.toLocaleString()}
                              </div>
                              {tx.currency !== activeCurrency && (
                                  <div className="text-[9px] text-slate-600">≈ {formatMoney(convertToActive(tx.amount, tx.currency))}</div>
                              )}
                          </div>
                      </div>
                  ))}
                  {visibleTransactions.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                          <Search className="w-6 h-6 mb-2 opacity-20" />
                          <p className="text-xs">暂无记录</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
              <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-indigo-500" />
                          记一笔 (New Transaction)
                      </h3>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  
                  {/* AI Smart Fill */}
                  <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-3 mb-4 flex gap-2">
                      <input 
                          type="text" 
                          value={smartInput}
                          onChange={(e) => setSmartInput(e.target.value)}
                          placeholder='AI 智能填单: "昨天用 PayPal 支付了 500 美元广告费"'
                          className="flex-1 bg-slate-950/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                          onClick={handleSmartFill}
                          disabled={isSmartFilling || !smartInput}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                      >
                          {isSmartFilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setNewTx({...newTx, type: 'income'})} className={`py-2 text-sm font-bold rounded-lg border ${newTx.type === 'income' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>收入 Income</button>
                          <button onClick={() => setNewTx({...newTx, type: 'expense'})} className={`py-2 text-sm font-bold rounded-lg border ${newTx.type === 'expense' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>支出 Expense</button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1">
                              <label className="text-xs text-slate-400 block mb-1">货币</label>
                              <select value={newTx.currency} onChange={(e) => setNewTx({...newTx, currency: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                                  <option value="CNY">CNY</option>
                                  <option value="USD">USD</option>
                              </select>
                          </div>
                          <div className="col-span-2">
                              <label className="text-xs text-slate-400 block mb-1">金额</label>
                              <input type="number" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" placeholder="0.00" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">分类</label>
                              <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2">
                                  <option value="Revenue">收入 (Revenue)</option>
                                  <option value="COGS">采购 (COGS)</option>
                                  <option value="Logistics">物流 (Logistics)</option>
                                  <option value="Marketing">营销 (Marketing)</option>
                                  <option value="Software">软件 (Software)</option>
                                  <option value="Office">办公 (Office)</option>
                                  <option value="Payroll">薪资 (Payroll)</option>
                                  <option value="Other">其他 (Other)</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">日期</label>
                              <input type="date" value={newTx.date} onChange={(e) => setNewTx({...newTx, date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs text-slate-400 block mb-1">备注说明</label>
                          <input type="text" value={newTx.description || ''} onChange={(e) => setNewTx({...newTx, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" placeholder="交易详情..." />
                      </div>
                  </div>

                  <button onClick={handleAddTransaction} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-6 shadow-lg">保存交易</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;
