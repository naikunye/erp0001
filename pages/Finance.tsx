
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
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [smartInput, setSmartInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);

  const EXCHANGE_RATE = 7.2;

  // --- REFACTORED: UNIFIED ASSET ENGINE ---
  const realFinanceData = useMemo(() => {
    const activeProducts = state.products.filter(p => !p.deletedAt);

    let totalStockValueCNY = 0;
    let totalPotentialProfitUSD = 0;
    let totalPotentialRevenueUSD = 0;

    activeProducts.forEach(p => {
        const stock = p.stock || 0;
        const costCNY = p.costPrice || 0;
        totalStockValueCNY += stock * costCNY;

        const unitRealWeight = p.unitWeight || 0;
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const unitChargeWeight = Math.max(unitRealWeight, unitVolWeight);
        
        const rate = p.logistics?.unitFreightCost || 0;
        const billingWeightTotal = (p.logistics?.billingWeight || (unitChargeWeight * stock));
        const batchFees = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
        const totalFreightCNY = p.logistics?.totalFreightCost ?? (billingWeightTotal * rate + batchFees);

        const unitFreightUSD = (stock > 0 ? (totalFreightCNY / stock) : (rate * unitChargeWeight)) / EXCHANGE_RATE;
        const consumablesUSD = (p.logistics?.consumablesFee || 0) / EXCHANGE_RATE;
        const priceUSD = p.price || 0;
        const costUSD = costCNY / EXCHANGE_RATE;

        const eco = p.economics;
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
        const refundUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

        const totalUnitCostUSD = costUSD + unitFreightUSD + consumablesUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + refundUSD;
        const unitProfitUSD = priceUSD - totalUnitCostUSD;
        
        totalPotentialProfitUSD += unitProfitUSD * stock;
        totalPotentialRevenueUSD += priceUSD * stock;
    });

    return {
        stockValueCNY: totalStockValueCNY,
        potentialProfitUSD: totalPotentialProfitUSD,
        potentialRevenueUSD: totalPotentialRevenueUSD,
        margin: totalPotentialRevenueUSD > 0 ? (totalPotentialProfitUSD / totalPotentialRevenueUSD) * 100 : 0
    };
  }, [state.products]);

  const formatMoney = (amount: number, fromCurrency: 'CNY' | 'USD') => {
    let finalAmount = amount;
    if (fromCurrency === 'CNY' && activeCurrency === 'USD') finalAmount = amount / EXCHANGE_RATE;
    if (fromCurrency === 'USD' && activeCurrency === 'CNY') finalAmount = amount * EXCHANGE_RATE;

    return new Intl.NumberFormat(activeCurrency === 'CNY' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: activeCurrency,
      maximumFractionDigits: 0,
    }).format(finalAmount);
  };

  const handleSmartFill = async () => {
    if (!smartInput.trim()) return;
    setIsSmartFilling(true);
    try {
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
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Act as a CFO. Stock Asset: ¥${realFinanceData.stockValueCNY.toLocaleString()}, Potential Profit $${realFinanceData.potentialProfitUSD.toLocaleString()}, Margin: ${realFinanceData.margin.toFixed(1)}%. Analyze asset health in 3 Chinese bullet points (HTML).`;
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
                  基于库存实况测算 • 汇率: 1 USD = {EXCHANGE_RATE} CNY
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
                      <div className="text-2xl font-mono font-bold text-white">{formatMoney(realFinanceData.stockValueCNY, 'CNY')}</div>
                      <div className="text-[10px] text-slate-500 mt-1">当前持仓采购成本总额</div>
                  </div>
                  <div className="ios-glass-card p-5 border-l-4 border-l-purple-500 bg-indigo-500/5 ring-1 ring-indigo-500/20">
                      <div className="text-xs text-indigo-400 uppercase font-bold mb-2 flex items-center gap-2"><Gem className="w-3 h-3"/> 库存预计销售总利 (Potential)</div>
                      <div className="text-2xl font-mono font-bold text-indigo-100">{formatMoney(realFinanceData.potentialProfitUSD, 'USD')}</div>
                      <div className="text-[10px] text-indigo-500/80 mt-1">商品全部售出后的预估利润 (全成本模型)</div>
                  </div>
                  <div className="ios-glass-card p-5 border-l-4 border-l-orange-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-orange-400"/> 预估销售毛利 (Margin)</div>
                      <div className={`text-2xl font-mono font-bold ${realFinanceData.margin > 15 ? 'text-emerald-400' : 'text-orange-400'}`}>{realFinanceData.margin.toFixed(1)}%</div>
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
                                          { name: '潜在利润', value: Math.round(realFinanceData.potentialProfitUSD) },
                                          { name: '库存成本', value: Math.round(realFinanceData.stockValueCNY / EXCHANGE_RATE) }
                                      ]}
                                      innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none"
                                  >
                                      <Cell fill="#10b981" /> <Cell fill="#3b82f6" />
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
    </div>
  );
};

export default Finance;
