
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, Sparkles, Plane, Ship, 
  Image as ImageIcon, TrendingUp, CheckCircle2, Zap, Edit2, Plus, 
  Copy, Trash2, X, Monitor, Wallet, CopyPlus, Clock, User, BarChart3, 
  Truck, Target, Calculator, Info, Save, History as HistoryIcon, Link as LinkIcon
} from 'lucide-react';

const getTrackingUrl = (carrier: string = '', trackingNo: string = '') => {
    const t = trackingNo.trim();
    if (!t) return '#';
    const c = carrier.toLowerCase().trim();
    if (t.toUpperCase().startsWith('1Z') || c.includes('ups')) return `https://www.ups.com/track?loc=zh_CN&tracknum=${t}`;
    return `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${encodeURIComponent(t)}`;
};

const StrategyBadge: React.FC<{ type: string }> = ({ type }) => {
    let color = 'bg-slate-800 text-slate-400 border-slate-700';
    let label = type === 'New' || type === '新品测试' ? 'NEW' : type === 'Growing' || type === '爆品增长' ? 'HOT' : (type === 'Clearance' || type === 'CLEAR') ? 'CLEAR' : 'STABLE';
    if (label === 'NEW') color = 'bg-blue-900/30 text-blue-400 border-blue-500/20';
    else if (label === 'HOT') color = 'bg-purple-900/30 text-purple-400 border-purple-500/20';
    else if (label === 'CLEAR') color = 'bg-rose-900/30 text-rose-400 border-rose-500/20';
    else color = 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20';
    return <div className={`flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-black border ${color} uppercase tracking-tighter w-fit`}>
        {label === 'NEW' ? <Sparkles className="w-2.5 h-2.5"/> : label === 'HOT' ? <TrendingUp className="w-2.5 h-2.5"/> : <CheckCircle2 className="w-2.5 h-2.5"/>}
        <span>{label}</span>
    </div>;
};

