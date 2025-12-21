
import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, Filter, Mail, Phone, Building, Star, Wallet, Calendar, X, Save, Trash2, CheckCircle2, FileText, ShoppingCart, BrainCircuit, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Customer } from '../types';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const Customers: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const customers = state.customers || []; 
  const orders = state.orders || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'ai'>('profile');
  
  const [showFilter, setShowFilter] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('All');

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      setActiveTab('profile');
      setAiAnalysis(null);
  };

  const handleEditClick = (customer: Customer) => {
      setSelectedCustomer({ ...customer });
      setActiveTab('profile');
      setAiAnalysis(null);
  };

  const closeModal = () => {
      setSelectedCustomer(null);
  };

  const handleSave = () => {
      if (!selectedCustomer) return;
      
      if (!selectedCustomer.name) {
          showToast("请输入客户名称", "warning");
          return;
      }

      if (customers.some(c => c.id === selectedCustomer.id)) {
          dispatch({ type: 'UPDATE_CUSTOMER', payload: selectedCustomer });
          showToast('客户信息已更新', 'success');
      } else {
          dispatch({ type: 'ADD_CUSTOMER', payload: selectedCustomer });
          showToast('新客户已创建', 'success');
      }
      closeModal();
  };

  const handleDelete = () => {
      if (!selectedCustomer) return;
      if (confirm("确定要删除此客户吗？相关历史订单数据可能会受到影响。")) {
          dispatch({ type: 'DELETE_CUSTOMER', payload: selectedCustomer.id });
          showToast('客户已删除', 'info');
          closeModal();
      }
  };

  const handleDeleteById = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm("确定要删除此客户吗？")) {
          dispatch({ type: 'DELETE_CUSTOMER', payload: id });
          showToast('客户已删除', 'info');
      }
  };

  const updateField = (field: keyof Customer, value: any) => {
      if (!selectedCustomer) return;
      setSelectedCustomer({ ...selectedCustomer, [field]: value });
  };

  const handleAiAnalyze = async () => {
      if (!selectedCustomer) return;
      setIsAnalyzing(true);
      setAiAnalysis(null);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const orderHistorySummary = customerOrders.slice(0, 5).map(o => 
              `Order ${o.id}: $${o.total} (${o.date}) - Items: ${o.itemsCount}`
          ).join('\n');

          const prompt = `
            Act as a CRM Customer Success Manager. Analyze this customer profile:
            Name: ${selectedCustomer.name} (${selectedCustomer.company})
            Level: ${selectedCustomer.level}
            Total Spend: $${selectedCustomer.totalSpend}
            Orders Count: ${selectedCustomer.ordersCount}
            Source: ${selectedCustomer.source}
            Recent Orders:
            ${orderHistorySummary}

            Task:
            1. Determine Customer Lifetime Value (LTV) potential (Low/Medium/High).
            2. Assess Churn Risk (Low/Medium/High) based on activity.
            3. Suggest 2 personalized marketing or upsell strategies.
            
            Output as HTML with <b> tags for emphasis. Keep it concise.
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
          });

          setAiAnalysis(response.text);
      } catch (e) {
          setAiAnalysis("AI 服务暂时不可用。");
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative">
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
                                    {customer.name?.charAt(0).toUpperCase()}
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
                                ${customer.totalSpend?.toLocaleString()}
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

      {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={closeModal}>
              <div className="ios-glass-panel w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-500" />
                          {selectedCustomer.id?.startsWith('C-') && customers.some(c => c.id === selectedCustomer.id) ? '客户档案' : '新建客户'}
                      </h3>
                      <div className="flex items-center gap-2">
                          {selectedCustomer.id && customers.some(c => c.id === selectedCustomer.id) && (
                              <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 mr-4">
                                  <button onClick={() => setActiveTab('profile')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>档案 (Profile)</button>
                                  <button onClick={() => setActiveTab('orders')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>订单 ({customerOrders.length})</button>
                                  <button onClick={() => setActiveTab('ai')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'ai' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}><Sparkles className="w-3 h-3"/> AI 洞察</button>
                              </div>
                          )}
                          <button onClick={closeModal}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                      {activeTab === 'profile' && (
                          <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">基础信息</h4>
                                      <div className="space-y-1">
                                          <label className="text-xs text-slate-400">客户姓名 *</label>
                                          <input type="text" value={selectedCustomer.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-xs text-slate-400">公司名称</label>
                                          <input type="text" value={selectedCustomer.company} onChange={(e) => updateField('company', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-xs text-slate-400">邮箱</label>
                                          <input type="email" value={selectedCustomer.email} onChange={(e) => updateField('email', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-xs text-slate-400">电话</label>
                                          <input type="text" value={selectedCustomer.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500" />
                                      </div>
                                  </div>

                                  <div className="space-y-4">
                                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">业务属性</h4>
                                      <div className="space-y-1">
                                          <label className="text-xs text-slate-400">客户来源</label>
                                          <select value={selectedCustomer.source} onChange={(e) => updateField('source', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
                                              <option value="Offline">Offline / Wholesale</option>
                                              <option value="TikTok">TikTok Shop</option>
                                              <option value="Amazon">Amazon FBA</option>
                                              <option value="Shopify">Shopify Store</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-xs text-slate-400">客户等级</label>
                                          <select value={selectedCustomer.level} onChange={(e) => updateField('level', e.target.value)} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
                                              <option value="Standard">Standard</option>
                                              <option value="Partner">Partner (达人)</option>
                                              <option value="VIP">VIP (大客户)</option>
                                              <option value="Blocked">Blocked (黑名单)</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-xs text-slate-400">账号状态</label>
                                          <div className="flex gap-2">
                                              <button onClick={() => updateField('status', 'Active')} className={`flex-1 py-2 text-xs rounded-lg border ${selectedCustomer.status === 'Active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/60 border-white/10 text-slate-500'}`}>活跃</button>
                                              <button onClick={() => updateField('status', 'Inactive')} className={`flex-1 py-2 text-xs rounded-lg border ${selectedCustomer.status === 'Inactive' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-black/60 border-white/10 text-slate-500'}`}>停用</button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="space-y-2 pt-4 border-t border-white/10">
                                   <label className="text-xs text-slate-400">备注信息 (Notes)</label>
                                   <textarea value={selectedCustomer.notes} onChange={(e) => updateField('notes', e.target.value)} className="w-full h-24 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 resize-none" placeholder="关于该客户的重要备注..." />
                              </div>
                          </div>
                      )}

                      {activeTab === 'orders' && (
                          <div className="space-y-4">
                              {customerOrders.length > 0 ? (
                                  customerOrders.map(order => (
                                      <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                          <div className="flex items-center gap-4">
                                              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><FileText className="w-5 h-5"/></div>
                                              <div>
                                                  <div className="text-sm font-bold text-white">{order.id}</div>
                                                  <div className="text-xs text-slate-500">{order.date}</div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-sm font-bold text-white font-mono">¥{order.total?.toLocaleString()}</div>
                                              <span className={`text-[10px] px-2 py-0.5 rounded border ${order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                                  {order.status}
                                              </span>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                      <ShoppingCart className="w-12 h-12 mb-2 opacity-20"/>
                                      <p>该客户暂无订单记录</p>
                                  </div>
                              )}
                          </div>
                      )}

                      {activeTab === 'ai' && (
                          <div className="space-y-6 animate-in fade-in">
                              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 opacity-10"><BrainCircuit className="w-24 h-24 text-white"/></div>
                                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 relative z-10"><Sparkles className="w-4 h-4 text-purple-400"/> AI 客户画像分析</h3>
                                  <p className="text-xs text-indigo-200 relative z-10 mb-4 max-w-lg">
                                      基于消费历史、频率和来源，智能评估客户价值 (LTV) 与流失风险。
                                  </p>
                                  <button 
                                      onClick={handleAiAnalyze} 
                                      disabled={isAnalyzing}
                                      className="px-4 py-2 bg-white text-indigo-900 rounded-lg text-xs font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-70 relative z-10"
                                  >
                                      {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <BrainCircuit className="w-3 h-3"/>}
                                      {isAnalyzing ? '分析中...' : '生成诊断报告'}
                                  </button>
                              </div>

                              {aiAnalysis && (
                                  <div className="bg-black/40 border border-purple-500/30 rounded-xl p-5 animate-in slide-in-from-bottom-2">
                                      <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed text-xs" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                      <button onClick={handleDelete} className="px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> 删除
                      </button>
                      <div className="flex gap-3">
                          <button onClick={closeModal} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm transition-colors">取消</button>
                          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2">
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
