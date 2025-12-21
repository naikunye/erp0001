import React, { useState, useMemo, useEffect } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { InboundShipment, Product, InboundShipmentItem, Shipment } from '../types';
import { WAREHOUSES } from '../constants';
import { Globe, Plus, Search, Box, Truck, CheckCircle2, ArrowRight, X, PackageOpen, LayoutList, Scale, Trash2, Save, Send, TruckIcon, Edit3, Check, RotateCcw, ShieldCheck, Download, Calendar, Hash, FileText, BadgeDollarSign, Weight, Coins, Calculator } from 'lucide-react';

const InboundShipments: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'details' | 'ci' | 'pl'>('details');
  
  // 核心编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [detailSkuSearch, setDetailSkuSearch] = useState('');

  // 新建货件状态
  const [newShipmentName, setNewShipmentName] = useState('');
  const [sourceNode, setSourceNode] = useState('深圳分拨中心');
  const [destNode, setDestNode] = useState('FBA-US-WEST');
  const [plannedItems, setPlannedItems] = useState<{product: Product, quantity: number}[]>([]);
  const [skuSearch, setSkuSearch] = useState('');

  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
  }, [selectedShipment]);

  const filteredProducts = useMemo(() => {
      const q = showCreateModal ? skuSearch : (isEditing ? detailSkuSearch : '');
      if (!q) return [];
      return state.products.filter(p => p.sku.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  }, [state.products, skuSearch, detailSkuSearch, isEditing, showCreateModal]);

  const handleAddItem = (p: Product) => {
      const defaultQty = p.itemsPerBox || 10;
      const defaultRate = p.logistics?.unitFreightCost || 35;
      const defaultTotalWeight = (p.unitWeight || 0.5) * defaultQty;

      // 核心修复点：优先处理新建弹窗逻辑
      if (showCreateModal) {
          if (plannedItems.find(item => item.product.id === p.id)) {
              showToast('清单中已存在该 SKU', 'warning');
              return;
          }
          setPlannedItems([...plannedItems, { product: p, quantity: defaultQty }]);
          setSkuSearch(''); // 添加后清空搜索框
          return;
      }

      // 后续处理详情页编辑逻辑
      if (isEditing && editForm) {
          if (editForm.items.find((it: any) => it.productId === p.id)) return;
          const newItem = {
              productId: p.id,
              sku: p.sku,
              name: p.name,
              quantity: defaultQty,
              boxes: 1,
              unitPrice: p.price || 0,
              rowTotalWeight: defaultTotalWeight,
              freightRate: defaultRate
          };
          const updatedItems = [...editForm.items, newItem];
          recalculateTotals(updatedItems);
          setDetailSkuSearch(''); // 添加后清空详情页搜索框
      }
  };

  const recalculateTotals = (items: any[]) => {
      let totalWeight = 0;
      let totalVolume = 0;
      items.forEach((it: any) => {
          const product = state.products.find(p => p.id === it.productId);
          totalWeight += Number(it.rowTotalWeight || 0);
          if (product) {
              const vol = ((product.dimensions?.l || 0) * (product.dimensions?.w || 0) * (product.dimensions?.h || 0) / 1000000) * Number(it.boxes || 1);
              totalVolume += vol;
          }
      });
      setEditForm({ ...editForm, items, totalWeight, totalVolume });
  };

  const updateItemProperty = (productId: string, field: string, value: any) => {
      if (!editForm) return;
      const updatedItems = editForm.items.map((it: any) => {
          if (it.productId === productId) {
              return { ...it, [field]: value };
          }
          return it;
      });
      recalculateTotals(updatedItems);
  };

  const handleRemoveDetailItem = (productId: string) => {
      if (!editForm) return;
      const updatedItems = editForm.items.filter((it: any) => it.productId !== productId);
      recalculateTotals(updatedItems);
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
      showToast('货件物流分摊协议已固化', 'success');
  };

  const handleCreate = () => {
      if (!newShipmentName || plannedItems.length === 0) {
          showToast('请配置协议名称与载荷清单', 'warning');
          return;
      }
      let totalWeight = 0; let totalVolume = 0;
      const shipmentItems = plannedItems.map(item => {
          const boxes = Math.ceil(item.quantity / (item.product.itemsPerBox || 1));
          const rowW = (item.product.unitWeight || 0.5) * item.quantity;
          const fr = item.product.logistics?.unitFreightCost || 35;
          
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
          name: newShipmentName, sourceWarehouseId: sourceNode, destinationWarehouseId: destNode,
          status: 'Draft', items: shipmentItems as any,
          totalWeight: parseFloat(totalWeight.toFixed(2)), totalVolume: parseFloat(totalVolume.toFixed(3)),
          createdDate: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: 'CREATE_INBOUND_SHIPMENT', payload: newInbound });
      showToast('发货协议已部署', 'success');
      setShowCreateModal(false);
      setPlannedItems([]);
      setNewShipmentName('');
  };

  const handleStatusTransition = (status: InboundShipment['status']) => {
    if (!selectedShipment) return;
    const updated = { ...selectedShipment, status };
    dispatch({ type: 'UPDATE_INBOUND_SHIPMENT', payload: updated });
    setSelectedShipment(updated);
    showToast(`货件状态已切换至: ${getStatusDisplay(status)}`, 'success');
  };

  const openCreateModal = () => {
      setSkuSearch('');
      setPlannedItems([]);
      setShowCreateModal(true);
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative bg-black/20 font-sans">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-900/40">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase italic tracking-tight">跨境物流与单证协同中枢</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Global Logistics Hub • Selection Logic Fix v10.1</p>
                </div>
            </div>
            <button onClick={openCreateModal} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase transition-all shadow-xl active:scale-95">
                <Plus className="w-4 h-4" /> 部署新发货协议
            </button>
        </div>

        <div className="flex-1 overflow-hidden flex divide-x divide-white/5">
            <div className="w-1/4 overflow-y-auto p-4 space-y-4 bg-black/40 custom-scrollbar">
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
                                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg active:scale-95"><Check className="w-3.5 h-3.5"/> 保存分摊协议</button>
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-600 transition-all"><RotateCcw className="w-3.5 h-3.5"/> 放弃修改</button>
                                    </>
                                ) : (
                                    <>
                                        {selectedShipment.status === 'Draft' && (
                                            <>
                                                <button onClick={() => { setEditForm({...selectedShipment}); setIsEditing(true); }} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all"><Edit3 className="w-3.5 h-3.5"/> 进入财务调账</button>
                                                <button onClick={() => handleStatusTransition('Shipped')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg"><Send className="w-3.5 h-3.5"/> 确认离场</button>
                                            </>
                                        )}
                                        <button onClick={() => setSelectedShipment(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all"><X className="w-4 h-4" /></button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {activeDocTab === 'details' && (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 flex items-center gap-2"><Globe className="w-3 h-3"/> 跨境路由规划</div>
                                            {isEditing ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" value={editForm?.sourceWarehouseId || ''} onChange={e => setEditForm((f:any) => ({...f, sourceWarehouseId: e.target.value}))} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none" placeholder="起运地" />
                                                    <input type="text" value={editForm?.destinationWarehouseId || ''} onChange={e => setEditForm((f:any) => ({...f, destinationWarehouseId: e.target.value}))} className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none" placeholder="目的地" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 text-white font-bold text-sm">
                                                    <span>{selectedShipment.sourceWarehouseId}</span> <ArrowRight className="w-4 h-4 text-slate-700"/> <span>{selectedShipment.destinationWarehouseId}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ios-glass-card p-6 border-l-4 border-l-amber-500">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 flex items-center gap-2"><Scale className="w-3 h-3"/> 载荷数据核算 (Total)</div>
                                            <div className="flex items-center gap-10">
                                                <div><span className="text-[10px] text-slate-600 block uppercase font-bold">批次总重</span><span className="text-xl font-black text-white font-mono">{Number(isEditing ? editForm?.totalWeight : selectedShipment.totalWeight).toFixed(1)} KG</span></div>
                                                <div className="w-px h-8 bg-white/5"></div>
                                                <div><span className="text-[10px] text-slate-600 block uppercase font-bold">总体积</span><span className="text-xl font-black text-white font-mono">{Number(isEditing ? editForm?.totalVolume : selectedShipment.totalVolume).toFixed(3)} CBM</span></div>
                                            </div>
                                        </div>
                                    </div>

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
                                                                <div key={p.id} onClick={(e) => { e.stopPropagation(); handleAddItem(p); }} className="p-3 hover:bg-indigo-600/20 cursor-pointer flex justify-between items-center transition-all group">
                                                                    <div className="text-[10px] font-black text-white">{p.sku}</div>
                                                                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs min-w-[1200px]">
                                                <thead className="text-slate-500 font-black uppercase border-b border-white/5">
                                                    <tr>
                                                        <th className="pb-3 px-2 text-[10px]">SKU 识别码</th>
                                                        <th className="pb-3 px-2 text-[10px] w-24">数量(PCS)</th>
                                                        <th className="pb-3 px-2 text-[10px] w-32 text-blue-400">行总计重(KG)</th>
                                                        <th className="pb-3 px-2 text-[10px] w-28 text-blue-400">运费价(¥/KG)</th>
                                                        <th className="pb-3 px-2 text-[10px] text-blue-200 w-36">物流小计 (¥)</th>
                                                        <th className="pb-3 px-2 text-[10px] text-emerald-400 w-32 bg-emerald-500/5">单品分摊 (¥/pcs)</th>
                                                        <th className="pb-3 px-2 text-[10px] text-indigo-400 w-28">申报单价($)</th>
                                                        <th className="pb-3 px-2 text-right text-indigo-300">申报总值($)</th>
                                                        {isEditing && <th className="pb-3 px-2 text-right w-12"></th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-mono">
                                                    {(isEditing ? editForm?.items : selectedShipment.items || []).map((item: any, i: number) => {
                                                        const rowWeight = Number(item.rowTotalWeight || 0);
                                                        const rate = Number(item.freightRate || 0);
                                                        const lineTotalFreight = rowWeight * rate;
                                                        const unitFreightCost = item.quantity > 0 ? (lineTotalFreight / item.quantity) : 0;
                                                        const unitPrice = Number(item.unitPrice || 0);
                                                        
                                                        return (
                                                            <tr key={i} className="hover:bg-white/2 group transition-colors">
                                                                <td className="py-4 px-2 font-black text-slate-200">{item.sku}</td>
                                                                <td className="py-4 px-2">
                                                                    {isEditing ? (
                                                                        <input type="number" value={item.quantity} onChange={e => updateItemProperty(item.productId, 'quantity', parseInt(e.target.value))} className="w-16 bg-black/60 border border-white/10 rounded p-1 text-xs text-white focus:border-indigo-500 outline-none" />
                                                                    ) : item.quantity}
                                                                </td>
                                                                <td className="py-4 px-2 text-blue-400">
                                                                    {isEditing ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <Weight className="w-3 h-3 opacity-30"/>
                                                                            <input type="number" step="0.01" value={item.rowTotalWeight} onChange={e => updateItemProperty(item.productId, 'rowTotalWeight', parseFloat(e.target.value))} className="w-24 bg-blue-500/5 border border-blue-500/20 rounded p-1 text-xs text-blue-300 focus:border-blue-500 outline-none font-bold" />
                                                                        </div>
                                                                    ) : `${rowWeight.toFixed(2)}kg`}
                                                                </td>
                                                                <td className="py-4 px-2 text-blue-400">
                                                                    {isEditing ? (
                                                                        <input type="number" value={item.freightRate} onChange={e => updateItemProperty(item.productId, 'freightRate', parseFloat(e.target.value))} className="w-16 bg-blue-500/5 border border-blue-500/20 rounded p-1 text-xs text-blue-300 focus:border-blue-500 outline-none font-bold" />
                                                                    ) : `¥${rate}`}
                                                                </td>
                                                                <td className="py-4 px-2 text-blue-100 font-bold">
                                                                    ¥ {lineTotalFreight.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                                </td>
                                                                <td className="py-4 px-2 bg-emerald-500/5 text-emerald-400 font-black text-sm">
                                                                    ¥ {unitFreightCost.toFixed(2)}
                                                                </td>
                                                                <td className="py-4 px-2 text-indigo-400 font-bold">
                                                                    {isEditing ? (
                                                                        <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItemProperty(item.productId, 'unitPrice', parseFloat(e.target.value))} className="w-20 bg-indigo-500/5 border border-indigo-500/20 rounded p-1 text-xs text-indigo-300 focus:border-indigo-500 outline-none font-bold" />
                                                                    ) : `$${unitPrice.toFixed(2)}`}
                                                                </td>
                                                                <td className="py-4 px-2 text-right font-black text-indigo-300 text-sm">
                                                                    ${(Number(item.quantity || 0) * unitPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}
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
                                                        <td colSpan={4} className="py-5 px-2 text-slate-500 text-right italic">本批次运费总额 (CNY):</td>
                                                        <td className="py-5 px-2 text-blue-400 text-lg">
                                                            ¥ {(isEditing ? editForm?.items : selectedShipment.items || []).reduce((acc: any, it: any) => acc + (Number(it.rowTotalWeight || 0) * Number(it.freightRate || 0)), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                        </td>
                                                        <td colSpan={2} className="py-5 px-2 text-slate-500 text-right italic">总申报货值 (USD):</td>
                                                        <td className="py-5 px-2 text-indigo-300 text-right text-lg font-mono">
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
                                                <h5 className="text-xs font-bold text-white uppercase mb-1">财务核算协议：Batch-First</h5>
                                                <p className="text-[10px] text-indigo-300/60 leading-relaxed font-medium">当前采用“行总重过磅”录入模式。系统会自动根据总重、单价、SKU件数三维交叉计算最真实的单品分摊成本。</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                                            <Calculator className="w-6 h-6 text-blue-400 shrink-0" />
                                            <div>
                                                <h5 className="text-xs font-bold text-white uppercase mb-1">分摊算法同步</h5>
                                                <p className="text-[10px] text-blue-300/60 leading-relaxed font-medium">此分摊结果（¥/pcs）将作为核心成本因子，自动注入财务中心 SKU 盈亏穿透模型。</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {(activeDocTab === 'ci' || activeDocTab === 'pl') && (
                                <div className="h-[500px] flex flex-col items-center justify-center text-slate-700 bg-black/40 rounded-3xl border-2 border-dashed border-white/5">
                                    <FileText className="w-12 h-12 opacity-10 mb-6 animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">正在动态渲染 PDF 单证...</p>
                                    <button className="mt-10 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all">
                                        <Download className="w-4 h-4"/> 导出 PDF 协议文件
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                         <Truck className="w-16 h-16 opacity-5 mb-8" />
                         <h3 className="text-sm font-black uppercase tracking-[0.5em] mb-2 text-slate-600">待命状态 (Standby)</h3>
                         <p className="text-[10px] text-center max-w-xs leading-relaxed uppercase tracking-widest text-slate-500 font-bold">请从左侧列表选择一个业务节点</p>
                    </div>
                )}
            </div>
        </div>

        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60" onClick={() => setShowCreateModal(false)}>
                <div className="ios-glass-panel w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 bg-[#0f0f12] border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">部署全球货件协议 (Setup)</h3>
                        <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-500" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-12 gap-10">
                            <div className="col-span-12 lg:col-span-5 space-y-6">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">协议名称</label>
                                <input type="text" value={newShipmentName} onChange={e => setNewShipmentName(e.target.value)} placeholder="例如：FBA 西部节点补货" className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-blue-500 outline-none font-bold" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" value={sourceNode} onChange={e => setSourceNode(e.target.value)} placeholder="起运地" className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                    <input type="text" value={destNode} onChange={e => setDestNode(e.target.value)} placeholder="目的地" className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                </div>
                            </div>
                            <div className="col-span-12 lg:col-span-7 space-y-6">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">初始载荷配置 (Payload)</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-600 absolute left-4 top-4" />
                                    <input type="text" value={skuSearch} onChange={e => setSkuSearch(e.target.value)} placeholder="搜索 SKU 资产库..." className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-indigo-500 outline-none font-bold" />
                                    {filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                                            {filteredProducts.map(p => (
                                                <div key={p.id} onClick={(e) => { e.stopPropagation(); handleAddItem(p); }} className="p-4 hover:bg-indigo-600/20 cursor-pointer flex justify-between items-center transition-all group">
                                                    <div className="text-sm font-black text-white">{p.sku}</div>
                                                    <Plus className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 group-hover:scale-125 transition-all" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {plannedItems.map(item => (
                                        <div key={item.product.id} className="bg-white/2 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all">
                                            <div className="text-sm font-black text-white">{item.product.sku}</div>
                                            <div className="flex items-center gap-6">
                                                <input type="number" value={item.quantity} onChange={e => {
                                                    const qty = parseInt(e.target.value) || 0;
                                                    setPlannedItems(plannedItems.map(it => it.product.id === item.product.id ? { ...it, quantity: qty } : it));
                                                }} className="w-24 bg-black/60 border border-white/10 rounded-lg p-2 text-sm text-white font-mono text-center outline-none" />
                                                <button onClick={() => setPlannedItems(plannedItems.filter(it => it.product.id !== item.product.id))} className="p-2 text-slate-700 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 border-t border-white/5 bg-white/2 flex justify-between items-center">
                        <div className="flex gap-10">
                            <div><span className="text-[10px] text-slate-500 font-black uppercase block">预估行重</span><span className="text-xl font-black text-white font-mono">{(plannedItems.reduce((acc, it) => acc + (Number(it.quantity) * (it.product.unitWeight || 0.5)), 0)).toFixed(1)} KG</span></div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowCreateModal(false)} className="px-8 py-3 text-slate-500 font-black text-xs uppercase hover:text-white transition-colors">取消</button>
                            <button onClick={handleCreate} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase shadow-2xl flex items-center gap-3 transition-all active:scale-95"><Save className="w-5 h-5"/> 激活协议</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }` }} />
    </div>
  );
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

export default InboundShipments;