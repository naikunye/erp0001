
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, Plane, Ship, 
  Image as ImageIcon, Edit2, Plus, 
  Copy, Trash2, X, Monitor, Wallet, CopyPlus, Clock, User, BarChart3, 
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
    return <div className={`flex items-center justify-center px-1.5 py-0.5 rounded-[1px] text-[8px] font-black border ${color} uppercase tracking-tighter w-fit mt-0.5`}>
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
        <div className="ios-glass-panel rounded-[1rem] border border-white/10 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black font-sans tracking-tighter">
            {/* Header */}
            <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-white/[0.02] backdrop-blur-3xl z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <PackageCheck className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-white font-black text-[13px] uppercase italic tracking-tighter">智能备货清单 (Replenishment)</h2>
                    <div className="text-[10px] text-slate-500 flex gap-4 font-black uppercase tracking-tighter ml-4 italic">
                        <span>SKU: <span className="text-white">{filteredItems.length}</span></span>
                        <span>FUNDS: <span className="text-[#10b981]">¥{replenishmentItems.reduce((a,b)=>a+b.totalInvestment,0).toLocaleString(undefined, {maximumFractionDigits:0})}</span></span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative"> 
                        <Search className="w-3 h-3 text-slate-600 absolute left-2.5 top-2" /> 
                        <input type="text" placeholder="快速检索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-40 pl-7 pr-3 py-1 bg-black border border-white/10 rounded-md text-[10px] text-white outline-none focus:border-indigo-500 font-black uppercase tracking-widest transition-all" /> 
                    </div>
                    <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[9px] font-black uppercase flex items-center gap-2 shadow-xl transition-all"> <Plus className="w-3 h-3"/> 新增 </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1300px]">
                    <thead className="bg-[#050508] sticky top-0 z-10 border-b border-white/10">
                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-4 py-2.5 w-10 text-center"><input type="checkbox" className="rounded-sm bg-black border-white/20"/></th>
                            <th className="px-4 py-2.5 w-32">SKU / 阶段</th>
                            <th className="px-4 py-2.5 w-60">产品信息</th>
                            <th className="px-4 py-2.5 w-40">物流单号</th>
                            <th className="px-4 py-2.5 w-36">资金投入</th>
                            <th className="px-4 py-2.5 w-28 text-center bg-white/[0.01]">库存数量</th>
                            <th className="px-4 py-2.5 w-40">销售 & 利润</th>
                            <th className="px-4 py-2.5 w-40">备注信息</th>
                            <th className="px-4 py-2.5 w-12 text-right">CMD</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-all group animate-in fade-in duration-75">
                                <td className="px-4 py-2 text-center align-top pt-3"><input type="checkbox" className="rounded-sm bg-black border-white/20"/></td>
                                <td className="px-4 py-2 align-top pt-3">
                                    <div className="flex flex-col gap-0">
                                        <div className="flex items-center gap-1.5 leading-none">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.daysRemaining < 10 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-[#10b981] shadow-[0_0_8px_#10b981]'}`}></div>
                                            <span className="text-[14px] font-black text-white uppercase leading-none tracking-tighter cursor-pointer hover:text-indigo-400" onClick={()=>navigator.clipboard.writeText(item.sku)}>{item.sku}</span>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-3">
                                    <div className="flex gap-2">
                                        <div className="w-9 h-9 bg-white/5 rounded border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-800"/>}
                                        </div>
                                        <div className="flex flex-col min-w-0 justify-center">
                                            <div className="text-[11px] font-black text-slate-100 truncate max-w-[160px] uppercase leading-none">{item.name}</div>
                                            <div className="text-[8px] text-slate-600 flex items-center gap-1 font-black uppercase mt-1 italic opacity-60 leading-none">SUP: {item.supplier || '-'}</div>
                                            {item.lingXingId && <div className="text-[8px] bg-indigo-950/80 text-indigo-400 px-1 py-0.5 rounded-[1px] border border-indigo-500/20 font-black tracking-tighter mt-1 uppercase w-fit leading-none">LX: {item.lingXingId}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-3">
                                    <div className="flex flex-col gap-0.5">
                                        <div className={`text-[8px] px-1 py-0.5 rounded-[1px] border font-black uppercase tracking-tighter w-fit leading-none ${item.liveTrackingStatus === '运输中' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 animate-pulse' : 'bg-slate-800/60 text-slate-600 border-white/5'}`}>{item.liveTrackingStatus}</div>
                                        <a href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-400 hover:text-indigo-200 underline font-black tracking-tighter block truncate leading-none mt-1">
                                            {item.logistics?.trackingNo || 'AWAIT_ID'}
                                        </a>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-3">
                                    <div className="flex flex-col items-start gap-0.5 leading-none">
                                        <div className="text-[16px] font-black text-[#10b981] tracking-tighter italic leading-none">¥{item.totalInvestment.toLocaleString()}</div>
                                        <div className="flex flex-col gap-0 mt-0.5">
                                            <div className="text-[8px] text-slate-600 font-black uppercase leading-none">货值: <span className="text-slate-400">¥{((item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                            <div className="text-[8px] text-slate-600 font-black uppercase leading-none mt-0.5">物流: <span className="text-blue-500">¥{(item.totalInvestment - (item.costPrice||0)*item.stock).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top text-center bg-white/[0.01] pt-3">
                                    <div className="flex flex-col items-center gap-0.5 leading-none">
                                        <div className="flex items-end gap-1 leading-none mb-1">
                                            <span className="text-[18px] font-black text-white">{item.stock}</span><span className="text-[8px] text-slate-700 font-black uppercase italic">PCS</span>
                                        </div>
                                        <div className={`text-[8px] font-black px-1 py-0.5 rounded-[1px] border w-fit uppercase tracking-tighter leading-none ${item.daysRemaining < 10 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-[#10b981] border-emerald-500/30'}`}>可售: {item.daysRemaining} 天</div>
                                        <div className="w-14 h-[2px] bg-slate-900 rounded-full overflow-hidden mt-1">
                                            <div className={`h-full transition-all duration-1000 ${item.daysRemaining < 10 ? 'bg-rose-600' : 'bg-[#10b981]'}`} style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-3">
                                    <div className="bg-black/90 border border-white/5 rounded-md px-2 py-1.5 w-[130px] font-black flex flex-col gap-1 shadow-inner">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-1 leading-none">
                                            <span className="text-slate-600 text-[8px] uppercase italic">单品</span>
                                            <span className={`text-[12px] tracking-tighter ${item.profit > 0 ? 'text-[#10b981]' : 'text-rose-500'}`}>${item.profit.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-0.5 leading-none">
                                            <span className="text-slate-600 text-[8px] uppercase italic">库存总利</span>
                                            <span className={`text-[12px] tracking-tighter ${item.profit > 0 ? 'text-[#10b981]' : 'text-rose-500'}`}>${(item.profit * item.stock).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top pt-3">
                                    <div className="text-[10px] text-slate-600 line-clamp-2 leading-tight font-black italic border-l-2 border-white/10 pl-2 uppercase group-hover:text-slate-400 tracking-tighter">
                                        {item.notes || '-'}
                                    </div>
                                </td>
                                <td className="px-4 py-2 align-top text-right pt-3">
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={()=>setEditingItem(item)} className="p-1 hover:bg-white/10 rounded text-slate-700 hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                                        <button onClick={()=>{ if(confirm('确认销毁？')) dispatch({type:'DELETE_PRODUCT', payload:item.id}); }} className="p-1 hover:bg-red-500/20 rounded text-slate-700 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingItem && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-white font-black uppercase text-sm italic">协议修正: {editingItem.sku}</h3>
                            <button onClick={()=>setEditingItem(null)}><X className="w-5 h-5 text-slate-500"/></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">物理库存</label><input type="number" defaultValue={editingItem.stock} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white font-black" /></div>
                            <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase">利润核算备注</label><textarea className="w-full h-24 bg-black border border-white/10 rounded px-3 py-2 text-sm text-white font-bold resize-none" defaultValue={editingItem.notes}></textarea></div>
                            <button onClick={()=>setEditingItem(null)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase italic tracking-widest mt-4">确认同步协议数据</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
