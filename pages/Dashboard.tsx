
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Wallet, Loader2, TrendingUp, Sparkles, Command, Zap, Gem, Package } from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const { state } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const EXCHANGE_RATE = 7.2;

  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
  }, []);

  const activeProducts = useMemo(() => state.products.filter(p => !p.deletedAt), [state.products]);

  // --- UNIFIED CALCULATOR ENGINE (Shared Logic) ---
  const metrics = useMemo(() => {
      let totalStockValueCNY = 0;
      let totalStockProfitUSD = 0;
      let totalStockRevenueUSD = 0;
      let totalWeightKG = 0;
      let seaFreightAssetCNY = 0;
      let airFreightAssetCNY = 0;

      activeProducts.forEach(p => {
          const stock = p.stock || 0;
          const costCNY = p.costPrice || 0;
          totalStockValueCNY += stock * costCNY;

          // 1. Logistics Weight & Cost
          const unitRealWeight = p.unitWeight || 0;
          const dims = p.dimensions || {l:0, w:0, h:0};
          const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
          const unitChargeableWeight = Math.max(unitRealWeight, unitVolWeight);
          totalWeightKG += stock * unitRealWeight;

          const rate = p.logistics?.unitFreightCost || 0;
          const billingWeightTotal = (p.logistics?.billingWeight || (unitChargeableWeight * stock));
          const batchFees = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
          const totalFreightCNY = p.logistics?.totalFreightCost ?? (billingWeightTotal * rate + batchFees);
          
          if (p.logistics?.method === 'Sea') seaFreightAssetCNY += totalFreightCNY;
          else airFreightAssetCNY += totalFreightCNY;

          // 2. Unit Profit Calculation (Full Cost Model)
          const unitFreightUSD = (stock > 0 ? (totalFreightCNY / stock) : (rate * unitChargeableWeight)) / EXCHANGE_RATE;
          const consumablesUSD = (p.logistics?.consumablesFee || 0) / EXCHANGE_RATE;
          const costUSD = costCNY / EXCHANGE_RATE;
          const priceUSD = p.price || 0;
          
          const eco = p.economics;
          const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
          const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
          const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
          const refundUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

          const totalUnitCostUSD = costUSD + unitFreightUSD + consumablesUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + refundUSD;
          const unitProfitUSD = priceUSD - totalUnitCostUSD;

          totalStockProfitUSD += unitProfitUSD * stock;
          totalStockRevenueUSD += priceUSD * stock;
      });

      return {
          stockValueCNY: totalStockValueCNY,
          totalStockProfitUSD,
          totalWeightKG,
          margin: totalStockRevenueUSD > 0 ? (totalStockProfitUSD / totalStockRevenueUSD) * 100 : 0,
          seaFreightAssetCNY,
          airFreightAssetCNY
      };
  }, [activeProducts]);

  const costData = useMemo(() => [
      { name: '海运在库资产', value: Math.round(metrics.seaFreightAssetCNY) },
      { name: '空运在库资产', value: Math.round(metrics.airFreightAssetCNY) },
  ], [metrics]);

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Role: Supply Chain expert. Stock Value ¥${metrics.stockValueCNY.toLocaleString()}, Profit $${metrics.totalStockProfitUSD.toLocaleString()}, Margin ${metrics.margin.toFixed(1)}%. Analyze in 3 brief HTML bullet points.`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setReport(response.text);
      } catch (e) {
          setReport(`<b>系统提示:</b> AI 服务暂时不可用。`);
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
                    <p className="text-sm text-slate-400 font-mono mt-1">全局统一利润模型已生效 • 实时资产穿透</p>
                </div>
            </div>
            <button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />} 生成资产诊断
            </button>
        </div>
        {report && (
            <div className="px-6 pb-6 animate-in fade-in relative z-10">
                <div className="p-5 bg-black/40 rounded-xl border border-white/5 text-slate-200 leading-relaxed font-mono shadow-inner text-sm" dangerouslySetInnerHTML={{ __html: report }}></div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard loading={isLoading} title="库存采购资金占用" value={`¥${metrics.stockValueCNY.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend="采购成本基准" trendUp={true} icon={Wallet} accentColor="blue" />
        <StatCard loading={isLoading} title="库存预计销售总利" value={`$${metrics.totalStockProfitUSD.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.margin.toFixed(1)}% 毛利率`} trendUp={true} icon={Gem} accentColor="green" />
        <StatCard loading={isLoading} title="待售货物理重总计" value={metrics.totalWeightKG.toFixed(1)} subValue="kg" trend="物流仓储负载" trendUp={true} icon={Box} accentColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FIXED PIE CHART CONTAINER */}
        <div className="ios-glass-card p-8 flex flex-col min-h-[500px]">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                海空运输渠道资产分布 (Freight Value)
            </h3>
            <div className="flex-1 w-full relative min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie 
                            data={costData} 
                            cx="50%" 
                            cy="45%" 
                            innerRadius={75} 
                            outerRadius={110} 
                            paddingAngle={8} 
                            dataKey="value" 
                            stroke="none"
                        >
                            <Cell fill="#06b6d4" />
                            <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                            formatter={(value: number) => `¥${value.toLocaleString()}`}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-14">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">在库物流估值</p>
                    <p className="text-3xl font-mono font-bold text-white">¥{((metrics.seaFreightAssetCNY + metrics.airFreightAssetCNY) / 1000).toFixed(1)}k</p>
                </div>
            </div>
        </div>

        <div className="ios-glass-card p-8 bg-gradient-to-br from-indigo-950/20 to-transparent flex flex-col min-h-[500px]">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                资产流动性与利润预测
            </h3>
            <div className="space-y-8 flex-1">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-300">潜在利润转化进度 (Forecast)</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">82%</span>
                    </div>
                    <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-1 border border-white/5">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" style={{width: '82%'}}></div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-black/40 border border-white/10 rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">全站平均周转天数</div>
                        <div className="text-2xl font-mono font-bold text-white">42.5 <span className="text-xs">Days</span></div>
                    </div>
                    <div className="p-5 bg-black/40 border border-white/10 rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">资金加权回笼期</div>
                        <div className="text-2xl font-mono font-bold text-white">T+15</div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
