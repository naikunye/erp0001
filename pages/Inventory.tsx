
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
  Clock, ShieldCheck, Truck
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
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase w-fit ${color}`}>
            {icon}
            <span>{type}</span>
        </div>
    );
};

// --- Add Product Modal ---
const AddProductModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { dispatch, showToast } = useTanxing();
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
        itemsPerBox: 20
    });

    const handleSubmit = () => {
        if (!form.name || !form.sku) {
            showToast('请填写产品名称和 SKU', 'warning');
            return;
        }
        const newProduct: Product = {
            ...form as Product,
            id: `PROD-${Date.now()}`,
            lastUpdated: new Date().toISOString(),
            inventoryBreakdown: [],
            dailyBurnRate: 0 // Initial
        };
        dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
        showToast('新 SKU 已添加至清单', 'success');
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/70" onClick={onClose}>
            <div className="ios-glass-panel w-full max-w-lg rounded-xl shadow-2xl p-6 animate-in zoom-in-95 border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-500" />
                        添加新 SKU (Add Product)
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">产品名称 Name</label>
                        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">SKU</label>
                        <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none font-mono uppercase" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">类目 Category</label>
                        <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
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
                        <label className="text-xs text-slate-400 block mb-1">供应商</label>
                        <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm">取消</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg">确认添加</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- High Fidelity Edit Modal ---
const EditProductModal: React.FC<{ product: any, onClose: () => void }> = ({ product, onClose }) => {
    const { dispatch, showToast } = useTanxing();
    const [formData, setFormData] = useState({
        ...product,
        // Ensure nested objects exist
        dimensions: product.dimensions || { l: 0, w: 0, h: 0 },
        economics: product.economics || { platformFeePercent: 0, creatorFeePercent: 0, fixedCost: 0, lastLegShipping: 0, adCost: 0, refundRatePercent: 0 },
        logistics: product.logistics || { method: 'Air', carrier: '', trackingNo: '', unitFreightCost: 0 }
    });

    // Local state for extended fields not in main type (visual only for this demo)
    const [extraFields, setExtraFields] = useState({
        consumablesFee: 30,
        customsFee: 0,
        portFee: 0,
        billingWeight: 0,
        warehouse: '火星/休斯顿/美中'
    });

    const handleSave = () => {
        dispatch({ type: 'UPDATE_PRODUCT', payload: formData });
        showToast('SKU 信息已更新并记录日志', 'success');
        onClose();
    };

    const updateNested = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [field]: value
            }
        }));
    };

    const totalCBM = ((formData.dimensions?.l || 0) * (formData.dimensions?.w || 0) * (formData.dimensions?.h || 0) / 1000000) * 8; // Assuming 8 boxes for demo

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80" onClick={onClose}>
            <div className="bg-[#f8f9fc] dark:bg-[#0f172a] w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 border border-white/10" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            编辑: {formData.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">完善参数以获得更准确的智能补货建议</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center gap-1 font-medium transition-colors">
                            <FileText className="w-3.5 h-3.5"/> 详情
                        </button>
                        <button className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center gap-1 font-medium transition-colors">
                            <History className="w-3.5 h-3.5"/> 变更历史
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors ml-2">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/20 custom-scrollbar">
                    
                    {/* SECTION 1: Product & Supply Chain */}
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-5 mb-6 shadow-sm relative group">
                        <div className="absolute top-4 left-4 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">1</div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-6 pl-8">产品与供应链</h4>
                        
                        <div className="flex gap-6 pl-8">
                            <div className="w-32 h-32 bg-gray-100 dark:bg-black/40 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 transition-colors shrink-0">
                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-xs">点击上传</span>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">日期</label>
                                    <div className="relative">
                                        <input type="text" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                        <Calendar className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">生命周期阶段</label>
                                    <select value={formData.lifecycle} onChange={e => setFormData({...formData, lifecycle: e.target.value})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500">
                                        <option value="New">⚡ 新品测试 (New)</option>
                                        <option value="Stable">🔥 稳定热卖 (Stable)</option>
                                        <option value="Growing">🚀 爆品增长 (Growing)</option>
                                        <option value="Clearance">📉 清仓处理 (Clearance)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">产品名称</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">SKU (支持多标签)</label>
                                    <div className="flex items-center gap-2 w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-sm focus-within:border-blue-500">
                                        <span className="bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-blue-100 dark:border-blue-500/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {formData.sku} <X className="w-3 h-3 cursor-pointer"/>
                                        </span>
                                        <input type="text" className="bg-transparent outline-none flex-1 min-w-0" placeholder="" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-amber-600 dark:text-amber-500/80 flex items-center gap-1">生产+物流总时效 (Days)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-amber-500"><Clock className="w-4 h-4"/></span>
                                        <input type="number" value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value)})} className="w-full pl-9 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded px-3 py-2 text-sm text-amber-700 dark:text-amber-400 font-bold outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-amber-600 dark:text-amber-500/80 flex items-center gap-1">安全库存天数 (Days)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-amber-500"><ShieldCheck className="w-4 h-4" /></span>
                                        <input type="number" value={formData.safetyStockDays} onChange={e => setFormData({...formData, safetyStockDays: parseInt(e.target.value)})} className="w-full pl-9 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded px-3 py-2 text-sm text-amber-700 dark:text-amber-400 font-bold outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* SECTION 2: Procurement (CRM) */}
                        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-5 shadow-sm relative">
                            <div className="absolute top-4 left-4 bg-gray-200 dark:bg-white/10 text-slate-500 dark:text-slate-300 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">2</div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-6 pl-8">采购与供应商 (CRM)</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-5 pl-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">供应商名称</label>
                                    <div className="relative">
                                        <Factory className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                        <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full pl-8 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="工厂名称" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">联系方式</label>
                                    <input type="text" value={formData.supplierContact} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="微信/Email" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">采购单价 (¥/pcs)</label>
                                    <input type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">单个重量 (KG)</label>
                                    <input type="number" value={formData.unitWeight} onChange={e => setFormData({...formData, unitWeight: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">备货箱数 (Box)</label>
                                    <input type="number" value={8} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm text-slate-500 outline-none" readOnly />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">预估日销 (Daily Sales)</label>
                                    <div className="relative">
                                        <input type="number" value={formData.dailyBurnRate} onChange={e => setFormData({...formData, dailyBurnRate: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" />
                                        <BarChart3 className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                                    </div>
                                    <div className="text-[10px] text-emerald-500 mt-0.5">可售天数: 30.0 天</div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Box Settings */}
                        <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5 relative flex flex-col">
                            <div className="absolute top-4 left-4 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">3</div>
                            <div className="flex justify-between items-center mb-6 pl-8">
                                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">箱规设置</h4>
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-200 dark:border-amber-500/20">
                                    8 箱 | {totalCBM.toFixed(3)} CBM
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mb-6 pl-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">长 (cm)</label>
                                    <input type="number" value={formData.dimensions.l} onChange={e => updateNested('dimensions', 'l', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">宽 (cm)</label>
                                    <input type="number" value={formData.dimensions.w} onChange={e => updateNested('dimensions', 'w', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">高 (cm)</label>
                                    <input type="number" value={formData.dimensions.h} onChange={e => updateNested('dimensions', 'h', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-amber-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pl-2 mt-auto">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">每箱数量 (Items/Box)</label>
                                    <div className="relative">
                                        <Box className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                        <input type="number" value={formData.itemsPerBox} onChange={e => setFormData({...formData, itemsPerBox: parseInt(e.target.value)})} className="w-full pl-8 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-medium text-slate-500">备货总数 (Total Pcs)</label>
                                        <span className="text-[10px] text-blue-500 cursor-pointer flex items-center gap-1"><Calculator className="w-3 h-3"/> 自动计算</span>
                                    </div>
                                    <input type="number" value={150} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-lg font-bold text-slate-800 dark:text-white outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* SECTION 4: First Leg Logistics */}
                        <div className="bg-sky-50/50 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/20 rounded-xl p-5 relative">
                            <div className="absolute top-4 left-4 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">4</div>
                            <h4 className="text-sm font-bold text-sky-700 dark:text-sky-400 mb-6 pl-8">头程物流 (First Leg)</h4>
                            
                            <div className="space-y-5 pl-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">运输渠道</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => updateNested('logistics', 'method', 'Air')} className={`py-2 text-sm font-medium rounded border flex items-center justify-center gap-2 transition-all ${formData.logistics.method === 'Air' ? 'bg-sky-100 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50 text-sky-700 dark:text-sky-300' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-500'}`}>
                                            <Plane className="w-4 h-4" /> 空运 (Air)
                                        </button>
                                        <button onClick={() => updateNested('logistics', 'method', 'Sea')} className={`py-2 text-sm font-medium rounded border flex items-center justify-center gap-2 transition-all ${formData.logistics.method === 'Sea' ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-500'}`}>
                                            <Ship className="w-4 h-4" /> 海运 (Sea)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">承运商 / 船司</label>
                                        <input type="text" value={formData.logistics.carrier || 'Matson/UPS'} onChange={e => updateNested('logistics', 'carrier', e.target.value)} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-sky-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">物流追踪号</label>
                                        <div className="relative">
                                            <Truck className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                            <input type="text" value={formData.logistics.trackingNo} onChange={e => updateNested('logistics', 'trackingNo', e.target.value)} className="w-full pl-8 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="Tracking No." />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">空运单价 (CNY/KG)</label>
                                        <div className="flex">
                                            <span className="bg-gray-100 dark:bg-white/5 border border-r-0 border-gray-200 dark:border-white/10 rounded-l px-2 py-2 text-xs text-slate-500 flex items-center">¥</span>
                                            <input type="number" value={formData.logistics.unitFreightCost} onChange={e => updateNested('logistics', 'unitFreightCost', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-r px-3 py-2 text-sm outline-none focus:border-sky-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">计费总重 (Manual)</label>
                                        <div className="relative">
                                            <input type="number" value={extraFields.billingWeight} onChange={e => setExtraFields({...extraFields, billingWeight: parseFloat(e.target.value)})} className="w-full pl-8 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="0" />
                                            <span className="absolute left-3 top-2.5 text-xs text-slate-400">⚖️</span>
                                            <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">理论实重: 12.75kg</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">耗材/贴标费 (¥)</label>
                                        <input type="number" value={extraFields.consumablesFee} onChange={e => setExtraFields({...extraFields, consumablesFee: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-sky-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">报关费 (¥)</label>
                                        <input type="number" value={extraFields.customsFee} onChange={e => setExtraFields({...extraFields, customsFee: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-sky-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">港口/操作费 (¥)</label>
                                        <input type="number" value={extraFields.portFee} onChange={e => setExtraFields({...extraFields, portFee: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-sky-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">目的仓库</label>
                                        <input type="text" value={extraFields.warehouse} onChange={e => setExtraFields({...extraFields, warehouse: e.target.value})} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-sky-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: TikTok Sales & Competitors */}
                        <div className="bg-purple-50/50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 rounded-xl p-5 relative">
                            <div className="absolute top-4 left-4 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">5</div>
                            <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-6 pl-8">TikTok 销售与竞品 (Market Intel)</h4>

                            <div className="space-y-5 pl-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">我方销售价格 ($)</label>
                                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black/40 border border-purple-200 dark:border-purple-500/30 rounded px-3 py-3 text-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> 竞品监控</label>
                                        <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded cursor-pointer font-medium shadow border border-slate-700">AI 攻防分析</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-xs text-slate-700 dark:text-white outline-none focus:border-red-400" placeholder="竞品链接/ASIN" />
                                        <div className="flex items-center bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 text-xs text-slate-500 min-w-[60px] justify-center">$ 0.00</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-purple-200 dark:border-purple-500/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider">TikTok 成本结构</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-500">平台佣金 (%)</label>
                                            <input type="number" value={formData.economics.platformFeePercent} onChange={e => updateNested('economics', 'platformFeePercent', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-500">达人佣金 (%)</label>
                                            <input type="number" value={formData.economics.creatorFeePercent} onChange={e => updateNested('economics', 'creatorFeePercent', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-purple-500" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1 mb-3">
                                        <label className="text-xs font-medium text-slate-500">每单固定费 ($)</label>
                                        <input type="number" value={formData.economics.fixedCost} onChange={e => updateNested('economics', 'fixedCost', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-purple-500" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-500">预估退货率 (%)</label>
                                            <input type="number" value={formData.economics.refundRatePercent} onChange={e => updateNested('economics', 'refundRatePercent', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-500">尾程派送费 ($)</label>
                                            <input type="number" value={formData.economics.lastLegShipping} onChange={e => updateNested('economics', 'lastLegShipping', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-purple-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">预估广告费 ($)</label>
                                        <input type="number" value={formData.economics.adCost} onChange={e => updateNested('economics', 'adCost', parseFloat(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none focus:border-purple-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Footer Actions */}
                <div className="bg-white dark:bg-white/5 border-t border-gray-200 dark:border-white/10 p-4 shrink-0 z-20">
                    <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                        <CheckSquare className="w-4 h-4" /> 保存修改并记录日志
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
      return state.products.map(p => {
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

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
      
      {/* Container Card */}
      <div className="ios-glass-panel rounded-2xl flex flex-col h-full overflow-hidden relative m-1 border border-white/10 shadow-2xl">
          
          {/* Header Section */}
          <div className="p-5 border-b border-white/10 bg-white/5 relative z-10 shrink-0 flex justify-between items-center">
              <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                      <PackageCheck className="w-5 h-5 text-indigo-500" />
                      智能备货清单 (Replenishment List)
                  </h1>
                  <p className="text-[10px] text-slate-400 mt-1">
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
                          className="pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white w-48 focus:border-indigo-500 outline-none"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  </div>
                  <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all active:scale-95"
                  >
                      <Plus className="w-3.5 h-3.5" /> 添加 SKU
                  </button>
                  <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-white">
                      <Download className="w-4 h-4" />
                  </button>
              </div>
          </div>

          {/* List Section (ERP Style) */}
          <div className="flex-1 overflow-y-auto bg-black/20 scrollbar-thin scrollbar-thumb-white/10">
              
              {/* Table Header */}
              <div className="sticky top-0 z-20 grid grid-cols-12 gap-4 px-4 py-3 bg-[#0f1218] border-b border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-lg">
                  <div className="col-span-1 flex items-center justify-center"><Square className="w-3.5 h-3.5" /></div>
                  <div className="col-span-2">SKU / 阶段</div>
                  <div className="col-span-3">产品信息 / 供应商</div>
                  <div className="col-span-2">物流 (Live)</div>
                  <div className="col-span-2">资金投入</div>
                  <div className="col-span-1">库存 (Stock)</div>
                  <div className="col-span-1 text-right">销售表现</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                  {replenishmentItems.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-white/[0.02] transition-colors group items-center relative">
                          
                          {/* 1. Selection */}
                          <div className="col-span-1 flex items-center justify-center">
                              <button onClick={() => toggleSelect(item.id)} className="text-slate-600 hover:text-indigo-500 transition-colors">
                                  {selectedItems.has(item.id) ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                              </button>
                          </div>

                          {/* 2. SKU / Status */}
                          <div className="col-span-2 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${item.status === 'out_of_stock' ? 'bg-red-500 animate-pulse' : item.status === 'low_stock' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                                  <span className="text-sm font-black text-white font-mono tracking-tight">{item.sku}</span>
                              </div>
                              <StrategyBadge type={item.lifecycle || 'Stable'} />
                          </div>

                          {/* 3. Product Info */}
                          <div className="col-span-3 flex items-start gap-3">
                              <div className="w-10 h-10 bg-slate-800 rounded border border-white/10 flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-200 truncate" title={item.name}>{item.name}</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                      <Factory className="w-3 h-3" />
                                      <span className="truncate">{item.supplier || 'Unknown Supplier'}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">{item.lastUpdated?.split('T')[0]}</div>
                              </div>
                          </div>

                          {/* 4. Logistics */}
                          <div className="col-span-2">
                              <div className="flex items-center gap-2 mb-1">
                                  {item.logistics?.method === 'Sea' ? <Ship className="w-3.5 h-3.5 text-blue-400"/> : <Plane className="w-3.5 h-3.5 text-sky-400"/>}
                                  <span className="text-xs font-bold text-slate-300">{item.logistics?.method === 'Sea' ? '海运' : '空运'}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                                  <div>{item.boxes}箱 · {item.totalWeight.toFixed(1)}kg</div>
                                  <div className="text-slate-600">Unit: {item.unitWeight}kg</div>
                              </div>
                          </div>

                          {/* 5. Financials */}
                          <div className="col-span-2">
                              <div className="text-sm font-bold text-white font-mono">¥{item.totalInvestment.toLocaleString()}</div>
                              <div className="flex gap-2 mt-1">
                                  <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                      <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                                      货: ¥{item.goodsCost.toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                      <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
                                      运: ¥{item.freightCost.toLocaleString()}
                                  </div>
                              </div>
                          </div>

                          {/* 6. Stock */}
                          <div className="col-span-1">
                              <div className="flex items-end gap-1 mb-1">
                                  <span className="text-sm font-bold text-white font-mono">{item.stock}</span>
                                  <span className={`text-[10px] px-1 rounded border ${item.daysRemaining < 20 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                      {item.daysRemaining}d
                                  </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mb-1">日销: {item.dailyBurnRate}</div>
                              {/* Stock Health Bar */}
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                      className={`h-full ${item.daysRemaining < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                      style={{width: `${Math.min(100, (item.stock / (item.reorderPoint * 2)) * 100)}%`}}
                                  ></div>
                              </div>
                          </div>

                          {/* 7. Sales Performance */}
                          <div className="col-span-1 text-right">
                              <div className="text-sm font-bold text-white font-mono">${item.revenue30d.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                              <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${item.growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {item.growth > 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingUp className="w-3 h-3 rotate-180"/>}
                                  {Math.abs(item.growth).toFixed(1)}%
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Profit: ${item.profit.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                          </div>

                          {/* Actions (Hover) */}
                          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => handleEditClick(item, e)} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg transition-colors border border-indigo-400/30" title="编辑">
                                  <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => handleDeleteSKU(item.id, e)} className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded border border-red-600/30 transition-colors" title="删除">
                                  <Trash2 className="w-3.5 h-3.5" />
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