// --- 重写后的精密编辑面板 ---
const EditModal: React.FC<{ product: Product, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    const { state, showToast } = useTanxing();
    const exchangeRate = state.exchangeRate || 7.2;
    const [formData, setFormData] = useState<Product>({
        ...product,
        dimensions: product.dimensions || { l: 40, w: 30, h: 5 },
        itemsPerBox: product.itemsPerBox || 50,
        logistics: product.logistics || { method: 'Air', carrier: 'DHL', trackingNo: '', unitFreightCost: 2.5, targetWarehouse: 'US-WEST-01' },
        economics: product.economics || { platformFeePercent: 5, creatorFeePercent: 10, fixedCost: 0.5, lastLegShipping: 3.5, adCost: 2.0, refundRatePercent: 3 }
    });

    const updateField = (field: string, value: any) => setFormData(prev => ({...prev, [field]: value}));
    const updateLogistics = (field: string, value: any) => setFormData(prev => ({...prev, logistics: {...prev.logistics!, [field]: value}}));
    const updateEconomics = (field: string, value: any) => setFormData(prev => ({...prev, economics: {...prev.economics!, [field]: value}}));
    const updateDims = (field: string, value: any) => setFormData(prev => ({...prev, dimensions: {...prev.dimensions!, [field]: value}}));

    // 精准计算引擎
    const totalBoxes = Math.ceil(formData.stock / (formData.itemsPerBox || 1));
    const totalVolume = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * totalBoxes;
    const volWeight = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0)) / 6000;
    const theoryWeight = Math.max(formData.unitWeight || 0, volWeight);
    const billingWeight = theoryWeight * formData.stock;
    const totalFreight = (formData.logistics?.unitFreightCost || 0) * billingWeight + (formData.logistics?.consumablesFee || 0);
    
    const unitFreightUSD = formData.stock > 0 ? (totalFreight / formData.stock) / exchangeRate : 0;
    const unitCogsUSD = (formData.costPrice || 0) / exchangeRate;
    const priceUSD = formData.price || 0;
    const platformFeeUSD = priceUSD * ((formData.economics?.platformFeePercent || 0) / 100);
    const creatorFeeUSD = priceUSD * ((formData.economics?.creatorFeePercent || 0) / 100);
    const adCostUSD = formData.economics?.adCost || 0;
    const fixedUSD = (formData.economics?.fixedCost || 0) + (formData.economics?.lastLegShipping || 0);
    const refundLossUSD = priceUSD * ((formData.economics?.refundRatePercent || 0) / 100);
    const unitProfitUSD = priceUSD - (unitCogsUSD + unitFreightUSD + platformFeeUSD + creatorFeeUSD + adCostUSD + fixedUSD + refundLossUSD);
    const margin = priceUSD > 0 ? (unitProfitUSD / priceUSD) * 100 : 0;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md bg-black/95 font-sans">
            <div className="bg-[#0a0a0c] w-full max-w-[1100px] h-[92vh] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,1)] border border-white/5 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header: 紧凑布局 */}
                <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-[#111114]">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">PROTOCOL EDIT: {formData.sku}</h3>
                        <p className="text-[9px] text-slate-600 mt-1.5 uppercase tracking-[0.4em] font-bold">Quantum Alignment Matrix v6.0</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest transition-all">
                            <HistoryIcon className="w-3.5 h-3.5"/> LOGS
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full text-slate-700 hover:text-red-500 transition-all">
                            <X className="w-8 h-8" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-7 space-y-7 custom-scrollbar bg-[#0a0a0c]">
                    
                    {/* 1. 产品主视角 (全宽) */}
                    <section className="bg-[#141417] border border-white/5 rounded-[1.2rem] p-6 shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="bg-indigo-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black shadow-lg">1</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Product Profile</span>
                        </div>
                        <div className="flex gap-8">
                            <div className="w-28 h-28 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-slate-800 hover:border-indigo-500/30 cursor-pointer transition-all shrink-0">
                                {formData.image ? <img src={formData.image} className="w-full h-full object-cover rounded-[0.9rem]" /> : <ImageIcon className="w-7 h-7" />}
                                <span className="text-[7px] font-black uppercase mt-1.5 opacity-30 tracking-tighter">Visual Asset</span>
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-5">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] ml-0.5">Date Locked</label>
                                    <input type="date" value={formData.lastUpdated} className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] ml-0.5">Lifecycle</label>
                                    <select value={formData.lifecycle} onChange={e=>updateField('lifecycle', e.target.value)} className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500">
                                        <option value="Growing">🚀 Growing</option><option value="New">💎 New</option><option value="Stable">✅ Stable</option><option value="Clearance">📉 Clear</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] ml-0.5">Label</label>
                                    <input value={formData.name} onChange={e=>updateField('name', e.target.value)} className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-bold outline-none" />
                                </div>
                                <div className="space-y-1 col-span-1">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] ml-0.5">SKU Protocol</label>
                                    <div className="flex items-center gap-2 p-2 bg-black border border-white/5 rounded-lg">
                                        <span className="bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 text-[10px] font-black uppercase font-mono">{formData.sku}</span>
                                        <input placeholder="+" className="bg-transparent border-none outline-none text-[9px] text-slate-700 w-10 font-black" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-amber-500 font-black uppercase tracking-[0.2em] ml-0.5">Lead-Time</label>
                                    <div className="relative">
                                        <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2 text-amber-600" />
                                        <input type="number" value={formData.leadTime} onChange={e=>updateField('leadTime', parseInt(e.target.value))} className="w-full bg-amber-600/5 border border-amber-500/20 rounded-lg pl-9 py-2 text-xs text-amber-400 font-mono font-black outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-amber-500 font-black uppercase tracking-[0.2em] ml-0.5">Safety Stock</label>
                                    <div className="relative">
                                        <CheckCircle2 className="w-3.5 h-3.5 absolute left-2.5 top-2 text-amber-600" />
                                        <input type="number" value={formData.safetyStockDays} onChange={e=>updateField('safetyStockDays', parseInt(e.target.value))} className="w-full bg-amber-600/5 border border-amber-500/20 rounded-lg pl-9 py-2 text-xs text-amber-400 font-mono font-black outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2 & 3. CRM(5) & Box(7) */}
                    <div className="grid grid-cols-12 gap-5">
                        <div className="col-span-5 bg-[#141417] border border-white/5 rounded-[1.2rem] p-5 shadow-xl flex flex-col">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="bg-blue-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black">2</span>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Vendor Core</span>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Supplier Entity</label>
                                    <input value={formData.supplier} onChange={e=>updateField('supplier', e.target.value)} className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-xs text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Cost ¥/Pcs</label>
                                        <input type="number" value={formData.costPrice} onChange={e=>updateField('costPrice', parseFloat(e.target.value))} className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm font-black text-white font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Net Wt (Kg)</label>
                                        <input type="number" value={formData.unitWeight} onChange={e=>updateField('unitWeight', parseFloat(e.target.value))} className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm font-black text-white font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Daily Sales</label>
                                    <input type="number" value={formData.dailyBurnRate} onChange={e=>updateField('dailyBurnRate', parseFloat(e.target.value))} className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-xl font-black text-indigo-400 font-mono" />
                                    <div className="text-right mt-1"><span className="text-[8px] text-emerald-500 font-black uppercase italic tracking-tighter">Runtime: {formData.dailyBurnRate && formData.dailyBurnRate > 0 ? Math.floor(formData.stock / formData.dailyBurnRate) : '--'} Days</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-7 bg-[#141417] border border-white/5 rounded-[1.2rem] p-5 relative overflow-hidden shadow-xl">
                            {/* 金色汇总挂带 */}
                            <div className="absolute top-0 right-0 px-5 py-2 bg-amber-600/30 text-amber-500 text-[10px] font-black uppercase border-b border-l border-amber-900/20 rounded-bl-xl shadow-xl">
                                {totalBoxes} BOX | {totalVolume.toFixed(3)} CBM
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-amber-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black">3</span>
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">Box Specifications</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {['L', 'W', 'H'].map(d => (
                                    <div key={d} className="space-y-1">
                                        <label className="text-[9px] text-slate-600 font-black uppercase">{d} (cm)</label>
                                        <input type="number" value={(formData.dimensions as any)[d.toLowerCase()]} onChange={e=>updateDims(d.toLowerCase(), parseFloat(e.target.value))} className="w-full bg-black border border-amber-900/10 rounded-lg px-3 py-2 text-xs text-white font-mono font-black" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-slate-700 font-black uppercase tracking-tighter mb-6 px-1">
                                <span>Real: {formData.unitWeight}kg</span>
                                <span>Vol: {(volWeight).toFixed(2)}kg (÷6000)</span>
                                <span className="bg-amber-600/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/10 italic">Billing: {theoryWeight.toFixed(2)}kg</span>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total Stock (Pcs)</label>
                                    <input type="number" value={formData.stock} onChange={e=>updateField('stock', parseInt(e.target.value))} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-4xl font-black text-white font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-700 font-black uppercase tracking-widest">Items / Box</label>
                                    <input type="number" value={formData.itemsPerBox} onChange={e=>updateField('itemsPerBox', parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-4xl font-black text-slate-800 font-mono outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4 & 5. Logistics(7) & Market(5) */}
                    <div className="grid grid-cols-12 gap-5">
                        <div className="col-span-7 bg-[#141417] border border-white/5 rounded-[1.2rem] p-5 shadow-xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="bg-indigo-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black">4</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Logistics Matrix</span>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-black rounded-xl border border-white/5">
                                    <button onClick={()=>updateLogistics('method', 'Air')} className={`py-2.5 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${formData.logistics?.method === 'Air' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:text-slate-400'}`}>
                                        <Plane className="w-3.5 h-3.5"/> Air
                                    </button>
                                    <button onClick={()=>updateLogistics('method', 'Sea')} className={`py-2.5 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${formData.logistics?.method === 'Sea' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:text-slate-400'}`}>
                                        <Ship className="w-3.5 h-3.5"/> Sea
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Rate (¥/Kg)</label>
                                        <div className="flex gap-2">
                                            <div className="flex items-center justify-center w-8 bg-black border border-white/5 rounded-lg text-slate-600 text-[10px] font-black font-mono">¥</div>
                                            <input type="number" value={formData.logistics?.unitFreightCost} onChange={e=>updateLogistics('unitFreightCost', parseFloat(e.target.value))} className="flex-1 bg-black border border-white/5 rounded-lg px-3 py-2 text-lg text-white font-mono font-black outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Total Bill-Wt</label>
                                        <input type="number" readOnly value={billingWeight.toFixed(1)} className="w-full bg-black/40 border border-blue-900/10 rounded-lg px-3 py-2 text-lg text-blue-300 font-mono font-black opacity-60" />
                                    </div>
                                </div>
                                {/* 深蓝色汇总卡片 */}
                                <div className="bg-[#0f111a] border border-indigo-500/20 rounded-2xl p-5 shadow-2xl relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-2">All-In Investment</div>
                                        <div className="text-3xl font-black text-white font-mono tracking-tighter">¥ {totalFreight.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 text-[8px] font-black border-t border-white/5 pt-4 uppercase text-slate-500 italic">
                                        <div className="flex justify-between">Freight: <span className="text-white">¥ {((formData.logistics?.unitFreightCost||0)*billingWeight).toLocaleString()}</span></div>
                                        <div className="text-right">Unit Share: ¥{(totalFreight / (formData.stock||1)).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-5 bg-[#141417] border border-white/5 rounded-[1.2rem] p-5 flex flex-col shadow-xl">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="bg-purple-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black">5</span>
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">TikTok Intel</span>
                            </div>
                            <div className="space-y-5 flex-1">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Our List Price ($)</label>
                                    <input type="number" value={formData.price} onChange={e=>updateField('price', parseFloat(e.target.value))} className="w-full bg-black border border-purple-900/20 rounded-2xl py-5 text-5xl font-black text-white font-mono text-center outline-none shadow-inner" />
                                </div>
                                <div className="bg-[#1a0f20]/60 border border-purple-500/10 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center text-[8px] font-black text-purple-400 tracking-widest uppercase">
                                        <span>Radar Control</span>
                                        <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-[7px] animate-pulse">ACTIVE</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input placeholder="ASIN/Link..." className="flex-1 bg-black border border-white/5 rounded-lg px-3 py-1.5 text-[9px] text-slate-500 outline-none" />
                                        <div className="bg-black border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-slate-700 font-mono font-black">$ 0</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div className="space-y-1">
                                        <label className="text-[8px] text-slate-700 font-black uppercase">Platform %</label>
                                        <input type="number" value={formData.economics?.platformFeePercent} onChange={e=>updateEconomics('platformFeePercent', parseFloat(e.target.value))} className="w-full bg-black border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] text-slate-700 font-black uppercase">Creator %</label>
                                        <input type="number" value={formData.economics?.creatorFeePercent} onChange={e=>updateEconomics('creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-black border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 6. 底部深暗绿色利润分析条 */}
                    <div className="bg-[#0a1a14] border border-emerald-500/10 rounded-[1.8rem] p-7 flex flex-col lg:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#10b98108,transparent)] pointer-events-none"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-12 h-12 bg-emerald-500/5 rounded-xl flex items-center justify-center border border-emerald-500/10 text-emerald-500 shadow-3xl">
                                <Calculator className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-lg font-black text-emerald-500 italic tracking-tighter uppercase leading-none">Net Profit Logic</h4>
                                <div className="flex gap-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                    <span>Exp: <span className="text-slate-400 font-mono">${(priceUSD - unitProfitUSD).toFixed(2)}</span></span>
                                    <span>Rate: <span className="text-slate-400 font-mono">{exchangeRate}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-10 relative z-10 mt-5 lg:mt-0 px-2">
                            <div className="text-right">
                                <div className="text-[9px] text-slate-600 font-black uppercase mb-0.5 tracking-widest opacity-60">Unit Profit</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${unitProfitUSD > 0 ? 'text-emerald-500' : 'text-rose-600'}`}>${unitProfitUSD.toFixed(2)}</div>
                            </div>
                            <div className="text-right border-l border-white/5 pl-8">
                                <div className="text-[9px] text-slate-600 font-black uppercase mb-0.5 tracking-widest opacity-60">Margin</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${margin > 20 ? 'text-emerald-500' : 'text-orange-600'}`}>{margin.toFixed(1)}%</div>
                            </div>
                            <div className="text-right border-l border-white/5 pl-8">
                                <div className="text-[9px] text-slate-600 font-black uppercase mb-0.5 tracking-widest opacity-60">Inventory Profit</div>
                                <div className="text-4xl font-black text-emerald-500 font-mono tracking-tighter">${(unitProfitUSD * formData.stock).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#141417]/40 border border-white/5 rounded-[1.2rem] p-5 space-y-3">
                        <h4 className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] italic flex items-center gap-2"><div className="w-6 h-[1px] bg-slate-800"></div> Intel Notes</h4>
                        <textarea 
                            value={formData.notes || ''} 
                            onChange={e=>updateField('notes', e.target.value)}
                            className="w-full h-24 bg-black/40 border border-white/5 rounded-xl p-5 text-xs text-slate-400 outline-none focus:border-indigo-500 transition-all leading-relaxed placeholder:italic"
                            placeholder="OPERATIONAL INTELLIGENCE INPUT..."
                        />
                    </div>
                </div>

                {/* 底部按钮: 全宽压缩高度 */}
                <div className="px-8 py-6 border-t border-white/5 bg-[#111114] shrink-0">
                    <button 
                        onClick={()=>onSave(formData)} 
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.8em] rounded-[1.2rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-4 active:scale-[0.98] group shadow-indigo-900/40"
                    >
                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform"/> COMMIT PROTOCOL
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const Inventory: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<Product | null>(null);
    const exchangeRate = state.exchangeRate || 7.2;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(`已复制协议码: ${text}`, 'success');
    };

    const handleClone = (item: ReplenishmentItem) => {
        const clonedProduct: Product = {
            ...item,
            id: `P-CLONE-${Date.now()}`,
            sku: `${item.sku}-COPY`,
            name: `${item.name} (副本)`,
            stock: 0,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        dispatch({ type: 'ADD_PRODUCT', payload: clonedProduct });
        showToast(`量子链路已复制: ${item.sku}`, 'success');
    };

    const replenishmentItems: ReplenishmentItem[] = useMemo(() => {
        return (state.products || []).filter(p => !p.deletedAt).map(p => {
            const stock = p.stock || 0;
            const dailyBurnRate = p.dailyBurnRate || 0;
            const daysRemaining = dailyBurnRate > 0 ? Math.floor(stock / dailyBurnRate) : 999;
            
            const dims = p.dimensions || {l:40, w:30, h:5};
            const volWeight = (dims.l * dims.w * dims.h) / 6000;
            const theoryWeight = Math.max(p.unitWeight || 0, volWeight);
            const billingWeight = theoryWeight * stock;
            const totalFreight = (p.logistics?.unitFreightCost || 0) * billingWeight + (p.logistics?.consumablesFee || 0);
            
            const unitFreightUSD = stock > 0 ? (totalFreight / stock) / exchangeRate : 0;
            const unitCogsUSD = (p.costPrice || 0) / exchangeRate;
            const fees = (p.price || 0) * 0.15;
            const unitProfit = (p.price || 0) - (unitCogsUSD + unitFreightUSD + fees + 0.5);
            
            return {
                ...p, dailyBurnRate, daysRemaining, profit: unitProfit, margin: (p.price || 0) > 0 ? (unitProfit / p.price) * 100 : 0,
                totalInvestment: stock * (p.costPrice || 0) + (totalFreight),
                liveTrackingStatus: (state.shipments || []).find((s: Shipment) => s.trackingNo === p.logistics?.trackingNo)?.status || '待处理'
            } as ReplenishmentItem;
        });
    }, [state.products, state.shipments, exchangeRate]);

    const filteredItems = replenishmentItems.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="ios-glass-panel rounded-xl border border-white/10 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/40 font-sans">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-3xl z-20">
                <div className="flex items-center gap-3">
                    <PackageCheck className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-white font-black text-base uppercase tracking-tighter">智能备货清单 (Replenishment List)</h2>
                    <div className="text-[10px] text-slate-500 ml-8 flex gap-8 font-black uppercase tracking-[0.25em]">
                        <span>SKU 总数: <span className="text-white font-mono">{filteredItems.length}</span></span>
                        <span>资金占用: <span className="text-emerald-400 font-mono">¥{replenishmentItems.reduce((a,b)=>a+b.totalInvestment,0).toLocaleString()}</span></span>
                        <span>预估总利润: <span className="text-blue-400 font-mono">${replenishmentItems.reduce((a,b)=>a+(b.profit*b.stock),0).toLocaleString(undefined, {maximumFractionDigits:0})}</span></span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative group"> 
                        <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-3" /> 
                        <input type="text" placeholder="搜索 SKU / 名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-72 pl-12 pr-4 py-2 bg-black/60 border border-white/10 rounded-xl text-[11px] text-white outline-none focus:border-indigo-500 font-black uppercase tracking-wider transition-all" /> 
                    </div>
                    <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"> <Plus className="w-4 h-4"/> 添加 SKU </button>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><Download className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                    <thead className="bg-[#050508] sticky top-0 z-10 border-b border-white/10 backdrop-blur-md shadow-2xl">
                        <tr className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">
                            <th className="px-5 py-5 w-12 text-center"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20"/></th>
                            <th className="px-5 py-5 w-44">SKU / 阶段</th>
                            <th className="px-5 py-5 w-72">产品信息 / 供应商</th>
                            <th className="px-5 py-5 w-52">物流状态 (TRACKING)</th>
                            <th className="px-5 py-5 w-36">资金投入</th>
                            <th className="px-5 py-5 w-32 text-center">库存数量</th>
                            <th className="px-5 py-5 w-48">销售 & 利润</th>
                            <th className="px-5 py-5 w-56">备注信息</th>
                            <th className="px-5 py-5 w-24 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans bg-black/10">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-indigo-600/5 transition-all group">
                                <td className="px-5 py-7 text-center align-top"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20 mt-3"/></td>
                                <td className="px-5 py-7 align-top">
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-center gap-2.5 relative">
                                            <div className={`w-2 h-2 rounded-full ${item.daysRemaining < 10 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
                                            <span className="text-[16px] font-black text-white font-mono tracking-tighter uppercase cursor-pointer hover:text-indigo-400 transition-colors" onClick={()=>copyToClipboard(item.sku)}>{item.sku}</span>
                                            <button onClick={()=>copyToClipboard(item.sku)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3 text-slate-700 hover:text-white"/></button>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-5 py-7 align-top">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 shrink-0 overflow-hidden shadow-2xl flex items-center justify-center">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-7 h-7 text-slate-800"/>}
                                        </div>
                                        <div className="flex flex-col min-w-0 justify-center">
                                            <div className="text-[16px] font-black text-slate-200 truncate max-w-[220px] uppercase tracking-tighter leading-tight">{item.name}</div>
                                            <div className="text-[10px] text-slate-600 flex items-center gap-1.5 font-black uppercase mt-1.5"><Monitor className="w-3 h-3"/> {item.supplier || '未指定供应商'}</div>
                                            {item.lingXingId && <div className="text-[8px] bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono w-fit font-black tracking-tight mt-2 uppercase">LX: {item.lingXingId}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-7 align-top">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">
                                            {item.logistics?.method === 'Sea' ? <Ship className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                                            <span>{item.logistics?.method || 'Air'} Freight</span>
                                        </div>
                                        <div className={`text-[9px] px-2 py-0.5 rounded border font-black uppercase tracking-tighter w-fit ${item.liveTrackingStatus === '运输中' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 animate-pulse' : 'bg-slate-800/40 text-slate-600 border-white/5'}`}>{item.liveTrackingStatus}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <a href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)} target="_blank" rel="noreferrer" className="text-[12px] text-indigo-400 hover:text-indigo-200 underline font-mono font-black tracking-tighter whitespace-nowrap">
                                                {item.logistics?.trackingNo || 'AWAITING_PROTOCOL'}
                                            </a>
                                            <button onClick={()=>showToast('同步物理节点...','info')} className="p-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-xl shrink-0 transition-transform active:scale-90"><Zap className="w-2.5 h-2.5 fill-current"/></button>
                                        </div>
                                        <div className="text-[10px] text-slate-700 font-black uppercase flex gap-4 tracking-[0.1em] mt-1">
                                            <span>{(item.unitWeight! * item.stock).toFixed(1)}kg</span>
                                            <span>{Math.ceil(item.stock/(item.itemsPerBox||1))} box</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-7 align-top">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="text-[18px] font-black text-emerald-400 font-mono tracking-tighter leading-none">¥{item.totalInvestment.toLocaleString()}</div>
                                        <div className="space-y-1.5 mt-3">
                                            <div className="text-[10px] text-slate-700 font-black uppercase flex items-center gap-2 tracking-tighter">
                                                <span>货值:</span> 
                                                <span className="text-slate-400 font-mono">¥{((item.costPrice||0)*item.stock).toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-700 font-black uppercase flex items-center gap-2 tracking-tighter">
                                                <span>物流:</span> 
                                                <span className="text-blue-500 font-mono">¥{((item.logistics?.unitFreightCost||0)*(item.unitWeight||1)*item.stock).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-7 align-top text-center bg-white/2">
                                    <div className="flex flex-col items-center gap-2.5">
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-[18px] font-black text-white font-mono tracking-tighter leading-none">{item.stock}</span><span className="text-[10px] text-slate-800 font-black uppercase mb-0.5 tracking-widest">件</span>
                                        </div>
                                        <div className={`text-[9px] font-black px-2.5 py-0.5 rounded-[4px] border w-fit uppercase tracking-tighter ${item.daysRemaining < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>可售: {item.daysRemaining} 天</div>
                                        <div className="w-20 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 mt-1.5 shadow-inner">
                                            <div className={`h-full transition-all duration-1000 ${item.daysRemaining < 10 ? 'bg-rose-600' : 'bg-emerald-600'}`} style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-7 align-top">
                                    <div className="bg-[#0a0a0c] border border-white/10 rounded-xl p-3.5 w-[160px] shadow-2xl group-hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-white/5">
                                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                <Wallet className="w-3.5 h-3.5 text-indigo-500/80" />
                                                <span>单品</span>
                                            </div>
                                            <div className={`text-[14px] font-black font-mono tracking-tighter ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                ${item.profit.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">库存总利</span>
                                            <div className={`text-[14px] font-black font-mono tracking-tighter ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                ${(item.profit * item.stock).toLocaleString(undefined, {maximumFractionDigits:0})}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-7 align-top">
                                    <div className="text-[11px] text-slate-700 line-clamp-3 leading-relaxed font-bold border-l-2 border-white/10 pl-5 uppercase tracking-tighter group-hover:text-slate-400 transition-colors">
                                        {item.notes || '-'}
                                    </div>
                                </td>
                                <td className="px-5 py-7 align-top text-right">
                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button onClick={()=>handleClone(item)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-indigo-400 transition-all shadow-lg" title="克隆协议 (Clone)"><CopyPlus className="w-5 h-5"/></button>
                                        <button onClick={()=>setEditingItem(item)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg" title="配置 (Config)"><Edit2 className="w-5 h-5"/></button>
                                        <button onClick={()=>{ if(confirm('彻底销毁此 SKU 节点协议？')) dispatch({type:'DELETE_PRODUCT', payload:item.id}); }} className="p-2.5 hover:bg-red-500/20 rounded-xl text-red-500 transition-all shadow-lg" title="销毁 (Delete)"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && <EditModal product={editingItem} onClose={()=>setEditingItem(null)} onSave={(p)=>{dispatch({type:'UPDATE_PRODUCT', payload:p}); setEditingItem(null); showToast('数字化协议已存档','success');}} />}
        </div>
    );
};

export default Inventory;
