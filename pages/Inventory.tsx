
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  PackageCheck, Search, Download, X, 
  Sparkles, Calculator, 
  Box, DollarSign, Save,
  Plane, Ship, Info, Factory, Image as ImageIcon, History, FileText, Loader2, Bot,
  AlertCircle, TrendingUp, Target, BarChart3, Zap, Megaphone, BrainCircuit,
  Plus, Trash2, MoreHorizontal, CheckSquare, Square, Edit2, Calendar,
  Clock, ShieldCheck, Truck, Scale, Ruler, Users, Layers, Activity, Copy, Upload, ExternalLink, Link
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// --- Components ---

const StrategyBadge: React.FC<{ type: string }> = ({ type }) => {
    let color = 'bg-slate-800 text-slate-400 border-slate-700';
    let icon = <Zap className="w-3 h-3" />;
    
    if (type === 'New' || type === '新品测试') {
        color = 'bg-blue-900/30 text-blue-400 border-blue-500/30';
        icon = <Sparkles className="w-3 h-3" />;
    } else if (type === 'Growing' || type === '爆品增长') {
        color = 'bg-pink-900/30 text-pink-400 border-pink-500/30';
        icon = <TrendingUp className="w-3 h-3" />;
    } else if (type === 'Stable' || type === '稳定热卖') {
        color = 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30';
        icon = <Target className="w-3 h-3" />;
    } else if (type === 'Clearance') {
        color = 'bg-red-900/30 text-red-400 border-red-500/30';
        icon = <AlertCircle className="w-3 h-3" />;
    }

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-bold uppercase w-fit ${color}`}>
            {icon}
            <span>{type}</span>
        </div>
    );
};

// --- Add Product Modal ---
const AddProductModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { dispatch, showToast } = useTanxing();
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<Partial<Product>>({
        name: '',
        sku: '',
        category: 'General',
        price: 0,
        costPrice: 0,
        stock: 0,
        status: 'active',
        lifecycle: 'New',
        supplier: '',
        leadTime: 15,
        itemsPerBox: 20,
        lingXingId: '',
        notes: ''
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Global paste handler for the modal to catch images
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            setForm(prev => ({ ...prev, image: event.target?.result as string }));
                            showToast('图片已从剪贴板粘贴', 'success');
                        };
                        reader.readAsDataURL(file);
                    }
                    return;
                }
            }
        }
    };

    const handleSubmit = () => {
        if (!form.name || !form.sku) {
            showToast('请填写产品名称和 SKU', 'warning');
            return;
        }
        
        setIsSaving(true);
        // Simulate network delay for better UX feedback
        setTimeout(() => {
            const newProduct: Product = {
                ...form as Product,
                id: `PROD-${Date.now()}`,
                lastUpdated: new Date().toISOString(),
                inventoryBreakdown: [],
                dailyBurnRate: 0 // Initial
            };
            dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
            showToast('新 SKU 已添加至清单', 'success');
            setIsSaving(false);
            onClose();
        }, 600);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/70" onClick={onClose}>
            <div 
                className="ios-glass-panel w-full max-w-2xl rounded-xl shadow-2xl p-6 animate-in zoom-in-95 border border-white/10" 
                onClick={e => e.stopPropagation()}
                onPaste={handlePaste}
            >
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-500" />
                        添加新 SKU (Add Product)
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Image Upload Column */}
                    <div className="col-span-1 flex flex-col gap-3">
                        <div className="aspect-square bg-black/40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                            {form.image ? (
                                <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-xs font-medium text-center px-2">点击上传<br/>或 Ctrl+V 粘贴</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative group">
                            <Link className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                            <input 
                                type="text" 
                                placeholder="粘贴图片链接 (URL)..." 
                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-2 py-2 text-xs text-white focus:border-indigo-500 outline-none placeholder-slate-600 transition-colors hover:bg-black/60"
                                value={form.image?.startsWith('data:') ? '' : form.image || ''}
                                onChange={(e) => setForm({...form, image: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">产品名称 Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">SKU (支持逗号分隔多个)</label>
                            <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none font-mono uppercase" placeholder="SKU-A, SKU-B" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">类目 Category</label>
                            <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">领星入库单号</label>
                            <input type="text" value={form.lingXingId} onChange={e => setForm({...form, lingXingId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" placeholder="LX-..." />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">销售价 ($)</label>
                            <input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">采购成本 (¥)</label>
                            <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">初始库存</label>
                            <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">每箱数量 (Pcs/Box)</label>
                            <input type="number" value={form.itemsPerBox} onChange={e => setForm({...form, itemsPerBox: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        </div>
                    </div>
                </div>
                
                <div>
                    <label className="text-xs text-slate-400 block mb-1">备注 (Notes)</label>
                    <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none resize-none" placeholder="添加备注..." />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">取消</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isSaving ? '添加中...' : '确认添加'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- High Fidelity Edit Modal (Tanxing OS Dark/Glass Style) ---
const EditProductModal: React.FC<{ product: any, onClose: () => void }> = ({ product, onClose }) => {
    const { dispatch, showToast } = useTanxing();
    const [isSaving, setIsSaving] = useState(false);
    
    // Initial values logic: Calculate box count from existing stock
    // This fixes the issue where box count appeared as 0 initially
    const [boxCount, setBoxCount] = useState<number>(() => {
        const items = product.itemsPerBox || 1;
        const stock = product.stock || 0;
        return Math.ceil(stock / items);
    });
    const [stockTotal, setStockTotal] = useState(product.stock || 0);

    const [formData, setFormData] = useState({
        ...product,
        // Ensure nested objects exist
        dimensions: product.dimensions || { l: 32, w: 24, h: 18 },
        economics: product.economics || { platformFeePercent: 2, creatorFeePercent: 10, fixedCost: 0.3, lastLegShipping: 5.44, adCost: 10, refundRatePercent: 3 },
        logistics: product.logistics || { method: 'Air', carrier: 'Matson/UPS', trackingNo: '', unitFreightCost: 62 },
        lingXingId: product.lingXingId || '',
        notes: product.notes || ''
    });

    const handleSave = () => {
        setIsSaving(true);
        // Important: Update the stock with the manual total
        const updatedProduct = {
            ...formData,
            stock: stockTotal
        };

        // Simulate processing delay
        setTimeout(() => {
            dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
            showToast('SKU 信息已更新并记录日志', 'success');
            setIsSaving(false);
            onClose();
        }, 600);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            setFormData(prev => ({ ...prev, image: event.target?.result as string }));
                            showToast('图片已从剪贴板粘贴', 'success');
                        };
                        reader.readAsDataURL(file);
                    }
                    return;
                }
            }
        }
    };

    // Live Calculation Handlers
    const handleBoxCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = parseInt(e.target.value) || 0;
        setBoxCount(count);
        // Auto-update stock total when box count changes (One-way binding)
        // This fixes the issue of "entered value but didn't save"
        const items = formData.itemsPerBox || 1;
        setStockTotal(count * items);
    };

    const handleItemsPerBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const items = parseInt(e.target.value) || 0;
        setFormData({ ...formData, itemsPerBox: items });
        // Recalculate stock based on current box count
        // We assume if you change items/box, you want to update total stock based on box count
        if (boxCount > 0) {
            setStockTotal(boxCount * items);
        }
    };

    const handleStockTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const total = parseInt(e.target.value) || 0;
        setStockTotal(total);
        // Decoupled: We do NOT auto-update boxCount here.
        // This allows for manual override (e.g., loose items) without fighting the box calculation.
    };

    const totalCBM = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * (formData.itemsPerBox || 1); 

    // Helper for input classes to maintain consistency in Dark UI
    const inputClass = "w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm placeholder-white/20";
    const labelClass = "text-xs font-semibold text-slate-400 mb-1.5 block";
    const sectionTitleClass = "text-sm font-bold text-slate-200 mb-4 flex items-center gap-2";
    const badgeClass = "w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold mr-2";

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80" onClick={onClose}>
            {/* Dark Glass Theme for this Modal */}
            <div 
                className="ios-glass-panel w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 font-sans border border-white/10" 
                onClick={e => e.stopPropagation()}
                onPaste={handlePaste}
            >
                
                {/* Header */}
                <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            编辑: {formData.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">完善参数以获得更准确的智能补货建议</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-xs text-slate-300 flex items-center gap-1 font-medium transition-colors shadow-sm">
                            <FileText className="w-3.5 h-3.5"/> 详情
                        </button>
                        <button className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-xs text-slate-300 flex items-center gap-1 font-medium transition-colors shadow-sm">
                            <History className="w-3.5 h-3.5"/> 变更历史
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors ml-2">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Body - Dark Glass Layout */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {/* SECTION 1: Product & Supply Chain */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 shadow-lg">
                        <h4 className={sectionTitleClass}><span className={badgeClass}>1</span> 产品与供应链</h4>
                        
                        <div className="flex gap-6">
                            {/* Image Placeholder & URL Input */}
                            <div className="flex flex-col gap-3 w-40 shrink-0">
                                <div className="w-40 h-40 bg-black/40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 transition-all relative overflow-hidden group">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Product" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                            <span className="text-xs font-medium text-center px-1">点击上传<br/>或粘贴</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="relative group">
                                    <Link className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
                                    <input 
                                        type="text" 
                                        placeholder="或粘贴 URL..." 
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 pl-8 text-xs text-white outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors hover:bg-black/60"
                                        value={formData.image?.startsWith('data:') ? '' : formData.image || ''}
                                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label className={labelClass}>日期</label>
                                    <div className="relative">
                                        <input type="text" defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} />
                                        <Calendar className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>生命周期阶段</label>
                                    <select value={formData.lifecycle} onChange={e => setFormData({...formData, lifecycle: e.target.value})} className={inputClass}>
                                        <option value="New">⚡ 稳定热卖 (Stable)</option>
                                        <option value="Stable">🔥 爆品增长 (Growing)</option>
                                        <option value="Growing">🚀 新品测试 (New)</option>
                                        <option value="Clearance">📉 清仓处理 (Clearance)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>产品名称</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>SKU (多标签)</label>
                                    <div className="flex items-center gap-2 w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm focus-within:border-indigo-500 shadow-sm">
                                        <input 
                                            type="text" 
                                            value={formData.sku} 
                                            onChange={e => setFormData({...formData, sku: e.target.value})}
                                            className="bg-transparent outline-none flex-1 min-w-0 h-full py-0.5 text-white placeholder-slate-500 font-mono" 
                                            placeholder="SKU-A, SKU-B..." 
                                        />
                                    </div>
                                </div>
                                <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                    <label className="text-xs font-bold text-amber-400 mb-1 block">生产+物流总时效 (Days)</label>
                                    <div className="relative">
                                        <Clock className="w-4 h-4 absolute left-3 top-2.5 text-amber-500" />
                                        <input type="number" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value)})} className="w-full pl-9 bg-black/40 border border-amber-500/30 rounded px-3 py-2 text-sm text-amber-100 font-bold outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                    <label className="text-xs font-bold text-amber-400 mb-1 block">安全库存天数 (Days)</label>
                                    <div className="relative">
                                        <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-amber-500" />
                                        <input type="number" value={formData.safetyStockDays} onChange={e => setFormData({...formData, safetyStockDays: parseInt(e.target.value)})} className="w-full pl-9 bg-black/40 border border-amber-500/30 rounded px-3 py-2 text-sm text-amber-100 font-bold outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        {/* SECTION 2: Procurement */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-lg flex flex-col h-full">
                            <h4 className={sectionTitleClass}><span className={badgeClass}>2</span> 采购与供应商 (CRM)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>供应商名称</label>
                                    <div className="relative">
                                        <Factory className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                        <input type="text" value={formData.supplier} placeholder="工厂名称" onChange={e => setFormData({...formData, supplier: e.target.value})} className={`${inputClass} pl-9`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>联系方式</label>
                                    <input type="text" value={formData.supplierContact} placeholder="微信/Email" onChange={e => setFormData({...formData, supplierContact: e.target.value})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>采购单价 (¥/pcs)</label>
                                    <input type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>单个重量 (KG)</label>
                                    <input type="number" value={formData.unitWeight} onChange={e => setFormData({...formData, unitWeight: parseFloat(e.target.value)})} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>预估日销 (Daily Sales)</label>
                                    <div className="relative">
                                        <BarChart3 className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                        <input type="number" value={formData.dailyBurnRate} onChange={e => setFormData({...formData, dailyBurnRate: parseFloat(e.target.value)})} className={`${inputClass} pl-9`} />
                                    </div>
                                    <div className="text-[10px] text-emerald-400 mt-1 font-medium text-right">可售天数: {Math.floor(stockTotal / (formData.dailyBurnRate || 1))}天</div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Box Settings */}
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-5 shadow-lg flex flex-col h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-300 text-[10px] px-2 py-1 rounded-bl-lg font-bold border-l border-b border-amber-500/20">{boxCount} 箱 | {(totalCBM * boxCount).toFixed(3)} CBM</div>
                            <h4 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold mr-2 border border-amber-500/30">3</span> 箱规与入库</h4>
                            
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div>
                                    <label className="text-xs font-semibold text-amber-200/70 mb-1 block">长 (cm)</label>
                                    <input type="number" value={formData.dimensions?.l} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions!, l: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-amber-500/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-500 text-amber-100" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-amber-200/70 mb-1 block">宽 (cm)</label>
                                    <input type="number" value={formData.dimensions?.w} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions!, w: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-amber-500/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-500 text-amber-100" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-amber-200/70 mb-1 block">高 (cm)</label>
                                    <input type="number" value={formData.dimensions?.h} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions!, h: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-amber-500/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-500 text-amber-100" />
                                </div>
                            </div>

                            <div className="flex items-end gap-3 mb-4">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-amber-200/70 mb-1 block">每箱数量 (Pcs)</label>
                                    <input 
                                        type="number" 
                                        value={formData.itemsPerBox} 
                                        onChange={handleItemsPerBoxChange} 
                                        className="w-full bg-black/40 border border-amber-500/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-500 text-amber-100" 
                                    />
                                </div>
                                <div className="pb-2 text-amber-500/50 font-bold">x</div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-amber-200/70 mb-1 block">备货箱数 (Box)</label>
                                    <input 
                                        type="number" 
                                        value={boxCount || ''} 
                                        onChange={handleBoxCountChange} 
                                        className="w-full bg-black/40 border border-amber-500/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-500 text-amber-100 placeholder-amber-500/30"
                                        placeholder="手工录入..."
                                    />
                                </div>
                            </div>

                            <div className="bg-black/20 p-3 rounded border border-amber-500/10 relative">
                                <label className="text-xs font-semibold text-amber-200/70 mb-1 block">当前库存总数 (Total Stock)</label>
                                <input 
                                    type="number" 
                                    value={stockTotal} 
                                    onChange={handleStockTotalChange}
                                    className="w-full bg-transparent border-none text-xl font-bold text-amber-100 outline-none placeholder-amber-500/30 font-mono" 
                                />
                                <div className="absolute right-3 top-3 text-[10px] text-amber-500/50 flex flex-col items-end">
                                    <span>手动修改库存</span>
                                    <span>不影响箱数</span>
                                </div>
                            </div>
                            
                            {/* LingXing ID */}
                            <div className="mt-4">
                                <label className="text-xs font-semibold text-amber-200/70 mb-1 block">领星入库单号</label>
                                <input 
                                    type="text" 
                                    value={formData.lingXingId} 
                                    onChange={e => setFormData({...formData, lingXingId: e.target.value})}
                                    placeholder="LX-2023..."
                                    className="w-full bg-black/40 border border-amber-500/20 rounded px-3 py-2 text-sm text-amber-100 outline-none focus:border-amber-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        {/* SECTION 4: Logistics */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-lg">
                            <h4 className={sectionTitleClass}><span className={badgeClass}>4</span> 头程物流 (First Leg)</h4>
                            
                            <div className="mb-4">
                                <label className={labelClass}>运输渠道</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${formData.logistics?.method === 'Air' ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        onClick={() => setFormData({...formData, logistics: {...formData.logistics!, method: 'Air'}})}
                                    >
                                        <Plane className="w-4 h-4" /> 空运 (Air)
                                    </button>
                                    <button 
                                        className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${formData.logistics?.method === 'Sea' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                        onClick={() => setFormData({...formData, logistics: {...formData.logistics!, method: 'Sea'}})}
                                    >
                                        <Ship className="w-4 h-4" /> 海运 (Sea)
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>承运商 / 船司</label>
                                    <input type="text" value={formData.logistics?.carrier} onChange={e => setFormData({...formData, logistics: {...formData.logistics!, carrier: e.target.value}})} className={inputClass} placeholder="Matson/UPS" />
                                </div>
                                <div>
                                    <label className={labelClass}>物流追踪号</label>
                                    <div className="relative">
                                        <Truck className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                        <input type="text" value={formData.logistics?.trackingNo} placeholder="Tracking No." onChange={e => setFormData({...formData, logistics: {...formData.logistics!, trackingNo: e.target.value}})} className={`${inputClass} pl-9`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>空运单价 (/KG)</label>
                                    <div className="flex">
                                        <div className="relative w-full">
                                            <span className="absolute left-3 top-2 text-slate-500 text-xs">¥</span>
                                            <input type="number" value={formData.logistics?.unitFreightCost} onChange={e => setFormData({...formData, logistics: {...formData.logistics!, unitFreightCost: parseFloat(e.target.value)}})} className={`${inputClass} pl-6`} />
                                        </div>
                                        <div className="flex ml-2 border border-white/10 rounded overflow-hidden shrink-0">
                                            <button className="px-2 bg-blue-500/20 text-blue-400 text-xs font-bold border-r border-white/10">CNY</button>
                                            <button className="px-2 bg-black/40 text-slate-400 text-xs hover:bg-white/5">USD</button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>计费总重 (Manual)</label>
                                    <div className="relative">
                                        <Scale className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                        <input type="number" placeholder="0" className={`${inputClass} pl-9`} />
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-right mt-1">理论实重: {((stockTotal || 0) * (formData.unitWeight || 0)).toFixed(2)} kg</div>
                                </div>
                                <div>
                                    <label className={labelClass}>耗材/贴标费 (¥)</label>
                                    <input type="number" defaultValue={30} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>报关费 (¥)</label>
                                    <input type="number" defaultValue={0} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>港口/操作费 (¥)</label>
                                    <input type="number" defaultValue={0} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>目的仓库</label>
                                    <input type="text" defaultValue="火星/休斯顿/美中" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: Sales & Market */}
                        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-5 shadow-lg flex flex-col h-full">
                            <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold mr-2 border border-purple-500/30">5</span> TikTok 销售与竞品 (Market Intel)</h4>
                            
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-purple-200/70 mb-1 block">我方销售价格 ($)</label>
                                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-3 py-3 text-lg font-bold text-white outline-none focus:border-purple-500" />
                            </div>

                            <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs font-bold text-red-400 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> 竞品监控</div>
                                    <button className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded font-bold border border-white/10 hover:bg-slate-700">AI 攻防分析</button>
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="竞品链接/ASIN" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none" />
                                    <input type="number" placeholder="$ 0" className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none" />
                                </div>
                            </div>

                            <div className="border-t border-purple-500/20 pt-4 mt-2">
                                <h5 className="text-xs font-bold text-purple-400 uppercase mb-3 flex items-center gap-1"><Zap className="w-3 h-3"/> TikTok 成本结构</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1">平台佣金 (%)</label>
                                        <input type="number" value={formData.economics?.platformFeePercent} onChange={e => setFormData({...formData, economics: {...formData.economics!, platformFeePercent: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1">达人佣金 (%)</label>
                                        <input type="number" value={formData.economics?.creatorFeePercent} onChange={e => setFormData({...formData, economics: {...formData.economics!, creatorFeePercent: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1">每单固定费 ($)</label>
                                        <input type="number" value={formData.economics?.fixedCost} onChange={e => setFormData({...formData, economics: {...formData.economics!, fixedCost: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1">预估退货率 (%)</label>
                                        <input type="number" value={formData.economics?.refundRatePercent} onChange={e => setFormData({...formData, economics: {...formData.economics!, refundRatePercent: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1">尾程派送费 ($)</label>
                                        <input type="number" value={formData.economics?.lastLegShipping} onChange={e => setFormData({...formData, economics: {...formData.economics!, lastLegShipping: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">预估广告费 ($)</label>
                                    <input type="number" value={formData.economics?.adCost} onChange={e => setFormData({...formData, economics: {...formData.economics!, adCost: parseFloat(e.target.value)}})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* SECTION 6: Notes */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-lg mb-6">
                        <h4 className={sectionTitleClass}>备注信息 (Notes)</h4>
                        <textarea 
                            value={formData.notes} 
                            onChange={e => setFormData({...formData, notes: e.target.value})} 
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                            placeholder="填写备货注意事项、产品细节说明等..."
                        />
                    </div>

                </div>
                
                {/* Footer Actions */}
                <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-4 shrink-0 z-20 flex justify-center">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                        {isSaving ? '正在保存更改...' : '保存修改并记录日志'}
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // --- Logic ---
  const replenishmentItems = useMemo(() => {
      // Filter out deleted products!
      return state.products
          .filter(p => !p.deletedAt)
          .map(p => {
              const burnRate = p.dailyBurnRate || 1; // Daily sales
              const dos = Math.floor(p.stock / (burnRate || 1)); // Days of Stock
              const leadTime = p.leadTime || 30;
              const safetyStock = p.safetyStockDays || 15;
              const reorderPoint = leadTime + safetyStock;
              
              // Metrics
              const totalInvestment = p.stock * (p.costPrice || 0); // Total capital in stock (CNY)
              const freightCost = p.stock * (p.logistics?.unitFreightCost || 0);
              const goodsCost = totalInvestment - freightCost;
              
              // Sales (Mock growth for demo)
              const revenue30d = burnRate * 30 * p.price;
              const growth = (Math.random() * 40) - 10; // -10% to +30%
              const profit = revenue30d * 0.25; // 25% margin estimate

              return {
                  ...p,
                  dailyBurnRate: burnRate,
                  daysRemaining: dos,
                  safetyStock: safetyStock,
                  reorderPoint,
                  totalInvestment,
                  freightCost,
                  goodsCost,
                  revenue30d,
                  growth,
                  profit,
                  totalWeight: p.stock * (p.unitWeight || 0),
                  boxes: Math.ceil(p.stock / (p.itemsPerBox || 1))
              };
          }).filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.sku.toLowerCase().includes(searchTerm.toLowerCase())
          ).sort((a, b) => a.daysRemaining - b.daysRemaining); // Sort by urgency (low stock first)
  }, [state.products, searchTerm]);

  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedItems);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedItems(newSet);
  };

  const handleDeleteSKU = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Stop row click
      if(confirm('确定要删除此 SKU 吗？这将影响所有关联的历史数据。')) {
          dispatch({ type: 'DELETE_PRODUCT', payload: id });
          showToast('SKU 已删除', 'info');
      }
  };

  const handleEditClick = (product: Product, e: React.MouseEvent) => {
      e.stopPropagation(); // Stop row click
      setEditingProduct(product);
  };

  const handleCopySku = (sku: string, e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(sku);
      showToast(`SKU: ${sku} 已复制`, 'success');
  }

  const handleExportCSV = () => {
      const headers = ['SKU', 'Name', 'Stock', 'Days Remaining', 'Burn Rate', 'Total Cost', 'Tracking'];
      const rows = replenishmentItems.map(item => [
          item.sku, 
          `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
          item.stock,
          item.daysRemaining,
          item.dailyBurnRate,
          item.totalInvestment,
          item.logistics?.trackingNo
      ].join(','));
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(',') + "\n" 
          + rows.join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Inventory_Export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('库存清单 CSV 已下载', 'success');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
      
      {/* Container Card */}
      <div className="ios-glass-panel rounded-2xl flex flex-col h-full overflow-hidden relative m-1 border border-white/10 shadow-2xl">
          
          {/* Header Section */}
          <div className="p-5 border-b border-white/10 bg-white/5 relative z-10 shrink-0 flex justify-between items-center">
              <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <PackageCheck className="w-6 h-6 text-indigo-500" />
                      智能备货清单 (Replenishment List)
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                      SKU 总数: <span className="text-white font-mono">{replenishmentItems.length}</span> | 
                      资金占用: <span className="text-emerald-400 font-mono">¥{replenishmentItems.reduce((a,b)=>a+b.totalInvestment,0).toLocaleString()}</span>
                  </p>
              </div>
              
              <div className="flex gap-3 items-center">
                  <div className="relative">
                      <input 
                          type="text" 
                          placeholder="搜索 SKU / 名称..." 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white w-64 focus:border-indigo-500 outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                  <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg transition-all active:scale-95"
                  >
                      <Plus className="w-4 h-4" /> 添加 SKU
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors"
                    title="导出 CSV"
                  >
                      <Download className="w-5 h-5" />
                  </button>
              </div>
          </div>

          {/* List Section (ERP Style) */}
          <div className="flex-1 overflow-y-auto bg-black/20 scrollbar-thin scrollbar-thumb-white/10">
              
              {/* Table Header with Custom Grid - Updated for slightly larger font */}
              <div className="sticky top-0 z-20 grid grid-cols-[40px_1.5fr_3fr_1.5fr_1.5fr_1fr_1.2fr_80px] gap-3 px-4 py-3 bg-[#0f1218] border-b border-white/10 text-xs font-bold text-slate-500 uppercase tracking-wider shadow-lg">
                  <div className="flex items-center justify-center"><Square className="w-4 h-4" /></div>
                  <div>SKU / 阶段</div>
                  <div>产品信息 / 供应商</div>
                  <div>物流状态 (Tracking)</div>
                  <div>资金投入</div>
                  <div>库存数量</div>
                  <div className="text-right">销售表现</div>
                  <div className="text-center">操作</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                  {replenishmentItems.map(item => (
                      <div key={item.id} className="grid grid-cols-[40px_1.5fr_3fr_1.5fr_1.5fr_1fr_1.2fr_80px] gap-3 px-4 py-4 hover:bg-white/[0.02] transition-colors group items-center relative">
                          
                          {/* 1. Selection */}
                          <div className="flex items-center justify-center">
                              <button onClick={() => toggleSelect(item.id)} className="text-slate-600 hover:text-indigo-500 transition-colors">
                                  {selectedItems.has(item.id) ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
                              </button>
                          </div>

                          {/* 2. SKU / Status */}
                          <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'out_of_stock' ? 'bg-red-500 animate-pulse' : item.status === 'low_stock' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                                  <span className="text-base font-black text-white font-mono tracking-tight">{item.sku}</span>
                                  <button onClick={(e) => handleCopySku(item.sku, e)} className="text-slate-600 hover:text-white transition-colors" title="复制 SKU">
                                      <Copy className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                              <StrategyBadge type={item.lifecycle || 'Stable'} />
                          </div>

                          {/* 3. Product Info */}
                          <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-slate-800 rounded-lg border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                  {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                      <ImageIcon className="w-6 h-6 text-slate-500" />
                                  )}
                              </div>
                              <div className="min-w-0">
                                  <div className="text-sm font-bold text-slate-200 truncate" title={item.name}>{item.name}</div>
                                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                      <Factory className="w-3.5 h-3.5" />
                                      <span className="truncate">{item.supplier || '未指定供应商'}</span>
                                  </div>
                                  {item.lingXingId && <div className="text-[10px] text-indigo-400 font-mono mt-0.5">LX: {item.lingXingId}</div>}
                              </div>
                          </div>

                          {/* 4. Logistics */}
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  {item.logistics?.method === 'Sea' ? <Ship className="w-4 h-4 text-blue-400"/> : <Plane className="w-4 h-4 text-sky-400"/>}
                                  <span className="text-sm font-bold text-slate-300">{item.logistics?.method}</span>
                              </div>
                              {item.logistics?.trackingNo ? (
                                  <a 
                                    href={`https://t.17track.net/en#nums=${item.logistics.trackingNo}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-mono flex items-center gap-1"
                                  >
                                      {item.logistics.trackingNo} <ExternalLink className="w-3 h-3"/>
                                  </a>
                              ) : (
                                  <span className="text-xs text-slate-600">-</span>
                              )}
                              <div className="text-xs text-slate-500 mt-1">{item.totalWeight?.toFixed(1)}kg / {item.boxes}box</div>
                          </div>

                          {/* 5. Capital */}
                          <div>
                              <div className="text-sm font-bold text-emerald-400 font-mono">¥{item.totalInvestment.toLocaleString()}</div>
                              <div className="text-xs text-slate-500 mt-1">货值: ¥{item.goodsCost.toLocaleString()}</div>
                              <div className="text-xs text-slate-500">运费: ¥{item.freightCost.toLocaleString()}</div>
                          </div>

                          {/* 6. Stock */}
                          <div>
                              <div className="text-base font-bold text-white font-mono">{item.stock} <span className="text-xs text-slate-500 font-sans font-normal">件</span></div>
                              <div className={`text-xs font-bold mt-1 ${item.daysRemaining < 30 ? 'text-red-400' : 'text-emerald-500'}`}>
                                  可售: {item.daysRemaining} 天
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.daysRemaining < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, (item.daysRemaining/60)*100)}%`}}></div>
                              </div>
                          </div>

                          {/* 7. Sales Performance */}
                          <div className="text-right">
                              <div className="text-sm font-bold text-white">${item.revenue30d.toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-xs text-slate-500">/30天</span></div>
                              <div className={`text-xs font-bold mt-1 flex items-center justify-end gap-1 ${item.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {item.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5"/> : <TrendingUp className="w-3.5 h-3.5 rotate-180"/>}
                                  {Math.abs(item.growth).toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-500 mt-1">日销: {item.dailyBurnRate} 件</div>
                          </div>

                          {/* 8. Actions */}
                          <div className="flex justify-center">
                              <button 
                                onClick={(e) => handleEditClick(item, e)}
                                className="p-2 hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 rounded-lg transition-colors"
                                title="编辑 SKU"
                              >
                                  <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteSKU(item.id, e)}
                                className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors ml-1"
                                title="删除 SKU"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>

                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Inventory;
