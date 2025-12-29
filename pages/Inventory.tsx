
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, AuditLog, Shipment } from '../types';
import { 
  PackageCheck, Search, Download, X, 
  Sparkles, Calculator, 
  Box, DollarSign, Save,
  Plane, Ship, Info, Image as ImageIcon,
  AlertCircle, TrendingUp, TrendingDown, Target, BarChart3, Zap, 
  Link2, Calendar, User, Scale, Ruler, Truck,
  CheckCircle2, Clock, Edit2, AlertTriangle, ExternalLink,
  Plus, Trash2, Upload, Link as LinkIcon, ChevronLeft, ChevronRight, Wallet,
  PieChart, FileDown, Copy, CopyPlus, History, History as HistoryIcon,
  ArrowRight, Coins, RefreshCw
} from 'lucide-react';

const compressImage = (base64Str: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
    });
};

const getTrackingUrl = (carrier: string = '', trackingNo: string = '') => {
    const t = trackingNo.trim();
    if (!t) return '#';
    const c = carrier.toLowerCase().trim();
    if (t.toUpperCase().startsWith('1Z') || c.includes('ups')) return `https://www.ups.com/track?loc=zh_CN&tracknum=${t}`;
    if (c.includes('dhl')) return `https://www.dhl.com/cn-zh/home/tracking.html?tracking-id=${t}`;
    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
    if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
    if (c.includes('matson')) return `https://www.matson.com/tracking.html`;
    return `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${encodeURIComponent(t)}`;
};

