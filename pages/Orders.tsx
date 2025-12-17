
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Truck, CheckCircle, XCircle, Clock, ShoppingCart, X, Package, 
  MapPin, CreditCard, ArrowRight, LayoutGrid, List, MoreHorizontal, Box, 
  GripVertical, DollarSign, Calculator, Info, Zap, Plus, Trash2, PlayCircle, 
  Search, Edit2, Save, Filter, Loader2, ExternalLink, Calendar
} from 'lucide-react';
import { Order, Product, OrderLineItem } from '../types';
import { useTanxing } from '../context/TanxingContext';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const Orders: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Order State
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

  // --- Handlers ---

  const handleDeleteOrder = (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (confirm('确定要将此订单移入回收站吗？')) {
          dispatch({ type: 'DELETE_ORDER', payload: id });
          showToast('订单已删除', 'info');
          if (selectedOrder?.id === id) setSelectedOrder(null);
      }
  };

  const handleUpdateStatus = (id: string, status: Order['status'], e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: id, status } });
      showToast(`订单状态已更新为 ${status}`, 'success');
  };

  const handleSaveNewOrder = () => {
      if (!newOrder.customerName) return showToast('请输入客户名称', 'warning');
      
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
      showToast('新订单已创建', 'success');
      setShowAddModal(false);
      setNewOrder({ customerName: '', status: 'pending', total: 0, itemsCount: 0, date: new Date().toISOString().split('T')[0] });
  };

  // --- Renderers ---

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          case 'shipped': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
          case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
          default: return 'bg-slate-700 text-slate-400';
      }
  };

  const renderKanban = () => {
      const columns = ['pending', 'processing', 'shipped', 'delivered'];
      return (
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
              {columns.map(status => (
                  <div key={status} className="flex-1 min-w-[280px] bg-white/5 border border-white/5 rounded-xl flex flex-col">
                      <div className={`p-3 border-b border-white/5 font-bold uppercase text-xs flex justify-between items-center ${getStatusColor(status).split(' ')[0]}`}>
                          <span>{status}</span>
                          <span className="bg-black/20 px-2 py-0.5 rounded text-[10px]">{filteredOrders.filter(o => o.status === status).length}</span>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                          {filteredOrders.filter(o => o.status === status).map(order => (
                              <div 
                                  key={order.id} 
                                  onClick={() => setSelectedOrder(order)}
                                  className="bg-black/40 border border-white/5 p-3 rounded-lg hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group relative shadow-sm"
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="font-mono text-xs font-bold text-slate-300">{order.id}</span>
                                      <span className="font-mono text-xs font-bold text-white">¥{order.total.toLocaleString()}</span>
                                  </div>
                                  <div className="text-sm font-bold text-white mb-1 truncate">{order.customerName}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                      <span>{order.itemsCount} Items</span>
                                      <span>{order.date}</span>
                                  </div>
                                  
                                  {/* Hover Actions */}
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                          onClick={(e) => handleDeleteOrder(order.id, e)}
                                          className="p-1.5 bg-black/60 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                                          title="删除"
                                      >
                                          <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </div>
                                  
                                  {/* Quick Actions Footer */}
                                  <div className="mt-3 pt-2 border-t border-white/5 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                      {status === 'pending' && (
                                          <button onClick={(e) => handleUpdateStatus(order.id, 'processing', e)} className="flex-1 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-[10px] transition-colors">处理</button>
                                      )}
                                      {status === 'processing' && (
                                          <button onClick={(e) => handleUpdateStatus(order.id, 'shipped', e)} className="flex-1 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded text-[10px] transition-colors">发货</button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const renderList = () => (
      <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden flex-1">
          <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-slate-400 font-medium border-b border-white/5">
                  <tr>
                      <th className="p-4">订单号</th>
                      <th className="p-4">客户</th>
                      <th className="p-4">日期</th>
                      <th className="p-4">状态</th>
                      <th className="p-4 text-right">金额</th>
                      <th className="p-4 text-center">操作</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                  {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/5 cursor-pointer group" onClick={() => setSelectedOrder(order)}>
                          <td className="p-4 font-mono text-slate-300">{order.id}</td>
                          <td className="p-4 text-white font-bold">{order.customerName}</td>
                          <td className="p-4 text-slate-500">{order.date}</td>
                          <td className="p-4"><span className={`px-2 py-1 rounded text-xs border ${getStatusColor(order.status)}`}>{order.status}</span></td>
                          <td className="p-4 text-right font-mono text-white">¥{order.total.toLocaleString()}</td>
                          <td className="p-4 text-center">
                              <button 
                                  onClick={(e) => handleDeleteOrder(order.id, e)}
                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
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
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/10 shadow-sm backdrop-blur-md">
          <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-indigo-500" />
                  订单履约 (Order Fulfillment)
              </h2>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>总订单: <span className="text-white font-bold">{stats.total}</span></span>
                  <span className="w-px h-3 bg-white/10"></span>
                  <span>待处理: <span className="text-amber-400 font-bold">{stats.pending}</span></span>
                  <span className="w-px h-3 bg-white/10"></span>
                  <span>总营收: <span className="text-emerald-400 font-bold">¥{stats.revenue.toLocaleString()}</span></span>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
              <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input 
                      type="text" 
                      placeholder="搜索订单..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 w-48"
                  />
              </div>
              <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                  <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid className="w-4 h-4"/></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><List className="w-4 h-4"/></button>
              </div>
              <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                  <Plus className="w-4 h-4" /> 录入订单
              </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === 'kanban' ? renderKanban() : renderList()}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setSelectedOrder(null)}>
              <div className="ios-glass-panel w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              订单详情 #{selectedOrder.id}
                              <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                          </h3>
                          <div className="text-xs text-slate-500 mt-1 flex gap-2">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {selectedOrder.date}</span>
                              <span>•</span>
                              <span className="text-white">{selectedOrder.customerName}</span>
                          </div>
                      </div>
                      
                      {/* Modal Actions */}
                      <div className="flex gap-2">
                          <button 
                              onClick={() => handleDeleteOrder(selectedOrder.id)} 
                              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded text-xs flex items-center gap-2 transition-all"
                          >
                              <Trash2 className="w-3.5 h-3.5" /> 删除订单
                          </button>
                          <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                  </div>

                  <div className="p-6 grid grid-cols-3 gap-6 bg-black/20">
                      <div className="col-span-2 space-y-6">
                          <div className="space-y-3">
                              <h4 className="text-xs font-bold text-slate-500 uppercase">订单商品 (Line Items)</h4>
                              {selectedOrder.lineItems?.length ? (
                                  selectedOrder.lineItems.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400"><Package className="w-4 h-4"/></div>
                                              <div>
                                                  <div className="text-sm font-bold text-white">{item.sku}</div>
                                                  <div className="text-[10px] text-slate-500">ID: {item.productId}</div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-sm text-white">x{item.quantity}</div>
                                              <div className="text-xs text-slate-400">¥{item.price}</div>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="p-4 text-center text-slate-500 text-xs italic bg-white/5 rounded-lg">无商品明细数据</div>
                              )}
                          </div>
                      </div>

                      <div className="col-span-1 space-y-6 border-l border-white/10 pl-6">
                          <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">支付信息</h4>
                              <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                      <span className="text-slate-400">商品总额</span>
                                      <span className="text-white">¥{selectedOrder.total}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                      <span className="text-slate-400">运费</span>
                                      <span className="text-white">¥0.00</span>
                                  </div>
                                  <div className="h-px bg-white/10 my-2"></div>
                                  <div className="flex justify-between text-base font-bold">
                                      <span className="text-white">实付金额</span>
                                      <span className="text-emerald-400">¥{selectedOrder.total}</span>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">物流信息</h4>
                              {selectedOrder.trackingNumber ? (
                                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                      <div className="text-xs text-blue-300 font-bold mb-1">{selectedOrder.shippingMethod}</div>
                                      <div className="text-sm text-white font-mono flex items-center gap-2">
                                          {selectedOrder.trackingNumber}
                                          <ExternalLink className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-xs text-slate-500 italic">暂无物流单号</div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
              <div className="ios-glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4">录入新订单</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-400 mb-1 block">客户名称</label>
                          <input type="text" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-slate-400 mb-1 block">订单金额 (¥)</label>
                              <input type="number" value={newOrder.total} onChange={e => setNewOrder({...newOrder, total: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 mb-1 block">商品数量</label>
                              <input type="number" value={newOrder.itemsCount} onChange={e => setNewOrder({...newOrder, itemsCount: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 mb-1 block">订单日期</label>
                          <input type="date" value={newOrder.date} onChange={e => setNewOrder({...newOrder, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                      </div>
                      <button onClick={handleSaveNewOrder} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold mt-2 shadow-lg">确认录入</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;
