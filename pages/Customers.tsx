
import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, Filter, Mail, Phone, Building, Star, Wallet, Calendar, X, Save, Trash2, CheckCircle2, FileText, ShoppingCart, ArrowRight } from 'lucide-react';
import { Customer } from '../types';
import { useTanxing } from '../context/TanxingContext';

const Customers: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const customers = state.customers || []; 
  const orders = state.orders || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  
  const [showFilter, setShowFilter] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('All');

  const filteredCustomers = useMemo(() => {
      return (customers || []).filter(c => {
        const matchesSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (c.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterSource === 'All' || c.source === filterSource;
        return matchesSearch && matchesFilter;
      });
  }, [customers, searchTerm, filterSource]);

  const customerOrders = useMemo(() => {
      if (!selectedCustomer) return [];
      return (orders || []).filter(o => 
          (o.customerName || '').toLowerCase().includes((selectedCustomer.name || '').toLowerCase()) || 
          (selectedCustomer.company && (o.customerName || '').toLowerCase().includes(selectedCustomer.company.toLowerCase()))
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCustomer, orders]);

  const handleAddCustomer = () => {
      const newCustomer: Customer = {
          id: `C-${Date.now()}`,
          name: '', company: '', email: '', phone: '', level: 'Standard', source: 'Offline',
          totalSpend: 0, ordersCount: 0, status: 'Active', lastOrderDate: new Date().toISOString().split('T')[0],
          notes: '', avatarColor: 'bg-slate-500'
      };
      setSelectedCustomer(newCustomer);
      setActiveTab('profile');
  };

  const handleEditClick = (customer: Customer) => {
      setSelectedCustomer({ ...customer });
      setActiveTab('profile');
  };

  const handleSave = () => {
      if (!selectedCustomer) return;
      if (!selectedCustomer.name) return showToast("请输入客户名称", "warning");
      if (customers.some(c => c.id === selectedCustomer.id)) {
          dispatch({ type: 'UPDATE_CUSTOMER', payload: selectedCustomer });
          showToast('客户信息已更新', 'success');
      } else {
          dispatch({ type: 'ADD_CUSTOMER', payload: selectedCustomer });
          showToast('新客户已创建', 'success');
      }
      setSelectedCustomer(null);
  };

  const updateField = (field: keyof Customer, value: any) => {
      if (!selectedCustomer) return;
      setSelectedCustomer({ ...selectedCustomer, [field]: value });
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
        <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> 客户管理 (CRM)
            </h2>
            <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded border border-white/10">{customers.length}</span>
        </div>
        
        <div className="flex space-x-3 w-full sm:w-auto">
            <div className="relative">
                <input type="text" placeholder="搜索客户..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-300 outline-none focus:border-indigo-500 transition-all" />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
            <button onClick={handleAddCustomer} className="flex items-center justify-center space-x-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg text-sm font-medium">
                <Plus className="w-3.5 h-3.5" /> <span>新增客户</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 sticky top-0 backdrop-blur-sm z-10 text-xs font-semibold text-slate-500 uppercase">
                <tr><th className="px-6 py-3">客户信息</th><th className="px-6 py-3">来源 & 等级</th><th className="px-6 py-3">联系方式</th><th className="px-6 py-3">消费统计</th><th className="px-6 py-3">状态</th><th className="px-6 py-3 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleEditClick(customer)}>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${customer.avatarColor || 'bg-slate-700'}`}>{customer.name?.charAt(0).toUpperCase()}</div>
                                <div><div className="text-sm font-bold text-white">{customer.name}</div><div className="text-xs text-slate-500 italic">{customer.company || 'Personal'}</div></div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-xs text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded mr-2">{customer.source}</span>
                            <span className="text-xs font-medium text-indigo-400">{customer.level}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">{customer.email}</td>
                        <td className="px-6 py-4"><div className="text-sm font-bold text-white font-mono">${customer.totalSpend?.toLocaleString()}</div></td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-medium border ${customer.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                {customer.status === 'Active' ? '活跃' : '停用'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                             <button onClick={(e) => { e.stopPropagation(); if(confirm('删除客户？')) dispatch({type:'DELETE_CUSTOMER', payload:customer.id}); }} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
      </div>

      {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60" onClick={() => setSelectedCustomer(null)}>
              <div className="ios-glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">客户档案编辑</h3>
                      <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                          <button onClick={() => setActiveTab('profile')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>基本资料</button>
                          <button onClick={() => setActiveTab('orders')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>订单记录 ({customerOrders.length})</button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                      {activeTab === 'profile' ? (
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">客户姓名</label><input type="text" value={selectedCustomer.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-indigo-500" /></div>
                                  <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">公司/组织</label><input type="text" value={selectedCustomer.company} onChange={(e) => updateField('company', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none" /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">电子邮件</label><input type="email" value={selectedCustomer.email} onChange={(e) => updateField('email', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none" /></div>
                                  <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">联系电话</label><input type="text" value={selectedCustomer.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none" /></div>
                              </div>
                              <div className="space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">业务备注</label><textarea value={selectedCustomer.notes} onChange={(e) => updateField('notes', e.target.value)} className="w-full h-32 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none resize-none" placeholder="记录重要客户特征..." /></div>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {customerOrders.length > 0 ? customerOrders.map(o => (
                                  <div key={o.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                                      <div><div className="text-sm font-bold text-white">{o.id}</div><div className="text-[10px] text-slate-500 uppercase">{o.date}</div></div>
                                      <div className="text-right"><div className="text-sm font-bold text-white font-mono">¥{o.total.toLocaleString()}</div><div className="text-[9px] text-indigo-400 font-bold uppercase">{o.status}</div></div>
                                  </div>
                              )) : <div className="py-20 text-center text-slate-600 text-xs italic">无历史成交记录</div>}
                          </div>
                      )}
                  </div>

                  <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                      <button onClick={() => setSelectedCustomer(null)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm transition-colors">取消</button>
                      <button onClick={handleSave} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2">
                          <Save className="w-4 h-4" /> 固化档案
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Customers;
