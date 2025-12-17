
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product } from '../types';
import { 
  PackageCheck, Search, Download, X, 
  Sparkles, Calculator, 
  Box, DollarSign, Save,
  Plane, Ship, Info, Image as ImageIcon,
  AlertCircle, TrendingUp, TrendingDown, Target, BarChart3, Zap, 
  Link2, Calendar, User, Scale, Ruler, Truck,
  CheckCircle2, Clock, Edit2, AlertTriangle, ExternalLink,
  Plus, Trash2, Upload, Link as LinkIcon, ChevronLeft, ChevronRight, Wallet
} from 'lucide-react';

// --- Components ---

const getTrackingUrl = (carrier: string = '', trackingNo: string = '') => {
    if (!trackingNo) return '#';
    const c = carrier.toLowerCase();
    if (c.includes('ups')) return `https://www.ups.com/track?loc=zh_CN&tracknum=${trackingNo}`;
    if (c.includes('dhl')) return `https://www.dhl.com/cn-zh/home/tracking.html?tracking-id=${trackingNo}`;
    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNo}`;
    if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNo}`;
    if (c.includes('matson')) return `https://www.matson.com/tracking.html`;
    return `https://www.google.com/search?q=${carrier}+tracking+${trackingNo}`;
};

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
        economics: product.economics || { platformFeePercent: 0, creatorFeePercent: 0, fixedCost: 0, lastLegShipping: 0, adCost: 0, refundRatePercent: 0 },
    });
    
    // Gallery State
    const [gallery, setGallery] = useState<string[]>(
        (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : [])
    );
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // SKU Tags State
    const [skuTags, setSkuTags] = useState<string[]>(
        product.sku ? product.sku.split(',').map(s => s.trim()).filter(Boolean) : []
    );
    const [skuInput, setSkuInput] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync formData images when gallery changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            images: gallery,
            image: gallery.length > 0 ? gallery[0] : undefined
        }));
    }, [gallery]);

    // Sync formData sku when tags change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            sku: skuTags.join(', ')
        }));
    }, [skuTags]);

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
    
    // --- Gallery Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newImg = reader.result as string;
                setGallery(prev => [...prev, newImg]);
                setActiveImageIndex(gallery.length); // Point to the new (last) image
            };
            reader.readAsDataURL(file);
        }
        // Reset input to allow same file selection
        e.target.value = '';
    };

    const handleUrlInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const url = e.currentTarget.value.trim();
            if (url) {
                setGallery(prev => [...prev, url]);
                setActiveImageIndex(gallery.length);
                e.currentTarget.value = '';
            }
        }
    };

    const handleRemoveImage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newGallery = gallery.filter((_, i) => i !== index);
        setGallery(newGallery);
        if (activeImageIndex >= index && activeImageIndex > 0) {
            setActiveImageIndex(activeImageIndex - 1);
        }
    };

    // --- SKU Tag Handlers ---
    const handleSkuKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = skuInput.trim();
            if (val && !skuTags.includes(val)) {
                setSkuTags([...skuTags, val]);
                setSkuInput('');
            }
        } else if (e.key === 'Backspace' && !skuInput && skuTags.length > 0) {
            setSkuTags(skuTags.slice(0, -1));
        }
    };

    const removeSkuTag = (tagToRemove: string) => {
        setSkuTags(skuTags.filter(t => t !== tagToRemove));
    };

    // Derived calculations for the "Section 3" badge
    const totalVolume = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * (Math.ceil(formData.stock / (formData.itemsPerBox || 1)));
    const totalBoxes = Math.ceil(formData.stock / (formData.itemsPerBox || 1));

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80" onClick={onClose}>
            <div className="ios-glass-panel w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 bg-[#121217]" onClick={e => e.stopPropagation()}>
               {/* Modal Header */}
               <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
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
               <div className="flex-1 overflow-y-auto p-6 bg-black/40">
                   <div className="grid grid-cols-12 gap-6">
                       
                       {/* Section 1: Product & Supply Chain (Top Wide) */}
                       <div className="col-span-12 bg-white/5 border border-white/5 rounded-xl p-5">
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2">
                               <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">1</div>
                               产品与供应链 (Product & Gallery)
                           </div>
                           <div className="flex gap-6">
                               {/* Gallery Section */}
                               <div className="flex flex-col gap-3 w-48 shrink-0">
                                   <div className="flex justify-between items-center">
                                       <label className="text-[10px] text-slate-500 font-bold">画廊 ({gallery.length})</label>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-2">
                                       {gallery.map((img, idx) => (
                                           <div 
                                                key={idx} 
                                                className={`aspect-square rounded-lg border relative group overflow-hidden cursor-pointer ${activeImageIndex === idx ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-white/10'}`}
                                                onClick={() => setActiveImageIndex(idx)}
                                           >
                                               <img src={img} className="w-full h-full object-cover" alt="Product" />
                                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                               <button 
                                                    onClick={(e) => handleRemoveImage(idx, e)}
                                                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all transform scale-90 hover:scale-100"
                                               >
                                                   <X className="w-3 h-3" />
                                               </button>
                                           </div>
                                       ))}
                                       {/* Add Button */}
                                       <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-lg border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 flex items-center justify-center text-slate-400 hover:text-white transition-all group"
                                       >
                                           <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                       </button>
                                   </div>
                                   
                                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                                   <div className="relative">
                                       <LinkIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                       <input 
                                           type="text" 
                                           placeholder="URL..."
                                           className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-2 text-xs text-white focus:border-indigo-500 outline-none placeholder-slate-600"
                                           onKeyDown={handleUrlInputKeyDown}
                                       />
                                   </div>
                               </div>
                               
                               <div className="flex-1 grid grid-cols-4 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">备货日期</label>
                                       <input type="date" className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">生命周期阶段</label>
                                       <select 
                                            value={formData.lifecycle} 
                                            onChange={e => handleChange('lifecycle', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none appearance-none"
                                       >
                                           <option value="New">💎 新品测试 (New)</option>
                                           <option value="Growing">🚀 爆品增长 (Growing)</option>
                                           <option value="Stable">⚡ 稳定热卖 (Stable)</option>
                                           <option value="Clearance">🗑️ 清仓处理 (Clearance)</option>
                                       </select>
                                   </div>
                                   <div className="col-span-2">
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">产品名称</label>
                                       <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                   </div>
                                   
                                   {/* Multi-SKU Tag Input */}
                                   <div className="col-span-2">
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">SKU (Multi-Tag)</label>
                                       <div className="flex flex-wrap items-center gap-1.5 bg-black/40 border border-white/10 rounded px-3 py-2 min-h-[42px]">
                                           {skuTags.map(tag => (
                                               <span key={tag} className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-500/30 font-mono flex items-center gap-1">
                                                   {tag}
                                                   <button onClick={() => removeSkuTag(tag)} className="hover:text-white"><X className="w-3 h-3"/></button>
                                               </span>
                                           ))}
                                           <input 
                                                type="text" 
                                                value={skuInput} 
                                                onChange={e => setSkuInput(e.target.value)}
                                                onKeyDown={handleSkuKeyDown}
                                                className="bg-transparent text-sm text-white focus:outline-none flex-1 font-mono min-w-[80px]" 
                                                placeholder={skuTags.length === 0 ? "输入 SKU 并回车..." : "添加更多..."}
                                           />
                                       </div>
                                   </div>

                                   <div className="col-span-1">
                                       <label className="text-[10px] text-amber-500/80 block mb-1 font-bold">生产+物流总时效</label>
                                       <div className="relative">
                                           <Clock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-500" />
                                           <input type="number" value={formData.leadTime} onChange={e => handleChange('leadTime', parseInt(e.target.value))} className="w-full bg-amber-900/10 border border-amber-500/30 rounded pl-9 pr-3 py-2 text-sm text-amber-400 focus:border-amber-500 outline-none font-bold font-mono" />
                                       </div>
                                   </div>
                                   <div className="col-span-1">
                                       <label className="text-[10px] text-amber-500/80 block mb-1 font-bold">安全库存天数</label>
                                       <div className="relative">
                                           <CheckCircle2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-500" />
                                           <input type="number" value={formData.safetyStockDays} onChange={e => handleChange('safetyStockDays', parseInt(e.target.value))} className="w-full bg-amber-900/10 border border-amber-500/30 rounded pl-9 pr-3 py-2 text-sm text-amber-400 focus:border-amber-500 outline-none font-bold font-mono" />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Section 2: Procurement & CRM (Left) */}
                       <div className="col-span-5 bg-white/5 border border-white/5 rounded-xl p-5 flex flex-col">
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
                       <div className="col-span-7 bg-white/5 border border-white/5 rounded-xl p-5 relative overflow-hidden">
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
                                   <label className="text-[10px] text-slate-500 block mb-1 font-bold">备货数量</label>
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
                               <div className="flex items-center gap-2">
                                   <input 
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => handleChange('stock', parseInt(e.target.value))}
                                        className="text-3xl font-black text-amber-100 font-mono tracking-tighter bg-transparent border-none outline-none w-full"
                                   />
                               </div>
                           </div>

                           <div className="mt-4 pt-4 border-t border-white/10">
                               <label className="text-[10px] text-slate-500 block mb-1 font-bold">预录入库单号</label>
                               <input type="text" value={formData.lingXingId || ''} onChange={e => handleChange('lingXingId', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-slate-300 font-mono focus:border-blue-500 outline-none" placeholder="IB..." />
                           </div>
                       </div>

                       {/* Section 4: Logistics (Left Bottom) */}
                       <div className="col-span-7 bg-white/5 border border-white/5 rounded-xl p-5">
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
                                           <div className="flex bg-black/40 border border-white/10 rounded-l overflow-hidden">
                                               <span className="px-2 py-2 text-[10px] text-slate-400 font-bold bg-white/5 border-r border-white/10">¥</span>
                                           </div>
                                           <input 
                                                type="number" 
                                                value={formData.logistics?.unitFreightCost} 
                                                onChange={e => handleNestedChange('logistics', 'unitFreightCost', parseFloat(e.target.value))} 
                                                className="w-full bg-black/40 border border-white/10 rounded-r px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" 
                                           />
                                       </div>
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">计费总重 (Manual)</label>
                                       <div className="flex items-center gap-1">
                                           <div className="flex bg-black/40 border border-white/10 rounded-l overflow-hidden">
                                               <span className="px-2 py-2 text-[10px] text-slate-400 font-bold bg-white/5 border-r border-white/10">⚖️</span>
                                           </div>
                                           <input 
                                                type="number" 
                                                value={formData.logistics?.billingWeight} 
                                                onChange={e => handleNestedChange('logistics', 'billingWeight', parseFloat(e.target.value))} 
                                                className="w-full bg-black/40 border border-white/10 rounded-r px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" 
                                                placeholder="0"
                                           />
                                       </div>
                                       <div className="text-[9px] text-right text-slate-600 mt-1 font-mono">理论实重: {(formData.stock * (formData.unitWeight || 0)).toFixed(2)} kg</div>
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">耗材/贴标费 (¥)</label>
                                       <input 
                                            type="number" 
                                            value={formData.logistics?.consumablesFee} 
                                            onChange={e => handleNestedChange('logistics', 'consumablesFee', parseFloat(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" 
                                            placeholder="30"
                                       />
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">报关费 (¥)</label>
                                       <input 
                                            type="number" 
                                            value={formData.logistics?.customsFee} 
                                            onChange={e => handleNestedChange('logistics', 'customsFee', parseFloat(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" 
                                            placeholder="0"
                                       />
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">港口/操作费 (¥)</label>
                                       <input 
                                            type="number" 
                                            value={formData.logistics?.portFee} 
                                            onChange={e => handleNestedChange('logistics', 'portFee', parseFloat(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none font-bold" 
                                            placeholder="0"
                                       />
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-slate-500 block mb-1 font-bold">目的仓库</label>
                                       <input type="text" value={formData.logistics?.targetWarehouse} onChange={e => handleNestedChange('logistics', 'targetWarehouse', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="火星/休斯顿/美中" />
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Section 5: Sales (Right Bottom) */}
                       <div className="col-span-5 bg-white/5 border border-white/5 rounded-xl p-5">
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

                               <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
                                   <label className="text-[10px] text-purple-400 block mb-3 font-bold flex items-center gap-1 uppercase tracking-wider"><Zap className="w-3 h-3"/> TikTok Cost Structure</label>
                                   <div className="grid grid-cols-2 gap-3">
                                       <div>
                                           <label className="text-[9px] text-slate-500 font-bold block mb-1">平台佣金 (%)</label>
                                           <input type="number" value={formData.economics?.platformFeePercent} onChange={e => handleNestedChange('economics', 'platformFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white outline-none focus:border-purple-500" placeholder="2" />
                                       </div>
                                       <div>
                                           <label className="text-[9px] text-slate-500 font-bold block mb-1">达人佣金 (%)</label>
                                           <input type="number" value={formData.economics?.creatorFeePercent} onChange={e => handleNestedChange('economics', 'creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white outline-none focus:border-purple-500" placeholder="10" />
                                       </div>
                                       <div className="col-span-2">
                                           <label className="text-[9px] text-slate-500 font-bold block mb-1">每单固定费 ($)</label>
                                           <input type="number" value={formData.economics?.fixedCost} onChange={e => handleNestedChange('economics', 'fixedCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white outline-none focus:border-purple-500" placeholder="0.3" />
                                       </div>
                                       <div>
                                           <label className="text-[9px] text-slate-500 font-bold block mb-1">预估退货率 (%)</label>
                                           <input type="number" value={formData.economics?.refundRatePercent} onChange={e => handleNestedChange('economics', 'refundRatePercent', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white outline-none focus:border-purple-500" placeholder="3" />
                                       </div>
                                       <div>
                                           <label className="text-[9px] text-slate-500 font-bold block mb-1">尾程派送费 ($)</label>
                                           <input type="number" value={formData.economics?.lastLegShipping} onChange={e => handleNestedChange('economics', 'lastLegShipping', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white outline-none focus:border-purple-500" placeholder="5.44" />
                                       </div>
                                       <div className="col-span-2">
                                           <label className="text-[9px] text-slate-500 font-bold block mb-1">预估广告费 ($)</label>
                                           <input type="number" value={formData.economics?.adCost} onChange={e => handleNestedChange('economics', 'adCost', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white outline-none focus:border-purple-500" placeholder="10" />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Notes Section (Full Width Bottom) */}
                       <div className="col-span-12 bg-white/5 border border-white/5 rounded-xl p-5">
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
               <div className="p-4 border-t border-white/10 bg-white/5 flex justify-center items-center">
                   <button onClick={() => onSave(formData)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                       <Save className="w-4 h-4" /> 保存修改并记录日志
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
    const [editingItem, setEditingItem] = useState<ReplenishmentItem | null>(null);

    // Deep Linking: Auto-filter from navigation params
    useEffect(() => {
        if (state.navParams?.searchQuery) {
            setSearchTerm(state.navParams.searchQuery);
            // Optional: Auto-open edit modal if it's a direct SKU match?
            // For now, just filter is enough.
            dispatch({ type: 'CLEAR_NAV_PARAMS' });
        }
    }, [state.navParams, dispatch]);

    // Calculate Real Revenue & Growth from Orders
    const productStats = useMemo(() => {
        const stats: Record<string, { revenue30d: number, revenuePrev30d: number }> = {};
        const now = new Date();
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
        const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(now.getDate() - 60);

        state.orders.forEach(order => {
            const orderDate = new Date(order.date);
            if (order.status === 'cancelled') return;

            order.lineItems?.forEach(item => {
                if (!stats[item.productId]) stats[item.productId] = { revenue30d: 0, revenuePrev30d: 0 };
                
                const amount = item.price * item.quantity;
                if (orderDate >= thirtyDaysAgo) {
                    stats[item.productId].revenue30d += amount;
                } else if (orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo) {
                    stats[item.productId].revenuePrev30d += amount;
                }
            });
        });
        return stats;
    }, [state.orders]);

    // Transform products to ReplenishmentItems
    const replenishmentItems: ReplenishmentItem[] = useMemo(() => {
        return state.products
            .filter(p => !p.deletedAt)
            .map(p => {
            const dailyBurnRate = p.dailyBurnRate || 0;
            const stock = p.stock || 0;
            const daysRemaining = dailyBurnRate > 0 ? Math.floor(stock / dailyBurnRate) : 999;
            const leadTime = p.leadTime || 30;
            const safetyStock = (p.safetyStockDays || 15) * dailyBurnRate;
            const reorderPoint = safetyStock + (leadTime * dailyBurnRate);
            
            const pStats = productStats[p.id] || { revenue30d: 0, revenuePrev30d: 0 };
            const growth = pStats.revenuePrev30d > 0 
                ? ((pStats.revenue30d - pStats.revenuePrev30d) / pStats.revenuePrev30d) * 100 
                : 0;

            // --- REAL PROFIT CALCULATION ---
            // Unit Profit = Price - (COGS + Freight + Fees + Ads + etc)
            
            // 1. Exchange Rate (CNY to USD for costs)
            const exchangeRate = 7.2;

            // 2. Base Costs in USD
            const priceUSD = p.price || 0;
            const costPriceUSD = (p.costPrice || 0) / exchangeRate;

            // 3. Logistics: Rate (CNY/KG) * Weight (KG)
            const freightRateCNY = p.logistics?.unitFreightCost || 0; 
            const weightKG = p.unitWeight || 0;
            const freightCostUSD = (freightRateCNY * weightKG) / exchangeRate;

            // 4. TikTok/Marketing Costs (USD)
            const eco = p.economics || {};
            const platformFee = priceUSD * ((eco.platformFeePercent || 0) / 100);
            const creatorFee = priceUSD * ((eco.creatorFeePercent || 0) / 100);
            const fixedFee = eco.fixedCost || 0;
            const lastLeg = eco.lastLegShipping || 0;
            const adSpend = eco.adCost || 0;
            const estimatedRefundCost = priceUSD * ((eco.refundRatePercent || 0) / 100); 

            // 5. Total Unit Cost & Profit
            const totalUnitCost = costPriceUSD + freightCostUSD + platformFee + creatorFee + fixedFee + lastLeg + adSpend + estimatedRefundCost;
            const unitProfit = priceUSD - totalUnitCost;
            
            return {
                ...p,
                dailyBurnRate,
                daysRemaining,
                safetyStock,
                reorderPoint,
                totalInvestment: stock * (p.costPrice || 0), // Kept in CNY for investment view
                freightCost: stock * (p.logistics?.unitFreightCost || 0), // Kept in CNY
                goodsCost: stock * (p.costPrice || 0), // Kept in CNY
                revenue30d: pStats.revenue30d, // REAL REVENUE (USD)
                growth: growth,                 // REAL GROWTH
                profit: unitProfit, // UNIT PROFIT (USD)
                margin: p.price > 0 ? (unitProfit / p.price) * 100 : 0, // MARGIN %
                totalWeight: stock * (p.unitWeight || 0),
                boxes: Math.ceil(stock / (p.itemsPerBox || 1))
            };
        });
    }, [state.products, productStats]);

    const filteredItems = replenishmentItems.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveProduct = (updatedProduct: Product) => {
        const exists = state.products.find(p => p.id === updatedProduct.id);
        if (exists) {
            dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
        } else {
            dispatch({ type: 'ADD_PRODUCT', payload: updatedProduct });
        }
        setEditingItem(null);
        showToast('商品策略已更新', 'success');
    };

    const handleAddNew = () => {
        const newProduct: ReplenishmentItem = {
            id: `NEW-${Date.now()}`,
            name: '',
            sku: '',
            category: 'Uncategorized',
            stock: 0,
            price: 0,
            status: 'draft',
            lastUpdated: new Date().toISOString(),
            dailyBurnRate: 0,
            daysRemaining: 999,
            safetyStock: 0,
            reorderPoint: 0,
            totalInvestment: 0,
            freightCost: 0,
            goodsCost: 0,
            revenue30d: 0,
            growth: 0,
            profit: 0,
            margin: 0,
            totalWeight: 0,
            boxes: 0,
            lifecycle: 'New',
            dimensions: { l: 0, w: 0, h: 0 },
            logistics: { method: 'Air', carrier: '', trackingNo: '', unitFreightCost: 0, targetWarehouse: '' },
            economics: { platformFeePercent: 0, creatorFeePercent: 0, fixedCost: 0, lastLegShipping: 0, adCost: 0 }
        };
        setEditingItem(newProduct);
    };

    const handleDelete = (id: string) => {
        if(confirm('确定要删除此商品吗？')) {
            dispatch({ type: 'DELETE_PRODUCT', payload: id });
            showToast('商品已删除', 'info');
        }
    };

    return (
        <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/20">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md z-20">
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
                    <button 
                        onClick={handleAddNew}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-1 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5"/> 添加 SKU
                    </button>
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10">
                        <Download className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto bg-transparent">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-white/5">
                        <tr>
                            <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded bg-black/40 border-white/20"/></th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-48">SKU / 阶段</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-64">产品信息 / 供应商</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-48">物流状态 (Tracking)</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-32">资金投入</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-40">库存数量</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-32">销售 & 利润</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-48">备注信息</th>
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
                                        <div className="w-12 h-12 bg-white/5 rounded border border-white/10 shrink-0 overflow-hidden relative">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-600 m-auto mt-3"/>}
                                            {item.images && item.images.length > 1 && (
                                                <div className="absolute bottom-0 right-0 bg-black/60 text-[9px] text-white px-1 rounded-tl-sm">+{item.images.length-1}</div>
                                            )}
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
                                        <a 
                                            href={getTrackingUrl(item.logistics?.carrier, item.logistics?.trackingNo)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-blue-300/70 hover:text-blue-300 underline block truncate max-w-[120px] font-mono"
                                        >
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

                                {/* Sales & Profit (UPDATED) */}
                                <td className="px-4 py-4 align-top">
                                    <div className="font-mono space-y-2">
                                        <div>
                                            <div className="text-xs text-slate-500">30天营收</div>
                                            <div className="text-sm font-bold text-white">${item.revenue30d.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white/5 p-1.5 rounded border border-white/5">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <Wallet className="w-3 h-3 text-indigo-400" />
                                                <span className="text-[10px] text-slate-400">单品净利</span>
                                            </div>
                                            <div className={`text-xs font-bold ${item.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                ${item.profit.toFixed(2)} <span className="opacity-70 text-[9px]">({item.margin?.toFixed(0)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Remarks (New Column Position) */}
                                <td className="px-4 py-4 align-top">
                                    <div className="text-xs text-slate-400 max-w-[180px] line-clamp-3 leading-relaxed hover:text-white transition-colors cursor-text" title={item.notes}>
                                        {item.notes || '-'}
                                    </div>
                                </td>

                                {/* Action */}
                                <td className="px-4 py-4 align-top text-right">
                                    <div className="flex flex-col gap-2 items-end opacity-40 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingItem(item)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="编辑">
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors" title="删除">
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

export default Inventory;
