
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  PackageCheck, Search, Download, X, 
  Sparkles, Calculator, 
  Box, DollarSign, Save,
  Plane, Ship, Info, Factory, Image as ImageIcon, History, FileText, Loader2, Bot,
  AlertCircle, TrendingUp, Target, BarChart3, Zap, Megaphone, BrainCircuit, CheckSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// --- Components ---

const StrategyBadge: React.FC<{ type: string }> = ({ type }) => {
    let color = 'bg-white/5 text-slate-300 border-white/10';
    let label = type;
    let subLabel = '标准';
    
    if (type === 'New' || type === '新品测试') {
        color = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        label = '新品测试';
        subLabel = '保守';
    } else if (type === 'Growing' || type === '爆品增长') {
        color = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        label = '爆品增长';
        subLabel = '激进';
    } else if (type === 'Stable' || type === '稳定热卖') {
        color = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
        label = '稳定热卖';
        subLabel = '标准';
    } else if (type === 'Clearance') {
        color = 'bg-red-500/10 text-red-400 border border-red-500/20';
        label = '清仓处理';
        subLabel = '停止';
    }

    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md border w-fit ${color}`}>
            <Sparkles className="w-3 h-3" />
            <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold">{label}</span>
                <span className="text-[8px] opacity-70">({subLabel})</span>
            </div>
        </div>
    );
};

// --- TikTok Pricing Sandbox Component ---
const PricingSandbox: React.FC<{ product: any, onClose: () => void }> = ({ product, onClose }) => {
    const [simPrice, setSimPrice] = useState(product.price || 29.99);
    const [simAdCpa, setSimAdCpa] = useState(product.economics?.adCost || 10);
    const [competitorPrice, setCompetitorPrice] = useState(product.price * 1.1); // Mock competitor price
    
    const [isThinking, setIsThinking] = useState(false);
    const [aiPrediction, setAiPrediction] = useState<string | null>(null);

    // Calculate Real-time Metrics
    const metrics = useMemo(() => {
        const cost = (product.costPrice || 0) / 7.2; // Convert CNY to USD approx
        const logistics = product.logistics?.unitFreightCost || 5;
        const platformFee = simPrice * ((product.economics?.platformFeePercent || 5) / 100);
        const creatorFee = simPrice * ((product.economics?.creatorFeePercent || 10) / 100);
        const fixed = product.economics?.fixedCost || 0.5;
        const lastLeg = product.economics?.lastLegShipping || 5;
        
        const totalCost = cost + logistics + platformFee + creatorFee + fixed + lastLeg + simAdCpa;
        const netProfit = simPrice - totalCost;
        const margin = (netProfit / simPrice) * 100;

        return {
            cost, logistics, platformFee, creatorFee, fixed, lastLeg, totalCost, netProfit, margin
        };
    }, [simPrice, simAdCpa, product]);

    // Chart Data
    const breakdownData = [
        { name: '货值 COGS', value: metrics.cost, fill: '#3b82f6' },
        { name: '物流 Logistics', value: metrics.logistics + metrics.lastLeg, fill: '#f59e0b' },
        { name: '佣金 Fees', value: metrics.platformFee + metrics.creatorFee + metrics.fixed, fill: '#8b5cf6' },
        { name: '广告 CPA', value: simAdCpa, fill: '#ec4899' },
        { name: '净利 Profit', value: Math.max(0, metrics.netProfit), fill: metrics.netProfit > 0 ? '#10b981' : '#ef4444' }
    ];

    const handleRunSimulation = async () => {
        setIsThinking(true);
        setAiPrediction(null);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                Act as a TikTok Shop Pricing Algorithm Expert.
                
                Scenario for Product: ${product.name}
                - My Price: $${simPrice.toFixed(2)}
                - Competitor Price: $${competitorPrice.toFixed(2)}
                - Ad CPA Budget: $${simAdCpa.toFixed(2)}
                - Current Margin: ${metrics.margin.toFixed(2)}% ($${metrics.netProfit.toFixed(2)})
                
                Task: Predict the outcome of this pricing strategy.
                1. Sales Volume Potential (Low/Medium/High) & Why.
                2. Likely Competitor Reaction.
                3. One optimization tip.
                
                Format: HTML, concise, use <b> for highlights.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setAiPrediction(response.text);
        } catch (e) {
            setAiPrediction("AI 服务暂时不可用。");
        } finally {
            setIsThinking(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-md bg-black/80" onClick={onClose}>
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                
                {/* Sandbox Header */}
                <div className="px-6 py-4 border-b border-white/10 bg-indigo-950/20 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-400" />
                            TikTok 定价沙盒 (Pricing Sandbox)
                        </h3>
                        <p className="text-xs text-indigo-300 mt-1">实时模拟利润结构，AI 预测市场反馈</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Controls */}
                    <div className="w-1/3 p-6 border-r border-white/10 bg-black/20 overflow-y-auto space-y-8">
                        
                        {/* Price Control */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400"/> 销售定价 (Price)</label>
                                <span className="text-xl font-mono font-bold text-emerald-400">${simPrice.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min={product.costPrice ? (product.costPrice/7.2)*1.5 : 5} max={product.price * 3} step="0.5" 
                                value={simPrice} onChange={e => setSimPrice(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Min: Cost+</span>
                                <span>Max: Premium</span>
                            </div>
                        </div>

                        {/* Ad Cost Control */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-pink-400"/> 广告预算 (CPA)</label>
                                <span className="text-xl font-mono font-bold text-pink-400">${simAdCpa.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" min="0" max="50" step="0.5" 
                                value={simAdCpa} onChange={e => setSimAdCpa(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>

                        {/* Competitor Price */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-white flex items-center gap-2"><Target className="w-4 h-4 text-orange-400"/> 竞品价格锚点</label>
                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                                <span className="text-slate-400 text-xs">$</span>
                                <input 
                                    type="number" value={competitorPrice} onChange={e => setCompetitorPrice(parseFloat(e.target.value))}
                                    className="bg-transparent border-none outline-none text-white font-mono flex-1"
                                />
                            </div>
                            <div className="text-xs text-slate-400 flex justify-between">
                                <span>价差 (Diff):</span>
                                <span className={simPrice < competitorPrice ? 'text-emerald-400' : 'text-red-400'}>
                                    {simPrice < competitorPrice ? '-' : '+'}${Math.abs(simPrice - competitorPrice).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={handleRunSimulation}
                            disabled={isThinking}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isThinking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Bot className="w-4 h-4"/>}
                            运行 AI 模拟
                        </button>
                    </div>

                    {/* Right: Visualization & Results */}
                    <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-slate-900/50">
                        
                        {/* Metrics Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                                <div className="text-xs text-slate-500 mb-1">净利润 (Net Profit)</div>
                                <div className={`text-2xl font-black font-mono ${metrics.netProfit > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                    ${metrics.netProfit.toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                                <div className="text-xs text-slate-500 mb-1">利润率 (Margin)</div>
                                <div className={`text-2xl font-black font-mono ${metrics.margin > 20 ? 'text-blue-400' : metrics.margin > 0 ? 'text-orange-400' : 'text-red-500'}`}>
                                    {metrics.margin.toFixed(1)}%
                                </div>
                            </div>
                            <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                                <div className="text-xs text-slate-500 mb-1">总成本 (Total Cost)</div>
                                <div className="text-2xl font-black font-mono text-slate-200">
                                    ${metrics.totalCost.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-64 mb-6 relative">
                            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-2"><BarChart3 className="w-3 h-3"/> 成本结构拆解</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={breakdownData} margin={{ left: 20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fill:'#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        contentStyle={{backgroundColor: '#000', borderColor: '#333', fontSize: '12px', color: '#fff'}}
                                        formatter={(val: number) => `$${val.toFixed(2)}`}
                                    />
                                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                        {breakdownData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* AI Insight */}
                        <div className="flex-1 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit className="w-24 h-24 text-white"/></div>
                            <h4 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2 relative z-10">
                                <Sparkles className="w-4 h-4"/> AI 预测报告
                            </h4>
                            <div className="relative z-10 text-sm text-slate-300 leading-relaxed font-mono">
                                {isThinking ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin" /> 正在分析市场数据...
                                    </div>
                                ) : aiPrediction ? (
                                    <div dangerouslySetInnerHTML={{ __html: aiPrediction }}></div>
                                ) : (
                                    <p className="text-slate-500 italic">点击 "运行 AI 模拟" 以获取基于当前定价的预测分析。</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const EditModal: React.FC<{ product: ReplenishmentItem, onClose: () => void }> = ({ product, onClose }) => {
    // Local State for inputs
    const [formData, setFormData] = useState({
        ...product,
        // Ensure defaults
        costPrice: product.costPrice || 0,
        itemsPerBox: product.itemsPerBox || 1,
        dimensions: product.dimensions || { l: 32, w: 24, h: 18 },
        logistics: product.logistics || { method: 'Air', carrier: '', unitFreightCost: 62, trackingNo: '' },
        economics: product.economics || { platformFeePercent: 5, adCost: 10, lastLegShipping: 5.44, fixedCost: 0.3, creatorFeePercent: 10, refundRatePercent: 3 },
        price: product.price || 0,
        supplier: product.supplier || '',
        supplierContact: product.supplierContact || '',
        stock: product.stock || 0,
        dailyBurnRate: product.dailyBurnRate || 0,
        unitWeight: product.unitWeight || 0.085
    });

    const [isAnalyzingPrice, setIsAnalyzingPrice] = useState(false);
    const [pricingAnalysis, setPricingAnalysis] = useState<string | null>(null);
    const [showSandbox, setShowSandbox] = useState(false); // New Sandbox State

    const updateNested = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev] as any,
                [field]: value
            }
        }));
    };

    const updateDimension = (field: 'l' | 'w' | 'h', value: number) => {
        setFormData(prev => ({
            ...prev,
            dimensions: {
                ...prev.dimensions!,
                [field]: value
            }
        }));
    };

    const handleAnalyzePricing = async () => {
        setIsAnalyzingPrice(true);
        setPricingAnalysis(null);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                Role: Pricing Analyst.
                Product: ${formData.name}
                Cost: ¥${formData.costPrice}
                Price: $${formData.price}
                Analyze pricing strategy briefly.
            `;

            const response = await ai