
import React, { useState, useMemo } from 'react';
import { FileText, Truck, CheckCircle, XCircle, Clock, ShoppingCart, X, Package, MapPin, CreditCard, ArrowRight, LayoutGrid, List, MoreHorizontal, Box, GripVertical, DollarSign, Calculator, Info, Zap, Plus, Trash2, PlayCircle } from 'lucide-react';
import { Order, Product, AutomationRule } from '../types';
import { useTanxing } from '../context/TanxingContext';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const Orders: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'profit'>('details');
  
  // Automation Modal State
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState<AutomationRule[]>([
      { id: 'R1', name: 'Auto VIP Tag', active: true, trigger: 'Order Paid', conditions: [{ field: 'Total', operator: '>', value: 500 }], action: { type: 'Add Tag', value: 'VIP' }, executions: 12 },
      { id: 'R2', name: 'Flag High Risk', active: true, trigger: 'Order Created', conditions: [{ field: 'Country', operator: '==', value: 'Nigeria' }], action: { type: 'Add Tag', value: 'High Risk' }, executions: 3 }
  ]);

  // Shipping Modal State
  const [showShipModal, setShowShipModal] = useState(false);
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [shipForm, setShipForm] = useState({ carrier: 'DHL', tracking: '' });

  // Drag & Drop State
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  // Filter out deleted orders
  const activeOrders = useMemo(() => {
      return state.orders.filter(o => !o.deletedAt);
  }, [state.orders]);

  // --- Profit Calculation Logic ---
  const orderProfit = useMemo(() => {
      if (!selectedOrder) return null;
      let totalCost = 0;
      let totalFees = 0;
      let totalFreight = 0;
      
      // Calculate based on line items if available, or estimate
      if (selectedOrder.lineItems && selectedOrder.lineItems.length > 0) {
          selectedOrder.lineItems.forEach(item => {
              const product = state.products.find(p => p.id === item.productId);
              if (product) {
                  const itemCost = (product.costPrice || 0) / 7.2; 
                  const itemFees = (item.price * ((product.economics?.platformFeePercent || 0) + (product.economics?.creatorFeePercent || 0)) / 100) + (product.economics?.fixedCost || 0);
                  const itemFreight = (product.logistics?.unitFreightCost || 0) + (product.economics?.lastLegShipping || 0);
                  
                  totalCost += itemCost * item.quantity;
                  totalFees += itemFees * item.quantity;
                  totalFreight += itemFreight * item.quantity;
              }
          });
      } else {
          // Estimate if no line items (Fallback)
          totalCost = selectedOrder.total * 0.3;
          totalFees = selectedOrder.total * 0.15;
          totalFreight = 5 * selectedOrder.itemsCount;
      }

      const netProfit = selectedOrder.total - totalCost - totalFees - totalFreight;
      const margin = (netProfit / selectedOrder.total) * 100;

      // Waterfall Data Construction
      const waterfallData = [
          { name: 'Revenue', amount: selectedOrder.total, fill: '#10b981' }, // Green
          { name: 'COGS', amount: -totalCost, fill: '#ef4444' }, // Red
          { name: 'Fees', amount: -totalFees, fill: '#f59e0b' }, // Orange
          { name: 'Freight', amount: -totalFreight, fill: '#3b82f6' }, // Blue
          { name: 'Net Profit', amount: netProfit, fill: netProfit > 0 ? '#10b981' : '#ef4444', isTotal: true }
      ];

      // Prepare for Recharts (Need start/end values for waterfall bars)
      let currentStack = 0;
      const chartData = waterfallData.map((d, i) => {
          if (d.isTotal) {
              return { ...d, start: 0, end: d.amount, value: d.amount };
          }
          const prev = currentStack;
          currentStack += d.amount;
          // For negative steps, start is previous total, end is current total
          return { 
              ...d, 
              start: d.amount >= 0 ? prev : prev + d.amount, // The bottom of the bar
              end: d.amount >= 0 ? prev + d.amount : prev,   // The top of the bar
              value: d.amount // Display value
          };
      });

      return { totalCost, totalFees, totalFreight, netProfit, margin, chartData };
  }, [selectedOrder, state.products]);

  // --- Handlers ---
  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('details');
  };

  const handleCloseOrder = () => {
    setSelectedOrder(null);
  };

  const handleDeleteOrder = (orderId: string) => {
      if (confirm('确定要删除此订单吗？它将被移至回收站。')) {
          dispatch({ type: 'DELETE_ORDER', payload: orderId });
          showToast('订单已移至回收站', 'info');
          if (selectedOrder?.id === orderId) {
              setSelectedOrder(null);
          }
      }
  };

  const updateStatus = (orderId: string, newStatus: Order['status']) => {
      if (newStatus === 'shipped') {
          const order = state.orders.find(o => o.id === orderId);
          if (order) {
              setShippingOrder(order);
              setShipForm({ carrier: 'DHL', tracking: '' });
              setShowShipModal(true);
          }
          return;
      }
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status: newStatus } });
      showToast(`订单状态已更新: ${newStatus.toUpperCase()}`, 'success');
  };

  const initiateShip = (order: Order) => {
      setShippingOrder(order);
      setShipForm({ carrier: 'DHL', tracking: '' });
      setShowShipModal(true);
  };

  const confirmShip = () => {
      if (!shippingOrder || !shipForm.tracking) {
          showToast('请输入运单号', 'warning');
          return;
      }
      dispatch({ 
          type: 'SHIP_ORDER', 
          payload: { 
              orderId: shippingOrder.id, 
              shippingMethod: shipForm.carrier, 
              trackingNumber: shipForm.tracking 
          } 
      });
      showToast('订单已发货', 'success');
      setShowShipModal(false);
      setShippingOrder(null);
  };

  const onDragStart = (e: React.DragEvent, orderId: string) => {
      setDraggedOrderId(orderId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetStatus: Order['status']) => {
      e.preventDefault();
      if (draggedOrderId) {
          const order = state.orders.find(o => o.id === draggedOrderId);
          if (order && order.status !== targetStatus) {
              updateStatus(draggedOrderId, targetStatus);
          }
          setDraggedOrderId(null);
      }
  };

  const columns: { id: Order['status'], label: string, color: string, border: string }[] = [
      { id: 'pending', label: '待处理 (Pending)', color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/30' },
      { id: 'processing', label: '拣货中 (Processing)', color: 'bg-blue-500/10 text-blue-500', border: 'border-blue-500/30' },
      { id: 'shipped', label: '已发货 (Shipped)', color: 'bg-indigo-500/10 text-indigo-500', border: 'border-indigo-500/30' },
      { id: 'delivered', label: '已送达 (Delivered)', color: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/30' }
  ];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)] relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
                订单中心
            </h2>
            <p className="text-xs text-slate-500 mt-1">全球订单履约看板 (Kanban Fulfillment)</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setShowRulesModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
                <Zap className="w-3.5 h-3.5 fill-current" /> 自动化规则
            </button>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
        </div>
      </div>
      
      {/* --- KANBAN VIEW --- */}
      {viewMode === 'kanban' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
              <div className="flex gap-4 h-full min-w-[1000px]">
                  {columns.map(col => (
                      <div key={col.id} className="flex-1 flex flex-col bg-slate-950/30 rounded-xl border border-slate-800/50 min-w-[280px]" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.id)}>
                          <div className={`p-3 border-b ${col.border} bg-slate-900/50 rounded-t-xl flex justify-between items-center`}>
                              <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${col.color.replace('bg-', 'bg-').replace('/10', '')}`}></div><span className="font-bold text-sm text-slate-300">{col.label}</span></div>
                              <span className={`text-xs px-2 py-0.5 rounded ${col.color}`}>{activeOrders.filter(o => o.status === col.id).length}</span>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                              {activeOrders.filter(o => o.status === col.id).map(order => (
                                  <div key={order.id} draggable onDragStart={(e) => onDragStart(e, order.id)} onClick={() => handleOpenOrder(order)} className={`bg-slate-900 border border-slate-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:shadow-lg transition-all group relative ${draggedOrderId === order.id ? 'opacity-50 border-dashed border-slate-600' : ''}`}>
                                      <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1"><GripVertical className="w-3 h-3 text-slate-700" /> {order.id}</span><span className="text-[10px] text-slate-500">{order.date}</span></div>
                                      <div className="text-sm text-slate-200 font-bold mb-1 truncate">{order.customerName}</div>
                                      <div className="flex justify-between items-end mt-3 border-t border-slate-800/50 pt-2">
                                          <div className="text-xs text-slate-500 flex items-center gap-1"><Box className="w-3 h-3"/> {order.itemsCount} Items</div>
                                          <div className="font-bold text-emerald-400 text-sm font-mono">¥{order.total.toLocaleString()}</div>
                                      </div>
                                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                          {order.status === 'processing' && <button onClick={(e) => { e.stopPropagation(); initiateShip(order); }} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg" title="发货"><Truck className="w-3 h-3" /></button>}
                                          {order.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'processing'); }} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg" title="开始处理"><ArrowRight className="w-3 h-3" /></button>}
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="p-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded shadow-lg transition-colors" title="删除"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-950/50 border-b border-slate-800 sticky top-0 backdrop-blur-sm z-10">
                <tr><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">订单号</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">渠道 / 客户</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">日期</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">金额</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">状态</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
                {activeOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => handleOpenOrder(order)}>
                    <td className="px-6 py-4"><div className="flex items-center space-x-2"><FileText className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" /><span className="font-medium text-slate-300 font-mono text-sm">{order.id}</span></div></td>
                    <td className="px-6 py-4"><span className="text-sm text-white font-medium">{order.customerName}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{order.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-200 font-mono">¥{order.total.toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-0.5 rounded border ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : order.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : order.status === 'shipped' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{order.status.toUpperCase()}</span></td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenOrder(order); }} className="text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-indigo-600 px-3 py-1.5 rounded transition-all">查看</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}

      {/* Rules Engine Modal */}
      {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70" onClick={() => setShowRulesModal(false)}>
              <div className="bg-slate-900 w-full max-w-2xl h-[70vh] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500" /> 自动化规则引擎 (Automation Rules)</h3>
                      <button onClick={() => setShowRulesModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                      <div className="space-y-4">
                          {rules.map(rule => (
                              <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                          <h4 className="font-bold text-white text-sm">{rule.name}</h4>
                                      </div>
                                      <div className="text-xs text-slate-400 flex items-center gap-2">
                                          <span className="bg-slate-800 px-1.5 rounded border border-slate-700">IF {rule.trigger}</span>
                                          <span>AND {rule.conditions[0].field} {rule.conditions[0].operator} {rule.conditions[0].value}</span>
                                          <ArrowRight className="w-3 h-3" />
                                          <span className="text-indigo-400">{rule.action.type}: {rule.action.value}</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right">
                                          <div className="text-xl font-bold text-slate-300 font-mono">{rule.executions}</div>
                                          <div className="text-[10px] text-slate-500">Executions</div>
                                      </div>
                                      <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded"><PlayCircle className="w-5 h-5" /></button>
                                  </div>
                              </div>
                          ))}
                          <button className="w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 text-sm font-bold hover:border-indigo-500/50 hover:text-indigo-400 transition-all flex items-center justify-center gap-2">
                              <Plus className="w-4 h-4" /> 添加新规则
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && !showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/60" onClick={handleCloseOrder}>
             <div className="bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" /> 订单详情</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedOrder.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'details' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>基础信息</button>
                        <button onClick={() => setActiveTab('profit')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'profit' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'text-slate-500 hover:text-white'}`}><Calculator className="w-3 h-3" /> 利润透视 (New)</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleDeleteOrder(selectedOrder.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        <button onClick={handleCloseOrder} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto bg-slate-950">
                    {/* DETAIL TAB */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                 <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${selectedOrder.status === 'delivered' ? 'bg-emerald-500' : selectedOrder.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}></div>
                                     <span className="text-sm font-medium text-white capitalize">{selectedOrder.status}</span>
                                 </div>
                                 {selectedOrder.trackingNumber && <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded"><Truck className="w-3 h-3"/> {selectedOrder.shippingMethod}: {selectedOrder.trackingNumber}</div>}
                            </div>
                            {/* ... Address and Payment Info (Simplified for brevity) ... */}
                            {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">订单商品</h4>
                                    <div className="space-y-2">
                                        {selectedOrder.lineItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 border-b border-slate-800/50">
                                                <div className="text-sm text-slate-300">{item.sku}</div>
                                                <div className="text-xs text-slate-500">x{item.quantity}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFIT TAB - WATERFALL */}
                    {activeTab === 'profit' && orderProfit && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">预估净利润 (Net Profit)</div>
                                    <div className={`text-3xl font-mono font-bold ${orderProfit.netProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${orderProfit.netProfit.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">利润率 (Margin)</div>
                                    <div className={`text-xl font-bold ${orderProfit.margin > 15 ? 'text-blue-400' : orderProfit.margin > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                                        {orderProfit.margin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-64 relative">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> 利润瀑布流 (Profit Waterfall)
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orderProfit.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                        <YAxis hide />
                                        <RechartsTooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs text-white">
                                                            <p className="font-bold">{data.name}</p>
                                                            <p>{data.value.toFixed(2)}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <ReferenceLine y={0} stroke="#475569" />
                                        <Bar dataKey="value" stackId="a" fill="transparent" /> 
                                        {/* This creates the floating effect by using the 'start' value as the bottom of the bar if we were using a range bar, 
                                            but since Recharts simple bar doesn't support floating easily without a custom shape, 
                                            we simulate it by stacking a transparent bar or just simplifying to simple negative bars. 
                                            Actually, for a robust waterfall in simple Recharts: 
                                            Use a stacked bar where bottom stack is transparent 'start' value. */}
                                        <Bar dataKey="start" stackId="b" fill="transparent" />
                                        <Bar dataKey="amount" stackId="b">
                                            {orderProfit.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex gap-2">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                数据基于 SKU 档案中的经济模型参数自动计算，实际数值可能受汇率和实际物流重计费影响。
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>
      )}

      {/* Shipping Modal (Keep existing logic) */}
      {showShipModal && shippingOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/70" onClick={() => setShowShipModal(false)}>
              {/* ... Same as before ... */}
              <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-500" /> 确认发货</h3>
                  <div className="space-y-4">
                      <div className="space-y-1"><label className="text-xs text-slate-400">物流承运商</label><select value={shipForm.carrier} onChange={e => setShipForm({...shipForm, carrier: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"><option value="DHL">DHL Express</option><option value="FedEx">FedEx</option><option value="UPS">UPS</option><option value="USPS">USPS</option><option value="Other">其他</option></select></div>
                      <div className="space-y-1"><label className="text-xs text-slate-400">运单号 *</label><input type="text" value={shipForm.tracking} onChange={e => setShipForm({...shipForm, tracking: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none font-mono uppercase" placeholder="e.g. 1Z999..." /></div>
                  </div>
                  <div className="flex gap-3 mt-6"><button onClick={() => setShowShipModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">取消</button><button onClick={confirmShip} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg">确认发货</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;
