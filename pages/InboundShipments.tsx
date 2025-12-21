import React, { useState, useMemo, useEffect } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { InboundShipment, Product, InboundShipmentItem, Shipment } from '../types';
import { WAREHOUSES } from '../constants';
import { Globe, Plus, Search, Box, Truck, CheckCircle2, ArrowRight, X, PackageOpen, LayoutList, Scale, Trash2, Save, Send, TruckIcon, Edit3, Check, RotateCcw, ShieldCheck, Download, Calendar, Hash, FileText, BadgeDollarSign, Weight, Coins } from 'lucide-react';

const InboundShipments: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'details' | 'ci' | 'pl'>('details');
  
  // 核心编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null); // 使用 any 临时扩展属性
  const [detailSkuSearch, setDetailSkuSearch] = useState('');

  // 新建货件状态
  const [newShipmentName, setNewShipmentName] = useState('');
  const [sourceNode, setSourceNode] = useState('深圳分拨中心');
  const [destNode, setDestNode] = useState('FBA-US-WEST');
  const [plannedItems, setPlannedItems] = useState<{product: Product, quantity: number}[]>([]);
  const [skuSearch, setSkuSearch] = useState('');

  // 监听选中项切换
  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
  }, [selectedShipment]);

  const filteredProducts = useMemo(() => {
      const q = isEditing ? detailSkuSearch : skuSearch;
      if (!q) return [];
      return state.products.filter(p => p.sku.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  }, [state.products, skuSearch, detailSkuSearch, isEditing]);

  const handleAddItem = (p: Product) => {
      const newItem = {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          quantity: p.itemsPerBox || 10,
          boxes: 1,
          unitPrice: p.price || 0,
          // 显化物流因子
          weight: p.unitWeight || 0.5,
          freightRate: p.logistics?.unitFreightCost || 35
      };

      if (isEditing && editForm) {
          if (editForm.items.find((it: any) => it.productId === p.id)) return;
          const updatedItems = [...editForm.items, newItem];
          
          // Added: Recalculate totals when adding items in edit mode
          let totalWeight = 0;
          let totalVolume = 0;
          updatedItems.forEach((it: any) => {
              const product = state.products.find(prod => prod.id === it.productId);
              if (product) {
                  totalWeight += Number(it.quantity) * Number(it.weight || 0);
                  const vol = ((product.dimensions?.l || 0) * (product.dimensions?.w || 0) * (product.dimensions?.h || 0) / 1000000) * Number(it.boxes);
                  totalVolume += vol;
              }
          });

          setEditForm({ 
              ...editForm, 
              items: updatedItems,
              totalWeight: parseFloat(totalWeight.toFixed(2)),
              totalVolume: parseFloat(totalVolume.toFixed(3))
          });
          setDetailSkuSearch('');
      } else {
          if (plannedItems.find(item => item.product.id === p.id)) return;
          setPlannedItems([...plannedItems, { product: p, quantity: p.itemsPerBox || 10 }]);
          setSkuSearch('');
      }
  };

  // 核心：处理物料属性更新（含实时重算）
  const updateItemProperty = (productId: string, field: string, value: any) => {
      if (!editForm) return;
      const updatedItems = editForm.items.map((it: any) => {
          if (it.productId === productId) {
              return { ...it, [field]: value };
          }
          return it;
      });
      
      // 实时计算载荷总量
      let totalWeight = 0;
      let totalVolume = 0;
      updatedItems.forEach((it: any) => {
          const product = state.products.find(p => p.id === it.productId);
          if (product) {
              totalWeight += Number(it.quantity) * Number(it.weight || 0);
              const vol = ((product.dimensions?.l || 0) * (product.dimensions?.w || 0) * (product.dimensions?.h || 0) / 1000000) * Number(it.boxes);
              totalVolume += vol;
          }
      });

      setEditForm({ 
          ...editForm, 
          items: updatedItems,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalVolume: parseFloat(totalVolume.toFixed(3))
      });
  };

  // Added: handleRemoveDetailItem function to fix line 417 error
  const handleRemoveDetailItem = (productId: string) => {
      if (!editForm) return;
      const updatedItems = editForm.items.filter((it: any) => it.productId !== productId);
      
      // Recalculate totals after removal
      let totalWeight = 0;
      let totalVolume = 0;
      updatedItems.forEach((it: any) => {
          const product = state.products.find(p => p.id === it.productId);
          if (product) {
              totalWeight += Number(it.quantity) * Number(it.weight || 0);
              const vol = ((product.dimensions?.l || 0) * (product.dimensions?.w || 0) * (product.dimensions?.h || 0) / 1000000) * Number(it.boxes);
              totalVolume += vol;
          }
      });

      setEditForm({ 
          ...editForm, 
          items: updatedItems,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalVolume: parseFloat(totalVolume.toFixed(3))
      });
  };

  const handleSaveEdit = () => {
      if (!editForm) return;
      if (!editForm.name.trim()) {
          showToast('协议标识名称不能为空', 'warning');
          return;
      }
      dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: editForm });
      setSelectedShipment(editForm);
      setIsEditing(false);
      showToast('货件节点数据已同步固化', 'success');
  };

  const handleCreate = () => {
      if (!newShipmentName || plannedItems.length === 0) {
          showToast('请完整配置协议名称与载荷清单', 'warning');
          return;
      }

      let totalWeight = 0;      let totalVolume = 0;
      const shipmentItems = plannedItems.map(item => {
          const boxes = Math.ceil(item.quantity / (item.product.itemsPerBox || 1));
          const w = item.product.unitWeight || 0.5;
          const fr = item.product.logistics?.unitFreightCost || 35;
          
          totalWeight += item.quantity * w;
          const vol = ((item.product.dimensions?.l || 0) * (item.product.dimensions?.w || 0) * (item.product.dimensions?.h || 0) / 1000000) * boxes;
          totalVolume += vol;
          
          return {
              productId: item.product.id,
              sku: item.product.sku,
              name: item.product.name,
              quantity: item.quantity,
              boxes,
              unitPrice: item.product.price || 0,
              weight: w,
              freightRate: fr
          };
      });

      const newInbound: InboundShipment = {
          id: `IB-${Date.now().toString().slice(-6)}`,
          name: newShipmentName,
          sourceWarehouseId: sourceNode,
          destinationWarehouseId: destNode,
          status: 'Draft',
          items: shipmentItems as any,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalVolume: parseFloat(totalVolume.toFixed(3)),
          createdDate: new Date().toISOString().split('T')[0]
      };

      dispatch({ type: 'CREATE_INBOUND_SHIPMENT', payload: newInbound });
      showToast('发货协议已成功部署', 'success');
      setShowCreateModal(false);
      setPlannedItems([]);
      setNewShipmentName('');
  };

  const handleStatusTransition = (status: InboundShipment['status']) => {
      if (!selectedShipment) return;
      const updated = { ...selectedShipment, status };
      dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: updated });
      setSelectedShipment(updated);
      showToast(`状态已切换至: ${getStatusDisplay(status)}`, 'info');
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
        case 'Draft': return '草拟协议';
        case 'Shipped': return '离场起运';
        case 'Receiving': return '仓库接收中';
        case 'Closed': return '流程已结案';
        default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'Draft': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        case 'Shipped': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
        case 'Receiving': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
        case 'Closed': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        default: return 'text-white bg-white/10';
    }
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative bg-black/20">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-900/40">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase italic tracking-tight">跨境物流与单证协同中枢</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Global Logistics Hub • Advanced Item Matrix v8.0</p>
                </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase transition-all shadow-xl active:scale-95">
                <Plus className="w-4 h-4" /> 部署新发货协议
            </button>
        </div>

        <div className="flex-1 overflow-hidden flex divide-x divide-white/5">
            {/* 左侧列表 */}
            <div className="w-1/4 overflow-y-auto p-4 space-y-4 bg-black/40 custom-scrollbar">
                {state.inboundShipments.length === 0 && (
                    <div className="py-20 text-center text-slate-700 uppercase font-black text-[10px] tracking-widest italic opacity-30">未检测到活动节点</div>
                )}
                {state.inboundShipments.map(shipment => (
                    <div 
                        key={shipment.id}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${selectedShipment?.id === shipment.id ? 'bg-blue-600/10 border-blue-500/50 shadow-inner' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
                        onClick={() => setSelectedShipment(shipment)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{shipment.id}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-black ${getStatusColor(shipment.status)}`}>{getStatusDisplay(shipment.status)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-4 truncate">{shipment.name}</h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                            <span className="flex items-center gap-1"><Scale className="w-3 h-3"/> {Number(shipment.totalWeight || 0).toFixed(1)} KG</span>
                            <span>{shipment.createdDate}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 右侧深度编辑区 */}
            <div className="flex-1 bg-black/20 flex flex-col min-w-0 overflow-hidden">
                {selectedShipment ? (
                    <>
                        <div className="p-4 bg-white/2 border-b border-white/5 flex justify-between items-center">
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setActiveDocTab('details')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'details' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>路由与载荷详情</button>
                                <button onClick={() => setActiveDocTab('ci')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'ci' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>商业发票 (CI)</button>
                                <button onClick={() => setActiveDocTab('pl')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'pl' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>装箱单 (PL)</button>
                            </div>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg active:scale-95"><Check className="w-3.5 h-3.5"/> 保存并锁定节点</button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-600 transition-all"><RotateCcw className="w-3.5 h-3.5"/> 放弃修改</button>
                                    </>
                                ) : (
                                    <>
                                        {selectedShipment.status === 'Draft' && (
                                            <>
                                                <button onClick={() => { setEditForm({...selectedShipment}); setIsEditing(true); }} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all"><Edit3 className="w-3.5 h-3.5"/> 进入全节点编辑</button>
                                                <button onClick={() => handleStatusTransition('Shipped')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg"><Send className="w-3.5 h-3.5"/> 确认发货离场</button>
                                            </>
                                        )}
                                        <button onClick={() => {if(confirm('确定作废此协议？')) { dispatch({type:'DELETE_INBOUND_SHIPMENT', payload: selectedShipment.id}); setSelectedShipment(null); }}} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
                                        <button onClick={() => setSelectedShipment(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all"><X className="w-4 h-4" /></button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {activeDocTab === 'details' && (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    {/* 路由配置 */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 flex items-center gap-2"><Globe className="w-3 h-3"/> 跨境路由规划 (Routing)</div>
                                            {isEditing ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[8px] text-slate-600 block mb-1 uppercase font-bold">起运节点</label>
                                                        <input type="text" value={editForm?.sourceWarehouseId || ''} onChange={e => setEditForm((f:any) => ({...f, sourceWarehouseId: e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 outline-none shadow-inner" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] text-slate-600 block mb-1 uppercase font-bold">到达节点</label>
                                                        <input type="text" value={editForm?.destinationWarehouseId || ''} onChange={e => setEditForm((f:any) => ({...f, destinationWarehouseId: e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 outline-none shadow-inner" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 text-white">
                                                    <div className="font-bold text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{selectedShipment.sourceWarehouseId}</div>
                                                    <ArrowRight className="w-4 h-4 text-slate-700"/>
                                                    <div className="font-bold text-sm bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-100">{selectedShipment.destinationWarehouseId}</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="ios-glass-card p-6 border-l-4 border-l-amber-500">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 flex items-center gap-2"><Scale className="w-3 h-3"/> 载荷合规审计 (Payload Matrix)</div>
                                            <div className="flex items-center gap-10">
                                                <div><span className="text-[10px] text-slate-600 block uppercase font-bold">总重量 (Sum)</span><span className="text-xl font-black text-white font-mono tracking-tighter">{Number(isEditing ? editForm?.totalWeight : selectedShipment.totalWeight).toFixed(1)} KG</span></div>
                                                <div className="w-px h-8 bg-white/5"></div>
                                                <div><span className="text-[10px] text-slate-600 block uppercase font-bold">总体积</span><span className="text-xl font-black text-white font-mono tracking-tighter">{Number(isEditing ? editForm?.totalVolume : selectedShipment.totalVolume).toFixed(3)} CBM</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 承运详情 */}
                                    <div className="ios-glass-card p-6 border-l-4 border-l-emerald-500">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 flex items-center gap-2"><Truck className="w-3 h-3"/> 物流承运详情 (Shipping Identity)</div>
                                        <div className="grid grid-cols-4 gap-4">
                                            <div>
                                                <label className="text-[8px] text-slate-600 block mb-1 uppercase font-bold">承运商</label>
                                                {isEditing ? (
                                                    <input type="text" value={editForm?.carrier || ''} onChange={e => setEditForm((f:any) => ({...f, carrier: e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none" />
                                                ) : (
                                                    <div className="text-xs text-slate-300 font-bold">{selectedShipment.carrier || '--'}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[8px] text-slate-600 block mb-1 uppercase font-bold">追踪单号</label>
                                                {isEditing ? (
                                                    <input type="text" value={editForm?.trackingNumber || ''} onChange={e => setEditForm((f:any) => ({...f, trackingNumber: e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 outline-none" />
                                                ) : (
                                                    <div className="text-xs text-indigo-400 font-mono font-bold">{selectedShipment.trackingNumber || '--'}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[8px] text-slate-600 block mb-1 uppercase font-bold">起运日期</label>
                                                {isEditing ? (
                                                    <input type="date" value={editForm?.shippedDate || ''} onChange={e => setEditForm((f:any) => ({...f, shippedDate: e.target.value}))} className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-xs text-white" />
                                                ) : (
                                                    <div className="text-xs text-slate-400 font-mono">{selectedShipment.shippedDate || '--'}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[8px] text-indigo-500 block mb-1 uppercase font-bold">ETA</label>
                                                {isEditing ? (
                                                    <input type="date" value={editForm?.eta || ''} onChange={e => setEditForm((f:any) => ({...f, eta: e.target.value}))} className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-1.5 text-xs text-indigo-100" />
                                                ) : (
                                                    <div className="text-xs text-emerald-400 font-mono font-bold">{selectedShipment.eta || '--'}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 核心改动：数字化物料矩阵 - 显化计算因子 */}
                                    <div className="ios-glass-card p-6 overflow-hidden">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutList className="w-4 h-4 text-indigo-400"/> 数字化物料矩阵 (Item Matrix)</h4>
                                            {isEditing && (
                                                <div className="relative w-72">
                                                    <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
                                                    <input type="text" value={detailSkuSearch} onChange={e => setDetailSkuSearch(e.target.value)} placeholder="键入 SKU 补全清单..." className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                                    {filteredProducts.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                                                            {filteredProducts.map(p => (
                                                                <div key={p.id} onClick={() => handleAddItem(p)} className="p-3 hover:bg-indigo-600/20 cursor-pointer flex justify-between items-center transition-all group">
                                                                    <div><div className="text-[10px] font-black text-white">{p.sku}</div></div>
                                                                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs min-w-[1100px]">
                                                <thead className="text-slate-500 font-black uppercase border-b border-white/5">
                                                    <tr>
                                                        <th className="pb-3 px-2 text-[10px]">SKU 识别码</th>
                                                        <th className="pb-3 px-2 text-[10px] w-24">数量(PCS)</th>
                                                        <th className="pb-3 px-2 text-[10px] w-24">箱数(CTN)</th>
                                                        <th className="pb-3 px-2 text-[10px] w-28 text-blue-400">计费重(KG/pcs)</th>
                                                        <th className="pb-3 px-2 text-[10px] w-28 text-blue-400">运费价(¥/KG)</th>
                                                        <th className="pb-3 px-2 text-[10px] text-blue-200">单品头程</th>
                                                        <th className="pb-3 px-2 text-[10px] text-indigo-400 w-28">申报单价($)</th>
                                                        <th className="pb-3 px-2 text-right text-indigo-300">申报总值</th>
                                                        {isEditing && <th className="pb-3 px-2 text-right">管控</th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-mono">
                                                    {(isEditing ? editForm?.items : selectedShipment.items || []).map((item: any, i: number) => {
                                                        const unitWeight = Number(item.weight || 0);
                                                        const rate = Number(item.freightRate || 0);
                                                        const unitLogistics = unitWeight * rate;
                                                        const totalLogistics = unitLogistics * item.quantity;
                                                        const unitPrice = Number(item.unitPrice || 0);
                                                        
                                                        return (
                                                            <tr key={i} className="hover:bg-white/2 group transition-colors">
                                                                <td className="py-4 px-2 font-black text-slate-200">{item.sku}</td>
                                                                <td className="py-4 px-2">
                                                                    {isEditing ? (
                                                                        <input type="number" value={item.quantity} onChange={e => updateItemProperty(item.productId, 'quantity', parseInt(e.target.value))} className="w-16 bg-black/60 border border-white/10 rounded p-1 text-xs text-white focus:border-indigo-500 outline-none shadow-inner" />
                                                                    ) : item.quantity}
                                                                </td>
                                                                <td className="py-4 px-2">
                                                                    {isEditing ? (
                                                                        <input type="number" value={item.boxes} onChange={e => updateItemProperty(item.productId, 'boxes', parseInt(e.target.value))} className="w-16 bg-black/60 border border-white/10 rounded p-1 text-xs text-white focus:border-indigo-500 outline-none shadow-inner" />
                                                                    ) : item.boxes}
                                                                </td>
                                                                {/* 显化因子 1：计费重 */}
                                                                <td className="py-4 px-2 text-blue-400">
                                                                    {isEditing ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <Weight className="w-3 h-3 opacity-40"/>
                                                                            <input type="number" step="0.01" value={item.weight} onChange={e => updateItemProperty(item.productId, 'weight', parseFloat(e.target.value))} className="w-20 bg-blue-500/5 border border-blue-500/20 rounded p-1 text-xs text-blue-300 focus:border-blue-500 outline-none font-bold" />
                                                                        </div>
                                                                    ) : `${unitWeight.toFixed(2)}kg`}
                                                                </td>
                                                                {/* 显化因子 2：运费单价 */}
                                                                <td className="py-4 px-2 text-blue-400">
                                                                    {isEditing ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <Coins className="w-3 h-3 opacity-40"/>
                                                                            <input type="number" value={item.freightRate} onChange={e => updateItemProperty(item.productId, 'freightRate', parseFloat(e.target.value))} className="w-16 bg-blue-500/5 border border-blue-500/20 rounded p-1 text-xs text-blue-300 focus:border-blue-500 outline-none font-bold" />
                                                                        </div>
                                                                    ) : `¥${rate}`}
                                                                </td>
                                                                {/* 计算结果：单品头程 */}
                                                                <td className="py-4 px-2 text-blue-100 font-bold">
                                                                    ¥ {unitLogistics.toFixed(2)}
                                                                </td>
                                                                <td className="py-4 px-2 text-indigo-400 font-bold">
                                                                    {isEditing ? (
                                                                        <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItemProperty(item.productId, 'unitPrice', parseFloat(e.target.value))} className="w-20 bg-indigo-500/5 border border-indigo-500/20 rounded p-1 text-xs text-indigo-300 focus:border-indigo-500 outline-none font-bold" />
                                                                    ) : `$${unitPrice.toFixed(2)}`}
                                                                </td>
                                                                <td className="py-4 px-2 text-right font-black text-indigo-300">
                                                                    ${(Number(item.quantity || 0) * unitPrice).toFixed(2)}
                                                                </td>
                                                                {isEditing && (
                                                                    <td className="py-4 px-2 text-right">
                                                                        <button onClick={() => handleRemoveDetailItem(item.productId)} className="p-1.5 text-slate-700 hover:text-red-400 transition-colors hover:bg-red-400/10 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="border-t-2 border-white/5 font-black uppercase text-[10px] bg-white/2">
                                                    <tr>
                                                        <td colSpan={5} className="py-5 px-2 text-slate-500 text-right italic">综合运费分摊成本 (CNY):</td>
                                                        <td className="py-5 px-2 text-blue-400 text-base">
                                                            ¥ {(isEditing ? editForm?.items : selectedShipment.items || []).reduce((acc: any, it: any) => acc + (Number(it.weight || 0) * Number(it.freightRate || 0) * Number(it.quantity || 0)), 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-5 px-2 text-slate-500 text-right italic">总申报货值 (USD):</td>
                                                        <td className="py-5 px-2 text-indigo-300 text-right text-base font-mono">
                                                            $ {(isEditing ? editForm?.items : selectedShipment.items || []).reduce((acc: any, it: any) => acc + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </td>
                                                        {isEditing && <td></td>}
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4">
                                            <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
                                            <div>
                                                <h5 className="text-xs font-bold text-white uppercase mb-1">合规自检：就绪 (Compliance)</h5>
                                                <p className="text-[10px] text-indigo-300/60 leading-relaxed font-medium">系统已捕获物料矩阵的所有计算因子。变更将同步至商业发票与装箱单的渲染引擎。</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                                            <TruckIcon className="w-6 h-6 text-blue-400 shrink-0" />
                                            <div>
                                                <h5 className="text-xs font-bold text-white uppercase mb-1">动态物流追踪集成</h5>
                                                <p className="text-[10px] text-blue-300/60 leading-relaxed font-medium">填写的物流追踪单号将自动广播至「全球追踪」模块。ETA 变动将触发运营日历的二级告警。</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* 单证生成预览 */}
                            {(activeDocTab === 'ci' || activeDocTab === 'pl') && (
                                <div className="h-[500px] flex flex-col items-center justify-center text-slate-700 bg-black/40 rounded-3xl border-2 border-dashed border-white/5">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <FileText className="w-12 h-12 opacity-10 animate-pulse" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">正在基于当前矩阵动态渲染 PDF 单证...</p>
                                    <p className="text-[10px] text-slate-600 mt-2">支持 A4 / ISO 标准对齐</p>
                                    <button className="mt-10 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl shadow-indigo-900/40 active:scale-95">
                                        <Download className="w-4 h-4"/> 导出 PDF 协议文件
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                         <div className="w-32 h-32 bg-white/2 rounded-full flex items-center justify-center mb-8 relative">
                             <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-800 animate-spin-slow"></div>
                             <Truck className="w-16 h-16 opacity-5" />
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-[0.5em] mb-2 text-slate-600">待命状态 (Standby)</h3>
                         <p className="text-[10px] text-center max-w-xs leading-relaxed uppercase tracking-widest text-slate-500 font-bold">
                             请从左侧列表选择一个业务节点<br/>或启动一个新的发货协议部署
                         </p>
                    </div>
                )}
            </div>
        </div>

        {/* 新建货件 Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60" onClick={() => setShowCreateModal(false)}>
                <div className="ios-glass-panel w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 bg-[#0f0f12] border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">部署全球货件协议 (Protocol Setup)</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">初始化：配置地理路由与载荷基准参数</p>
                        </div>
                        <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-500" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-12 gap-10">
                            <div className="col-span-12 lg:col-span-5 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">协议唯一标识名称 (Plan Name)</label>
                                    <input type="text" value={newShipmentName} onChange={e => setNewShipmentName(e.target.value)} placeholder="例如：FBA 西部节点 24Q2 补货" className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-blue-500 outline-none transition-all font-bold shadow-inner" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase">起运节点</label>
                                        <input 
                                            type="text" 
                                            value={sourceNode} 
                                            onChange={e => setSourceNode(e.target.value)} 
                                            placeholder="如: 深圳蛇口仓" 
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 shadow-inner font-bold" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-black uppercase">到达节点</label>
                                        <input 
                                            type="text" 
                                            value={destNode} 
                                            onChange={e => setDestNode(e.target.value)} 
                                            placeholder="如: LAX-9 FBA" 
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 shadow-inner font-bold" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-12 lg:col-span-7 space-y-6">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">初始载荷配置 (Payload Specs)</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-600 absolute left-4 top-4" />
                                    <input type="text" value={skuSearch} onChange={e => setSkuSearch(e.target.value)} placeholder="搜索 SKU 资产库..." className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold" />
                                    {filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                                            {filteredProducts.map(p => (
                                                <div key={p.id} onClick={() => handleAddItem(p)} className="p-4 hover:bg-indigo-600/20 cursor-pointer flex justify-between items-center transition-all group">
                                                    <div>
                                                        <div className="text-sm font-black text-white">{p.sku}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold">{p.name}</div>
                                                    </div>
                                                    <Plus className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 group-hover:scale-125 transition-all" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {plannedItems.map(item => (
                                        <div key={item.product.id} className="bg-white/2 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all">
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-white">{item.product.sku}</div>
                                                <div className="text-[10px] text-slate-600 uppercase font-mono font-bold">{Math.ceil(item.quantity / (item.product.itemsPerBox || 1))} 箱 (计算预估)</div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-600 font-black uppercase">数量</span>
                                                    <input type="number" value={item.quantity} onChange={e => {
                                                        const qty = parseInt(e.target.value) || 0;
                                                        setPlannedItems(plannedItems.map(it => it.product.id === item.product.id ? { ...it, quantity: qty } : it));
                                                    }} className="w-24 bg-black/60 border border-white/10 rounded-lg p-2 text-sm text-white font-mono text-center outline-none focus:border-blue-500 shadow-inner" />
                                                </div>
                                                <button onClick={() => setPlannedItems(plannedItems.filter(it => it.product.id !== item.product.id))} className="p-2 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {plannedItems.length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-800">
                                            <PackageOpen className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">载荷队列为空</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/2 flex justify-between items-center">
                        <div className="flex gap-10">
                            <div><span className="text-[10px] text-slate-500 font-black uppercase block tracking-tighter">载荷重 (Weight)</span><span className="text-xl font-black text-white font-mono tracking-tighter">{(plannedItems.reduce((acc, it) => acc + (Number(it.quantity) * (it.product.unitWeight || 0.5)), 0)).toFixed(1)} <span className="text-xs">KG</span></span></div>
                            <div><span className="text-[10px] text-slate-500 font-black uppercase block tracking-tighter">体积 (Volume)</span><span className="text-xl font-black text-white font-mono tracking-tighter">{(plannedItems.reduce((acc, it) => {
                                const boxes = Math.ceil(it.quantity / (it.product.itemsPerBox || 1));
                                return acc + ((it.product.dimensions?.l || 0) * (it.product.dimensions?.w || 0) * (it.product.dimensions?.h || 0) / 1000000) * boxes;
                            }, 0)).toFixed(2)} <span className="text-xs">CBM</span></span></div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowCreateModal(false)} className="px-8 py-3 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">取消部署</button>
                            <button onClick={handleCreate} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 flex items-center gap-3 transition-all active:scale-95"><Save className="w-5 h-5"/> 归档并激活协议</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            .animate-spin-slow { animation: spin 8s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
    </div>
  );
};

export default InboundShipments;