
import React, { useState, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product } from '../types';
import { 
  PackageCheck, Search, Download, X, 
  Sparkles, Calculator, 
  Box, DollarSign, Save,
  Plane, Ship, Info, Image as ImageIcon,
  AlertCircle, TrendingUp, Target, BarChart3, Zap, 
  Link2, Calendar, User, Scale, Ruler, Truck,
  CheckCircle2, Clock, Edit2, AlertTriangle, ExternalLink,
  Plus, Trash2
} from 'lucide-react';

// --- Components ---

const StrategyBadge: React.FC<{ type: string }> = ({ type }) => {
    let color = 'bg-slate-800 text-slate-400 border-slate-700';
    let icon = <Info className="w-3 h-3" />;
    let label = type;
    
    if (type === 'New' || type === '新品测试') {
        color = 'bg-blue-900/30 text-blue-400 border-blue-500/30';
        icon = <Sparkles className="w-3 h-3" />;
        label = 'NEW';
    } else if (type === 'Growing' || type === '爆品增长') {
        color = 'bg-purple-900/30 text-purple-400 border-purple-500/30';
        icon = <TrendingUp className="w-3 h-3" />;
        label = 'HOT';
    } else if (type === 'Stable' || type === '稳定热卖') {
        color = 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30';
        icon = <CheckCircle2 className="w-3 h-3" />;
        label = 'Stable';
    } else if (type === 'Clearance') {
        color = 'bg-red-900/30 text-red-400 border-red-500/30';
        icon = <AlertTriangle className="w-3 h-3" />;
        label = 'Clear';
    }

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${color} uppercase tracking-wider`}>
            {icon}
            <span>{label}</span>
        </div>
    );
};

// --- Edit Modal (High Fidelity Restoration) ---
const EditModal: React.FC<{ product: ReplenishmentItem, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    // Local State for inputs
    const [formData, setFormData] = useState<Product>({
        ...product,
        // Ensure defaults
        dimensions: product.dimensions || { l: 0, w: 0, h: 0 },
        logistics: product.logistics || { method: 'Air', carrier: '', trackingNo: '', unitFreightCost: 0, targetWarehouse: '' },
        economics: product.economics || { platformFeePercent: 0, creatorFeePercent: 0, fixedCost: 0, lastLegShipping: 0, adCost: 0 },
    });

    const handleChange = (field: keyof Product, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (parent: keyof Product, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...(prev[parent] as any), [field]: value }
        }));
    };

    const handleDimensionChange = (dim: 'l'|'w'|'h', val: number) => {
        setFormData(prev => ({
            ...prev,
            dimensions: { ...(prev.dimensions || {l:0,w:0,h:0}), [dim]: val }
        }));
    };

    // Derived calculations for the "Section 3" badge
    const totalVolume = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * (Math.ceil(formData.stock / (formData.itemsPerBox || 1)));
    const totalBoxes = Math.ceil(formData.stock / (formData.itemsPerBox || 1));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80" onClick={onClose}>
            <div className="bg-[#0f1218] w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
               
               {/* Modal Header */}
               <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                   <div>
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">
                           编辑: {formData.name}
                       </h3>
                       <p className="text-xs text-slate-500 mt-1">完善参数以获得更准确的智能补货建议</p>
                   </div>
                   <div className="flex items-center gap-3">
                       <button className="px-3 py-1.5 border border-white/10 rounded text-xs text-slate-400 hover:text-white flex items-center gap-2 hover:bg-white/5 transition-colors">
                           <Clock className="w-3 h-3"/> 变更历史
                       </button>
                       <button onClick={onClose}><X className="w-6 h-6 text-slate-500 hover:text-white" /></button>
                   </div>
               </div>
               
               {/* Modal Content - Bento Grid Layout */}
               <div className="flex-1 overflow-y-auto p-6 bg-[#09090b]">
                   <div className="grid grid-cols-12 gap-6">
                       
                       {/* Section 1: Product & Supply Chain (Top Wide) */}
                       <div className="col-span-12 bg-[#18181b] border border-white/5 rounded-xl p-5">
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                               <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">1</div>
                               产品与供应链
                           </div>
                           <div className="flex gap-6">
                               {/* Image Placeholder */}
                               <div className="w-32 h-32 bg-black/40 rounded-lg border border-white/10 flex flex-col items-center justify-center text-slate-600 shrink-0 relative group cursor-pointer overflow-hidden">
                                   {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 mb-2" />}
                                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Plus className="w-6 h-6 text-white"/>
                                   </div>
                               </div>
                               
                               <div className="flex-1 grid grid-cols-4 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">备货日期 (Restock Date)</label>
                                       <input type="date" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">生命周期阶段</label>
                                       <select 
                                            value={formData.lifecycle} 
                                            onChange={e => handleChange('lifecycle', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                                       >
                                           <option value="New">⚡ 稳定热卖 (Stable)</option>
                                           <option value="Growing">🚀 爆品增长 (Growing)</option>
                                           <option value="Stable">💎 新品测试 (New)</option>
                                           <option value="Clearance">🗑️ 清仓处理 (Clearance)</option>
                                       </select>
                                   </div>
                                   <div className="col-span-2">
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">产品名称</label>
                                       <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                   </div>
                                   <div className="col-span-2">
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">SKU (多标签)</label>
                                       <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded px-3 py-1.5">
                                           <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-500/30">{formData.sku}</span>
                                           <input type="text" className="bg-transparent text-sm text-white focus:outline-none flex-1" placeholder="输入关联 SKU..." />
                                       </div>
                                   </div>
                                   <div className="col-span-1">
                                       <label className="text-[10px] text-amber-500/80 block mb-1 font-bold">生产+物流总时效 (Days)</label>
                                       <div className="relative">
                                           <Clock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-500" />
                                           <input type="number" value={formData.leadTime} onChange={e => handleChange('leadTime', parseInt(e.target.value))} className="w-full bg-amber-900/10 border border-amber-500/30 rounded pl-9 pr-3 py-2 text-sm text-amber-400 focus:border-amber-500 outline-none font-bold font-mono" />
                                       </div>
                                   </div>
                                   <div className="col-span-1">
                                       <label className="text-[10px] text-amber-500/80 block mb-1 font-bold">安全库存天数 (Days)</label>
                                       <div className="relative">
                                           <CheckCircle2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-500" />
                                           <input type="number" value={formData.safetyStockDays} onChange={e => handleChange('safetyStockDays', parseInt(e.target.value))} className="w-full bg-amber-900/10 border border-amber-500/30 rounded pl-9 pr-3 py-2 text-sm text-amber-400 focus:border-amber-500 outline-none font-bold font-mono" />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Section 2: Procurement & CRM (Left) */}
                       <div className="col-span-5 bg-[#18181b] border border-white/5 rounded-xl p-5 flex flex-col">
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                               <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">2</div>
                               采购与供应商 (CRM)
                           </div>
                           <div className="space-y-4 flex-1">
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">供应商名称</label>
                                   <div className="relative">
                                       <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                                       <input type="text" value={formData.supplier} onChange={e => handleChange('supplier', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                   </div>
                               </div>
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">联系方式</label>
                                   <input type="text" value={formData.supplierContact} onChange={e => handleChange('supplierContact', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="微信/Email..." />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">采购单价 (¥/pcs)</label>
                                       <input type="number" value={formData.costPrice} onChange={e => handleChange('costPrice', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" />
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">单个重量 (KG)</label>
                                       <input type="number" value={formData.unitWeight} onChange={e => handleChange('unitWeight', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" />
                                   </div>
                               </div>
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">预估日销 (Daily Sales)</label>
                                   <div className="relative">
                                       <BarChart3 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                                       <input type="number" value={formData.dailyBurnRate} onChange={e => handleChange('dailyBurnRate', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded pl-9 pr-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" />
                                   </div>
                                   <div className="text-[10px] text-emerald-500 text-right mt-1 cursor-pointer hover:underline font-bold">可售天数: {(formData.stock / (formData.dailyBurnRate || 1)).toFixed(0)}天</div>
                               </div>
                           </div>
                       </div>

                       {/* Section 3: Packing (Right Top) */}
                       <div className="col-span-7 bg-[#18181b] border border-white/5 rounded-xl p-5 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-bl-lg border-b border-l border-amber-500/20 shadow-lg">
                               {totalBoxes} 箱 | {totalVolume.toFixed(3)} CBM
                           </div>
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                               <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono">3</div>
                               箱规与入库
                           </div>
                           <div className="grid grid-cols-3 gap-4 mb-4">
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">长 (cm)</label>
                                   <input type="number" value={formData.dimensions?.l} onChange={e => handleDimensionChange('l', parseFloat(e.target.value))} className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-sm text-amber-100 font-mono focus:border-amber-500 outline-none font-bold" />
                               </div>
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">宽 (cm)</label>
                                   <input type="number" value={formData.dimensions?.w} onChange={e => handleDimensionChange('w', parseFloat(e.target.value))} className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-sm text-amber-100 font-mono focus:border-amber-500 outline-none font-bold" />
                               </div>
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">高 (cm)</label>
                                   <input type="number" value={formData.dimensions?.h} onChange={e => handleDimensionChange('h', parseFloat(e.target.value))} className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-sm text-amber-100 font-mono focus:border-amber-500 outline-none font-bold" />
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4 mb-4">
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">每箱数量 (Pcs)</label>
                                   <input type="number" value={formData.itemsPerBox} onChange={e => handleChange('itemsPerBox', parseInt(e.target.value))} className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-sm text-amber-100 font-mono focus:border-amber-500 outline-none font-bold" />
                               </div>
                               <div className="flex items-end gap-2">
                                   <div className="text-amber-500 pb-2 font-bold">x</div>
                                   <div className="flex-1">
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">备货箱数 (Box)</label>
                                       <input type="number" placeholder="自动计算" value={totalBoxes} readOnly className="w-full bg-black/40 border border-amber-900/30 rounded px-3 py-2 text-sm text-amber-100 font-mono focus:border-amber-500 outline-none font-bold opacity-70" />
                                   </div>
                               </div>
                           </div>
                           
                           <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-3">
                               <div className="flex justify-between items-center mb-1">
                                   <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">当前库存总数 (Total Stock)</span>
                                   <span className="text-[9px] text-amber-600 cursor-pointer hover:underline">手动修改库存 &gt;</span>
                               </div>
                               <div className="text-3xl font-black text-amber-100 font-mono tracking-tighter">{formData.stock}</div>
                           </div>

                           <div className="mt-4 pt-4 border-t border-white/5">
                               <label className="text-[10px] text-slate-500 block mb-1 font-bold">预录入库单号</label>
                               <input type="text" value={formData.lingXingId || ''} onChange={e => handleChange('lingXingId', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-slate-300 font-mono focus:border-blue-500 outline-none" placeholder="IB..." />
                           </div>
                       </div>

                       {/* Section 4: Logistics (Left Bottom) */}
                       <div className="col-span-7 bg-[#18181b] border border-white/5 rounded-xl p-5">
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                               <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">4</div>
                               头程物流 (First Leg)
                           </div>
                           <div className="space-y-4">
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">运输渠道</label>
                                   <div className="grid grid-cols-2 gap-2">
                                       <button className={`py-2 text-xs rounded border flex items-center justify-center gap-2 font-bold ${formData.logistics?.method === 'Air' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' : 'bg-black/40 border-white/10 text-slate-400'}`} onClick={() => handleNestedChange('logistics', 'method', 'Air')}>
                                           <Plane className="w-3 h-3" /> 空运 (Air)
                                       </button>
                                       <button className={`py-2 text-xs rounded border flex items-center justify-center gap-2 font-bold ${formData.logistics?.method === 'Sea' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' : 'bg-black/40 border-white/10 text-slate-400'}`} onClick={() => handleNestedChange('logistics', 'method', 'Sea')}>
                                           <Ship className="w-3 h-3" /> 海运 (Sea)
                                       </button>
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">承运商 / 船司</label>
                                       <input type="text" value={formData.logistics?.carrier} onChange={e => handleNestedChange('logistics', 'carrier', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Matson/UPS" />
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">物流追踪号</label>
                                       <div className="relative">
                                           <Truck className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                                           <input type="text" value={formData.logistics?.trackingNo} onChange={e => handleNestedChange('logistics', 'trackingNo', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                       </div>
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">空运单价 (/KG)</label>
                                       <div className="flex items-center gap-1">
                                           <span className="text-slate-400 font-bold">¥</span>
                                           <input type="number" value={formData.logistics?.unitFreightCost} onChange={e => handleNestedChange('logistics', 'unitFreightCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" />
                                       </div>
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">计费总重 (Manual)</label>
                                       <div className="flex items-center gap-1">
                                           <span className="text-slate-400 font-bold">⚖️</span>
                                           <input type="number" placeholder="自动计算" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" />
                                       </div>
                                       <div className="text-[9px] text-right text-slate-600 mt-1">理论实重: 53.50 kg</div>
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">头程总运费 (Total Freight)</label>
                                       <div className="flex items-center gap-1">
                                           <span className="text-slate-400 font-bold">¥</span>
                                           <input type="number" placeholder="手动输入总运费" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" />
                                       </div>
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">耗材/贴标费 (¥)</label>
                                       <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" defaultValue={30} />
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">报关费 (¥)</label>
                                       <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" defaultValue={0} />
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">港口/操作费 (¥)</label>
                                       <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" defaultValue={0} />
                                   </div>
                               </div>
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">目的仓库</label>
                                   <input type="text" value={formData.logistics?.targetWarehouse} onChange={e => handleNestedChange('logistics', 'targetWarehouse', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="火星/休斯顿/美中" />
                                </div>
                           </div>
                       </div>

                       {/* Section 5: Sales (Right Bottom) */}
                       <div className="col-span-5 bg-[#18181b] border border-white/5 rounded-xl p-5">
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                               <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-mono">5</div>
                               TikTok 销售与竞品 (Market Intel)
                           </div>
                           
                           <div className="space-y-4">
                               <div>
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">我方销售价格 ($)</label>
                                   <input type="number" value={formData.price} onChange={e => handleChange('price', parseFloat(e.target.value))} className="w-full bg-black/40 border border-purple-500/30 rounded px-4 py-3 text-lg font-bold text-white font-mono focus:border-purple-500 outline-none" />
                               </div>
                               
                               <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-3">
                                   <div className="flex justify-between items-center mb-2">
                                       <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1"><Target className="w-3 h-3"/> 竞品监控</span>
                                       <span className="text-[9px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold">AI 攻防分析</span>
                                   </div>
                                   <div className="flex gap-2 mb-2">
                                       <input type="text" placeholder="竞品链接/ASIN" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-300" />
                                       <input type="text" placeholder="$ 0" className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 text-center" />
                                   </div>
                               </div>

                               <div>
                                   <label className="text-[10px] text-purple-400 block mb-2 font-bold flex items-center gap-1"><Zap className="w-3 h-3"/> TIKTOK 成本结构</label>
                                   <div className="grid grid-cols-2 gap-2">
                                       <div>
                                           <label className="text-[9px] text-slate-500 font-bold">平台佣金 (%)</label>
                                           <input type="number" value={formData.economics?.platformFeePercent} onChange={e => handleNestedChange('economics', 'platformFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                                       </div>
                                       <div>
                                           <label className="text-[9px] text-slate-500 font-bold">达人佣金 (%)</label>
                                           <input type="number" value={formData.economics?.creatorFeePercent} onChange={e => handleNestedChange('economics', 'creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                                       </div>
                                       <div className="col-span-2 mt-1">
                                           <label className="text-[9px] text-slate-500 font-bold">每单固定费 ($)</label>
                                           <input type="number" value={formData.economics?.fixedCost} onChange={e => handleNestedChange('economics', 'fixedCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                                       </div>
                                       <div className="col-span-2 mt-1">
                                           <label className="text-[9px] text-slate-500 font-bold">预估退货率 (%)</label>
                                           <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" defaultValue={3} />
                                       </div>
                                       <div className="col-span-2 mt-1">
                                           <label className="text-[9px] text-slate-500 font-bold">预估运费 ($)</label>
                                           <input type="number" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white" defaultValue={10} />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Notes Section (Full Width Bottom) */}
                       <div className="col-span-12 bg-[#18181b] border border-white/5 rounded-xl p-5">
                           <label className="text-xs font-bold text-slate-400 block mb-2">备注信息 (Notes)</label>
                           <textarea 
                                value={formData.notes || ''} 
                                onChange={e => handleChange('notes', e.target.value)} 
                                className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-slate-300 focus:border-indigo-500 outline-none resize-none"
                                placeholder="填写备货注意事项、产品细节说明等..."
                           />
                       </div>

                   </div>
               </div>

               {/* Footer */}
               <div className="p-4 border-t border-white/10 bg-[#18181b] flex justify-center items-center">
                   <button onClick={() => onSave(formData)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                       <Save className="w-4 h-4" /> 保存修改并记录日志
                   </button>
               </div>
            </div>
        </div>
    );
};

const Replenishment: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<ReplenishmentItem | null>(null);

    // Transform products to ReplenishmentItems
    const replenishmentItems: ReplenishmentItem[] = useMemo(() => {
        return state.products.map(p => {
            const dailyBurnRate = p.dailyBurnRate || 0;
            const stock = p.stock || 0;
            const daysRemaining = dailyBurnRate > 0 ? Math.floor(stock / dailyBurnRate) : 999;
            const leadTime = p.leadTime || 30;
            const safetyStock = (p.safetyStockDays || 15) * dailyBurnRate;
            const reorderPoint = safetyStock + (leadTime * dailyBurnRate);
            
            return {
                ...p,
                dailyBurnRate,
                daysRemaining,
                safetyStock,
                reorderPoint,
                totalInvestment: stock * (p.costPrice || 0),
                freightCost: stock * (p.logistics?.unitFreightCost || 0),
                goodsCost: stock * (p.costPrice || 0),
                revenue30d: dailyBurnRate * 30 * p.price,
                growth: 0, 
                profit: 0,
                totalPotentialProfit: 0,
                totalWeight: stock * (p.unitWeight || 0),
                boxes: Math.ceil(stock / (p.itemsPerBox || 1))
            };
        });
    }, [state.products]);

    const filteredItems = replenishmentItems.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveProduct = (updatedProduct: Product) => {
        dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        setEditingItem(null);
        showToast('商品策略已更新', 'success');
    };

    return (
        <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-[#0f1218]">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1e1e24]/50 backdrop-blur-md z-20">
                <div>
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <PackageCheck className="w-5 h-5 text-indigo-500" />
                        智能备货清单 (Replenishment List)
                    </h2>
                    <div className="text-xs text-slate-500 mt-1 flex gap-2">
                        <span>SKU 总数: <span className="text-white font-mono font-bold">{filteredItems.length}</span></span>
                        <span className="w-px h-3 bg-white/10"></span>
                        <span>资金占用: <span className="text-emerald-400 font-mono font-bold">¥{filteredItems.reduce((a,b)=>a+b.totalInvestment, 0).toLocaleString()}</span></span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 group-hover:text-white transition-colors" />
                        <input 
                            type="text" 
                            placeholder="搜索 SKU / 名称..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-64 pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600"
                        />
                    </div>
                    <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-1 transition-all">
                        <Plus className="w-3.5 h-3.5"/> 添加 SKU
                    </button>
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10">
                        <Download className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto bg-[#0a0a0c]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1e1e24] sticky top-0 z-10 shadow-sm border-b border-white/5">
                        <tr>
                            <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded bg-black/40 border-white/20"/></th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-48">SKU / 阶段</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-64">产品信息 / 供应商</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-48">物流状态 (Tracking)</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-32">资金投入</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-40">库存数量</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-48">备注信息</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-32">销售表现</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-20 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-4"><input type="checkbox" className="rounded bg-black/40 border-white/20"/></td>
                                
                                {/* SKU / Stage */}
                                <td className="px-4 py-4 align-top">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.dailyBurnRate > 5 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`}></div>
                                            <span className="text-xl font-bold text-white tracking-tight font-mono">{item.sku}</span>
                                            <ExternalLink className="w-3 h-3 text-slate-600 hover:text-white cursor-pointer"/>
                                        </div>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>

                                {/* Product Info */}
                                <td className="px-4 py-4 align-top">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-white/5 rounded border border-white/10 shrink-0 overflow-hidden">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-600 m-auto mt-3"/>}
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate" title={item.name}>{item.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1"><Box className="w-3 h-3"/> {item.supplier || '阳江老罗'}</div>
                                            {/* PURPLE LX BADGE */}
                                            <div className="text-[10px] bg-[#312e81] text-[#a5b4fc] px-1.5 py-0.5 rounded w-fit border border-[#4338ca] font-mono font-bold tracking-tight">
                                                LX: {item.lingXingId || 'IB112251215RS'}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Logistics */}
                                <td className="px-4 py-4 align-top">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                                            <Plane className="w-3.5 h-3.5" />
                                            <span>{item.logistics?.method || 'Air'}</span>
                                        </div>
                                        <a href="#" className="text-[10px] text-blue-300/70 hover:text-blue-300 underline block truncate max-w-[120px] font-mono">
                                            {item.logistics?.trackingNo || '1Z9WV5620495954082'}
                                        </a>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            {item.totalWeight?.toFixed(1)}kg / {item.boxes}box
                                        </div>
                                    </div>
                                </td>

                                {/* Investment */}
                                <td className="px-4 py-4 align-top">
                                    <div className="font-mono space-y-1">
                                        <div className="text-sm font-bold text-emerald-400">¥{item.totalInvestment.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500">货值: ¥{item.goodsCost.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500">运费: ¥{item.freightCost.toLocaleString()}</div>
                                    </div>
                                </td>

                                {/* Inventory */}
                                <td className="px-4 py-4 align-top">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-end gap-1">
                                            <span className="text-lg font-bold text-white font-mono">{item.stock}</span>
                                            <span className="text-xs text-slate-500 mb-0.5">件</span>
                                        </div>
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit border ${item.daysRemaining < 15 ? 'text-red-400 bg-red-900/20 border-red-500/30' : 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30'}`}>
                                            可售: {item.daysRemaining} 天
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${item.daysRemaining < 15 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                                style={{width: `${Math.min(100, (item.daysRemaining / 45)*100)}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </td>

                                {/* Remarks (New Column) */}
                                <td className="px-4 py-4 align-top">
                                    <div className="text-xs text-slate-400 max-w-[180px] line-clamp-3 leading-relaxed hover:text-white transition-colors cursor-text" title={item.notes}>
                                        {item.notes || '-'}
                                    </div>
                                </td>

                                {/* Sales */}
                                <td className="px-4 py-4 align-top">
                                    <div className="font-mono">
                                        <div className="text-sm font-bold text-white">${item.revenue30d.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500">/30天</div>
                                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5 font-bold">
                                            <TrendingUp className="w-3 h-3"/> {(Math.random() * 20 + 5).toFixed(1)}%
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">日销: {item.dailyBurnRate} 件</div>
                                    </div>
                                </td>

                                {/* Action */}
                                <td className="px-4 py-4 align-top text-right">
                                    <div className="flex flex-col gap-2 items-end opacity-40 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingItem(item)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="编辑">
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors" title="删除">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && (
                <EditModal 
                    product={editingItem} 
                    onClose={() => setEditingItem(null)} 
                    onSave={handleSaveProduct}
                />
            )}
        </div>
    );
};

export default Replenishment;
