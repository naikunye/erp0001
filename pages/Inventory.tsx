
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, Sparkles, Box, Plane, Ship, Info, 
  Image as ImageIcon, TrendingUp, CheckCircle2, Zap, Edit2, Plus, 
  Copy, Trash2, Layers, ChevronRight, Calculator, DollarSign, Clock, Save, X, ExternalLink,
  Target, ShieldAlert, BarChart3, Tag, RotateCcw, Monitor, Truck, ClipboardCheck, Radar,
  LayoutPanelLeft
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
    let label = type === 'New' || type === '新品测试' ? 'NEW' : type === 'Growing' || type === '爆品增长' ? 'HOT' : 'STABLE';
    if (label === 'NEW') color = 'bg-blue-900/30 text-blue-400 border-blue-500/20';
    else if (label === 'HOT') color = 'bg-purple-900/30 text-purple-400 border-purple-500/20';
    else color = 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20';
    return <div className={`flex items-center gap-1 px-1 py-0 rounded-[2px] text-[8px] font-black border ${color} uppercase tracking-tighter w-fit`}>
        {label === 'NEW' ? <Sparkles className="w-2 h-2"/> : label === 'HOT' ? <TrendingUp className="w-2 h-2"/> : <CheckCircle2 className="w-2 h-2"/>}
        <span>{label}</span>
    </div>;
};

