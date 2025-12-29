
import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment, ShipmentEvent } from '../types';
import { 
  Truck, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Plus, Globe, Edit2, Loader2, Bot, X, Trash2, Save,
  ArrowRight, Navigation, Box, FileText, StickyNote, CalendarOff, 
  MessageCircle, Zap, ChevronRight, Map, Sparkles, Timer
} from 'lucide-react';
import { sendFeishuMessage } from '../utils/feishu';
import { GoogleGenAI } from "@google/genai";

const Tracking: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPushingToFeishu, setIsPushingToFeishu] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shipment>>({});

  // 增强版色彩系统：大幅提升亮度与发光感
  const getStatusConfig = (status: string) => {
      switch (status) {
          case '已送达': return {
              text: 'text-emerald-400',
              bg: 'bg-emerald-500',
              glow: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]',
              border: 'border-emerald-500/50',
              lightBg: 'bg-emerald-500/10'
          };
          case '运输中': return {
              text: 'text-cyan-400',
              bg: 'bg-cyan-500',
              glow: 'shadow-[0_0_15px_rgba(6,182,212,0.6)]',
              border: 'border-cyan-500/50',
              lightBg: 'bg-cyan-500/10'
          };
          case '异常': return {
              text: 'text-rose-400',
              bg: 'bg-rose-500',
              glow: 'shadow-[0_0_15px_rgba(244,63,94,0.6)]',
              border: 'border-rose-500/50',
              lightBg: 'bg-rose-500/10'
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

  const filteredShipments = (state.shipments || []).filter(s => 
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
        const prompt = `分析运单 ${selectedShipment.trackingNo} 的轨迹。状态：${selectedShipment.status}。货品：${selectedShipment.productName}。评估延迟风险。中文简短回答，使用HTML加粗关键词。`;
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: prompt 
        });
        setAiAnalysis(response.text);
    } catch (e: any) {
        showToast(`AI 服务暂时离线`, 'error');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handlePushToFeishu = async () => {
      if (!selectedShipment) return;
      const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
      if (!webhookUrl) return showToast('请先在设置中配置飞书 Webhook', 'warning');

      setIsPushingToFeishu(true);
      try {
          const content = `📦 物流同步\n货品: ${selectedShipment.productName}\n单号: ${selectedShipment.trackingNo}\n状态: ${selectedShipment.status}\n预计到达: ${selectedShipment.estimatedDelivery || 'TBD'}`;
          const res = await sendFeishuMessage(webhookUrl, '单项推送', content);
          if (res.success) showToast('已推送到飞书终端', 'success');
      } finally {
          setIsPushingToFeishu(false);
      }
  };

  const handleSaveEdit = () => {
      if (!editForm.trackingNo) return showToast('单号不能为空', 'warning');
      if (editForm.id) {
          dispatch({ type: 'UPDATE_SHIPMENT', payload: editForm as Shipment });
          if (selectedShipment?.id === editForm.id) setSelectedShipment(editForm as Shipment);
          showToast('货件档案已同步', 'success');
      } else {
          const newShipment: Shipment = {
              ...editForm as any,
              id: `SH-${Date.now()}`,
              events: []
          };
          dispatch({ type: 'ADD_SHIPMENT', payload: newShipment });
          showToast('新节点已注入矩阵', 'success');
      }
      setShowEditModal(false);
  };

  return (
    <div className="ios-glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden bg-black/40">
      {/* 工具栏 */}
      <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-2xl z-20">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-900/40">
                <Globe className="w-7 h-7" />
            </div>
            <div>
                <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">全球物流监控中枢</h2>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-emerald-500 animate-pulse"/> Active Nodes: {state.shipments?.length || 0}
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
                    placeholder="单号 / 货品名称..." 
                    className="w-72 pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-xs text-white focus:border-indigo-500/50 outline-none font-bold uppercase"
                />
            </div>
            <button 
                onClick={() => { setEditForm({ carrier: 'UPS', status: '待处理', shipDate: new Date().toISOString().split('T')[0] }); setShowEditModal(true); }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-xl active:scale-95 transition-all italic"
            >
                <Plus className="w-4 h-4" /> 注册物流协议
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex z-10">
          {/* 侧边列表：信息更丰富 */}
          <div className={`${selectedShipment ? 'hidden xl:block w-[420px]' : 'w-full'} border-r border-white/5 overflow-y-auto p-5 space-y-4 bg-black/20 custom-scrollbar`}>
              {filteredShipments.map(shipment => {
                  const cfg = getStatusConfig(shipment.status);
                  return (
                      <div 
                        key={shipment.id} 
                        onClick={() => setSelectedShipment(shipment)} 
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden group ${selectedShipment?.id === shipment.id ? 'bg-indigo-600/10 border-indigo-500/50 shadow-inner' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                      >
                          <div className="flex justify-between items-center relative z-10">
                              <span className="text-[10px] px-2.5 py-1 bg-black/40 text-slate-300 rounded-lg font-black border border-white/10 uppercase font-mono">
                                {shipment.carrier}
                              </span>
                              <span className={`text-[9px] px-2.5 py-1 rounded-full border-2 font-black uppercase ${cfg.text} ${cfg.border} ${cfg.lightBg}`}>
                                {shipment.status}
                              </span>
                          </div>
                          <div className="text-lg font-black text-white truncate italic tracking-tight relative z-10 group-hover:text-indigo-400 transition-colors">
                            {shipment.productName || 'UNNAMED_LOAD'}
                          </div>
                          
                          {/* 列表项进度条：高亮度发光效果 */}
                          <div className="space-y-2 relative z-10">
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                  <span>Node Progress</span>
                                  <span className={cfg.text}>{getProgressWidth(shipment.status)}</span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    className={`h-full transition-all duration-1000 ${cfg.bg} ${cfg.glow}`} 
                                    style={{ width: getProgressWidth(shipment.status) }}
                                ></div>
                              </div>
                          </div>

                          <div className="flex justify-between items-end relative z-10 mt-1">
                              <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">{shipment.trackingNo}</span>
                                  <span className="text-[9px] text-slate-600 font-bold uppercase mt-1">{shipment.origin || 'CN'} → {shipment.destination || 'US'}</span>
                              </div>
                              <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase">{shipment.shipDate || '--'}</span>
                          </div>
                      </div>
                  );
              })}
          </div>

          {/* 右侧：全息详情面板 */}
          {selectedShipment ? (
              <div className="flex-1 overflow-y-auto bg-[#050508]/80 flex flex-col animate-in fade-in duration-500 slide-in-from-right-4">
                  {/* 详情头部：大幅增强冲击力 */}
                  <div className="p-10 border-b border-white/5 bg-white/2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shrink-0 backdrop-blur-md relative overflow-hidden">
                       <div className="relative z-10">
                           <div className="flex items-center gap-6 mb-4">
                               <h3 className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-2xl selection:bg-indigo-500">{selectedShipment.trackingNo}</h3>
                               {(() => {
                                   const cfg = getStatusConfig(selectedShipment.status);
                                   return <span className={`text-xs font-black px-5 py-2 rounded-full border-2 shadow-2xl uppercase tracking-widest ${cfg.text} ${cfg.border} ${cfg.lightBg} ${cfg.glow}`}>{selectedShipment.status}</span>;
                               })()}
                           </div>
                           <div className="flex flex-wrap gap-4">
                               <span className="bg-indigo-600/20 text-indigo-300 px-5 py-2.5 rounded-2xl border border-indigo-500/30 font-black text-xl flex items-center gap-3 italic">
                                 <Box className="w-6 h-6 text-indigo-400"/> {selectedShipment.productName}
                               </span>
                               <span className="bg-white/5 text-slate-400 px-5 py-2.5 rounded-2xl border border-white/10 font-bold text-sm flex items-center gap-2">
                                 <Truck className="w-4 h-4" /> {selectedShipment.carrier}
                               </span>
                           </div>
                       </div>
                       <div className="flex gap-4 relative z-10">
                           <button onClick={handlePushToFeishu} disabled={isPushingToFeishu} className="px-7 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] text-xs font-black uppercase flex items-center gap-3 shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 italic">
                               {isPushingToFeishu ? <Loader2 className="w-5 h-5 animate-spin"/> : <MessageCircle className="w-5 h-5" />} 同步飞书
                           </button>
                           <button onClick={() => handleEditClick(selectedShipment)} className="px-6 py-4 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-[1.5rem] text-xs font-black uppercase flex items-center gap-2 transition-all">
                               <Edit2 className="w-5 h-5" /> 修正档案
                           </button>
                           <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-7 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] text-xs font-black uppercase flex items-center gap-3 shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 italic">
                               {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />} AI 诊断
                           </button>
                       </div>
                  </div>

                  {/* 核心数据网格：起运地、目的地、时间线 */}
                  <div className="p-10 space-y-10">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="ios-glass-card p-8 rounded-[2.5rem] border-l-4 border-l-indigo-500 flex items-center justify-between shadow-2xl">
                              <div className="space-y-2">
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><Navigation className="w-3 h-3 text-indigo-400"/> 起运节点</div>
                                  <div className="text-2xl font-black text-white italic">{selectedShipment.origin || '待对齐'}</div>
                              </div>
                              <ArrowRight className="w-10 h-10 text-indigo-500/50 mx-4" />
                              <div className="text-right space-y-2">
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2 justify-end">交付节点 <MapPin className="w-3 h-3 text-indigo-400"/></div>
                                  <div className="text-2xl font-black text-indigo-400 italic">{selectedShipment.destination || '待对齐'}</div>
                              </div>
                          </div>
                          
                          <div className="ios-glass-card p-8 rounded-[2.5rem] border-l-4 border-l-cyan-500 flex items-center justify-between shadow-2xl">
                              <div className="space-y-2">
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3 text-cyan-400"/> 发货日期</div>
                                  <div className="text-2xl font-black text-white font-mono">{selectedShipment.shipDate || '--'}</div>
                              </div>
                              <div className="w-px h-12 bg-white/10 mx-6"></div>
                              <div className="text-right space-y-2">
                                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2 justify-end">预计到达 <Timer className="w-3 h-3 text-cyan-400"/></div>
                                  <div className="text-2xl font-black text-cyan-400 font-mono">{selectedShipment.estimatedDelivery || 'TBD'}</div>
                              </div>
                          </div>
                      </div>

                      {/* 备注区域 */}
                      {selectedShipment.notes && (
                          <div className="bg-amber-500/5 border-2 border-dashed border-amber-500/30 rounded-[2.5rem] p-8 relative overflow-hidden group transition-all hover:bg-amber-500/10">
                              <div className="relative z-10">
                                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><StickyNote className="w-4 h-4"/> 运营特别标注</h3>
                                  <p className="text-2xl font-bold text-amber-100/90 leading-relaxed italic">{selectedShipment.notes}</p>
                              </div>
                              <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                                  <FileText className="w-48 h-48 rotate-12" />
                              </div>
                          </div>
                      )}

                      {/* AI 分析卡片 */}
                      {aiAnalysis && (
                          <div className="p-8 bg-indigo-600/10 border-2 border-indigo-500/20 rounded-[2.5rem] animate-in slide-in-from-top-4 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-24 h-24 text-indigo-400" /></div>
                              <div className="relative z-10">
                                  <div className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI 深度链路洞察</div>
                                  <div className="text-lg text-slate-200 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
                              </div>
                          </div>
                      )}

                      {/* 时间轴：物流轨迹 */}
                      <div className="space-y-10 relative pl-8 mt-10">
                          <div className="absolute left-[39px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-indigo-500 via-indigo-500/10 to-transparent"></div>
                          {selectedShipment.events && selectedShipment.events.length > 0 ? (
                              selectedShipment.events.map((event, idx) => (
                                  <div key={idx} className="relative flex items-start gap-10 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                      <div className={`w-14 h-14 rounded-2xl border-4 flex items-center justify-center shrink-0 z-10 transition-all ${idx === 0 ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_#6366f1]' : 'bg-[#0f1218] border-white/5 text-slate-700'}`}>
                                          {idx === 0 ? <Navigation className="w-6 h-6 fill-current" /> : <div className="w-3 h-3 rounded-full bg-current"></div>}
                                      </div>
                                      <div className="flex-1 bg-white/2 border border-white/5 rounded-[2rem] p-8 hover:bg-white/5 hover:border-indigo-500/20 transition-all group">
                                          <div className="flex justify-between items-start mb-3">
                                              <span className="font-black text-2xl text-white tracking-tight group-hover:text-indigo-300 transition-colors uppercase italic">{event.description}</span>
                                              <span className="text-[11px] text-slate-500 font-mono font-black uppercase bg-black/40 px-4 py-1.5 rounded-xl border border-white/5">{event.date} • {event.time}</span>
                                          </div>
                                          <div className="text-sm text-slate-400 flex items-center gap-3 font-bold uppercase tracking-widest">
                                              <MapPin className="w-4 h-4 text-indigo-500" /> {event.location}
                                          </div>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-800 flex flex-col items-center gap-6">
                                  <CalendarOff className="w-20 h-20 opacity-10" />
                                  <p className="text-xs font-black uppercase tracking-[0.5em]">物理链路同步中 (AWAITING_RESONANCE)</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20">
                  <div className="relative mb-12">
                      <div className="w-40 h-40 bg-indigo-600/5 rounded-full flex items-center justify-center border border-white/5 animate-pulse">
                        <Truck className="w-20 h-20 opacity-10" />
                      </div>
                      <div className="absolute inset-0 border-4 border-dashed border-indigo-500/20 rounded-full animate-spin-slow"></div>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-[0.6em] mb-4 text-slate-600 italic">量子节点待命</h3>
                  <p className="text-xs text-center max-w-sm leading-relaxed uppercase tracking-widest text-slate-500 font-bold opacity-60">请从左侧矩阵选择一个物流节点以激活全息链路监控</p>
              </div>
          )}
      </div>

      {/* 增强型编辑模态框：支持所有核心字段 */}
      {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/70 animate-in fade-in duration-300" onClick={() => setShowEditModal(false)}>
              <div className="ios-glass-panel w-full max-w-4xl rounded-[3.5rem] shadow-2xl p-12 border border-white/20 flex flex-col gap-10 bg-[#0a0a0c] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-600 opacity-50"></div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">货件协议管控 (MATRIX_ADMIN)</h3>
                    <button onClick={() => setShowEditModal(false)} className="p-4 hover:bg-white/10 rounded-2xl transition-all text-slate-600 hover:text-white"><X className="w-8 h-8"/></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-8">
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">运单唯一标识 (TRACKING_ID)</label>
                              <input type="text" value={editForm.trackingNo || ''} onChange={e => setEditForm({...editForm, trackingNo: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] px-6 py-4 text-sm text-white font-mono focus:border-indigo-500 transition-all outline-none" placeholder="1Z / DHL / UPS..." />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">物理载荷名称 (PAYLOAD_NAME)</label>
                              <input type="text" value={editForm.productName || ''} onChange={e => setEditForm({...editForm, productName: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] px-6 py-4 text-sm text-white focus:border-indigo-500 transition-all outline-none" placeholder="输入批次或产品名..." />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">承运商</label>
                                  <input type="text" value={editForm.carrier || ''} onChange={e => setEditForm({...editForm, carrier: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">生命周期状态</label>
                                  <select value={editForm.status || '待处理'} onChange={e => setEditForm({...editForm, status: e.target.value as any})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white appearance-none outline-none cursor-pointer">
                                      <option value="待处理">待处理 (PENDING)</option>
                                      <option value="运输中">运输中 (TRANSIT)</option>
                                      <option value="已送达">已送达 (DELIVERED)</option>
                                      <option value="异常">异常 (EXCEPTION)</option>
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">起运物理节点</label>
                                  <input type="text" value={editForm.origin || ''} onChange={e => setEditForm({...editForm, origin: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none" placeholder="Shenzhen..." />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">交付目的节点</label>
                                  <input type="text" value={editForm.destination || ''} onChange={e => setEditForm({...editForm, destination: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none" placeholder="US West..." />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">离场日期</label>
                                  <input type="date" value={editForm.shipDate || ''} onChange={e => setEditForm({...editForm, shipDate: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">预计到达 (ETA)</label>
                                  <input type="date" value={editForm.estimatedDelivery || ''} onChange={e => setEditForm({...editForm, estimatedDelivery: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-indigo-400 font-mono outline-none" />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">运营高级备注 (SECURE_NOTES)</label>
                              <textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full h-32 bg-black/60 border border-white/10 rounded-[2rem] p-6 text-sm text-slate-200 focus:border-indigo-500 outline-none resize-none shadow-inner" placeholder="填入查验历史、查重或延误说明..." />
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-10 border-t border-white/5">
                      <button 
                        onClick={() => { if(editForm.id) { if(confirm('物理作废该节点？此操作不可逆。')) { dispatch({type:'DELETE_SHIPMENT', payload:editForm.id}); setShowEditModal(false); setSelectedShipment(null); } } }}
                        className="px-8 py-4 text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] hover:bg-rose-500/10 rounded-2xl transition-all"
                      >
                          {editForm.id ? 'Physical_Delete_Node' : ''}
                      </button>
                      <div className="flex gap-6">
                          <button onClick={() => setShowEditModal(false)} className="px-10 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-all">Abort_Changes</button>
                          <button onClick={handleSaveEdit} className="px-16 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 italic shadow-indigo-900/40 flex items-center gap-3">
                              <Save className="w-5 h-5"/> Commit_Sync_Pulse
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tracking;
