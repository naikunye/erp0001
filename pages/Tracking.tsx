
import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Truck, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Plus, MoreHorizontal, Globe, Edit2, Loader2, Bot, X, Trash2, Save, ExternalLink
} from 'lucide-react';

const Tracking: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shipment>>({});

  // Filter shipments
  const filteredShipments = state.shipments.filter(s => 
    s.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrackingUrl = (carrier: string, trackingNo: string) => {
      const c = carrier.toLowerCase();
      if (c.includes('ups')) {
          return `https://www.ups.com/track?loc=zh_CN&tracknum=${trackingNo}`;
      }
      if (c.includes('dhl')) {
          return `https://www.dhl.com/cn-zh/home/tracking.html?tracking-id=${trackingNo}`;
      }
      if (c.includes('fedex')) {
          return `https://www.fedex.com/fedextrack/?trknbr=${trackingNo}`;
      }
      if (c.includes('usps')) {
          return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNo}`;
      }
      return `https://www.google.com/search?q=${carrier}+tracking+${trackingNo}`;
  };

  const handleAnalyze = async () => {
    if (!selectedShipment) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const eventsStr = selectedShipment.events.map(e => `${e.date} ${e.time} - ${e.description} (${e.location})`).join('\n');
        const prompt = `
            Analyze this shipment tracking history for ${selectedShipment.carrier} tracking number ${selectedShipment.trackingNo}.
            Current Status: ${selectedShipment.status}
            Product: ${selectedShipment.productName}
            Events:
            ${eventsStr}

            Task:
            1. Summarize the current shipping status and location.
            2. Identify any potential delays or exceptions.
            3. Estimate delivery probability if not delivered.
            
            Output in HTML format with bold tags for emphasis.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        setAiAnalysis(response.text);
    } catch (e: any) {
        showToast(`AI Analysis Failed: ${e.message}`, 'error');
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- CRUD Handlers ---

  const handleAddNew = () => {
      setSelectedShipment(null); // Clear selection to indicate creation mode
      setEditForm({
          trackingNo: '',
          carrier: 'DHL',
          status: 'Pending',
          productName: '',
          notes: '',
          shipDate: new Date().toISOString().split('T')[0],
          events: []
      });
      setShowEditModal(true);
  };

  const handleEditClick = () => {
      if (!selectedShipment) return;
      setEditForm({ ...selectedShipment });
      setShowEditModal(true);
  };

  const handleSaveEdit = () => {
      if (!editForm.trackingNo) {
          showToast('请输入运单号', 'warning');
          return;
      }

      if (selectedShipment) {
          // Update existing
          const updatedShipment = { ...selectedShipment, ...editForm } as Shipment;
          dispatch({ type: 'UPDATE_SHIPMENT', payload: updatedShipment });
          setSelectedShipment(updatedShipment); 
          showToast('物流信息已更新', 'success');
      } else {
          // Create new
          const newShipment: Shipment = {
              id: `SH-${Date.now()}`,
              trackingNo: editForm.trackingNo,
              carrier: (editForm.carrier as any) || 'Other',
              status: (editForm.status as any) || 'Pending',
              productName: editForm.productName || 'Unspecified Product',
              origin: 'Unknown',
              destination: 'Unknown',
              estimatedDelivery: 'TBD',
              shipDate: editForm.shipDate,
              lastUpdate: new Date().toISOString().split('T')[0],
              events: [],
              notes: editForm.notes
          };
          dispatch({ type: 'ADD_SHIPMENT', payload: newShipment });
          showToast('新物流单已创建', 'success');
      }
      setShowEditModal(false);
  };

  const handleDelete = () => {
      if (!selectedShipment) return;
      if (confirm(`确定要删除运单 ${selectedShipment.trackingNo} 吗？`)) {
          dispatch({ type: 'DELETE_SHIPMENT', payload: selectedShipment.id });
          setSelectedShipment(null);
          showToast('物流记录已删除', 'info');
      }
  };

  const getStatusColor = (status: Shipment['status']) => {
      switch (status) {
          case 'Delivered': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          case 'In Transit': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
          case 'Exception': return 'text-red-400 bg-red-500/10 border-red-500/20';
          default: return 'text-slate-400 bg-slate-700/50 border-slate-600';
      }
  };

  return (
    <div className="ios-glass-panel rounded-xl border border-white/10 shadow-sm flex flex-col h-[calc(100vh-8rem)] relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
        <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-500" />
                物流追踪 (Tracking)
            </h2>
            <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded border border-white/10">{state.shipments.length}</span>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索运单号 / 商品..."
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

      <div className="flex-1 overflow-hidden flex">
          {/* List */}
          <div className={`${selectedShipment ? 'hidden lg:block w-1/3' : 'w-full'} border-r border-white/10 overflow-y-auto p-4 space-y-3`}>
              {filteredShipments.map(shipment => (
                  <div 
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedShipment?.id === shipment.id ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                  >
                      <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-sm font-bold text-white">{shipment.trackingNo}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(shipment.status)}`}>{shipment.status}</span>
                      </div>
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                          <span className="truncate">{shipment.productName || 'Unknown Product'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>{shipment.carrier}</span>
                          <span>{shipment.lastUpdate}</span>
                      </div>
                  </div>
              ))}
          </div>

          {/* Details */}
          {selectedShipment ? (
              <div className="flex-1 overflow-y-auto bg-black/20 flex flex-col">
                  {/* Header Info */}
                  <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start shrink-0">
                       <div>
                           <div className="flex items-center gap-3 mb-1">
                                <a 
                                    href={getTrackingUrl(selectedShipment.carrier, selectedShipment.trackingNo)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-2xl font-bold text-white font-mono tracking-tight hover:text-indigo-400 transition-colors hover:underline decoration-dotted underline-offset-4 flex items-center gap-2 group"
                                    title="点击跳转官网查询"
                                >
                                    {selectedShipment.trackingNo}
                                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                </a>
                                <a 
                                    href={getTrackingUrl(selectedShipment.carrier, selectedShipment.trackingNo)}
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-indigo-300 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-colors"
                                >
                                    <Globe className="w-3 h-3" /> 官网查询
                                </a>
                           </div>
                           <div className="text-xs text-slate-400 flex flex-col gap-1">
                               <div className="flex items-center gap-3">
                                   <div className="flex items-center gap-2">
                                      <span className="bg-white/5 px-2 py-0.5 rounded text-slate-300">{selectedShipment.productName}</span>
                                   </div>
                                   {selectedShipment.shipDate && (
                                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> 发货: <span className="text-white font-mono">{selectedShipment.shipDate}</span></span>
                                   )}
                                   <span>预计送达: <span className="text-white font-mono">{selectedShipment.estimatedDelivery}</span></span>
                               </div>
                               
                               {selectedShipment.notes && (
                                   <div className="mt-3 text-xs bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden group">
                                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                       <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                       <div className="flex flex-col">
                                            <span className="font-bold text-amber-500 uppercase tracking-wider text-[10px] mb-0.5">重要备注 (Note)</span>
                                            <span className="text-amber-100 font-medium leading-relaxed">{selectedShipment.notes}</span>
                                       </div>
                                   </div>
                               )}
                           </div>
                       </div>
                       
                       <div className="flex gap-2">
                           <button 
                               onClick={handleEditClick}
                               className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                           >
                               <Edit2 className="w-3 h-3" /> 编辑
                           </button>
                           <button 
                               onClick={handleDelete}
                               className="px-3 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                           >
                               <Trash2 className="w-3 h-3" /> 删除
                           </button>
                           <button 
                               onClick={handleAnalyze}
                               disabled={isAnalyzing}
                               className="px-3 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                           >
                               {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                               AI 分析
                           </button>
                       </div>
                  </div>

                  <div className="p-6">
                      {aiAnalysis && (
                          <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl animate-in fade-in">
                              <div className="text-sm text-indigo-100 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
                          </div>
                      )}

                      <h3 className="text-sm font-bold text-white mb-4 uppercase flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" /> 物流轨迹 (Timeline)
                      </h3>
                      <div className="space-y-6 relative pl-2">
                          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/10"></div>
                          {selectedShipment.events.map((event, idx) => (
                              <div key={idx} className="relative flex items-start gap-4">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-[#0f1218] ${idx === 0 ? 'border-indigo-500 text-indigo-500' : 'border-slate-700 text-slate-700'}`}>
                                      {idx === 0 ? <Truck className="w-3 h-3 fill-current" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>}
                                  </div>
                                  <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-3">
                                      <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-sm text-white">{event.description}</span>
                                          <span className="text-[10px] text-slate-500 font-mono">{event.date} {event.time}</span>
                                      </div>
                                      <div className="text-xs text-slate-400 flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {event.location}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <Truck className="w-16 h-16 mb-4 opacity-20" />
                  <p>请选择一个物流单号查看详情，或点击“新增”创建新运单</p>
              </div>
          )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowEditModal(false)}>
              <div className="ios-glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Edit2 className="w-5 h-5 text-indigo-500" /> 
                          {selectedShipment ? '编辑物流信息' : '创建新物流运单'}
                      </h3>
                      <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">运单号 (Tracking No)</label>
                          <input 
                              type="text" 
                              value={editForm.trackingNo || ''} 
                              onChange={e => setEditForm({...editForm, trackingNo: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white font-mono"
                              placeholder="例如: DHL123456789"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">承运商 (Carrier)</label>
                              <select 
                                  value={editForm.carrier || 'DHL'} 
                                  onChange={e => setEditForm({...editForm, carrier: e.target.value as any})}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                              >
                                  <option value="DHL">DHL</option>
                                  <option value="FedEx">FedEx</option>
                                  <option value="UPS">UPS</option>
                                  <option value="USPS">USPS</option>
                                  <option value="Matson">Matson</option>
                                  <option value="Cosco">Cosco</option>
                                  <option value="Other">Other</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">状态 (Status)</label>
                              <select 
                                  value={editForm.status || 'Pending'} 
                                  onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                              >
                                  <option value="Pending">Pending</option>
                                  <option value="In Transit">In Transit</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Exception">Exception</option>
                              </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-1">
                              <label className="text-xs text-slate-400 block mb-1">发货时间 (Ship Date)</label>
                              <input 
                                  type="date" 
                                  value={editForm.shipDate || ''} 
                                  onChange={e => setEditForm({...editForm, shipDate: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                              />
                          </div>
                          <div className="col-span-1">
                              <label className="text-xs text-slate-400 block mb-1">商品名称 (Product)</label>
                              <input 
                                  type="text" 
                                  value={editForm.productName || ''} 
                                  onChange={e => setEditForm({...editForm, productName: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                                  placeholder="简要描述..."
                              />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">备注 (Notes)</label>
                          <textarea 
                              value={editForm.notes || ''} 
                              onChange={e => setEditForm({...editForm, notes: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white h-20 resize-none focus:outline-none focus:border-indigo-500"
                              placeholder="添加备注信息..."
                          />
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                      <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">取消</button>
                      <button 
                          onClick={handleSaveEdit}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"
                      >
                          <Save className="w-4 h-4" /> 保存修改
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tracking;
