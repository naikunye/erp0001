
import React, { useState, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment, ShipmentEvent } from '../types';
import { 
  Truck, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Plus, Globe, Edit2, Loader2, Bot, X, Trash2, Save,
  ArrowRight, Navigation, Box, FileText, StickyNote, CalendarOff, 
  MessageCircle, Zap, ChevronRight, Map, Sparkles, Timer, ExternalLink
} from 'lucide-react';
import { sendFeishuMessage } from '../utils/feishu';
import { GoogleGenAI } from "@google/genai";

const Tracking: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  
  // 改为 ID 选中，确保详情页数据永远与全局 State 同步
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const selectedShipment = useMemo(() => 
    (state.shipments || []).find((s: Shipment) => s.id === selectedShipmentId) || null
  , [state.shipments, selectedShipmentId]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPushingToFeishu, setIsPushingToFeishu] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shipment>>({});

  // 统一 UPS 跳转逻辑
  const getTrackingUrl = (carrier: string = '', trackingNo: string = '') => {
      const t = trackingNo.trim();
      if (!t) return '#';
      const c = carrier.toLowerCase().trim();
      if (t.toUpperCase().startsWith('1Z') || c.includes('ups')) {
          return `https://www.ups.com/track?loc=zh_CN&tracknum=${t}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${encodeURIComponent(t)}`;
  };

  const getStatusConfig = (status: string) => {
      switch (status) {
          case '已送达': return {
              text: 'text-emerald-400',
              bg: 'bg-emerald-500',
              glow: 'shadow-[0_0_20px_rgba(16,185,129,0.8)]',
              border: 'border-emerald-500/60',
              lightBg: 'bg-emerald-500/20'
          };
          case '运输中': return {
              text: 'text-cyan-400',
              bg: 'bg-cyan-500',
              glow: 'shadow-[0_0_20px_rgba(6,182,212,0.8)]',
              border: 'border-cyan-500/60',
              lightBg: 'bg-cyan-500/20'
          };
          case '异常': return {
              text: 'text-rose-400',
              bg: 'bg-rose-500',
              glow: 'shadow-[0_0_25px_rgba(244,63,94,0.8)]',
              border: 'border-rose-500/60',
              lightBg: 'bg-rose-500/20'
          };
          default: return {
              text: 'text-slate-400',
              bg: 'bg-slate-500',
              glow: 'shadow-none',
              border: 'border-slate-700',
              lightBg: 'bg-slate-800/50'
          };
      }
  };

  const getProgressWidth = (status: string) => {
      switch (status) {
          case '已送达': return '100%';
          case '运输中': return '65%';
          case '异常': return '45%';
          case '待处理': return '15%';
          default: return '5%';
      }
  };

  const filteredShipments = (state.shipments || []).filter((s: Shipment) => 
    (s.trackingNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (shipment: Shipment) => {
    setEditForm({ ...shipment });
    setShowEditModal(true);
  };

  const handleAnalyze = async () => {
    if (!selectedShipment) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `分析运单 ${selectedShipment.trackingNo}。状态：${selectedShipment.status}。货品：${selectedShipment.productName}。评估延迟风险。中文简短。`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiAnalysis(response.text);
    } catch (e: any) {
        showToast(`AI 节点通信受限`, 'error');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handlePushToFeishu = async () => {
      if (!selectedShipment) return;
      const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
      if (!webhookUrl) return showToast('请先配置飞书 Webhook', 'warning');

      setIsPushingToFeishu(true);
      try {
          const content = `📦 物流同步\n货品: ${selectedShipment.productName}\n单号: ${selectedShipment.trackingNo}\n状态: ${selectedShipment.status}`;
          const res = await sendFeishuMessage(webhookUrl, '单项推送', content);
          if (res.success) showToast('同步成功', 'success');
      } finally {
          setIsPushingToFeishu(false);
      }
  };

  const handleSaveEdit = () => {
      if (!editForm.trackingNo) return showToast('单号必填', 'warning');
      if (editForm.id) {
          dispatch({ type: 'UPDATE_SHIPMENT', payload: editForm as Shipment });
          showToast('节点已固化', 'success');
      } else {
          const newId = `SH-${Date.now()}`;
          const newShipment: Shipment = { ...editForm as any, id: newId, events: [] };
          dispatch({ type: 'ADD_SHIPMENT', payload: newShipment });
          setSelectedShipmentId(newId);
          showToast('新协议注入完成', 'success');
      }
      setShowEditModal(false);
  };

  const handleShipOut = async () => {
      if (!selectedShipment) return;
      // 修正：Shipment 对象使用的是 trackingNo 而非 trackingNumber
      if (!selectedShipment.trackingNo) {
          showToast('请先录入正式运单号再执行离场', 'warning');
          setEditForm({ ...selectedShipment });
          setShowEditModal(true);
          return;
      }
      const updated = { ...selectedShipment, status: '运输中' as const, shipDate: new Date().toISOString().split('T')[0] };
      dispatch({ type: 'UPDATE_SHIPMENT', payload: updated });
      showToast('货件已标记为离场运输中', 'success');
  };

  return (
    <div className="ios-glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/40">
      <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-3xl z-20">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-900/60 ring-4 ring-indigo-500/20">
                <Globe className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">全球物理链路监控矩阵</h2>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-emerald-500 animate-pulse"/> Tracking Nodes: {state.shipments?.length || 0}
                </div>
            </div>
        </div>
        <div className="flex gap-4">
            <div className="relative group">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="检索单号 / SKU..." 
                    className="w-80 pl-12 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-2xl text-xs text-white focus:border-indigo-500 outline-none font-bold uppercase transition-all"
                />
            </div>
            <button 
                onClick={() => { setEditForm({ carrier: 'UPS', status: '待处理', shipDate: new Date().toISOString().split('T')[0] }); setShowEditModal(true); }}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-xl active:scale-95 transition-all italic shadow-indigo-900/30"
            >
                <Plus className="w-4 h-4" /> 部署物流协议
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex z-10">
          <div className={`${selectedShipment ? 'hidden xl:block w-[450px]' : 'w-full'} border-r border-white/5 overflow-y-auto p-5 space-y-4 bg-black/20 custom-scrollbar`}>
              {filteredShipments.map(shipment => {
                  const cfg = getStatusConfig(shipment.status);
                  return (
                      <div 
                        key={shipment.id} 
                        onClick={() => setSelectedShipmentId(shipment.id)} 
                        className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden group ${selectedShipmentId === shipment.id ? 'bg-indigo-600/10 border-indigo-500/80 shadow-inner scale-[0.98]' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                      >
                          <div className="flex justify-between items-center relative z-10">
                              <span className="text-[10px] px-3 py-1 bg-black/60 text-slate-300 rounded-xl font-black border border-white/10 uppercase font-mono shadow-lg">
                                {shipment.carrier}
                              </span>
                              <span className={`text-[9px] px-3 py-1 rounded-full border-2 font-black uppercase tracking-widest ${cfg.text} ${cfg.border} ${cfg.lightBg} ${cfg.glow}`}>
                                {shipment.status}
                              </span>
                          </div>
                          
                          <div className="min-w-0 relative z-10">
                              <div className="text-xl font-black text-white truncate italic tracking-tighter group-hover:text-indigo-400 transition-colors uppercase">
                                {shipment.productName || 'UNIDENTIFIED_PAYLOAD'}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <a 
                                    href={getTrackingUrl(shipment.carrier, shipment.trackingNo)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-[11px] text-blue-400 hover:text-blue-300 font-mono font-bold tracking-tight underline flex items-center gap-1 transition-colors"
                                >
                                    {shipment.trackingNo}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <div className="h-3 w-px bg-white/10"></div>
                                <span className="text-[10px] text-slate-600 font-black uppercase">{shipment.origin || 'CN'} → {shipment.destination || 'US'}</span>
                              </div>
                          </div>

                          {shipment.notes && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 relative z-10 animate-in fade-in duration-500">
                                  <div className="flex items-start gap-2">
                                      <StickyNote className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                      <p className="text-[10px] text-amber-200/80 leading-relaxed font-bold italic line-clamp-2">
                                          {shipment.notes}
                                      </p>
                                  </div>
                              </div>
                          )}
                          
                          <div className="space-y-2 relative z-10">
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  <span>Syncing Progress</span>
                                  <span className={cfg.text}>{getProgressWidth(shipment.status)}</span>
                              </div>
                              <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out relative overflow-hidden ${cfg.bg} ${cfg.glow}`} 
                                    style={{ width: getProgressWidth(shipment.status) }}
                                >
                                    {shipment.status === '运输中' && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2 h-full -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                                    )}
                                </div>
                              </div>
                          </div>

                          <div className="flex justify-between items-center relative z-10 mt-1">
                              <span className="text-[9px] text-indigo-400/80 font-black uppercase italic tracking-widest">{shipment.shipDate || '--'} DEPARTURE</span>
                              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-500 transition-colors" />
                          </div>
                      </div>
                  );
              })}
          </div>

          {selectedShipment ? (
              <div className="flex-1 overflow-y-auto bg-[#050508]/90 flex flex-col animate-in fade-in duration-500 slide-in-from-right-4 relative">
                  <div className="p-12 border-b border-white/5 bg-white/2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shrink-0 backdrop-blur-2xl relative z-10 overflow-hidden">
                       <div className="relative z-10">
                           <div className="flex items-center gap-8 mb-6">
                               <a 
                                 href={getTrackingUrl(selectedShipment.carrier, selectedShipment.trackingNo)}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="group/link flex items-center gap-4"
                               >
                                   <h3 className="text-6xl font-black text-white font-mono tracking-tighter drop-shadow-2xl group-hover/link:text-blue-400 transition-colors">
                                     {selectedShipment.trackingNo}
                                   </h3>
                                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover/link:bg-blue-600 group-hover/link:border-blue-400 transition-all group-hover/link:scale-110 shadow-xl">
                                      <ExternalLink className="w-6 h-6 text-slate-500 group-hover/link:text-white" />
                                   </div>
                               </a>
                               {(() => {
                                   const cfg = getStatusConfig(selectedShipment.status);
                                   return <span className={`text-sm font-black px-6 py-2.5 rounded-full border-2 shadow-2xl uppercase tracking-[0.2em] ${cfg.text} ${cfg.border} ${cfg.lightBg} ${cfg.glow}`}>{selectedShipment.status}</span>;
                               })()}
                           </div>
                           <div className="flex flex-wrap gap-5">
                               <span className="bg-indigo-600/20 text-indigo-300 px-6 py-3 rounded-[1.5rem] border border-indigo-500/40 font-black text-2xl flex items-center gap-4 italic shadow-2xl">
                                 <Box className="w-7 h-7 text-indigo-400"/> {selectedShipment.productName}
                               </span>
                               <span className="bg-white/5 text-slate-400 px-6 py-3 rounded-[1.5rem] border border-white/10 font-bold text-base flex items-center gap-3">
                                 <Truck className="w-5 h-5" /> {selectedShipment.carrier}
                               </span>
                           </div>
                       </div>
                       <div className="flex gap-5 relative z-10">
                           <button onClick={handlePushToFeishu} disabled={isPushingToFeishu} className="px-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] text-xs font-black uppercase flex items-center gap-4 shadow-2xl shadow-emerald-900/60 transition-all active:scale-95 italic">
                               {isPushingToFeishu ? <Loader2 className="w-5 h-5 animate-spin"/> : <MessageCircle className="w-5 h-5" />} 同步飞书中枢
                           </button>
                           <button onClick={() => handleEditClick(selectedShipment)} className="px-8 py-5 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-[2rem] text-xs font-black uppercase flex items-center gap-3 transition-all">
                               <Edit2 className="w-5 h-5" /> 修正
                           </button>
                           <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] text-xs font-black uppercase flex items-center gap-4 shadow-2xl shadow-indigo-900/60 transition-all active:scale-95 italic">
                               {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />} AI 链路诊断
                           </button>
                       </div>
                  </div>

                  <div className="p-12 space-y-12 relative z-10">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="ios-glass-card p-10 rounded-[3rem] border-l-8 border-l-indigo-600 flex items-center justify-between shadow-2xl bg-[#0a0a0c]">
                              <div className="space-y-2">
                                  <div className="text-[11px] text-slate-600 font-black uppercase tracking-[0.3em] flex items-center gap-2"><Navigation className="w-3.5 h-3.5 text-indigo-500"/> 起运节点</div>
                                  <div className="text-3xl font-black text-white italic tracking-tight">{selectedShipment.origin || 'AWAITING_SYNC'}</div>
                              </div>
                              <ArrowRight className="w-12 h-12 text-indigo-500/40 mx-6" />
                              <div className="text-right space-y-2">
                                  <div className="text-[11px] text-slate-600 font-black uppercase tracking-[0.3em] flex items-center gap-2 justify-end">交付节点 <MapPin className="w-3.5 h-3.5 text-indigo-500"/></div>
                                  <div className="text-3xl font-black text-indigo-400 italic tracking-tight">{selectedShipment.destination || 'AWAITING_SYNC'}</div>
                              </div>
                          </div>
                          
                          <div className="ios-glass-card p-10 rounded-[3rem] border-l-8 border-l-cyan-600 flex items-center justify-between shadow-2xl bg-[#0a0a0c]">
                              <div className="space-y-2">
                                  <div className="text-[11px] text-slate-600 font-black uppercase tracking-[0.3em] flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-cyan-500"/> 离场日期</div>
                                  <div className="text-3xl font-black text-white font-mono tracking-tighter">{selectedShipment.shipDate || '--'}</div>
                              </div>
                              <div className="w-px h-16 bg-white/10 mx-8"></div>
                              <div className="text-right space-y-2">
                                  <div className="text-[11px] text-slate-600 font-black uppercase tracking-[0.3em] flex items-center gap-2 justify-end">预计到达 <Timer className="w-3.5 h-3.5 text-cyan-500"/></div>
                                  <div className="text-3xl font-black text-cyan-400 font-mono tracking-tighter">{selectedShipment.estimatedDelivery || 'TBD'}</div>
                              </div>
                          </div>
                      </div>

                      {selectedShipment.notes && (
                          <div className="bg-amber-600/5 border-2 border-dashed border-amber-500/40 rounded-[3rem] p-10 relative overflow-hidden group transition-all hover:bg-amber-500/10 hover:border-amber-500/60 shadow-inner">
                              <div className="relative z-10">
                                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><StickyNote className="w-5 h-5"/> 运营前线标注</h3>
                                  <p className="text-3xl font-bold text-amber-100/90 leading-tight italic tracking-tight">{selectedShipment.notes}</p>
                              </div>
                          </div>
                      )}

                      {aiAnalysis && (
                          <div className="p-10 bg-indigo-600/10 border-2 border-indigo-500/30 rounded-[3.5rem] animate-in slide-in-from-top-4 relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 right-0 p-6 opacity-20"><Sparkles className="w-32 h-32 text-indigo-400" /></div>
                              <div className="relative z-10">
                                  <div className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 italic"><Sparkles className="w-5 h-5"/> AI 链路深度分析</div>
                                  <div className="text-xl text-slate-200 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
                              </div>
                          </div>
                      )}

                      <div className="space-y-12 relative pl-10 mt-16 pb-20">
                          <div className="absolute left-[41px] top-8 bottom-8 w-[3px] bg-gradient-to-b from-indigo-500 via-indigo-500/10 to-transparent"></div>
                          {selectedShipment.events && selectedShipment.events.length > 0 ? (
                              selectedShipment.events.map((event, idx) => (
                                  <div key={idx} className="relative flex items-start gap-12 animate-in slide-in-from-left duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                      <div className={`w-16 h-16 rounded-[1.5rem] border-4 flex items-center justify-center shrink-0 z-10 transition-all ${idx === 0 ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_40px_#6366f1]' : 'bg-[#0f1218] border-white/5 text-slate-800'}`}>
                                          {idx === 0 ? <Navigation className="w-7 h-7 fill-current" /> : <div className="w-4 h-4 rounded-full bg-current"></div>}
                                      </div>
                                      <div className="flex-1 bg-white/2 border border-white/5 rounded-[2.5rem] p-10 hover:bg-white/5 hover:border-indigo-500/30 transition-all group shadow-xl">
                                          <div className="flex justify-between items-start mb-4">
                                              <span className="font-black text-3xl text-white tracking-tighter group-hover:text-indigo-300 transition-colors uppercase italic">{event.description}</span>
                                              <span className="text-xs text-slate-500 font-mono font-black uppercase bg-black/60 px-5 py-2 rounded-2xl border border-white/5 shadow-lg">{event.date} • {event.time}</span>
                                          </div>
                                          <div className="text-base text-slate-400 flex items-center gap-4 font-bold uppercase tracking-[0.2em]">
                                              <MapPin className="w-5 h-5 text-indigo-500" /> {event.location}
                                          </div>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-800 flex flex-col items-center gap-8">
                                  <CalendarOff className="w-24 h-24 opacity-10" />
                                  <p className="text-sm font-black uppercase tracking-[0.6em]">数据链路解析中 (AWAITING_PHYSICAL_SYNC)</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                  <div className="relative mb-16">
                      <div className="w-48 h-48 bg-indigo-600/5 rounded-full flex items-center justify-center border border-white/5 animate-pulse ring-8 ring-indigo-500/5">
                        <Truck className="w-24 h-24 opacity-10" />
                      </div>
                      <div className="absolute inset-0 border-[6px] border-dashed border-indigo-500/20 rounded-full animate-spin-slow"></div>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-[0.8em] mb-6 text-slate-600 italic">量子节点待命</h3>
                  <p className="text-xs text-center max-w-sm leading-relaxed uppercase tracking-[0.4em] text-slate-500 font-bold opacity-60 italic">请从左侧矩阵选择一个物流节点以激活全息链路监控</p>
              </div>
          )}
      </div>

      {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/80 animate-in fade-in duration-300" onClick={() => setShowEditModal(false)}>
              <div className="ios-glass-panel w-full max-w-5xl rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,1)] p-12 border border-white/20 flex flex-col gap-12 bg-[#08080a] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-600 opacity-60"></div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter">货件协议管控 (MATRIX_ADMIN)</h3>
                    <button onClick={() => setShowEditModal(false)} className="p-4 hover:bg-white/10 rounded-3xl transition-all text-slate-700 hover:text-white"><X className="w-10 h-10"/></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-10">
                          <div className="space-y-3">
                              <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">运单唯一识别码 (TRACKING_ID)</label>
                              <input type="text" value={editForm.trackingNo || ''} onChange={e => setEditForm({...editForm, trackingNo: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[2rem] px-8 py-5 text-base text-white font-mono focus:border-indigo-500 transition-all outline-none shadow-inner" placeholder="1Z / DHL / UPS..." />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">物理载荷名称 (PAYLOAD_NAME)</label>
                              <input type="text" value={editForm.productName || ''} onChange={e => setEditForm({...editForm, productName: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[2rem] px-8 py-5 text-base text-white focus:border-indigo-500 transition-all outline-none shadow-inner" placeholder="输入批次或产品名..." />
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                  <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">承运协议</label>
                                  <input type="text" value={editForm.carrier || ''} onChange={e => setEditForm({...editForm, carrier: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.8rem] px-8 py-5 text-base text-white outline-none" />
                              </div>
                              <div className="space-y-3">
                                  <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">生命周期状态</label>
                                  <select value={editForm.status || '待处理'} onChange={e => setEditForm({...editForm, status: e.target.value as any})} className="w-full bg-black/60 border border-white/10 rounded-[1.8rem] px-8 py-5 text-base text-white appearance-none outline-none cursor-pointer">
                                      <option value="待处理">待处理 (PENDING)</option>
                                      <option value="运输中">运输中 (TRANSIT)</option>
                                      <option value="已送达">已送达 (DELIVERED)</option>
                                      <option value="异常">异常 (EXCEPTION)</option>
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-10">
                          <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                  <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">起运物理节点</label>
                                  <input type="text" value={editForm.origin || ''} onChange={e => setEditForm({...editForm, origin: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.8rem] px-8 py-5 text-base text-white outline-none" placeholder="Shenzhen..." />
                              </div>
                              <div className="space-y-3">
                                  <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">交付目的节点</label>
                                  <input type="text" value={editForm.destination || ''} onChange={e => setEditForm({...editForm, destination: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.8rem] px-8 py-5 text-base text-white outline-none" placeholder="US West..." />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                  <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">离场日期</label>
                                  <input type="date" value={editForm.shipDate || ''} onChange={e => setEditForm({...editForm, shipDate: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.8rem] px-8 py-5 text-base text-white font-mono outline-none" />
                              </div>
                              <div className="space-y-3">
                                  <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">预计到达 (ETA)</label>
                                  <input type="date" value={editForm.estimatedDelivery || ''} onChange={e => setEditForm({...editForm, estimatedDelivery: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.8rem] px-8 py-5 text-base text-indigo-400 font-mono outline-none" />
                              </div>
                          </div>
                          <div className="space-y-3">
                              <label className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] ml-3">运营核心备注 (SECURE_NOTES)</label>
                              <textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full h-36 bg-black/60 border border-white/10 rounded-[2.5rem] p-8 text-base text-slate-200 focus:border-indigo-500 outline-none resize-none shadow-inner" placeholder="填入查验历史、查重或延误说明..." />
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-12 border-t border-white/10">
                      <button 
                        onClick={() => { if(editForm.id) { if(confirm('确认物理销毁该节点？')) { dispatch({type:'DELETE_SHIPMENT', payload:editForm.id}); setShowEditModal(false); setSelectedShipmentId(null); } } }}
                        className="px-10 py-6 text-[12px] font-black text-rose-500 uppercase tracking-[0.4em] hover:bg-rose-500/10 rounded-[2rem] transition-all"
                      >
                          {editForm.id ? 'Destroy_Physical_Node' : ''}
                      </button>
                      <div className="flex gap-8">
                          <button onClick={() => setShowEditModal(false)} className="px-12 py-6 text-[12px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white transition-all">Abort_Changes</button>
                          <button onClick={handleSaveEdit} className="px-20 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.5em] shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all active:scale-95 italic shadow-indigo-900/60 flex items-center gap-4">
                              <Save className="w-6 h-6"/> Commit_Pulse
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
              0% { transform: translateX(-150%); }
              100% { transform: translateX(250%); }
          }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default Tracking;
