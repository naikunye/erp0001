
import React, { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, DollarSign, Plus, FileText, 
  PieChart as PieIcon, Landmark, CreditCard, Sparkles, Bot, Loader2, X,
  Wand2, Search, Activity, Gem, ShoppingBag, BarChart3
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { MOCK_TRANSACTIONS } from '../constants';
import { Transaction } from '../types';
import { useTanxing } from '../context/TanxingContext';

type ViewMode = 'overview' | 'ledger' | 'analysis';

const Finance: React.FC = () => {
  const { state, showToast } = useTanxing();
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [activeCurrency, setActiveCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [exchangeRate] = useState(7.2); 
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [smartInput, setSmartInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);

  // --- Helpers ---
  const convertToActive = (amount: number, currency: string) => {
    if (currency === activeCurrency) return amount;
    let valInUSD = amount;
    if (currency === 'CNY') valInUSD = amount / exchangeRate;
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

  // --- REFACTORED: PURE INVENTORY ASSET ENGINE ---
  const realFinanceData = useMemo(() => {
    const activeProducts = state.products.filter(p => !p.deletedAt);

    // 1. Asset Value (Cost Price basis)
    const totalStockValueCNY = activeProducts.reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0);

    // 2. Potential Profit & Potential Revenue
    let totalPotentialProfitUSD = 0;
    let totalPotentialRevenueUSD = 0;

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
        const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
        const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? (activeTotalBillingWeight * rate + batchFeesCNY);
        const effectiveUnitFreightCNY = p.stock > 0 ? effectiveTotalFreightCNY / p.stock : (rate * autoUnitChargeableWeight);
        const totalUnitLogisticsCNY = effectiveUnitFreightCNY + (p.logistics?.consumablesFee || 0);

        const priceUSD = p.price || 0;
        const costPriceUSD = (p.costPrice || 0) / exchangeRate;
        const freightCostUSD = totalUnitLogisticsCNY / exchangeRate;

        const eco = p.economics;
        const platformFee = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFee = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const fixedFee = eco?.fixedCost || 0;
        const lastLeg = eco?.lastLegShipping || 0;
        const adSpend = eco?.adCost || 0;
        const estimatedRefundCost = priceUSD * ((eco?.refundRatePercent || 0) / 100); 

        const totalUnitCost = costPriceUSD + freightCostUSD + platformFee + creatorFee + fixedFee + lastLeg + adSpend + estimatedRefundCost;
        const unitProfit = priceUSD - totalUnitCost;
        
        totalPotentialProfitUSD += unitProfit * p.stock;
        totalPotentialRevenueUSD += priceUSD * p.stock;
    });

    const totalAdsUSD = transactions
        .filter(t => t.category === 'Marketing')
        .reduce((sum, t) => sum + (t.currency === 'CNY' ? t.amount / exchangeRate : t.amount), 0);

    return {
        stockValueUSD: totalStockValueCNY / exchangeRate,
        potentialProfitUSD: totalPotentialProfitUSD,
        potentialRevenueUSD: totalPotentialRevenueUSD,
        adsUSD: totalAdsUSD
    };
  }, [state.products, transactions, exchangeRate]);

  const stats = useMemo(() => {
    const stockAsset = convertToActive(realFinanceData.stockValueUSD, 'USD');
    const potentialProfit = convertToActive(realFinanceData.potentialProfitUSD, 'USD');
    const potentialRevenue = convertToActive(realFinanceData.potentialRevenueUSD, 'USD');
    const potentialMargin = potentialRevenue > 0 ? (potentialProfit / potentialRevenue) * 100 : 0;

    return { stockAsset, potentialProfit, potentialMargin };
  }, [realFinanceData, activeCurrency, exchangeRate]);

  const handleSmartFill = async () => {
    if (!smartInput.trim()) return;
    setIsSmartFilling(true);
    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Parse this financial text: "${smartInput}". Return JSON: { "amount": number, "currency": "CNY"|"USD", "type": "income"|"expense", "category": "COGS"|"Logistics"|"Marketing"|"Other", "description": "String" }`;
        await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
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
          const prompt = `Act as a CFO. Stock Asset: ${formatMoney(stats.stockAsset)}. Potential Profit: ${formatMoney(stats.potentialProfit)}. Margin: ${stats.potentialMargin.toFixed(1)}%. Analyze asset health in 3 Chinese bullet points (HTML).`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiAnalysis(response.text);
      } catch (e) {
          setAiAnalysis("AI 服务不可用。");
      } finally {
          setIsAiThinking(false);
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                  财务资产 (Finance & Assets)
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                  基于库存实况测算 • 汇率: 1 USD = {exchangeRate} CNY
              </p>
          </div>
          
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setViewMode('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <Activity className="w-3.5 h-3.5" /> 资产总览
              </button>
              <button onClick={() => setViewMode('ledger')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ledger' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <FileText className="w-3.5 h-3.5" /> 现金流水
              </button>
              <button onClick={() => setViewMode('analysis')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <PieIcon className="w-3.5 h-3.5" /> 成本分析
              </button>
          </div>

          <div className="flex gap-2">
              <button onClick={() => setActiveCurrency(activeCurrency === 'CNY' ? 'USD' : 'CNY')} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs text-slate-300 font-mono">
                  {activeCurrency}
              </button>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
                  <Plus className="w-4 h-4" /> 记录流水
              </button>
          </div>
      </div>

      {viewMode === 'overview' && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="ios-glass-card p-5 border-l-4 border-l-blue-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><ShoppingBag className="w-3 h-3 text-blue-400"/> 库存资产价值 (Stock)</div>
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(stats.stockAsset)}</div>
                      <div className="text-[10px] text-slate-500 mt-1">当前持仓采购成本总额</div>
                  </div>
                  <div className="ios-glass-card p-5 border-l-4 border-l-purple-500 bg-indigo-500/5 ring-1 ring-indigo-500/20">
                      <div className="text-xs text-indigo-400 uppercase font-bold mb-2 flex items-center gap-2"><Gem className="w-3 h-3"/> 库存潜在总利 (Potential)</div>
                      <div className="text-2xl font-mono font-bold text-indigo-100">{formatMoney(stats.potentialProfit)}</div>
                      <div className="text-[10px] text-indigo-500/80 mt-1">商品全部售出后的预估利润</div>
                  </div>
                  <div className="ios-glass-card p-5 border-l-4 border-l-orange-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-orange-400"/> 预估销售毛利 (Margin)</div>
                      <div className={`text-2xl font-mono font-bold ${stats.potentialMargin > 15 ? 'text-emerald-400' : 'text-orange-400'}`}>{stats.potentialMargin.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-500 mt-1">基于当前售价与全成本测算</div>
                  </div>
              </div>

              <div className="ios-glass-card p-6 h-96">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400"/> 资产波动监控 (Asset Flow)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={transactions.slice(0, 20).reverse()}>
                          <defs>
                              <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} />
                          <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                          <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333'}} />
                          <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="url(#colorAsset)" strokeWidth={2} name="Asset Value" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      {viewMode === 'analysis' && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/> 资产获利分析报告</h2>
                  <button onClick={handleAiDeepDive} disabled={isAiThinking} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
                      {isAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                      智能生成报告
                  </button>
              </div>

              {aiAnalysis && (
                  <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl text-sm text-indigo-100 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="ios-glass-card p-6 flex flex-col h-[400px]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2"><Gem className="w-4 h-4 text-indigo-400" /> 潜在资产分布</h3>
                      <div className="flex-1 relative">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={[
                                          { name: '潜在利润', value: realFinanceData.potentialProfitUSD },
                                          { name: '库存成本', value: realFinanceData.stockValueUSD },
                                          { name: '广告支出', value: realFinanceData.adsUSD }
                                      ]}
                                      innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none"
                                  >
                                      <Cell fill="#10b981" /> <Cell fill="#3b82f6" /> <Cell fill="#ec4899" />
                                  </Pie>
                                  <Tooltip formatter={(v:number) => `$${v.toLocaleString()}`} />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
              <div className="ios-glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500" /> 手动入账</h3>
                      <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-500"/></button>
                  </div>
                  <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 mb-6 flex gap-2">
                      <input type="text" value={smartInput} onChange={(e) => setSmartInput(e.target.value)} placeholder='AI 解析, 如: "向工厂转账 5w 人民币采购费"' className="flex-1 bg-black/40 border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                      <button onClick={handleSmartFill} disabled={isSmartFilling} className="px-3 bg-indigo-600 rounded-lg text-white text-xs font-bold">
                          {isSmartFilling ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                      </button>
                  </div>
                  <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">确认保存</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;
