
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Wallet, Loader2, TrendingUp, Sparkles, Command, Zap, Gem, Package } from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const { state } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
  }, []);

  const activeProducts = useMemo(() => state.products.filter(p => !p.deletedAt), [state.products]);

  const metrics = useMemo(() => {
      const EXCHANGE_RATE = 7.2;
      const stockValue = activeProducts.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
      
      let totalStockProfitUSD = 0;
      let totalStockRevenuePotentialUSD = 0;

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
          const costPriceUSD = (p.costPrice || 0) / EXCHANGE_RATE;
          const freightCostUSD = totalUnitLogisticsCNY / EXCHANGE_RATE;

          const eco = p.economics;
          const platformFee = priceUSD * ((eco?.platformFeePercent || 0) / 100);
          const creatorFee = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
          const fixedFee = eco?.fixedCost || 0;
          const lastLeg = eco?.lastLegShipping || 0;
          const adSpend = eco?.adCost || 0;
          const estimatedRefundCost = priceUSD * ((eco?.refundRatePercent || 0) / 100); 

          const totalUnitCost = costPriceUSD + freightCostUSD + platformFee + creatorFee + fixedFee + lastLeg + adSpend + estimatedRefundCost;
          const unitProfit = priceUSD - totalUnitCost;
          
          totalStockProfitUSD += unitProfit * p.stock;
          totalStockRevenuePotentialUSD += priceUSD * p.stock;
      });

      const stockPotentialMargin = totalStockRevenuePotentialUSD > 0 ? (totalStockProfitUSD / totalStockRevenuePotentialUSD) * 100 : 0;
      const logisticsWeight = activeProducts.reduce((acc, p) => acc + (p.stock * (p.unitWeight || 0)), 0);
      
      return {
          stockValue,
          totalStockProfit: totalStockProfitUSD,
          stockMargin: stockPotentialMargin.toFixed(1),
          logisticsWeight: logisticsWeight.toFixed(1),
      };
  }, [activeProducts]);

  const costData = useMemo(() => {
      let seaCost = 0;
      let airCost = 0;
      activeProducts.forEach(p => {
          const method = p.logistics?.method || 'Sea';
          const rate = p.logistics?.unitFreightCost || 0;
          const cost = (p.stock * (p.unitWeight || 0)) * rate;
          if (method === 'Sea') seaCost += cost;
          else airCost += cost;
      });
      return [
          { name: '海运资产', value: seaCost },
          { name: '空运资产', value: airCost },
      ];
  }, [activeProducts]);

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Role: Supply Chain Expert. Stock Asset: ¥${metrics.stockValue.toLocaleString()}. Potential Profit: $${metrics.totalStockProfit.toLocaleString()}. Margin: ${metrics.stockMargin}%. Provide 3 strategic suggestions in Chinese (HTML).`;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          setReport(response.text);
      } catch (e) {
          setReport(`<b>系统离线:</b> 无法生成 AI 报告。`);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="holo-card p-1 animate-in fade-in slide-in-from-top-4">
        <div className="p-6 flex flex-col md:flex-row items-center justify-between relative z-10 bg-gradient-to-r from-indigo-900/20 to-transparent rounded-[20px] border border-white/10">
            <div className="flex items-center gap-6">
                <div className="relative p-3.5 rounded-xl border border-indigo-500/30 bg-black/40 text-indigo-400 shadow-lg shadow-indigo-500/10">
                    <Zap className="w-7 h-7 fill-current" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">供应链资产透视 (Asset Insight)</h2>
                    <p className="text-sm text-slate-400 font-mono mt-1">正在实时监控 {activeProducts.length} 个 SKU 的盈利潜力...</p>
                </div>
            </div>
            {!report && (
                <button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all active:scale-95">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />} 生成资产诊断
                </button>
            )}
        </div>
        {report && (
            <div className="px-6 pb-6 animate-in fade-in relative z-10">
                <div className="p-5 bg-black/40 rounded-xl border border-white/5 text-slate-200 leading-relaxed font-mono shadow-inner" dangerouslySetInnerHTML={{ __html: report }}></div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard loading={isLoading} title="库存资金占用 (Stock Asset)" value={`¥${metrics.stockValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend="Current Value" trendUp={true} icon={Wallet} accentColor="blue" />
        <StatCard loading={isLoading} title="库存潜在总利 (Stock Profit)" value={`$${metrics.totalStockProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.stockMargin}% Margin`} trendUp={true} icon={Gem} accentColor="green" />
        <StatCard loading={isLoading} title="库存总重量 (Total Weight)" value={metrics.logisticsWeight} subValue="kg" trend="Logistics Focus" trendUp={true} icon={Box} accentColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ios-glass-card p-8 flex flex-col items-center justify-center">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3 w-full">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                海空运输资产占比
            </h3>
            <div className="flex-1 w-full h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={costData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                            <Cell fill="#06b6d4" />
                            <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">总物流价值</p>
                    <p className="text-3xl font-mono font-bold text-white">¥{(metrics.stockValue/1000).toFixed(1)}k</p>
                </div>
            </div>
            <div className="flex gap-8 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                    <span className="w-3 h-3 rounded-full bg-cyan-500"></span> 海运资产
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> 空运资产
                </div>
            </div>
        </div>

        <div className="ios-glass-card p-8 bg-gradient-to-br from-indigo-950/20 to-transparent">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                资产变现预测
            </h3>
            <div className="space-y-6">
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-300">潜在利润转化率 (Forecast)</span>
                        <span className="text-lg font-mono font-bold text-emerald-400">82%</span>
                    </div>
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{width: '82%'}}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3">基于目前日销速度与补货周期的资产流转预测</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">平均周转天数</div>
                        <div className="text-xl font-mono font-bold text-white">42.5 Days</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">资金回笼周期</div>
                        <div className="text-xl font-mono font-bold text-white">T+15</div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
