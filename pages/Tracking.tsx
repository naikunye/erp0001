
import React, { useState, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment } from '../types';
import { 
  Truck, Search, Plus, Globe, Edit2, X, Globe2, Zap, ArrowRight, Package
} from 'lucide-react';

const Tracking: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  
  const selectedShipment = useMemo(() => 
    (state.shipments || []).find((s: Shipment) => s.id === selectedShipmentId) || null
  , [state.shipments, selectedShipmentId]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shipment>>({});

  const handleUpdateStatus = (newStatus: Shipment['status']) => {
      if (!selectedShipment) return;
      const updated = { ...selectedShipment, status: newStatus };
      dispatch({ type: 'UPDATE_SHIPMENT', payload: updated });
      showToast(`物流节点状态更新: ${newStatus}`, 'info');
  };

  const handleSaveEdit = () => {
      if (!editForm.trackingNo) return showToast('单号必填', 'warning');
      if (editForm.id) {
          dispatch({ type: 'UPDATE_SHIPMENT', payload: editForm as Shipment });
          showToast('物流协议已更新', 'success');
      } else {
          const newId = `SH-${Date.now()}`;
          dispatch({ type: 'ADD_SHIPMENT', payload: { ...editForm as any, id: newId, events: [] } });
          showToast('新物流节点已部署', 'success');
      }
      setShowEditModal(false);
  };

  const filteredShipments = (state.shipments || []).filter((s: Shipment) => 
    (s.trackingNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ios-glass-panel rounded-[2rem] border border-white/10 shadow-xl flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/40">
      <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
                <Globe2 className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-white font-bold text-xl uppercase italic tracking-tight">物理链路全球追踪</h2>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-emerald-500"/> 在途批次: {state.shipments?.filter((s:any)=>s.status!=='已送达').length || 0}
                </div>
            </div>
        </div>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索单号..." className="w-64 pl-12 pr-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all" />
            </div>
            <button onClick={() => { setEditForm({ carrier: 'UPS', status: '待处理' }); setShowEditModal(true); }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2">
                <Plus className="w-4 h-4" /> 部署物流
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex z-10">
          <div className={`${selectedShipment ? 'hidden xl:block w-[350px]' : 'w-full'} border-r border-white/5 overflow-y-auto p-4 space-y-3 bg-black/20 custom-scrollbar`}>
              {filteredShipments.map(shipment => (
                  <div key={shipment.id} onClick={() => setSelectedShipmentId(shipment.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 group ${selectedShipmentId === shipment.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/2 border-white/5 hover:border-white/20'}`}>
                      <div className="flex justify-between items-center">
                          <span className="text-[9px] px-2 py-0.5 bg-black/60 text-slate-400 rounded-lg border border-white/10 font-mono">{shipment.carrier}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${shipment.status === '已送达' ? 'text-emerald-400 border-emerald-500/30' : 'text-blue-400 border-blue-500/30'}`}>{shipment.status}</span>
                      </div>
                      <div>
                          <div className="text-sm font-bold text-white truncate uppercase italic">{shipment.productName}</div>
                          <div className="text-[10px] text-indigo-400 font-mono mt-1">{shipment.trackingNo}</div>
                      </div>
                  </div>
              ))}
          </div>

          {selectedShipment ? (
              <div className="flex-1 overflow-y-auto bg-black/40 flex flex-col animate-in fade-in relative">
                  <div className="p-8 border-b border-white/5 bg-white/2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0">
                       <div>
                           <h3 className="text-4xl font-black text-white font-mono tracking-tighter mb-4">{selectedShipment.trackingNo}</h3>
                           <div className="flex gap-2">
                               <button onClick={() => handleUpdateStatus('运输中')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${selectedShipment.status === '运输中' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}>标记运输</button>
                               <button onClick={() => handleUpdateStatus('已送达')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${selectedShipment.status === '已送达' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-500'}`}>标记签收</button>
                               <button onClick={() => handleUpdateStatus('异常')} className="px-4 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold uppercase">报告异常</button>
                           </div>
                       </div>
                       <button onClick={() => setShowEditModal(true)} className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold uppercase transition-all">编辑详情</button>
                  </div>

                  <div className="p-8">
                      <div className="ios-glass-card p-8 rounded-[2rem] border-l-4 border-l-indigo-600 flex items-center justify-between bg-white/2 shadow-xl">
                          <div className="space-y-1">
                              <div className="text-[10px] text-slate-500 font-bold uppercase">起运地</div>
                              <div className="text-xl font-bold text-white italic">{selectedShipment.origin || '待对齐'}</div>
                          </div>
                          <ArrowRight className="w-8 h-8 text-indigo-500/30" />
                          <div className="text-right space-y-1">
                              <div className="text-[10px] text-slate-500 font-bold uppercase">目的地</div>
                              <div className="text-xl font-bold text-indigo-400 italic">{selectedShipment.destination || '待对齐'}</div>
                          </div>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
                  <Package className="w-16 h-16 opacity-10 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">量子节点待命中</p>
              </div>
          )}
      </div>

      {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/60" onClick={() => setShowEditModal(false)}>
              <div className="ios-glass-panel w-full max-w-2xl rounded-[2rem] p-8 border border-white/20 flex flex-col gap-6 bg-[#08080a]" onClick={e => e.stopPropagation()}>
                  <h3 className="text-2xl font-bold text-white uppercase italic">物流协议配置</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">单号</label>
                          <input type="text" value={editForm.trackingNo || ''} onChange={e => setEditForm({...editForm, trackingNo: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-mono" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">描述</label>
                          <input type="text" value={editForm.productName || ''} onChange={e => setEditForm({...editForm, productName: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white" />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setShowEditModal(false)} className="px-6 py-3 text-slate-500 font-bold uppercase text-xs">取消</button>
                      <button onClick={handleSaveEdit} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs">保存修改</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tracking;
