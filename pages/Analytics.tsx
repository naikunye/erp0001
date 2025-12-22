import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend, ReferenceLine,
} from 'recharts';
import { 
  DollarSign, Activity, Wallet, BrainCircuit, Target, BarChart4,
  Sparkles, AlertTriangle, ArrowRight, RefreshCw, TrendingUp, TrendingDown,
  ShieldAlert, Globe, Zap, Ship, Scale, Flame, Info, RotateCcw, Loader2,
  PieChart, Layers, HelpCircle
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

  // 压力实验室参数
  const [logisticsShock, setLogisticsShock] = useState(100); 
  const [exchangeShock, setExchangeShock] = useState(7.2);
  const [refundShock, setRefundShock] = useState(1); 

  const EXCHANGE_RATE = exchangeShock;

  const analysisData = useMemo(() => {
    const products = (state.products || []).filter(p => !p.deletedAt);
    let totalPotentialProfitUSD = 0;
    let totalInvestmentUSD = 0;
    
    const matrixData = products.map(p => {
        const stock = Math.max(p.stock || 0, 0);
        const costPriceCNY = p.costPrice || 0;
        const priceUSD = p.price || 0;
        const eco = p.economics;

        // --- 1. 对齐备货清单的运费逻辑 ---
        // 如果用户在物流模块已经核算过总运费，我们直接用那个值，而不是重新算
        const dims = p.dimensions || {l:0, w:0, h:0};
        const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
        const autoUnitWeight = Math.max(p.unitWeight || 0, unitVolWeight);
        
        let baselineUnitFreightCNY = 0;
        if (p.logistics?.totalFreightCost && p.stock > 0) {
            baselineUnitFreightCNY = p.logistics.totalFreightCost / p.stock;
        } else {
            baselineUnitFreightCNY = (autoUnitWeight * (p.logistics?.unitFreightCost || 0));
        }
        
        // 耗材费也包含在头程内
        baselineUnitFreightCNY += (p.logistics?.consumablesFee || 0);

        // 模拟波动 (只对运费部分做波动)
        const simulatedUnitLogisticsCNY = baselineUnitFreightCNY * (logisticsShock / 100);

        // --- 2. 运营成本 (USD) ---
        const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
        const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
        // 退货风险模拟
        const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100) * refundShock;
        const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
        // 广告费是导致“备货清单为正，分析为负”的最常见原因
        const adCostUSD = (eco?.adCost || 0); 
        
        const cogsUSD = costPriceCNY / EXCHANGE_RATE;
        const logisticsUSD = simulatedUnitLogisticsCNY / EXCHANGE_RATE;
        const totalOpUSD = platformFeeUSD + creatorFeeUSD + refundLossUSD + fixedFeesUSD + adCostUSD;

        // --- 3. 结果核算 ---
        const totalUnitCostUSD = cogsUSD + logisticsUSD + totalOpUSD;
        const unitProfitUSD = priceUSD - totalUnitCostUSD;
        
        // 静态利润（不计广告和退货风险，用于和备货清单对齐）
        const staticProfitUSD = priceUSD - (cogsUSD + logisticsUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD);

        totalPotentialProfitUSD += unitProfitUSD * stock;
        // 投入成本定义：货值 + 运费
        const unitInvestmentUSD = cogsUSD + logisticsUSD; 
        totalInvestmentUSD += unitInvestmentUSD * stock;

        return { 
            x: Math.max(0, Math.min(p.dailyBurnRate ? stock / p.dailyBurnRate : 0, 150)), 
            y: p.dailyBurnRate || 0, 
            z: Math.max(stock * unitInvestmentUSD, 10), 
            sku: p.sku, 
            name: p.name,
            profit: Math.round(unitProfitUSD * stock),
            unitProfit: unitProfitUSD,
            staticProfit: staticProfitUSD,
            unitCost: totalUnitCostUSD,
            cogsUSD,
            logisticsUSD,
            opUSD: totalOpUSD,
            price: priceUSD,
            adCost: adCostUSD,
            refundLoss: refundLossUSD,
            roi: unitInvestmentUSD > 0 ? (unitProfitUSD / unitInvestmentUSD) * 100 : 0, 
            fill: unitProfitUSD < 0 ? COLORS.low : (unitProfitUSD > (priceUSD * 0.2) ? COLORS.high : COLORS.medium) 
        };
    });

    return { 
        matrixData, 
        totalPotentialProfitUSD, 
        currentROI: totalInvestmentUSD > 0 ? (totalPotentialProfitUSD / totalInvestmentUSD * 100) : 0 
    };
  }, [state.products, logisticsShock, exchangeShock, refundShock, EXCHANGE_RATE]);

  const handleAiDeepDive = async () => {
      if (!process.env.API_KEY) {
          showToast('AI 密钥未就绪', 'error');
          return;
      }
      setIsAiThinking(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const lossSkus = analysisData.matrixData.filter(d => d.unitProfit < 0).map(d => `${d.sku}(模拟亏$${Math.abs(d.unitProfit).toFixed(2)})`).join(', ');
          
          const prompt = `你是一个资深跨境电商财务审计师。
          用户反馈：备货清单显示有利润，但在数据分析矩阵中变成负数。
          当前模拟变量：运费倍率${logisticsShock}%，汇率${exchangeShock}。
          亏损节点：${lossSkus || '无'}。
          请分析产生这种差异的“利润黑洞”在哪里（通常是广告费、退货预提、或运费重复计算），并给出财务建议。使用中文 HTML 格式。`;
          
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiInsight(response.text);
      } catch (e) { setAiInsight("AI 连接失败。"); } finally { setIsAiThinking(false); }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-black/95 border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 w-80">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-black text-white font-mono uppercase tracking-tighter">{data.sku}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${data.unitProfit < 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                        {data.unitProfit < 0 ? '利润被击穿' : '获利中'}
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between text-[10px] bg-white/5 p-2 rounded">
                        <span className="text-slate-400 font-bold">清单静态利润 (Base):</span>
                        <span className="text-white font-mono font-bold">${data.staticProfit.toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500 uppercase">
                            <span>模拟成本构成</span>
                            <span className="text-rose-400">${data.unitCost.toFixed(2)}</span>
                        </div>
                        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5 border border-white/5">
                            <div style={{width: `${(data.cogsUSD/data.price)*100}%` }} className="bg-amber-500" title="货值"></div>
                            <div style={{width: `${(data.logisticsUSD/data.price)*100}%` }} className="bg-blue-500" title="头程"></div>
                            <div style={{width: `${(data.opUSD/data.price)*100}%` }} className="bg-purple-500" title="运营+广告"></div>
                        </div>
                    </div>

                    <div className="flex justify-between text-[10px] border-t border-white/5 mt-2 pt-2">
                        <span className="text-indigo-400 font-black italic">最终模拟净利:</span>
                        <span className={`font-mono font-black ${data.unitProfit < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                            ${data.unitProfit.toFixed(2)}
                        </span>
                    </div>
                </div>
                {data.unitProfit < 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-red-400 font-black text-[9px] uppercase"><AlertTriangle className="w-3 h-3"/> 亏损归因分析</div>
                        <p className="text-[9px] text-red-300/80 leading-tight italic">
                           静态毛利为正则说明基本盘没问题。当前亏损是因为计入了 <span className="text-white font-bold">${data.adCost}</span> 的广告费和 <span className="text-white font-bold">${data.refundLoss.toFixed(2)}</span> 的预扣退货损耗。
                        </p>
                    </div>
                )}
            </div>
        );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10 animate-in fade-in duration-700">
        {/* 顶部控制枢纽 */}
        <div className="flex justify-between items-end bg-white/2 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase italic flex items-center gap-4">
                    <BarChart4 className="w-10 h-10 text-indigo-500" />
                    全息资产审计矩阵
                </h1>
                <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.4em] flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-rose-500 animate-pulse"/> 
                    Scenario-Based Profitability Analyzer Active
                </p>
            </div>
            <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                <button onClick={() => setActiveTab('matrix')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    <Layers className="w-3.5 h-3.5"/> 全息透视
                </button>
                <button onClick={() => setActiveTab('lab')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'lab' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    <Flame className="w-3.5 h-3.5"/> 压力实验室
                </button>
            </div>
        </div>

        {/* 核心 KPI 卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`ios-glass-card p-8 border-l-4 transition-all duration-1000 ${analysisData.currentROI >= 0 ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-rose-500 bg-rose-500/5 shadow-[0_0_40px_rgba(244,63,94,0.1)] animate-pulse'}`}>
                <div className={`text-[10px] uppercase font-black mb-1 tracking-widest ${analysisData.currentROI >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {analysisData.currentROI >= 0 ? '模拟全盘 ROI' : '全盘资产受损预警'}
                </div>
                <div className={`text-6xl font-mono font-black tracking-tighter ${analysisData.currentROI >= 0 ? 'text-white' : 'text-rose-500'}`}>
                    {analysisData.currentROI.toFixed(1)}%
                </div>
                <p className="text-[9px] text-slate-500 mt-2 font-black uppercase tracking-widest italic flex items-center gap-2">
                    <Info className="w-3 h-3"/> 
                    {analysisData.currentROI >= 0 ? '已扣除广告、佣金与退货预留' : '警告：模拟支出已击穿毛利空间'}
                </p>
            </div>
            
            <div className="ios-glass-card p-8 border-l-4 border-l-blue-500 bg-blue-500/5 group relative overflow-hidden">
                <div className="text-[10px] text-blue-500 uppercase font-black mb-1 tracking-widest">模拟周期预期净利 (扣广告后)</div>
                <div className={`text-6xl font-mono font-black text-white italic tracking-tighter ${analysisData.totalPotentialProfitUSD < 0 ? 'text-rose-400' : ''}`}>
                    ${analysisData.totalPotentialProfitUSD.toLocaleString(undefined, {maximumFractionDigits:0})}
                </div>
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
                                <div className="flex justify-between text-[8px] text-slate-700 mt-2"><span>-50% 折扣</span><span>+300% 暴涨</span></div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>模拟汇率 (USD/CNY)</span><span className="text-emerald-400 font-mono">{exchangeShock}</span></label>
                                <input type="range" min="6.5" max="8.0" step="0.05" value={exchangeShock} onChange={e=>setExchangeShock(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-black flex justify-between uppercase mb-4 tracking-widest"><span>退货恶化系数</span><span className="text-amber-400 font-mono">x{refundShock}</span></label>
                                <input type="range" min="1" max="5" step="0.5" value={refundShock} onChange={e=>setRefundShock(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                            </div>
                            <button onClick={() => { setLogisticsShock(100); setExchangeShock(7.2); setRefundShock(1); }} className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-white/5 transition-all"><RotateCcw className="w-3.5 h-3.5"/> 重置为清单原始状态</button>
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
                    <h3 className="text-xs font-black text-slate-400 uppercase mb-10 flex items-center gap-3 italic tracking-widest"><Target className="w-6 h-6 text-cyan-400"/> 资产健康矩阵 (已扣模拟运营费)</h3>
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
                                    {analysisData.matrixData.map((entry, index) => <Cell key={index} fill={entry.fill} className={`${entry.roi > 50 ? 'roi-high-glow' : ''} ${entry.unitProfit < 0 ? 'animate-pulse' : ''}`} />)}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ios-glass-card p-8 flex flex-col overflow-hidden border-white/5">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-3 italic tracking-widest"><BarChart4 className="w-6 h-6 text-purple-400"/> 模拟效益排行 (按全额扣除后算)</h3>
                        <div className="group relative">
                             <HelpCircle className="w-4 h-4 text-slate-600 cursor-help hover:text-indigo-400 transition-colors" />
                             <div className="absolute right-0 top-6 w-64 p-3 bg-black border border-white/10 rounded-xl text-[10px] text-slate-400 z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl">
                                <b>为什么 ROI 会变低？</b><br/>备货清单仅展示货值+运费后的毛利。此处额外扣除了广告 CPA、平台佣金、达人分佣及退货损失，反映的是最真实的现金落袋收益。
                             </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                        {[...analysisData.matrixData].sort((a,b) => b.roi - a.roi).map((sku, i) => (
                            <div key={sku.sku} className={`bg-black/60 border border-white/5 rounded-3xl p-5 flex flex-col gap-4 group hover:border-indigo-500/40 transition-all ${sku.roi < 0 ? 'border-rose-500/30 ring-1 ring-rose-500/10' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${sku.roi < 0 ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30'}`}>{i + 1}</div>
                                        <div className="min-w-0">
                                            <div className="text-base font-black text-white font-mono uppercase italic truncate max-w-[150px]">{sku.sku}</div>
                                            <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">静态毛利: <span className="text-slate-300">${sku.staticProfit.toFixed(1)}</span></div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xl font-black font-mono tracking-tighter ${sku.roi < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>{sku.roi.toFixed(1)}%</div>
                                        <div className="text-[9px] text-slate-700 font-black uppercase tracking-widest">Projected ROI</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex h-1 w-full rounded-full overflow-hidden bg-white/5">
                                        <div style={{width: `${(sku.cogsUSD/sku.price)*100}%` }} className="bg-amber-500"></div>
                                        <div style={{width: `${(sku.logisticsUSD/sku.price)*100}%` }} className="bg-blue-500"></div>
                                        <div style={{width: `${(sku.opUSD/sku.price)*100}%` }} className="bg-purple-500"></div>
                                        {sku.unitProfit > 0 && <div style={{width: `${(sku.unitProfit/sku.price)*100}%` }} className="bg-emerald-500"></div>}
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase">
                                        <div className="flex gap-4">
                                            <span className="text-slate-600 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-amber-500"></div> 货: ${(sku.cogsUSD).toFixed(1)}</span>
                                            <span className="text-slate-600 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-500"></div> 运: ${(sku.logisticsUSD).toFixed(1)}</span>
                                            <span className="text-slate-600 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-purple-500"></div> 营+广: ${(sku.opUSD).toFixed(1)}</span>
                                        </div>
                                        <span className={sku.unitProfit < 0 ? 'text-rose-500' : 'text-emerald-500'}>{sku.unitProfit < 0 ? '亏损中' : `模拟净利: $${sku.unitProfit.toFixed(1)}`}</span>
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