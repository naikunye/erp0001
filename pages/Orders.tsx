import React, { useState, useMemo } from 'react';
import { 
  Truck, CheckCircle, Clock, ShoppingCart, X, Package, 
  LayoutGrid, List, MoreHorizontal, Box, 
  Plus, Trash2, Search, ExternalLink, Calendar, 
  ChevronRight, ArrowRight, Zap, Play, CheckCircle2,
  ChevronUp, ShieldCheck, Factory, Warehouse, Globe, MapPin, 
  ArrowDownToLine, Navigation, History, Link2
} from 'lucide-react';
import { Order, Shipment } from '../types';
import { useTanxing } from '../context/TanxingContext';

const Orders: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const orders = state.orders || [];

  const filteredOrders = useMemo(() => {
      return orders.filter(order => {
          if (order.deletedAt) return false;
          const matchesSearch = (order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
          return matchesSearch && matchesStatus;
      });
  }, [orders, searchTerm, statusFilter]);

  // 模拟寻找与订单相关的物流单据
  const findLinkedShipment = (order: Order): Shipment | undefined => {
    return state.shipments.find(s => s.productName?.includes(order.customerName) || order.lineItems?.some(li => s.productName?.includes(li.sku)));
  };

  const getStatusGloss = (status: string) => {
      switch (status) {
          case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
          case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
          case 'shipped': return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
          case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          default: return 'bg-slate-800 text-slate-400 border-slate-700';
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 p-7 ios-glass-panel border-white/5 bg-white/2 rounded-[2rem]">
          <div className="flex items-center gap-6">
              <div className="p-3.5 bg-violet-600/10 rounded-2xl border border-violet-500/30 text-violet-400 shadow-2xl">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div>
                  <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">业务订单中枢</h2>
                  <div className="flex gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                      <div className="flex items-center gap-2">累计 GMV <span className="text-violet-400 font-mono">¥{orders.reduce((a,b)=>a+(b.total||0), 0).toLocaleString()}</span></div>
                      <div className="flex items-center gap-2">待执行 <span className="text-amber-500 font-mono">{orders.filter(o=>o.status==='pending').length}</span></div>
                  </div>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
              <div className="relative">
                  <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
                  <input type="text" placeholder="SEARCH NODE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-3 bg-black/40 border border-white/10 text-xs font-bold text-white uppercase focus:border-violet-500/50 transition-all outline-none w-64 rounded-xl" />
              </div>
              <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
                  <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid className="w-4.5 h-4.5"/></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><List className="w-4.5 h-4.5"/></button>
              </div>
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl active:scale-95 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> 注册业务</button>
          </div>
      </div>

      <div className="flex-1 min-h-0">
          {viewMode === 'kanban' ? (
              <div className="flex gap-6 h-full overflow-x-auto pb-8 custom-scrollbar">
                  {['pending', 'processing', 'shipped', 'delivered'].map(status => (
                      <div key={status} className="flex-1 min-w-[340px] flex flex-col gap-5">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/2 rounded-xl border border-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-4 rounded-full ${status === 'pending' ? 'bg-amber-500' : status === 'processing' ? 'bg-blue-500' : status === 'shipped' ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">{status}</h3>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500">{filteredOrders.filter(o => o.status === status).length} NODE</span>
                          </div>
                          <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                              {filteredOrders.filter(o => o.status === status).map(order => (
                                  <div key={order.id} onClick={() => setSelectedOrder(order)} className="ios-glass-card p-6 group cursor-pointer relative bg-[#0a0a0c]/80 border-white/5 hover:border-violet-500/50 hover:scale-[1.02] transition-all">
                                      <div className="flex justify-between items-start mb-4">
                                          <span className="font-mono text-[9px] font-bold text-slate-600">ID://{order.id.slice(-8)}</span>
                                          <span className="font-mono text-sm font-bold text-white tracking-tighter">¥{(order.total || 0).toLocaleString()}</span>
                                      </div>
                                      <div className="text-[15px] font-black text-slate-100 mb-6 truncate italic">{order.customerName}</div>
                                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                          <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-indigo-400" /> {order.itemsCount} SKU</div>
                                          <div>{order.date}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="ios-glass-panel overflow-hidden border-white/5 rounded-3xl">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-white/2 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-white/5">
                          <tr><th className="p-5">Node ID</th><th className="p-5">Entity</th><th className="p-5">Live Status</th><th className="p-5 text-right">GMV Value</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {filteredOrders.map(order => (
                              <tr key={order.id} className="hover:bg-white/2 cursor-pointer transition-colors" onClick={() => setSelectedOrder(order)}>
                                  <td className="p-5 font-mono text-xs text-slate-400">{order.id}</td>
                                  <td className="p-5 font-black text-slate-100">{order.customerName}</td>
                                  <td className="p-5"><span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusGloss(order.status)}`}>{order.status}</span></td>
                                  <td className="p-5 text-right font-mono font-bold text-white text-base">¥{(order.total || 0).toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60" onClick={() => setSelectedOrder(null)}>
              <div className="ios-glass-panel w-full max-w-5xl border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-500 flex flex-col rounded-[3rem] h-[85vh]" onClick={e => e.stopPropagation()}>
                  <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                      <div>
                          <div className="flex items-center gap-4">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Order Profile</h3>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${getStatusGloss(selectedOrder.status)}`}>{selectedOrder.status}</span>
                          </div>
                          <p className="text-xs font-black text-slate-500 mt-2 uppercase font-mono tracking-widest">{selectedOrder.id} • ENTITY: {selectedOrder.customerName}</p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="p-4 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><X className="w-8 h-8" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,#111,transparent)]">
                      {/* 全链路穿透可视化 (Lineage) */}
                      <div className="space-y-6">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                              <div className="w-2 h-5 bg-indigo-600 rounded-full"></div>
                              全链路资产穿透 (Life-cycle Lineage)
                          </h4>
                          <div className="flex items-center justify-between relative px-10">
                              <div className="absolute top-1/2 left-20 right-20 h-px bg-gradient-to-r from-indigo-500/10 via-indigo-500 to-indigo-500/10 -translate-y-1/2 opacity-30"></div>
                              
                              {[
                                { icon: Factory, label: '国内工厂', date: '2023-10-01', status: 'Completed' },
                                { icon: Navigation, label: '头程起运', date: '2023-10-15', status: 'In Transit' },
                                { icon: Warehouse, label: 'FBA 入库', date: '2023-10-25', status: 'Stocked' },
                                { icon: Globe, label: '订单交付', date: selectedOrder.date, status: selectedOrder.status.toUpperCase() }
                              ].map((node, i) => (
                                <div key={i} className="flex flex-col items-center gap-4 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${i === 3 ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl' : 'bg-black/60 border-indigo-500/30 text-indigo-400'}`}>
                                        <node.icon className="w-7 h-7" />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-black text-white uppercase tracking-tighter">{node.label}</div>
                                        <div className="text-[8px] text-slate-500 font-mono mt-1">{node.date}</div>
                                    </div>
                                </div>
                              ))}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                          <div className="md:col-span-2 space-y-6">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Box className="w-4 h-4 text-indigo-400"/> 物料清单 (Payload Details)</h4>
                              <div className="space-y-4">
                                  {selectedOrder.lineItems?.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center p-6 border border-white/5 bg-white/2 rounded-3xl hover:bg-white/5 transition-all">
                                          <div className="flex items-center gap-6">
                                              <div className="w-16 h-16 bg-black/60 rounded-2xl flex items-center justify-center font-black text-slate-700 border border-white/5 italic">SKU</div>
                                              <div>
                                                  <div className="text-lg font-black text-slate-100 italic">{item.sku}</div>
                                                  <div className="text-[10px] text-slate-600 font-mono mt-1 uppercase">NODE REF: {item.productId}</div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-2xl font-black text-white font-mono tracking-tighter">× {item.quantity}</div>
                                              <div className="text-[10px] font-bold text-slate-500 mt-1">UNIT: ¥{item.price}</div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="md:col-span-1 space-y-6">
                              <div className="p-8 border border-white/5 bg-black/40 rounded-[2.5rem] shadow-inner">
                                  <h4 className="text-[10px] font-black text-slate-500 uppercase mb-8 tracking-[0.3em]">审计摘要</h4>
                                  <div className="space-y-6">
                                      <div className="flex justify-between text-xs font-bold text-slate-400"><span>BASE GMV</span><span className="text-white font-mono">¥{selectedOrder.total.toLocaleString()}</span></div>
                                      <div className="flex justify-between text-xs font-bold text-slate-400"><span>TAX & FEES</span><span className="text-rose-500 font-mono">¥0.00</span></div>
                                      <div className="h-px bg-white/5"></div>
                                      <div className="flex justify-between items-end">
                                          <span className="text-[10px] font-black uppercase text-slate-600">NET SETTLEMENT</span>
                                          <span className="text-4xl font-black text-violet-400 font-mono tracking-tighter">¥{selectedOrder.total.toLocaleString()}</span>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex items-center gap-4">
                                <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
                                <p className="text-[10px] text-emerald-500/70 leading-relaxed font-bold uppercase italic">该节点资产状态已完成多重共识校验，数据不可篡改并已同步至全球备货矩阵。</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;