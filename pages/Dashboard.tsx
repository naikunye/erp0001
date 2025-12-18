
import React, { useState, useMemo, useEffect } from 'react';
// Fix: Added missing 'Info' import from lucide-react
import { Box, Wallet, Loader2, TrendingUp, Sparkles, Command, Zap, Gem, Package, Info } from 'lucide-react';
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

  // --- 汇总指标统一引擎 ---
  const metrics = useMemo(() => {
      let totalStockValueCNY = 0;
      let totalPotentialProfitUSD = 0;
      let totalWeightKG = 0;
      let totalInvestmentCNY = 0; // 采购成本 + 分摊物流

      activeProducts.forEach(p => {
          const stock = p.stock || 0;
          const costCNY = p.costPrice || 0;
          totalStockValueCNY += stock * costCNY;
          totalWeightKG += stock * (p.unitWeight || 0);

          // 物流分摊逻辑对齐 V2.5
          const dims = p.dimensions || {l:0, w:0, h:0};
          const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
          const theoreticalWeight = Math.max(p.unitWeight || 0, unitVolWeight);
          
          const rate = p.logistics?.unitFreightCost || 0;
          const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
          const divisor = Math.max(stock, 100); 
          const unitLogisticsCNY = (theoreticalWeight * rate) + (batchFeesCNY / divisor) + (p.logistics?.consumablesFee || 0);
          
          // 总投资额（用于 ROI 分母）
          totalInvestmentCNY += (costCNY + unitLogisticsCNY) * stock;

          // 利润逻辑对齐
          const priceUSD = p.price || 0;
          const eco = p.economics;
          const unitLogisticsUSD = unitLogisticsCNY / EXCHANGE_RATE;
          const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
          const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
          const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
          const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

          const unitProfitUSD = priceUSD - ( (costCNY / EXCHANGE_RATE) + unitLogisticsUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + refundLossUSD );
          totalPotentialProfitUSD += unitProfitUSD * stock;
      });

      return {
          stockValueCNY: totalStockValueCNY,
          totalPotentialProfitUSD,
          totalWeightKG,
          roi: totalInvestmentCNY > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / totalInvestmentCNY * 100) : 0
      };
  }, [activeProducts]);

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Role: Supply Chain Expert. Inventory ¥${metrics.stockValueCNY.toLocaleString()}, Potential Profit $${metrics.totalPotentialProfitUSD.toLocaleString()}, Global ROI ${metrics.roi.toFixed(1)}%. Provide 3 strategic insights in Chinese HTML.`;
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
                <div className="relative p-3.5 rounded-xl border border-indigo-500/30 bg-black/40 text-indigo-400">
                    <Zap className="w-7 h-7 fill-current" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">资产指挥中心 (V2.5 Engine)</h2>
                    <p className="text-sm text-slate-400 font-mono mt-1">全链路成本穿透监控中</p>
                </div>
            </div>
            <button onClick={handleGenerateReport} disabled={isGenerating} className="px-8 py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-50 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />} 资产诊断
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
        <StatCard loading={isLoading} title="库存预计销售纯利" value={`$${metrics.totalPotentialProfitUSD.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.roi.toFixed(1)}% ROI`} trendUp={metrics.roi >= 0} icon={Gem} accentColor="green" />
        <StatCard loading={isLoading} title="在库货物理重" value={metrics.totalWeightKG.toFixed(1)} subValue="kg" trend="仓储压力" trendUp={true} icon={Box} accentColor="orange" />
      </div>
      
      {/* 补充：核心指标同步说明，增强用户信心 */}
      <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 flex items-center gap-3">
          <Info className="w-4 h-4" />
          <span><b>核算引擎 V2.5 说明：</b> 系统已统一“采购+头程”为 ROI 分母，并自动平滑极端库存下的报关费分摊，确保仪表盘与分析页数据完全同步。</span>
      </div>
    </div>
  );
};

export default Dashboard;
