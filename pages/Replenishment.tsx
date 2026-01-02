
import React, { useState, useMemo, useEffect } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Product } from '../types';
import { 
  Plus, X, Plane, Ship, Image as ImageIcon,
  Save, Search, ChevronRight, Calculator, Zap,
  Box, Truck, TrendingUp, DollarSign, Users, Ruler,
  History, BarChart3, AlertCircle, Clock, ShieldAlert
} from 'lucide-react';

const HealthRingCompact: React.FC<{ score: number }> = ({ score }) => {
    const color = score > 80 ? '#34C759' : score > 50 ? '#FF9500' : '#FF3B30';
    const radius = 14;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;

    return (
        <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
            <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="20" cy="20" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="20" cy="20" r={radius} fill="transparent" stroke={color} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <span className="absolute text-[9px] font-bold text-white/80 font-mono">{score}</span>
        </div>
    );
};

const SKUEditModal: React.FC<{ product: Product, onClose: () => void }> = ({ product, onClose }) => {
    const { dispatch, showToast } = useTanxing();
    const [form, setForm] = useState<Product>(JSON.parse(JSON.stringify(product))); // Deep copy

    // --- Auto Calculations ---
    const stats = useMemo(() => {
        // 1. Exchange Rate (Mock)
        const EXCHANGE = 7.2;

        // 2. Unit Weight & Volume
        const unitWeight = form.unitWeight || 0.5;
        // Volume Weight = (L*W*H)/6000
        const dims = form.dimensions || { l: 0, w: 0, h: 0 };
        const volWeight = (dims.l * dims.w * dims.h) / 6000;
        const billingWeight = Math.max(unitWeight, volWeight);

        // 3. Logistics Cost (CNY)
        const unitFreightRate = form.logistics?.unitFreightCost || 0; // Price per KG
        const unitLogisticsCNY = billingWeight * unitFreightRate;
        
        // 4. Total Costs (USD)
        const cogsUSD = (form.costPrice || 0) / EXCHANGE;
        const logisticsUSD = unitLogisticsCNY / EXCHANGE;
        
        // 5. TikTok Fees (USD)
        const price = form.price || 0;
        const platformFee = price * ((form.economics?.platformFeePercent || 0) / 100);
        const creatorFee = price * ((form.economics?.creatorFeePercent || 0) / 100);
        const fixedCost = form.economics?.fixedCost || 0;
        const lastLeg = form.economics?.lastLegShipping || 0;
        const adCost = form.economics?.adCost || 0;
        const refundCost = price * ((form.economics?.refundRatePercent || 0) / 100);

        const totalCostUSD = cogsUSD + logisticsUSD + platformFee + creatorFee + fixedCost + lastLeg + adCost + refundCost;
        const profit = price - totalCostUSD;
        const margin = price > 0 ? (profit / price) * 100 : 0;
        const totalStockProfit = profit * (form.stock || 0);

        return {
            billingWeight,
            unitLogisticsCNY,
            totalCostUSD,
            profit,
            margin,
            totalStockProfit,
            totalFreightCNY: unitLogisticsCNY * (form.stock || 0)
        };
    }, [form]);

    // Helpers to update nested state
    const updateLogistics = (field: string, val: any) => {
        setForm(prev => ({ ...prev, logistics: { ...prev.logistics, [field]: val } }));
    };
    const updateEconomics = (field: string, val: any) => {
        setForm(prev => ({ ...prev, economics: { ...prev.economics, [field]: val } }));
    };
    const updateDimensions = (field: string, val: any) => {
        setForm(prev => ({ ...prev, dimensions: { ...prev.dimensions, [field]: val } as any }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 animate-in fade-in duration-300">
            <div className="w-full max-w-7xl h-[90vh] bg-[#0f0f11] rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            编辑: {form.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">
                            完善参数以获得准确的智能补货建议
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-4 py-2 border border-white/10 rounded-lg text-xs text-slate-400 flex items-center gap-2 hover:bg-white/5 transition-all">
                            <History size={14} /> 变更历史
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                            <X size={24}/>
                        </button>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
                    <div className="grid grid-cols-12 gap-6">
                        
                        {/* 1. Product & Gallery */}
                        <div className="col-span-12 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-indigo-600 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white">1</span>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">产品与供应链 (Product & Gallery)</h4>
                            </div>
                            <div className="flex gap-8">
                                <div className="w-48 h-48 bg-black/40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-600 hover:border-indigo-500/50 hover:text-indigo-400 cursor-pointer transition-all shrink-0">
                                    {form.image ? <img src={form.image} className="w-full h-full object-cover rounded-xl" /> : <><Plus size={24} /><span className="text-xs mt-2 font-bold">URL...</span></>}
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">备货日期</label>
                                        <input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">生命周期阶段</label>
                                        <select 
                                            value={form.lifecycle} 
                                            onChange={e => setForm({...form, lifecycle: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 appearance-none"
                                        >
                                            <option value="Growing">🚀 爆品增长 (Growing)</option>
                                            <option value="Stable">⚖️ 稳定热销 (Stable)</option>
                                            <option value="Clearance">📉 尾货清仓 (Clearance)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">产品名称</label>
                                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="col-span-3 grid grid-cols-12 gap-6">
                                        <div className="col-span-6 space-y-2">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase">SKU (Multi-Tag)</label>
                                            <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-2">
                                                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded font-mono">{form.sku}</span>
                                                <input className="bg-transparent outline-none text-sm text-white flex-1" placeholder="添加更多 ..." />
                                            </div>
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[10px] text-amber-500 font-bold uppercase">生产+物流总时效</label>
                                            <div className="relative"><input type="number" value={form.leadTime} onChange={e=>setForm({...form, leadTime: parseInt(e.target.value)})} className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400 outline-none font-bold" /><Clock size={14} className="absolute right-4 top-3.5 text-amber-500/50" /></div>
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[10px] text-amber-500 font-bold uppercase">安全库存天数</label>
                                            <div className="relative"><input type="number" value={form.safetyStockDays} onChange={e=>setForm({...form, safetyStockDays: parseInt(e.target.value)})} className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400 outline-none font-bold" /><ShieldAlert size={14} className="absolute right-4 top-3.5 text-amber-500/50" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Procurement & Supplier */}
                        <div className="col-span-12 lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-blue-600 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white">2</span>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">采购与供应商 (CRM)</h4>
                            </div>
                            <div className="space-y-5 flex-1">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase">供应商名称</label>
                                    <div className="relative"><Users className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" /><input value={form.supplier || ''} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-bold" placeholder="例如：广州制衣厂" /></div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase">联系方式</label>
                                    <input value={form.supplierContact || ''} onChange={e => setForm({...form, supplierContact: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-mono" placeholder="微信: gz_garment" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">采购单价 (¥/pcs)</label>
                                        <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-xl text-white outline-none focus:border-blue-500 font-mono font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">单个实重 (KG)</label>
                                        <input type="number" value={form.unitWeight} onChange={e => setForm({...form, unitWeight: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-xl text-white outline-none focus:border-blue-500 font-mono font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase">预估日销 (Daily Sales)</label>
                                    <div className="relative">
                                        <BarChart3 className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                                        <input type="number" value={form.dailyBurnRate} onChange={e => setForm({...form, dailyBurnRate: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-xl text-white outline-none focus:border-blue-500 font-mono font-bold" />
                                        <span className="absolute right-4 top-4 text-[10px] text-emerald-500 font-bold">可售天数: {Math.floor((form.stock || 0) / (form.dailyBurnRate || 1))}天</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Box Specs */}
                        <div className="col-span-12 lg:col-span-7 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="bg-orange-600 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white">3</span>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">箱规与入库</h4>
                                </div>
                                <div className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                                    {Math.ceil((form.stock || 0) / (form.itemsPerBox || 1))} 箱 | {(stats.billingWeight * (form.stock || 0) / 1000).toFixed(3)} CBM
                                </div>
                            </div>
                            <div className="space-y-6 flex-1">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] text-slate-500 font-bold">长 (cm)</label><input type="number" value={form.dimensions?.l} onChange={e => updateDimensions('l', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-lg text-white font-mono font-bold text-center" /></div>
                                    <div className="space-y-1"><label className="text-[10px] text-slate-500 font-bold">宽 (cm)</label><input type="number" value={form.dimensions?.w} onChange={e => updateDimensions('w', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-lg text-white font-mono font-bold text-center" /></div>
                                    <div className="space-y-1"><label className="text-[10px] text-slate-500 font-bold">高 (cm)</label><input type="number" value={form.dimensions?.h} onChange={e => updateDimensions('h', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-lg text-white font-mono font-bold text-center" /></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono bg-black/20 p-2 rounded-lg border border-white/5">
                                    <span>单品实重: {form.unitWeight} kg</span>
                                    <span>单品体积: {((form.dimensions?.l||0)*(form.dimensions?.w||0)*(form.dimensions?.h||0)/6000).toFixed(2)} kg (÷6000)</span>
                                    <span className="text-orange-400 font-bold border border-orange-500/30 px-2 rounded">理论计费重: {stats.billingWeight.toFixed(2)} kg</span>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">当前库存 (总件数)</label>
                                        <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-2xl text-white outline-none focus:border-orange-500 font-mono font-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">装箱数 (Box - 手动)</label>
                                        <input type="number" value={form.itemsPerBox} onChange={e => setForm({...form, itemsPerBox: parseInt(e.target.value)})} className="w-full bg-black/40 border border-orange-500/20 rounded-lg px-4 py-3 text-2xl text-orange-400 outline-none focus:border-orange-500 font-mono font-black" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase">预录入库单号</label>
                                    <input className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 font-mono outline-none" placeholder="IB..." />
                                </div>
                            </div>
                        </div>

                        {/* 4. First Leg Logistics */}
                        <div className="col-span-12 lg:col-span-7 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-indigo-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white">4</span>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">头程物流 (First Leg)</h4>
                            </div>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase">运输渠道</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => updateLogistics('method', 'Air')}
                                            className={`py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${form.logistics?.method === 'Air' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
                                        >
                                            <Plane size={14}/> 空运 (Air)
                                        </button>
                                        <button 
                                            onClick={() => updateLogistics('method', 'Sea')}
                                            className={`py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${form.logistics?.method === 'Sea' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
                                        >
                                            <Ship size={14}/> 海运 (Sea)
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">承运商 / 船司</label>
                                        <input value={form.logistics?.carrier || ''} onChange={e => updateLogistics('carrier', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">物流追踪号</label>
                                        <div className="relative"><Truck className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" /><input value={form.logistics?.trackingNo || ''} onChange={e => updateLogistics('trackingNo', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white font-mono" /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 items-end bg-blue-900/10 p-4 rounded-xl border border-blue-500/10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">运费单价 (¥/KG)</label>
                                        <div className="relative"><span className="absolute left-3 top-3 text-slate-500 text-xs">¥</span><input type="number" value={form.logistics?.unitFreightCost} onChange={e => updateLogistics('unitFreightCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-2 py-2 text-lg text-white font-mono font-bold" /></div>
                                    </div>
                                    <div className="col-span-2 flex justify-between items-center pb-2">
                                        <div className="text-right">
                                            <div className="text-[9px] text-slate-500 font-bold uppercase">批次总计费重 (KG)</div>
                                            <div className="text-xl font-mono text-slate-400">Auto Calc: <span className="text-slate-200">{((stats.billingWeight * (form.stock || 0))).toFixed(1)}kg</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-blue-200 uppercase">全口径预估总投入 (含耗材)</span>
                                    <span className="text-2xl font-black text-white font-mono">¥ {stats.totalFreightCNY.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono px-2">
                                    <span>基础运费 (FREIGHT)<br/><strong className="text-white text-sm">¥ {(stats.totalFreightCNY).toFixed(0)}</strong> <span className="opacity-50">({stats.billingWeight.toFixed(1)}kg * ¥{form.logistics?.unitFreightCost})</span></span>
                                    <span className="text-right">耗材总计 (CONSUMABLES)<br/><strong className="text-amber-500 text-sm">¥ 0</strong></span>
                                </div>
                                <div className="text-[9px] text-slate-600 italic mt-2 flex justify-between">
                                    <span>逻辑: 基于 系统推算的计费重 参与最终分摊</span>
                                    <span>单品全分摊: ¥{stats.unitLogisticsCNY.toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">耗材/贴标费 (¥/pcs)</label><input type="number" className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white" value={form.logistics?.consumablesFee} onChange={e=>updateLogistics('consumablesFee', parseFloat(e.target.value))} /></div>
                                    <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">报关费 (¥/Total Batch)</label><input type="number" className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white" value={form.logistics?.customsFee} onChange={e=>updateLogistics('customsFee', parseFloat(e.target.value))} /></div>
                                    <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">目的仓库</label><input type="text" className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white" value={form.logistics?.targetWarehouse} onChange={e=>updateLogistics('targetWarehouse', e.target.value)} /></div>
                                    <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">单品计费重 (灰字提示)</label><input disabled value={stats.billingWeight.toFixed(2)} className="w-full bg-white/5 border border-white/5 rounded px-2 py-2 text-xs text-slate-400" /></div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Sales & Market Intel & 6. Cost Structure */}
                        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                            
                            {/* 5. Sales */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="bg-purple-600 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white">5</span>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">TikTok 销售与竞品 (Market Intel)</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">我方销售价格 ($)</label>
                                        <input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-4 py-4 text-3xl font-black text-white outline-none focus:border-purple-500 font-mono" />
                                    </div>
                                    <div className="p-3 border border-purple-500/20 bg-purple-500/5 rounded-xl space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Zap size={12}/> 竞品监控</span>
                                            <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded text-[9px]">AI 攻防分析</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white" placeholder="竞品链接/ASIN" />
                                            <div className="relative w-24">
                                                <span className="absolute left-2 top-2 text-slate-500 text-xs">$</span>
                                                <input className="w-full bg-black/40 border border-white/10 rounded pl-5 pr-2 py-2 text-xs text-white" placeholder="0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 6. Cost Structure */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4">
                                    <Zap size={12}/> TikTok Cost Structure
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">平台佣金 (%)</label><input type="number" value={form.economics?.platformFeePercent} onChange={e => updateEconomics('platformFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" /></div>
                                        <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">达人佣金 (%)</label><input type="number" value={form.economics?.creatorFeePercent} onChange={e => updateEconomics('creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" /></div>
                                    </div>
                                    <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">每单固定费 ($)</label><input type="number" value={form.economics?.fixedCost} onChange={e => updateEconomics('fixedCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">预估退货率 (%)</label><input type="number" value={form.economics?.refundRatePercent} onChange={e => updateEconomics('refundRatePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" /></div>
                                        <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">尾程派送费 ($)</label><input type="number" value={form.economics?.lastLegShipping} onChange={e => updateEconomics('lastLegShipping', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" /></div>
                                    </div>
                                    <div className="space-y-1"><label className="text-[9px] text-slate-500 uppercase">预估广告费 ($)</label><input type="number" value={form.economics?.adCost} onChange={e => updateEconomics('adCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono" /></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 7. Profit Analysis Footer */}
                <div className="p-0 shrink-0 bg-[#050505] border-t border-white/10">
                    {/* Profit Bar */}
                    <div className="bg-emerald-950/30 border-y border-emerald-500/20 px-8 py-5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-white">单品利润实时测算 (Unit Profit Analysis)</h4>
                                <div className="text-[10px] text-slate-400 font-mono mt-1">
                                    单品成本(Total Cost): <span className="text-white">${stats.totalCostUSD.toFixed(2)}</span> &nbsp;
                                    汇率: 7.2 &nbsp; 
                                    全口径单摊运费: <span className="text-blue-400">¥{stats.unitLogisticsCNY.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-12 text-right">
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estimated Profit</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${stats.profit > 0 ? 'text-emerald-400' : 'text-red-500'}`}>${stats.profit.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Margin</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${stats.margin > 15 ? 'text-emerald-400' : stats.margin > 0 ? 'text-orange-400' : 'text-red-500'}`}>{stats.margin.toFixed(1)}%</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Stock Profit</div>
                                <div className="text-4xl font-black text-emerald-600 font-mono tracking-tighter">${stats.totalStockProfit.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                            </div>
                        </div>
                    </div>

                    {/* Notes & Actions */}
                    <div className="p-6 flex gap-6">
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2">备注信息 (Notes)</label>
                            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-transparent text-sm text-slate-300 outline-none resize-none flex-1 placeholder-slate-700" placeholder="填写备货注意事项、产品细节说明等..." />
                        </div>
                        <div className="w-[300px] flex items-end">
                            <button 
                                onClick={() => { dispatch({ type: 'UPDATE_PRODUCT', payload: form }); showToast('全维资产参数已固化', 'success'); onClose(); }}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                <Save className="w-5 h-5" /> 保存修改并记录日志
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const Replenishment: React.FC = () => {
    const { state } = useTanxing();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Product | null>(null);

    const filtered = (state.products || []).filter(p => !p.deletedAt && (p.sku.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())));

    return (
        <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
            {/* Minimalist Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-[20px] font-semibold text-white/90 tracking-tight">备货矩阵</h1>
                    <div className="flex items-center gap-3 mt-1 text-white/30 text-[11px] font-medium">
                        <span className="flex items-center gap-1"><Zap size={10} className="text-ios-blue"/> Quantum Engine Active</span>
                        <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                        <span>{filtered.length} SKUs Identified</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 w-3.5 h-3.5" />
                        <input 
                            type="text" 
                            placeholder="检索 SKU..." 
                            value={search}
                            onChange={e=>setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-[12px] text-white focus:border-ios-blue/50 outline-none w-56 transition-all font-medium"
                        />
                    </div>
                    <button className="w-8 h-8 bg-ios-blue text-white rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm">
                        <Plus size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Compact Matrix Table style List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-1 gap-2">
                    {filtered.map((item) => {
                        const days = item.dailyBurnRate ? Math.floor(item.stock / item.dailyBurnRate) : 999;
                        const health = Math.max(10, Math.min(100, days > 60 ? 100 : (days / 60) * 100));
                        
                        return (
                            <div 
                                key={item.id} 
                                onClick={() => setSelected(item)}
                                className="apple-vibrancy px-5 py-3 squircle-pro flex items-center justify-between cursor-pointer group hover:bg-white/[0.05] transition-all border-l-4"
                                style={{ borderLeftColor: item.lifecycle === 'Growing' ? '#AF52DE' : item.lifecycle === 'Clearance' ? '#FF3B30' : '#34C759' }}
                            >
                                <div className="flex items-center gap-5 w-[250px]">
                                    <div className="w-10 h-10 bg-black/40 rounded-[8px] border-hairline flex items-center justify-center shrink-0 overflow-hidden">
                                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-white/10" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[14px] font-semibold text-white tracking-tight leading-none mb-1 group-hover:text-ios-blue transition-colors font-mono">{item.sku}</div>
                                        <div className="text-[11px] text-white/30 truncate max-w-[160px] font-medium tracking-tight uppercase">{item.name}</div>
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-4 items-center gap-8">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">物流模态</span>
                                        <div className="flex items-center gap-2 text-[12px] font-medium text-white/60 italic">
                                            {item.logistics?.method === 'Air' ? <Plane size={11} className="text-ios-blue" /> : <Ship size={11} className="text-ios-green" />}
                                            {item.logistics?.method || '待对齐'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">当前负载</span>
                                        <span className="text-[14px] font-bold text-white/80 font-mono tracking-tight">{item.stock.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">风险评估</span>
                                        <span className={`text-[11px] font-bold italic uppercase tracking-tighter ${days < 15 ? 'text-ios-red' : 'text-ios-green opacity-60'}`}>
                                            {days < 15 ? 'Low_Stock' : 'Stable'} ({days}D)
                                        </span>
                                    </div>
                                    <div className="flex justify-end pr-4">
                                        <HealthRingCompact score={health} />
                                    </div>
                                </div>

                                <div className="text-white/10 group-hover:text-ios-blue transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selected && (
                <SKUEditModal product={selected} onClose={() => setSelected(null)} />
            )}
        </div>
    );
};

export default Replenishment;