const StrategyBadge: React.FC<{ type: string }> = ({ type }) => {
    let color = 'bg-slate-800 text-slate-400 border-slate-700';
    let icon = <Info className="w-3 h-3" />;
    let label = type;
    if (type === 'New' || type === '新品测试') { color = 'bg-blue-900/30 text-blue-400 border-blue-500/30'; icon = <Sparkles className="w-3 h-3" />; label = 'NEW'; }
    else if (type === 'Growing' || type === '爆品增长') { color = 'bg-purple-900/30 text-purple-400 border-purple-500/30'; icon = <TrendingUp className="w-3 h-3" />; label = 'HOT'; }
    else if (type === 'Stable' || type === '稳定热卖') { color = 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'; icon = <CheckCircle2 className="w-3 h-3" />; label = 'Stable'; }
    else if (type === 'Clearance') { color = 'bg-red-900/30 text-red-400 border-red-500/30'; icon = <AlertTriangle className="w-3 h-3" />; label = 'Clear'; }
    return <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${color} uppercase tracking-wider`}>{icon}<span>{label}</span></div>;
};

const EditModal: React.FC<{ product: ReplenishmentItem, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    const { state } = useTanxing();
    const [isCompresing, setIsCompressing] = useState(false);
    const exchangeRate = state.exchangeRate || 7.2;

    const [formData, setFormData] = useState<Product>({
        ...product,
        dimensions: product.dimensions || { l: 0, w: 0, h: 0 },
        logistics: product.logistics || { method: 'Air', carrier: '', trackingNo: '', unitFreightCost: 0, targetWarehouse: '' },
        economics: product.economics || { platformFeePercent: 0, creatorFeePercent: 0, fixedCost: 0, lastLegShipping: 0, adCost: 0, refundRatePercent: 0 },
        boxCount: product.boxCount ?? 0,
    });
    
    const [gallery, setGallery] = useState<string[]>( (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []) );
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [skuTags, setSkuTags] = useState<string[]>( product.sku ? product.sku.split(',').map(s => s.trim()).filter(Boolean) : [] );
    const [skuInput, setSkuInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(prev => ({ ...prev, images: gallery, image: gallery.length > 0 ? gallery[0] : undefined }));
    }, [gallery]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, sku: skuTags.join(', ') }));
    }, [skuTags]);

    const handleChange = (field: keyof Product, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); };
    const handleNestedChange = (parent: keyof Product, field: string, value: any) => { setFormData(prev => ({ ...prev, [parent]: { ...(prev[parent] as any), [field]: value } })); };
    const handleDimensionChange = (dim: 'l'|'w'|'h', val: number) => { setFormData(prev => ({ ...prev, dimensions: { ...(prev.dimensions || {l:0,w:0,h:0}), [dim]: val } })); };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsCompressing(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const originalBase64 = reader.result as string;
                const compressed = await compressImage(originalBase64);
                setGallery(prev => [...prev, compressed]);
                setActiveImageIndex(gallery.length);
                setIsCompressing(false);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleRemoveImage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newGallery = gallery.filter((_, i) => i !== index);
        setGallery(newGallery);
        if (activeImageIndex >= index && activeImageIndex > 0) { setActiveImageIndex(activeImageIndex - 1); }
    };

    const handleSkuKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const val = skuInput.trim(); if (val && !skuTags.includes(val)) { setSkuTags([...skuTags, val]); setSkuInput(''); } }
        else if (e.key === 'Backspace' && !skuInput && skuTags.length > 0) { setSkuTags(skuTags.slice(0, -1)); }
    };

    // 辅助计算：单品材积、运费等
    const manualBoxes = formData.boxCount || 0;
    const totalVolume = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * manualBoxes;
    const unitRealWeight = formData.unitWeight || 0;
    const unitVolWeight = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0)) / 6000;
    const autoUnitChargeableWeight = Math.max(unitRealWeight, unitVolWeight);
    let activeTotalBillingWeight = 0;
    if (formData.logistics?.billingWeight) activeTotalBillingWeight = formData.logistics.billingWeight;
    else activeTotalBillingWeight = autoUnitChargeableWeight * formData.stock;
    
    const rate = formData.logistics?.unitFreightCost || 0;
    const effectiveTotalFreightCNY = formData.logistics?.totalFreightCost ?? (activeTotalBillingWeight * rate + (formData.logistics?.customsFee || 0) + (formData.logistics?.portFee || 0));
    const totalConsumablesCNY = (formData.logistics?.consumablesFee || 0) * formData.stock;
    const allInLogisticsTotalCNY = effectiveTotalFreightCNY + totalConsumablesCNY;
    const effectiveUnitLogisticsCNY = formData.stock > 0 ? allInLogisticsTotalCNY / formData.stock : 0;
    
    const priceUSD = formData.price || 0;
    const cogsUSD = (formData.costPrice || 0) / exchangeRate;
    const freightUSD = effectiveUnitLogisticsCNY / exchangeRate;
    const platformFeeUSD = priceUSD * ((formData.economics?.platformFeePercent || 0) / 100);
    const creatorFeeUSD = priceUSD * ((formData.economics?.creatorFeePercent || 0) / 100);
    const fixedFeesUSD = (formData.economics?.fixedCost || 0) + (formData.economics?.lastLegShipping || 0) + (formData.economics?.adCost || 0);
    const refundUSD = priceUSD * ((formData.economics?.refundRatePercent || 0) / 100);
    
    const totalUnitCostUSD = cogsUSD + freightUSD + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + refundUSD;
    const estimatedProfitUSD = priceUSD - totalUnitCostUSD;
    const estimatedMargin = priceUSD > 0 ? (estimatedProfitUSD / priceUSD) * 100 : 0;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80" onClick={onClose}>
            <div className="ios-glass-panel w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 bg-[#121217] relative" onClick={e => e.stopPropagation()}>
               <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                   <div>
                       <h3 className="text-xl font-bold text-white flex items-center gap-2"> 编辑 SKU 资产协议 </h3>
                       <p className="text-xs text-slate-500 mt-1">请填写详细的供应链参数以确保利润透视的准确性</p>
                   </div>
                   <button onClick={onClose}><X className="w-6 h-6 text-slate-500 hover:text-white" /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 bg-black/40">
                   <div className="grid grid-cols-12 gap-6">
                       <div className="col-span-12 bg-white/5 border border-white/5 rounded-xl p-5">
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2"> 产品图片与基础信息 </div>
                           <div className="flex gap-6">
                               <div className="flex flex-col gap-3 w-48 shrink-0">
                                   <div className="grid grid-cols-2 gap-2">
                                       {gallery.map((img, idx) => (
                                           <div key={idx} className={`aspect-square rounded-lg border relative overflow-hidden ${activeImageIndex === idx ? 'border-indigo-500' : 'border-white/10'}`} onClick={() => setActiveImageIndex(idx)} >
                                               <img src={img} className="w-full h-full object-cover" alt="Product" />
                                               <button onClick={(e) => handleRemoveImage(idx, e)} className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded text-white flex items-center justify-center"> <X size={10}/> </button>
                                           </div>
                                       ))}
                                       <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center text-slate-500">
                                           {isCompresing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-5 h-5"/>}
                                       </button>
                                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                   </div>
                               </div>
                               <div className="flex-1 grid grid-cols-4 gap-4">
                                   <div className="col-span-2"> <label className="text-[10px] text-slate-500 block mb-1">产品全名</label> <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" /> </div>
                                   <div className="col-span-2"> <label className="text-[10px] text-slate-500 block mb-1">SKU 标识码</label> <div className="flex flex-wrap items-center gap-1.5 bg-black/40 border border-white/10 rounded px-3 py-1.5 min-h-[40px]"> {skuTags.map(tag => ( <span key={tag} className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-500/30"> {tag} <button onClick={() => setSkuTags(skuTags.filter(t => t !== tag))} className="ml-1">×</button> </span> ))} <input type="text" value={skuInput} onChange={e => setSkuInput(e.target.value)} onKeyDown={handleSkuKeyDown} className="bg-transparent text-sm text-white outline-none flex-1 min-w-[60px]" placeholder="Add..." /> </div> </div>
                                   <div> <label className="text-[10px] text-slate-500 block mb-1">库存量 (pcs)</label> <input type="number" value={formData.stock} onChange={e => handleChange('stock', parseInt(e.target.value) || 0)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" /> </div>
                                   <div> <label className="text-[10px] text-slate-500 block mb-1">销售价格 ($)</label> <input type="number" value={formData.price} onChange={e => handleChange('price', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" /> </div>
                                   <div> <label className="text-[10px] text-slate-500 block mb-1">采购价 (¥/pcs)</label> <input type="number" value={formData.costPrice} onChange={e => handleChange('costPrice', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" /> </div>
                                   <div> <label className="text-[10px] text-slate-500 block mb-1">日销预估 (pcs)</label> <input type="number" value={formData.dailyBurnRate} onChange={e => handleChange('dailyBurnRate', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" /> </div>
                               </div>
                           </div>
                       </div>

                       <div className="col-span-12 bg-white/5 border border-white/5 rounded-xl p-5">
                           <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm border-b border-white/5 pb-2"> 物流与税务分摊 </div>
                           <div className="grid grid-cols-4 gap-4">
                               <div> <label className="text-[10px] text-slate-500 block mb-1">运输方式</label> <select value={formData.logistics?.method} onChange={e => handleNestedChange('logistics', 'method', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none"> <option value="Air">空运 (Air)</option> <option value="Sea">海运 (Sea)</option> </select> </div>
                               <div> <label className="text-[10px] text-slate-500 block mb-1">运费单价 (¥/KG)</label> <input type="number" value={formData.logistics?.unitFreightCost} onChange={e => handleNestedChange('logistics', 'unitFreightCost', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" /> </div>
                               <div> <label className="text-[10px] text-slate-500 block mb-1">追踪单号 (Tracking)</label> <input type="text" value={formData.logistics?.trackingNo} onChange={e => handleNestedChange('logistics', 'trackingNo', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" /> </div>
                               <div> <label className="text-[10px] text-slate-500 block mb-1">计费总重 (KG,留空自动)</label> <input type="number" value={formData.logistics?.billingWeight || ''} onChange={e => handleNestedChange('logistics', 'billingWeight', parseFloat(e.target.value) || undefined)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder={`${autoUnitChargeableWeight.toFixed(2)}推算`} /> </div>
                           </div>
                       </div>
                       
                       <div className="col-span-12 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 flex justify-between items-center shadow-lg">
                           <div className="flex gap-10">
                               <div> <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">单摊物流成本</div> <div className="text-xl font-mono text-blue-400 font-bold">¥ {effectiveUnitLogisticsCNY.toFixed(2)}</div> </div>
                               <div> <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">单品模拟净利</div> <div className={`text-xl font-mono font-bold ${estimatedProfitUSD > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>$ {estimatedProfitUSD.toFixed(2)}</div> </div>
                               <div> <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">预估净利率</div> <div className={`text-xl font-mono font-bold ${estimatedMargin > 15 ? 'text-emerald-400' : 'text-yellow-500'}`}>{estimatedMargin.toFixed(1)} %</div> </div>
                           </div>
                       </div>

                       <div className="col-span-12 bg-white/5 border border-white/5 rounded-xl p-5">
                            <label className="text-xs font-bold text-slate-400 block mb-2">业务备注 (Notes)</label>
                            <textarea value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-slate-300 focus:border-indigo-500 outline-none resize-none" placeholder="Record specifics..." />
                       </div>
                   </div>
               </div>
               <div className="p-4 border-t border-white/10 bg-white/5 flex justify-center items-center">
                   <button onClick={() => onSave(formData)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest"> <Save className="w-5 h-5" /> 提交变更协议并广播 (Execute) </button>
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
    const exchangeRate = state.exchangeRate || 7.2;

    const productStats = useMemo(() => {
        const stats: Record<string, { revenue30d: number, revenuePrev30d: number }> = {};
        const now = new Date();
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
        const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(now.getDate() - 60);
        (state.orders || []).forEach(order => {
            const orderDate = new Date(order.date);
            if (order.status === 'cancelled') return;
            (order.lineItems || []).forEach(item => {
                if (!stats[item.productId]) stats[item.productId] = { revenue30d: 0, revenuePrev30d: 0 };
                const amount = (item.price || 0) * (item.quantity || 0);
                if (orderDate >= thirtyDaysAgo) stats[item.productId].revenue30d += amount;
                else if (orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo) stats[item.productId].revenuePrev30d += amount;
            });
        });
        return stats;
    }, [state.orders]);

    const replenishmentItems: ReplenishmentItem[] = useMemo(() => {
        return (state.products || [])
            .filter(p => !p.deletedAt)
            .map(p => {
                const stock = Number(p.stock || 0);
                const dailyBurnRate = Number(p.dailyBurnRate || 0);
                const daysRemaining = dailyBurnRate > 0 ? Math.floor(stock / dailyBurnRate) : 999;
                const pStats = productStats[p.id] || { revenue30d: 0, revenuePrev30d: 0 };
                
                const unitRealWeight = p.unitWeight || 0;
                const dims = p.dimensions || {l:0, w:0, h:0};
                const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
                const autoUnitChargeableWeight = Math.max(unitRealWeight, unitVolWeight);
                
                let activeTotalBillingWeight = 0;
                if (p.logistics?.billingWeight) activeTotalBillingWeight = p.logistics.billingWeight; 
                else activeTotalBillingWeight = autoUnitChargeableWeight * stock;
                
                const rate = p.logistics?.unitFreightCost || 0;
                const totalFreight = p.logistics?.totalFreightCost ?? (activeTotalBillingWeight * rate + (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0));
                const totalAllInLogisticsCNY = totalFreight + (p.logistics?.consumablesFee || 0) * stock;
                const unitFreightUSD = stock > 0 ? (totalAllInLogisticsCNY / stock) / exchangeRate : 0;
                
                const priceUSD = p.price || 0;
                const costPriceUSD = (p.costPrice || 0) / exchangeRate;
                const eco = p.economics;
                const feesUSD = priceUSD * (((eco?.platformFeePercent || 0) + (eco?.creatorFeePercent || 0)) / 100);
                const otherUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0) + (priceUSD * (eco?.refundRatePercent || 0) / 100);
                
                const profit = priceUSD - (costPriceUSD + unitFreightUSD + feesUSD + otherUSD);

                return {
                    ...p, stock, dailyBurnRate, daysRemaining,
                    totalInvestment: stock * (p.costPrice || 0) + totalAllInLogisticsCNY,
                    profit: profit,
                    totalPotentialProfit: profit * stock,
                    margin: priceUSD > 0 ? (profit / priceUSD) * 100 : 0
                } as ReplenishmentItem;
            });
    }, [state.products, state.orders, productStats, exchangeRate]);

    const handleSaveProduct = (updatedProduct: Product) => {
        if (!updatedProduct.sku) {
            showToast('SKU 不能为空', 'warning');
            return;
        }

        // 检查是新增还是修改
        const exists = (state.products || []).some(p => p.id === updatedProduct.id);
        
        if (exists) {
            dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
            showToast(`SKU ${updatedProduct.sku} 已更新`, 'success');
        } else {
            dispatch({ type: 'ADD_PRODUCT', payload: updatedProduct });
            showToast(`新 SKU ${updatedProduct.sku} 已入库`, 'success');
        }
        
        setEditingItem(null);
    };

    const handleAddNew = () => {
        const newProduct: any = { 
            id: `SKU-${Date.now()}`, 
            name: '', 
            sku: '', 
            category: 'Electronics', 
            stock: 0, 
            price: 0, 
            status: 'active', 
            lastUpdated: new Date().toISOString(), 
            dailyBurnRate: 0,
            costPrice: 0,
            leadTime: 15,
            safetyStockDays: 7,
            unitWeight: 0.1,
            boxCount: 1,
            dimensions: { l: 10, w: 10, h: 10 },
            logistics: { method: 'Air', carrier: '', trackingNo: '', unitFreightCost: 0, consumablesFee: 0 },
            economics: { platformFeePercent: 8, creatorFeePercent: 10, fixedCost: 0, lastLegShipping: 0, adCost: 0, refundRatePercent: 2 }
        };
        setEditingItem(newProduct);
    };

    const handleDelete = (id: string) => {
        if(confirm('确认从资产库永久注销该 SKU？')) {
            dispatch({ type: 'DELETE_PRODUCT', payload: id });
            showToast('资产已移除', 'info');
        }
    };

    const filteredItems = replenishmentItems.filter(i => 
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="ios-glass-panel rounded-2xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/20">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md z-20">
                <div>
                    <h2 className="text-white font-black text-xl flex items-center gap-3 italic uppercase tracking-tighter"> <PackageCheck className="w-6 h-6 text-indigo-500" /> 智能备货与资产审计 </h2>
                    <div className="text-[10px] text-slate-500 mt-1 flex gap-3 font-bold uppercase tracking-widest"> 
                        <span>活跃节点: <span className="text-white">{filteredItems.length}</span></span> 
                        <span className="w-px h-3 bg-white/10"></span> 
                        <span>总持仓货值: <span className="text-emerald-400">¥ {filteredItems.reduce((a,b)=>a+(b.totalInvestment || 0), 0).toLocaleString()}</span></span> 
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative group"> 
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 group-hover:text-indigo-400 transition-colors" /> 
                        <input type="text" placeholder="检索 SKU 或品名..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-72 pl-10 pr-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-500 outline-none transition-all" /> 
                    </div>
                    <button onClick={handleAddNew} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95" > <Plus className="w-4 h-4"/> 注册新 SKU </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/80 sticky top-0 z-10 border-b border-white/5 font-black uppercase text-[10px] text-slate-500 tracking-[0.2em]">
                        <tr className="backdrop-blur-xl">
                            <th className="px-6 py-4">SKU IDENTITY</th>
                            <th className="px-6 py-4">PRODUCT / INFO</th>
                            <th className="px-6 py-4">LOGISTICS</th>
                            <th className="px-6 py-4">STOCK STATUS</th>
                            <th className="px-6 py-4">UNIT PROFIT</th>
                            <th className="px-6 py-4 text-right">COMMAND</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group animate-in fade-in duration-300">
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-lg font-black text-white font-mono tracking-tight uppercase group-hover:text-indigo-400 transition-colors">{item.sku}</span>
                                        <StrategyBadge type={item.lifecycle || 'Stable'} />
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-700"/>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-slate-200 truncate w-48">{item.name}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{item.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="space-y-1.5 font-mono">
                                        <div className="text-[10px] text-blue-400 font-black uppercase flex items-center gap-1"> {item.logistics?.method === 'Sea' ? <Ship size={10}/> : <Plane size={10}/>} {item.logistics?.method} </div>
                                        <div className="text-xs text-white font-bold">{item.logistics?.trackingNo || 'PENDING'}</div>
                                        <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{item.logistics?.carrier || 'Manual Node'}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-black text-white font-mono">{item.stock}</span>
                                            <span className="text-[9px] text-slate-600 font-black uppercase">Units</span>
                                        </div>
                                        <div className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase w-fit ${item.daysRemaining < 15 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                                            可售: {item.daysRemaining} 天
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="font-mono">
                                        <div className={`text-lg font-black ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${item.profit.toFixed(2)}</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Margin: {item.margin.toFixed(1)}%</div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingItem(item)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingItem && ( <EditModal product={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveProduct} /> )}
        </div>
    );
};

export default Inventory;
