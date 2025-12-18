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

  // --- 统一核算引擎 V2.5 ---
  const analysisData = useMemo(() => {
    const activeProducts = state.products.filter(p => !p.deletedAt);
    
    let totalPotentialProfitUSD = 0;
    let totalStockValueCNY = 0;
    
    const matrixData = activeProducts.map(p => {
        const stock = p.stock || 0;
        const velocity = p.dailyBurnRate || 0;
        const dos = velocity > 0 ? (stock / velocity) : 999;
        
        // 1. 采购资产 (分母)
        const costPriceCNY = p.costPrice || 0;
        const stockValueCNY = stock * costPriceCNY;
        
        // 2. 物流分摊逻辑 (修复单摊溢出问题)
        const unitRealWeight = p.unitWeight || 0;
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const theoreticalUnitWeight = Math.max(unitRealWeight, unitVolWeight);
        
        const rate = p.logistics?.unitFreightCost || 0;
        const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
        
        const divisor = Math.max(stock, 100); 
        const unitLogisticsCNY = (theoreticalUnitWeight * rate) + (batchFeesCNY / divisor) + (p.logistics?.consumablesFee || 0);
        const unitLogisticsUSD = unitLogisticsCNY / EXCHANGE_RATE;

        // 3. 经营成本
        const priceUSD = p.price || 0;
        const eco = p.economics;
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
        const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);
        
        const costPriceUSD = costPriceCNY / EXCHANGE_RATE;
        const totalUnitCostUSD = costPriceUSD + unitLogisticsUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + refundLossUSD;
        
        // 4. 利润与 ROI 
        const unitProfitUSD = priceUSD - totalUnitCostUSD;
        const skuTotalProfitUSD = unitProfitUSD * stock;
        
        const unitInvestmentCNY = costPriceCNY + unitLogisticsCNY;
        const roi = unitInvestmentCNY > 0 ? (unitProfitUSD * EXCHANGE_RATE / unitInvestmentCNY * 100) : 0;

        totalPotentialProfitUSD += skuTotalProfitUSD;
        totalStockValueCNY += stockValueCNY;

        return {
            x: Math.min(dos, 150),
            y: velocity,
            z: stockValueCNY,
            sku: p.sku,
            profit: Math.round(skuTotalProfitUSD),
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
          const prompt = `Role: Supply Chain CFO. Inventory ¥${analysisData.totalStockValueCNY.toLocaleString()}, Profit $${analysisData.totalPotentialProfitUSD.toLocaleString()}, Global ROI ${analysisData.projectedROI.toFixed(1)}%. Note: Some ROI are negative due to costs > price. Analyze in 3 points (Chinese HTML).`;
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

  const sortedMatrixData = useMemo(() => {
      return [...analysisData.matrixData].sort((a, b) => b.roi - a.roi);
  }, [analysisData.matrixData]);

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                    数据分析中心 (V2.5 Engine)
                </h1>
                <p className="text-xs text-slate-500 mt-2 font-mono">稳态分摊模型已启动 • 消除极端库存分摊误差</p>
            </div>
            <button onClick={handleAiDeepDive} disabled={isAiThinking} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-500">
                {isAiThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                资产结构深度分析
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ios-glass-card p-6 border-l-4 border-l-emerald-500">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">预计本金回报率 (ROI)</div>
                <div className={`text-4xl font-mono font-bold ${analysisData.projectedROI >= 0 ? 'text-white' : 'text-red-500'}`}>
                    {analysisData.projectedROI.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-2">（单品净利 / 采购+物流成本）</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-blue-500">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">库存预估净利润</div>
                <div className="text-4xl font-mono font-bold text-white">
                    ${(analysisData.totalPotentialProfitUSD / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] text-slate-500 mt-2">扣除广告、佣金、退货后的纯利</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-red-500">
                <div className="text-[10px] text-red-500 uppercase font-bold mb-1 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> 亏损风险 SKU</div>
                <div className="text-4xl font-mono font-bold text-red-400">
                    {analysisData.matrixData.filter(d => d.roi < 0).length}
                </div>
                <div className="text-[10px] text-slate-500 mt-2">这些 SKU 的“全成本”已穿透“售价”</div>
            </div>
        </div>

        {aiInsight && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl animate-in slide-in-from-top-4 flex items-start gap-4" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            <div className="ios-glass-card p-6 flex flex-col min-h-[450px]">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400"/> 资产健康矩阵</h3>
                <div className="flex-1 relative bg-black/20 rounded-xl overflow-hidden">
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
                                            <div className="text-[10px] space-y-2 font-mono text-white">
                                                <div className="flex justify-between gap-6"><span>ROI:</span> <span className={d.roi < 0 ? 'text-red-400' : 'text-emerald-400'}>{d.roi.toFixed(1)}%</span></div>
                                                <div className="flex justify-between gap-6"><span>预计利润:</span> <span>${d.profit}</span></div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <ReferenceLine x={45} stroke="#334155" strokeDasharray="3 3" />
                            <Scatter name="Inventory" data={[...analysisData.matrixData]}>
                                {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="ios-glass-card p-6 flex flex-col overflow-hidden">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><BarChart4 className="w-5 h-5 text-purple-400"/> 资产赚钱效率排行 (ROI Rank)</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {sortedMatrixData.map((sku, i) => (
                        <div key={sku.sku} onClick={() => navigateToSku(sku.sku)} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-500/30 cursor-pointer transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${sku.roi < 0 ? 'bg-red-500/20 text-red-500' : (i < 3 ? 'bg-indigo-600 text-white' : 'bg-black/40 text-slate-500')}`}>
                                    {sku.roi < 0 ? '!' : i + 1}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 font-mono">{sku.sku}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">预估贡献利润: ${sku.profit.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold font-mono ${sku.roi < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {sku.roi.toFixed(1)}% <span className="text-[10px] opacity-60">ROI</span>
                                </div>
                                {sku.roi < 0 && <div className="text-[9px] text-red-400/60 font-bold uppercase animate-pulse">全成本穿透预警</div>}
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