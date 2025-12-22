import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend, ReferenceLine,
  BarChart, Bar
} from 'recharts';
import { 
  DollarSign, Activity, Wallet, BrainCircuit, Target, BarChart4,
  Sparkles, AlertTriangle, ArrowRight, RefreshCw, TrendingUp, TrendingDown,
  ShieldAlert, Globe, Zap, Ship, Scale, Flame, Info, RotateCcw, Loader2
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const COLORS = { high: '#10b981', medium: '#f59e0b', low: '#ef4444', text: '#94a3b8', grid: 'rgba(255,255,255,0.05)' };

const Analytics: React.FC = () => {
  const { state } = useTanxing();
  const [activeTab, setActiveTab] = useState<'matrix' | 'lab'>('matrix');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // 压力实验室参数
  const [logisticsShock, setLogisticsShock] = useState(100); // 100% = 正常
  const [exchangeShock, setExchangeShock] = useState(7.2);
  const [refundShock, setRefundShock] = useState(1); // 倍率

  const EXCHANGE_RATE = exchangeShock;

  const analysisData = useMemo(() => {
    const products = (state.products || []).filter(p => !p.deletedAt);
    let totalPotentialProfitUSD = 0;
    let totalInvestmentUSD = 0; // 改为 USD 核算以保证 ROI 精度
    
    const matrixData = products.map(p => {
        const stock = Math.max(p.stock || 0, 0);
        const velocity = p.dailyBurnRate || 0;
        const dos = velocity > 0 ? (stock / velocity) : 150;
        const costPriceCNY = p.costPrice || 0;
        
        // --- 核心修复：同步 Inventory.tsx 的物流分摊逻辑 ---
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const autoUnitWeight = Math.max(p.unitWeight || 0, unitVolWeight);
        
        // 模拟运费：应用 shock 系数
        const baseRate = p.logistics?.unitFreightCost || 0;
        const simulatedRate = baseRate * (logisticsShock / 100);
        
        // 计算模拟单品头程成本 (CNY)
        const unitLogisticsCNY = (autoUnitWeight * simulatedRate) + (p.logistics?.consumablesFee || 0);

        const priceUSD = p.price || 0;
        const eco = p.economics;
        
        // --- 核心修复：补齐所有成本项，确保与备货单对账 ---
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100) * refundShock;
        const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
        const adCostUSD = (eco?.adCost || 0); 
        
        // 单品总成本 (USD) - 包含采购 + 物流 + 运营
        const totalUnitCostUSD = (costPriceCNY / EXCHANGE_RATE) + (unitLogisticsCNY / EXCHANGE_RATE) + platformFeeUSD + creatorFeeUSD + refundLossUSD + fixedFeesUSD + adCostUSD;
        
        const unitProfitUSD = priceUSD - totalUnitCostUSD;
        
        totalPotentialProfitUSD += unitProfitUSD * stock;
        // 投资总额定义：采购成本 + 运费成本 (USD)
        totalInvestmentUSD += ((costPriceCNY + unitLogisticsCNY) / EXCHANGE_RATE) * stock;

        return { 
            x: Math.min(dos, 150), 
            y: velocity, 
            z: Math.max(stock * costPriceCNY, 10), 
            sku: p.sku, 
            profit: Math.round(unitProfitUSD * stock), 
            roi: totalUnitCostUSD > 0 ? (unitProfitUSD / totalUnitCostUSD) * 100 : 0, 
            fill: unitProfitUSD < 0 ? COLORS.low : (unitProfitUSD > 10 ? COLORS.high : COLORS.medium) 
        };
    });

    return { 
        matrixData, 
        totalPotentialProfitUSD, 
        currentROI: totalInvestmentUSD > 0 ? (totalPotentialProfitUSD / totalInvestmentUSD * 100) : 0 
    };
  }, [state.products, logisticsShock, exchangeShock, refundShock, EXCHANGE_RATE]);

  const handleAiDeepDive = async () => {
      setIsAiThinking(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `压力测试：运费波动${logisticsShock}%，汇率${exchangeShock}。模拟后总利 $${analysisData.totalPotentialProfitUSD.toLocaleString()}，全盘 ROI ${analysisData.currentROI.toFixed(1)}%。请指出获利能力最脆弱的环节（中文 HTML）。`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiInsight(response.text);
      } catch (e) { setAiInsight("AI 神经链路受干扰。"); } finally { setIsAiThinking(false); }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10 animate-in fade-in duration-700 slide-in-from-right-4">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">深层穿透分析 (Deep Audit)</h1>
                <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.4em] flex items-center gap-2">
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse"/> Multi-Scenario Cognitive Engine Online
                </p>
            </div>
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 shadow-2xl">
                <button onClick={() => setActiveTab('matrix')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>全息矩阵</button>
                <button onClick={() => setActiveTab('lab')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'lab' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>压力实验室</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ios-glass-card p-8 border-l-4 border-l-emerald-500 bg-emerald-500/5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><TrendingUp className="w-20 h-20 text-emerald-400"/></div>
                <div className="text-[10px] text-emerald-500 uppercase font-black mb-1 tracking-widest">模拟全盘 ROI</div>
                <div className={`text-5xl font-mono font-black ${analysisData.currentROI >= 0 ? 'text-white' : 'text-rose-500'}`}>{analysisData.currentROI.toFixed(1)}%</div>
            </div>
            <div className="ios-glass-card p-8 border-l-4 border-l-blue-500 bg-blue-500/5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><DollarSign className="w-20 h-20 text-blue-400"/></div>
                <div className="text-[10px] text-blue-500 uppercase font-black mb-1 tracking-widest">模拟周期总利 (USD)</div>
                <div className="text-5xl font-mono font-black text-white italic">${analysisData.totalPotentialProfitUSD.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
            </div>
            <div className="ios-glass-card p-8 border-l-4 border-l-indigo-600 bg-indigo-600/5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><Zap className="w-20 h-20 text-indigo-400"/></div>
                <div className="text-[10px] text-indigo-400 uppercase font-black mb-1 tracking-widest">边际安全性指数</div>
                <div className="text-5xl font-mono font-black text-white italic">{analysisData.currentROI > 10 ? 'SAFE' : 'CRITICAL'}</div>
            </div>
        </div>

        {activeTab === 'lab' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="ios-glass-card p-8 border-t-4 border-t-rose-600 bg-rose-950/10">
                        <h3 className="text-xs font-black text-white mb-8 flex items-center gap-3 uppercase italic"><Flame className="w-5 h-5 text-rose-500" /> 注入风险变量 (Injection)</h3>
                        <div className="space-y-10">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>海运费率波动</span><span className="text-rose-400">{logisticsShock}%</span></label>
                                <input type="range" min="50" max="400" step="10" value={logisticsShock} onChange={e=>setLogisticsShock(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>压力测试汇率 (USD/CNY)</span><span className="text-emerald-400">{exchangeShock}</span></label>
                                <input type="range" min="6.5" max="8.5" step="0.05" value={exchangeShock} onChange={e=>setExchangeShock(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>退货率恶化系数</span><span className="text-rose-400">x{refundShock}</span></label>
                                <input type="range" min="1" max="5" step="0.5" value={refundShock} onChange={e=>setRefundShock(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                            </div>
                            <button onClick={() => { setLogisticsShock(100); setExchangeShock(7.2); setRefundShock(1); }} className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"><RotateCcw className="w-3 h-3"/> 重置变量</button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="ios-glass-panel p-8 rounded-[3rem] border-white/10 bg-black/40 flex-1 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-sm font-black text-white flex items-center gap-3 uppercase italic"><BrainCircuit className="w-6 h-6 text-indigo-400" /> 风险受损预测云图</h3>
                            <button onClick={handleAiDeepDive} disabled={isAiThinking} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                                {isAiThinking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} 神经元推演报告
                            </button>
                        </div>
                        
                        {aiInsight ? (
                            <div className="bg-indigo-900/10 border border-indigo-500/20 p-8 rounded-[2rem] animate-in slide-in-from-top-4 relative group">
                                <div className="absolute -top-4 -left-4 p-6 opacity-5 group-hover:scale-110 transition-transform"><Info className="w-20 h-20 text-indigo-400"/></div>
                                <div className="text-xs text-indigo-100 leading-relaxed font-bold font-mono" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20 space-y-4">
                                <Scale className="w-20 h-20" />
                                <p className="text-[10px] font-black uppercase tracking-[0.5em]">调整左侧变量触发量子模拟</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'matrix' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 animate-in slide-in-from-bottom-6">
                <div className="ios-glass-card p-6 flex flex-col min-h-[450px]">
                    <h3 className="text-xs font-black text-slate-400 uppercase mb-8 flex items-center gap-2 italic tracking-widest"><Target className="w-5 h-5 text-cyan-400"/> 资产健康全景 (2D Matrix)</h3>
                    <div className="flex-1 bg-black/20 rounded-[2rem] overflow-hidden border border-white/5">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" dataKey="x" name="DOS" stroke="#475569" fontSize={10} domain={[0, 150]} unit="D" />
                                <YAxis type="number" dataKey="y" name="Velocity" stroke="#475569" fontSize={10} unit="pcs" />
                                <ZAxis type="number" dataKey="z" range={[100, 800]} />
                                <Tooltip contentStyle={{backgroundColor:'rgba(0,0,0,0.9)', border:'1px solid #333', borderRadius:'16px', fontSize:'12px'}} />
                                <Scatter name="Inventory" data={analysisData.matrixData}>
                                    {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} className={entry.roi > 30 ? 'roi-high-glow' : ''} />)}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="ios-glass-card p-6 flex flex-col overflow-hidden">
                    <h3 className="text-xs font-black text-slate-400 uppercase mb-8 flex items-center gap-2 italic tracking-widest"><BarChart4 className="w-5 h-5 text-purple-400"/> 贡献度排行榜 (Contribution)</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {[...analysisData.matrixData].sort((a,b) => b.profit - a.profit).map((sku, i) => (
                            <div key={sku.sku} className={`bg-white/2 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-indigo-500/40 transition-all ${sku.roi > 40 ? 'roi-high-glow' : ''}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${sku.roi < 5 ? 'bg-rose-500/20 text-rose-500' : 'bg-indigo-600 text-white'}`}>{i + 1}</div>
                                    <div>
                                        <div className="text-sm font-black text-white font-mono uppercase italic tracking-tighter">{sku.sku}</div>
                                        <div className="text-[10px] text-slate-600 font-bold uppercase mt-1">模拟净利贡献: <span className="text-emerald-400">${sku.profit.toLocaleString()}</span></div>
                                    </div>
                                </div>
                                <div className={`text-lg font-black font-mono tracking-tighter ${sku.roi < 5 ? 'text-rose-500' : 'text-emerald-400'}`}>{sku.roi.toFixed(1)}% <span className="text-[10px] text-slate-700 italic">ROI</span></div>
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