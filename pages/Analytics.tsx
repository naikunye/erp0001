
import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend, ReferenceLine
} from 'recharts';
import { 
  DollarSign, Activity, Wallet, BrainCircuit, Target, BarChart4,
  Sparkles, AlertTriangle, ArrowRight, RefreshCw, Layers, TrendingUp
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

  // --- 深度同步算法：计算每个 SKU 的潜在表现 ---
  const analysisData = useMemo(() => {
    const EXCHANGE_RATE = 7.2;
    const activeProducts = state.products.filter(p => !p.deletedAt);
    
    let totalPotentialProfitUSD = 0;
    let totalStockValueCNY = 0;
    
    const matrixData = activeProducts.map(p => {
        const velocity = p.dailyBurnRate || 0;
        const dos = velocity > 0 ? (p.stock / velocity) : 999;
        const stockValue = p.stock * (p.costPrice || 0);
        
        // 单位全成本测算 (与补货页完全一致)
        const unitWeight = Math.max(p.unitWeight || 0, ((p.dimensions?.l || 0) * (p.dimensions?.w || 0) * (p.dimensions?.h || 0)) / 6000);
        const unitFreightUSD = ((unitWeight * (p.logistics?.unitFreightCost || 0)) + (p.logistics?.consumablesFee || 0)) / EXCHANGE_RATE;
        const costPriceUSD = (p.costPrice || 0) / EXCHANGE_RATE;
        
        const priceUSD = p.price || 0;
        const eco = p.economics;
        const totalUnitFeesUSD = (priceUSD * ((eco?.platformFeePercent || 0) + (eco?.creatorFeePercent || 0)) / 100) + 
                                (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adSpend || 0);
        
        const unitProfitUSD = priceUSD - (costPriceUSD + unitFreightUSD + totalUnitFeesUSD);
        const skuProfitUSD = unitProfitUSD * p.stock;
        
        totalPotentialProfitUSD += skuProfitUSD;
        totalStockValueCNY += stockValue;

        // 确定矩阵象限与颜色
        let statusColor = COLORS.medium;
        if (dos > 90) statusColor = COLORS.low; // 积压
        if (dos < 30 && velocity > 5) statusColor = COLORS.high; // 明星

        return {
            x: Math.min(dos, 150), // Days of Supply
            y: velocity,           // 日销速度
            z: stockValue,         // 资产规模 (气泡大小)
            sku: p.sku,
            profit: Math.round(skuProfitUSD),
            roi: stockValue > 0 ? (skuProfitUSD * EXCHANGE_RATE / stockValue * 100) : 0,
            fill: statusColor
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
          const prompt = `Act as a Supply Chain CFO. Stock Asset ¥${analysisData.totalStockValueCNY.toLocaleString()}, Potential Profit $${analysisData.totalPotentialProfitUSD.toLocaleString()}. Provide 3 strategic moves in Chinese (HTML). Focus on turning dead stock into cash.`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiInsight(response.text);
      } catch (e) {
          setAiInsight("AI 服务暂时不可用。");
      } finally {
          setIsAiThinking(false);
      }
  };

  const navigateToReplenishment = (sku: string) => {
      dispatch({ type: 'NAVIGATE', payload: { page: 'inventory', params: { searchQuery: sku } } });
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                    战略指挥中枢 (Actionable Analytics)
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-2 uppercase tracking-tighter">
                    数据已深度打通库存周转与财务 ROI 测算
                </p>
            </div>
            
            <button 
                onClick={handleAiDeepDive}
                disabled={isAiThinking}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
            >
                {isAiThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                生成战略行动建议
            </button>
        </div>

        {/* Intelligence KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ios-glass-card p-6 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <div className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3"/> 资产预计增值率 (ROI)</div>
                <div className="text-4xl font-mono font-bold text-white">{analysisData.projectedROI.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium">每 1 元人民币库存预计带回的销售利润</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-blue-500">
                <div className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Wallet className="w-3 h-3"/> 存货潜在利润总计</div>
                <div className="text-4xl font-mono font-bold text-white">${(analysisData.totalPotentialProfitUSD / 1000).toFixed(1)}k</div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium">当前在库商品全部售罄后的预估净利</div>
            </div>
            <div className="ios-glass-card p-6 border-l-4 border-l-orange-500">
                <div className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> 高危资产 (滞销)</div>
                <div className="text-4xl font-mono font-bold text-white">{analysisData.matrixData.filter(d => d.x > 90).length} <span className="text-xs">SKUs</span></div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium">周转天数 (DOS) 超过 90 天的占用资金</div>
            </div>
        </div>

        {aiInsight && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl animate-in slide-in-from-top-4 flex items-start gap-4 shadow-2xl">
                <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div className="text-sm text-indigo-100 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* BCG Matrix - Left Side */}
            <div className="ios-glass-card p-6 flex flex-col min-h-[450px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400"/> 库存周转健康矩阵 (BCG Matrix)</h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase">X: 周转天数 | Y: 日均销量 | Size: 资产沉淀金额</p>
                    </div>
                </div>
                
                <div className="flex-1 relative bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                            <XAxis type="number" dataKey="x" name="DOS" stroke={COLORS.text} fontSize={10} domain={[0, 150]} unit="D" />
                            <YAxis type="number" dataKey="y" name="Velocity" stroke={COLORS.text} fontSize={10} unit="pcs" />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} />
                            <Tooltip 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-indigo-500/50 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                                                <p className="text-sm font-black text-white border-b border-white/10 pb-2 mb-3">SKU: {d.sku}</p>
                                                <div className="text-[10px] space-y-2 font-mono">
                                                    <div className="flex justify-between gap-6"><span className="text-slate-500">周转周期:</span> <span className="text-indigo-400 font-bold">{d.x.toFixed(0)} 天</span></div>
                                                    <div className="flex justify-between gap-6"><span className="text-slate-500">预计利润:</span> <span className="text-emerald-400 font-bold">${d.profit.toLocaleString()}</span></div>
                                                    <div className="flex justify-between gap-6"><span className="text-slate-500">资金占用:</span> <span className="text-slate-300">¥{d.z.toLocaleString()}</span></div>
                                                </div>
                                                <button 
                                                    onClick={() => navigateToReplenishment(d.sku)}
                                                    className="mt-4 w-full py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-500"
                                                >
                                                    跳转补货策略 <ArrowRight className="w-3 h-3"/>
                                                </button>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <ReferenceLine x={45} stroke="#475569" strokeDasharray="3 3" label={{ position: 'top', value: '平衡线', fill: '#475569', fontSize: 10 }} />
                            <ReferenceLine y={5} stroke="#475569" strokeDasharray="3 3" />
                            <Scatter name="Inventory" data={analysisData.matrixData}>
                                {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ROI Ranking - Right Side */}
            <div className="ios-glass-card p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-white flex items-center gap-2"><BarChart4 className="w-5 h-5 text-purple-400"/> 资产赚钱效率排行 (ROI Efficiency)</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {analysisData.matrixData
                        .sort((a, b) => b.roi - a.roi)
                        .slice(0, 15)
                        .map((sku, i) => (
                        <div 
                            key={sku.sku} 
                            onClick={() => navigateToReplenishment(sku.sku)}
                            className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i < 3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-black/40 text-slate-500'}`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors font-mono">{sku.sku}</div>
                                    <div className="text-[10px] text-slate-500">周转周期: {sku.x.toFixed(0)}天</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-emerald-400 font-mono">{sku.roi.toFixed(1)}% <span className="text-[10px] opacity-60">ROI</span></div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase">贡献利润: ${sku.profit.toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <p className="text-[10px] text-slate-500 italic">点击 SKU 可直接跳转【智能备货】调整发货频率或促销力度</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Analytics;
