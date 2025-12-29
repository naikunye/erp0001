
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, Sparkles, Box, Plane, Ship, Info, 
  Image as ImageIcon, TrendingUp, CheckCircle2, Zap, Edit2, Plus, 
  Copy, Trash2, Layers, ChevronRight, Calculator, DollarSign, Clock, Save, X, ExternalLink,
  Target, ShieldAlert, BarChart3, Tag, RotateCcw, Monitor, Truck, ClipboardCheck,
  // Added missing Radar icon import
  Radar
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
    let icon = <Info className="w-3 h-3" />;
    let label = type;
    if (type === 'New' || type === '新品测试') { color = 'bg-blue-900/30 text-blue-400 border-blue-500/30'; icon = <Sparkles className="w-3 h-3" />; label = 'NEW'; }
    else if (type === 'Growing' || type === '爆品增长') { color = 'bg-purple-900/30 text-purple-400 border-purple-500/30'; icon = <TrendingUp className="w-3 h-3" />; label = 'HOT'; }
    else if (type === 'Stable' || type === '稳定热卖') { color = 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'; icon = <CheckCircle2 className="w-3 h-3" />; label = 'Stable'; }
    return <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${color} uppercase tracking-wider`}>{icon}<span>{label}</span></div>;
};

// --- 编辑弹窗：完全物理还原截图中的五大分区与底部利润条 ---
const EditModal: React.FC<{ product: Product, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    const { state } = useTanxing();
    const exchangeRate = state.exchangeRate || 7.2;
    const [formData, setFormData] = useState<Product>({...product});

    const updateField = (field: string, value: any) => setFormData(prev => ({...prev, [field]: value}));
    const updateLogistics = (field: string, value: any) => setFormData(prev => ({...prev, logistics: {...(prev.logistics || {}), [field]: value} as any}));
    const updateEconomics = (field: string, value: any) => setFormData(prev => ({...prev, economics: {...(prev.economics || {}), [field]: value} as any}));

    // 计算逻辑
    const stock = formData.stock || 0;
    const itemsPerBox = formData.itemsPerBox || 1;
    const boxCount = Math.ceil(stock / itemsPerBox);
    const totalVol = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * boxCount;
    const unitWeight = formData.unitWeight || 0.5;
    const billingWeight = (formData.logistics?.unitBillingWeight || unitWeight) * stock;
    
    // 利润分析
    const baseFreight = (formData.logistics?.unitFreightCost || 0) * (formData.logistics?.billingWeight || billingWeight);
    const consumables = (formData.logistics?.consumablesFee || 0) * stock;
    const totalFreight = baseFreight + consumables + (formData.logistics?.customsFee || 0) + (formData.logistics?.portFee || 0);
    const unitFreightUSD = stock > 0 ? (totalFreight / stock) / exchangeRate : 0;
    const unitCostUSD = (formData.costPrice || 0) / exchangeRate;
    
    const price = formData.price || 0;
    const fees = price * ((formData.economics?.platformFeePercent || 0) + (formData.economics?.creatorFeePercent || 0)) / 100;
    const fixed = (formData.economics?.fixedCost || 0) + (formData.economics?.lastLegShipping || 0) + (formData.economics?.adCost || 0);
    const totalUnitCostUSD = unitCostUSD + unitFreightUSD + fees + fixed;
    const profit = price - totalUnitCostUSD;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
            <div className="bg-[#0f1218] w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">编辑: {formData.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">完善参数以获得更准确的智能补货建议</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-3 py-1.5 border border-white/10 rounded text-xs text-slate-400 flex items-center gap-2 transition-all hover:bg-white/5"><Clock className="w-3 h-3"/> 变更历史</button>
                        <button onClick={onClose}><X className="w-6 h-6 text-slate-500 hover:text-white" /></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-[#09090b] space-y-6 custom-scrollbar">
                    {/* 1. 产品与供应链 */}
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">1</span> 产品与供应链 (Product & Gallery)
                        </div>
                        <div className="flex gap-6">
                            <div className="w-24 h-24 bg-black/40 rounded border border-white/10 flex flex-col items-center justify-center relative group">
                                {formData.image ? <img src={formData.image} className="w-full h-full object-cover rounded" /> : <Plus className="w-6 h-6 text-slate-700"/>}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-[8px] text-white italic">CLICK TO UPLOAD...</div>
                            </div>
                            <div className="flex-1 grid grid-cols-4 gap-4">
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">备货日期</label><input type="date" value={formData.lastUpdated?.split('T')[0]} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white" /></div>
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">生命周期阶段</label><select value={formData.lifecycle} onChange={e=>updateField('lifecycle', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none"><option value="Stable">稳定热卖 (Stable)</option><option value="Growing">爆品增长 (Growing)</option><option value="New">新品测试 (New)</option></select></div>
                                <div className="col-span-2"><label className="text-[10px] text-slate-500 block mb-1 font-bold">产品名称</label><input type="text" value={formData.name} onChange={e=>updateField('name', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white" /></div>
                                <div className="col-span-2"><label className="text-[10px] text-slate-500 block mb-1 font-bold">SKU (Multi-Tag)</label><div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-indigo-300"><span>{formData.sku} ×</span><input type="text" className="bg-transparent outline-none flex-1" placeholder="添加更多..." /></div></div>
                                <div><label className="text-[10px] text-amber-500 block mb-1 font-bold">生产+物流总时效</label><div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5"><Clock className="w-3 h-3 text-amber-500"/><input type="number" value={formData.leadTime} onChange={e=>updateField('leadTime', parseInt(e.target.value))} className="bg-transparent text-xs text-amber-400 outline-none w-full font-bold" /></div></div>
                                <div><label className="text-[10px] text-amber-500 block mb-1 font-bold">安全库存天数</label><div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5"><CheckCircle2 className="w-3 h-3 text-amber-500"/><input type="number" value={formData.safetyStockDays} onChange={e=>updateField('safetyStockDays', parseInt(e.target.value))} className="bg-transparent text-xs text-amber-400 outline-none w-full font-bold" /></div></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {/* 2. 采购与供应商 */}
                        <div className="col-span-5 bg-[#18181b] border border-white/5 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                                <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">2</span> 采购与供应商 (CRM)
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-[10px] text-slate-500 block mb-1">供应商名称</label><input type="text" value={formData.supplier} onChange={e=>updateField('supplier', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white" /></div>
                                <div><label className="text-[10px] text-slate-500 block mb-1">联系方式</label><input type="text" value={formData.supplierContact} onChange={e=>updateField('supplierContact', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white" placeholder="微信/Email..." /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">采购单价 (¥/pcs)</label><input type="number" value={formData.costPrice} onChange={e=>updateField('costPrice', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-bold font-mono" /></div>
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">单个实重 (KG)</label><input type="number" value={formData.unitWeight} onChange={e=>updateField('unitWeight', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-bold font-mono" /></div>
                                </div>
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">预估日销 (Daily Sales)</label><div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded px-3 py-2"><BarChart3 className="w-3 h-3 text-slate-500"/><input type="number" value={formData.dailyBurnRate} onChange={e=>updateField('dailyBurnRate', parseFloat(e.target.value))} className="bg-transparent text-xs text-white outline-none w-full font-bold" /></div></div>
                                <div className="text-right"><span className="text-[10px] text-emerald-500 font-black italic uppercase tracking-tighter">可售天数: {formData.dailyBurnRate && formData.dailyBurnRate > 0 ? (stock / formData.dailyBurnRate).toFixed(0) : '0'} 天</span></div>
                            </div>
                        </div>

                        {/* 3. 箱规与入库 */}
                        <div className="col-span-7 bg-[#18181b] border border-white/5 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-bl-lg border-b border-l border-amber-500/20 shadow-lg">{boxCount} 箱 | {totalVol.toFixed(3)} CBM</div>
                            <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                                <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono">3</span> 箱规与入库
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">长 (cm)</label><input type="number" value={formData.dimensions?.l} onChange={e=>updateField('dimensions', {...formData.dimensions, l: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-xs text-amber-200 font-bold" /></div>
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">宽 (cm)</label><input type="number" value={formData.dimensions?.w} onChange={e=>updateField('dimensions', {...formData.dimensions, w: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-xs text-amber-200 font-bold" /></div>
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">高 (cm)</label><input type="number" value={formData.dimensions?.h} onChange={e=>updateField('dimensions', {...formData.dimensions, h: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-xs text-amber-200 font-bold" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><label className="text-[10px] text-slate-600 block mb-1 font-black uppercase">单品实重: {unitWeight} kg</label><div className="text-[9px] text-slate-500 uppercase font-bold italic">单品材积: {(totalVol/boxCount/itemsPerBox).toFixed(2)} kg (÷6000)</div></div>
                                <div><div className="w-full py-2 text-[10px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-center uppercase tracking-widest">理论计费重: {(billingWeight/stock).toFixed(2)} kg</div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-1"><label className="text-[10px] text-amber-500 font-black uppercase mb-1 block">当前库存总数 (Total Stock)</label><input type="number" value={formData.stock} onChange={e=>updateField('stock', parseInt(e.target.value))} className="w-full bg-black/60 border border-amber-500/30 rounded px-4 py-3 text-3xl font-black text-amber-100 font-mono shadow-inner" /></div>
                                <div className="col-span-1"><label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase">备货箱数 (Box - 手动)</label><input type="number" value={boxCount} className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-2xl font-black text-white font-mono opacity-50" readOnly /></div>
                                <div className="col-span-2 mt-2"><label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase">预录入库单号</label><input type="text" value={formData.lingXingId} onChange={e=>updateField('lingXingId', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-xs text-slate-300 font-mono" placeholder="IB11225..." /></div>
                            </div>
                        </div>

                        {/* 4. 头程物流 */}
                        <div className="col-span-7 bg-[#18181b] border border-white/5 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                                <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">4</span> 头程物流 (First Leg)
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2"><button onClick={()=>updateLogistics('method', 'Air')} className={`py-3 text-[11px] font-black rounded border flex items-center justify-center gap-3 transition-all ${formData.logistics?.method === 'Air' ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-black/40 border-white/10 text-slate-500'}`}><Plane className="w-4 h-4"/> 空运 (Air)</button><button onClick={()=>updateLogistics('method', 'Sea')} className={`py-3 text-[11px] font-black rounded border flex items-center justify-center gap-3 transition-all ${formData.logistics?.method === 'Sea' ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-black/40 border-white/10 text-slate-500'}`}><Ship className="w-4 h-4"/> 海运 (Sea)</button></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">承运商 / 船司</label><input type="text" value={formData.logistics?.carrier} onChange={e=>updateLogistics('carrier', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-bold" /></div>
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase">物流追踪号</label><div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded px-3 py-2"><Truck className="w-4 h-4 text-slate-600"/><input type="text" value={formData.logistics?.trackingNo} onChange={e=>updateLogistics('trackingNo', e.target.value)} className="bg-transparent text-sm text-white font-mono outline-none w-full" /></div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">运费单价 (¥/KG)</label><div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded px-3 py-2"><span className="text-slate-600 text-xs font-black">¥</span><input type="number" value={formData.logistics?.unitFreightCost} onChange={e=>updateLogistics('unitFreightCost', parseFloat(e.target.value))} className="bg-transparent text-sm text-white outline-none w-full font-black font-mono" /></div></div>
                                    <div><label className="text-[10px] text-blue-400 block mb-1 font-black uppercase">批次总计费重 (KG)</label><div className="flex items-center gap-2 bg-blue-900/10 border border-blue-500/20 rounded px-3 py-2"><span className="text-[9px] text-blue-500 font-black">TOTAL</span><input type="number" value={formData.logistics?.billingWeight || billingWeight} onChange={e=>updateLogistics('billingWeight', parseFloat(e.target.value))} className="bg-transparent text-sm text-blue-100 outline-none w-full font-black font-mono" /></div></div>
                                </div>
                                <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl shadow-inner relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-3"><span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] italic">全口径预估总投入 (含耗材)</span><span className="text-2xl font-black text-white font-mono">¥ {totalFreight.toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
                                    <div className="grid grid-cols-2 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                        <div>基础运费 (FREIGHT): <span className="text-slate-300 ml-1">¥ {baseFreight.toLocaleString()}</span> <span className="text-[8px] opacity-40 ml-1">({billingWeight.toFixed(1)}kg * ¥{formData.logistics?.unitFreightCost})</span></div>
                                        <div className="text-right">耗材总计 (CONSUMABLES): <span className="text-amber-500 ml-1">¥ {consumables}</span></div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center"><span className="text-[9px] text-slate-700 font-black uppercase italic">逻辑: 基于手动填写的总重参与最终分摊</span> <span className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">单品全分摊: ¥{(totalFreight/stock).toFixed(2)}</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">耗材/贴标费 (¥/pcs)</label><input type="number" value={formData.logistics?.consumablesFee} onChange={e=>updateLogistics('consumablesFee', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-bold font-mono" /></div>
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">报关费 (¥/Total Batch)</label><input type="number" value={formData.logistics?.customsFee} onChange={e=>updateLogistics('customsFee', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-bold font-mono" /></div>
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase">目的仓库</label><input type="text" value={formData.logistics?.targetWarehouse} onChange={e=>updateLogistics('targetWarehouse', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white font-bold" /></div>
                                    <div><label className="text-[10px] text-slate-500 block mb-1 font-bold">单品计费重 (灰字提示)</label><div className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-slate-600 font-black italic">{(billingWeight/stock).toFixed(2)}</div></div>
                                </div>
                            </div>
                        </div>

                        {/* 5. TikTok 销售与竞品 */}
                        <div className="col-span-5 bg-[#18181b] border border-white/5 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                                <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-mono">5</span> TikTok 销售与竞品 (Market Intel)
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-[10px] text-slate-500 block mb-1 font-black uppercase">我方销售价格 ($)</label><input type="number" value={formData.price} onChange={e=>updateField('price', parseFloat(e.target.value))} className="w-full bg-black/60 border border-indigo-900/30 rounded px-5 py-4 text-3xl font-black text-white font-mono shadow-inner" /></div>
                                <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-4">
                                    <div className="flex justify-between mb-3"><span className="text-[10px] text-purple-400 font-black uppercase flex items-center gap-2 tracking-widest"><Radar className="w-4 h-4"/> 竞品监控</span> <span className="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-black shadow-lg">AI 攻防分析</span></div>
                                    <div className="flex gap-2"><input type="text" placeholder="竞品链接/ASIN" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-400 outline-none"/><input type="text" placeholder="$ 0" className="w-14 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-[10px] text-slate-400 text-center outline-none font-bold"/></div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] text-purple-400 block font-black uppercase flex items-center gap-2 tracking-widest italic"><Zap className="w-4 h-4 text-purple-500 fill-current"/> TikTok Cost Structure</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[9px] text-slate-600 block font-bold">平台佣金 (%)</label><input type="number" value={formData.economics?.platformFeePercent} onChange={e=>updateEconomics('platformFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold" /></div>
                                        <div><label className="text-[9px] text-slate-600 block font-bold">达人佣金 (%)</label><input type="number" value={formData.economics?.creatorFeePercent} onChange={e=>updateEconomics('creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold" /></div>
                                        <div className="col-span-2"><label className="text-[9px] text-slate-600 block font-bold">每单固定费 ($)</label><input type="number" value={formData.economics?.fixedCost} onChange={e=>updateEconomics('fixedCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold" /></div>
                                        <div className="col-span-1"><label className="text-[9px] text-slate-600 block font-bold">预估退货率 (%)</label><input type="number" value={formData.economics?.refundRatePercent} onChange={e=>updateEconomics('refundRatePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold" /></div>
                                        <div className="col-span-1"><label className="text-[9px] text-slate-600 block font-bold">尾程派送费 ($)</label><input type="number" value={formData.economics?.lastLegShipping} onChange={e=>updateEconomics('lastLegShipping', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold" /></div>
                                        <div className="col-span-2"><label className="text-[9px] text-slate-600 block font-bold">预估广告费 ($)</label><input type="number" value={formData.economics?.adCost} onChange={e=>updateEconomics('adCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 底部全宽利润测算条：绿色还原 */}
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-[2.5rem] p-8 flex items-center justify-between shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner border border-emerald-500/20"><Calculator className="w-8 h-8"/></div>
                            <div>
                                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">单品利润实时测算 (Unit Profit Analysis)</h4>
                                <div className="flex items-center gap-4 mt-1 text-[11px] text-emerald-500/80 font-black uppercase tracking-tighter">
                                    <span>单品成本(Total Cost): <span className="text-white">${totalUnitCostUSD.toFixed(2)}</span></span>
                                    <div className="w-px h-3 bg-emerald-500/20"></div>
                                    <span>汇率: <span className="text-white">{exchangeRate}</span></span>
                                    <div className="w-px h-3 bg-emerald-500/20"></div>
                                    <span>全口径单项运费: <span className="text-blue-400">¥{(unitFreightUSD * exchangeRate).toFixed(2)}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-16">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">ESTIMATED PROFIT</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${profit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>${profit.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">NET MARGIN</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${margin > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{margin.toFixed(1)}%</div>
                            </div>
                            <div className="text-right border-l border-emerald-500/10 pl-16">
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">TOTAL STOCK PROFIT</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${profit * stock > 0 ? 'text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'text-rose-500'}`}>${(profit * stock).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6"><label className="text-xs font-black text-slate-400 block mb-3 uppercase italic tracking-[0.3em]">备注信息 (Notes)</label><textarea value={formData.notes} onChange={e=>updateField('notes', e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-5 text-sm text-slate-300 outline-none resize-none focus:border-indigo-500 shadow-inner" placeholder="在此记录备货关键节点、供应商承诺时效等细节..."/></div>
                </div>
                
                <div className="p-6 border-t border-white/10 bg-[#18181b] shadow-2xl relative z-10 flex justify-center">
                    <button onClick={()=>onSave(formData)} className="w-full max-w-4xl py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-[0.5em] rounded-2xl shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-indigo-900/40 italic"><Save className="w-6 h-6"/> 保存修改并记录审计日志</button>
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
        showToast(`已复制协议识别码: ${text}`, 'success');
    };

    // --- 物流闪电同步核心逻辑 ---
    const handleSyncToTracking = (item: ReplenishmentItem) => {
        if (!item.logistics?.trackingNo) return showToast('物流单号为空，无法激活链路同步', 'warning');
        
        const existing = (state.shipments || []).find((s: Shipment) => s.trackingNo === item.logistics?.trackingNo);
        if (existing) {
            dispatch({ type: 'UPDATE_SHIPMENT', payload: { ...existing, productName: item.name } });
            showToast('物流追踪节点已在全网矩阵对齐', 'info');
        } else {
            const newShipment: Shipment = {
                id: `SH-${Date.now()}`,
                trackingNo: item.logistics.trackingNo,
                carrier: item.logistics.carrier || 'Global Carrier',
                status: '运输中',
                productName: item.name,
                shipDate: new Date().toISOString().split('T')[0],
                events: [{ date: new Date().toLocaleDateString(), time: '10:00', location: 'Matrix Node', description: '从备货协议同步激活', status: 'Normal' }]
            };
            dispatch({ type: 'ADD_SHIPMENT', payload: newShipment });
            showToast('已在物理链路矩阵部署追踪节点', 'success');
        }
    };

    const replenishmentItems: ReplenishmentItem[] = useMemo(() => {
        return (state.products || []).filter(p => !p.deletedAt).map(p => {
            const stock = p.stock || 0;
            const dailyBurnRate = p.dailyBurnRate || 0;
            const daysRemaining = dailyBurnRate > 0 ? Math.floor(stock / dailyBurnRate) : 999;
            
            // 计算逻辑对齐
            const unitRealWeight = p.unitWeight || 0.5;
            const billingWeight = (p.logistics?.unitBillingWeight || unitRealWeight) * stock;
            const totalFreight = ((p.logistics?.unitFreightCost || 0) * (p.logistics?.billingWeight || billingWeight)) + ((p.logistics?.consumablesFee || 0) * stock);
            const unitFreightUSD = stock > 0 ? (totalFreight / stock) / exchangeRate : 0;
            const unitCogsUSD = (p.costPrice || 0) / exchangeRate;
            const fees = (p.price || 0) * ((p.economics?.platformFeePercent || 0) + (p.economics?.creatorFeePercent || 0)) / 100;
            const fixed = (p.economics?.fixedCost || 0) + (p.economics?.lastLegShipping || 0) + (p.economics?.adCost || 0);
            
            const unitProfit = (p.price || 0) - (unitCogsUSD + unitFreightUSD + fees + fixed);

            return {
                ...p, dailyBurnRate, daysRemaining, profit: unitProfit, margin: (p.price || 0) > 0 ? (unitProfit / p.price) * 100 : 0,
                totalInvestment: stock * (p.costPrice || 0),
                liveTrackingStatus: (state.shipments || []).find((s: Shipment) => s.trackingNo === p.logistics?.trackingNo)?.status || '待处理'
            } as ReplenishmentItem;
        });
    }, [state.products, state.shipments, exchangeRate]);

    const stats = useMemo(() => {
        const activeItems = replenishmentItems.filter(i => i.stock > 0);
        const totalInvestment = activeItems.reduce((acc, i) => acc + i.totalInvestment, 0);
        const totalProfit = activeItems.reduce((acc, i) => acc + (i.stock * i.profit), 0);
        return { count: replenishmentItems.length, investment: totalInvestment, profit: totalProfit };
    }, [replenishmentItems]);

    const filteredItems = replenishmentItems.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="ios-glass-panel rounded-2xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/30 font-sans">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/2 backdrop-blur-3xl z-20">
                <div>
                    <h2 className="text-white font-black text-2xl flex items-center gap-4 uppercase italic tracking-tighter"> 
                        <PackageCheck className="w-8 h-8 text-indigo-500" /> 智能备货清单 (Replenishment Matrix) 
                    </h2>
                    <div className="text-[11px] text-slate-500 mt-2 flex gap-6 font-black uppercase tracking-[0.2em]">
                        <span>SKU 节点总计: <span className="text-white">{stats.count}</span></span>
                        <div className="w-px h-3 bg-white/10 self-center"></div>
                        <span>资金占用: <span className="text-emerald-400">¥ {stats.investment.toLocaleString()}</span></span>
                        <div className="w-px h-3 bg-white/10 self-center"></div>
                        <span>预期净利 (Projected): <span className="text-indigo-400">$ {stats.profit.toLocaleString(undefined, {maximumFractionDigits:0})}</span></span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="relative group"> 
                        <Search className="w-5 h-5 text-slate-600 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" /> 
                        <input type="text" placeholder="检索 SKU 协议识别码..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-96 pl-12 pr-6 py-3.5 bg-black/60 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold italic placeholder-slate-700 shadow-inner" /> 
                    </div>
                    <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 italic"> <Plus className="w-5 h-5"/> 添加 SKU 节点 </button>
                    <button className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"><Download className="w-6 h-6" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                    <thead className="bg-[#050508] sticky top-0 z-10 border-b border-white/10 backdrop-blur-md">
                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            <th className="px-6 py-6 w-14"><input type="checkbox" className="rounded-md bg-black/60 border-white/20 text-indigo-600 focus:ring-indigo-500"/></th>
                            <th className="px-6 py-6 w-60 italic">SKU 识别码 / 生命周期</th>
                            <th className="px-6 py-6 italic">产品信息 / 供应商资产</th>
                            <th className="px-6 py-6 w-64 italic">物流全球追踪 (TRACKING)</th>
                            <th className="px-6 py-6 w-44 italic">全口径资金投入</th>
                            <th className="px-6 py-6 w-48 italic">物理库存水位</th>
                            <th className="px-6 py-6 w-48 italic">经营效益穿透</th>
                            <th className="px-6 py-6 w-56 italic">运营战术备注</th>
                            <th className="px-6 py-6 w-28 text-right italic">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans bg-black/10">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-indigo-600/5 transition-all group border-l-2 border-l-transparent hover:border-l-indigo-500">
                                <td className="px-6 py-7 align-top"><input type="checkbox" className="rounded-md bg-black/60 border-white/20 text-indigo-600"/></td>
                                <td className="px-6 py-7 align-top">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-4 relative">
                                            <div className={`w-2.5 h-2.5 rounded-full ${item.daysRemaining < 10 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`}></div>
                                            <span className="text-2xl font-black text-white font-mono tracking-tighter uppercase italic cursor-pointer hover:text-indigo-400 transition-colors" onClick={()=>copyToClipboard(item.sku)}>{item.sku}</span>
                                            <button onClick={()=>copyToClipboard(item.sku)} className="opacity-0 group-hover:opacity-40 transition-opacity"><Copy className="w-4 h-4 text-white"/></button>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-6 py-7 align-top">
                                    <div className="flex gap-5">
                                        <div className="w-16 h-16 bg-white/5 rounded-[1.2rem] border border-white/10 shrink-0 overflow-hidden shadow-inner group/img ring-2 ring-transparent group-hover/img:ring-indigo-500/30 transition-all">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" /> : <ImageIcon className="w-8 h-8 text-slate-800 m-auto mt-4"/>}
                                        </div>
                                        <div className="flex flex-col gap-2 min-w-0">
                                            <div className="text-[15px] font-black text-slate-100 truncate max-w-[200px] italic">{item.name}</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-widest"><Monitor className="w-3.5 h-3.5 text-slate-700"/> {item.supplier || '老罗供应商'}</div>
                                            {item.lingXingId && <div className="text-[10px] bg-blue-600/10 text-blue-400 px-3 py-1 rounded-xl border border-blue-500/20 font-mono w-fit font-black uppercase tracking-tight flex items-center gap-2">LX: {item.lingXingId} <Copy className="w-3 h-3 opacity-30 cursor-pointer hover:opacity-100" onClick={()=>copyToClipboard(item.lingXingId!)}/></div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-7 align-top">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-[11px] text-blue-400 font-black uppercase italic tracking-widest">
                                            {item.logistics?.method === 'Sea' ? <Ship className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                                            <span>{item.logistics?.method || 'Air'} Freight</span>
                                        </div>
                                        <div className={`text-[10px] px-3 py-1 rounded-full border-2 font-black uppercase w-fit tracking-[0.1em] ${item.liveTrackingStatus === '运输中' ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' : 'bg-slate-800/40 text-slate-500 border-white/5'}`}>{item.liveTrackingStatus}</div>
                                        <div className="flex items-center gap-3">
                                            <a href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono block truncate max-w-[140px] font-black italic tracking-tighter transition-all">
                                                {item.logistics?.trackingNo || 'AWAITING_ID'}
                                            </a>
                                            {/* 闪电图标：功能复归 */}
                                            <button onClick={()=>handleSyncToTracking(item)} title="同步协议至物理追踪矩阵" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xl shadow-indigo-900/40 transition-all active:scale-90"><Zap className="w-3.5 h-3.5 fill-current"/></button>
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">计费净重: <span className="text-slate-400">{(item.unitWeight! * item.stock).toFixed(1)}kg</span> / {Math.ceil(item.stock/(item.itemsPerBox||1))}box</div>
                                    </div>
                                </td>
                                <td className="px-6 py-7 align-top">
                                    <div className="flex flex-col gap-3">
                                        <div className="text-2xl font-black text-emerald-400 font-mono tracking-tighter italic drop-shadow-[0_0_10px_rgba(16,185,129,0.1)]">¥ {item.totalInvestment.toLocaleString(undefined, {minimumFractionDigits:0})}</div>
                                        <div className="space-y-1 bg-white/2 p-2 rounded-xl border border-white/5">
                                            <div className="text-[10px] text-slate-600 font-black uppercase flex justify-between"><span>货值权益:</span> <span className="text-slate-400">¥{((item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                            <div className="text-[10px] text-slate-600 font-black uppercase flex justify-between"><span>物流全口径:</span> <span className="text-blue-500">¥{((item.logistics?.unitFreightCost||0)*(item.unitWeight||1)*item.stock).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-7 align-top">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-end gap-2">
                                            <span className="text-4xl font-black text-white font-mono tracking-tighter">{item.stock}</span><span className="text-xs text-slate-600 font-black uppercase mb-2">PCS</span>
                                        </div>
                                        <div className={`text-[11px] font-black px-3 py-1 rounded-xl border-2 w-fit uppercase tracking-widest ${item.daysRemaining < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>可售: {item.daysRemaining} 天</div>
                                        <div className="w-36 h-2 bg-slate-800/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <div className={`h-full transition-all duration-1000 ${item.daysRemaining < 10 ? 'bg-rose-600' : 'bg-emerald-600'}`} style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-7 align-top">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-[#0a0a0c] p-3 rounded-2xl border border-white/10 shadow-inner group-hover:border-indigo-500/30 transition-all">
                                            <div className="text-[10px] text-slate-600 font-black uppercase italic">单品净利</div>
                                            <div className={`text-lg font-black font-mono tracking-tighter ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${item.profit.toFixed(2)}</div>
                                        </div>
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[11px] text-slate-700 font-black uppercase tracking-[0.2em] italic">库存总利预期</span>
                                            <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter drop-shadow-md">${(item.profit * item.stock).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-indigo-600 shadow-[0_0_15px_#6366f1] transition-all" style={{width: `${Math.min(100, item.margin)}%`}}></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-7 align-top">
                                    <div className="text-xs text-slate-500 line-clamp-4 leading-relaxed font-bold italic border-l-2 border-white/5 pl-4 py-1 group-hover:border-indigo-500/50 transition-all">
                                        {item.notes || '12.29发货 - 等待物流反馈中...'}
                                    </div>
                                </td>
                                <td className="px-6 py-7 align-top text-right">
                                    <div className="flex gap-2 justify-end opacity-20 group-hover:opacity-100 transition-all">
                                        <button onClick={()=>copyToClipboard(item.sku)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white" title="复制识别码"><Copy className="w-5 h-5"/></button>
                                        <button onClick={()=>setEditingItem(item)} className="p-3 hover:bg-indigo-600/20 rounded-2xl transition-all text-indigo-400" title="进入深度编辑"><Edit2 className="w-5 h-5"/></button>
                                        <button onClick={()=>{ if(confirm('物理销毁 SKU 节点？该操作不可逆。')) dispatch({type:'DELETE_PRODUCT', payload:item.id}); showToast('资产节点已离场', 'info'); }} className="p-3 hover:bg-red-500/20 rounded-2xl transition-all text-red-500" title="销毁节点"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && <EditModal product={editingItem} onClose={()=>setEditingItem(null)} onSave={(p)=>{dispatch({type:'UPDATE_PRODUCT', payload:p}); setEditingItem(null); showToast('数字化协议已固化', 'success');}} />}
        </div>
    );
};

export default Inventory;
