
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem, Product, AuditLog } from '../types';
import { 
  PackageCheck, Search, Download, X, 
  Sparkles, Calculator, 
  Box, DollarSign, Save,
  Plane, Ship, Info, Image as ImageIcon,
  AlertCircle, TrendingUp, TrendingDown, Target, BarChart3, Zap, 
  Link2, Calendar, User, Scale, Ruler, Truck,
  CheckCircle2, Clock, Edit2, AlertTriangle, ExternalLink,
  Plus, Trash2, Upload, Link as LinkIcon, ChevronLeft, ChevronRight, Wallet,
  PieChart, FileDown, History, Terminal
} from 'lucide-react';

// --- Sub-Component: Audit Timeline ---
const AuditTimeline: React.FC<{ logs: AuditLog[] }> = ({ logs }) => (
    <div className="flex flex-col h-full bg-black/40 border-l border-white/10 p-4 w-64 animate-in slide-in-from-right-4">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" /> 审计日志 (History)
        </h4>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
            {logs.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic">暂无变更记录</p>
            ) : (
                logs.map(log => (
                    <div key={log.id} className="relative pl-4 border-l border-white/10 pb-1">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-black"></div>
                        <div className="text-[10px] text-indigo-400 font-bold mb-0.5">{new Date(log.timestamp).toLocaleString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        <div className="text-[11px] text-white font-medium leading-relaxed">{log.details}</div>
                        <div className="text-[9px] text-slate-500 mt-1 uppercase font-mono">By {log.userName}</div>
                    </div>
                ))
            )}
        </div>
    </div>
);

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

const EditModal: React.FC<{ product: ReplenishmentItem, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    const { state } = useTanxing();
    const [formData, setFormData] = useState<Product>({
        ...product,
        dimensions: product.dimensions || { l: 0, w: 0, h: 0 },
        logistics: product.logistics || { method: 'Air', carrier: '', trackingNo: '', unitFreightCost: 0, targetWarehouse: '' },
        economics: product.economics || { platformFeePercent: 0, creatorFeePercent: 0, fixedCost: 0, lastLegShipping: 0, adCost: 0, refundRatePercent: 0 },
        boxCount: product.boxCount ?? 0,
    });
    
    const [showLogs, setShowLogs] = useState(false);
    const productLogs = state.auditLogs.filter(l => l.entityId === product.sku);

    const handleChange = (field: keyof Product, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80" onClick={onClose}>
            <div className="ios-glass-panel w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 bg-[#121217]" onClick={e => e.stopPropagation()}>
               <div className="flex-1 flex flex-col min-w-0">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">编辑: {formData.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">完善参数以获得更准确的智能补货建议</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowLogs(!showLogs)}
                                className={`px-3 py-1.5 border rounded text-xs flex items-center gap-2 transition-all ${showLogs ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/10 text-slate-400 hover:text-white'}`}
                            >
                                <History className="w-3.5 h-3.5"/> 变更记录
                            </button>
                            <button onClick={onClose}><X className="w-6 h-6 text-slate-500 hover:text-white" /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                         {/* 模拟表单内容，保留核心逻辑 */}
                         <div className="grid grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500">基础设置</label>
                                <input type="number" value={formData.stock} onChange={e => handleChange('stock', parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-3 text-white" placeholder="当前库存" />
                                <input type="number" value={formData.price} onChange={e => handleChange('price', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-3 text-white" placeholder="销售价格 ($)" />
                             </div>
                         </div>
                    </div>
                    <div className="p-4 border-t border-white/10 bg-white/5 flex justify-center items-center">
                        <button onClick={() => onSave(formData)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                            <Save className="w-4 h-4" /> 保存修改并记录日志
                        </button>
                    </div>
               </div>
               {showLogs && <AuditTimeline logs={productLogs} />}
            </div>
        </div>,
        document.body
    );
};

const Inventory: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<ReplenishmentItem | null>(null);

    const replenishmentItems: ReplenishmentItem[] = useMemo(() => {
        return state.products
            .filter(p => !p.deletedAt)
            .map(p => {
                const dailyBurnRate = p.dailyBurnRate || 1;
                const stock = p.stock || 0;
                return {
                    ...p,
                    dailyBurnRate,
                    daysRemaining: Math.floor(stock / dailyBurnRate),
                    safetyStock: 0, reorderPoint: 0, totalInvestment: stock * (p.costPrice || 0), 
                    freightCost: 0, goodsCost: 0, revenue30d: 0, growth: 0, profit: 0, totalPotentialProfit: 0,
                    totalWeight: 0, boxes: 0
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

    const handleExport = () => {
        const taskId = `EXP-${Date.now()}`;
        dispatch({ type: 'START_EXPORT', payload: { id: taskId, fileName: 'Inventory_Report.csv' } });
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                clearInterval(interval);
                dispatch({ type: 'COMPLETE_EXPORT', payload: taskId });
                showToast('数据导出任务完成', 'success');
                // 真实下载逻辑...
            } else {
                dispatch({ type: 'UPDATE_EXPORT_PROGRESS', payload: { id: taskId, progress: Math.floor(progress) } });
            }
        }, 600);
    };

    return (
        <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/20">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md z-20">
                <div>
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <PackageCheck className="w-5 h-5 text-indigo-500" />
                        智能备货清单 (Inventory Hub)
                    </h2>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 group-hover:text-white transition-colors" />
                        <input 
                            type="text" 
                            placeholder="搜索 SKU / 名称..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-64 pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg border border-indigo-500/30 flex items-center gap-1.5 transition-all"
                    >
                        <FileDown className="w-4 h-4"/> 导出报表
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 sticky top-0 z-10 border-b border-white/5">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">SKU</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">产品信息</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">库存天数</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-4 font-mono font-bold text-white">{item.sku}</td>
                                <td className="px-4 py-4 text-sm text-slate-300">{item.name}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.daysRemaining < 15 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        可售 {item.daysRemaining} 天
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button onClick={() => setEditingItem(item)} className="p-1.5 text-slate-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && <EditModal product={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveProduct} />}
        </div>
    );
};

export default Inventory;
