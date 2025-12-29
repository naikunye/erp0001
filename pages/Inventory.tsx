
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, Sparkles, Box, Plane, Ship, 
  Image as ImageIcon, TrendingUp, CheckCircle2, Zap, Edit2, Plus, 
  Copy, Trash2, X, LayoutPanelLeft, Monitor, Wallet, FileText
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
    return <div className={`flex items-center gap-1 px-1.5 py-0 rounded-[2px] text-[9px] font-black border ${color} uppercase tracking-tighter w-fit`}>
        {label === 'NEW' ? <Sparkles className="w-2 h-2"/> : label === 'HOT' ? <TrendingUp className="w-2 h-2"/> : <CheckCircle2 className="w-2 h-2"/>}
        <span>{label}</span>
    </div>;
};

const EditModal: React.FC<{ product: Product, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    const { state } = useTanxing();
    const exchangeRate = state.exchangeRate || 7.2;
    const [formData, setFormData] = useState<Product>({...product});
    const updateField = (field: string, value: any) => setFormData(prev => ({...prev, [field]: value}));
    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
            <div className="bg-[#0f1218] w-full max-w-[800px] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">协议参数调优: {formData.sku}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                </div>
                <div className="p-8 bg-[#09090b] space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-slate-600 block mb-2 uppercase font-black text-[10px]">SKU ID</label><input type="text" value={formData.sku} readOnly className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-indigo-400 font-mono font-bold" /></div>
                        <div><label className="text-slate-600 block mb-2 uppercase font-black text-[10px]">存仓持股</label><input type="number" value={formData.stock} onChange={e=>updateField('stock', parseInt(e.target.value))} className="w-full bg-black border border-amber-900/40 rounded px-3 py-2 text-lg font-black text-amber-400 font-mono" /></div>
                    </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-[#18181b] flex justify-center">
                    <button onClick={()=>onSave(formData)} className="w-full max-w-xs py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.5em] rounded-xl transition-all">确认物理存盘</button>
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
                    <PackageCheck className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-white font-black text-sm uppercase tracking-tighter">智能备货清单 (Replenishment List)</h2>
                    <div className="text-[9px] text-slate-500 ml-6 flex gap-6 font-black uppercase tracking-[0.25em]">
                        <span>SKU 总数: <span className="text-white font-mono">{filteredItems.length}</span></span>
                        <span>资金占用: <span className="text-emerald-400 font-mono">¥{replenishmentItems.reduce((a,b)=>a+b.totalInvestment,0).toLocaleString()}</span></span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative group"> 
                        <Search className="w-3.5 h-3.5 text-slate-700 absolute left-3 top-2.5" /> 
                        <input type="text" placeholder="搜索 SKU / 名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 pl-10 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 font-bold uppercase tracking-wider" /> 
                    </div>
                    <button className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"> <Plus className="w-3.5 h-3.5"/> 添加 SKU </button>
                    <button className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="bg-[#050508] sticky top-0 z-10 border-b border-white/10 backdrop-blur-md shadow-2xl">
                        <tr className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                            <th className="px-4 py-4 w-10 text-center"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20"/></th>
                            <th className="px-4 py-4 w-32">SKU / 阶段</th>
                            <th className="px-4 py-4 w-48">产品信息 / 供应商</th>
                            <th className="px-4 py-4 w-48">物流状态 (TRACKING)</th>
                            <th className="px-4 py-4 w-36">资金投入</th>
                            <th className="px-4 py-4 w-28 text-center">库存数量</th>
                            <th className="px-4 py-4 w-44">销售 & 利润</th>
                            <th className="px-4 py-4 w-64">备注信息</th>
                            <th className="px-4 py-4 w-24 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans bg-black/10">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-indigo-600/5 transition-all group">
                                <td className="px-4 py-7 text-center align-top"><input type="checkbox" className="rounded-sm bg-black/60 border-white/20 mt-2"/></td>
                                <td className="px-4 py-7 align-top">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 relative">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.daysRemaining < 10 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                                            <span className="text-[18px] font-black text-white font-mono tracking-tighter uppercase cursor-pointer hover:text-indigo-400" onClick={()=>copyToClipboard(item.sku)}>{item.sku}</span>
                                            <button onClick={()=>copyToClipboard(item.sku)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-2.5 h-2.5 text-slate-700 hover:text-white"/></button>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-4 py-7 align-top">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded border border-white/10 shrink-0 overflow-hidden mt-0.5 shadow-inner">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-800 m-auto mt-2.5"/>}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="text-[11px] font-black text-slate-200 truncate max-w-[160px] uppercase tracking-tighter">{item.name}</div>
                                            <div className="text-[9px] text-slate-600 flex items-center gap-1.5 font-bold uppercase mt-1"><Monitor className="w-2.5 h-2.5"/> {item.supplier || '未指定供应商'}</div>
                                            {item.lingXingId && <div className="text-[8px] bg-blue-600/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono w-fit font-black tracking-tight mt-1.5 uppercase">LX: {item.lingXingId}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-7 align-top">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 text-[9px] text-blue-400 font-black uppercase tracking-[0.2em]">
                                            {item.logistics?.method === 'Sea' ? <Ship className="w-3.5 h-3.5" /> : <Plane className="w-3.5 h-3.5" />}
                                            <span>{item.logistics?.method || 'Air'} Freight</span>
                                        </div>
                                        <div className={`text-[8px] px-2 py-0.5 rounded border font-black uppercase tracking-tighter w-fit ${item.liveTrackingStatus === '运输中' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 animate-pulse' : 'bg-slate-800/40 text-slate-600 border-white/5'}`}>{item.liveTrackingStatus}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <a href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-400 hover:text-indigo-200 underline font-mono font-black tracking-tighter whitespace-nowrap">
                                                {item.logistics?.trackingNo || 'PENDING_NODE'}
                                            </a>
                                            <button onClick={()=>showToast('同步物理节点...','info')} className="p-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-xl shrink-0"><Zap className="w-2 h-2 fill-current"/></button>
                                        </div>
                                        <div className="text-[9px] text-slate-700 font-black uppercase flex gap-4 tracking-[0.1em] mt-1">
                                            <span>{(item.unitWeight! * item.stock).toFixed(1)}kg</span>
                                            <span>{Math.ceil(item.stock/(item.itemsPerBox||1))} box</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-7 align-top">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="text-[18px] font-black text-emerald-400 font-mono tracking-tighter leading-none">¥{item.totalInvestment.toLocaleString()}</div>
                                        <div className="space-y-1 mt-2.5">
                                            <div className="text-[10px] text-slate-700 font-black uppercase flex items-center gap-2 tracking-tighter">
                                                <span>货值:</span> 
                                                <span className="text-slate-400 font-mono">¥{((item.costPrice||0)*item.stock).toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-700 font-black uppercase flex items-center gap-2 tracking-tighter">
                                                <span>物流全口径:</span> 
                                                <span className="text-blue-500 font-mono">¥{((item.logistics?.unitFreightCost||0)*(item.unitWeight||1)*item.stock).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-7 align-top text-center bg-white/2">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-[18px] font-black text-white font-mono tracking-tighter leading-none">{item.stock}</span><span className="text-[9px] text-slate-800 font-black uppercase mb-0.5 tracking-widest">件</span>
                                        </div>
                                        <div className={`text-[9px] font-black px-2 py-0.5 rounded-[4px] border w-fit uppercase tracking-tighter ${item.daysRemaining < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>可售: {item.daysRemaining} 天</div>
                                        <div className="w-16 h-1 bg-slate-950 rounded-full overflow-hidden border border-white/5 mt-1.5">
                                            <div className={`h-full transition-all duration-1000 ${item.daysRemaining < 10 ? 'bg-rose-600' : 'bg-emerald-600'}`} style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-7 align-top">
                                    <div className="bg-[#0a0a0c] border border-white/10 rounded-xl p-3 w-[150px] shadow-2xl group-hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                <Wallet className="w-3 h-3 text-indigo-500/80" />
                                                <span>单品</span>
                                            </div>
                                            <div className={`text-[13px] font-black font-mono tracking-tighter ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                ${item.profit.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">库存总利</span>
                                            <div className={`text-[13px] font-black font-mono tracking-tighter ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                ${(item.profit * item.stock).toLocaleString(undefined, {maximumFractionDigits:0})}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-7 align-top">
                                    <div className="text-[10px] text-slate-700 line-clamp-3 leading-relaxed font-bold border-l-2 border-white/10 pl-4 uppercase tracking-tighter group-hover:text-slate-400 transition-colors">
                                        {item.notes || '-'}
                                    </div>
                                </td>
                                <td className="px-4 py-7 align-top text-right">
                                    <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={()=>setEditingItem(item)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg" title="配置 (Config)"><Edit2 className="w-4.5 h-4.5"/></button>
                                        <button onClick={()=>{ if(confirm('彻底销毁此 SKU 节点协议？')) dispatch({type:'DELETE_PRODUCT', payload:item.id}); }} className="p-2 hover:bg-red-500/20 rounded-xl text-red-500 transition-all shadow-lg" title="销毁 (Delete)"><Trash2 className="w-4.5 h-4.5"/></button>
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
