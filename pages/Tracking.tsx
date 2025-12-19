
import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Truck, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Plus, MoreHorizontal, Globe, Edit2, Loader2, Bot, X, Trash2, Save, ExternalLink,
  ArrowRight, Navigation, Anchor, Box, Scale, Layers, FileText, StickyNote
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

  const translateStatus = (status: string) => {
      if (!status) return '待处理';
      const s = status.toLowerCase();
      if (s.includes('pending') || s === '待处理') return '待处理';
      if (s.includes('transit') || s === '运输中') return '运输中';
      if (s.includes('deliver') || s === '已送达') return '已送达';
      if (s.includes('exception') || s === '异常') return '异常';
      return status;
  };

  const getStatusColor = (status: string) => {
      const s = translateStatus(status);
      switch (s) {
          case '已送达': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          case '运输中': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
          case '异常': return 'text-red-400 bg-red-500/10 border-red-500/20';
          case '待处理':
          default: return 'text-slate-400 bg-slate-700/50 border-slate-600';
      }
  };

  const getProgressWidth = (status: string) => {
      const s = translateStatus(status);
      if (s === '已送达') return '100%';
      if (s === '运输中') return '65%';
      if (s === '异常') return '50%';
      return '15%';
  };

  const filteredShipments = state.shipments.filter(s => 
    s.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrackingUrl = (carrier: string, trackingNo: string) => {
      const c = carrier.toLowerCase();
      if (c.includes('ups')) return `https://www.ups.com/track?loc=zh_CN&tracknum=${trackingNo}`;
      if (c.includes('dhl')) return `https://www.dhl.com/cn-zh/home/tracking.html?tracking-id=${trackingNo}`;
      if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNo}`;
      if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNo}`;
      if (c.includes('matson')) return `https://www.matson.com/tracking.html`;
      return `https://www.google.com/search?q=${carrier}+tracking+${trackingNo}`;
  };

  const handleAnalyze = async () => {
    if (!selectedShipment) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `分析这份 ${selectedShipment.carrier} 运单号 ${selectedShipment.trackingNo} 的物流轨迹。内容包含中药材名称：${selectedShipment.productName}。请评估其温湿度风险并预测送达日期。使用HTML加粗。`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiAnalysis(response.text);
    } catch (e: any) {
        showToast(`AI 分析失败: ${e.message}`, 'error');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAddNew = () => {
      setSelectedShipment(null);
      setEditForm({
          trackingNo: '',
          carrier: 'DHL',
          status: '待处理',
          productName: '',
          notes: '',
          shipDate: new Date().toISOString().split('T')[0],
          estimatedDelivery: '',
          origin: '',
          destination: '',
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
          const updatedShipment = { ...selectedShipment, ...editForm } as Shipment;
          dispatch({ type: 'UPDATE_SHIPMENT', payload: updatedShipment });
          setSelectedShipment(updatedShipment); 
          showToast('物流信息已更新', 'success');
      } else {
          const newShipment: Shipment = {
              id: `SH-${Date.now()}`,
              trackingNo: editForm.trackingNo!,
              carrier: (editForm.carrier as any) || 'Other',
              status: (editForm.status as any) || '待处理',
              productName: editForm.productName || '未命名货品',
              origin: editForm.origin || '未知',
              destination: editForm.destination || '未知',
              estimatedDelivery: editForm.estimatedDelivery || 'TBD',
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

  return (
    <div className="ios-glass-panel rounded-3xl border border-white/10 shadow-2xl flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
                <Truck className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-white font-black text-xl tracking-tight uppercase italic flex items-center gap-2">
                    全球中药物流情报 (Logistics Matrix)
                </h2>
                <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-indigo-400"/> 运行中: {state.shipments.filter(s=>s.status!=='已送达').length}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400"/> 已完成: {state.shipments.filter(s=>s.status==='已送达').length}</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="单号 / 品名 / 药材..."
                    className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <button 
                onClick={handleAddNew}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 text-sm font-bold active:scale-95"
            >
                <Plus className="w-4 h-4" />
                <span>新增</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative z-10">
          {/* List Side */}
          <div className={`${selectedShipment ? 'hidden lg:block w-[420px]' : 'w-full'} border-r border-white/10 overflow-y-auto p-4 space-y-4 bg-black/20 custom-scrollbar`}>
              {filteredShipments.map(shipment => {
                  const statusKey = translateStatus(shipment.status);
                  return (
                  <div 
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col gap-3 ${selectedShipment?.id === shipment.id ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[inset_0_0_30px_rgba(79,70,229,0.05)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'}`}
                  >
                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 bg-white/5 text-slate-400 rounded font-black uppercase tracking-tighter border border-white/5">{shipment.carrier}</span>
                            <span className="font-mono text-xs font-black text-slate-400 group-hover:text-white transition-colors">{shipment.trackingNo}</span>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-lg border font-black uppercase shadow-sm ${getStatusColor(shipment.status)}`}>
                            {statusKey}
                          </span>
                      </div>

                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                               <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                   <Box className="w-4 h-4 text-indigo-400" />
                               </div>
                               <div className="truncate">
                                   <div className="text-sm font-bold text-white leading-tight truncate">{shipment.productName || '未命名药材'}</div>
                                   <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                       <Scale className="w-2.5 h-2.5" /> 净重: 12.5kg | 5包
                                   </div>
                               </div>
                          </div>
                          <div className="text-right shrink-0">
                               <div className="text-[9px] text-slate-600 uppercase font-black">ETA 倒计时</div>
                               <div className="text-[11px] font-mono font-bold text-indigo-400">{shipment.estimatedDelivery || '--'}</div>
                          </div>
                      </div>

                      <div className="space-y-2 mt-1 px-1">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-tighter px-0.5">
                                <span className="flex items-center gap-1"><Anchor className="w-2.5 h-2.5 text-slate-700"/> {shipment.origin || 'SHZ'}</span>
                                <div className="h-[1px] flex-1 mx-3 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <span className="flex items-center gap-1 text-slate-300 font-bold">{shipment.destination || 'LAX'} <MapPin className="w-2.5 h-2.5 text-indigo-500"/></span>
                          </div>
                          
                          <div className="relative h-2 w-full bg-black/40 rounded-full border border-white/5 shadow-inner">
                               <div 
                                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out z-10 ${
                                        statusKey === '异常' ? 'bg-red-500' : 
                                        statusKey === '已送达' ? 'bg-emerald-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: getProgressWidth(shipment.status) }}
                               >
                                   <div className={`absolute inset-0 rounded-full blur-[4px] opacity-70 animate-pulse ${
                                       statusKey === '异常' ? 'bg-red-400' : 
                                       statusKey === '已送达' ? 'bg-emerald-400' : 'bg-indigo-400'
                                   }`}></div>
                               </div>
                               <div 
                                    className={`absolute left-0 top-0 h-full rounded-full ${
                                        statusKey === '异常' ? 'bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 
                                        statusKey === '已送达' ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 
                                        'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                                    }`}
                                    style={{ width: getProgressWidth(shipment.status) }}
                               ></div>
                          </div>
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-white/5 mt-1">
                          <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                  <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">起运日期</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold">{shipment.shipDate || '--'}</span>
                              </div>
                              <div className="w-px h-5 bg-white/5"></div>
                              <div className="flex flex-col">
                                  <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest">当前位置</span>
                                  <span className="text-[10px] text-indigo-300 font-bold max-w-[120px] truncate">{shipment.lastUpdate || '处理中...'}</span>
                              </div>
                          </div>
                          {shipment.notes && <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </div>

                      <a 
                          href={getTrackingUrl(shipment.carrier, shipment.trackingNo)} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-4 right-4 p-2 text-slate-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg"
                      >
                          <ExternalLink className="w-4 h-4" />
                      </a>
                  </div>
                  );
              })}
          </div>

          {/* Details Side */}
          {selectedShipment ? (
              <div className="flex-1 overflow-y-auto bg-black/40 flex flex-col animate-in fade-in">
                  <div className="p-8 border-b border-white/10 bg-white/2 flex justify-between items-start shrink-0 backdrop-blur-md">
                       <div>
                           <div className="flex items-center gap-4 mb-2">
                                <a 
                                    href={getTrackingUrl(selectedShipment.carrier, selectedShipment.trackingNo)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-4xl font-black text-white font-mono tracking-tighter hover:text-indigo-400 transition-colors flex items-center gap-3 group"
                                >
                                    {selectedShipment.trackingNo}
                                    <ExternalLink className="w-6 h-6 opacity-30 group-hover:opacity-100" />
                                </a>
                                <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-lg ${getStatusColor(selectedShipment.status)}`}>{translateStatus(selectedShipment.status)}</span>
                           </div>
                           <div className="text-sm text-slate-400 flex flex-col gap-2">
                               <div className="flex items-center gap-4">
                                   <span className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/30 font-bold text-base flex items-center gap-2"><Box className="w-4 h-4"/> {selectedShipment.productName}</span>
                                   <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-600"/> 发货于: <span className="text-white font-mono">{selectedShipment.shipDate}</span></span>
                                   <span className="flex items-center gap-1.5 text-indigo-400 font-bold"><Clock className="w-4 h-4"/> 预计到达: <span className="text-white font-mono">{selectedShipment.estimatedDelivery || 'TBD'}</span></span>
                               </div>
                           </div>
                       </div>
                       
                       <div className="flex gap-3">
                           <button onClick={handleEditClick} className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all"><Edit2 className="w-4 h-4" /> 编辑</button>
                           <button onClick={handleDelete} className="px-5 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all"><Trash2 className="w-4 h-4" /> 删除</button>
                           <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-xl shadow-indigo-900/40">
                               {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} AI 审计
                           </button>
                       </div>
                  </div>

                  <div className="p-8 space-y-8">
                      {/* Highlighted Notes Block */}
                      {selectedShipment.notes && (
                          <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/40 rounded-3xl p-6 relative overflow-hidden group animate-in slide-in-from-top-4">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                  <StickyNote className="w-20 h-20 text-amber-500" />
                              </div>
                              <div className="relative z-10">
                                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4" /> 运营备注 (Internal Memo)
                                  </h3>
                                  <p className="text-lg font-bold text-amber-100 leading-relaxed drop-shadow-sm whitespace-pre-wrap">
                                      {selectedShipment.notes}
                                  </p>
                              </div>
                          </div>
                      )}

                      {aiAnalysis && (
                          <div className="p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl animate-in slide-in-from-top-4 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform"><Bot className="w-32 h-32"/></div>
                              <div className="relative z-10 text-base text-indigo-100 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
                          </div>
                      )}

                      <div>
                          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                              <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                              动态全息轨迹 (Live Timeline)
                          </h3>
                          <div className="space-y-8 relative pl-4">
                              <div className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-indigo-500/50 via-white/5 to-transparent"></div>
                              {selectedShipment.events.length > 0 ? selectedShipment.events.map((event, idx) => (
                                  <div key={idx} className="relative flex items-start gap-6 animate-in slide-in-from-left duration-500" style={{animationDelay: `${idx*100}ms`}}>
                                      <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 z-10 transition-all ${idx === 0 ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-700'}`}>
                                          {idx === 0 ? <Navigation className="w-5 h-5 fill-current" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                                      </div>
                                      <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                                          <div className="flex justify-between items-start mb-2">
                                              <span className="font-black text-lg text-white">{event.description}</span>
                                              <span className="text-[10px] text-slate-500 font-mono font-bold bg-black/40 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter">{event.date} {event.time}</span>
                                          </div>
                                          <div className="text-xs text-slate-400 flex items-center gap-2 font-medium"><MapPin className="w-4 h-4 text-indigo-500" /> {event.location}</div>
                                      </div>
                                  </div>
                              )) : (
                                  <div className="text-center py-20 bg-white/2 rounded-3xl border-2 border-dashed border-white/5">
                                      <Clock className="w-12 h-12 mx-auto mb-4 text-slate-800" />
                                      <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">暂无传感器轨迹记录</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                  <div className="w-32 h-32 bg-white/2 rounded-full flex items-center justify-center mb-8 relative">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-800 animate-spin-slow"></div>
                      <Truck className="w-16 h-16 opacity-10" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-[0.4em] mb-2 text-slate-600">待命状态 (Waiting)</h3>
                  <p className="text-[10px] text-center max-w-xs leading-relaxed uppercase tracking-widest text-slate-500 font-bold">请在左侧列表点击一个物流节点以开启全息追踪视图。</p>
              </div>
          )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60" onClick={() => setShowEditModal(false)}>
              <div className="ios-glass-panel w-full max-w-xl rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-600 rounded-xl text-white"><Edit2 className="w-5 h-5"/></div>
                          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                              {selectedShipment ? '配置货件协议' : '注册新物流载体'}
                          </h3>
                      </div>
                      <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                  </div>
                  
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                      <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">全球运单号 (Tracking Identity)</label>
                          <input type="text" value={editForm.trackingNo || ''} onChange={e => setEditForm({...editForm, trackingNo: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white font-mono focus:border-indigo-500 outline-none" placeholder="Enter Global ID..." />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] text-slate-500 font-black uppercase block mb-2">承运节点 (Carrier)</label>
                              <select value={editForm.carrier || 'DHL'} onChange={e => setEditForm({...editForm, carrier: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                                  <option value="DHL">DHL Express</option><option value="FedEx">FedEx International</option><option value="UPS">UPS Logistics</option><option value="Matson">Matson Sea</option><option value="Other">Other Protocol</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-500 font-black uppercase block mb-2">实时相位 (Status)</label>
                              <select value={editForm.status || '待处理'} onChange={e => setEditForm({...editForm, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                                  <option value="待处理">待处理 (Backlog)</option><option value="运输中">运输中 (In Transit)</option><option value="已送达">已送达 (Delivered)</option><option value="异常">异常 (Exception)</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase block mb-2">装载品名 (Payload)</label>
                          <input type="text" value={editForm.productName || ''} onChange={e => setEditForm({...editForm, productName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="药材品名或 SKU..." />
                      </div>
                      <div>
                          <label className="text-[10px] text-amber-500 font-black uppercase block mb-2">信息备注 (Internal Memo)</label>
                          <textarea 
                            value={editForm.notes || ''} 
                            onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                            className="w-full h-24 bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-4 text-sm text-amber-100 focus:border-amber-500 outline-none resize-none" 
                            placeholder="填写海关、包装或其它运营备注信息..." 
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div><label className="text-[10px] text-slate-500 font-black block mb-2">起运日</label><input type="date" value={editForm.shipDate || ''} onChange={e => setEditForm({...editForm, shipDate: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono" /></div>
                          <div><label className="text-[10px] text-indigo-400 font-black block mb-2 uppercase">预计达 (ETA)</label><input type="date" value={editForm.estimatedDelivery || ''} onChange={e => setEditForm({...editForm, estimatedDelivery: e.target.value})} className="w-full bg-indigo-600/10 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm text-indigo-400 font-mono font-black" /></div>
                      </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-white/10">
                      <button onClick={() => setShowEditModal(false)} className="px-6 py-3 text-slate-500 hover:text-white text-xs font-black uppercase">取消</button>
                      <button onClick={handleSaveEdit} className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase shadow-2xl shadow-indigo-900/50 flex items-center gap-3 active:scale-95 transition-all"><Save className="w-4 h-4" /> 部署全球节点</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tracking;
