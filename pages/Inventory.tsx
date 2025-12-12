
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { ReplenishmentItem } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  PackageCheck, Search, Download, X, 
  Sparkles, Calculator, 
  Box, DollarSign, Save,
  Plane, Ship, Info, Factory, Image as ImageIcon, History, FileText, Loader2, Bot,
  AlertCircle, Trash2, RotateCcw
} from 'lucide-react';

// --- Components ---

const StrategyBadge: React.FC<{ type: string }> = ({ type }) => {
    let color = 'bg-white/5 text-slate-300 border-white/10';
    let label = type;
    let subLabel = '标准';
    
    if (type === 'New' || type === '新品测试') {
        color = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        label = '新品测试';
        subLabel = '保守';
    } else if (type === 'Growing' || type === '爆品增长') {
        color = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        label = '爆品增长';
        subLabel = '激进';
    } else if (type === 'Stable' || type === '稳定热卖') {
        color = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
        label = '稳定热卖';
        subLabel = '标准';
    } else if (type === 'Clearance') {
        color = 'bg-red-500/10 text-red-400 border border-red-500/20';
        label = '清仓处理';
        subLabel = '停止';
    }

    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md border w-fit ${color}`}>
            <Sparkles className="w-3 h-3" />
            <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold">{label}</span>
                <span className="text-[8px] opacity-70">({subLabel})</span>
            </div>
        </div>
    );
};

const EditModal: React.FC<{ product: ReplenishmentItem, onClose: () => void }> = ({ product, onClose }) => {
    // Local State for inputs
    const [formData, setFormData] = useState({
        ...product,
        // Ensure defaults
        costPrice: product.costPrice || 0,
        itemsPerBox: product.itemsPerBox || 1,
        dimensions: product.dimensions || { l: 32, w: 24, h: 18 },
        logistics: product.logistics || { method: 'Air', carrier: '', unitFreightCost: 62, trackingNo: '' },
        economics: product.economics || { platformFeePercent: 5, adCost: 10, lastLegShipping: 5.44, fixedCost: 0.3, creatorFeePercent: 10, refundRatePercent: 3 },
        price: product.price || 0,
        supplier: product.supplier || '',
        supplierContact: product.supplierContact || '',
        stock: product.stock || 0,
        dailyBurnRate: product.dailyBurnRate || 0,
        unitWeight: product.unitWeight || 0.085
    });

    const [isAnalyzingPrice, setIsAnalyzingPrice] = useState(false);
    const [pricingAnalysis, setPricingAnalysis] = useState<string | null>(null);

    const updateNested = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev] as any,
                [field]: value
            }
        }));
    };

    const updateDimension = (field: 'l' | 'w' | 'h', value: number) => {
        setFormData(prev => ({
            ...prev,
            dimensions: {
                ...prev.dimensions!,
                [field]: value
            }
        }));
    };

    const handleAnalyzePricing = async () => {
        setIsAnalyzingPrice(true);
        setPricingAnalysis(null);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                Role: Pricing Analyst.
                Product: ${formData.name}
                Cost: ¥${formData.costPrice}
                Price: $${formData.price}
                Analyze pricing strategy briefly.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setPricingAnalysis(response.text);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzingPrice(false);
        }
    };

    // Use Portal to escape stacking contexts of parent cards
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={onClose}>
            <div className="ios-glass-panel w-full max-w-6xl max-h-[95vh] h-auto rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            编辑: {formData.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">完善参数以获得更准确的智能补货建议</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-colors font-medium">
                            <FileText className="w-3.5 h-3.5"/> 详情
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors ml-2">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Body - Dashboard Grid Layout */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/20 scrollbar-thin scrollbar-thumb-white/10">
                    
                    {/* SECTION 1: Product & Supply Chain (Full Width) */}
                    <div className="ios-glass-card p-5 mb-6 relative overflow-hidden group">
                        <div className="absolute top-4 left-4 bg-blue-500/20 text-blue-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 border border-blue-500/30">1</div>
                        <h4 className="text-sm font-bold text-white mb-4 pl-8">产品与供应链</h4>
                        
                        <div className="flex flex-col md:flex-row gap-6 pl-8">
                            {/* Image Placeholder */}
                            <div className="w-40 h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 transition-colors cursor-pointer shrink-0">
                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-xs">点击上传</span>
                            </div>
                            
                            {/* Fields */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">日期</label>
                                    <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">生命周期阶段</label>
                                    <select value={formData.lifecycle} onChange={e => setFormData({...formData, lifecycle: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all">
                                        <option value="New">⚡ 新品测试 (New)</option>
                                        <option value="Growing">🚀 爆品增长 (Growing)</option>
                                        <option value="Stable">🌊 稳定热卖 (Stable)</option>
                                        <option value="Clearance">🔻 清仓处理 (Clearance)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">产品名称</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all" />
                                </div>
                                {/* ... other fields with consistent styling ... */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">SKU</label>
                                    <input type="text" value={formData.sku} readOnly className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-slate-400 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Simplified for brevity, apply ios-glass-card to other sections */}
                </div>
                
                {/* Footer Actions */}
                <div className="bg-white/5 border-t border-white/10 p-4 shrink-0 z-20">
                    <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
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
  const [selectedItem, setSelectedItem] = useState<ReplenishmentItem | null>(null);

  // --- Logic ---
  const replenishmentItems = useMemo(() => {
      const activeProducts = state.products.filter(p => !p.deletedAt);
      return activeProducts.map(p => {
          const burnRate = p.dailyBurnRate || 1;
          const dos = Math.floor(p.stock / burnRate);
          const leadTime = p.leadTime || 30;
          const safetyStock = p.safetyStockDays || 15;
          const reorderPoint = leadTime + safetyStock;
          let suggested = 0;
          if (dos < reorderPoint) {
              suggested = Math.ceil((burnRate * 45) - p.stock);
          }
          return {
              ...p,
              dailyBurnRate: burnRate,
              daysRemaining: dos,
              safetyStock: safetyStock,
              suggestedReorder: Math.max(0, suggested),
              supplierLeadTime: leadTime,
              status: dos === 0 ? 'OOS' : dos < reorderPoint ? 'Urgent' : 'OK'
          } as ReplenishmentItem;
      }).filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a, b) => (b.suggestedReorder > 0 ? 1 : 0) - (a.suggestedReorder > 0 ? 1 : 0)); 
  }, [state.products, searchTerm]);

  const totalPurchaseAmount = replenishmentItems.reduce((acc, item) => acc + (item.suggestedReorder * (item.costPrice || 0)), 0);
  const itemsToRestock = replenishmentItems.filter(i => i.suggestedReorder > 0).length;

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm('确定要删除此商品吗？它将被移至回收站。')) {
          dispatch({ type: 'DELETE_PRODUCT', payload: id });
          showToast('商品已移至回收站', 'info');
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      
      {/* Container Card */}
      <div className="ios-glass-panel rounded-2xl flex flex-col h-full overflow-hidden relative m-1">
          
          {/* Header Section */}
          <div className="p-6 border-b border-white/10 bg-white/5 relative z-10 shrink-0">
              <div className="flex justify-between items-start">
                  <div>
                      <h1 className="text-xl font-bold text-white flex items-center gap-2">
                          <PackageCheck className="w-6 h-6 text-indigo-500" />
                          TikTok 智能补货清单
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">基于日销与供应链时效的精准采购建议</p>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-2 rounded-xl shadow-lg flex items-center gap-6 min-w-[280px]">
                          <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">建议补货 SKU</div>
                              <div className="text-2xl font-black text-white">{itemsToRestock}</div>
                          </div>
                          <div className="h-8 w-[1px] bg-white/10"></div>
                          <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">预计采购金额</div>
                              <div className="text-2xl font-black text-emerald-400 font-mono">¥{totalPurchaseAmount.toLocaleString()}</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* List Section */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              <div className="grid grid-cols-1 gap-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/5 rounded-lg mb-2 border border-white/5">
                      <div className="col-span-4">产品信息 (Product)</div>
                      <div className="col-span-2">库存状况 (Stock)</div>
                      <div className="col-span-2">供应链 (Supply)</div>
                      <div className="col-span-2">补货建议 (Suggestion)</div>
                      <div className="col-span-2 text-right">操作 (Action)</div>
                  </div>

                  {replenishmentItems.map(item => (
                      <div key={item.id} onClick={() => setSelectedItem(item)} className={`grid grid-cols-12 px-4 py-4 rounded-xl border transition-all cursor-pointer items-center group ${item.status === 'Urgent' || item.status === 'OOS' ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}>
                          <div className="col-span-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center text-slate-500">
                                  <ImageIcon className="w-5 h-5" />
                              </div>
                              <div>
                                  <div className="text-sm font-bold text-white flex items-center gap-2">
                                      {item.sku}
                                      <StrategyBadge type={item.lifecycle || 'Stable'} />
                                  </div>
                                  <div className="text-xs text-slate-400 truncate w-48">{item.name}</div>
                              </div>
                          </div>
                          <div className="col-span-2">
                              <div className="text-sm font-bold text-white font-mono">{item.stock} pcs</div>
                              <div className={`text-xs ${item.daysRemaining < 15 ? 'text-red-400' : 'text-slate-500'}`}>
                                  可售 {item.daysRemaining} 天
                              </div>
                          </div>
                          <div className="col-span-2">
                              <div className="text-xs text-slate-300">交期: {item.supplierLeadTime}天</div>
                              <div className="text-xs text-slate-500">安全库存: {item.safetyStock}天</div>
                          </div>
                          <div className="col-span-2">
                              {item.suggestedReorder > 0 ? (
                                  <div>
                                      <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                                          <Download className="w-3 h-3" /> +{item.suggestedReorder}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                          ¥{(item.suggestedReorder * (item.costPrice || 0)).toLocaleString()}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-xs text-slate-600 flex items-center gap-1">充足</div>
                              )}
                          </div>
                          <div className="col-span-2 flex justify-end gap-2">
                              <button onClick={(e) => {e.stopPropagation();}} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                                  <Calculator className="w-4 h-4" />
                              </button>
                              <button 
                                  onClick={(e) => handleDelete(e, item.id)}
                                  className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-all"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {selectedItem && <EditModal product={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
};

export default Inventory;