const EditModal: React.FC<{ product: Product, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    const { state } = useTanxing();
    const exchangeRate = state.exchangeRate || 7.2;
    const [formData, setFormData] = useState<Product>({...product});

    const updateField = (field: string, value: any) => setFormData(prev => ({...prev, [field]: value}));
    const updateLogistics = (field: string, value: any) => setFormData(prev => ({...prev, logistics: {...(prev.logistics || {}), [field]: value} as any}));
    const updateEconomics = (field: string, value: any) => setFormData(prev => ({...prev, economics: {...(prev.economics || {}), [field]: value} as any}));

    const stock = formData.stock || 0;
    const itemsPerBox = formData.itemsPerBox || 1;
    const boxCount = Math.ceil(stock / itemsPerBox);
    const totalVol = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * boxCount;
    const unitWeight = formData.unitWeight || 0;
    const billingWeight = (formData.logistics?.unitBillingWeight || unitWeight) * stock;
    const baseFreight = (formData.logistics?.unitFreightCost || 0) * (formData.logistics?.billingWeight || billingWeight);
    const totalFreight = baseFreight + (formData.logistics?.consumablesFee || 0) * stock + (formData.logistics?.customsFee || 0);
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
            <div className="bg-[#0f1218] w-full max-w-[1100px] h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                    <h3 className="text-sm font-black text-white italic">协议配置: {formData.sku}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-[#09090b] space-y-4 custom-scrollbar text-[10px]">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 bg-[#18181b] border border-white/5 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 pb-2 italic">1. 产品与供应链核心节点</div>
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-black rounded border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                    {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-800"/>}
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-3">
                                    <div className="col-span-2"><label className="text-slate-600 block mb-1 font-black uppercase">产品名称</label><input type="text" value={formData.name} onChange={e=>updateField('name', e.target.value)} className="w-full bg-black border border-white/10 rounded px-2 py-1 text-white font-bold" /></div>
                                    <div><label className="text-slate-600 block mb-1 font-black uppercase">SKU ID</label><input type="text" value={formData.sku} readOnly className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-indigo-400 font-mono" /></div>
                                    <div><label className="text-amber-600 block mb-1 font-black uppercase">总时效(天)</label><input type="number" value={formData.leadTime} onChange={e=>updateField('leadTime', parseInt(e.target.value))} className="w-full bg-black border border-amber-900/20 rounded px-2 py-1 text-amber-500 font-mono font-bold" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 底部全宽测算条 */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center text-emerald-500"><Calculator className="w-6 h-6"/></div>
                            <div>
                                <div className="font-black text-white italic text-xs uppercase">单品获利实时穿透 Analysis</div>
                                <div className="text-[8px] text-emerald-600 font-black uppercase tracking-widest mt-1">Matrix Computing Engine v12.0</div>
                            </div>
                        </div>
                        <div className="flex gap-10">
                            <div className="text-right">
                                <div className="text-slate-600 font-black uppercase text-[8px] tracking-widest">Unit Profit</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${profit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>${profit.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-600 font-black uppercase text-[8px] tracking-widest">Net Margin</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${margin > 20 ? 'text-emerald-400' : 'text-amber-500'}`}>{margin.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-[#18181b] flex justify-center">
                    <button onClick={()=>onSave(formData)} className="w-full max-w-sm py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.5em] rounded-xl shadow-2xl transition-all active:scale-95 italic">执行数字化存盘</button>
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

    const replenishmentItems: ReplenishmentItem[] = useMemo(() => {
        return (state.products || []).filter(p => !p.deletedAt).map(p => {
            const stock = p.stock || 0;
            const dailyBurnRate = p.dailyBurnRate || 0;
            const daysRemaining = dailyBurnRate > 0 ? Math.floor(stock / dailyBurnRate) : 999;
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

    const filteredItems = replenishmentItems.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="ios-glass-panel rounded-xl border border-white/10 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/40 font-sans">
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-3xl z-20">
                <div className="flex items-center gap-3">
                    <PackageCheck className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-white font-black text-sm uppercase italic tracking-tighter">智能备货清单 (Replenishment Matrix)</h2>
                    <div className="text-[9px] text-slate-500 ml-4 flex gap-4 font-black uppercase tracking-[0.2em]">
                        <span>SKU: <span className="text-white">{filteredItems.length}</span></span>
                        <span>资金: <span className="text-emerald-400">¥{replenishmentItems.reduce((a,b)=>a+b.totalInvestment,0).toLocaleString()}</span></span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative group"> 
                        <Search className="w-3.5 h-3.5 text-slate-700 absolute left-3 top-2.5" /> 
                        <input type="text" placeholder="搜索 SKU / 名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-56 pl-9 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 font-bold italic uppercase tracking-wider" /> 
                    </div>
                    <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 italic shadow-lg shadow-indigo-900/40"> <Plus className="w-3.5 h-3.5"/> 添加 SKU </button>
                    <button className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1550px]">
                    <thead className="bg-[#050508] sticky top-0 z-10 border-b border-white/10 backdrop-blur-md">
                        <tr className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                            <th className="px-3 py-3 w-10 text-center"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20"/></th>
                            <th className="px-3 py-3 w-40 italic">SKU / 阶段</th>
                            <th className="px-3 py-3 w-56 italic">产品信息 / 供应商</th>
                            <th className="px-3 py-3 w-[320px] italic">物流追踪 (TRACKING MATRIX)</th>
                            <th className="px-3 py-3 w-40 italic">资金投入</th>
                            <th className="px-3 py-3 w-32 italic text-center">库存数量</th>
                            <th className="px-3 py-3 w-48 italic">销售 & 利润</th>
                            <th className="px-3 py-3 w-56 italic">备注信息</th>
                            <th className="px-3 py-3 w-20 text-right italic">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans bg-black/10">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-indigo-600/5 transition-all group">
                                <td className="px-3 py-1.5 text-center align-top pt-2.5"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20"/></td>
                                <td className="px-3 py-1.5 align-top pt-2.5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 relative">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.daysRemaining < 10 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-500'}`}></div>
                                            <span className="text-[17px] font-black text-white font-mono tracking-tighter uppercase italic cursor-pointer hover:text-indigo-400" onClick={()=>copyToClipboard(item.sku)}>{item.sku}</span>
                                            <button onClick={()=>copyToClipboard(item.sku)} className="opacity-0 group-hover:opacity-100"><Copy className="w-3 h-3 text-slate-700 hover:text-white"/></button>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 align-top pt-2.5">
                                    <div className="flex gap-2">
                                        <div className="w-9 h-9 bg-white/5 rounded border border-white/10 shrink-0 overflow-hidden group/img">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-800 m-auto mt-2"/>}
                                        </div>
                                        <div className="flex flex-col gap-0 min-w-0 -mt-0.5">
                                            <div className="text-[11px] font-black text-slate-200 truncate max-w-[140px] italic uppercase tracking-tighter">{item.name}</div>
                                            <div className="text-[9px] text-slate-600 flex items-center gap-1 font-bold uppercase"><Monitor className="w-2.5 h-2.5"/> {item.supplier || '未指定'}</div>
                                            {item.lingXingId && <div className="text-[8px] bg-blue-600/10 text-blue-400 px-1 py-0 rounded border border-blue-500/20 font-mono w-fit font-black tracking-tight flex items-center gap-1 mt-0.5 uppercase">LX: {item.lingXingId}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 align-top pt-2.5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-[9px] text-blue-400 font-black uppercase italic">
                                            {item.logistics?.method === 'Sea' ? <Ship className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
                                            <span>{item.logistics?.method || 'Air'} Freight</span>
                                            <div className={`text-[8px] px-1.5 py-0 rounded border font-black uppercase tracking-tighter ml-auto ${item.liveTrackingStatus === '运输中' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 animate-pulse' : 'bg-slate-800/40 text-slate-600 border-white/5'}`}>{item.liveTrackingStatus}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <a href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-400 hover:text-indigo-200 underline font-mono font-black italic tracking-tighter break-all">
                                                {item.logistics?.trackingNo || 'AWAITING_PROTOCOL'}
                                            </a>
                                            <button onClick={()=>showToast('同步中...','info')} className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-xl shrink-0"><Zap className="w-2.5 h-2.5 fill-current"/></button>
                                        </div>
                                        <div className="text-[8px] text-slate-700 font-black uppercase flex justify-between tracking-widest mt-0.5">
                                            <span>计费总重: <span className="text-slate-500">{(item.unitWeight! * item.stock).toFixed(1)}kg</span></span>
                                            <span>舱位: {Math.ceil(item.stock/(item.itemsPerBox||1))} box</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 align-top pt-2.5">
                                    <div className="flex flex-col gap-0.5">
                                        {/* 资金列：物理还原截图绿色斜体 */}
                                        <div className="text-[24px] font-black text-emerald-400 font-mono tracking-tighter italic leading-none drop-shadow-[0_0_10px_rgba(16,185,129,0.15)]">¥{item.totalInvestment.toLocaleString()}</div>
                                        <div className="space-y-0.5 bg-white/2 p-1 rounded-md border border-white/5 mt-1">
                                            <div className="text-[8px] text-slate-700 font-black uppercase flex justify-between tracking-tighter"><span>货值权益:</span> <span className="text-slate-500 font-mono">¥{((item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                            <div className="text-[8px] text-slate-700 font-black uppercase flex justify-between tracking-tighter"><span>物流分摊:</span> <span className="text-blue-500 font-mono">¥{((item.logistics?.unitFreightCost||0)*(item.unitWeight||1)*item.stock).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 align-top pt-2.5 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[22px] font-black text-white font-mono tracking-tighter leading-none">{item.stock}</span><span className="text-[8px] text-slate-800 font-black uppercase mb-0.5">件</span>
                                        </div>
                                        <div className={`text-[9px] font-black px-1.5 py-0.5 rounded-[3px] border w-fit uppercase tracking-tighter ${item.daysRemaining < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>可售: {item.daysRemaining} 天</div>
                                        <div className="w-24 h-1 bg-slate-950 rounded-full overflow-hidden border border-white/5 mt-0.5">
                                            <div className={`h-full transition-all duration-1000 ${item.daysRemaining < 10 ? 'bg-rose-600' : 'bg-emerald-600'}`} style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 align-top pt-2.5">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center bg-[#050505] px-2 py-1.5 rounded-lg border border-white/10 shadow-inner group-hover:border-indigo-500/30 transition-all">
                                            <div className="flex items-center gap-1.5 text-[8px] text-slate-700 font-black uppercase italic tracking-widest"><LayoutPanelLeft className="w-2.5 h-2.5 text-slate-800"/> 单品</div>
                                            <div className={`text-[13px] font-black font-mono tracking-tighter ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>${item.profit.toFixed(2)}</div>
                                        </div>
                                        <div className="flex justify-between items-center px-1.5">
                                            <span className="text-[9px] text-slate-800 font-black uppercase tracking-widest italic">库存总利预期</span>
                                            <span className="text-[15px] font-black text-emerald-400 font-mono tracking-tighter drop-shadow-sm">${(item.profit * item.stock).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-indigo-600 shadow-[0_0_8px_#6366f1]" style={{width: `${Math.min(100, item.margin)}%`}}></div></div>
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 align-top pt-2.5">
                                    <div className="text-[10px] text-slate-700 line-clamp-2 leading-snug font-bold italic border-l border-white/10 pl-3 uppercase tracking-tighter">
                                        {item.notes || '12.29发货 - 等待协议激活反馈中...'}
                                    </div>
                                </td>
                                <td className="px-3 py-1.5 align-top pt-2.5 text-right">
                                    <div className="flex gap-1 justify-end opacity-10 group-hover:opacity-100 transition-all">
                                        <button onClick={()=>setEditingItem(item)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={()=>{ if(confirm('彻底销毁 SKU 物理节点？')) dispatch({type:'DELETE_PRODUCT', payload:item.id}); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && <EditModal product={editingItem} onClose={()=>setEditingItem(null)} onSave={(p)=>{dispatch({type:'UPDATE_PRODUCT', payload:p}); setEditingItem(null); showToast('协议已同步锁死','success');}} />}
        </div>
    );
};

export default Inventory;
