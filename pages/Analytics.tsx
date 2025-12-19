
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

  // --- 核心修复：全成本分摊矩阵计算 (对齐 Inventory.tsx) ---
  const analysisData = useMemo(() => {
    const activeProducts = state.products.filter(p => !p.deletedAt);
    
    let totalPotentialProfitUSD = 0;
    let totalStockValueCNY = 0;
    let totalInvestmentCNY = 0;
    
    const matrixData = activeProducts.map(p => {
        const stock = Math.max(p.stock || 0, 0);
        const velocity = p.dailyBurnRate || 0;
        const dos = velocity > 0 ? (stock / velocity) : 150;
        
        const costPriceCNY = p.costPrice || 0;
        const stockValueCNY = stock * costPriceCNY;
        
        // 1. 物流分摊逻辑对齐
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const autoUnitWeight = Math.max(p.unitWeight || 0, unitVolWeight);
        
        let activeTotalWeight = 0;
        if (p.logistics?.billingWeight && p.logistics.billingWeight > 0) {
            activeTotalWeight = p.logistics.billingWeight;
        } else if (p.logistics?.unitBillingWeight && p.logistics.unitBillingWeight > 0) {
            activeTotalWeight = p.logistics.unitBillingWeight * stock;
        } else {
            activeTotalWeight = autoUnitWeight * stock;
        }

        const rate = p.logistics?.unitFreightCost || 0;
        const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
        const autoTotalFreightCNY = (activeTotalWeight * rate) + batchFeesCNY;
        const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? autoTotalFreightCNY;
        
        const unitFreightCNY = stock > 0 ? effectiveTotalFreightCNY / stock : 0;
        const unitLogisticsCNY = unitFreightCNY + (p.logistics?.consumablesFee || 0);
        const unitLogisticsUSD = unitLogisticsCNY / EXCHANGE_RATE;

        // 2. 经营成本
        const priceUSD = p.price || 0;
        const eco = p.economics;
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
        const unitAdCostUSD = eco?.adCost || 0; 
        const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);
        
        const costPriceUSD = costPriceCNY / EXCHANGE_RATE;
        const totalUnitCostUSD = costPriceUSD + unitLogisticsUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + unitAdCostUSD + refundLossUSD;
        
        const unitProfitUSD = priceUSD - totalUnitCostUSD;
        const skuTotalProfitUSD = unitProfitUSD * stock;
        
        const unitInvestmentCNY = costPriceCNY + unitLogisticsCNY;
        const roi = unitInvestmentCNY > 0 ? (unitProfitUSD * EXCHANGE_RATE / unitInvestmentCNY * 100) : 0;

        totalPotentialProfitUSD += skuTotalProfitUSD;
        totalStockValueCNY += stockValueCNY;
        totalInvestmentCNY += unitInvestmentCNY * stock;

        return {
            x: Math.min(dos, 150),
            y: velocity,
            z: Math.max(stockValueCNY, 10),
            sku: p.sku,
            profit: Math.round(skuTotalProfitUSD),
            roi: roi,
            fill: roi < 5 ? COLORS.low : (roi > 35 ? COLORS.high : COLORS.medium)
        };
    });

    return {
        matrixData,
        totalPotentialProfitUSD,
        totalStockValueCNY,
        projectedROI: totalInvestmentCNY > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / totalInvestmentCNY * 100) : 0
    };
  }, [state.products]);

  const handleAiDeepDive = async () => {
      setIsAiThinking(true);
      setAiInsight(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `分析财务数据：库存货值 ¥${analysisData.totalStockValueCNY.toLocaleString()}，穿透净利 $${analysisData.totalPotentialProfitUSD.toLocaleString()}，ROI ${analysisData.projectedROI.toFixed(1)}%。给出3条经营建议（中文 HTML）。`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiInsight(response.text);
      } catch (e) {
          setAiInsight("AI 诊断服务暂不可用。");
      } finally {
          // Fixed typo: setIsThinking to setIsAiThinking
          setIsAiThinking(false);
      }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase">数据分析中心 (V3.1)</h1>
                <p className="text-xs text-slate-500 mt-2 font-mono">核算逻辑已对齐：支持手动运费覆盖与真实单品分摊</p>
            </div>
            <button onClick={handleAiDeepDive} disabled={isAiThinking} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                {isAiThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />} AI 深度诊断
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ios-glass-card p-6 border-l-4 border-l-emerald-500">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">综合 ROI (穿透后)</div>
                <div className={`text-4xl font-mono font-bold ${analysisData.projectedROI >= 0 ? 'text-white' : 'text-red-500'}`}>
                    {analysisData.projectedROI.toFixed(1)}%
                </div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-blue-500">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">当前库存预期总净利</div>
                <div className="text-4xl font-mono font-bold text-white">
                    ${analysisData.totalPotentialProfitUSD.toLocaleString(undefined, {maximumFractionDigits:0})}
                </div>
            </div>
        </div>

        {aiInsight && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl animate-in slide-in-from-top-4" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            <div className="ios-glass-card p-6 flex flex-col min-h-[450px]">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400"/> 资产健康矩阵 (散点视图)</h3>
                <div className="flex-1 bg-black/20 rounded-xl overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" dataKey="x" name="DOS" stroke="#64748b" fontSize={10} domain={[0, 150]} unit="D" />
                            <YAxis type="number" dataKey="y" name="Velocity" stroke="#64748b" fontSize={10} unit="pcs" />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                            <Tooltip 
                                contentStyle={{backgroundColor:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px'}}
                                itemStyle={{color: '#fff'}}
                                labelStyle={{color: '#fff'}}
                            />
                            <Scatter name="Inventory" data={analysisData.matrixData}>
                                {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="ios-glass-card p-6 flex flex-col overflow-hidden">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><BarChart4 className="w-5 h-5 text-purple-400"/> SKU 盈利效率排行榜</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {[...analysisData.matrixData].sort((a,b) => b.roi - a.roi).map((sku, i) => (
                        <div key={sku.sku} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${sku.roi < 5 ? 'bg-red-500/20 text-red-500' : 'bg-indigo-600 text-white'}`}>{i + 1}</div>
                                <div>
                                    <div className="text-sm font-bold text-white font-mono">{sku.sku}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">贡献净利: ${sku.profit.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className={`text-sm font-bold font-mono ${sku.roi < 5 ? 'text-red-500' : 'text-emerald-400'}`}>{sku.roi.toFixed(1)}% ROI</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Analytics;
