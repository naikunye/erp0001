import React, { useState, useMemo } from 'react';
import { 
  Truck, CheckCircle, Clock, ShoppingCart, X, Package, 
  LayoutGrid, List, MoreHorizontal, Box, 
  Plus, Trash2, Search, ExternalLink, Calendar, 
  ChevronRight, ArrowRight, Zap, Play, CheckCircle2,
  ChevronUp, ShieldCheck
} from 'lucide-react';
import { Order } from '../types';
import { useTanxing } from '../context/TanxingContext';

const Orders: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
      customerName: '',
      status: 'pending',
      total: 0,
      itemsCount: 0,
      date: new Date().toISOString().split('T')[0]
  });

  const filteredOrders = useMemo(() => {
      return state.orders.filter(order => {
          if (order.deletedAt) return false;
          const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
          return matchesSearch && matchesStatus;
      });
  }, [state.orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
      const total = filteredOrders.length;
      const revenue = filteredOrders.reduce((acc, o) => acc + o.total, 0);
      const pending = filteredOrders.filter(o => o.status === 'pending').length;
      return { total, revenue, pending };
  }, [filteredOrders]);

  const handleDeleteOrder = (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (confirm('确定要作废此订单吗？')) {
          dispatch({ type: 'DELETE_ORDER', payload: id });
          showToast('订单已移除', 'info');
          if (selectedOrder?.id === id) setSelectedOrder(null);
      }
  };

  const handleUpdateStatus = (id: string, status: Order['status'], e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: id, status } });
      showToast(`业务状态推进: ${status.toUpperCase()}`, 'success');
  };

  const handleSaveNewOrder = () => {
      if (!newOrder.customerName) return showToast('请输入客户标识', 'warning');
      const order: Order = {
          id: `PO-${Date.now()}`,
          customerName: newOrder.customerName!,
          date: newOrder.date || new Date().toISOString().split('T')[0],
          total: Number(newOrder.total) || 0,
          status: 'pending',
          itemsCount: Number(newOrder.itemsCount) || 1,
          lineItems: [],
          paymentStatus: 'unpaid'
      };
      dispatch({ type: 'ADD_ORDER', payload: order });
      showToast('业务订单已注册', 'success');
      setShowAddModal(false);
      setNewOrder({ customerName: '', status: 'pending', total: 0, itemsCount: 0, date: new Date().toISOString().split('T')[0] });
  };

  const getStatusGloss = (status: string) => {
      switch (status) {
          case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
          case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
          case 'shipped': return 'bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]';
          case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
          default: return 'bg-slate-800 text-slate-400 border-slate-700';
      }
  };

  const renderKanban = () => {
      const columns: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered'];
      return (
          <div className="flex gap-6 h-full overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-white/5">
              {columns.map(status => (
                  <div key={status} className="flex-1 min-w-[340px] flex flex-col gap-5">
                      <div className="flex items-center justify-between px-4 py-2 bg-white/2 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-4 rounded-full ${status === 'pending' ? 'bg-amber-500' : status === 'processing' ? 'bg-blue-500' : status === 'shipped' ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">{status}</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{filteredOrders.filter(o => o.status === status).length} NODE</span>
                      </div>
                      
                      <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                          {filteredOrders.filter(o => o.status === status).map(order => (
                              <div 
                                  key={order.id} 
                                  onClick={() => setSelectedOrder(order)}
                                  className="ios-glass-card p-6 group cursor-pointer relative bg-[#121215] border-white/5 hover:border-violet-500/40"
                              >
                                  <div className="flex justify-between items-start mb-4">
                                      <span className="font-mono text-[9px] font-bold text-slate-600">ID://{order.id.slice(-8)}</span>
                                      <span className="font-mono text-sm font-bold text-white tracking-tighter">¥{order.total.toLocaleString()}</span>
                                  </div>
                                  
                                  <div className="text-[15px] font-semibold text-slate-100 mb-6 truncate">{order.customerName}</div>
                                  
                                  <div className="flex items-center justify-between mb-6">
                                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                          <Package className="w-3.5 h-3.5" /> {order.itemsCount} SKU
                                      </div>
                                      <div className="text-[10px] text-slate-600 font-mono italic">{order.date}</div>
                                  </div>

                                  {/* Quick Tactical Action */}
                                  <div className="pt-5 border-t border-white/5">
                                      {order.status === 'pending' && (
                                          <button 
                                            onClick={(e) => handleUpdateStatus(order.id, 'processing', e)}
                                            className="w-full py-2.5 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg transition-all active:scale-[0.98]"
                                          >
                                              <Play className="w-3 h-3 fill-current" /> 启动履约协议 START
                                          </button>
                                      )}
                                      {order.status === 'processing' && (
                                          <button 
                                            onClick={(e) => handleUpdateStatus(order.id, 'shipped', e)}
                                            className="w-full py-2.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg transition-all active:scale-[0.98]"
                                          >
                                              <Truck className="w-4 h-4" /> 确认物料离场 SHIP
                                          </button>
                                      )}
                                      {order.status === 'shipped' && (
                                          <div className="w-full py-2.5 bg-slate-900 border border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg">
                                              <Clock className="w-3.5 h-3.5" /> 物流信号同步中...
                                          </div>
                                      )}
                                      {order.status === 'delivered' && (
                                          <div className="w-full py-2.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg">
                                              <CheckCircle2 className="w-3.5 h-3.5" /> 资产已结清 ARCHIVED
                                          </div>
                                      )}
                                  </div>
                                  
                                  <button 
                                      onClick={(e) => handleDeleteOrder(order.id, e)}
                                      className="absolute top-3 right-3 p-1 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const renderList = () => (
      <div className="ios-glass-panel overflow-hidden border-white/5">
          <table className="w-full text-left text-sm">
              <thead className="bg-white/2 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-white/5">
                  <tr>
                      <th className="p-5">Node ID</th>
                      <th className="p-5">Master Entity</th>
                      <th className="p-5">Sync Date</th>
                      <th className="p-5">Live Status</th>
                      <th className="p-5 text-right">GMV Value</th>
                      <th className="p-5 text-center">CMD</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                  {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/2 cursor-pointer group" onClick={() => setSelectedOrder(order)}>
                          <td className="p-5 font-mono text-xs text-slate-400">{order.id}</td>
                          <td className="p-5 font-bold text-slate-100">{order.customerName}</td>
                          <td className="p-5 text-slate-500 font-mono text-xs">{order.date}</td>
                          <td className="p-5">
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusGloss(order.status)}`}>
                                {order.status}
                              </span>
                          </td>
                          <td className="p-5 text-right font-mono font-bold text-white text-base">¥{order.total.toLocaleString()}</td>
                          <td className="p-5 text-center">
                              <button 
                                  onClick={(e) => handleDeleteOrder(order.id, e)}
                                  className="p-1.5 text-slate-600 hover:text-red-500 transition-colors"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 p-7 ios-glass-panel border-white/5 bg-white/2">
          <div className="flex items-center gap-6">
              <div className="p-3.5 bg-violet-600/10 rounded-2xl border border-violet-500/30 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div>
                  <h2 className="text-3xl font-bold tracking-tighter text-white uppercase italic">数据流转中枢</h2>
                  <div className="flex gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                      <div className="flex items-center gap-2">累计吞吐 <span className="text-violet-400 font-mono">¥{stats.revenue.toLocaleString()}</span></div>
                      <div className="flex items-center gap-2">待执行 <span className="text-amber-500 font-mono">{stats.pending}</span></div>
                  </div>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
              <div className="relative">
                  <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
                  <input 
                      type="text" 
                      placeholder="SEARCH NODE..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-black/40 border border-white/10 text-xs font-bold text-white uppercase focus:border-violet-500/50 transition-all outline-none w-64"
                  />
              </div>
              <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
                  <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid className="w-4.5 h-4.5"/></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><List className="w-4.5 h-4.5"/></button>
              </div>
              <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-violet-900/20 active:scale-95 transition-all flex items-center gap-2"
              >
                  <Plus className="w-4 h-4" /> 注册新业务
              </button>
          </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === 'kanban' ? renderKanban() : renderList()}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60" onClick={() => setSelectedOrder(null)}>
              <div className="ios-glass-panel w-full max-w-4xl border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                      <div>
                          <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-bold text-white tracking-tight font-mono">NODE://{selectedOrder.id}</h3>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${getStatusGloss(selectedOrder.status)}`}>{selectedOrder.status}</span>
                          </div>
                          <p className="text-xs font-medium text-slate-500 mt-2 uppercase font-mono">{selectedOrder.date} • ENTITY: {selectedOrder.customerName}</p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="p-2.5 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-8">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Box className="w-4 h-4"/> 物料详情 (Line Items)</h4>
                          <div className="space-y-4">
                              {selectedOrder.lineItems?.length ? (
                                  selectedOrder.lineItems.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center p-5 border border-white/5 bg-white/2 rounded-xl">
                                          <div className="flex items-center gap-5">
                                              <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center font-bold text-slate-600 border border-white/5">SKU</div>
                                              <div>
                                                  <div className="text-sm font-bold text-slate-200">{item.sku}</div>
                                                  <div className="text-[10px] text-slate-600 font-mono mt-1">REF: {item.productId}</div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-lg font-bold text-white font-mono">× {item.quantity}</div>
                                              <div className="text-xs font-medium text-slate-500">¥{item.price}</div>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="p-16 border border-dashed border-white/5 rounded-2xl text-center text-slate-600 text-xs italic uppercase tracking-widest">No detailed data available</div>
                              )}
                          </div>
                      </div>

                      <div className="md:col-span-1 space-y-8">
                          <div className="p-7 border border-white/5 bg-white/2 rounded-2xl">
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-6 tracking-widest">财务对账</h4>
                              <div className="space-y-5">
                                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                                      <span>BASE VALUE</span>
                                      <span className="text-slate-300 font-mono">¥{selectedOrder.total}</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                                      <span>SHIPPING FEE</span>
                                      <span className="text-slate-300 font-mono">¥0.00</span>
                                  </div>
                                  <div className="h-px bg-white/5 my-2"></div>
                                  <div className="flex justify-between items-end">
                                      <span className="text-xs font-bold uppercase text-slate-600">NET GMV</span>
                                      <span className="text-3xl font-bold text-violet-400 font-mono tracking-tighter">¥{selectedOrder.total}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <div className="flex items-center gap-3 text-emerald-400 text-xs font-bold mb-1">
                                    <ShieldCheck className="w-4 h-4" /> 验证通过 (Verified)
                                </div>
                                <p className="text-[10px] text-emerald-500/70 leading-relaxed uppercase">此数据节点已完成加密校验并广播至所有分布式终端。</p>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteOrder(selectedOrder.id)}
                            className="w-full py-4 border border-red-900/30 text-red-500/60 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            作废当前节点记录
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;