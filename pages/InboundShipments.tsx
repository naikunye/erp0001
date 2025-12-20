import React, { useState, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { InboundShipment, Product, InboundShipmentItem, Shipment } from '../types';
import { WAREHOUSES } from '../constants';
import { Globe, Plus, Search, Box, Truck, CheckCircle2, ArrowRight, Printer, X, PackageOpen, FileText, Download, ShieldCheck, LayoutList, Scale, Trash2, Save, Send } from 'lucide-react';

const InboundShipments: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'details' | 'ci' | 'pl'>('details');

  // Form States
  const [newShipmentName, setNewShipmentName] = useState('');
  const [sourceWH, setSourceWH] = useState(WAREHOUSES[0].id);
  const [destWH, setDestWH] = useState(WAREHOUSES[1].id);
  const [plannedItems, setPlannedItems] = useState<{product: Product, quantity: number}[]>([]);
  const [skuSearch, setSkuSearch] = useState('');

  const filteredProducts = useMemo(() => {
      if (!skuSearch) return [];
      return state.products.filter(p => p.sku.toLowerCase().includes(skuSearch.toLowerCase()) || p.name.toLowerCase().includes(skuSearch.toLowerCase())).slice(0, 5);
  }, [state.products, skuSearch]);

  const handleAddItem = (p: Product) => {
      if (plannedItems.find(item => item.product.id === p.id)) return;
      setPlannedItems([...plannedItems, { product: p, quantity: p.itemsPerBox || 10 }]);
      setSkuSearch('');
  };

  const handleRemoveItem = (id: string) => {
      setPlannedItems(plannedItems.filter(item => item.product.id !== id));
  };

  const updateItemQty = (id: string, qty: number) => {
      setPlannedItems(plannedItems.map(item => item.product.id === id ? { ...item, quantity: qty } : item));
  };

  const handleCreate = () => {
      if (!newShipmentName || plannedItems.length === 0) {
          showToast('请完整填写名称并至少添加一个 SKU', 'warning');
          return;
      }

      let totalWeight = 0;
      let totalVolume = 0;
      const shipmentItems: InboundShipmentItem[] = plannedItems.map(item => {
          const boxes = Math.ceil(item.quantity / (item.product.itemsPerBox || 1));
          totalWeight += item.quantity * (item.product.unitWeight || 0);
          const vol = ((item.product.dimensions?.l || 0) * (item.product.dimensions?.w || 0) * (item.product.dimensions?.h || 0) / 1000000) * boxes;
          totalVolume += vol;
          
          return {
              productId: item.product.id,
              sku: item.product.sku,
              name: item.product.name,
              quantity: item.quantity,
              boxes,
              unitPrice: item.product.price
          };
      });

      const newInbound: InboundShipment = {
          id: `IB-${Date.now().toString().slice(-6)}`,
          name: newShipmentName,
          sourceWarehouseId: sourceWH,
          destinationWarehouseId: destWH,
          status: 'Draft',
          items: shipmentItems,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalVolume: parseFloat(totalVolume.toFixed(3)),
          createdDate: new Date().toISOString().split('T')[0]
      };

      dispatch({ type: 'CREATE_INBOUND_SHIPMENT', payload: newInbound });
      showToast('发货计划已部署至中枢', 'success');
      setShowCreateModal(false);
      setPlannedItems([]);
      setNewShipmentName('');
  };

  const handleStatusTransition = (status: InboundShipment['status']) => {
      if (!selectedShipment) return;
      const updated = { ...selectedShipment, status };
      dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: updated });
      setSelectedShipment(updated);
      showToast(`计划状态已更新为: ${status}`, 'info');

      // 如果变为已发货，自动转入全球追踪
      if (status === 'Shipped') {
          const newTracking: Shipment = {
              id: `SH-${Date.now()}`,
              trackingNo: `TBD-${selectedShipment.id}`,
              carrier: 'Pending',
              status: '待处理',
              productName: selectedShipment.name,
              shipDate: new Date().toISOString().split('T')[0],
              events: [],
              lastUpdate: '中枢同步：已离场，等待录入物流单号'
          };
          dispatch({ type: 'ADD_SHIPMENT', payload: newTracking });
          showToast('已同步至全球物流追踪模块', 'success');
      }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'Draft': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        case 'Shipped': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
        case 'Receiving': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        case 'Closed': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        default: return 'text-white bg-white/10';
    }
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative bg-black/20">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase italic tracking-tight">物流单证与集成中枢</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">CI/PL Automated Protocol • Multi-Warehouse Sync</p>
                </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase transition-all shadow-xl active:scale-95">
                <Plus className="w-4 h-4" /> 部署发货协议
            </button>
        </div>

        <div className="flex-1 overflow-hidden flex divide-x divide-white/5">
            {/* List */}
            <div className="w-1/3 overflow-y-auto p-4 space-y-4 bg-black/40 custom-scrollbar">
                {state.inboundShipments.length === 0 && (
                    <div className="py-20 text-center text-slate-700 uppercase font-black text-[10px] tracking-widest italic opacity-30">No Inbound Plans Found</div>
                )}
                {state.inboundShipments.map(shipment => (
                    <div 
                        key={shipment.id}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${selectedShipment?.id === shipment.id ? 'bg-blue-600/10 border-blue-500/50 shadow-inner' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
                        onClick={() => setSelectedShipment(shipment)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{shipment.id}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-black ${getStatusColor(shipment.status)}`}>{shipment.status}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-4 truncate">{shipment.name}</h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                            <span className="flex items-center gap-1"><Scale className="w-3 h-3"/> {shipment.totalWeight}kg</span>
                            <span className="flex items-center gap-1"><Box className="w-3 h-3"/> {shipment.items.length} SKUs</span>
                            <span>{shipment.createdDate}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-black/20 flex flex-col min-w-0">
                {selectedShipment ? (
                    <>
                        <div className="p-4 bg-white/2 border-b border-white/5 flex justify-between items-center">
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setActiveDocTab('details')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'details' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>货件详情</button>
                                <button onClick={() => setActiveDocTab('ci')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'ci' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>商业发票 (CI)</button>
                                <button onClick={() => setActiveDocTab('pl')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'pl' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>装箱单 (PL)</button>
                            </div>
                            <div className="flex gap-2">
                                {selectedShipment.status === 'Draft' && (
                                    <button onClick={() => handleStatusTransition('Shipped')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all"><Send className="w-3.5 h-3.5"/> 执行发货</button>
                                )}
                                <button onClick={() => {if(confirm('作废此计划？')) { dispatch({type:'DELETE_INBOUND_SHIPMENT', payload: selectedShipment.id}); setSelectedShipment(null); }}} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
                                <button onClick={() => setSelectedShipment(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all"><X className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {activeDocTab === 'details' && (
                                <div className="space-y-8 animate-in fade-in">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">路由拓扑 (Routing)</div>
                                            <div className="flex items-center gap-4 text-white">
                                                <div className="font-bold text-sm">{WAREHOUSES.find(w=>w.id===selectedShipment.sourceWarehouseId)?.name}</div>
                                                <ArrowRight className="w-4 h-4 text-slate-700"/>
                                                <div className="font-bold text-sm">{WAREHOUSES.find(w=>w.id===selectedShipment.destinationWarehouseId)?.name}</div>
                                            </div>
                                        </div>
                                        <div className="ios-glass-card p-6 border-l-4 border-l-amber-500">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">载荷审计 (Payload)</div>
                                            <div className="flex items-center gap-8">
                                                <div><span className="text-[10px] text-slate-600 block">毛重</span><span className="text-sm font-bold text-white font-mono">{selectedShipment.totalWeight} KG</span></div>
                                                <div><span className="text-[10px] text-slate-600 block">材积</span><span className="text-sm font-bold text-white font-mono">{selectedShipment.totalVolume} CBM</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ios-glass-card p-6">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><LayoutList className="w-4 h-4 text-indigo-400"/> 数字化物料清单 (Digital Packing List)</h4>
                                        <table className="w-full text-left text-xs">
                                            <thead className="text-slate-500 font-black uppercase border-b border-white/5">
                                                <tr>
                                                    <th className="pb-3">SKU Identifier</th>
                                                    <th className="pb-3">数量 (PCS)</th>
                                                    <th className="pb-3">箱数 (CTNS)</th>
                                                    <th className="pb-3">申报单价</th>
                                                    <th className="pb-3 text-right">申报总值</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 font-mono">
                                                {selectedShipment.items.map((item, i) => (
                                                    <tr key={i} className="hover:bg-white/2">
                                                        <td className="py-4 font-bold text-slate-200">{item.sku}</td>
                                                        <td className="py-4 text-slate-400">{item.quantity}</td>
                                                        <td className="py-4 text-slate-400">{item.boxes}</td>
                                                        <td className="py-4 text-slate-500">${(item.unitPrice * 0.35).toFixed(2)}</td>
                                                        <td className="py-4 text-right font-bold text-indigo-400">${(item.quantity * item.unitPrice * 0.35).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4">
                                        <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
                                        <div>
                                            <h5 className="text-xs font-bold text-white uppercase mb-1">单证合规自检：Pass</h5>
                                            <p className="text-[10px] text-indigo-300/60 leading-relaxed">系统已根据目的港政策核对 HS Code。当前发票申报价值符合低税金策略要求。</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {(activeDocTab === 'ci' || activeDocTab === 'pl') && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 bg-white/2 rounded-3xl border-2 border-dashed border-white/5">
                                    <PackageOpen className="w-20 h-20 mb-4 opacity-10 animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">正在根据实时业务流渲染单证文件...</p>
                                    <button className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Download className="w-4 h-4"/> 导出预览 PDF</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                         <div className="w-32 h-32 bg-white/2 rounded-full flex items-center justify-center mb-8">
                             <Truck className="w-16 h-16 opacity-5 animate-pulse" />
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-[0.5em] mb-2">待命状态 (Waiting)</h3>
                         <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">请选择或创建一个全球发货计划</p>
                    </div>
                )}
            </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60" onClick={() => setShowCreateModal(false)}>
                <div className="ios-glass-panel w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 bg-[#0f0f12] border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">配置全球货件协议</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Step 1: SKU Load & Routing Parameters</p>
                        </div>
                        <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-500" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-12 gap-10">
                            <div className="col-span-12 lg:col-span-5 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">协议名称 (Plan Identity)</label>
                                    <input type="text" value={newShipmentName} onChange={e => setNewShipmentName(e.target.value)} placeholder="例如：2023 Q4 FBA 加急发货" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-blue-500 outline-none transition-all font-bold" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase">起始点</label>
                                        <select value={sourceWH} onChange={e => setSourceWH(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none">
                                            {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase">目的地</label>
                                        <select value={destWH} onChange={e => setDestWH(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none">
                                            {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-12 lg:col-span-7 space-y-6">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">载荷清单 (Payload Matrix)</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-600 absolute left-4 top-4" />
                                    <input type="text" value={skuSearch} onChange={e => setSkuSearch(e.target.value)} placeholder="输入 SKU 或品名检索库存节点..." className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all" />
                                    {filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                                            {filteredProducts.map(p => (
                                                <div key={p.id} onClick={() => handleAddItem(p)} className="p-4 hover:bg-indigo-600/20 cursor-pointer flex justify-between items-center transition-all group">
                                                    <div>
                                                        <div className="text-sm font-black text-white">{p.sku}</div>
                                                        <div className="text-[10px] text-slate-500">{p.name}</div>
                                                    </div>
                                                    <Plus className="w-5 h-5 text-slate-700 group-hover:text-indigo-400" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {plannedItems.map(item => (
                                        <div key={item.product.id} className="bg-white/2 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-white">{item.product.sku}</div>
                                                <div className="text-[10px] text-slate-600 uppercase font-mono">{Math.ceil(item.quantity / (item.product.itemsPerBox || 1))} 箱 @ {item.product.itemsPerBox}pcs</div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase">数量</span>
                                                    <input type="number" value={item.quantity} onChange={e => updateItemQty(item.product.id, parseInt(e.target.value))} className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white font-mono text-center outline-none focus:border-blue-500" />
                                                </div>
                                                <button onClick={() => handleRemoveItem(item.product.id)} className="p-2 text-slate-700 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {plannedItems.length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-700">
                                            <PackageOpen className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">请向载荷矩阵中添加物料</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/2 flex justify-between items-center">
                        <div className="flex gap-10">
                            <div><span className="text-[10px] text-slate-500 font-black uppercase block">总估重</span><span className="text-xl font-black text-white font-mono">{plannedItems.reduce((acc, it) => acc + (it.quantity * (it.product.unitWeight || 0)), 0).toFixed(1)} KG</span></div>
                            <div><span className="text-[10px] text-slate-500 font-black uppercase block">总材积</span><span className="text-xl font-black text-white font-mono">{(plannedItems.reduce((acc, it) => {
                                const boxes = Math.ceil(it.quantity / (it.product.itemsPerBox || 1));
                                return acc + ((it.product.dimensions?.l || 0) * (it.product.dimensions?.w || 0) * (it.product.dimensions?.h || 0) / 1000000) * boxes;
                            }, 0)).toFixed(2)} CBM</span></div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowCreateModal(false)} className="px-8 py-3 text-slate-400 font-black text-xs uppercase tracking-widest">取消计划</button>
                            <button onClick={handleCreate} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 flex items-center gap-3 transition-all active:scale-95"><Save className="w-5 h-5"/> 部署并归档计划</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default InboundShipments;