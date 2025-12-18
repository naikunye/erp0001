
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Wallet, Loader2, TrendingUp, Sparkles, Command, Zap, Gem, Package, Info, AlertTriangle, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { AiInsight } from '../types';

const Dashboard: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<AiInsight[]>([]);

  const EXCHANGE_RATE = 7.2;

  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 500);
      handleProactiveAudit();
      return () => clearTimeout(timer);
  }, []);

  const activeProducts = useMemo(() => state.products.filter(p => !p.deletedAt), [state.products]);

  // --- 核心修复：资产穿透核算引擎 V3.1 (同步库存页验证逻辑) ---
  const metrics = useMemo(() => {
      let totalStockValueCNY = 0;
      let totalPotentialProfitUSD = 0;
      let totalInvestmentCNY = 0;

      activeProducts.forEach(p => {
          const stock = Math.max(p.stock || 0, 0);
          const costCNY = p.costPrice || 0;
          totalStockValueCNY += stock * costCNY;

          if (stock === 0) return; 

          // 1. 物流成本精确核算 (与 Inventory.tsx 保持绝对一致)
          const dims = p.dimensions || {l:0, w:0, h:0};
          const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
          const autoUnitWeight = Math.max(p.unitWeight || 0, unitVolWeight);
          
          // 确定当前批次的有效计费总重
          let activeTotalWeight = 0;
          if (p.logistics?.billingWeight && p.logistics.billingWeight > 0) {
              activeTotalWeight = p.logistics.billingWeight; // 手动总重优先
          } else if (p.logistics?.unitBillingWeight && p.logistics.unitBillingWeight > 0) {
              activeTotalWeight = p.logistics.unitBillingWeight * stock; // 手动单品计费重
          } else {
              activeTotalWeight = autoUnitWeight * stock; // 系统自动计算
          }

          const rate = p.logistics?.unitFreightCost || 0;
          const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
          const autoTotalFreightCNY = (activeTotalWeight * rate) + batchFeesCNY;
          
          // 最终有效总运费 (支持手动覆盖)
          const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? autoTotalFreightCNY;
          const unitFreightCNY = effectiveTotalFreightCNY / stock;
          const unitLogisticsCNY = unitFreightCNY + (p.logistics?.consumablesFee || 0);
          
          totalInvestmentCNY += (costCNY + unitLogisticsCNY) * stock;

          // 2. 单品净利穿透 (单位：USD)
          const priceUSD = p.price || 0;
          const eco = p.economics;
          const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
          const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
          const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
          const unitAdCostUSD = eco?.adCost || 0; // TikTok 习惯：直接计入单品广告成本
          const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

          // 穿透公式
          const unitProfitUSD = priceUSD - ( (costCNY / EXCHANGE_RATE) + (unitLogisticsCNY / EXCHANGE_RATE) + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + unitAdCostUSD + refundLossUSD );
          
          totalPotentialProfitUSD += unitProfitUSD * stock;
      });

      return {
          stockValueCNY: totalStockValueCNY,
          totalPotentialProfitUSD,
          roi: totalInvestmentCNY > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / totalInvestmentCNY * 100) : 0,
          lowStockSkus: activeProducts.filter(p => p.stock < 20).length
      };
  }, [activeProducts]);

  const handleProactiveAudit = async () => {
    const mockInsights: AiInsight[] = [
        {
            id: 'ins-1',
            type: 'risk',
            title: '库存断货风险告警',
            content: '部分核心 SKU 过去 48h 销量波动，请关注补货提醒。',
            priority: 'high',
            timestamp: '刚刚'
        }
    ];
    setInsights(mockInsights);
  };

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `你是一个供应链财务专家。当前库存货值 ¥${metrics.stockValueCNY.toLocaleString()}，穿透预估净利 $${metrics.totalPotentialProfitUSD.toLocaleString()}，整体 ROI ${metrics.roi.toFixed(1)}%。请简要分析当前资产结构（中文 HTML 格式，使用 <b> 加粗）。`;
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
      <div className="ios-glass-panel border-violet-500/30 bg-violet-500/5 p-4 rounded-2xl flex items-center gap-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 animate-pulse"></div>
          <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 bg-violet-600 rounded-lg text-white">
                  <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xs font-black text-violet-400 uppercase tracking-[0.2em]">AI Sentry</span>
          </div>
          <div className="flex-1 flex gap-8 overflow-x-auto scrollbar-none">
              {insights.map(ins => (
                  <div key={ins.id} className="flex items-center gap-3 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${ins.type === 'risk' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white uppercase">{ins.title}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1 w-64">{ins.content}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard loading={isLoading} title="库存采购资产规模" value={`¥${metrics.stockValueCNY.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend="实时持仓" trendUp={true} icon={Wallet} accentColor="blue" />
        <StatCard loading={isLoading} title="穿透式预估净利" value={`$${metrics.totalPotentialProfitUSD.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.roi.toFixed(1)}% ROI`} trendUp={metrics.roi >= 0} icon={Gem} accentColor="purple" />
        <StatCard loading={isLoading} title="全链路断货风险" value={metrics.lowStockSkus} subValue="SKUs" trend="库存健康度" trendUp={metrics.lowStockSkus === 0} icon={AlertTriangle} accentColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
              <div className="ios-glass-card p-1 relative group">
                <div className="p-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-black/60 border border-white/10 rounded-2xl text-violet-400">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight italic uppercase">资产风控审计系统</h2>
                            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">基于有效分摊成本模型的实时穿透</p>
                        </div>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isGenerating} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />} 生成审计报告
                    </button>
                </div>
                {report && (
                    <div className="px-6 pb-6 animate-in fade-in relative z-10">
                        <div className="p-6 bg-black/60 rounded-2xl border border-white/5 text-slate-200 leading-relaxed font-mono text-xs" dangerouslySetInnerHTML={{ __html: report }}></div>
                    </div>
                )}
              </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="ios-glass-card p-6 flex flex-col flex-1 border-l-4 border-l-blue-500">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Box className="w-4 h-4 text-blue-500" /> 物流在途资产
                  </h3>
                  <div className="space-y-6">
                      {state.shipments.slice(0, 3).map(ship => (
                          <div key={ship.id} className="relative pl-6 border-l border-white/5">
                              <div className="absolute left-[-4.5px] top-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-[11px] font-bold text-white font-mono">{ship.trackingNo}</span>
                                  <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{ship.status}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">{ship.productName}</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
