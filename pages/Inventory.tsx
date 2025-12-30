
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, Plane, Ship, 
  Image as ImageIcon, Edit2, Plus, 
  Trash2, X, Monitor, Wallet, CopyPlus, BarChart3, 
  Zap, Save, History as HistoryIcon, Link as LinkIcon
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
    return <div className={`flex items-center justify-center px-2 py-0.5 rounded-[1px] text-[10px] font-black border ${color} uppercase tracking-tighter w-fit mt-1.5`}>
        <span>{label}</span>
    </div>;
};

const Inventory: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<Product | null>(null);
    const exchangeRate = state.exchangeRate || 7.2;

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
            const unitProfit = (p.price || 0) - (unitCogsUSD + unitFreightUSD + ((p.price || 0) * 0.15) + 0.5);
            return {
                ...p, dailyBurnRate, daysRemaining, profit: unitProfit, margin: (p.price || 0) > 0 ? (unitProfit / p.price) * 100 : 0,
                totalInvestment: stock * (p.costPrice || 0) + (totalFreight),
                liveTrackingStatus: (state.shipments || []).find((s: Shipment) => s.trackingNo === p.logistics?.trackingNo)?.status || '待处理'
            } as ReplenishmentItem;
        });
    }, [state.products, state.shipments, exchangeRate]);

    const filteredItems = replenishmentItems.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="ios-glass-panel rounded-[1.5rem] border border-white/10 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black font-sans tracking-tighter">
            {/* 顶栏汇总：强化字重，取消斜体 */}
            <div className="px-7 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] backdrop-blur-3xl z-20 shrink-0">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <PackageCheck className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-white font-black text-[18px] uppercase tracking-tighter">智能备货清单 (Replenishment List)</h2>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-5 font-black uppercase tracking-widest mt-1">
                        <span>SKU 总数: <span className="text-white font-black text-[14px] ml-1">{filteredItems.length}</span></span>
                        <div className="w-px h-3 bg-white/10"></div>
                        <span>资金占用: <span className="text-[#10b981] font-black text-[14px] ml-1">¥{replenishmentItems.reduce((a,b)=>a+b.totalInvestment,0).toLocaleString(undefined, {maximumFractionDigits:1})}</span></span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="relative group"> 
                        <Search className="w-4 h-4 text-slate-600 absolute left-4 top-3.5" /> 
                        <input type="text" placeholder="搜索 SKU / 名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-72 pl-12 pr-5 py-3 bg-black border border-white/10 rounded-2xl text-[12px] text-white outline-none focus:border-indigo-500 font-black uppercase tracking-widest transition-all shadow-inner" /> 
                    </div>
                    <button className="px-7 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-2xl text-[12px] font-black uppercase flex items-center gap-2 shadow-2xl transition-all active:scale-95"> <Plus className="w-4.5 h-4.5"/> 添加 SKU </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1500px] table-fixed">
                    <thead className="bg-[#08080a] sticky top-0 z-30 border-b border-white/10 shadow-md">
                        <tr className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-6 py-5 w-[55px] text-center border-r border-white/5"><input type="checkbox" className="rounded-sm bg-black border-white/20 scale-110"/></th>
                            <th className="px-6 py-5 w-[12%]">SKU/阶段</th>
                            <th className="px-6 py-5 w-[22%]">产品信息/供应商</th>
                            <th className="px-6 py-5 w-[14%]">物流状态</th>
                            <th className="px-6 py-5 w-[14%]">资金投入</th>
                            <th className="px-6 py-5 w-[11%] text-center bg-white/[0.01]">库存数量</th>
                            <th className="px-6 py-5 w-[14%]">销售&利润</th>
                            <th className="px-6 py-5 w-[14%]">备注信息</th>
                            <th className="px-6 py-5 w-[5%] text-right pr-8">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-white/[0.03] transition-all group animate-in fade-in duration-100">
                                <td className="px-6 py-8 text-center align-middle border-r border-white/5"><input type="checkbox" className="rounded-sm bg-black border-white/20 scale-110"/></td>
                                <td className="px-6 py-8 align-middle">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2.5 leading-none">
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.daysRemaining < 10 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-[#10b981] shadow-[0_0_12px_#10b981]'}`}></div>
                                            <span className="text-[17px] font-black text-white uppercase leading-none tracking-tighter cursor-pointer hover:text-indigo-400 transition-colors" onClick={()=>navigator.clipboard.writeText(item.sku)}>{item.sku}</span>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-6 py-8 align-middle">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 shrink-0 overflow-hidden flex items-center justify-center group-hover:border-indigo-500/40 transition-all shadow-inner">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-800"/>}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="text-[14px] font-black text-slate-100 truncate w-full uppercase leading-tight tracking-tighter">{item.name}</div>
                                            <div className="text-[10px] text-slate-600 flex items-center gap-1.5 font-black uppercase mt-2 opacity-90 tracking-wide">SUP: {item.supplier || 'DIRECT_LINK'}</div>
                                            {item.lingXingId && <div className="text-[9px] bg-indigo-950/80 text-indigo-400 px-2 py-0.5 rounded-[2px] border border-indigo-500/20 font-black tracking-[0.1em] mt-2 uppercase w-fit leading-none shadow-sm">LX: {item.lingXingId}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 align-middle">
                                    <div className="flex flex-col gap-1.5">
                                        <div className={`text-[10px] px-2.5 py-0.5 rounded-[2px] border font-black uppercase tracking-widest w-fit leading-none ${item.liveTrackingStatus === '运输中' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 animate-pulse' : 'bg-slate-800/60 text-slate-600 border-white/5'}`}>{item.liveTrackingStatus}</div>
                                        <a href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)} target="_blank" rel="noreferrer" className="text-[13px] text-indigo-400 hover:text-indigo-200 underline font-black tracking-tight block truncate leading-none mt-2">
                                            {item.logistics?.trackingNo || 'AWAITING_ID'}
                                        </a>
                                        <div className="text-[10px] text-slate-700 font-black uppercase mt-1.5 tracking-widest opacity-60">CH: {item.logistics?.method || 'AIR'}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 align-middle">
                                    <div className="flex flex-col items-start gap-1 leading-none">
                                        <div className="text-[17px] font-black text-[#10b981] tracking-tighter leading-none mb-1">¥{item.totalInvestment.toLocaleString()}</div>
                                        <div className="flex flex-col gap-1 mt-2.5">
                                            <div className="text-[10px] text-slate-700 font-black uppercase leading-tight tracking-wide">货值占用: <span className="text-slate-500 ml-1">¥{((item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                            <div className="text-[10px] text-slate-700 font-black uppercase leading-tight tracking-wide">物流载荷: <span className="text-blue-500 ml-1">¥{(item.totalInvestment - (item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 align-middle text-center bg-white/[0.01]">
                                    <div className="flex flex-col items-center gap-1.5 leading-none">
                                        <div className="flex items-end gap-1.5 leading-none mb-2">
                                            <span className="text-[19px] font-black text-white">{item.stock}</span><span className="text-[11px] text-slate-800 font-black uppercase pb-0.5">PCS</span>
                                        </div>
                                        <div className={`text-[10px] font-black px-2.5 py-1 rounded-[2px] border w-fit uppercase tracking-tighter leading-none ${item.daysRemaining < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-[#10b981] border-emerald-500/30'}`}>可售: {item.daysRemaining} 天</div>
                                        <div className="w-20 h-[3px] bg-slate-900 rounded-full overflow-hidden mt-3 shadow-inner">
                                            <div className={`h-full transition-all duration-1000 ${item.daysRemaining < 10 ? 'bg-rose-600 shadow-[0_0_8px_#e11d48]' : 'bg-[#10b981] shadow-[0_0_8px_#10b981]'}`} style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 align-middle">
                                    <div className="bg-black/90 border border-white/10 rounded-2xl px-4 py-3 w-full max-w-[170px] font-black flex flex-col gap-2 shadow-inner group-hover:border-indigo-500/20 transition-all">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2 leading-none">
                                            <span className="text-slate-600 text-[10px] uppercase tracking-wider">单品净利</span>
                                            <span className={`text-[15px] tracking-tighter font-black ${item.profit > 0 ? 'text-[#10b981]' : 'text-rose-500'}`}>${item.profit.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1 leading-none">
                                            <span className="text-slate-600 text-[10px] uppercase tracking-wider">库存总利</span>
                                            <span className={`text-[15px] tracking-tighter font-black ${item.profit > 0 ? 'text-[#10b981]' : 'text-rose-500'}`}>${(item.profit * item.stock).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 align-middle">
                                    <div className="text-[13px] text-slate-500 line-clamp-3 leading-relaxed font-black border-l-2 border-indigo-500/30 pl-4 uppercase group-hover:text-slate-300 transition-colors tracking-tight">
                                        {item.notes || '---'}
                                    </div>
                                </td>
                                <td className="px-6 py-8 align-middle text-right pr-8">
                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <button onClick={()=>setEditingItem(item)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-700 hover:text-white transition-all shadow-sm"><Edit2 className="w-4.5 h-4.5"/></button>
                                        <button onClick={()=>{ if(confirm('确认销毁此 SKU 资产协议？')) dispatch({type:'DELETE_PRODUCT', payload:item.id}); }} className="p-2.5 hover:bg-red-500/20 rounded-xl text-slate-700 hover:text-red-500 transition-all shadow-sm"><Trash2 className="w-4.5 h-4.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md rounded-[2rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                            <h3 className="text-white font-black uppercase text-[17px] tracking-[0.2em] italic">协议参数修正: {editingItem.sku}</h3>
                            <button onClick={()=>setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-500 transition-colors"><X className="w-7 h-7"/></button>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] block">物理载荷库存 (Units)</label>
                                <input type="number" defaultValue={editingItem.stock} className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-xl text-white font-black focus:border-indigo-500 outline-none shadow-inner" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] block">经营核算审计备注</label>
                                <textarea className="w-full h-40 bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-black resize-none focus:border-indigo-500 outline-none shadow-inner leading-relaxed" defaultValue={editingItem.notes}></textarea>
                            </div>
                            <button onClick={()=>setEditingItem(null)} className="w-full py-5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.4em] mt-4 transition-all shadow-2xl active:scale-95 italic">同步并固化节点协议</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
