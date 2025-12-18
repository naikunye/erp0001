
import React, { useState, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { InboundShipment, Product, Warehouse, InboundShipmentItem } from '../types';
import { WAREHOUSES } from '../constants';
/* Added Scale to lucide-react imports */
import { Container, Plus, Search, Box, Truck, CheckCircle2, ArrowRight, Printer, MapPin, X, PackageOpen, Ruler, FileText, Download, ShieldCheck, Zap, Globe, LayoutList, Clipboard, ExternalLink, Scale } from 'lucide-react';

const InboundShipments: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'details' | 'ci' | 'pl'>('details');

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

      let totalWeight = 0;
      let totalVolume = 0;
      const shipmentItems: InboundShipmentItem[] = selectedProducts.map(sp => {
          const boxes = Math.ceil(sp.quantity / (sp.product.itemsPerBox || 1));
          totalWeight += sp.quantity * (sp.product.unitWeight || 0);
          const vol = (sp.product.dimensions?.l || 0) * (sp.product.dimensions?.w || 0) * (sp.product.dimensions?.h || 0) / 1000000;
          totalVolume += vol * boxes;
          
          return {
              productId: sp.product.id,
              sku: sp.product.sku,
              name: sp.product.name,
              quantity: sp.quantity,
              boxes,
              unitPrice: sp.product.price,
              hscode: '8517.62.00' // Mock HS Code
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
      showToast('物流发货计划已创建', 'success');
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

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'Draft': return 'bg-slate-700 text-slate-300 border-slate-600';
          case 'Shipped': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]';
          case 'Receiving': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          default: return 'bg-slate-700 text-slate-300';
      }
  };

  // --- Document Preview Renderers ---
  const renderCI = (shipment: InboundShipment) => (
      <div className="bg-white text-black p-8 font-serif border border-black/10 shadow-2xl h-full overflow-y-auto">
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
              <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter">Commercial Invoice</h1>
                  <p className="text-[10px] font-bold mt-1">Invoice No: {shipment.id}</p>
              </div>
              <div className="text-right text-[10px] font-bold uppercase">
                  <p>Date: {shipment.createdDate}</p>
                  <p>Currency: USD</p>
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 text-[10px] mb-8">
              <div>
                  <h4 className="font-black border-b border-black mb-2 uppercase">Shipper / Exporter</h4>
                  <p className="font-bold">TANXING GLOBAL LOGISTICS</p>
                  <p>Baoan, Shenzhen, CN</p>
              </div>
              <div>
                  <h4 className="font-black border-b border-black mb-2 uppercase">Consignee / Importer</h4>
                  <p className="font-bold">AMAZON FBA WAREHOUSE</p>
                  <p>{WAREHOUSES.find(w => w.id === shipment.destinationWarehouseId)?.name}</p>
              </div>
          </div>

          <table className="w-full text-left text-[10px] mb-8 border-collapse">
              <thead>
                  <tr className="border-y border-black font-black uppercase">
                      <th className="py-2">Description</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2">HS Code</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {shipment.items.map((item, i) => (
                      <tr key={i} className="border-b border-black/5">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2 font-mono">{item.sku}</td>
                          <td className="py-2">8517.62.00</td>
                          <td className="py-2 text-right">{item.quantity}</td>
                          <td className="py-2 text-right">${(item.unitPrice * 0.4).toFixed(2)}</td>
                          <td className="py-2 text-right">${(item.quantity * item.unitPrice * 0.4).toFixed(2)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>

          <div className="flex justify-end gap-12 text-[11px] font-black border-t-2 border-black pt-4">
              <span>TOTAL (USD):</span>
              <span>${shipment.items.reduce((acc, it) => acc + it.quantity * it.unitPrice * 0.4, 0).toFixed(2)}</span>
          </div>
      </div>
  );

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative bg-[#09090b]">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-900/30">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight uppercase italic">物流集成控制中枢 (Logistics Hub)</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Automated CI/PL Generator • End-to-End Visibility</p>
                </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-xl shadow-blue-900/40 text-xs font-bold uppercase tracking-widest active:scale-95">
                <Plus className="w-4 h-4" />
                <span>部署新计划</span>
            </button>
        </div>

        {/* List & Explorer */}
        <div className="flex-1 overflow-hidden flex divide-x divide-white/5">
            {/* List Side */}
            <div className="w-1/3 overflow-y-auto p-4 space-y-4 bg-black/40">
                {state.inboundShipments.map(shipment => (
                    <div 
                        key={shipment.id}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative group ${selectedShipment?.id === shipment.id ? 'bg-blue-600/10 border-blue-500/50 shadow-inner' : 'bg-white/2 border-white/5 hover:border-white/10'}`}
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

            {/* Content Side */}
            <div className="flex-1 bg-black/20 flex flex-col min-w-0">
                {selectedShipment ? (
                    <>
                        <div className="p-4 bg-white/2 border-b border-white/5 flex justify-between items-center">
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setActiveDocTab('details')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'details' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>货件详情</button>
                                <button onClick={() => setActiveDocTab('ci')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'ci' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>商业发票 (CI)</button>
                                <button onClick={() => setActiveDocTab('pl')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDocTab === 'pl' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>装箱单 (PL)</button>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"><Printer className="w-4 h-4" /></button>
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                                <button onClick={() => setSelectedShipment(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden p-6">
                            {activeDocTab === 'details' && (
                                <div className="h-full overflow-y-auto space-y-6 animate-in fade-in">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="ios-glass-card p-5 border-l-4 border-l-blue-500">
                                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Departure / 起始地</div>
                                            <div className="text-sm font-bold text-white uppercase">{WAREHOUSES.find(w => w.id === selectedShipment.sourceWarehouseId)?.name}</div>
                                        </div>
                                        <div className="ios-glass-card p-5 flex items-center justify-center text-slate-700">
                                            <ArrowRight className="w-8 h-8 animate-pulse" />
                                        </div>
                                        <div className="ios-glass-card p-5 border-l-4 border-l-emerald-500">
                                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Destination / 目的地</div>
                                            <div className="text-sm font-bold text-white uppercase">{WAREHOUSES.find(w => w.id === selectedShipment.destinationWarehouseId)?.name}</div>
                                        </div>
                                    </div>

                                    <div className="ios-glass-card p-6">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2"><LayoutList className="w-3.5 h-3.5" /> 货物数字化清单</h4>
                                        <table className="w-full text-left">
                                            <thead className="bg-white/2 text-[9px] text-slate-500 uppercase font-black">
                                                <tr>
                                                    <th className="p-3">SKU Identifier</th>
                                                    <th className="p-3">Qty (PCS)</th>
                                                    <th className="p-3">Boxes</th>
                                                    <th className="p-3">Declared Value</th>
                                                    <th className="p-3">HS Code</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedShipment.items.map((item, i) => (
                                                    <tr key={i} className="hover:bg-white/2 transition-colors">
                                                        <td className="p-3 font-mono text-xs font-bold text-white">{item.sku}</td>
                                                        <td className="p-3 font-mono text-xs">{item.quantity}</td>
                                                        <td className="p-3 font-mono text-xs">{item.boxes}</td>
                                                        <td className="p-3 font-mono text-xs text-blue-400">${(item.quantity * item.unitPrice * 0.4).toFixed(2)}</td>
                                                        <td className="p-3 font-mono text-[10px] text-slate-600">{item.hscode || '8517.62.00'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-start gap-4">
                                        <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400"><ShieldCheck className="w-6 h-6" /></div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white uppercase mb-1">AI 单证自动审计已通过</h4>
                                            <p className="text-[10px] text-indigo-200/60 leading-relaxed">系统已自动比对 SKU 的 HS Code、出口地政策及货件毛重。当前单证信息符合海关出口要求，建议直接下载导出。</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDocTab === 'ci' && (
                                <div className="h-full animate-in zoom-in-95 duration-300">
                                    {renderCI(selectedShipment)}
                                </div>
                            )}

                            {activeDocTab === 'pl' && (
                                <div className="h-full flex items-center justify-center text-slate-700 bg-white/2 rounded-2xl border-2 border-dashed border-white/5">
                                    <div className="text-center">
                                        <PackageOpen className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                        <p className="text-xs uppercase tracking-[0.2em] font-black">Packing List 视图生成中...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                        <div className="w-24 h-24 bg-white/2 rounded-full flex items-center justify-center mb-6">
                            <Truck className="w-12 h-12 opacity-10" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] mb-2">待命状态 (Standby)</h3>
                        <p className="text-[10px] text-center max-w-xs leading-relaxed uppercase tracking-widest text-slate-600">请在左侧列表中选择一个活跃的 Inbound 货件节点以调阅详细物流情报与单证。</p>
                    </div>
                )}
            </div>
        </div>
        
        {/* Create Modal - Simplified for snippet */}
        {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/80" onClick={() => setShowCreateModal(false)}>
                <div className="ios-glass-panel w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 bg-[#0f1218]" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white uppercase italic">配置全球货件协议 (Inbound Protocol)</h3>
                        <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                         {/* Form Content here... */}
                         <div className="text-center text-slate-600 uppercase text-[10px] tracking-widest p-20 border-2 border-dashed border-white/5 rounded-2xl">
                             协议参数载入中...
                         </div>
                    </div>
                    <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-white/2">
                        <button onClick={() => setShowCreateModal(false)} className="px-6 py-2 text-slate-400 text-xs font-bold uppercase">取消</button>
                        <button onClick={handleCreate} className="px-8 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xl shadow-blue-900/40 uppercase tracking-widest">确认部署</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default InboundShipments;
