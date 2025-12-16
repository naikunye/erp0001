
import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Truck, CheckCircle, XCircle, Clock, ShoppingCart, X, Package, MapPin, CreditCard, ArrowRight, LayoutGrid, List, MoreHorizontal, Box, GripVertical, DollarSign, Calculator, Info, Zap, Plus, Trash2, PlayCircle, Search, Edit2, Save, Filter, Loader2 } from 'lucide-react';
import { Order, Product, AutomationRule, OrderLineItem } from '../types';
import { useTanxing } from '../context/TanxingContext';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const Orders: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'profit'>('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Add/Edit Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState<Partial<Order>>({
      customerName: '',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      lineItems: []
  });
  const [isEditing, setIsEditing] = useState(false);

  // Profit Adjustments (Local override for simulation)
  const [freightAdjustment, setFreightAdjustment] = useState(0);
  const [feeAdjustment, setFeeAdjustment] = useState(0);

  // Drag & Drop State
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  // Filter out deleted orders and apply search
  const activeOrders = useMemo(() => {
      return state.orders.filter(o => {
          if (o.deletedAt) return false;
          if (filterStatus !== 'All' && o.status !== filterStatus) return false;
          const searchLower = searchQuery.toLowerCase();
          return (
              o.id.toLowerCase().includes(searchLower) ||
              o.customerName.toLowerCase().includes(searchLower) ||
              o.trackingNumber?.toLowerCase().includes(searchLower)
          );
      });
  }, [state.orders, searchQuery, filterStatus]);

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

      // Apply adjustments
      totalFreight += freightAdjustment;
      totalFees += feeAdjustment;

      const netProfit = selectedOrder.total - totalCost - totalFees - totalFreight;
      const margin = selectedOrder.total > 0 ? (netProfit / selectedOrder.total) * 100 : 0;

      // Waterfall Data Construction
      const waterfallData = [
          { name: 'Revenue', amount: selectedOrder.total, fill: '#10b981' }, // Green
          { name: 'COGS', amount: -totalCost, fill: '#ef4444' }, // Red
          { name: 'Fees', amount: -totalFees, fill: '#f59e0b' }, // Orange
          { name: 'Freight', amount: -totalFreight, fill: '#3b82f6' }, // Blue
          { name: 'Net Profit', amount: netProfit, fill: netProfit > 0 ? '#10b981' : '#ef4444', isTotal: true }
      ];

      // Prepare for Recharts
      let currentStack = 0;
      const chartData = waterfallData.map((d, i) => {
          if (d.isTotal) {
              return { ...d, start: 0, end: d.amount, value: d.amount };
          }
          const prev = currentStack;
          currentStack += d.amount;
          return { 
              ...d, 
              start: d.amount >= 0 ? prev : prev + d.amount, 
              end: d.amount >= 0 ? prev + d.amount : prev,   
              value: d.amount 
          };
      });

      return { totalCost, totalFees, totalFreight, netProfit, margin, chartData };
  }, [selectedOrder, state.products, freightAdjustment, feeAdjustment]);

  // --- Handlers ---
  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setFreightAdjustment(0);
    setFeeAdjustment(0);
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

  const handleMarkPaid = (orderId: string) => {
      dispatch({ type: 'PAY_ORDER', payload: orderId });
      showToast('订单已标记为支付，收入已记账', 'success');
      // Update local state if selected
      if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, paymentStatus: 'paid' });
      }
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
      showToast('订单已发货，库存已自动扣减', 'success');
      setShowShipModal(false);
      setShippingOrder(null);
  };

  // --- Order Form Handlers ---
  const handleOpenCreate = () => {
      setOrderForm({
          customerName: '',
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
          lineItems: [],
          total: 0
      });
      setIsEditing(false);
      setShowOrderModal(true);
  };

  const handleOpenEdit = (order: Order) => {
      setOrderForm(JSON.parse(JSON.stringify(order))); // Deep copy
      setIsEditing(true);
      setShowOrderModal(true);
  };

  const handleAddItem = (productId: string) => {
      const product = state.products.find(p => p.id === productId);
      if (!product) return;
      const newItem: OrderLineItem = {
          productId: product.id,
          sku: product.sku,
          quantity: 1,
          price: product.price
      };
      const updatedItems = [...(orderForm.lineItems || []), newItem];
      const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      setOrderForm({ ...orderForm, lineItems: updatedItems, total: newTotal, itemsCount: updatedItems.reduce((acc, i) => acc + i.quantity, 0) });
  };

  const handleRemoveItem = (index: number) => {
      const updatedItems = [...(orderForm.lineItems || [])];
      updatedItems.splice(index, 1);
      const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      setOrderForm({ ...orderForm, lineItems: updatedItems, total: newTotal, itemsCount: updatedItems.reduce((acc, i) => acc + i.quantity, 0) });
  };

  const handleSaveOrder = () => {
      if (!orderForm.customerName || !orderForm.lineItems?.length) {
          showToast('请完善订单信息（客户名及至少一个商品）', 'warning');
          return;
      }

      setIsSaving(true);
      
      // Simulate API/Processing Delay
      setTimeout(() => {
          if (isEditing && orderForm.id) {
              dispatch({ type: 'UPDATE_ORDER', payload: orderForm as Order });
              showToast('订单更新成功', 'success');
              if (selectedOrder?.id === orderForm.id) setSelectedOrder(orderForm as Order);
          } else {
              const newOrder: Order = {
                  ...orderForm as Order,
                  id: `PO-${Date.now().toString().slice(-6)}`,
                  status: orderForm.status || 'pending',
                  itemsCount: orderForm.lineItems!.reduce((acc, i) => acc + i.quantity, 0)
              };
              dispatch({ type: 'ADD_ORDER', payload: newOrder });
              showToast('订单创建成功', 'success');
          }
          setIsSaving(false);
          setShowOrderModal(false);
      }, 600);
  };

  // --- Automation Logic ---
  const handleRunRule = (ruleId: string) => {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      // Simulate Scanning
      let matchedCount = 0;
      state.orders.forEach(o => {
          // Simple condition check mock
          if (rule.conditions[0].field === 'Total' && o.total > rule.conditions[0].value) {
              // Apply Tag (Mock update)
              if (!o.automationTags?.includes(rule.action.value)) {
                  matchedCount++;
                  const updatedOrder = { ...o, automationTags: [...(o.automationTags || []), rule.action.value] };
                  dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
              }
          }
      });

      // Update Rule Stats
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, executions: r.executions + matchedCount } : r));
      showToast(`规则执行完毕: ${matchedCount} 个订单被标记为 ${rule.action.value}`, 'success');
  };

  // --- Drag & Drop ---
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
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)] relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-center bg-white/5 gap-4">
        <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
                订单中心
            </h2>
            <p className="text-xs text-slate-400 mt-1">全球订单履约看板 (Kanban Fulfillment)</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            {/* Search & Filter */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-2 flex-1 md:flex-none">
                <Search className="w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索订单/客户..."
                    className="bg-transparent border-none outline-none text-xs text-white py-1.5 w-full md:w-40"
                />
            </div>
            <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none"
            >
                <option value="All">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="shipped">已发货</option>
                <option value="delivered">已送达</option>
            </select>

            <div className="h-6 w-px bg-white/10 mx-1"></div>

            <button 
                onClick={() => setShowRulesModal(true)}
                className="px-3 py-1.5 bg-black/40 hover:bg-black/60 text-indigo-300 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
                <Zap className="w-3.5 h-3.5 fill-current" /> 规则
            </button>
            <button 
                onClick={handleOpenCreate}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
            >
                <Plus className="w-3.5 h-3.5" /> 新建
            </button>
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
        </div>
      </div>
      
      {/* ... (View Modes remain the same) ... */}
      {viewMode === 'kanban' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
              <div className="flex gap-4 h-full min-w-[1000px]">
                  {columns.map(col => (
                      <div key={col.id} className="flex-1 flex flex-col bg-white/5 rounded-xl border border-white/5 min-w-[280px]" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.id)}>
                          <div className={`p-3 border-b ${col.border} bg-white/5 rounded-t-xl flex justify-between items-center`}>
                              <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${col.color.replace('bg-', 'bg-').replace('/10', '')}`}></div><span className="font-bold text-sm text-slate-300">{col.label}</span></div>
                              <span className={`text-xs px-2 py-0.5 rounded ${col.color}`}>{activeOrders.filter(o => o.status === col.id).length}</span>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                              {activeOrders.filter(o => o.status === col.id).map(order => (
                                  <div key={order.id} draggable onDragStart={(e) => onDragStart(e, order.id)} onClick={() => handleOpenOrder(order)} className={`ios-glass-card p-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:bg-white/10 transition-all group relative ${draggedOrderId === order.id ? 'opacity-50 border-dashed border-slate-600' : ''}`}>
                                      <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1"><GripVertical className="w-3 h-3 text-slate-700" /> {order.id}</span><span className="text-[10px] text-slate-500">{order.date}</span></div>
                                      <div className="text-sm text-slate-200 font-bold mb-1 truncate">{order.customerName}</div>
                                      
                                      {/* Tags Display */}
                                      {order.automationTags && order.automationTags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mb-2">
                                              {order.automationTags.map(tag => (
                                                  <span key={tag} className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 rounded border border-purple-500/30">{tag}</span>
                                              ))}
                                          </div>
                                      )}

                                      <div className="flex justify-between items-end mt-3 border-t border-white/5 pt-2">
                                          <div className="text-xs text-slate-500 flex items-center gap-1"><Box className="w-3 h-3"/> {order.itemsCount} Items</div>
                                          <div className="font-bold text-emerald-400 text-sm font-mono">¥{order.total.toLocaleString()}</div>
                                      </div>
                                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                          <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(order); }} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded shadow-lg" title="编辑"><Edit2 className="w-3 h-3" /></button>
                                          {order.status === 'processing' && <button onClick={(e) => { e.stopPropagation(); initiateShip(order); }} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg" title="发货"><Truck className="w-3 h-3" /></button>}
                                          {order.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'processing'); }} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg" title="开始处理"><ArrowRight className="w-3 h-3" /></button>}
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
            <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-sm z-10">
                <tr><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">订单号</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">渠道 / 客户</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">标签</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">日期</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">金额</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">状态</th><th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {activeOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleOpenOrder(order)}>
                    <td className="px-6 py-4"><div className="flex items-center space-x-2"><FileText className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" /><span className="font-medium text-slate-300 font-mono text-sm">{order.id}</span></div></td>
                    <td className="px-6 py-4"><span className="text-sm text-white font-medium">{order.customerName}</span></td>
                    <td className="px-6 py-4">
                        <div className="flex gap-1">
                            {order.automationTags?.map(tag => <span key={tag} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300">{tag}</span>)}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{order.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-200 font-mono">¥{order.total.toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-0.5 rounded border ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : order.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : order.status === 'shipped' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{order.status.toUpperCase()}</span></td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(order); }} className="p-1.5 text-slate-500 hover:text-white bg-white/5 hover:bg-slate-700 rounded transition-all" title="编辑"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}

      {/* Rules Engine Modal (No changes here, keeping brevity) */}
      {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowRulesModal(false)}>
              <div className="ios-glass-panel w-full max-w-2xl h-[70vh] rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500" /> 自动化规则引擎 (Automation Rules)</h3>
                      <button onClick={() => setShowRulesModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                      <div className="space-y-4">
                          {rules.map(rule => (
                              <div key={rule.id} className="ios-glass-card p-4 flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                          <h4 className="font-bold text-white text-sm">{rule.name}</h4>
                                      </div>
                                      <div className="text-xs text-slate-400 flex items-center gap-2">
                                          <span className="bg-white/5 px-1.5 rounded border border-white/10">IF {rule.trigger}</span>
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
                                      <button 
                                        onClick={() => handleRunRule(rule.id)}
                                        className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded-lg transition-all border border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/10"
                                        title="立即运行"
                                      >
                                          <PlayCircle className="w-5 h-5" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                          <button 
                            onClick={() => {
                                const newRule: AutomationRule = { 
                                    id: `R${Date.now()}`, name: 'New Rule', active: true, 
                                    trigger: 'Order Created', conditions: [{ field: 'Items', operator: '>', value: 10 }], 
                                    action: { type: 'Add Tag', value: 'Bulk Order' }, executions: 0 
                                };
                                setRules([...rules, newRule]);
                            }}
                            className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-500 text-sm font-bold hover:border-indigo-500/50 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                          >
                              <Plus className="w-4 h-4" /> 添加新规则 (Demo)
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add/Edit Order Modal */}
      {showOrderModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowOrderModal(false)}>
              <div className="ios-glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {isEditing ? <Edit2 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                          {isEditing ? '编辑订单' : '新建订单'}
                      </h3>
                      <button onClick={() => setShowOrderModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 bg-black/20 space-y-6">
                      {/* ... (Existing form fields remain same) ... */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">客户名称 *</label>
                              <input type="text" value={orderForm.customerName} onChange={e => setOrderForm({...orderForm, customerName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">订单状态</label>
                              <select value={orderForm.status} onChange={e => setOrderForm({...orderForm, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none">
                                  <option value="pending">待处理</option>
                                  <option value="processing">处理中</option>
                                  <option value="shipped">已发货</option>
                                  <option value="delivered">已送达</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">日期</label>
                              <input type="date" value={orderForm.date} onChange={e => setOrderForm({...orderForm, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">支付状态</label>
                              <select value={orderForm.paymentStatus || 'unpaid'} onChange={e => setOrderForm({...orderForm, paymentStatus: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none">
                                  <option value="paid">已支付</option>
                                  <option value="unpaid">未支付</option>
                              </select>
                          </div>
                      </div>

                      <div className="border-t border-white/10 pt-4">
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xs font-bold text-slate-400 uppercase">商品明细</h4>
                              <div className="relative group">
                                  <button className="text-xs bg-indigo-600 px-2 py-1 rounded text-white flex items-center gap-1"><Plus className="w-3 h-3"/> 添加商品</button>
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 hidden group-hover:block max-h-40 overflow-y-auto">
                                      {state.products.map(p => (
                                          <div key={p.id} onClick={() => handleAddItem(p.id)} className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-xs text-white truncate border-b border-slate-700 last:border-0">
                                              {p.sku} - ${p.price}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                          <div className="space-y-2">
                              {orderForm.lineItems?.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/5">
                                      <div className="flex-1 text-sm text-white font-mono">{item.sku}</div>
                                      <div className="flex items-center gap-2">
                                          <input type="number" min="1" value={item.quantity} onChange={e => {
                                              const newQty = parseInt(e.target.value);
                                              const updated = [...(orderForm.lineItems || [])];
                                              updated[idx].quantity = newQty;
                                              const newTotal = updated.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                                              setOrderForm({...orderForm, lineItems: updated, total: newTotal, itemsCount: updated.reduce((acc, i) => acc + i.quantity, 0) });
                                          }} className="w-16 bg-black/40 border border-white/10 rounded p-1 text-center text-sm text-white" />
                                          <div className="w-20 text-right text-sm text-slate-300">${(item.price * item.quantity).toFixed(2)}</div>
                                          <button onClick={() => handleRemoveItem(idx)} className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded"><X className="w-4 h-4"/></button>
                                      </div>
                                  </div>
                              ))}
                              {(!orderForm.lineItems || orderForm.lineItems.length === 0) && <div className="text-center text-slate-500 text-xs py-4 border border-dashed border-white/10 rounded">暂无商品，请添加</div>}
                          </div>
                          <div className="flex justify-end mt-4 text-lg font-bold text-emerald-400">
                              总计: ${orderForm.total?.toLocaleString() || 0}
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                      <button onClick={() => setShowOrderModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors">取消</button>
                      <button 
                        onClick={handleSaveOrder} 
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                      >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                          {isSaving ? '保存中...' : '保存订单'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Order Detail Modal and Shipping Modal remain largely same, just ensuring style consistency via global CSS */}
      {selectedOrder && !showShipModal && !showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/60" onClick={handleCloseOrder}>
             <div className="ios-glass-panel w-full max-w-3xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" /> 订单详情</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedOrder.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'details' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>基础信息</button>
                        <button onClick={() => setActiveTab('profit')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'profit' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'text-slate-500 hover:text-white'}`}><Calculator className="w-3 h-3" /> 利润透视 (New)</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setShowOrderModal(false); handleOpenEdit(selectedOrder); }} className="p-2 text-slate-500 hover:text-white transition-colors" title="编辑"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={handleCloseOrder} className="p-2 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto bg-black/20">
                    {/* DETAIL TAB */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg border border-white/10">
                                 <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${selectedOrder.status === 'delivered' ? 'bg-emerald-500' : selectedOrder.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}></div>
                                     <span className="text-sm font-medium text-white capitalize">{selectedOrder.status}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     {selectedOrder.trackingNumber && <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded"><Truck className="w-3 h-3"/> {selectedOrder.shippingMethod}: {selectedOrder.trackingNumber}</div>}
                                     {selectedOrder.paymentStatus !== 'paid' && selectedOrder.status !== 'cancelled' && (
                                         <button 
                                            onClick={() => handleMarkPaid(selectedOrder.id)}
                                            className="text-xs bg-emerald-600 px-3 py-1 rounded text-white hover:bg-emerald-500 transition-colors shadow-lg"
                                         >
                                             标记已支付
                                         </button>
                                     )}
                                 </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">客户信息</h4>
                                    <div className="text-sm text-white">{selectedOrder.customerName}</div>
                                    <div className={`text-xs mt-1 font-bold ${selectedOrder.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>Payment: {selectedOrder.paymentStatus || 'unpaid'}</div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">时间与标签</h4>
                                    <div className="text-sm text-white">{selectedOrder.date}</div>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {selectedOrder.automationTags?.map(t => <span key={t} className="text-[10px] bg-slate-700 px-1.5 rounded text-slate-300">{t}</span>)}
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">订单商品</h4>
                                    <div className="space-y-2">
                                        {selectedOrder.lineItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 border-b border-white/5">
                                                <div className="text-sm text-slate-300">{item.sku}</div>
                                                <div className="text-xs text-slate-500">x{item.quantity} · ${item.price}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-right mt-2 font-bold text-white">Total: ${selectedOrder.total}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFIT TAB - WATERFALL */}
                    {activeTab === 'profit' && orderProfit && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="ios-glass-card p-5 flex items-center justify-between">
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

                            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">运费修正 (Adjustment)</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-xs">+$</span>
                                        <input type="number" value={freightAdjustment} onChange={(e) => setFreightAdjustment(parseFloat(e.target.value) || 0)} className="bg-black/40 border border-white/10 rounded w-full p-1 text-sm text-white focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">杂费修正 (Fees)</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-xs">+$</span>
                                        <input type="number" value={feeAdjustment} onChange={(e) => setFeeAdjustment(parseFloat(e.target.value) || 0)} className="bg-black/40 border border-white/10 rounded w-full p-1 text-sm text-white focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="ios-glass-card p-4 h-64 relative">
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
                                                        <div className="bg-black/90 border border-white/10 p-2 rounded text-xs text-white">
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
                                        <Bar dataKey="start" stackId="b" fill="transparent" />
                                        <Bar dataKey="amount" stackId="b">
                                            {orderProfit.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>
      )}

      {/* Shipping Modal */}
      {showShipModal && shippingOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowShipModal(false)}>
              <div className="ios-glass-panel w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-500" /> 确认发货</h3>
                  <div className="space-y-4">
                      <div className="space-y-1"><label className="text-xs text-slate-400">物流承运商</label><select value={shipForm.carrier} onChange={e => setShipForm({...shipForm, carrier: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"><option value="DHL">DHL Express</option><option value="FedEx">FedEx</option><option value="UPS">UPS</option><option value="USPS">USPS</option><option value="Other">其他</option></select></div>
                      <div className="space-y-1"><label className="text-xs text-slate-400">运单号 *</label><input type="text" value={shipForm.tracking} onChange={e => setShipForm({...shipForm, tracking: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none font-mono uppercase" placeholder="e.g. 1Z999..." /></div>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 mt-2">
                      <Info className="w-3 h-3 inline mr-1" />
                      确认发货后，系统将自动扣减对应 SKU 的库存。
                  </div>
                  <div className="flex gap-3 mt-6"><button onClick={() => setShowShipModal(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors">取消</button><button onClick={confirmShip} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg">确认发货</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;
