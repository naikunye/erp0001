import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { 
    Search, Plus, Download, Filter, 
    Database, MoreVertical,
    Image as ImageIcon, TrendingUp, Zap
} from 'lucide-react';

const Inventory: React.FC = () => {
    const { state } = useTanxing();
    const [search, setSearch] = useState('');

    const items = (state.products || []).filter(p => !p.deletedAt && (p.sku.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())));

    return (
        <div className="h-full flex flex-col p-8 gap-8">
            {/* 顶栏控制组 */}
            <div className="flex justify-between items-end shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-600/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                        <Database className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-3">资产数字分类账</h2>
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 rounded">Sync_Active</span>
                            <span className="text-[11px] text-slate-600 font-bold uppercase tracking-[0.3em]">Grid Nodes: {items.length} Units</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                            type="text" 
                            placeholder="Search Sku/Identity..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-lg py-3 pl-11 pr-6 text-sm text-slate-200 outline-none focus:border-indigo-500/50 w-[320px] transition-all font-bold placeholder-slate-800 shadow-inner"
                        />
                    </div>
                    <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-lg press-effect">
                        <Plus size={16} /> 资产登记
                    </button>
                    <button className="p-3 precision-surface rounded-lg text-slate-500 hover:text-white press-effect"><Download size={18}/></button>
                </div>
            </div>

            {/* 精密表格区域 */}
            <div className="flex-1 precision-surface rounded-xl overflow-hidden flex flex-col">
                <div className="bg-white/[0.02] px-8 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex gap-10">
                        <button className="text-[11px] font-black text-indigo-400 border-b-2 border-indigo-500 pb-2.5 uppercase tracking-[0.25em]">全量库存</button>
                        <button className="text-[11px] font-black text-slate-600 hover:text-rose-400 pb-2.5 uppercase tracking-[0.25em] transition-colors">告急水位</button>
                        <button className="text-[11px] font-black text-slate-600 hover:text-cyan-400 pb-2.5 uppercase tracking-[0.25em] transition-colors">在途清关</button>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-bold text-slate-600 hover:text-indigo-400 uppercase tracking-widest transition-colors">
                        <Filter size={14}/> 过滤器
                    </button>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse tabular-nums">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-nexus-900 border-b border-white/10 backdrop-blur-3xl">
                                <th className="p-6 w-16 text-center label-swiss">ID</th>
                                <th className="p-6 label-swiss">Identity / SKU</th>
                                <th className="p-6 text-center label-swiss">状态</th>
                                <th className="p-6 text-right label-swiss">物理存量</th>
                                <th className="p-6 text-right label-swiss">消耗率</th>
                                <th className="p-6 text-right label-swiss">单品毛利 ($)</th>
                                <th className="p-6 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {items.map((item, idx) => (
                                <tr key={item.id} className={`group transition-all hover:bg-indigo-500/[0.03] ${item.stock < 10 ? 'bg-rose-500/[0.02]' : ''}`}>
                                    <td className="p-6 text-center font-mono text-[11px] text-slate-700 font-bold">{idx + 1}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-slate-700 shrink-0 border border-white/10 shadow-inner">
                                                <ImageIcon size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[13px] font-black text-white font-mono uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{item.sku}</div>
                                                <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[280px] font-bold uppercase tracking-tight">{item.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-[9px] font-black uppercase tracking-widest ${item.stock < 10 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                            {item.stock < 10 ? 'Stock_Alert' : 'Stable'}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="text-2xl font-black text-white font-mono data-font">{item.stock.toLocaleString()}</div>
                                        <div className="w-20 h-1 bg-black/40 rounded-full mt-2 ml-auto overflow-hidden border border-white/5">
                                            <div className={`h-full transition-all duration-1000 ${item.stock < 10 ? 'bg-rose-500' : 'bg-indigo-500 shadow-[0_0_8px_currentColor]'}`} style={{width: `${Math.min(100, item.stock)}%`}}></div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right font-mono text-[13px] text-slate-500 font-bold uppercase">
                                        {item.dailyBurnRate || 0} <span className="text-[9px] opacity-30 ml-1">PCS/D</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                                            +${(item.price - (item.costPrice || 0) / 7.2).toFixed(2)}
                                        </div>
                                        <span className="text-[9px] text-slate-700 font-black uppercase mt-1 block tracking-widest">Real-time Margin</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button className="p-2 text-slate-800 hover:text-white transition-all"><MoreVertical size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 汇总页脚 */}
                <div className="bg-nexus-900 px-8 py-6 border-t border-white/10 flex justify-between items-center">
                    <div className="flex gap-16">
                        <div className="flex flex-col gap-1">
                            <span className="label-swiss text-[9px] opacity-40">Matrix Value Total</span>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black text-white font-mono data-font">¥ {items.reduce((a,b)=>a+(b.stock*(b.costPrice||0)), 0).toLocaleString()}</span>
                                <div className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                    <TrendingUp size={12}/> +3.2%
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="label-swiss text-[9px] opacity-40">System Accuracy</span>
                            <div className="flex items-center gap-6">
                                <span className="text-3xl font-black text-indigo-400 font-mono data-font">99.98%</span>
                                <div className="w-32 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{width: '99.98%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-5 py-2.5 bg-indigo-600/5 border border-indigo-500/20 rounded-lg">
                        <Zap size={16} className="text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ledger Integrity Verified</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Inventory;