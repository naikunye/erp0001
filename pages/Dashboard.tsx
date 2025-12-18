
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

  // --- 全局统一计算引擎 (Unified Logic) ---
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

          // 1. 物流成本分摊
          const unitRealWeight = p.unitWeight || 0;
          const dims = p.dimensions || {l:0, w:0, h:0};
          const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
          const unitChargeableWeight = Math.max(unitRealWeight, unitVolWeight);
          totalWeightKG += stock * unitRealWeight;

          const rate = p.logistics?.unitFreightCost || 0;
          
          // 获取当前批次的计费总重 (逻辑与 Inventory 同步)
          let activeTotalBillingWeight = 0;
          if (p.logistics?.billingWeight && p.logistics.billingWeight > 0) {
              activeTotalBillingWeight = p.logistics.billingWeight;
          } else if (p.logistics?.unitBillingWeight && p.logistics.unitBillingWeight > 0) {
              activeTotalBillingWeight = p.logistics.unitBillingWeight * stock;
          } else {
              activeTotalBillingWeight = unitChargeableWeight * stock;
          }

          const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
          const autoTotalFreightCNY = (activeTotalBillingWeight * rate) + batchFeesCNY;
          
          // 最终有效总运费
          const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? autoTotalFreightCNY;
          
          if (p.logistics?.method === 'Sea') seaFreightAssetCNY += effectiveTotalFreightCNY;
          else airFreightAssetCNY += effectiveTotalFreightCNY;

          // 2. 利润计算 (同步全成本模型)
          const unitFreightUSD = (stock > 0 ? (effectiveTotalFreightCNY / stock) : (rate * unitChargeableWeight)) / EXCHANGE_RATE;
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
          roi: totalStockValueCNY > 0 ? (totalStockProfitUSD * EXCHANGE_RATE / totalStockValueCNY) * 100 : 0,
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
          const prompt = `Role: Supply Chain Expert. Inventory ¥${metrics.stockValueCNY.toLocaleString()}, Profit $${metrics.totalStockProfitUSD.toLocaleString()}, Global ROI ${metrics.roi.toFixed(1)}%. Provide 3 strategic insights in Chinese HTML.`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setReport(response.text);
      } catch (e) {
          setReport(`<b>系统提示:</b> AI 报告生成暂时不可用。`);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="holo-card p-1 animate-in fade-in slide-in-from-top-4">
        <div className="p-6 flex flex-col md:flex-row items-center justify-between relative z-10 bg-gradient-to-r from-indigo-900/20 to-transparent rounded-[20px] border border-white/10">
            <div className="flex items-center gap-6">
                <div className="relative p-3.5 rounded-xl border border-indigo-500/30 bg-black/40 text-indigo-400">
                    <Zap className="w-7 h-7 fill-current" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">供应链资产透视 (Asset Insight)</h2>
                    <p className="text-sm text-slate-400 font-mono mt-1 uppercase">Unified Calculator Engine v2.1 Activated</p>
                </div>
            </div>
            <button onClick={handleGenerateReport} disabled={isGenerating} className="px-8 py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50">
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
        <StatCard loading={isLoading} title="库存采购资金占用" value={`¥${metrics.stockValueCNY.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend="持仓成本" trendUp={true} icon={Wallet} accentColor="blue" />
        <StatCard loading={isLoading} title="库存预计销售总利" value={`$${metrics.totalStockProfitUSD.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.roi.toFixed(1)}% 预估 ROI`} trendUp={metrics.roi >= 0} icon={Gem} accentColor="green" />
        <StatCard loading={isLoading} title="待售货物理重总计" value={metrics.totalWeightKG.toFixed(1)} subValue="kg" trend="物流仓储负载" trendUp={true} icon={Box} accentColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                资产赚钱效率排行 (ROI Efficiency)
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {activeProducts
                    .map(p => {
                        // 此处计算逻辑必须完全复刻 Analytics.tsx
                        const stock = p.stock || 0;
                        const costPriceUSD = (p.costPrice || 0) / EXCHANGE_RATE;
                        const unitRealWeight = p.unitWeight || 0;
                        const dims = p.dimensions || {l:0, w:0, h:0};
                        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
                        const unitChargeableWeight = Math.max(unitRealWeight, unitVolWeight);
                        
                        let activeTotalBillingWeight = 0;
                        if (p.logistics?.billingWeight && p.logistics.billingWeight > 0) {
                            activeTotalBillingWeight = p.logistics.billingWeight;
                        } else if (p.logistics?.unitBillingWeight && p.logistics.unitBillingWeight > 0) {
                            activeTotalBillingWeight = p.logistics.unitBillingWeight * stock;
                        } else {
                            activeTotalBillingWeight = unitChargeableWeight * stock;
                        }

                        const rate = p.logistics?.unitFreightCost || 0;
                        const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
                        const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? ((activeTotalBillingWeight * rate) + batchFeesCNY);
                        
                        const unitFreightUSD = (stock > 0 ? (effectiveTotalFreightCNY / stock) : (rate * unitChargeableWeight)) / EXCHANGE_RATE;
                        const priceUSD = p.price || 0;
                        const eco = p.economics;
                        const feesUSD = (priceUSD * ((eco?.platformFeePercent || 0) + (eco?.creatorFeePercent || 0)) / 100) + 
                                        (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0) + (priceUSD * (eco?.refundRatePercent || 0) / 100);
                        
                        const unitProfitUSD = priceUSD - (costPriceUSD + unitFreightUSD + (p.logistics?.consumablesFee || 0) / EXCHANGE_RATE + feesUSD);
                        const roi = (p.costPrice && p.costPrice > 0) ? (unitProfitUSD * EXCHANGE_RATE / p.costPrice * 100) : 0;
                        return { sku: p.sku, roi };
                    })
                    .sort((a, b) => b.roi - a.roi)
                    .slice(0, 5)
                    .map((item, i) => (
                        <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-500">0{i+1}</span>
                                <span className="text-sm font-bold text-white group-hover:text-indigo-400">{item.sku}</span>
                            </div>
                            <span className={`text-sm font-mono font-bold ${item.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {item.roi.toFixed(1)}%
                            </span>
                        </div>
                    ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 italic text-center">
                注：ROI 基于（单品净利 × 汇率 / 采购单价）计算，已包含所有物流分摊。
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
