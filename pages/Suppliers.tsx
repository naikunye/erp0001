
import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Supplier } from '../types';
import { Factory, Search, Plus, Filter, Mail, Phone, MapPin, Star, MoreHorizontal, Save, X, Trash2, Clock } from 'lucide-react';

const Suppliers: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = state.suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (supplier: Supplier) => {
      setSelectedSupplier({ ...supplier });
  };

  const handleAddNew = () => {
      setSelectedSupplier({
          id: `SUP-${Date.now()}`,
          name: '',
          contactName: '',
          email: '',
          phone: '',
          address: '',
          category: 'General',
          rating: 3,
          paymentTerms: 'Net 30',
          status: 'Active',
          leadTime: 15
      });
  };

  const handleSave = () => {
      if (!selectedSupplier) return;
      if (!selectedSupplier.name) {
          showToast('请输入供应商名称', 'warning');
          return;
      }

      if (state.suppliers.find(s => s.id === selectedSupplier.id)) {
          dispatch({ type: 'UPDATE_SUPPLIER', payload: selectedSupplier });
          showToast('供应商信息已更新', 'success');
      } else {
          dispatch({ type: 'ADD_SUPPLIER', payload: selectedSupplier });
          showToast('新供应商已添加', 'success');
      }
      setSelectedSupplier(null);
  };

  const handleDelete = () => {
      if (!selectedSupplier) return;
      if (confirm(`确定要删除供应商 ${selectedSupplier.name} 吗?`)) {
          dispatch({ type: 'DELETE_SUPPLIER', payload: selectedSupplier.id });
          showToast('供应商已删除', 'info');
          setSelectedSupplier(null);
      }
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
        <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Factory className="w-5 h-5 text-indigo-500" />
                供应商管理 (SRM)
            </h2>
            <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded border border-white/10">{state.suppliers.length}</span>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索供应商..."
                    className="w-full sm:w-64 pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
            <button 
                onClick={handleAddNew}
                className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg text-sm font-medium"
            >
                <Plus className="w-3.5 h-3.5" />
                <span>新增</span>
            </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => (
              <div 
                  key={supplier.id}
                  onClick={() => handleEdit(supplier)}
                  className="ios-glass-card p-5 cursor-pointer hover:border-indigo-500/50 transition-all group relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-slate-500" />
                  </div>
                  
                  <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center text-lg font-bold text-slate-400 border border-white/10">
                          {supplier.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <h3 className="font-bold text-white text-sm truncate w-40">{supplier.name}</h3>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <span className="bg-black/40 px-1.5 rounded">{supplier.category}</span>
                              <span className="flex items-center text-amber-500 gap-0.5"><Star className="w-3 h-3 fill-current"/> {supplier.rating}</span>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>交货周期: {supplier.leadTime} 天</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-600" />
                          <span className="truncate">{supplier.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>{supplier.contactName} ({supplier.phone})</span>
                      </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${supplier.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                          {supplier.status}
                      </span>
                      <span className="text-[10px] text-slate-600">{supplier.paymentTerms}</span>
                  </div>
              </div>
          ))}
      </div>

      {/* Edit Modal */}
      {selectedSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setSelectedSupplier(null)}>
              <div className="ios-glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Factory className="w-5 h-5 text-indigo-500" />
                          {selectedSupplier.id.startsWith('SUP-') && state.suppliers.find(s => s.id === selectedSupplier.id) ? '编辑供应商' : '新增供应商'}
                      </h3>
                      <button onClick={() => setSelectedSupplier(null)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">基本信息</h4>
                          <div className="space-y-2">
                              <label className="text-xs text-slate-400">供应商名称</label>
                              <input type="text" value={selectedSupplier.name} onChange={e => setSelectedSupplier({...selectedSupplier, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs text-slate-400">主营类目</label>
                              <input type="text" value={selectedSupplier.category} onChange={e => setSelectedSupplier({...selectedSupplier, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                  <label className="text-xs text-slate-400">评分 (1-5)</label>
                                  <input type="number" step="0.1" max="5" value={selectedSupplier.rating} onChange={e => setSelectedSupplier({...selectedSupplier, rating: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-xs text-slate-400">状态</label>
                                  <select value={selectedSupplier.status} onChange={e => setSelectedSupplier({...selectedSupplier, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white">
                                      <option value="Active">Active</option>
                                      <option value="Inactive">Inactive</option>
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">联系与合作</h4>
                          <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                  <label className="text-xs text-slate-400">联系人</label>
                                  <input type="text" value={selectedSupplier.contactName} onChange={e => setSelectedSupplier({...selectedSupplier, contactName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-xs text-slate-400">电话</label>
                                  <input type="text" value={selectedSupplier.phone} onChange={e => setSelectedSupplier({...selectedSupplier, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs text-slate-400">地址</label>
                              <input type="text" value={selectedSupplier.address} onChange={e => setSelectedSupplier({...selectedSupplier, address: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                  <label className="text-xs text-slate-400">付款条款</label>
                                  <input type="text" value={selectedSupplier.paymentTerms} onChange={e => setSelectedSupplier({...selectedSupplier, paymentTerms: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-xs text-slate-400">交货周期 (天)</label>
                                  <input type="number" value={selectedSupplier.leadTime} onChange={e => setSelectedSupplier({...selectedSupplier, leadTime: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                      <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> 删除
                      </button>
                      <div className="flex gap-3">
                          <button onClick={() => setSelectedSupplier(null)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm">取消</button>
                          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
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

export default Suppliers;
