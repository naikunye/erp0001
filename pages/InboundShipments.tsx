
import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { InboundShipment, Product, Warehouse } from '../types';
import { WAREHOUSES } from '../constants';
import { Container, Plus, Search, Box, Truck, CheckCircle2, ArrowRight, Printer, MapPin, X, PackageOpen, Ruler } from 'lucide-react';

const InboundShipments: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null);

  // New Shipment Form State
  const [newShipmentName, setNewShipmentName] = useState('');
  const [sourceWH, setSourceWH] = useState(WAREHOUSES[0].id);
  const [destWH, setDestWH] = useState(WAREHOUSES[1].id);
  const [selectedProducts, setSelectedProducts] = useState<{product: Product, quantity: number}[]>([]);
  const [skuSearch, setSkuSearch] = useState('');

  const handleCreate = () => {
      if (!newShipmentName || selectedProducts.length === 0) {
          showToast('请填写计划名称并选择至少一个 SKU', 'warning');
          return;
      }

      // Calculate totals
      let totalWeight = 0;
      let totalVolume = 0;
      const shipmentItems = selectedProducts.map(sp => {
          const boxes = Math.ceil(sp.quantity / (sp.product.itemsPerBox || 1));
          totalWeight += sp.quantity * (sp.product.unitWeight || 0);
          const vol = (sp.product.dimensions?.l || 0) * (sp.product.dimensions?.w || 0) * (sp.product.dimensions?.h || 0) / 1000000; // m3
          totalVolume += vol * boxes;
          
          return {
              productId: sp.product.id,
              sku: sp.product.sku,
              name: sp.product.name,
              quantity: sp.quantity,
              boxes
          };
      });

      const newShipment: InboundShipment = {
          id: `FBA-${Date.now().toString().slice(-6)}`,
          name: newShipmentName,
          sourceWarehouseId: sourceWH,
          destinationWarehouseId: destWH,
          status: 'Draft',
          items: shipmentItems,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalVolume: parseFloat(totalVolume.toFixed(3)),
          createdDate: new Date().toISOString().split('T')[0]
      };

      dispatch({ type: 'CREATE_INBOUND_SHIPMENT', payload: newShipment });
      showToast('发货计划已创建 (Draft)', 'success');
      setShowCreateModal(false);
      resetForm();
  };

  const resetForm = () => {
      setNewShipmentName('');
      setSelectedProducts([]);
      setSkuSearch('');
  };

  const addProductToShipment = (product: Product) => {
      if (selectedProducts.find(p => p.product.id === product.id)) return;
      setSelectedProducts([...selectedProducts, { product, quantity: product.itemsPerBox || 10 }]);
  };

  const removeProduct = (id: string) => {
      setSelectedProducts(selectedProducts.filter(p => p.product.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
      setSelectedProducts(selectedProducts.map(p => p.product.id === id ? { ...p, quantity: qty } : p));
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'Draft': return 'bg-slate-700 text-slate-300 border-slate-600';
          case 'Working': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          case 'Shipped': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
          case 'Receiving': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          case 'Closed': return 'bg-slate-800 text-slate-500 border-slate-700';
          default: return 'bg-slate-700 text-slate-300';
      }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <Container className="w-5 h-5 text-indigo-500" />
                    FBA 发货计划 (Inbound Shipments)
                </h2>
                <p className="text-xs text-slate-500 mt-1">管理从本地仓/供应商发往 Amazon FBA 的货件</p>
            </div>
            <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 text-sm font-bold"
            >
                <Plus className="w-4 h-4" />
                <span>创建货件</span>
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {state.inboundShipments.map(shipment => (
                <div 
                    key={shipment.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all group relative cursor-pointer"
                    onClick={() => setSelectedShipment(shipment)}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-sm">{shipment.name}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(shipment.status)}`}>{shipment.status}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-1">{shipment.id} • {shipment.createdDate}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-white">{shipment.totalWeight} kg</div>
                            <div className="text-xs text-slate-500">{shipment.totalVolume.toFixed(2)} cbm</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 bg-slate-900/50 p-2 rounded border border-slate-800/50">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{WAREHOUSES.find(w => w.id === shipment.sourceWarehouseId)?.name.split('(')[0]}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-indigo-400">{WAREHOUSES.find(w => w.id === shipment.destinationWarehouseId)?.name.split('(')[0]}</span>
                    </div>

                    <div className="space-y-2">
                        {shipment.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-1 last:border-0">
                                <span className="text-slate-300">{item.sku}</span>
                                <span className="text-slate-500 font-mono">{item.quantity} pcs ({item.boxes} boxes)</span>
                            </div>
                        ))}
                        {shipment.items.length > 3 && (
                            <div className="text-center text-[10px] text-slate-500 italic">+ {shipment.items.length - 3} 更多 SKU</div>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70" onClick={() => setShowCreateModal(false)}>
                <div className="bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <PackageOpen className="w-5 h-5 text-indigo-500" />
                            新建发货计划
                        </h3>
                        <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Step 1: Basic Info */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-1 space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">计划名称</label>
                                    <input type="text" value={newShipmentName} onChange={e => setNewShipmentName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white" placeholder="e.g. 10月大促补货" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">发货仓库 (From)</label>
                                    <select value={sourceWH} onChange={e => setSourceWH(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white">
                                        {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">目的仓库 (To)</label>
                                    <select value={destWH} onChange={e => setDestWH(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white">
                                        {WAREHOUSES.filter(w => w.type === 'FBA').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Step 2: Product Selection */}
                            <div className="col-span-2 bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col">
                                <div className="mb-4 relative">
                                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input 
                                        type="text" 
                                        value={skuSearch}
                                        onChange={e => setSkuSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                                        placeholder="搜索 SKU 添加商品..." 
                                    />
                                    {skuSearch && (
                                        <div className="absolute top-full left-0 w-full bg-slate-900 border border-slate-700 rounded-lg mt-1 z-10 max-h-48 overflow-y-auto shadow-xl">
                                            {state.products
                                                .filter(p => p.sku.toLowerCase().includes(skuSearch.toLowerCase()) || p.name.toLowerCase().includes(skuSearch.toLowerCase()))
                                                .slice(0, 5)
                                                .map(p => (
                                                    <div 
                                                        key={p.id} 
                                                        className="p-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs"
                                                        onClick={() => { addProductToShipment(p); setSkuSearch(''); }}
                                                    >
                                                        <span className="text-white font-bold">{p.sku}</span>
                                                        <span className="text-slate-400 truncate w-32">{p.name}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2">
                                    {selectedProducts.map((item, idx) => (
                                        <div key={item.product.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg flex items-center gap-4">
                                            <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-xs font-bold text-slate-400">{idx + 1}</div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white">{item.product.sku}</div>
                                                <div className="text-[10px] text-slate-500">{item.product.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 mb-1">发货数量 (pcs)</div>
                                                <input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={e => updateQuantity(item.product.id, parseInt(e.target.value))}
                                                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-sm text-white font-mono" 
                                                />
                                            </div>
                                            <div className="text-right w-20">
                                                <div className="text-[10px] text-slate-500 mb-1">预估箱数</div>
                                                <div className="text-sm text-indigo-400 font-mono font-bold">
                                                    {Math.ceil(item.quantity / (item.product.itemsPerBox || 1))}
                                                </div>
                                            </div>
                                            <button onClick={() => removeProduct(item.product.id)} className="text-slate-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {selectedProducts.length === 0 && (
                                        <div className="text-center text-slate-500 text-xs py-10">请搜索并添加商品</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                        <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">取消</button>
                        <button onClick={handleCreate} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg">创建计划</button>
                    </div>
                </div>
            </div>
        )}

        {/* Detail Modal */}
        {selectedShipment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70" onClick={() => setSelectedShipment(null)}>
                <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {selectedShipment.name}
                                <span className={`text-xs px-2 py-0.5 rounded border font-normal ${getStatusColor(selectedShipment.status)}`}>{selectedShipment.status}</span>
                            </h3>
                            <div className="text-xs text-slate-500 font-mono mt-1">ID: {selectedShipment.id}</div>
                        </div>
                        <button onClick={() => setSelectedShipment(null)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-sm">
                            <div className="text-center">
                                <div className="text-xs text-slate-500 mb-1">总重量 (Total Weight)</div>
                                <div className="font-bold text-white">{selectedShipment.totalWeight} kg</div>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-800"></div>
                            <div className="text-center">
                                <div className="text-xs text-slate-500 mb-1">总体积 (Total Volume)</div>
                                <div className="font-bold text-white">{selectedShipment.totalVolume.toFixed(2)} cbm</div>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-800"></div>
                            <div className="text-center">
                                <div className="text-xs text-slate-500 mb-1">SKU 总数</div>
                                <div className="font-bold text-white">{selectedShipment.items.length}</div>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            <h4 className="text-xs font-bold text-slate-500 uppercase">装箱单 (Packing List)</h4>
                            {selectedShipment.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-800/50 rounded-lg text-sm">
                                    <div className="flex items-center gap-3">
                                        <Box className="w-4 h-4 text-indigo-500" />
                                        <div>
                                            <div className="text-white font-bold">{item.sku}</div>
                                            <div className="text-xs text-slate-500">{item.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-mono">{item.quantity} pcs</div>
                                        <div className="text-xs text-slate-500">{item.boxes} boxes</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-800">
                            <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                                <Printer className="w-4 h-4" /> 打印外箱标签 (PDF)
                            </button>
                            <button 
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                                onClick={() => {
                                    showToast('发货成功！库存已扣减。', 'success');
                                    setSelectedShipment(null);
                                }}
                            >
                                <Truck className="w-4 h-4" /> 确认发货
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default InboundShipments;
