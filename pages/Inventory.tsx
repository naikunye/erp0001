
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, Sparkles, Box, Plane, Ship, 
  Image as ImageIcon, TrendingUp, CheckCircle2, Zap, Edit2, Plus, 
  Copy, Trash2, X, LayoutPanelLeft, Monitor, Wallet, FileText,
  CopyPlus, Clock, User, BarChart3, Ruler, Scale, Truck, Target,
  Calculator, Info, Save, History as HistoryIcon, 
  Globe, Package, AlertTriangle, Link as LinkIcon
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

const EditModal: React.FC<{ product: Product, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    // Fixed: Destructured showToast from useTanxing context to resolve missing name error on line 134.
    const { state, showToast } = useTanxing();
    const exchangeRate = state.exchangeRate || 7.2;
    const [formData, setFormData] = useState<Product>({
        ...product,
        dimensions: product.dimensions || { l: 40, w: 30, h: 5 },
        itemsPerBox: product.itemsPerBox || 50,
        logistics: product.logistics || { method: 'Air', carrier: 'DHL', trackingNo: 'HK-882910', unitFreightCost: 2.5, targetWarehouse: 'US-WEST-01' },
        economics: product.economics || { platformFeePercent: 5, creatorFeePercent: 10, fixedCost: 0.5, lastLegShipping: 3.5, adCost: 2.0, refundRatePercent: 3 }
    });

    const updateField = (field: string, value: any) => setFormData(prev => ({...prev, [field]: value}));
    const updateLogistics = (field: string, value: any) => setFormData(prev => ({...prev, logistics: {...prev.logistics!, [field]: value}}));
    const updateEconomics = (field: string, value: any) => setFormData(prev => ({...prev, economics: {...prev.economics!, [field]: value}}));
    const updateDims = (field: string, value: any) => setFormData(prev => ({...prev, dimensions: {...prev.dimensions!, [field]: value}}));

    // 核心计算逻辑：对齐参考图中的自动化公式
    const totalBoxes = Math.ceil(formData.stock / (formData.itemsPerBox || 1));
    const totalVolume = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * totalBoxes;
    const volWeight = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0)) / 6000;
    const theoryWeight = Math.max(formData.unitWeight || 0, volWeight);
    const billingWeight = theoryWeight * formData.stock;
    const totalFreight = (formData.logistics?.unitFreightCost || 0) * billingWeight + (formData.logistics?.consumablesFee || 0);
    
    // 穿透利润逻辑
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md bg-black/95">
            <div className="bg-[#0c0c0e] w-full max-w-[1200px] h-[95vh] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* 头部还原: 1:1 对齐参考图1 */}
                <div className="px-10 py-7 border-b border-white/5 flex justify-between items-center bg-[#141416]">
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">编辑: {formData.name}</h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.3em]">完善参数以获得更准确的智能补货建议</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all">
                            <HistoryIcon className="w-4 h-4"/> 变更历史
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-red-500/20 rounded-full text-slate-600 hover:text-red-500 transition-all">
                            <X className="w-10 h-10" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,#111116,transparent)]">
                    {/* 模块 1: 产品与供应链 (Product & Gallery) */}
                    <section className="bg-[#18181b] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8 text-indigo-400 text-xs font-black uppercase tracking-[0.4em]">
                            <span className="bg-indigo-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-mono shadow-lg shadow-indigo-900/40">1</span>
                            产品与供应链 (Product & Gallery)
                        </div>
                        <div className="flex gap-10">
                            <div className="space-y-4">
                                {/* 放大比例的缩略图区域 */}
                                <div className="w-40 h-40 bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-700 hover:border-indigo-500/40 cursor-pointer transition-all relative group">
                                    {formData.image ? <img src={formData.image} className="w-full h-full object-cover rounded-[1.8rem]" /> : <ImageIcon className="w-10 h-10 mb-2" />}
                                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.8rem] flex items-center justify-center"><Plus className="text-indigo-400 w-10 h-10"/></div>
                                    <span className="absolute bottom-4 text-[9px] font-black uppercase opacity-40">画廊 (0)</span>
                                </div>
                                <div className="relative">
                                    <LinkIcon className="w-4 h-4 absolute left-4 top-3.5 text-slate-600" />
                                    <input type="text" placeholder="URL..." className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[10px] text-slate-400 focus:border-indigo-500 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-1">备货日期</label>
                                    <input type="date" value={formData.lastUpdated} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white text-sm outline-none focus:border-indigo-500 transition-all font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-1">生命周期阶段</label>
                                    <select value={formData.lifecycle} onChange={e=>updateField('lifecycle', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white text-sm outline-none appearance-none cursor-pointer focus:border-indigo-500 transition-all">
                                        <option value="Growing">🚀 爆品增长 (Growing)</option>
                                        <option value="New">💎 新品测试 (New)</option>
                                        <option value="Stable">✅ 稳定热卖 (Stable)</option>
                                        <option value="Clearance">📉 清仓处理 (Clear)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-1">产品名称</label>
                                    <input value={formData.name} onChange={e=>updateField('name', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white text-sm font-black outline-none focus:border-indigo-500 transition-all" />
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-1">SKU (Multi-Tag)</label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-black border border-white/10 rounded-[1.2rem] min-h-[56px]">
                                        <span className="bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-[11px] font-black uppercase font-mono flex items-center gap-2">
                                            {formData.sku} <X className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={()=>showToast('主 SKU 不可删除', 'warning')}/>
                                        </span>
                                        <input placeholder="添加更多..." className="bg-transparent border-none outline-none text-xs text-slate-500 flex-1 px-2" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest ml-1">生产+物流总时效</label>
                                    <div className="relative">
                                        <Clock className="w-5 h-5 absolute left-4 top-4 text-amber-500" />
                                        <input type="number" value={formData.leadTime} onChange={e=>updateField('leadTime', parseInt(e.target.value))} className="w-full bg-amber-600/5 border border-amber-500/30 rounded-[1.2rem] pl-12 pr-4 py-4 text-amber-400 font-mono font-black text-lg outline-none focus:border-amber-500 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest ml-1">安全库存天数</label>
                                    <div className="relative">
                                        <CheckCircle2 className="w-5 h-5 absolute left-4 top-4 text-amber-500" />
                                        <input type="number" value={formData.safetyStockDays} onChange={e=>updateField('safetyStockDays', parseInt(e.target.value))} className="w-full bg-amber-600/5 border border-amber-500/30 rounded-[1.2rem] pl-12 pr-4 py-4 text-amber-400 font-mono font-black text-lg outline-none focus:border-amber-500 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-12 gap-10">
                        {/* 模块 2: 采购与供应商 (CRM) - 占据 5/12 宽度 */}
                        <div className="col-span-5 bg-[#18181b] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                            <div className="flex items-center gap-4 mb-8 text-blue-400 text-xs font-black uppercase tracking-[0.4em]">
                                <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-mono shadow-lg shadow-blue-900/40">2</span>
                                采购与供应商 (CRM)
                            </div>
                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">供应商名称</label>
                                    <div className="relative">
                                        <User className="w-5 h-5 absolute left-4 top-4 text-slate-500" />
                                        <input value={formData.supplier} onChange={e=>updateField('supplier', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">联系方式</label>
                                    <input value={formData.supplierContact} onChange={e=>updateField('supplierContact', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white text-sm outline-none focus:border-blue-500 transition-all" placeholder="微信: gz_garment / WhatsApp..." />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">采购单价 (¥/pcs)</label>
                                        <input type="number" value={formData.costPrice} onChange={e=>updateField('costPrice', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white font-mono font-black text-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">单个实重 (KG)</label>
                                        <input type="number" value={formData.unitWeight} onChange={e=>updateField('unitWeight', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white font-mono font-black text-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">预估日销 (Daily Sales)</label>
                                    <div className="relative">
                                        <BarChart3 className="w-5 h-5 absolute left-4 top-4 text-slate-500" />
                                        <input type="number" value={formData.dailyBurnRate} onChange={e=>updateField('dailyBurnRate', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] pl-12 pr-4 py-4 text-white font-mono font-black text-xl" />
                                    </div>
                                    <div className="text-right pr-2"><span className="text-[11px] text-emerald-500 font-black uppercase italic tracking-tighter">可售天数: {formData.dailyBurnRate && formData.dailyBurnRate > 0 ? Math.floor(formData.stock / formData.dailyBurnRate) : '---'} 天</span></div>
                                </div>
                            </div>
                        </div>

                        {/* 模块 3: 箱规与入库 - 占据 7/12 宽度 */}
                        <div className="col-span-7 bg-[#18181b] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                            {/* 1:1 还原右上角金色汇总挂带 */}
                            <div className="absolute top-0 right-0 px-8 py-3 bg-amber-600/20 text-amber-500 text-[12px] font-black uppercase border-b border-l border-amber-900/30 rounded-bl-[1.5rem] shadow-xl">
                                {totalBoxes} 箱 | {totalVolume.toFixed(3)} CBM
                            </div>
                            <div className="flex items-center gap-4 mb-10 text-amber-400 text-xs font-black uppercase tracking-[0.4em]">
                                <span className="bg-amber-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-mono shadow-lg shadow-amber-900/40">3</span>
                                箱规与入库
                            </div>
                            <div className="grid grid-cols-3 gap-8 mb-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">长 (cm)</label>
                                    <input type="number" value={formData.dimensions?.l} onChange={e=>updateDims('l', parseFloat(e.target.value))} className="w-full bg-black border border-amber-900/20 rounded-[1.2rem] px-5 py-4 text-white font-mono font-black text-xl outline-none focus:border-amber-500 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">宽 (cm)</label>
                                    <input type="number" value={formData.dimensions?.w} onChange={e=>updateDims('w', parseFloat(e.target.value))} className="w-full bg-black border border-amber-900/20 rounded-[1.2rem] px-5 py-4 text-white font-mono font-black text-xl outline-none focus:border-amber-500 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">高 (cm)</label>
                                    <input type="number" value={formData.dimensions?.h} onChange={e=>updateDims('h', parseFloat(e.target.value))} className="w-full bg-black border border-amber-900/20 rounded-[1.2rem] px-5 py-4 text-white font-mono font-black text-xl outline-none focus:border-amber-500 transition-all shadow-inner" />
                                </div>
                            </div>
                            {/* 1:1 还原计算重提示行 */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-black uppercase tracking-tighter mb-10 px-4 border-b border-white/5 pb-6">
                                <span>单品实重: <span className="text-slate-300 ml-1">{formData.unitWeight} kg</span></span>
                                <span>单品体积重: <span className="text-slate-300 ml-1">{(volWeight).toFixed(2)} kg (÷6000)</span></span>
                                <span className="bg-amber-600/15 text-amber-500 px-4 py-1.5 rounded-xl border border-amber-500/20 shadow-lg italic">理论计费重: {theoryWeight.toFixed(2)} kg</span>
                            </div>
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">当前库存 (总件数)</label>
                                    <input type="number" value={formData.stock} onChange={e=>updateField('stock', parseInt(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-6 py-5 text-4xl font-black text-white font-mono outline-none shadow-2xl focus:border-amber-500 transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">备货箱数 (Box - 手动)</label>
                                    <input type="number" placeholder="0" className="w-full bg-black/40 border border-amber-900/20 rounded-[1.2rem] px-6 py-5 text-4xl font-black text-amber-500/60 font-mono outline-none" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] text-slate-600 font-black uppercase ml-1">预录入库单号</label>
                                <input value={formData.lingXingId} onChange={e=>updateField('lingXingId', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-6 py-4 text-indigo-400 font-mono font-black uppercase tracking-wider text-lg" placeholder="IB-882190..." />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-10">
                        {/* 模块 4: 头程物流 - 占据 7/12 宽度 */}
                        <div className="col-span-7 bg-[#18181b] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                            <div className="flex items-center gap-4 mb-8 text-indigo-400 text-xs font-black uppercase tracking-[0.4em]">
                                <span className="bg-indigo-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-mono shadow-lg shadow-indigo-900/40">4</span>
                                头程物流 (First Leg)
                            </div>
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4 p-2 bg-black rounded-[1.5rem] border border-white/5 shadow-inner">
                                    <button onClick={()=>updateLogistics('method', 'Air')} className={`py-4 rounded-[1rem] text-[11px] font-black uppercase flex items-center justify-center gap-3 transition-all ${formData.logistics?.method === 'Air' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-600 hover:text-slate-300'}`}>
                                        <Plane className="w-5 h-5"/> 空运 (Air)
                                    </button>
                                    <button onClick={()=>updateLogistics('method', 'Sea')} className={`py-4 rounded-[1rem] text-[11px] font-black uppercase flex items-center justify-center gap-3 transition-all ${formData.logistics?.method === 'Sea' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-600 hover:text-slate-300'}`}>
                                        <Ship className="w-5 h-5"/> 海运 (Sea)
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">承运商 / 船司</label>
                                        <input value={formData.logistics?.carrier} onChange={e=>updateLogistics('carrier', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white text-sm outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">物流追踪号</label>
                                        <div className="relative">
                                            <Truck className="w-5 h-5 absolute left-4 top-4 text-slate-600" />
                                            <input value={formData.logistics?.trackingNo} onChange={e=>updateLogistics('trackingNo', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] pl-12 pr-4 py-4 text-indigo-400 font-mono font-black uppercase outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">运费单价 (¥/KG)</label>
                                        <div className="flex gap-4">
                                            <div className="flex items-center justify-center w-12 bg-black border border-white/10 rounded-[1rem] text-slate-600 text-sm font-black font-mono">¥</div>
                                            <input type="number" value={formData.logistics?.unitFreightCost} onChange={e=>updateLogistics('unitFreightCost', parseFloat(e.target.value))} className="flex-1 bg-black border border-white/10 rounded-[1.2rem] px-6 py-4 text-white font-mono font-black text-2xl outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-blue-500 font-black uppercase tracking-widest ml-1">批次总计费重 (KG)</label>
                                        <div className="flex gap-3">
                                            <button className="px-4 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-[1rem] text-[10px] font-black uppercase">TOTAL</button>
                                            <input type="number" readOnly value={billingWeight.toFixed(1)} className="flex-1 bg-black border border-indigo-900/20 rounded-[1.2rem] px-5 py-4 text-white font-mono font-black text-2xl opacity-60" />
                                        </div>
                                        <div className="text-right text-[10px] text-slate-700 font-black uppercase tracking-widest mt-1 italic">Auto Calc: {billingWeight.toFixed(1)}kg</div>
                                    </div>
                                </div>

                                {/* 1:1 还原大型全口径汇总展示卡 */}
                                <div className="bg-[#121218] border border-indigo-500/20 rounded-[2rem] p-7 shadow-2xl relative">
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="text-[12px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-3">
                                            全口径预估总投入 (含耗材)
                                            <Info className="w-4 h-4 opacity-50 cursor-help" />
                                        </div>
                                        <div className="text-5xl font-black text-white font-mono tracking-tighter">¥ {totalFreight.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-12 text-[11px] font-black border-t border-white/5 pt-7 uppercase">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between text-blue-500">基础运费 (FREIGHT) <span className="text-white font-mono">¥ {((formData.logistics?.unitFreightCost||0)*billingWeight).toLocaleString()}</span></div>
                                            <div className="text-slate-600 italic tracking-tighter text-[9px] leading-relaxed">基于系统推算的计费重参与最终分摊</div>
                                        </div>
                                        <div className="flex flex-col gap-3 text-right">
                                            <div className="flex justify-between justify-end gap-5 text-amber-500">耗材总计 (CONSUMABLES) <span className="text-white font-mono">¥ {formData.logistics?.consumablesFee || 0}</span></div>
                                            <div className="text-slate-600 italic tracking-tighter text-[10px]">单品全分摊: ¥{(totalFreight / formData.stock).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">耗材/贴标费 (¥/pcs)</label>
                                        <input type="number" value={formData.logistics?.consumablesFee} onChange={e=>updateLogistics('consumablesFee', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white font-mono font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">报关费 (¥/Total Batch)</label>
                                        <input type="number" value={formData.logistics?.customsFee} onChange={e=>updateLogistics('customsFee', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white font-mono font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">目的仓库</label>
                                        <input value={formData.logistics?.targetWarehouse} onChange={e=>updateLogistics('targetWarehouse', e.target.value)} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-5 py-4 text-white uppercase font-black italic tracking-widest text-sm" placeholder="US-WEST-01" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-600 font-black uppercase ml-1">单品计费重 (灰字提示)</label>
                                        <input readOnly value={(billingWeight / formData.stock).toFixed(2)} className="w-full bg-black/40 border border-white/10 rounded-[1.2rem] px-5 py-4 text-slate-600 font-mono font-black italic text-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 模块 5: TikTok 销售与竞品 - 占据 5/12 宽度 */}
                        <div className="col-span-5 bg-[#18181b] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                            <div className="flex items-center gap-4 mb-8 text-purple-400 text-xs font-black uppercase tracking-[0.4em]">
                                <span className="bg-purple-600 text-white w-6 h-6 rounded flex items-center justify-center text-[11px] font-mono shadow-lg shadow-purple-900/40">5</span>
                                TikTok 销售与竞品 (Market Intel)
                            </div>
                            <div className="space-y-8 flex-1">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-1">我方销售价格 ($)</label>
                                    <input type="number" value={formData.price} onChange={e=>updateField('price', parseFloat(e.target.value))} className="w-full bg-black border border-purple-900/20 rounded-[1.8rem] px-8 py-7 text-5xl font-black text-white font-mono outline-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] focus:border-purple-500 transition-all" />
                                </div>
                                <div className="bg-[#1a0f20]/40 border border-purple-500/20 rounded-[2rem] p-7 space-y-5 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-purple-400 font-black uppercase flex items-center gap-3 tracking-widest"><Target className="w-5 h-5"/> 竞品监控</span>
                                        <span className="bg-purple-600 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase shadow-lg shadow-purple-900/40">AI 攻防分析</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <input placeholder="竞品链接/ASIN" className="flex-1 bg-black border border-white/5 rounded-[1.2rem] px-5 py-3 text-xs text-slate-400 outline-none focus:border-purple-500" />
                                        <div className="bg-black border border-white/5 rounded-[1.2rem] px-6 py-3 text-sm text-slate-600 font-mono font-black flex items-center justify-center">$ 0</div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[12px] text-purple-400 font-black uppercase tracking-[0.3em] flex items-center gap-3 italic mb-2">
                                        <Zap className="w-5 h-5 fill-current" /> TikTok Cost Structure
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">平台佣金 (%)</label>
                                            <input type="number" value={formData.economics?.platformFeePercent} onChange={e=>updateEconomics('platformFeePercent', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1rem] px-5 py-4 text-white font-mono font-black text-lg outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">达人佣金 (%)</label>
                                            <input type="number" value={formData.economics?.creatorFeePercent} onChange={e=>updateEconomics('creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1rem] px-5 py-4 text-white font-mono font-black text-lg outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">每单固定费 ($)</label>
                                            <input type="number" value={formData.economics?.fixedCost} onChange={e=>updateEconomics('fixedCost', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-6 py-4 text-white font-mono font-black text-xl outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">预估退货率 (%)</label>
                                            <input type="number" value={formData.economics?.refundRatePercent} onChange={e=>updateEconomics('refundRatePercent', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1rem] px-5 py-4 text-white font-mono font-black text-lg" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">尾程派送费 ($)</label>
                                            <input type="number" value={formData.economics?.lastLegShipping} onChange={e=>updateEconomics('lastLegShipping', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1rem] px-5 py-4 text-white font-mono font-black text-lg" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">预估广告费 ($)</label>
                                            <input type="number" value={formData.economics?.adCost} onChange={e=>updateEconomics('adCost', parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-[1.2rem] px-6 py-4 text-white font-mono font-black text-xl outline-none focus:border-purple-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 模块 6: 利润穿透条 - 1:1 还原参考图3底部的深绿色测算条 */}
                    <div className="bg-[#0c1e18] border border-emerald-500/20 rounded-[2.5rem] p-10 flex flex-col lg:flex-row items-center justify-between shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#10b98111,transparent)] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"></div>
                        <div className="flex items-center gap-10 relative z-10">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-2xl">
                                <Calculator className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black text-emerald-400 italic tracking-tighter uppercase">单品利润实时测算 (Unit Profit Analysis)</h4>
                                <div className="flex gap-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <span>单品总成本(Total Cost): <span className="text-white font-mono ml-1">${(priceUSD - unitProfitUSD).toFixed(2)}</span></span>
                                    <span>汇率: <span className="text-white font-mono ml-1">{exchangeRate}</span></span>
                                    <span>全口径单摊运费: <span className="text-blue-500 font-mono ml-1">¥{(totalFreight / formData.stock).toFixed(2)}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-20 relative z-10 mt-8 lg:mt-0">
                            <div className="text-right">
                                <div className="text-[11px] text-slate-500 font-black uppercase mb-1 tracking-widest opacity-60">Estimated Profit</div>
                                <div className={`text-6xl font-black font-mono tracking-tighter ${unitProfitUSD > 0 ? 'text-emerald-400' : 'text-rose-500'} drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]`}>${unitProfitUSD.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[11px] text-slate-500 font-black uppercase mb-1 tracking-widest opacity-60">Net Margin</div>
                                <div className={`text-6xl font-black font-mono tracking-tighter ${margin > 20 ? 'text-emerald-400' : 'text-orange-500'}`}>{margin.toFixed(1)}%</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[11px] text-slate-500 font-black uppercase mb-1 tracking-widest opacity-60">Total Stock Profit</div>
                                <div className="text-6xl font-black text-emerald-400 font-mono tracking-tighter shadow-emerald-500/10">${(unitProfitUSD * formData.stock).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                            </div>
                        </div>
                    </div>

                    {/* 模块 7: 备注 - 1:1 参考图3 */}
                    <div className="bg-[#18181b]/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <h4 className="text-[12px] text-slate-600 font-black uppercase tracking-[0.4em] flex items-center gap-3 italic">备注信息 (Notes)</h4>
                        <textarea 
                            value={formData.notes || ''} 
                            onChange={e=>updateField('notes', e.target.value)}
                            className="w-full h-40 bg-black/60 border border-white/5 rounded-[2rem] p-8 text-sm text-slate-400 outline-none focus:border-indigo-500 shadow-inner transition-all leading-relaxed"
                            placeholder="填写备货注意事项、产品细节说明等..."
                        />
                    </div>
                </div>

                {/* 底部保存条 - 1:1 还原参考图3最底部的巨大按钮 */}
                <div className="px-10 py-10 border-t border-white/5 bg-[#141416] shrink-0">
                    <button 
                        onClick={()=>onSave(formData)} 
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-[0.5em] rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-5 active:scale-[0.98] active:brightness-90 group"
                    >
                        <Save className="w-7 h-7 group-hover:scale-110 transition-transform"/> 保存修改并记录日志
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
            
            // 此处逻辑与面板内部测算逻辑保持对齐
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
