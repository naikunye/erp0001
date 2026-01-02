import React, { useState, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Product } from '../types';
import { 
  Plus, X, Plane, Ship, Image as ImageIcon,
  Save, Search, ChevronRight, Calculator, Zap
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
    const [form, setForm] = useState<Product>({ ...product });

    const analysis = useMemo(() => {
        const stock = form.stock || 0;
        const price = form.price || 0;
        const costPrice = form.costPrice || 0;
        const exchange = 7.2;
        const unitCogsUSD = costPrice / exchange;
        const unitLogisticsUSD = 3.5; 
        const profit = price - unitCogsUSD - unitLogisticsUSD - (price * 0.15);
        return {
            profit: profit.toFixed(2),
            margin: (price > 0 ? (profit / price) * 100 : 0).toFixed(1)
        };
    }, [form]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/50 animate-in fade-in duration-300">
            <div className="apple-vibrancy w-full max-w-[700px] squircle-large overflow-hidden flex flex-col shadow-2xl">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex flex-col">
                        <h3 className="text-[16px] font-semibold text-white">编辑产品协议</h3>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">NODE_ID: {form.sku}</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">物理属性 (Cargo)</label>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <span className="text-[11px] text-white/40 ml-1">显示名称</span>
                                    <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full bg-black/30 border-hairline squircle-pro px-3 py-2 text-[13px] text-white focus:border-ios-blue outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-white/40 ml-1">物理库存</span>
                                        <input type="number" value={form.stock} onChange={e=>setForm({...form, stock:parseInt(e.target.value)})} className="w-full bg-black/30 border-hairline squircle-pro px-3 py-2 text-[13px] text-white font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-white/40 ml-1">采购价 (¥)</span>
                                        <input type="number" value={form.costPrice} onChange={e=>setForm({...form, costPrice:parseFloat(e.target.value)})} className="w-full bg-black/30 border-hairline squircle-pro px-3 py-2 text-[13px] text-white font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">经济模型 (Profit)</label>
                            <div className="bg-ios-blue/5 border border-ios-blue/20 squircle-pro p-4 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[11px] text-ios-blue ml-1">销售定价 ($)</span>
                                    <input type="number" value={form.price} onChange={e=>setForm({...form, price:parseFloat(e.target.value)})} className="w-full bg-transparent border-b border-ios-blue/20 px-1 py-1 text-2xl font-semibold text-white font-mono outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div><p className="text-[9px] text-white/30 uppercase">拟算净利</p><p className="text-lg font-semibold text-ios-green font-mono">${analysis.profit}</p></div>
                                    <div><p className="text-[9px] text-white/30 uppercase">利润率</p><p className="text-lg font-semibold text-white font-mono">{analysis.margin}%</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-white/[0.01]">
                    <button onClick={onClose} className="apple-btn-compact text-white/40 hover:text-white">取消</button>
                    <button 
                        onClick={() => { dispatch({ type: 'UPDATE_PRODUCT', payload: form }); showToast('协议已同步', 'success'); onClose(); }}
                        className="apple-btn-compact bg-ios-blue text-white rounded-md shadow-sm"
                    >
                        同步协议
                    </button>
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