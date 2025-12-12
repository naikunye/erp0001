
import React, { useState } from 'react';
import { Users, Search, Plus, Filter, MoreHorizontal, Mail, Phone, Building, Star, Wallet, Calendar, X, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../constants';
import { Customer } from '../types';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('All');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSource === 'All' || c.source === filterSource;
    return matchesSearch && matchesFilter;
  });

  const handleAddCustomer = () => {
      const newCustomer: Customer = {
          id: `C-${Date.now()}`,
          name: '',
          company: '',
          email: '',
          phone: '',
          level: 'Standard',
          source: 'Offline',
          totalSpend: 0,
          ordersCount: 0,
          status: 'Active',
          lastOrderDate: new Date().toISOString().split('T')[0],
          notes: '',
          avatarColor: 'bg-slate-500'
      };
      setSelectedCustomer(newCustomer);
  };

  const handleEditClick = (customer: Customer) => {
      setSelectedCustomer({ ...customer });
  };

  const closeModal = () => {
      setSelectedCustomer(null);
  };

  const handleSave = () => {
      if (!selectedCustomer) return;
      
      if (!selectedCustomer.name) {
          alert("请输入客户名称");
          return;
      }

      setCustomers(prev => {
          const exists = prev.find(c => c.id === selectedCustomer.id);
          if (exists) {
              return prev.map(c => c.id === selectedCustomer.id ? selectedCustomer : c);
          } else {
              return [selectedCustomer, ...prev];
          }
      });
      closeModal();
  };

  const handleDelete = () => {
      if (!selectedCustomer) return;
      if (confirm("确定要删除此客户吗？相关历史订单数据可能会受到影响。")) {
          setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
          closeModal();
      }
  };

  const handleDeleteById = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm("确定要删除此客户吗？")) {
          setCustomers(prev => prev.filter(c => c.id !== id));
      }
  };

  const updateField = (field: keyof Customer, value: any) => {
      if (!selectedCustomer) return;
      setSelectedCustomer({ ...selectedCustomer, [field]: value });
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
        <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                客户管理 (CRM)
            </h2>
            <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded border border-white/10">{customers.length}</span>
        </div>
        
        <div className="flex space-x-3 w-full sm:w-auto">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="搜索客户 / 公司 / 邮箱..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
            
            <div className="relative">
                <button 
                    onClick={() => setShowFilter(!showFilter)}
                    className={`flex items-center justify-center space-x-2 px-3 py-1.5 border rounded-lg transition-colors text-sm ${filterSource !== 'All' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <Filter className="w-3.5 h-3.5" />
                    {filterSource !== 'All' && <span>{filterSource}</span>}
                </button>
                {/* Filter Dropdown */}
                {showFilter && (
                    <div className="absolute top-full right-0 mt-2 w-40 ios-glass-panel rounded-lg shadow-xl z-20 animate-in fade-in zoom-in-95 overflow-hidden">
                        <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2 bg-white/5 border-b border-white/10">来源筛选</div>
                        {['All', 'Offline', 'TikTok', 'Amazon', 'Shopify'].map(source => (
                            <button
                                key={source}
                                onClick={() => { setFilterSource(source); setShowFilter(false); }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center justify-between ${filterSource === source ? 'text-indigo-400 bg-white/5' : 'text-slate-300'}`}
                            >
                                {source === 'All' ? '全部 (All)' : source}
                                {filterSource === source && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={handleAddCustomer}
                className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50 text-sm font-medium active:scale-95"
            >
                <Plus className="w-3.5 h-3.5" />
                <span>新增客户</span>
            </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-auto divide-y divide-white/5">
          <table className="w-full text-left">
            <thead className="bg-white/5 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">客户信息</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">来源 & 等级</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">联系方式</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">消费统计</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleEditClick(customer)}>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${customer.avatarColor || 'bg-slate-700'}`}>
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{customer.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Building className="w-3 h-3" />
                                        {customer.company || 'Personal'}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded w-fit">{customer.source}</span>
                                <div className="flex items-center gap-1">
                                    {customer.level === 'VIP' && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    {customer.level === 'Partner' && <Star className="w-3 h-3 text-indigo-400 fill-indigo-400" />}
                                    <span className={`text-xs font-medium ${
                                        customer.level === 'VIP' ? 'text-amber-500' : 
                                        customer.level === 'Partner' ? 'text-indigo-400' : 'text-slate-500'
                                    }`}>{customer.level}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-xs text-slate-400 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-slate-600" />
                                    {customer.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-slate-600" />
                                    {customer.phone}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm font-bold text-white font-mono">
                                ${customer.totalSpend.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                {customer.ordersCount} 笔订单
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {customer.status === 'Active' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> 活跃
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                                    <X className="w-3 h-3 mr-1" /> 停用
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                    onClick={(e) => handleDeleteById(e, customer.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                 >
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Users className="w-12 h-12 mb-3 opacity-20" />
                  <p>未找到客户信息</p>
              </div>
          )}
      </div>

      {/* Edit/Add Modal */}
      {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={closeModal}>
              <div className="ios-glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-500" />
                          {selectedCustomer.id.startsWith('C-') ? '编辑客户档案' : '新建客户'}
                      </h3>
                      <button onClick={closeModal}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                      {/* Basic Info */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">基础信息</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-xs text-slate-400">客户姓名 *</label>
                                  <input 
                                      type="text" 
                                      value={selectedCustomer.name} 
                                      onChange={(e) => updateField('name', e.target.value)}
                                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="Full Name"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs text-slate-400">公司名称</label>
                                  <input 
                                      type="text" 
                                      value={selectedCustomer.company} 
                                      onChange={(e) => updateField('company', e.target.value)}
                                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="Company Name"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs text-slate-400">邮箱</label>
                                  <input 
                                      type="email" 
                                      value={selectedCustomer.email} 
                                      onChange={(e) => updateField('email', e.target.value)}
                                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="name@example.com"
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs text-slate-400">电话</label>
                                  <input 
                                      type="text" 
                                      value={selectedCustomer.phone} 
                                      onChange={(e) => updateField('phone', e.target.value)}
                                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="+1 ..."
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Business Info */}
                      <div className="space-y-4 pt-2 border-t border-white/10">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">业务属性</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-xs text-slate-400">客户来源</label>
                                  <select 
                                      value={selectedCustomer.source}
                                      onChange={(e) => updateField('source', e.target.value)}
                                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                  >
                                      <option value="Offline">Offline / Wholesale</option>
                                      <option value="TikTok">TikTok Shop</option>
                                      <option value="Amazon">Amazon FBA</option>
                                      <option value="Shopify">Shopify Store</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs text-slate-400">客户等级</label>
                                  <select 
                                      value={selectedCustomer.level}
                                      onChange={(e) => updateField('level', e.target.value)}
                                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                  >
                                      <option value="Standard">Standard</option>
                                      <option value="Partner">Partner (达人)</option>
                                      <option value="VIP">VIP (大客户)</option>
                                      <option value="Blocked">Blocked (黑名单)</option>
                                  </select>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs text-slate-400">账号状态</label>
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => updateField('status', 'Active')}
                                          className={`flex-1 py-2 text-xs rounded-lg border ${selectedCustomer.status === 'Active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/60 border-white/10 text-slate-500'}`}
                                      >
                                          活跃 (Active)
                                      </button>
                                      <button 
                                          onClick={() => updateField('status', 'Inactive')}
                                          className={`flex-1 py-2 text-xs rounded-lg border ${selectedCustomer.status === 'Inactive' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-black/60 border-white/10 text-slate-500'}`}
                                      >
                                          停用 (Inactive)
                                      </button>
                                  </div>
                              </div>
                               <div className="space-y-1">
                                  <label className="text-xs text-slate-400">上次下单时间</label>
                                  <input 
                                      type="date" 
                                      value={selectedCustomer.lastOrderDate} 
                                      onChange={(e) => updateField('lastOrderDate', e.target.value)}
                                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                  />
                              </div>
                          </div>
                      </div>
                      
                      {/* Notes */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                           <label className="text-xs text-slate-400">备注信息 (Internal Notes)</label>
                           <textarea 
                              value={selectedCustomer.notes}
                              onChange={(e) => updateField('notes', e.target.value)}
                              className="w-full h-24 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                              placeholder="关于该客户的重要备注..."
                           />
                      </div>
                  </div>

                  <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                      <button 
                          onClick={handleDelete}
                          className="px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2"
                      >
                          <Trash2 className="w-4 h-4" /> 删除
                      </button>
                      <div className="flex gap-3">
                          <button onClick={closeModal} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm transition-colors">取消</button>
                          <button 
                              onClick={handleSave} 
                              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2"
                          >
                              <Save className="w-4 h-4" /> 保存
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Customers;
