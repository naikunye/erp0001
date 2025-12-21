import React, { useState, useMemo, useEffect } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { InboundShipment, Product, InboundShipmentItem, Shipment } from '../types';
import { Globe, Plus, Search, Box, Truck, CheckCircle2, ArrowRight, X, PackageOpen, LayoutList, Scale, Trash2, Save, Send, Edit3, Check, RotateCcw, ShieldCheck, Download, Weight, Calculator, FileText, Plane, Ship, Link2, ExternalLink, Tag, Zap, RefreshCw } from 'lucide-react';

const InboundShipments: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  
  // --- 1. 状态定义 ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'details' | 'ci' | 'pl'>('details');
  
  const [skuSearch, setSkuSearch] = useState('');
  const [detailSkuSearch, setDetailSkuSearch] = useState('');
  const [isSyncingToMatrix, setIsSyncingToMatrix] = useState(false);

  // 编辑模式核心状态
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<InboundShipment | null>(null);

  // 新建协议表单状态
  const [newShipmentName, setNewShipmentName] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'Air' | 'Sea'>('Air');
  const [newTrackingNo, setNewTrackingNo] = useState('');
  const [newCarrier, setNewCarrier] = useState('');
  const [sourceNode, setSourceNode] = useState('深圳分拨中心');
  const [destNode, setDestNode] = useState('FBA-US-WEST');
  const [plannedItems, setPlannedItems] = useState<{product: Product, quantity: number}[]>([]);

  // --- 2. 搜索过滤逻辑 ---
  const filteredProducts = useMemo(() => {
      const q = showCreateModal ? skuSearch : (isEditing ? detailSkuSearch : '');
      if (!q || q.length < 1) return [];
      return state.products.filter(p => 
          p.sku.toLowerCase().includes(q.toLowerCase()) || 
          p.name.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 5);
  }, [state.products, skuSearch, detailSkuSearch, isEditing, showCreateModal]);

  // --- 3. 生命周期监控 ---
  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
    setAiSyncStatus(null);
  }, [selectedShipment]);

  const [aiSyncStatus, setAiSyncStatus] = useState<string | null>(null);

  // --- 4. 业务核心交互函数 ---

  // 执行同步至物流追踪模块的逻辑
  const syncToTrackingMatrix = async (shipment: InboundShipment) => {
      if (shipment.status === 'Draft') return;
      setIsSyncingToMatrix(true);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
          // 查找是否已经存在对应的追踪节点 (根据 notes 里的标记 ID 查找，防止修改单号后找不到)
          const existingTracking = state.shipments.find(s => s.notes?.includes(shipment.id));
          
          const skuSummary = shipment.items.map(i => i.sku).slice(0, 2).join(', ') + (shipment.items.length > 2 ? '...' : '');
          
          if (existingTracking) {
              // 修正模式：更新现有节点
              const updatedTracking: Shipment = {
                  ...existingTracking,
                  trackingNo: shipment.trackingNumber || existingTracking.trackingNo,
                  carrier: shipment.carrier || existingTracking.carrier,
                  origin: shipment.sourceWarehouseId,
                  destination: shipment.destinationWarehouseId,
                  productName: `批次: ${shipment.name} (${skuSummary})`,
                  lastUpdate: `数据已同步修正 (TS: ${new Date().toLocaleTimeString()})`
              };
              dispatch({ type: 'UPDATE_SHIPMENT', payload: updatedTracking });
              showToast('物流追踪节点已同步更新', 'success');
          } else {
              // 补入模式：如果之前没生成（比如直接跳过草稿），现在生成
              const trackingNode: Shipment = {
                  id: `SH-${Date.now()}`,
                  trackingNo: shipment.trackingNumber || 'PENDING',
                  carrier: shipment.carrier || 'Global Carrier',
                  status: '运输中',
                  origin: shipment.sourceWarehouseId,
                  destination: shipment.destinationWarehouseId,
                  productName: `批次: ${shipment.name} (${skuSummary})`,
                  shipDate: shipment.shippedDate || new Date().toISOString().split('T')[0],
                  lastUpdate: '资产离场，同步至全球追踪矩阵',
                  events: [
                      { date: shipment.shippedDate || shipment.createdDate, time: '10:00', location: shipment.sourceWarehouseId, description: '货件协议激活，同步至追踪系统', status: 'Normal' }
                  ],
                  notes: `由物流中枢 ${shipment.id} 自动同步`
              };
              dispatch({ type: 'ADD_SHIPMENT', payload: trackingNode });
              showToast('已在追踪矩阵中创建新节点', 'success');
          }
      } catch (e) {
          showToast('矩阵同步链路异常', 'error');
      } finally {
          setIsSyncingToMatrix(false);
      }
  };

  const handleAddItem = (p: Product) => {
      const defaultQty = p.itemsPerBox || 10;
      const currentMethod = showCreateModal ? shippingMethod : (editForm?.method || 'Air');
      const defaultRate = currentMethod === 'Air' ? (p.logistics?.unitFreightCost || 35) : 8; 
      const defaultTotalWeight = (p.unitWeight || 0.5) * defaultQty;

      if (showCreateModal) {
          setPlannedItems(prev => {
              if (prev.find(it => it.product.id === p.id)) {
                  showToast(`${p.sku} 已在计划清单中`, 'warning');
                  return prev;
              }
              showToast(`已录入: ${p.sku}`, 'success');
              return [...prev, { product: p, quantity: defaultQty }];
          });
          setSkuSearch('');
      } else if (isEditing && editForm) {
          if (editForm.items.find(it => it.productId === p.id)) {
              showToast('该 SKU 已在协议清单中', 'warning');
              setDetailSkuSearch('');
              return;
          }
          const newItem: InboundShipmentItem = {
              productId: p.id,
              sku: p.sku,
              name: p.name,
              quantity: defaultQty,
              boxes: Math.ceil(defaultQty / (p.itemsPerBox || 1)),
              unitPrice: p.price || 0,
              rowTotalWeight: defaultTotalWeight,
              freightRate: defaultRate
          };
          const updatedItems = [...editForm.items, newItem];
          recalculateAndSetEditForm(updatedItems);
          setDetailSkuSearch('');
          showToast(`已追加 SKU: ${p.sku}`, 'success');
      }
  };

  const recalculateAndSetEditForm = (items: InboundShipmentItem[]) => {
      let totalWeight = 0;
      let totalVolume = 0;
      items.forEach(it => {
          totalWeight += Number(it.rowTotalWeight || 0);
          const p = state.products.find(prod => prod.id === it.productId);
          if (p) {
              const boxes = Math.ceil(it.quantity / (p.itemsPerBox || 1));
              const vol = ((p.dimensions?.l || 0) * (p.dimensions?.w || 0) * (p.dimensions?.h || 0) / 1000000) * boxes;
              totalVolume += vol;
          }
      });
      setEditForm(prev => prev ? ({
          ...prev,
          items,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalVolume: parseFloat(totalVolume.toFixed(3))
      }) : null);
  };

  const updateItemProperty = (productId: string, field: string, rawValue: string) => {
      if (!editForm) return;
      const value = rawValue === '' ? 0 : parseFloat(rawValue);
      const updatedItems = editForm.items.map(it => {
          if (it.productId === productId) {
              const updated = { ...it, [field]: value };
              if (field === 'quantity') {
                  const p = state.products.find(prod => prod.id === productId);
                  updated.boxes = Math.ceil(value / (p?.itemsPerBox || 1));
              }
              return updated;
          }
          return it;
      });
      recalculateAndSetEditForm(updatedItems);
  };

  const handleRemoveItem = (productId: string) => {
      if (!editForm) return;
      const updatedItems = editForm.items.filter(it => it.productId !== productId);
      recalculateAndSetEditForm(updatedItems);
  };

  const handleSaveEdit = async () => {
      if (!editForm) return;
      if (!editForm.name.trim()) return showToast('协议名称不能为空', 'warning');
      
      dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: editForm });
      
      // 保存后自动触发一次同步（如果是已离场状态）
      if (editForm.status === 'Shipped') {
          await syncToTrackingMatrix(editForm);
      } else {
          showToast('协议内容已局部修正', 'success');
      }

      setSelectedShipment(editForm);
      setIsEditing(false);
  };

  const handleShipOut = async () => {
      if (!selectedShipment) return;
      if (!selectedShipment.trackingNumber) {
          showToast('请先录入正式运单号再执行离场', 'warning');
          setEditForm({...selectedShipment});
          setIsEditing(true);
          return;
      }

      const updated = { 
          ...selectedShipment, 
          status: 'Shipped' as const, 
          shippedDate: new Date().toISOString().split('T')[0] 
      };
      dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: updated });
      setSelectedShipment(updated);

      // 首次离场同步
      await syncToTrackingMatrix(updated);
  };

  const handleCreateNew = () => {
      if (!newShipmentName || plannedItems.length === 0) return showToast('请配置协议标识与载荷清单', 'warning');
      
      let totalWeight = 0; let totalVolume = 0;
      const shipmentItems = plannedItems.map(item => {
          const boxes = Math.ceil(item.quantity / (item.product.itemsPerBox || 1));
          const rowW = (item.product.unitWeight || 0.5) * item.quantity;
          const fr = shippingMethod === 'Air' ? (item.product.logistics?.unitFreightCost || 35) : 8;
          totalWeight += rowW;
          const vol = ((item.product.dimensions?.l || 0) * (item.product.dimensions?.w || 0) * (item.product.dimensions?.h || 0) / 1000000) * boxes;
          totalVolume += vol;
          return {
              productId: item.product.id, sku: item.product.sku, name: item.product.name,
              quantity: item.quantity, boxes, unitPrice: item.product.price || 0,
              rowTotalWeight: rowW, freightRate: fr
          };
      });

      const newInbound: InboundShipment = {
          id: `IB-${Date.now().toString().slice(-6)}`,
          name: newShipmentName, method: shippingMethod,
          trackingNumber: newTrackingNo, carrier: newCarrier,
          sourceWarehouseId: sourceNode, destinationWarehouseId: destNode,
          status: 'Draft', items: shipmentItems as any,
          totalWeight: parseFloat(totalWeight.toFixed(2)), totalVolume: parseFloat(totalVolume.toFixed(3)),
          createdDate: new Date().toISOString().split('T')[0]
      };

      dispatch({ type: 'CREATE_INBOUND_SHIPMENT', payload: newInbound });
      showToast('新发货协议已激活并存入矩阵', 'success');
      setShowCreateModal(false);
      setPlannedItems([]); setNewShipmentName(''); setNewTrackingNo(''); setNewCarrier('');
  };

  // --- 5. 渲染 ---
  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative bg-black/20 font-sans">
        {/* Top Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase italic tracking-tight">跨境物流与单证协同中枢</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Quantum Logistics Hub • Sync v11.0</p>
                </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase transition-all shadow-xl active:scale-95">
                <Plus className="w-4 h-4" /> 部署新发货协议
            </button>
        </div>

        <div className="flex-1 overflow-hidden flex divide-x divide-white/5">
            {/* Left Column */}
            <div className="w-1/4 overflow-y-auto p-4 space-y-4 bg-black/40 custom-scrollbar">
                {state.inboundShipments.map(shipment => (
                    <div 
                        key={shipment.id}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${selectedShipment?.id === shipment.id ? 'bg-blue-600/10 border-blue-500/50 shadow-inner' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
                        onClick={() => setSelectedShipment(shipment)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                {shipment.method === 'Air' ? <Plane className="w-3.5 h-3.5 text-blue-400" /> : <Ship className="w-3.5 h-3.5 text-indigo-400" />}
                                <span className="text-[10px] font-mono font-bold text-slate-500">{shipment.id}</span>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-black ${getStatusColor(shipment.status)}`}>{getStatusDisplay(shipment.status)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-4 truncate">{shipment.name}</h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                            <span className="flex items-center gap-1 font-mono">{shipment.trackingNumber || 'AWAITING_ID'}</span>
                            <span>{shipment.createdDate}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Area */}
            <div className="flex-1 bg-black/20 flex flex-col min-w-0 overflow-hidden">
                {selectedShipment ? (
                    <>
                        <div className="p-4 bg-white/2 border-b border-white/5 flex justify-between items-center">
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setActiveDocTab('details')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'details' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>路由与载荷</button>
                                <button onClick={() => setActiveDocTab('ci')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'ci' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>商业发票</button>
                                <button onClick={() => setActiveDocTab('pl')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'pl' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>装箱单</button>
                            </div>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg active:scale-95"><Check className="w-3.5 h-3.5"/> 锁定并同步</button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-600 transition-all"><RotateCcw className="w-3.5 h-3.5"/> 取消</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditForm({...selectedShipment}); setIsEditing(true); }} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                                            <Edit3 className="w-3.5 h-3.5"/> 修正协议与内容
                                        </button>
                                        
                                        {/* 核心修复：已离场后手动同步按钮 */}
                                        {selectedShipment.status === 'Shipped' && (
                                            <button 
                                                onClick={() => syncToTrackingMatrix(selectedShipment)} 
                                                disabled={isSyncingToMatrix}
                                                className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                {isSyncingToMatrix ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3.5 h-3.5"/>}
                                                强制同步至追踪矩阵
                                            </button>
                                        )}

                                        {selectedShipment.status === 'Draft' && (
                                            <button onClick={handleShipOut} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40">
                                                <Send className="w-3.5 h-3.5"/> 确认离场
                                            </button>
                                        )}
                                        <button onClick={() => { if(confirm('彻底删除此发货记录？')) dispatch({type:'DELETE_INBOUND_SHIPMENT', payload:selectedShipment.id}); setSelectedShipment(null); }} className="p-2 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                        <button onClick={() => setSelectedShipment(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all"><X className="w-4 h-4" /></button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {activeDocTab === 'details' && (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    {/* 核心修复：业务标识编辑 */}
                                    <div className={`ios-glass-card p-6 border-l-4 border-l-indigo-500 transition-all ${isEditing ? 'bg-indigo-500/5 ring-1 ring-indigo-500/30' : ''}`}>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-3 flex items-center gap-2"><Tag className="w-3 h-3 text-indigo-400"/> 协议核心标识 (Agreement Identity)</div>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={editForm?.name || ''} 
                                                onChange={e => setEditForm(prev => prev ? {...prev, name: e.target.value} : null)} 
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-bold shadow-inner" 
                                                placeholder="输入协议名称（修改后将同步至物流列表及追踪模块）..." 
                                            />
                                        ) : (
                                            <div className="text-xl font-black text-white italic tracking-tight">{selectedShipment.name}</div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500 flex flex-col justify-between">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2"><Globe className="w-3 h-3"/> 跨境路由管控</div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-white/10 text-indigo-400 font-black uppercase">
                                                    {selectedShipment.method === 'Air' ? <Plane className="w-3 h-3"/> : <Ship className="w-3 h-3"/>} {selectedShipment.method}
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" value={editForm?.sourceWarehouseId || ''} onChange={e => setEditForm(prev => prev ? {...prev, sourceWarehouseId: e.target.value} : null)} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500" placeholder="起运节点" />
                                                    <input type="text" value={editForm?.destinationWarehouseId || ''} onChange={e => setEditForm(prev => prev ? {...prev, destinationWarehouseId: e.target.value} : null)} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500" placeholder="交付节点" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 text-white font-bold text-sm">
                                                    <span>{selectedShipment.sourceWarehouseId}</span> <ArrowRight className="w-4 h-4 text-slate-700"/> <span>{selectedShipment.destinationWarehouseId}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="ios-glass-card p-6 border-l-4 border-l-blue-500">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 flex items-center gap-2"><Truck className="w-3 h-3 text-blue-400"/> 官方物流单号 (Tracking)</div>
                                            {isEditing ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" value={editForm?.carrier || ''} onChange={e => setEditForm(prev => prev ? {...prev, carrier: e.target.value} : null)} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500" placeholder="承运商" />
                                                    <input type="text" value={editForm?.trackingNumber || ''} onChange={e => setEditForm(prev => prev ? {...prev, trackingNumber: e.target.value} : null)} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none font-mono focus:border-indigo-500" placeholder="正式单号" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-slate-600 font-black uppercase">Carrier: <span className="text-white font-mono">{selectedShipment.carrier || 'TBD'}</span></span>
                                                        <span className="text-lg font-black text-white font-mono tracking-tight">{selectedShipment.trackingNumber || '待录入'}</span>
                                                    </div>
                                                    {selectedShipment.status === 'Shipped' && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-black text-[10px]">
                                                            <Link2 className="w-3 h-3"/> 矩阵状态: 同步中
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Matrix Section */}
                                    <div className={`ios-glass-card p-6 transition-all duration-500 ${isEditing ? 'border-indigo-500/30 bg-indigo-500/5 shadow-2xl' : ''}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutList className="w-4 h-4 text-indigo-400"/> 数字化物料清单 (Payload)</h4>
                                            {isEditing && (
                                                <div className="relative w-80">
                                                    <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
                                                    <input 
                                                        type="text" 
                                                        value={detailSkuSearch} 
                                                        onChange={e => setDetailSkuSearch(e.target.value)} 
                                                        placeholder="搜索 SKU 资产库并追加到清单..." 
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all shadow-inner" 
                                                    />
                                                    {filteredProducts.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 ring-1 ring-white/10">
                                                            {filteredProducts.map(p => (
                                                                <div 
                                                                    key={p.id} 
                                                                    onMouseDown={(e) => { e.preventDefault(); handleAddItem(p); }} 
                                                                    className="p-3 hover:bg-indigo-600/20 cursor-pointer flex justify-between items-center transition-all"
                                                                >
                                                                    <div className="text-[10px] font-black text-white">{p.sku} <span className="text-slate-500 ml-2 font-normal">({p.name})</span></div>
                                                                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs min-w-[1000px]">
                                                <thead className="text-slate-500 font-black uppercase border-b border-white/5 font-mono">
                                                    <tr>
                                                        <th className="pb-3 px-2">SKU 识别码</th>
                                                        <th className="pb-3 px-2 w-24 text-center">数量(pcs)</th>
                                                        <th className="pb-3 px-2 w-32 text-blue-400">计费重(KG)</th>
                                                        <th className="pb-3 px-2 w-28 text-blue-400">运费价(¥)</th>
                                                        <th className="pb-3 px-2 text-blue-100">物流成本(¥)</th>
                                                        <th className="pb-3 px-2 text-emerald-400 bg-emerald-500/5">单品分摊(¥)</th>
                                                        <th className="pb-3 px-2 text-indigo-400 w-28">申报单价($)</th>
                                                        <th className="pb-3 px-2 text-right">总申报值($)</th>
                                                        {isEditing && <th className="pb-3 px-2 w-12 text-right">CMD</th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-mono">
                                                    {(isEditing ? (editForm?.items || []) : (selectedShipment.items || [])).map((item: any, i: number) => {
                                                        const rowWeight = Number(item.rowTotalWeight || 0);
                                                        const rate = Number(item.freightRate || 0);
                                                        const lineFreight = rowWeight * rate;
                                                        const unitFreight = item.quantity > 0 ? (lineFreight / item.quantity) : 0;
                                                        return (
                                                            <tr key={`${item.productId}-${i}`} className="hover:bg-white/2 transition-colors">
                                                                <td className="py-4 px-2 font-black text-slate-200">{item.sku}</td>
                                                                <td className="py-4 px-2 text-center">
                                                                    {isEditing ? (
                                                                        <input type="number" value={item.quantity === 0 ? '' : item.quantity} onChange={e => updateItemProperty(item.productId, 'quantity', e.target.value)} className="w-16 bg-black/60 border border-white/10 rounded p-1 text-xs text-white text-center focus:border-indigo-500 outline-none" />
                                                                    ) : item.quantity}
                                                                </td>
                                                                <td className="py-4 px-2 text-blue-400">
                                                                    {isEditing ? (
                                                                        <input type="number" step="0.01" value={item.rowTotalWeight === 0 ? '' : item.rowTotalWeight} onChange={e => updateItemProperty(item.productId, 'rowTotalWeight', e.target.value)} className="w-24 bg-blue-500/5 border border-blue-500/20 rounded p-1 text-xs text-blue-300 focus:border-blue-500 outline-none font-bold" />
                                                                    ) : `${rowWeight.toFixed(2)}kg`}
                                                                </td>
                                                                <td className="py-4 px-2 text-blue-400">
                                                                    {isEditing ? (
                                                                        <input type="number" step="0.1" value={item.freightRate === 0 ? '' : item.freightRate} onChange={e => updateItemProperty(item.productId, 'freightRate', e.target.value)} className="w-16 bg-blue-500/5 border border-blue-500/20 rounded p-1 text-xs text-blue-300 focus:border-blue-500 outline-none font-bold" />
                                                                    ) : `¥${rate}`}
                                                                </td>
                                                                <td className="py-4 px-2 text-blue-100 font-bold">¥ {lineFreight.toLocaleString()}</td>
                                                                <td className="py-4 px-2 bg-emerald-500/5 text-emerald-400 font-black">¥ {unitFreight.toFixed(2)}</td>
                                                                <td className="py-4 px-2 text-indigo-400 font-bold">
                                                                    {isEditing ? (
                                                                        <input type="number" step="0.01" value={item.unitPrice === 0 ? '' : item.unitPrice} onChange={e => updateItemProperty(item.productId, 'unitPrice', e.target.value)} className="w-20 bg-indigo-500/5 border border-indigo-500/20 rounded p-1 text-xs text-indigo-300 focus:border-indigo-500 outline-none font-bold" />
                                                                    ) : `$${item.unitPrice.toFixed(2)}`}
                                                                </td>
                                                                <td className="py-4 px-2 text-right font-black text-indigo-300">${(item.quantity * item.unitPrice).toLocaleString()}</td>
                                                                {isEditing && (
                                                                    <td className="py-4 px-2 text-right">
                                                                        <button onClick={() => handleRemoveItem(item.productId)} className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="border-t border-white/10 font-bold bg-white/2">
                                                    <tr>
                                                        <td colSpan={4} className="py-5 px-2 text-slate-500 text-right italic uppercase text-[10px]">核算汇总:</td>
                                                        <td className="py-5 px-2 text-blue-400 text-lg">¥ {(isEditing ? editForm?.items : selectedShipment.items || []).reduce((acc, it) => acc + (Number(it.rowTotalWeight || 0) * Number(it.freightRate || 0)), 0).toLocaleString()}</td>
                                                        <td colSpan={2} className="py-5 px-2 text-slate-500 text-right uppercase text-[10px]">总货值:</td>
                                                        <td className="py-5 px-2 text-indigo-300 text-right text-lg">$ {(isEditing ? editForm?.items : selectedShipment.items || []).reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0).toLocaleString()}</td>
                                                        {isEditing && <td></td>}
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4">
                                            <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
                                            <div>
                                                <h5 className="text-xs font-black text-white uppercase mb-1">业财同步协议 (Ledger Active)</h5>
                                                <p className="text-[10px] text-indigo-300/60 leading-relaxed font-medium uppercase">此分摊结果将作为核心成本因子，自动穿透至财务模块。若在离场后修正数据，关联财务报表将执行自动校准并同步更新追踪矩阵。</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                                            <Calculator className="w-6 h-6 text-blue-400 shrink-0" />
                                            <div>
                                                <h5 className="text-xs font-black text-white uppercase mb-1">动态载荷核算引擎</h5>
                                                <p className="text-[10px] text-blue-300/60 leading-relaxed font-medium uppercase tracking-tight">批次计费总重: <span className="text-white">{(isEditing ? editForm?.totalWeight : selectedShipment.totalWeight)} KG</span> | 实时箱规容积: <span className="text-white">{(isEditing ? editForm?.totalVolume : selectedShipment.totalVolume)} CBM</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {(activeDocTab === 'ci' || activeDocTab === 'pl') && (
                                <div className="h-[500px] flex flex-col items-center justify-center text-slate-700 bg-black/40 rounded-3xl border-2 border-dashed border-white/5">
                                    <FileText className="w-16 h-16 opacity-10 mb-6 animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">正在动态生成国际贸易单证文件...</p>
                                    <button className="mt-10 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all">
                                        <Download className="w-4 h-4"/> 导出 PDF 镜像
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                         <div className="w-24 h-24 bg-white/2 rounded-full flex items-center justify-center mb-8 border border-white/5">
                            <Truck className="w-10 h-10 opacity-5" />
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-[0.5em] mb-2 text-slate-600">中枢待命 (STANDBY)</h3>
                         <p className="text-[10px] text-center max-w-xs leading-relaxed uppercase tracking-widest text-slate-500 font-bold">请从侧边栏选择一个物流协议节点进行全息管控</p>
                    </div>
                )}
            </div>
        </div>

        {/* Modal: Deploy New Agreement */}
        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/70 animate-in fade-in duration-300" onClick={() => setShowCreateModal(false)}>
                <div className="ios-glass-panel w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden bg-[#0a0a0c] border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-md">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">部署全球载荷协议 (Setup)</h3>
                        <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-12 gap-10">
                            <div className="col-span-12 lg:col-span-5 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">运输模态 (Mode)</label>
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/60 rounded-2xl border border-white/10">
                                        <button onClick={() => setShippingMethod('Air')} className={`py-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${shippingMethod === 'Air' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                            <Plane className="w-4 h-4" /> 空运
                                        </button>
                                        <button onClick={() => setShippingMethod('Sea')} className={`py-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${shippingMethod === 'Sea' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                            <Ship className="w-4 h-4" /> 海运
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">业务标识 (Shipment Name)</label>
                                    <input type="text" value={newShipmentName} onChange={e => setNewShipmentName(e.target.value)} placeholder="例如：FBA 西部节点 Q4 补货" className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-blue-500 outline-none font-bold" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">预录单号 (Tracking)</label>
                                        <input type="text" value={newTrackingNo} onChange={e => setNewTrackingNo(e.target.value)} placeholder="单号..." className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">协议载体 (Carrier)</label>
                                        <input type="text" value={newCarrier} onChange={e => setNewCarrier(e.target.value)} placeholder="DHL/UPS..." className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase">起运节点</label>
                                        <input type="text" value={sourceNode} onChange={e => setSourceNode(e.target.value)} className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase">交付节点</label>
                                        <input type="text" value={destNode} onChange={e => setDestNode(e.target.value)} className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 w-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-12 lg:col-span-7 space-y-6">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">载荷清单注入 (Payload Injection)</label>
                                <div className="relative">
                                    <Search className="w-5 h-5 text-slate-700 absolute left-4 top-4" />
                                    <input 
                                        type="text" 
                                        value={skuSearch} 
                                        onChange={e => setSkuSearch(e.target.value)} 
                                        placeholder="检索 SKU 资产库并入账..." 
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-indigo-500 outline-none font-bold" 
                                    />
                                    {filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 ring-1 ring-white/10">
                                            {filteredProducts.map(p => (
                                                <div 
                                                    key={p.id} 
                                                    onMouseDown={(e) => { e.preventDefault(); handleAddItem(p); }} 
                                                    className="p-5 hover:bg-indigo-600/30 cursor-pointer flex justify-between items-center group transition-all"
                                                >
                                                    <div>
                                                        <div className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">{p.sku}</div>
                                                        <div className="text-[10px] text-slate-600 font-mono mt-1">{p.name}</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] text-slate-700 font-black bg-white/2 px-2 py-0.5 rounded border border-white/5">{p.stock} In-Stock</span>
                                                        <Plus className="w-5 h-5 text-indigo-400 group-hover:scale-125 transition-transform" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                                    {plannedItems.map((item, idx) => (
                                        <div key={`${item.product.id}-${idx}`} className="bg-white/2 border border-white/5 p-5 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/5 transition-all shadow-inner">
                                            <div>
                                                <div className="text-sm font-black text-white font-mono">{item.product.sku}</div>
                                                <div className="text-[9px] text-slate-600 uppercase mt-1 font-bold">EST. Weight: {item.product.unitWeight || 0.5} kg/pcs</div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] text-slate-500 font-bold mb-1 uppercase">Load Quantity</span>
                                                    <input 
                                                        type="number" 
                                                        value={item.quantity || ''} 
                                                        onChange={e => {
                                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                            setPlannedItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                                                        }} 
                                                        className="w-24 bg-black/60 border border-white/10 rounded-xl p-2.5 text-sm text-white font-mono text-center outline-none focus:border-indigo-500 shadow-inner" 
                                                    />
                                                </div>
                                                <button onClick={() => setPlannedItems(prev => prev.filter((_, i) => i !== idx))} className="p-2.5 text-slate-700 hover:text-red-400 transition-all"><Trash2 className="w-4.5 h-4.5"/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {plannedItems.length === 0 && (
                                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-slate-800 flex flex-col items-center gap-4">
                                            <PackageOpen className="w-12 h-12 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">载荷队列空置 (Awaiting Payload)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 border-t border-white/5 bg-white/2 flex justify-between items-center backdrop-blur-md">
                        <div className="flex gap-10">
                            <div><span className="text-[10px] text-slate-600 font-black uppercase block">预估总载荷重</span><span className="text-2xl font-black text-white font-mono">{(plannedItems.reduce((acc, it) => acc + (Number(it.quantity) * (it.product.unitWeight || 0.5)), 0)).toFixed(1)} <span className="text-xs text-slate-500">KG</span></span></div>
                            <div className="w-px h-10 bg-white/5"></div>
                            <div><span className="text-[10px] text-slate-600 font-black uppercase block">SKU 种类</span><span className="text-2xl font-black text-white font-mono">{plannedItems.length} <span className="text-xs text-slate-500">LINES</span></span></div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowCreateModal(false)} className="px-8 py-3 text-slate-500 font-black text-xs uppercase hover:text-white transition-colors">放弃</button>
                            <button onClick={handleCreateNew} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase shadow-2xl flex items-center gap-3 transition-all active:scale-95 shadow-indigo-900/30"><Save className="w-5 h-5"/> 提交并激活协议</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }` }} />
    </div>
  );
};

const getStatusDisplay = (status: string) => {
    switch (status) {
        case 'Draft': return '草拟协议 (Draft)';
        case 'Shipped': return '离场起运 (Shipped)';
        case 'Receiving': return '仓库接收中 (RCV)';
        case 'Closed': return '流程已结案 (Closed)';
        default: return status;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Draft': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        case 'Shipped': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
        case 'Receiving': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
        case 'Closed': return 'text-slate-600 bg-slate-600/10 border-slate-600/20';
        default: return 'text-white bg-white/10';
    }
};

export default InboundShipments;