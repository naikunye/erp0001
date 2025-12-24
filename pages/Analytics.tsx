
import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend, ReferenceLine,
} from 'recharts';
import { 
  DollarSign, Activity, Wallet, BrainCircuit, Target, BarChart4,
  Sparkles, AlertTriangle, ArrowRight, RefreshCw, TrendingUp, TrendingDown,
  ShieldAlert, Globe, Zap, Ship, Scale, Flame, Info, RotateCcw, Loader2,
  PieChart, Layers, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const COLORS = { 
    high: '#10b981', 
    medium: '#f59e0b', 
    low: '#ef4444', 
    neutral: '#6366f1',
    cogs: '#f59e0b',
    logistics: '#3b82f6',
    op: '#a855f7'
};

const Analytics: React.FC = () => {
  const { state, showToast } = useTanxing();
  const [activeTab, setActiveTab] = useState<'matrix' | 'lab'>('matrix');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // 对齐模式控制
  const [showFullNetProfit, setShowFullNetProfit] = useState(true);

  // 压力实验室参数
  const [logisticsShock, setLogisticsShock] = useState(100); 
  const [exchangeShock, setExchangeShock] = useState(state.exchangeRate || 7.2);
  const [refundShock, setRefundShock] = useState(1); 

  const EXCHANGE_RATE = exchangeShock;

  const analysisData = useMemo(() => {
    const products = (state.products || []).filter(p => !p.deletedAt);
    let totalTargetProfitUSD = 0;
    let totalInvestmentUSD = 0;
    
    const matrixData = products.map(p => {
        const stock = Math.max(p.stock || 0, 0);
        const costPriceCNY = p.costPrice || 0;
        const priceUSD = p.price || 0;
        const eco = p.economics;

        // --- 核心逻辑修复：重新计算物理运费，不信任旧的 totalFreightCost 字段 ---
        const unitRealWeight = p.unitWeight || 0;
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        // 自动取较大者作为计费重
        const autoUnitWeight = Math.max(unitRealWeight, unitVolWeight);
        
        // 基础运费单价 (CNY)
        const baseFreightRateCNY = p.logistics?.unitFreightCost || 0;
        const customsAndPortPerSkuCNY = stock > 0 ? ((p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0)) / stock : 0;
        
        // 单品物流总成本 (CNY) = (单品计费重 * 运费单价) + 单品分摊报关费 + 单品贴标耗材费
        const unitBaselineLogisticsCNY = (autoUnitWeight * baseFreightRateCNY) + customsAndPortPerSkuCNY + (p.logistics?.consumablesFee || 0);

        // 应用压力模拟倍率
        const simulatedUnitLogisticsUSD = (unitBaselineLogisticsCNY * (logisticsShock / 100)) / EXCHANGE_RATE;
        const cogsUSD = costPriceCNY / EXCHANGE_RATE;

        // 运营各项支出 (USD)
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100) * refundShock;
        const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
        const adCostUSD = (eco?.adCost || 0); 
        
        // 静态利润 (与备货清单对齐)
        const staticProfitUSD = priceUSD - (cogsUSD + simulatedUnitLogisticsUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD);
        
        // 模拟净利 (额外扣除广告和退货)
        const netProfitUSD = staticProfitUSD - (adCostUSD + refundLossUSD);

        const activeUnitProfitUSD = showFullNetProfit ? netProfitUSD : staticProfitUSD;
        
        // 只有当库存 > 0 时才计入总盘统计
        if (stock > 0) {
            totalTargetProfitUSD += activeUnitProfitUSD * stock;
            totalInvestmentUSD += (cogsUSD + simulatedUnitLogisticsUSD) * stock;
        }

        return { 
            x: Math.max(0, Math.min(p.dailyBurnRate ? stock / p.dailyBurnRate : 0, 150)), 
            y: p.dailyBurnRate || 0, 
            z: Math.max(stock * (cogsUSD + simulatedUnitLogisticsUSD), 10), 
            sku: p.sku, 
            name: p.name,
            stock,
            profit: Math.round(activeUnitProfitUSD * stock),
            unitProfit: activeUnitProfitUSD,
            staticProfit: staticProfitUSD,
            netProfit: netProfitUSD,
            price: priceUSD,
            roi: (cogsUSD + simulatedUnitLogisticsUSD) > 0 ? (activeUnitProfitUSD / (cogsUSD + simulatedUnitLogisticsUSD)) * 100 : 0, 
            fill: activeUnitProfitUSD < 0 ? COLORS.low : (activeUnitProfitUSD > (priceUSD * 0.2) ? COLORS.high : COLORS.neutral) 
        };
    });

    return { 
        matrixData, 
        totalPotentialProfitUSD: totalTargetProfitUSD, 
        currentROI: totalInvestmentUSD > 0 ? (totalTargetProfitUSD / totalInvestmentUSD * 100) : 0 
    };
  }, [state.products, logisticsShock, exchangeShock, refundShock, EXCHANGE_RATE, showFullNetProfit]);

  const handleAiDeepDive = async () => {
      if (!process.env.API_KEY) {
          showToast('AI 密钥未就绪', 'error');
          return;
      }
      setIsAiThinking(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const lossSkus = analysisData.matrixData.filter(d => d.unitProfit < 0).map(d => d.sku).join(', ');
          const prompt = `分析 SKU 盈利风险。当前大盘 ROI: ${analysisData.currentROI.toFixed(1)}%。亏损节点：${lossSkus || '无'}。请给出资产优化建议。使用 HTML。`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiInsight(response.text);
      } catch (e) { setAiInsight("AI 链路波动中..."); } finally { setIsAiThinking(false); }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-black/95 border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 w-80">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-black text-white font-mono uppercase tracking-tighter">{data.sku}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${data.unitProfit < 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                        {data.unitProfit < 0 ? '风险警告' : '健康'}
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between text-[10px] border-b border-white/5 pb-2">
                        <span className="text-slate-400">单品备货利润 (静态):</span>
                        <span className="text-white font-mono font-bold">${data.staticProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] border-b border-white/5 pb-2">
                        <span className="text-indigo-400 font-black italic">模拟预估利润:</span>
                        <span className={`font-mono font-black ${data.unitProfit < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                            ${data.unitProfit.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-[10px] pt-1">
                        <span className="text-slate-500">当前在库:</span>
                        <span className="text-slate-300 font-mono">{data.stock} pcs</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10 animate-in fade-in duration-700">
        <div className="flex justify-between items-end bg-white/2 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase italic flex items-center gap-4">
                    <BarChart4 className="w-10 h-10 text-indigo-500" />
                    全息资产审计矩阵
                </h1>
                <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.4em] flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-rose-500 animate-pulse"/> 
                    {showFullNetProfit ? 'FULL COST PENETRATION ACTIVE' : 'STATIC PROFIT ALIGNMENT MODE'}
                </p>
            </div>
            <div className="flex gap-3">
                <button 
                  onClick={() => setShowFullNetProfit(!showFullNetProfit)} 
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${showFullNetProfit ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-emerald-600 text-white shadow-lg'}`}
                >
                    {showFullNetProfit ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                    {showFullNetProfit ? '切换至备货对齐模式' : '切换至真实净利模式'}
                </button>
                <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('matrix')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>全息透视</button>
                    <button onClick={() => setActiveTab('lab')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'lab' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>压力实验室</button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`ios-glass-card p-8 border-l-4 transition-all duration-1000 ${analysisData.currentROI >= 0 ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-rose-500 bg-rose-500/5 shadow-[0_0_40px_rgba(244,63,94,0.15)] animate-pulse'}`}>
                <div className={`text-[10px] uppercase font-black mb-1 tracking-widest ${analysisData.currentROI >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>模拟周期 ROI</div>
                <div className={`text-6xl font-mono font-black tracking-tighter ${analysisData.currentROI >= 0 ? 'text-white' : 'text-rose-500'}`}>{analysisData.currentROI.toFixed(1)}%</div>
            </div>
            
            <div className="ios-glass-card p-8 border-l-4 border-l-blue-500 bg-blue-500/5 group relative overflow-hidden">
                <div className="text-[10px] text-blue-500 uppercase font-black mb-1 tracking-widest">模拟预期净总利润</div>
                <div className={`text-6xl font-mono font-black text-white italic tracking-tighter`}>${analysisData.totalPotentialProfitUSD.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
            </div>

            <div className="ios-glass-card p-8 border-l-4 border-l-indigo-600 bg-indigo-600/5 flex flex-col justify-center">
                <div className="text-[10px] text-indigo-400 uppercase font-black mb-1 tracking-widest">系统鲁棒性评级</div>
                <div className="text-5xl font-mono font-black text-white italic tracking-tighter uppercase">
                    {analysisData.currentROI > 30 ? 'Elite' : analysisData.currentROI > 10 ? 'Safe' : analysisData.currentROI >= 0 ? 'Warning' : 'Fragile'}
                </div>
            </div>
        </div>

        {activeTab === 'lab' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="ios-glass-card p-8 border-t-4 border-t-rose-600 bg-rose-950/10 shadow-2xl">
                        <h3 className="text-xs font-black text-white mb-8 flex items-center gap-3 uppercase italic"><Flame className="w-5 h-5 text-rose-500" /> 压力变量注入</h3>
                        <div className="space-y-12">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>头程运费波动</span><span className="text-rose-400 font-mono">{logisticsShock}%</span></label>
                                <input type="range" min="50" max="400" step="10" value={logisticsShock} onChange={e=>setLogisticsShock(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>模拟汇率 (USD/CNY)</span><span className="text-emerald-400 font-mono">{exchangeShock}</span></label>
                                <input type="range" min="6.5" max="8.0" step="0.05" value={exchangeShock} onChange={e=>setExchangeShock(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>退货恶化系数</span><span className="text-amber-400 font-mono">x{refundShock}</span></label>
                                <input type="range" min="1" max="5" step="0.5" value={refundShock} onChange={e=>setRefundShock(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="ios-glass-panel p-10 rounded-[3rem] border-white/10 bg-black/40 flex-1 relative overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h3 className="text-sm font-black text-white flex items-center gap-4 uppercase italic"><BrainCircuit className="w-8 h-8 text-indigo-400" /> 财务受损深度推演</h3>
                            <button onClick={handleAiDeepDive} disabled={isAiThinking} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                                {isAiThinking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}生成推演报告
                            </button>
                        </div>
                        {aiInsight ? (
                            <div className="bg-indigo-950/40 border border-indigo-500/20 p-10 rounded-[2.5rem] animate-in slide-in-from-top-4 prose prose-invert prose-sm max-w-none text-indigo-50" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-30 italic"><Scale className="w-32 h-32" /><p className="text-[10px] font-black uppercase tracking-[0.5em] mt-4">启动量子风险模拟</p></div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'matrix' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 animate-in slide-in-from-bottom-6">
                <div className="ios-glass-card p-8 flex flex-col min-h-[500px] border-white/5">
                    <h3 className="text-xs font-black text-slate-400 uppercase mb-10 flex items-center gap-3 italic tracking-widest"><Target className="w-6 h-6 text-cyan-400"/> 资产健康矩阵 ({showFullNetProfit ? '全额扣除后' : '备货模式'})</h3>
                    <div className="flex-1 bg-black/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative group">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis type="number" dataKey="x" name="可售天数" stroke="#475569" fontSize={10} domain={[0, 150]} unit="D" />
                                <YAxis type="number" dataKey="y" name="日销量" stroke="#475569" fontSize={10} unit="pcs" />
                                <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#6366f1' }} />
                                <ReferenceLine x={30} stroke="#f43f5e" strokeDasharray="3 3" />
                                <Scatter name="Inventory" data={analysisData.matrixData}>
                                    {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ios-glass-card p-8 flex flex-col overflow-hidden border-white/5">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-3 italic tracking-widest"><BarChart4 className="w-6 h-6 text-purple-400"/> 效益诊断排行 (Projected)</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                        {[...analysisData.matrixData].sort((a,b) => b.roi - a.roi).map((sku, i) => (
                            <div key={sku.sku} className={`bg-black/60 border border-white/5 rounded-3xl p-5 flex flex-col gap-4 group hover:border-indigo-500/40 transition-all ${sku.unitProfit < 0 ? 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-base font-black text-white font-mono uppercase italic truncate max-w-[150px]">{sku.sku}</div>
                                        <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">静态: <span className="text-slate-300">${sku.staticProfit.toFixed(1)}</span> | 模拟: <span className={sku.unitProfit < 0 ? 'text-red-500' : 'text-emerald-500'}>${sku.unitProfit.toFixed(1)}</span></div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xl font-black font-mono tracking-tighter ${sku.roi < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>{sku.roi.toFixed(1)}%</div>
                                        <div className="text-[9px] text-slate-700 font-black uppercase tracking-widest">SKU ROI</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Analytics;
