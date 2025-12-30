
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
    if (label === 'NEW') color = 'bg-indigo-900/40 text-indigo-400 border-indigo-500/30';
    else if (label === 'HOT') color = 'bg-purple-900/40 text-purple-300 border-purple-500/30';
    else if (label === 'CLEAR') color = 'bg-rose-900/40 text-rose-300 border-rose-500/30';
    else color = 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30';
    return <div className={`flex items-center justify-center px-2 py-0.5 rounded-[2px] text-[9px] font-black border ${color} uppercase tracking-widest w-full mt-1`}>
        <span>{label}</span>
    </div>;
};

// --- 精密编辑面板 ---
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
            <div className="bg-[#0a0a0c] w-full max-w-[960px] h-[94vh] rounded-[1.5rem] shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#18181b]">
                    <div>
                        <h3 className="text-base font-black text-white uppercase flex items-center gap-2">编辑协议: <span className="text-indigo-400 italic">{formData.sku}</span></h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded text-[10px] text-slate-400 hover:text-white bg-white/2 font-bold uppercase"><HistoryIcon className="w-3 h-3"/> 变更历史</button>
                        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-all"><X className="w-7 h-7"/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#09090b]">
                    <section className="bg-[#18181b] border border-white/5 rounded-xl p-4 shadow-xl">
                        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                            <span className="bg-indigo-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black shadow-lg">1</span>
                            <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest italic">产品与供应链 (Product & Gallery)</span>
                        </div>
                        <div className="flex gap-5">
                            <div className="w-20 h-20 bg-black/40 rounded-lg border border-white/10 flex flex-col items-center justify-center text-slate-600 shrink-0">
                                {formData.image ? <img src={formData.image} className="w-full h-full object-cover rounded-lg" /> : <Plus className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-3">
                                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">备货日期</label><input type="date" value={formData.lastUpdated} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none" /></div>
                                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">生命周期阶段</label><select value={formData.lifecycle} onChange={e=>updateField('lifecycle', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white outline-none font-bold"><option value="Growing">爆品增长 (Growing)</option><option value="New">新品测试 (New)</option><option value="Stable">稳定热卖 (Stable)</option></select></div>
                                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">产品名称</label><input value={formData.name} onChange={e=>updateField('name', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-bold" /></div>
                            </div>
                        </div>
                    </section>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-5 bg-[#18181b] border border-white/5 rounded-xl p-4 shadow-lg">
                            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2"><span className="bg-blue-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black shadow-lg">2</span><span className="text-[11px] font-black text-slate-200 uppercase tracking-widest italic">采购与供应商</span></div>
                            <div className="space-y-3">
                                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">供应商名称</label><input value={formData.supplier} onChange={e=>updateField('supplier', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white" /></div>
                                <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">采购单价 (¥)</label><input type="number" value={formData.costPrice} onChange={e=>updateField('costPrice', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] font-bold text-white" /></div><div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">重量 (KG)</label><input type="number" value={formData.unitWeight} onChange={e=>updateField('unitWeight', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] font-bold text-white" /></div></div>
                            </div>
                        </div>
                        <div className="col-span-7 bg-[#18181b] border border-white/5 rounded-xl p-4 shadow-lg relative">
                             <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2"><span className="bg-amber-600 text-white w-5 h-5 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-black shadow-lg">3</span><span className="text-[11px] font-black text-slate-200 uppercase tracking-widest italic">箱规与入库</span></div>
                             <div className="grid grid-cols-3 gap-3 mb-3">{['长','宽','高'].map((d,i)=>(<div key={d} className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">{d} (cm)</label><input type="number" value={(formData.dimensions as any)[['l','w','h'][i]]} onChange={e=>updateDims(['l','w','h'][i], parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white" /></div>))}</div>
                             <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">当前库存</label><input type="number" value={formData.stock} onChange={e=>updateField('stock', parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-base font-black text-white" /></div><div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">装箱数</label><input type="number" value={formData.itemsPerBox} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-base font-black text-slate-700" /></div></div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-white/5 bg-[#18181b] shrink-0">
                    <button onClick={()=>onSave(formData)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-[0.5em] rounded shadow-lg transition-all italic">
                        保存修改并记录协议日志
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
        showToast(`已复制: ${text}`, 'success');
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
        showToast(`量子节点已克隆: ${item.sku}`, 'success');
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
        <div className="ios-glass-panel rounded-[1.5rem] border border-white/10 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/40 font-sans tracking-tighter">
            {/* Header: Dense 1:1 Stats */}
            <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-3xl z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                        <PackageCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-[14px] uppercase italic leading-none">智能备货清单 (Replenishment List)</h2>
                        <div className="text-[10px] text-slate-500 flex gap-4 font-black uppercase tracking-widest mt-1.5 italic">
                            <span>SKU 总数: <span className="text-white">{filteredItems.length}</span></span>
                            <span>资金占用: <span className="text-[#10b981]">¥{replenishmentItems.reduce((a,b)=>a+b.totalInvestment,0).toLocaleString(undefined, {maximumFractionDigits:1})}</span></span>
                            <span>预估总利: <span className="text-indigo-400">${replenishmentItems.reduce((a,b)=>a+(b.profit*b.stock),0).toLocaleString(undefined, {maximumFractionDigits:0})}</span></span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative group"> 
                        <Search className="w-3.5 h-3.5 text-slate-700 absolute left-3 top-2.5" /> 
                        <input type="text" placeholder="搜索 SKU / 名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-4 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[11px] text-white outline-none focus:border-indigo-500 font-bold uppercase transition-all shadow-inner" /> 
                    </div>
                    <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all italic"> <Plus className="w-3.5 h-3.5"/> 添加 SKU </button>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                    <thead className="bg-[#050508] sticky top-0 z-10 border-b border-white/10 backdrop-blur-md">
                        <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20"/></th>
                            <th className="px-4 py-3 w-40">SKU / 阶段</th>
                            <th className="px-4 py-3 w-72">产品信息 / 供应商</th>
                            <th className="px-4 py-3 w-56">物流状态 (TRACKING)</th>
                            <th className="px-4 py-3 w-36 text-center border-x border-white/5">资金投入</th>
                            <th className="px-4 py-3 w-32 text-center bg-white/2">库存数量</th>
                            <th className="px-4 py-3 w-44">销售 & 利润</th>
                            <th className="px-4 py-3 w-52">备注信息</th>
                            <th className="px-4 py-3 w-20 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans bg-black/5">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-indigo-600/[0.03] transition-all group animate-in fade-in duration-200">
                                <td className="px-4 py-2 text-center align-top pt-5"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20"/></td>
                                <td className="px-4 py-2 align-top pt-5">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${item.daysRemaining < 10 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-[#10b981] shadow-[0_0_10px_#10b981]'}`}></div>
                                            <span className="text-[16px] font-black text-white uppercase cursor-pointer hover:text-indigo-400 transition-colors leading-none" onClick={()=>copyToClipboard(item.sku)}>{item.sku}</span>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-5">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/10 shrink-0 overflow-hidden flex items-center justify-center group-hover:border-indigo-500/30 transition-all shadow-xl">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-800"/>}
                                        </div>
                                        <div className="flex flex-col min-w-0 justify-center">
                                            <div className="text-[13px] font-bold text-slate-100 truncate max-w-[220px] uppercase leading-tight">{item.name}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-black uppercase mt-1 italic"><Monitor className="w-2.5 h-2.5 text-slate-700"/> {item.supplier || '未指定'}</div>
                                            {item.lingXingId && <div className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 font-mono w-fit font-black tracking-widest mt-1.5 uppercase">LX: {item.lingXingId}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-black uppercase">
                                            {item.logistics?.method === 'Sea' ? <Ship className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
                                            <span>{item.logistics?.method || 'Air'} Freight</span>
                                        </div>
                                        <div className={`text-[9px] px-1.5 py-0.5 rounded-[2px] border font-black uppercase tracking-widest w-fit ${item.liveTrackingStatus === '运输中' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 animate-pulse' : 'bg-slate-800 text-slate-500 border-white/5'}`}>{item.liveTrackingStatus}</div>
                                        <a href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-400 hover:text-indigo-200 underline font-black tracking-tighter decoration-indigo-800 mt-0.5">
                                            {item.logistics?.trackingNo || 'AWAITING_ID'}
                                        </a>
                                        <div className="text-[9px] text-slate-600 font-black uppercase flex gap-3 mt-1 italic">
                                            <span>{(item.unitWeight! * item.stock).toFixed(1)}kg</span>
                                            <span>/ {Math.ceil(item.stock/(item.itemsPerBox||1))} box</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-5 border-x border-white/5">
                                    <div className="flex flex-col items-center">
                                        <div className="text-[18px] font-black text-[#10b981] tracking-tighter italic">¥{item.totalInvestment.toLocaleString()}</div>
                                        <div className="space-y-1 mt-2 w-full px-2">
                                            <div className="text-[9px] text-slate-600 font-black uppercase flex justify-between"><span>货值:</span> <span className="text-slate-400">¥{((item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                            <div className="text-[9px] text-slate-600 font-black uppercase flex justify-between"><span>物流全口径:</span> <span className="text-blue-500">¥{(item.totalInvestment - (item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top text-center bg-white/[0.02] pt-5">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[20px] font-black text-white leading-none">{item.stock}</span><span className="text-[10px] text-slate-700 font-black uppercase mb-0.5 italic">PCS</span>
                                        </div>
                                        <div className={`text-[10px] font-black px-2 py-0.5 rounded-[2px] border w-fit uppercase tracking-widest ${item.daysRemaining < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-[#10b981] border-emerald-500/30'}`}>可售: {item.daysRemaining} 天</div>
                                        <div className="w-20 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5 mt-1">
                                            <div className={`h-full transition-all duration-1000 ${item.daysRemaining < 10 ? 'bg-rose-600' : 'bg-[#10b981]'}`} style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-5">
                                    <div className="bg-black border border-white/10 rounded-xl p-3 w-[155px] group-hover:border-indigo-500/20 transition-all">
                                        <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-white/5">
                                            <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-black uppercase italic">
                                                <Wallet className="w-3 h-3 text-indigo-500/50" />
                                                <span>单品</span>
                                            </div>
                                            <div className={`text-[13px] font-black tracking-tighter ${item.profit > 0 ? 'text-[#10b981]' : 'text-rose-500'}`}>
                                                ${item.profit.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-600 text-[10px] font-black uppercase italic">库存总利</span>
                                            <div className={`text-[13px] font-black tracking-tighter ${item.profit > 0 ? 'text-[#10b981]' : 'text-rose-500'}`}>
                                                ${(item.profit * item.stock).toLocaleString(undefined, {maximumFractionDigits:0})}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-5">
                                    <div className="text-[11px] text-slate-600 line-clamp-3 leading-[1.4] font-bold italic border-l-2 border-white/10 pl-4 uppercase group-hover:text-slate-400 transition-colors">
                                        {item.notes || '-'}
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top text-right pt-5">
                                    <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button onClick={()=>handleClone(item)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-600 hover:text-indigo-400 shadow-lg"><CopyPlus className="w-4 h-4"/></button>
                                        <button onClick={()=>setEditingItem(item)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-600 hover:text-white shadow-lg"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={()=>{ if(confirm('彻底销毁节点协议？')) dispatch({type:'DELETE_PRODUCT', payload:item.id}); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500 shadow-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && <EditModal product={editingItem} onClose={()=>setEditingItem(null)} onSave={(p)=>{dispatch({type:'UPDATE_PRODUCT', payload:p}); setEditingItem(null); showToast('协议已同步存档','success');}} />}
        </div>
    );
};

export default Inventory;
