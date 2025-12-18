
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Truck, Plane, Container, Scale, Box, 
  ArrowRightLeft, BadgeDollarSign, TrendingUp, Sparkles, 
  RotateCcw, Info, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type UnitSystem = 'Metric' | 'Imperial';

// --- Components ---

const LogisticsCalculator = () => {
    const [dims, setDims] = useState({ length: 0, width: 0, height: 0, qty: 1, weight: 0 });
    const [rates, setRates] = useState({ sea: 800, air: 35, currency: 'CNY' }); // Sea per CBM, Air per KG
    const [airDivisor, setAirDivisor] = useState<5000 | 6000>(6000); // 6000 usually for Express, 5000 for Cargo

    // Calculations
    const totalVolumeCBM = (dims.length * dims.width * dims.height * dims.qty) / 1000000;
    const totalRealWeight = dims.weight * dims.qty;
    const volWeight = (dims.length * dims.width * dims.height * dims.qty) / airDivisor;
    const chargeWeightAir = Math.max(totalRealWeight, volWeight);
    
    // Costs
    const seaCost = totalVolumeCBM * rates.sea;
    const airCost = chargeWeightAir * rates.air;

    // Container Loads
    const c20gp = 28; // CBM approx
    const c40hq = 68; // CBM approx
    const fill20gp = (totalVolumeCBM / c20gp) * 100;
    const fill40hq = (totalVolumeCBM / c40hq) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="flex flex-col gap-6">
                {/* Inputs */}
                <div className="bg-black/20 border border-white/10 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                        <Box className="w-4 h-4 text-blue-400" /> 货物规格 (Cargo Specs)
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-[10px] text-slate-400 block mb-1">长 Length (cm)</label><input type="number" value={dims.length || ''} onChange={e=>setDims({...dims, length: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">宽 Width (cm)</label><input type="number" value={dims.width || ''} onChange={e=>setDims({...dims, width: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">高 Height (cm)</label><input type="number" value={dims.height || ''} onChange={e=>setDims({...dims, height: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-400 block mb-1">单箱重量 (kg)</label><input type="number" value={dims.weight || ''} onChange={e=>setDims({...dims, weight: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">箱数 (Qty)</label><input type="number" value={dims.qty || ''} onChange={e=>setDims({...dims, qty: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div>
                    </div>
                </div>

                <div className="bg-black/20 border border-white/10 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                        <Scale className="w-4 h-4 text-emerald-400" /> 运费单价 (Rates)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-400 block mb-1">海运/方 (Sea/CBM)</label><input type="number" value={rates.sea} onChange={e=>setRates({...rates, sea: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">空运/kg (Air/KG)</label><input type="number" value={rates.air} onChange={e=>setRates({...rates, air: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" /></div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded text-xs">
                        <span className="text-slate-400">空运抛重系数</span>
                        <div className="flex gap-2">
                            <button onClick={()=>setAirDivisor(5000)} className={`px-2 py-1 rounded ${airDivisor===5000 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>/5000</button>
                            <button onClick={()=>setAirDivisor(6000)} className={`px-2 py-1 rounded ${airDivisor===6000 ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>/6000</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="flex flex-col gap-6">
                <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/30 rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div>
                            <div className="text-xs text-slate-400 uppercase">总体积 (Total Volume)</div>
                            <div className="text-3xl font-bold text-white font-mono mt-1">{totalVolumeCBM.toFixed(3)} <span className="text-sm text-slate-500">CBM</span></div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 uppercase">计费重 (Chargeable)</div>
                            <div className="text-3xl font-bold text-white font-mono mt-1">{chargeWeightAir.toFixed(2)} <span className="text-sm text-slate-500">kg</span></div>
                            <div className="text-[10px] text-slate-500 mt-1">实重: {totalRealWeight}kg | 材积: {volWeight.toFixed(2)}kg</div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 my-4"></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-blue-300 font-bold flex items-center gap-1"><Container className="w-3 h-3"/> 海运成本</span>
                                <span className="text-[10px] text-blue-300/60">by Volume</span>
                            </div>
                            <div className="text-xl font-bold text-blue-100">¥ {seaCost.toFixed(2)}</div>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-orange-300 font-bold flex items-center gap-1"><Plane className="w-3 h-3"/> 空运成本</span>
                                <span className="text-[10px] text-orange-300/60">by Weight</span>
                            </div>
                            <div className="text-xl font-bold text-orange-100">¥ {airCost.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Container Load Viz */}
                <div className="bg-black/20 border border-white/10 rounded-xl p-5 flex-1">
                    <h3 className="text-sm font-bold text-white mb-4">集装箱装载模拟</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">20GP Container</span>
                                <span className={fill20gp > 100 ? 'text-red-400' : 'text-emerald-400'}>{fill20gp.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${fill20gp > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, fill20gp)}%`}}></div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 text-right">Capacity: 28 CBM</div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">40HQ Container</span>
                                <span className={fill40hq > 100 ? 'text-red-400' : 'text-blue-400'}>{fill40hq.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${fill40hq > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, fill40hq)}%`}}></div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 text-right">Capacity: 68 CBM</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfitSimulator = () => {
    const [price, setPrice] = useState(29.99);
    const [cogs, setCogs] = useState(8.5);
    const [ship, setShip] = useState(5.2);
    const [feePct, setFeePct] = useState(15);
    const [adCpa, setAdCpa] = useState(8.0);

    const fee = price * (feePct / 100);
    const totalCost = cogs + ship + fee + adCpa;
    const profit = price - totalCost;
    const margin = (profit / price) * 100;
    
    // Break-even ROAS = Sale Price / (Sale Price - COGS - Ship - Fee) ?? 
    // Usually Break-even ROAS = Sale Price / Break-even Ad Spend.
    // Break-even Ad Spend = Price - COGS - Ship - Fee
    const breakEvenAdSpend = price - cogs - ship - fee;
    const breakEvenRoas = breakEvenAdSpend > 0 ? price / breakEvenAdSpend : 0;

    const data = [
        { name: '采购成本', value: cogs, color: '#3b82f6' },
        { name: '物流运费', value: ship, color: '#f59e0b' },
        { name: '平台扣点', value: fee, color: '#a855f7' },
        { name: '广告支出', value: adCpa, color: '#ec4899' },
        { name: '预估净利', value: Math.max(0, profit), color: profit > 0 ? '#10b981' : '#ef4444' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-1 bg-black/20 border border-white/10 rounded-xl p-5 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-emerald-400" /> 参数设置
                </h3>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">销售定价 ($)</label>
                        <input type="number" value={price} onChange={e=>setPrice(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none font-bold" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">采购成本 ($)</label>
                        <input type="number" value={cogs} onChange={e=>setCogs(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">头程+尾程运费 ($)</label>
                        <input type="number" value={ship} onChange={e=>setShip(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-orange-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-400 block mb-1">平台佣金 (%)</label>
                            <input type="number" value={feePct} onChange={e=>setFeePct(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mt-6">${fee.toFixed(2)}</label>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-1">广告 CPA ($)</label>
                        <input type="number" value={adCpa} onChange={e=>setAdCpa(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-pink-500 outline-none" />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-500 mb-1">净利润</div>
                        <div className={`text-2xl font-bold font-mono ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${profit.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-500 mb-1">利润率</div>
                        <div className={`text-2xl font-bold font-mono ${margin > 20 ? 'text-emerald-400' : margin > 0 ? 'text-orange-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</div>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20"><TrendingUp className="w-8 h-8"/></div>
                        <div className="text-xs text-slate-500 mb-1">保本 ROAS</div>
                        <div className="text-2xl font-bold font-mono text-blue-400">{breakEvenRoas.toFixed(2)}</div>
                    </div>
                </div>

                <div className="flex-1 bg-black/20 border border-white/10 rounded-xl p-6 relative">
                    <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">利润结构分析 (Structure)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{left: 20, right: 30}}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={11} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor:'#000', borderColor:'#333'}} />
                            <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const UnitConverter = () => {
    const [val, setVal] = useState<number | string>(1);
    
    // Length
    const cmToInch = (v: number) => (v * 0.393701).toFixed(2);
    const inchToCm = (v: number) => (v * 2.54).toFixed(2);
    // Weight
    const kgToLb = (v: number) => (v * 2.20462).toFixed(2);
    const lbToKg = (v: number) => (v * 0.453592).toFixed(2);
    
    const v = parseFloat(val as string) || 0;

    return (
        <div className="bg-black/20 border border-white/10 rounded-xl p-5 h-full overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" /> 常用换算 (Converter)
            </h3>
            
            <div className="mb-6">
                <input type="number" value={val} onChange={e=>setVal(e.target.value)} className="w-full text-center text-3xl font-bold bg-transparent border-b border-white/20 pb-2 text-white focus:border-purple-500 outline-none" placeholder="输入数值..." />
            </div>

            <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">长度单位</div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300">厘米 转 英寸</span>
                        <span className="font-mono font-bold text-white">{cmToInch(v)} "</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300">英寸 转 厘米</span>
                        <span className="font-mono font-bold text-white">{inchToCm(v)} cm</span>
                    </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">重量单位</div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300">公斤 转 磅</span>
                        <span className="font-mono font-bold text-white">{kgToLb(v)} lbs</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300">磅 转 公斤</span>
                        <span className="font-mono font-bold text-white">{lbToKg(v)} kg</span>
                    </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">材积单位</div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300">立方米 转 立方英尺</span>
                        <span className="font-mono font-bold text-white">{(v * 35.3147).toFixed(2)} ft³</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalculatorCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'logistics' | 'profit'>('logistics');
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const handleAiConsult = async () => {
        setIsAiThinking(true);
        setAiAdvice(null);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = activeTab === 'logistics' 
                ? "Analyze current sea vs air freight trends for China to US e-commerce. Provide 3 optimization tips for small parcels vs pallets. Output HTML."
                : "Analyze e-commerce profit margins. What is a healthy net margin for electronics vs apparel? How does high ACOS affect break-even? Output HTML.";

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setAiAdvice(response.text);
        } catch (e) {
            setAiAdvice("AI 服务暂不可用");
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            {/* Header Tabs */}
            <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="flex gap-2">
                    <button onClick={()=>setActiveTab('logistics')} className={`px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'logistics' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Truck className="w-4 h-4"/> 物流全能计算 (Logistics)
                    </button>
                    <button onClick={()=>setActiveTab('profit')} className={`px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'profit' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <BadgeDollarSign className="w-4 h-4"/> 利润推演 (Profit)
                    </button>
                </div>
                <button 
                    onClick={handleAiConsult}
                    disabled={isAiThinking}
                    className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                >
                    {isAiThinking ? <span className="animate-spin">⏳</span> : <Sparkles className="w-3.5 h-3.5"/>}
                    AI 专家顾问
                </button>
            </div>

            {/* AI Banner */}
            {aiAdvice && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl relative animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-3">
                        <Zap className="w-5 h-5 text-yellow-400 shrink-0 mt-1"/>
                        <div className="text-sm text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAdvice }}></div>
                    </div>
                    <button onClick={()=>setAiAdvice(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><RotateCcw className="w-4 h-4"/></button>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
                
                {/* Left: Main Calculator Area */}
                <div className="col-span-9 ios-glass-panel rounded-2xl p-6 overflow-y-auto">
                    {activeTab === 'logistics' ? <LogisticsCalculator /> : <ProfitSimulator />}
                </div>

                {/* Right: Quick Tools (Converter) */}
                <div className="col-span-3 flex flex-col gap-6">
                    <div className="flex-1 ios-glass-panel rounded-2xl overflow-hidden">
                        <UnitConverter />
                    </div>
                    
                    {/* Quick Tips */}
                    <div className="h-1/3 bg-amber-900/10 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Info className="w-12 h-12 text-amber-500"/></div>
                        <h4 className="text-xs font-bold text-amber-500 uppercase mb-2">Did You Know?</h4>
                        <p className="text-xs text-amber-200/80 leading-relaxed">
                            {activeTab === 'logistics' 
                                ? "海运重货按 1:1000 计算体积重，轻货按 CBM 计费。空运快递通常除以 5000，专线除以 6000。" 
                                : "保本 ROAS 是广告投放的生死线。如果产品利润率为 30%，则保本 ROAS 约为 3.33 (1/0.3)。"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculatorCenter;
