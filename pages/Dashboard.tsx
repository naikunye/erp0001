
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

  // --- 资产穿透引擎 V2.5+ ---
  const metrics = useMemo(() => {
      let totalStockValueCNY = 0;
      let totalPotentialProfitUSD = 0;
      let totalWeightKG = 0;
      let totalInvestmentCNY = 0;

      activeProducts.forEach(p => {
          const stock = p.stock || 0;
          const costCNY = p.costPrice || 0;
          totalStockValueCNY += stock * costCNY;
          totalWeightKG += stock * (p.unitWeight || 0);

          const dims = p.dimensions || {l:0, w:0, h:0};
          const theoreticalWeight = Math.max(p.unitWeight || 0, (dims.l * dims.w * dims.h) / 6000);
          const rate = p.logistics?.unitFreightCost || 0;
          const batchFees = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
          const unitLogisticsCNY = (theoreticalWeight * rate) + (batchFees / Math.max(stock, 1)) + (p.logistics?.consumablesFee || 0);
          
          totalInvestmentCNY += (costCNY + unitLogisticsCNY) * stock;

          const priceUSD = p.price || 0;
          const eco = p.economics;
          const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
          const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
          const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
          const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

          const unitProfitUSD = priceUSD - ( (costCNY / EXCHANGE_RATE) + (unitLogisticsCNY / EXCHANGE_RATE) + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + refundLossUSD );
          totalPotentialProfitUSD += unitProfitUSD * stock;
      });

      return {
          stockValueCNY: totalStockValueCNY,
          totalPotentialProfitUSD,
          totalWeightKG,
          roi: totalInvestmentCNY > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / totalInvestmentCNY * 100) : 0,
          lowStockSkus: activeProducts.filter(p => p.stock < 20).length
      };
  }, [activeProducts]);

  // --- AI 哨兵主动审计 ---
  const handleProactiveAudit = async () => {
    // 模拟 AI 主动扫描并生成实时洞察
    const mockInsights: AiInsight[] = [
        {
            id: 'ins-1',
            type: 'risk',
            title: '库存断货风险告警',
            content: 'SKU-BOX2 过去 48h 销量激增 140%，当前 FBA 库存仅剩 12 件，预计将在 2.4 天内断货。建议立即发起 50pcs 空运补货。',
            priority: 'high',
            timestamp: '刚刚'
        },
        {
            id: 'ins-2',
            type: 'opportunity',
            title: '头程物流优化机会',
            content: '检测到美西快船价格近期下调 15%。当前待发货的 SKU-MA001 建议由“空运”切换为“海运加班船”，可节省约 ¥4,200 成本。',
            priority: 'medium',
            timestamp: '15分钟前'
        }
    ];
    setInsights(mockInsights);
  };

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Role: Supply Chain Strategist. Stock: ¥${metrics.stockValueCNY.toLocaleString()}, Profit: $${metrics.totalPotentialProfitUSD.toLocaleString()}, Global ROI: ${metrics.roi.toFixed(1)}%. Negative SKU count: ${metrics.lowStockSkus}. Provide a Proactive Sentry Audit Report in Chinese HTML focusing on immediate actions.`;
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
      {/* AI Sentry Bar - 主动决策流 */}
      <div className="ios-glass-panel border-violet-500/30 bg-violet-500/5 p-4 rounded-2xl flex items-center gap-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 animate-pulse"></div>
          <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 bg-violet-600 rounded-lg text-white shadow-lg shadow-violet-900/40">
                  <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xs font-black text-violet-400 uppercase tracking-[0.2em]">AI Sentry</span>
          </div>
          <div className="flex-1 flex gap-8 overflow-x-auto scrollbar-none">
              {insights.map(ins => (
                  <div key={ins.id} className="flex items-center gap-3 shrink-0 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all">
                      <div className={`w-2 h-2 rounded-full ${ins.type === 'risk' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white uppercase">{ins.title}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1 w-64">{ins.content}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
              ))}
          </div>
          <button className="text-[10px] font-bold text-violet-400 hover:text-white border-l border-white/5 pl-4 shrink-0 uppercase tracking-widest">
              查看全部决策 &gt;
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard loading={isLoading} title="库存采购资产规模" value={`¥${metrics.stockValueCNY.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend="实时持仓" trendUp={true} icon={Wallet} accentColor="blue" />
        <StatCard loading={isLoading} title="穿透式预估净利" value={`$${metrics.totalPotentialProfitUSD.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.roi.toFixed(1)}% ROI`} trendUp={metrics.roi >= 0} icon={Gem} accentColor="purple" />
        <StatCard loading={isLoading} title="全链路断货风险" value={metrics.lowStockSkus} subValue="SKUs" trend="库存健康度" trendUp={metrics.lowStockSkus === 0} icon={AlertTriangle} accentColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：资产诊断报告 */}
          <div className="lg:col-span-8 space-y-6">
              <div className="ios-glass-card p-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 rounded-[20px] pointer-events-none"></div>
                <div className="p-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-black/60 border border-white/10 rounded-2xl text-violet-400">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight italic uppercase">资产风控审计系统</h2>
                            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Kernel v2.5.8 • Integrated Proactive Audit</p>
                        </div>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isGenerating} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-xl shadow-violet-900/30 transition-all active:scale-95 flex items-center gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />} 即刻生成穿透报告
                    </button>
                </div>
                {report && (
                    <div className="px-6 pb-6 animate-in fade-in relative z-10">
                        <div className="p-6 bg-black/60 rounded-2xl border border-white/5 text-slate-200 leading-relaxed font-mono shadow-inner text-xs prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: report }}></div>
                    </div>
                )}
              </div>
          </div>

          {/* 右侧：物流管道简报 */}
          <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="ios-glass-card p-6 flex flex-col flex-1 border-l-4 border-l-blue-500">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Box className="w-4 h-4 text-blue-500" /> 物流管道资产 (Pipeline)
                  </h3>
                  <div className="space-y-6">
                      {state.shipments.slice(0, 3).map(ship => (
                          <div key={ship.id} className="relative pl-6">
                              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5"></div>
                              <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-[11px] font-bold text-white font-mono">{ship.trackingNo}</span>
                                  <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{ship.status}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mb-2 truncate">{ship.productName}</div>
                              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600/40 w-2/3"></div>
                              </div>
                              <div className="flex justify-between mt-1 text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
                                  <span>Departure</span>
                                  <span>ETA: {ship.estimatedDelivery}</span>
                              </div>
                          </div>
                      ))}
                      <button onClick={() => dispatch({type: 'NAVIGATE', payload: {page: 'logistics-hub'}})} className="w-full py-2 border border-white/5 hover:bg-white/5 rounded-lg text-[10px] font-bold text-slate-500 transition-all uppercase tracking-widest">
                          管理全球货件 &gt;
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
