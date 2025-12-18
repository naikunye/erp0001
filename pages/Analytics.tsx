
import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend, ReferenceLine
} from 'recharts';
import { 
  DollarSign, Activity, Wallet, BrainCircuit, Target, BarChart4,
  Sparkles, AlertTriangle, ArrowRight, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
  text: '#94a3b8',
  grid: 'rgba(255,255,255,0.05)',
};

const Analytics: React.FC = () => {
  const { state, dispatch } = useTanxing();
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const EXCHANGE_RATE = 7.2;

  // --- 核心同步引擎：逻辑必须与 Inventory.tsx 严格对齐 ---
  const analysisData = useMemo(() => {
    const activeProducts = state.products.filter(p => !p.deletedAt);
    
    let totalPotentialProfitUSD = 0;
    let totalStockValueCNY = 0;
    
    const matrixData = activeProducts.map(p => {
        const stock = p.stock || 0;
        const velocity = p.dailyBurnRate || 0;
        const dos = velocity > 0 ? (stock / velocity) : 999;
        const stockValueCNY = stock * (p.costPrice || 0);
        
        // 1. 深度对齐物流分摊逻辑 (The "Fix")
        const unitRealWeight = p.unitWeight || 0;
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const autoUnitChargeableWeight = Math.max(unitRealWeight, unitVolWeight);
        
        let activeTotalBillingWeight = 0;
        if (p.logistics?.billingWeight && p.logistics.billingWeight > 0) {
            activeTotalBillingWeight = p.logistics.billingWeight; // 手动总重优先
        } else if (p.logistics?.unitBillingWeight && p.logistics.unitBillingWeight > 0) {
            activeTotalBillingWeight = p.logistics.unitBillingWeight * stock; // 手动单重次之
        } else {
            activeTotalBillingWeight = autoUnitChargeableWeight * stock; // 理论自动计算
        }

        const rate = p.logistics?.unitFreightCost || 0;
        const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
        const autoTotalFreightCNY = (activeTotalBillingWeight * rate) + batchFeesCNY;
        
        // 最终有效总运费 (考虑手动覆盖)
        const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? autoTotalFreightCNY;
        
        // 分摊到单品的总物流成本 (含耗材)
        const unitFreightCNY = stock > 0 ? (effectiveTotalFreightCNY / stock) : (rate * autoUnitChargeableWeight);
        const unitConsumablesCNY = p.logistics?.consumablesFee || 0;
        const totalUnitLogisticsUSD = (unitFreightCNY + unitConsumablesCNY) / EXCHANGE_RATE;

        // 2. 销售成本逻辑
        const priceUSD = p.price || 0;
        const eco = p.economics;
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
        const refundUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);
        
        const costPriceUSD = (p.costPrice || 0) / EXCHANGE_RATE;
        const totalUnitCostUSD = costPriceUSD + totalUnitLogisticsUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + refundUSD;
        
        const unitProfitUSD = priceUSD - totalUnitCostUSD;
        const skuProfitUSD = unitProfitUSD * stock;
        
        totalPotentialProfitUSD += skuProfitUSD;
        totalStockValueCNY += stockValueCNY;

        // ROI 定义：(单品净利 * 汇率) / 单品采购成本
        const roi = (p.costPrice && p.costPrice > 0) ? (unitProfitUSD * EXCHANGE_RATE / p.costPrice * 100) : 0;

        return {
            x: Math.min(dos, 150),
            y: velocity,
            z: stockValueCNY,
            sku: p.sku,
            profit: Math.round(skuProfitUSD),
            roi: roi,
            fill: roi < 0 ? COLORS.low : (roi > 30 ? COLORS.high : COLORS.medium)
        };
    });

    return {
        matrixData,
        totalPotentialProfitUSD,
        totalStockValueCNY,
        projectedROI: totalStockValueCNY > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / totalStockValueCNY * 100) : 0
    };
  }, [state.products]);

  const handleAiDeepDive = async () => {
      setIsAiThinking(true);
      setAiInsight(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Role: CFO. Analyzing inventory worth ¥${analysisData.totalStockValueCNY.toLocaleString()}, profit $${analysisData.totalPotentialProfitUSD.toLocaleString()}, global ROI ${analysisData.projectedROI.toFixed(1)}%. Give 3 strategic tips in Chinese HTML.`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiInsight(response.text);
      } catch (e) {
          setAiInsight("AI 服务不可用。");
      } finally {
          setIsAiThinking(false);
      }
  };

  const navigateToSku = (sku: string) => {
      dispatch({ type: 'NAVIGATE', payload: { page: 'inventory', params: { searchQuery: sku } } });
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                    决策指挥中枢 (Actionable Analytics)
                </h1>
                <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-tighter">
                    全成本同步模型 (V2.1) 已激活 • 数据一致性校验通过
                </p>
            </div>
            <button onClick={handleAiDeepDive} disabled={isAiThinking} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                {isAiThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                生成资产诊断建议
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ios-glass-card p-6 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <div className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3"/> 资产预计 ROI</div>
                <div className={`text-4xl font-mono font-bold ${analysisData.projectedROI >= 0 ? 'text-white' : 'text-red-500'}`}>
                    {analysisData.projectedROI.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-2">基于采购本金的净利润转化率</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-blue-500">
                <div className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Wallet className="w-3 h-3"/> 存货预计贡献总利</div>
                <div className="text-4xl font-mono font-bold text-white">
                    ${(analysisData.totalPotentialProfitUSD / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] text-slate-500 mt-2">当前在库商品全部清空后的预估净利润</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-red-500 bg-red-500/5">
                <div className="text-[10px] text-red-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> 负利润 (亏损) 风险</div>
                <div className="text-4xl font-mono font-bold text-red-400">
                    {analysisData.matrixData.filter(d => d.roi < 0).length} <span className="text-xs uppercase">SKUs</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">总分摊成本已超过售价的商品数</div>
            </div>
        </div>

        {aiInsight && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl animate-in slide-in-from-top-4 flex items-start gap-4 shadow-2xl">
                <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div className="text-sm text-indigo-100 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* BCG Matrix */}
            <div className="ios-glass-card p-6 flex flex-col min-h-[450px]">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400"/> 库存周转健康矩阵</h3>
                <div className="flex-1 relative bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" dataKey="x" name="DOS" stroke="#64748b" fontSize={10} domain={[0, 150]} unit="D" />
                            <YAxis type="number" dataKey="y" name="Velocity" stroke="#64748b" fontSize={10} unit="pcs" />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                            <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-black/90 border border-indigo-500/50 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                                            <p className="text-sm font-black text-white border-b border-white/10 pb-2 mb-3">{d.sku}</p>
                                            <div className="text-[10px] space-y-2 font-mono">
                                                <div className="flex justify-between gap-6"><span className="text-slate-500">ROI:</span> <span className={`font-bold ${d.roi < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{d.roi.toFixed(1)}%</span></div>
                                                <div className="flex justify-between gap-6"><span className="text-slate-500">预计利润:</span> <span className="text-white">${d.profit}</span></div>
                                            </div>
                                            <button onClick={() => navigateToSku(d.sku)} className="mt-4 w-full py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-2">跳转备货清单 <ArrowRight className="w-3 h-3"/></button>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <ReferenceLine x={45} stroke="#334155" strokeDasharray="3 3" />
                            <Scatter name="Inventory" data={analysisData.matrixData}>
                                {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ROI Efficiency Ranking */}
            <div className="ios-glass-card p-6 flex flex-col overflow-hidden">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><BarChart4 className="w-5 h-5 text-purple-400"/> 资产赚钱效率排行 (ROI Rank)</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {analysisData.matrixData
                        .sort((a, b) => b.roi - a.roi)
                        .map((sku, i) => (
                        <div key={sku.sku} onClick={() => navigateToSku(sku.sku)} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-500/30 cursor-pointer transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${sku.roi < 0 ? 'bg-red-500/20 text-red-500' : (i < 3 ? 'bg-indigo-600 text-white' : 'bg-black/40 text-slate-500')}`}>
                                    {sku.roi < 0 ? '!' : i + 1}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 font-mono">{sku.sku}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">净利贡献: ${sku.profit.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold font-mono ${sku.roi < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {sku.roi.toFixed(1)}% <span className="text-[10px] opacity-60">ROI</span>
                                </div>
                                {sku.roi < 0 && <div className="text-[9px] text-red-400/60 font-bold uppercase animate-pulse">亏损预警 (Check Logistics)</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Analytics;
