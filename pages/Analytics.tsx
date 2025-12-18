
import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend, ReferenceLine
} from 'recharts';
import { 
  DollarSign, Activity, Wallet, BrainCircuit, Target, BarChart4,
  Sparkles, AlertTriangle, ArrowRight, RefreshCw
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const COLORS = {
  primary: '#06b6d4',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#94a3b8',
  grid: 'rgba(255,255,255,0.05)',
};

const Analytics: React.FC = () => {
  const { state, dispatch } = useTanxing();
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- UNIFIED DATA ENGINE ---
  const analysisData = useMemo(() => {
    const EXCHANGE_RATE = 7.2;
    const activeProducts = state.products.filter(p => !p.deletedAt);
    
    let totalPotentialProfitUSD = 0;
    let totalStockValueCNY = 0;
    
    const matrixData = activeProducts.map(p => {
        const velocity = p.dailyBurnRate || 0;
        const dos = velocity > 0 ? (p.stock / velocity) : 999;
        const stockValue = p.stock * (p.costPrice || 0);
        
        // 核心：采用与 Inventory/Finance 完全一致的单位利润算法
        const unitRealWeight = p.unitWeight || 0;
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const unitChargeWeight = Math.max(unitRealWeight, unitVolWeight);
        
        // 物流费测算
        const rate = p.logistics?.unitFreightCost || 0;
        const billingWeightTotal = (p.logistics?.billingWeight || (unitChargeWeight * p.stock));
        const batchFees = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
        const effectiveTotalFreight = p.logistics?.totalFreightCost ?? (billingWeightTotal * rate + batchFees);
        const unitFreightUSD = (p.stock > 0 ? (effectiveTotalFreight / p.stock) : (rate * unitChargeWeight)) / EXCHANGE_RATE;

        // 总成本测算 (USD)
        const priceUSD = p.price || 0;
        const costPriceUSD = (p.costPrice || 0) / EXCHANGE_RATE;
        const eco = p.economics;
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const otherFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0) + (priceUSD * (eco?.refundRatePercent || 0) / 100);
        
        const totalUnitCostUSD = costPriceUSD + unitFreightUSD + platformFeeUSD + creatorFeeUSD + otherFeesUSD;
        const unitProfitUSD = priceUSD - totalUnitCostUSD;
        
        const skuPotentialProfit = unitProfitUSD * p.stock;
        totalPotentialProfitUSD += skuPotentialProfit;
        totalStockValueCNY += stockValue;

        return {
            x: Math.min(dos, 120), 
            y: velocity,           
            z: stockValue,         
            sku: p.sku,
            profit: skuPotentialProfit,
            margin: priceUSD > 0 ? (unitProfitUSD / priceUSD) * 100 : 0,
            fill: dos > 90 ? COLORS.danger : (dos < 20 && velocity > 0) ? COLORS.warning : COLORS.success
        };
    });

    return {
        matrixData,
        totalPotentialProfitUSD,
        totalStockValueCNY,
        projectedROI: totalStockValueCNY > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / totalStockValueCNY) * 100 : 0
    };
  }, [state.products]);

  const handleAiDeepDive = async () => {
      setIsAiThinking(true);
      setAiInsight(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Act as a Supply Chain CFO. Stock Value ¥${analysisData.totalStockValueCNY.toLocaleString()}, Potential Profit $${analysisData.totalPotentialProfitUSD.toLocaleString()}, Projected ROI ${analysisData.projectedROI.toFixed(1)}%. Provide 3 specific strategic actions in Chinese (HTML).`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiInsight(response.text);
      } catch (e) {
          setAiInsight("AI 服务暂时不可用。");
      } finally {
          setIsAiThinking(false);
      }
  };

  const navigateToSku = (sku: string) => {
      dispatch({ type: 'NAVIGATE', payload: { page: 'inventory', params: { searchQuery: sku } } });
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                    决策指挥中枢 (Cockpit)
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-2">
                    资产价值模型已与智能备货同步 • 实时 ROI 穿透
                </p>
            </div>
            
            <button 
                onClick={handleAiDeepDive}
                disabled={isAiThinking}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
            >
                {isAiThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                生成战略报告
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ios-glass-card p-6 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <div className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><DollarSign className="w-3 h-3"/> 资产预计投资回报率 (ROI)</div>
                <div className="text-4xl font-mono font-bold text-white">{analysisData.projectedROI.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500 mt-2">存货周转后的资本增值效率评估</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-blue-500">
                <div className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Wallet className="w-3 h-3"/> 存货利润贡献度</div>
                <div className="text-4xl font-mono font-bold text-white">${(analysisData.totalPotentialProfitUSD / 1000).toFixed(1)}k</div>
                <div className="text-[10px] text-slate-500 mt-2">当前存货清空后的预估净利总额</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-orange-500">
                <div className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> 高周转风险 SKU</div>
                <div className="text-4xl font-mono font-bold text-white">{analysisData.matrixData.filter(d => d.x > 90).length}</div>
                <div className="text-[10px] text-slate-500 mt-2">DOS > 90 天，存在资金积压风险</div>
            </div>
        </div>

        {aiInsight && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl animate-in slide-in-from-top-4 flex items-start gap-4 shadow-2xl">
                <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div className="text-sm text-indigo-100 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            <div className="ios-glass-card p-6 flex flex-col min-h-[450px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400"/> 库存周转健康矩阵</h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase">X: 周转天数(DOS) | Y: 日均销量 | Size: 资金规模</p>
                    </div>
                </div>
                
                <div className="flex-1 relative bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                            <XAxis type="number" dataKey="x" name="DOS" stroke={COLORS.text} fontSize={10} domain={[0, 120]} />
                            <YAxis type="number" dataKey="y" name="Velocity" stroke={COLORS.text} fontSize={10} />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                            <Tooltip 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-indigo-500/50 p-3 rounded-lg shadow-2xl backdrop-blur-xl">
                                                <p className="text-xs font-black text-white border-b border-white/10 pb-1 mb-2">{d.sku}</p>
                                                <div className="text-[10px] space-y-1 font-mono">
                                                    <div className="flex justify-between gap-4"><span className="text-slate-500">周转:</span> <span className="text-indigo-400">{d.x.toFixed(0)}天</span></div>
                                                    <div className="flex justify-between gap-4"><span className="text-slate-500">利润:</span> <span className="text-emerald-400">${d.profit.toLocaleString()}</span></div>
                                                </div>
                                                <button onClick={() => navigateToSku(d.sku)} className="mt-3 w-full py-1 bg-indigo-600 text-white text-[9px] font-bold rounded">处理补货</button>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <ReferenceLine x={30} stroke="#475569" strokeDasharray="3 3" />
                            <ReferenceLine y={5} stroke="#475569" strokeDasharray="3 3" />
                            <Scatter name="Inventory" data={analysisData.matrixData}>
                                {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="ios-glass-card p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2"><BarChart4 className="w-5 h-5 text-purple-400"/> 资产赚钱效率排行 (ROI Rank)</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-none">
                    {analysisData.matrixData
                        .sort((a, b) => b.profit - a.profit)
                        .slice(0, 10)
                        .map((sku, i) => (
                        <div key={sku.sku} onClick={() => navigateToSku(sku.sku)} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-500/30 cursor-pointer transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i < 3 ? 'bg-indigo-600 text-white' : 'bg-black/40 text-slate-500'}`}>{i + 1}</div>
                                <div>
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 font-mono">{sku.sku}</div>
                                    <div className="text-[10px] text-slate-500">ROI: {((sku.profit * 7.2 / sku.z) * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-emerald-400 font-mono">+${sku.profit.toLocaleString()}</div>
                                <div className="text-[9px] text-slate-500 uppercase">潜在利润</div>
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
