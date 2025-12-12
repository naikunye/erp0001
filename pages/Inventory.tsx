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
  AlertCircle, TrendingUp, Target, BarChart3, Zap, Megaphone, BrainCircuit
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

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setPricingAnalysis(response.text);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzingPrice(false);
        }
    };

    // Use Portal to escape stacking contexts of parent cards
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={onClose}>
            {showSandbox && <PricingSandbox product={formData} onClose={() => setShowSandbox(false)} />}
            
            <div className="ios-glass-panel w-full max-w-6xl max-h-[95vh] h-auto rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            编辑: {formData.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">完善参数以获得更准确的智能补货建议</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-colors font-medium">
                            <FileText className="w-3.5 h-3.5"/> 详情
                        </button>
                        <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-colors font-medium">
                            <History className="w-3.5 h-3.5"/> 变更历史
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors ml-2">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Body - Dashboard Grid Layout */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/20 scrollbar-thin scrollbar-thumb-white/10">
                    
                    {/* SECTION 1: Product & Supply Chain (Full Width) */}
                    <div className="ios-glass-card p-5 mb-6 relative overflow-hidden group">
                        <div className="absolute top-4 left-4 bg-blue-500/20 text-blue-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 border border-blue-500/30">1</div>
                        <h4 className="text-sm font-bold text-white mb-4 pl-8">产品与供应链</h4>
                        
                        <div className="flex flex-col md:flex-row gap-6 pl-8">
                            {/* Image Placeholder */}
                            <div className="w-40 h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 transition-colors cursor-pointer shrink-0">
                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-xs">点击上传</span>
                            </div>
                            
                            {/* Fields */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">日期</label>
                                    <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">生命周期阶段</label>
                                    <select value={formData.lifecycle} onChange={e => setFormData({...formData, lifecycle: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all">
                                        <option value="New">⚡ 新品测试 (New)</option>
                                        <option value="Growing">🚀 爆品增长 (Growing)</option>
                                        <option value="Stable">🌊 稳定热卖 (Stable)</option>
                                        <option value="Clearance">🔻 清仓处理 (Clearance)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">产品名称</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">SKU (支持多标签)</label>
                                    <div className="flex items-center gap-2 w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus-within:border-blue-500 transition-all">
                                        <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-xs flex items-center gap-1 border border-blue-500/30">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> {formData.sku} <X className="w-3 h-3 cursor-pointer"/>
                                        </span>
                                        <input type="text" className="bg-transparent outline-none flex-1 min-w-0 text-white" placeholder="" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1">生产+物流总时效 (Days) <Info className="w-3 h-3"/></label>
                                    <input type="number" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value)})} className="w-full bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2 text-sm text-amber-400 outline-none focus:border-amber-500 transition-all font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 flex items-center gap-1">安全库存天数 (Days) <Info className="w-3 h-3"/></label>
                                    <input type="number" value={formData.safetyStockDays} onChange={e => setFormData({...formData, safetyStockDays: parseInt(e.target.value)})} className="w-full bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2 text-sm text-amber-400 outline-none focus:border-amber-500 transition-all font-bold" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        
                        {/* SECTION 2: Procurement */}
                        <div className="ios-glass-card p-5 relative overflow-hidden group">
                            <div className="absolute top-4 left-4 bg-white/10 text-slate-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 border border-white/20">2</div>
                            <h4 className="text-sm font-bold text-white mb-6 pl-8">采购与供应商 (CRM)</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-5 pl-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">供应商名称</label>
                                    <div className="relative">
                                        <Factory className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                        <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full pl-9 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="工厂名称" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">联系方式</label>
                                    <input type="text" value={formData.supplierContact} onChange={e => setFormData({...formData, supplierContact: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="微信/Email" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">采购单价 (¥/pcs)</label>
                                    <input type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">单个重量 (KG)</label>
                                    <input type="number" value={formData.unitWeight} onChange={e => setFormData({...formData, unitWeight: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">备货箱数 (Box)</label>
                                    <input type="number" value={Math.ceil((formData.suggestedReorder || 150) / formData.itemsPerBox)} readOnly className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-slate-400 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">预估日销 (Daily Sales)</label>
                                    <div className="relative">
                                        <input type="number" value={formData.dailyBurnRate} readOnly className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none" />
                                        <span className="absolute right-2 top-2.5 text-[10px] text-slate-500">📊</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-400">可售天数: 30.0 天</p>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Box Specs */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden flex flex-col">
                            <div className="absolute top-4 left-4 bg-amber-500/20 text-amber-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 border border-amber-500/30">3</div>
                            <div className="flex justify-between items-center mb-6 pl-8">
                                <h4 className="text-sm font-bold text-amber-400">箱规设置</h4>
                                <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/20">
                                    {Math.ceil((formData.suggestedReorder || 150) / formData.itemsPerBox)} 箱 | {(((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * Math.ceil((formData.suggestedReorder || 150) / formData.itemsPerBox)).toFixed(3)} CBM
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-6 pl-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">长 (cm)</label>
                                    <input type="number" value={formData.dimensions?.l} onChange={e => updateDimension('l', parseFloat(e.target.value))} className="w-full bg-black/40 border border-amber-500/30 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">宽 (cm)</label>
                                    <input type="number" value={formData.dimensions?.w} onChange={e => updateDimension('w', parseFloat(e.target.value))} className="w-full bg-black/40 border border-amber-500/30 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">高 (cm)</label>
                                    <input type="number" value={formData.dimensions?.h} onChange={e => updateDimension('h', parseFloat(e.target.value))} className="w-full bg-black/40 border border-amber-500/30 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pl-2 mt-auto">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">每箱数量 (Items/Box)</label>
                                    <div className="relative">
                                        <Box className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                        <input type="number" value={formData.itemsPerBox} onChange={e => setFormData({...formData, itemsPerBox: parseInt(e.target.value)})} className="w-full pl-9 bg-black/40 border border-amber-500/30 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-medium text-slate-400">备货总数 (Total Pcs)</label>
                                        <span className="text-[10px] text-blue-400 cursor-pointer flex items-center gap-1"><Calculator className="w-3 h-3"/> 自动计算</span>
                                    </div>
                                    <input type="number" value={formData.suggestedReorder || 150} readOnly className="w-full bg-black/40 border border-amber-500/30 rounded px-3 py-2 text-lg font-bold text-white outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* SECTION 4: Logistics */}
                        <div className="ios-glass-card p-5 relative overflow-hidden group">
                            <div className="absolute top-4 left-4 bg-white/10 text-slate-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 border border-white/20">4</div>
                            <h4 className="text-sm font-bold text-white mb-6 pl-8">头程物流 (First Leg)</h4>
                            
                            <div className="space-y-5 pl-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">运输渠道</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => updateNested('logistics', 'method', 'Air')}
                                            className={`py-2 text-sm font-medium rounded border flex items-center justify-center gap-2 transition-all ${formData.logistics.method === 'Air' ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                        >
                                            <Plane className="w-4 h-4" /> 空运 (Air)
                                        </button>
                                        <button 
                                            onClick={() => updateNested('logistics', 'method', 'Sea')}
                                            className={`py-2 text-sm font-medium rounded border flex items-center justify-center gap-2 transition-all ${formData.logistics.method === 'Sea' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                        >
                                            <Ship className="w-4 h-4" /> 海运 (Sea)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">承运商 / 船司</label>
                                        <input type="text" value={formData.logistics.carrier || 'Matson/UPS'} onChange={e => updateNested('logistics', 'carrier', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="Matson/UPS" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">物流追踪号</label>
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                                            <input type="text" value={formData.logistics.trackingNo} onChange={e => updateNested('logistics', 'trackingNo', e.target.value)} className="w-full pl-9 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="Tracking No." />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">空运单价 (CNY/KG)</label>
                                        <div className="flex">
                                            <span className="bg-white/5 border border-r-0 border-white/10 rounded-l px-2 py-2 text-xs text-slate-400 flex items-center">¥</span>
                                            <input type="number" value={formData.logistics.unitFreightCost} onChange={e => updateNested('logistics', 'unitFreightCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-r px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">计费总重 (Manual)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-xs text-slate-500">⚖️</span>
                                            <input type="number" className="w-full pl-9 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="0" />
                                            <span className="absolute right-2 top-2.5 text-[10px] text-slate-500">理论实重: {((formData.suggestedReorder||150) * formData.unitWeight).toFixed(2)}kg</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">耗材/贴标费 (¥)</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" defaultValue={30} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">报关费 (¥)</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" defaultValue={0} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">港口/操作费 (¥)</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" defaultValue={0} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">目的仓库</label>
                                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500" defaultValue="火星/休斯顿/美中" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: TikTok / Economics */}
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-4 left-4 bg-purple-500/20 text-purple-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 border border-purple-500/30">5</div>
                            <h4 className="text-sm font-bold text-purple-200 mb-6 pl-8">TikTok 销售与竞品 (Market Intel)</h4>

                            <div className="space-y-5 pl-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">我方销售价格 ($)</label>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setShowSandbox(true)}
                                                className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-all shadow-lg"
                                            >
                                                <Zap className="w-3 h-3"/> 进入定价沙盒
                                            </button>
                                            <button 
                                                onClick={handleAnalyzePricing}
                                                disabled={isAnalyzingPrice}
                                                className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1 transition-all disabled:opacity-50 hover:bg-purple-500/30"
                                            >
                                                {isAnalyzingPrice ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                                智能定价
                                            </button>
                                        </div>
                                    </div>
                                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-purple-500/30 rounded px-3 py-3 text-2xl font-bold text-white outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" />
                                    
                                    {pricingAnalysis && (
                                        <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 relative shadow-sm">
                                            <button onClick={() => setPricingAnalysis(null)} className="absolute top-2 right-2 text-purple-400 hover:text-white"><X className="w-3 h-3"/></button>
                                            <div className="flex items-center gap-2 mb-2 text-purple-300 text-xs font-bold">
                                                <Bot className="w-3.5 h-3.5" /> AI 定价建议
                                            </div>
                                            <div className="text-xs text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: pricingAnalysis }}></div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-medium text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> 竞品监控</label>
                                        <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded cursor-pointer font-medium shadow border border-slate-700">AI 攻防分析</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-red-400" placeholder="竞品链接/ASIN" />
                                        <div className="flex items-center bg-black/40 border border-white/10 rounded px-3 text-xs text-slate-400 min-w-[60px] justify-center">$ 0.00</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-purple-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">TikTok 成本结构</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">平台佣金 (%)</label>
                                            <input type="number" value={formData.economics.platformFeePercent} onChange={e => updateNested('economics', 'platformFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">达人佣金 (%)</label>
                                            <input type="number" value={formData.economics.creatorFeePercent} onChange={e => updateNested('economics', 'creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1 mb-3">
                                        <label className="text-xs font-medium text-slate-400">每单固定费 ($)</label>
                                        <input type="number" value={formData.economics.fixedCost} onChange={e => updateNested('economics', 'fixedCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">预估退货率 (%)</label>
                                            <input type="number" value={formData.economics.refundRatePercent} onChange={e => updateNested('economics', 'refundRatePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">尾程派送费 ($)</label>
                                            <input type="number" value={formData.economics.lastLegShipping} onChange={e => updateNested('economics', 'lastLegShipping', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">预估广告费 ($)</label>
                                        <input type="number" value={formData.economics.adCost} onChange={e => updateNested('economics', 'adCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Footer Actions */}
                <div className="bg-white/5 border-t border-white/10 p-4 shrink-0 z-20">
                    <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> 保存修改并记录日志
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const Inventory: React.FC = () => {
  const { state } = useTanxing();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReplenishmentItem | null>(null);

  // --- Logic ---
  const replenishmentItems = useMemo(() => {
      return state.products.map(p => {
          const burnRate = p.dailyBurnRate || 1;
          const dos = Math.floor(p.stock / burnRate);
          const leadTime = p.leadTime || 30;
          const safetyStock = p.safetyStockDays || 15;
          const reorderPoint = leadTime + safetyStock;
          
          // Suggest restock to cover 45 days
          let suggested = 0;
          if (dos < reorderPoint) {
              suggested = Math.ceil((burnRate * 45) - p.stock);
          }
          
          return {
              ...p,
              dailyBurnRate: burnRate,
              daysRemaining: dos,
              safetyStock: safetyStock,
              suggestedReorder: Math.max(0, suggested),
              supplierLeadTime: leadTime,
              status: dos === 0 ? 'OOS' : dos < reorderPoint ? 'Urgent' : 'OK'
          } as ReplenishmentItem;
      }).filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a, b) => (b.suggestedReorder > 0 ? 1 : 0) - (a.suggestedReorder > 0 ? 1 : 0)); // Urgent first
  }, [state.products, searchTerm]);

  const totalPurchaseAmount = replenishmentItems.reduce((acc, item) => acc + (item.suggestedReorder * (item.costPrice || 0)), 0);
  const itemsToRestock = replenishmentItems.filter(i => i.suggestedReorder > 0).length;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      
      {/* Container Card */}
      <div className="ios-glass-panel rounded-2xl flex flex-col h-full overflow-hidden relative m-1">
          
          {/* Header Section */}
          <div className="p-6 border-b border-white/10 bg-white/5 relative z-10 shrink-0">
              <div className="flex justify-between items-start">
                  <div>
                      <h1 className="text-xl font-bold text-white flex items-center gap-2">
                          <PackageCheck className="w-6 h-6 text-indigo-500" />
                          TikTok 智能补货清单
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">基于日销与供应链时效的精准采购建议</p>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                      {/* AI Strategy Toggle */}
                      <div className="flex items-center gap-3 bg-indigo-900/20 border border-indigo-500/30 px-4 py-2 rounded-xl">
                          <div className="p-1.5 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/50">
                              <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                              <div className="text-xs font-bold text-indigo-300">AI 生命周期待略</div>
                              <div className="text-[10px] text-indigo-400/60">已启用: 动态调整备货天数</div>
                          </div>
                          <div 
                              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${aiEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                              onClick={() => setAiEnabled(!aiEnabled)}
                          >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-md transition-all ${aiEnabled ? 'right-1' : 'left-1'}`}></div>
                          </div>
                      </div>

                      {/* Summary Card */}
                      <div className="bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-xl shadow-lg flex items-center gap-6 min-w-[280px] border border-white/10">
                          <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">建议补货 SKU</div>
                              <div className="text-2xl font-black">{itemsToRestock}</div>
                          </div>
                          <div className="h-8 w-[1px] bg-white/10"></div>
                          <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">预计采购金额</div>
                              <div className="text-2xl font-black text-emerald-400 font-mono">¥{totalPurchaseAmount.toLocaleString()}</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* List Section */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              <div className="grid grid-cols-1 gap-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/5 rounded-lg mb-2 border border-white/5">
                      <div className="col-span-4">产品信息 (Product)</div>
                      <div className="col-span-2">库存状况 (Stock)</div>
                      <div className="col-span-2">供应链 (Supply)</div>
                      <div className="col-span-2">补货建议 (Suggestion)</div>
                      <div className="col-span-2 text-right">操作 (Action)</div>
                  </div>

                  {replenishmentItems.map(item => (
                      <div key={item.id} onClick={() => setSelectedItem(item)} className={`grid grid-cols-12 px-4 py-4 rounded-xl border transition-all cursor-pointer items-center group ${item.status === 'Urgent' || item.status === 'OOS' ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}>
                          <div className="col-span-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-black/40 rounded border border-white/10 flex items-center justify-center text-slate-500">
                                  <ImageIcon className="w-5 h-5" />
                              </div>
                              <div>
                                  <div className="text-sm font-bold text-white flex items-center gap-2">
                                      {item.sku}
                                      <StrategyBadge type={item.lifecycle || 'Stable'} />
                                  </div>
                                  <div className="text-xs text-slate-400 truncate w-48">{item.name}</div>
                              </div>
                          </div>
                          <div className="col-span-2">
                              <div className="text-sm font-bold text-white font-mono">{item.stock} pcs</div>
                              <div className={`text-xs ${item.daysRemaining < 15 ? 'text-red-400' : 'text-slate-500'}`}>
                                  可售 {item.daysRemaining} 天
                              </div>
                          </div>
                          <div className="col-span-2">
                              <div className="text-xs text-slate-300">交期: {item.supplierLeadTime}天</div>
                              <div className="text-xs text-slate-500">安全库存: {item.safetyStock}天</div>
                          </div>
                          <div className="col-span-2">
                              {item.suggestedReorder > 0 ? (
                                  <div>
                                      <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                                          <Download className="w-3 h-3" /> +{item.suggestedReorder}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                          ¥{(item.suggestedReorder * (item.costPrice || 0)).toLocaleString()}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-xs text-slate-600 flex items-center gap-1">充足</div>
                              )}
                          </div>
                          <div className="col-span-2 flex justify-end gap-2">
                              <button className="p-2 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors">
                                  <Calculator className="w-4 h-4" />
                              </button>
                              <button className="px-3 py-1.5 bg-white/5 hover:bg-indigo-600 text-slate-300 hover:text-white rounded text-xs transition-colors border border-white/10">
                                  生成 PO
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {selectedItem && <EditModal product={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
};

export default Inventory;