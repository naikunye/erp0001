import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Truck, Plane, Container, Scale, Box, 
  ArrowRightLeft, BadgeDollarSign, TrendingUp, Sparkles, 
  RotateCcw, Info, Zap, Delete, Copy, Divide, Minus, Plus, X as Multiply, Equal, Percent,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { useTanxing } from '../context/TanxingContext';

// --- Types ---
type CalculatorTab = 'logistics' | 'profit' | 'standard';

// --- Standard Calculator Component ---
const StandardCalculator = () => {
    const { showToast } = useTanxing();
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [shouldReset, setShouldReset] = useState(false);

    const handleNumber = (num: string) => {
        if (display === '0' || shouldReset) {
            setDisplay(num);
            setShouldReset(false);
        } else {
            setDisplay(display + num);
        }
    };

    const handleOperator = (op: string) => {
        setEquation(display + ' ' + op + ' ');
        setShouldReset(true);
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setShouldReset(false);
    };

    const handleDelete = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
        }
    };

    const handleCalculate = () => {
        try {
            const fullExpr = equation + display;
            // 使用简化的 eval 替代方案处理基础运算
            const sanitizedExpr = fullExpr.replace(/[^-()\d/*+.]/g, '');
            const result = eval(sanitizedExpr);
            const finalResult = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, "");
            
            setEquation(fullExpr + ' =');
            setDisplay(finalResult);
            setShouldReset(true);
        } catch (e) {
            setDisplay('Error');
            setShouldReset(true);
        }
    };

    const handlePercent = () => {
        const val = parseFloat(display) / 100;
        setDisplay(val.toString());
    };

    const copyResult = () => {
        navigator.clipboard.writeText(display);
        showToast(`计算结果 ${display} 已复制`, 'success');
    };

    const CalcButton = ({ label, onClick, className = "", variant = "num" }: any) => {
        let baseClass = "h-16 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center ";
        if (variant === "num") baseClass += "bg-white/5 hover:bg-white/10 text-white border border-white/5";
        if (variant === "op") baseClass += "bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30";
        if (variant === "action") baseClass += "bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 border border-white/5";
        if (variant === "equal") baseClass += "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40";

        return (
            <button onClick={onClick} className={`${baseClass} ${className}`}>
                {label}
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full max-w-md mx-auto">
            {/* Display Area */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 mb-6 relative overflow-hidden shadow-inner group">
                <div className="absolute top-4 right-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">{equation}</div>
                <div className="text-right text-4xl font-black text-white font-mono tracking-tighter truncate mt-4">
                    {display}
                </div>
                <button 
                    onClick={copyResult}
                    className="absolute bottom-4 left-6 p-2 text-slate-600 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="复制结果"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-3">
                <CalcButton variant="action" label="AC" onClick={handleClear} />
                <CalcButton variant="action" label={<Delete className="w-5 h-5"/>} onClick={handleDelete} />
                <CalcButton variant="action" label={<Percent className="w-5 h-5"/>} onClick={handlePercent} />
                <CalcButton variant="op" label={<Divide className="w-5 h-5"/>} onClick={() => handleOperator('/')} />

                <CalcButton label="7" onClick={() => handleNumber('7')} />
                <CalcButton label="8" onClick={() => handleNumber('8')} />
                <CalcButton label="9" onClick={() => handleNumber('9')} />
                <CalcButton variant="op" label={<Multiply className="w-5 h-5"/>} onClick={() => handleOperator('*')} />

                <CalcButton label="4" onClick={() => handleNumber('4')} />
                <CalcButton label="5" onClick={() => handleNumber('5')} />
                <CalcButton label="6" onClick={() => handleNumber('6')} />
                <CalcButton variant="op" label={<Minus className="w-5 h-5"/>} onClick={() => handleOperator('-')} />

                <CalcButton label="1" onClick={() => handleNumber('1')} />
                <CalcButton label="2" onClick={() => handleNumber('2')} />
                <CalcButton label="3" onClick={() => handleNumber('3')} />
                <CalcButton variant="op" label={<Plus className="w-5 h-5"/>} onClick={() => handleOperator('+')} />

                <CalcButton label="0" className="col-span-2" onClick={() => handleNumber('0')} />
                <CalcButton label="." onClick={() => handleNumber('.')} />
                <CalcButton variant="equal" label={<Equal className="w-6 h-6"/>} onClick={handleCalculate} />
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
                <Zap className="w-3 h-3 text-indigo-500" /> Arithmetic Engine Active
            </div>
        </div>
    );
};

// --- Logistics & Profit Components remain largely same but optimized for space ---
const LogisticsCalculator = () => {
    const [dims, setDims] = useState({ length: 0, width: 0, height: 0, qty: 1, weight: 0 });
    const [rates, setRates] = useState({ sea: 800, air: 35, currency: 'CNY' }); 
    const [airDivisor, setAirDivisor] = useState<5000 | 6000>(6000); 

    const totalVolumeCBM = (dims.length * dims.width * dims.height * dims.qty) / 1000000;
    const totalRealWeight = dims.weight * dims.qty;
    const volWeight = (dims.length * dims.width * dims.height * dims.qty) / airDivisor;
    const chargeWeightAir = Math.max(totalRealWeight, volWeight);
    
    const seaCost = totalVolumeCBM * rates.sea;
    const airCost = chargeWeightAir * rates.air;

    const c20gp = 28; 
    const c40hq = 68; 
    const fill20gp = (totalVolumeCBM / c20gp) * 100;
    const fill40hq = (totalVolumeCBM / c40hq) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="flex flex-col gap-6">
                <div className="bg-black/20 border border-white/10 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                        <Box className="w-4 h-4 text-blue-400" /> 货物规格 (Cargo Specs)
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-[10px] text-slate-400 block mb-1">长 (cm)</label><input type="number" value={dims.length || ''} onChange={e=>setDims({...dims, length: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-blue-500" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">宽 (cm)</label><input type="number" value={dims.width || ''} onChange={e=>setDims({...dims, width: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-blue-500" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">高 (cm)</label><input type="number" value={dims.height || ''} onChange={e=>setDims({...dims, height: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-blue-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-400 block mb-1">单箱重量 (kg)</label><input type="number" value={dims.weight || ''} onChange={e=>setDims({...dims, weight: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-blue-500" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">箱数 (Qty)</label><input type="number" value={dims.qty || ''} onChange={e=>setDims({...dims, qty: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-blue-500" /></div>
                    </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                        <Scale className="w-4 h-4 text-emerald-400" /> 运费单价 (Rates)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-400 block mb-1">海运/方 (Sea/CBM)</label><input type="number" value={rates.sea} onChange={e=>setRates({...rates, sea: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none" /></div>
                        <div><label className="text-[10px] text-slate-400 block mb-1">空运/kg (Air/KG)</label><input type="number" value={rates.air} onChange={e=>setRates({...rates, air: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none" /></div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/30 rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div>
                            <div className="text-xs text-slate-400 uppercase tracking-tighter">总体积 (Total Vol)</div>
                            <div className="text-2xl font-black text-white font-mono mt-1">{totalVolumeCBM.toFixed(3)} <span className="text-[10px] text-slate-500 font-bold">CBM</span></div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 uppercase tracking-tighter">计费重 (Chargeable)</div>
                            <div className="text-2xl font-black text-white font-mono mt-1">{chargeWeightAir.toFixed(1)} <span className="text-[10px] text-slate-500 font-bold">KG</span></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center">
                            <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">海运预估</div>
                            <div className="text-lg font-bold text-blue-100">¥ {seaCost.toLocaleString()}</div>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-center">
                            <div className="text-[10px] text-orange-400 font-bold uppercase mb-1">空运预估</div>
                            <div className="text-lg font-bold text-orange-100">¥ {airCost.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-xl p-5 flex-1">
                    <h3 className="text-sm font-bold text-white mb-4">集装箱利用率 (Capacity)</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-slate-400">20GP Container</span>
                                <span className={fill20gp > 100 ? 'text-red-400' : 'text-emerald-400'}>{fill20gp.toFixed(1)}%</span>
                            </div>
                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${fill20gp > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, fill20gp)}%`}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-slate-400">40HQ Container</span>
                                <span className={fill40hq > 100 ? 'text-red-400' : 'text-blue-400'}>{fill40hq.toFixed(1)}%</span>
                            </div>
                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${fill40hq > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, fill40hq)}%`}}></div>
                            </div>
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
    const breakEvenAdSpend = price - cogs - ship - fee;
    const breakEvenRoas = breakEvenAdSpend > 0 ? price / breakEvenAdSpend : 0;

    const data = [
        { name: '采购', value: cogs, color: '#3b82f6' },
        { name: '物流', value: ship, color: '#f59e0b' },
        { name: '平台', value: fee, color: '#a855f7' },
        { name: '广告', value: adCpa, color: '#ec4899' },
        { name: '净利', value: Math.max(0, profit), color: profit > 0 ? '#10b981' : '#ef4444' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-1 bg-black/20 border border-white/10 rounded-xl p-5 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><BadgeDollarSign className="w-4 h-4 text-emerald-400" /> 参数设置</h3>
                <div className="space-y-4">
                    <div><label className="text-[10px] text-slate-400 block mb-1">销售定价 ($)</label><input type="number" value={price} onChange={e=>setPrice(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white font-bold" /></div>
                    <div><label className="text-[10px] text-slate-400 block mb-1">采购成本 ($)</label><input type="number" value={cogs} onChange={e=>setCogs(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" /></div>
                    <div><label className="text-[10px] text-slate-400 block mb-1">总运费 ($)</label><input type="number" value={ship} onChange={e=>setShip(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-400 block mb-1">平台佣金 (%)</label><input type="number" value={feePct} onChange={e=>setFeePct(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" /></div>
                        <div className="text-[10px] text-slate-500 pt-6">${fee.toFixed(2)}</div>
                    </div>
                    <div><label className="text-[10px] text-slate-400 block mb-1">广告 CPA ($)</label><input type="number" value={adCpa} onChange={e=>setAdCpa(parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" /></div>
                </div>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-[10px] text-slate-500 mb-1">净利润</div>
                        <div className={`text-xl font-black font-mono ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${profit.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-[10px] text-slate-500 mb-1">利润率</div>
                        <div className={`text-xl font-black font-mono ${margin > 20 ? 'text-emerald-400' : 'text-orange-400'}`}>{margin.toFixed(1)}%</div>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-[10px] text-slate-500 mb-1">保本 ROAS</div>
                        <div className="text-xl font-black font-mono text-blue-400">{breakEvenRoas.toFixed(2)}</div>
                    </div>
                </div>
                <div className="flex-1 bg-black/20 border border-white/10 rounded-xl p-6 min-h-[300px]">
                    <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">成本结构透视</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{left: 10, right: 30}}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={40} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor:'#000', borderColor:'#333'}} />
                            <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
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
    const v = parseFloat(val as string) || 0;
    return (
        <div className="bg-black/20 border border-white/10 rounded-xl p-5 h-full overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><ArrowRightLeft className="w-4 h-4 text-purple-400" /> 换算器 (Converter)</h3>
            <div className="mb-6"><input type="number" value={val} onChange={e=>setVal(e.target.value)} className="w-full text-center text-3xl font-black bg-transparent border-b border-white/20 pb-2 text-white focus:border-purple-500 outline-none" /></div>
            <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4">
                    <div className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest">单位映射矩阵</div>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center"><span className="text-slate-400">CM 转 英寸</span><span className="font-mono font-bold text-white">{(v * 0.3937).toFixed(2)}"</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400">KG 转 磅(lb)</span><span className="font-mono font-bold text-white">{(v * 2.204).toFixed(2)} lbs</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400">CBM 转 FT³</span><span className="font-mono font-bold text-white">{(v * 35.31).toFixed(2)} ft³</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalculatorCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<CalculatorTab>('logistics');
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const handleAiConsult = async () => {
        setIsAiThinking(true);
        setAiAdvice(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `分析一下跨境电商中常用的 ${activeTab === 'logistics' ? '物流计费重和体积重优化技巧' : '如何通过降低退货率和广告CPA来提升净利率'}。给出3条简短但专业的建议。HTML格式，加粗核心词。`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setAiAdvice(response.text);
        } catch (e) {
            setAiAdvice("<b>AI 神经元连接超时</b>");
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Header Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-black/40 p-2 rounded-2xl border border-white/10 backdrop-blur-md gap-4">
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                    <button onClick={()=>setActiveTab('logistics')} className={`px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'logistics' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        <Truck className="w-4 h-4"/> 物流计算
                    </button>
                    <button onClick={()=>setActiveTab('profit')} className={`px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'profit' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        <BadgeDollarSign className="w-4 h-4"/> 利润推演
                    </button>
                    <button onClick={()=>setActiveTab('standard')} className={`px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'standard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        <Calculator className="w-4 h-4"/> 标准算术
                    </button>
                </div>
                <button onClick={handleAiConsult} disabled={isAiThinking} className="px-5 py-2.5 bg-white/5 border border-white/10 text-indigo-400 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xl">
                    {isAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5"/>}
                    咨询 AI 专家
                </button>
            </div>

            {/* AI Advisor Banner */}
            {aiAdvice && (
                <div className="bg-indigo-900/20 border border-indigo-500/20 p-5 rounded-2xl relative animate-in slide-in-from-top-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0 border border-indigo-500/20 text-indigo-400"><Zap className="w-5 h-5 fill-current"/></div>
                        <div className="text-sm text-indigo-100 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiAdvice }}></div>
                    </div>
                    <button onClick={()=>setAiAdvice(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><RotateCcw className="w-4 h-4"/></button>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-9 ios-glass-panel rounded-3xl p-8 overflow-y-auto custom-scrollbar border-white/5">
                    {activeTab === 'logistics' && <LogisticsCalculator />}
                    {activeTab === 'profit' && <ProfitSimulator />}
                    {activeTab === 'standard' && <StandardCalculator />}
                </div>

                <div className="hidden lg:col-span-3 lg:flex flex-col gap-6">
                    <div className="flex-1 ios-glass-panel rounded-3xl overflow-hidden border-white/5 shadow-xl">
                        <UnitConverter />
                    </div>
                    <div className="bg-amber-900/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 p-8 opacity-[0.05] group-hover:scale-110 transition-transform"><Info className="w-24 h-24 text-amber-500"/></div>
                        <h4 className="text-xs font-black text-amber-500 uppercase mb-3 tracking-[0.2em] italic">Operational Wisdom</h4>
                        <p className="text-[11px] text-amber-200/70 leading-relaxed font-medium">
                            {activeTab === 'logistics' 
                                ? "海运按 CBM 计费，但要注意美国内陆点的 IPI 附加费。空运建议优先考虑拼货以摊薄报关成本。" 
                                : activeTab === 'profit'
                                ? "广告 ACOS 高于利润率即意味着单量增长在侵蚀现金流。尝试优化转化率而非盲目出价。"
                                : "所有的伟大的决策都源于准确的基础数据。核对账单时请务必精细到小数点后四位。"}
                        </p>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }` }} />
        </div>
    );
};

// --- Added RefreshCw to imports above and kept this internal component ---
const Loader2 = ({ className }: any) => <RefreshCw className={className} />;

export default CalculatorCenter;