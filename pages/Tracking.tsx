import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Truck, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Plus, MoreHorizontal, Globe, Edit2, Loader2, Bot, X, Trash2, Save, ExternalLink,
  ArrowRight, Navigation, Anchor, Box, Scale, Layers, FileText, StickyNote, CalendarOff, Send, MessageCircle
} from 'lucide-react';
import { sendFeishuMessage } from '../utils/feishu';

const Tracking: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPushingToFeishu, setIsPushingToFeishu] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

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

  const filteredShipments = (state.shipments || []).filter(s => 
    (s.trackingNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrackingUrl = (carrier: string, trackingNo: string) => {
      const t = (trackingNo || '').trim();
      const c = (carrier || '').toLowerCase().trim();
      if (t.toUpperCase().startsWith('1Z') || c.includes('ups')) return `https://www.ups.com/track?loc=zh_CN&tracknum=${t}`;
      if (c.includes('dhl')) return `https://www.dhl.com/cn-zh/home/tracking.html?tracking-id=${t}`;
      if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
      if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
      if (c.includes('matson')) return `https://www.matson.com/tracking.html`;
      return `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${encodeURIComponent(t)}`;
  };

  // Fix: Define missing handleEditClick function
  const handleEditClick = () => {
    if (!selectedShipment) return;
    setEditForm({ ...selectedShipment });
    setShowEditModal(true);
  };

  const handleAnalyze = async () => {
    if (!selectedShipment) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `分析运单 ${selectedShipment.trackingNo} (${selectedShipment.carrier}) 的轨迹。评估风险并预测到达。中文简短回答。`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiAnalysis(response.text);
    } catch (e: any) {
        showToast(`AI 分析失败: ${e.message}`, 'error');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handlePushToFeishu = async () => {
      if (!selectedShipment) return;
      const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
      if (!webhookUrl) {
          showToast('请先在设置中配置飞书 Webhook', 'warning');
          return;
      }

      setIsPushingToFeishu(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const lastEvent = selectedShipment.events?.[0]?.description || '暂无详细轨迹';
          const prompt = `为飞书消息生成一段极其精炼的物流简报。运单：${selectedShipment.trackingNo}，货品：${selectedShipment.productName}，最新动态：${lastEvent}。指出是否有风险。20字以内。`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-lite-latest', contents: prompt });
          
          const content = `单号: ${selectedShipment.trackingNo}\n载荷: ${selectedShipment.productName}\n最新: ${lastEvent}\nAI简评: ${response.text}`;
          const res = await sendFeishuMessage(webhookUrl, '单项物流推送', content);
          if (res.success) showToast('已推送到您的手机飞书', 'success');
          else throw new Error('推送失败');
      } catch (e) {
          showToast('飞书节点链路断开', 'error');
      } finally {
          setIsPushingToFeishu(false);
      }
  };

  const handleAddNew = () => {
      setSelectedShipment(null);
      setEditForm({ trackingNo: '', carrier: 'DHL', status: '待处理', productName: '', notes: '', shipDate: new Date().toISOString().split('T')[0], events: [] });
      setShowEditModal(true);
  };

  const handleSaveEdit = () => {
      if (!editForm.trackingNo) return showToast('请输入运单号', 'warning');
      if (selectedShipment) {
          const updatedShipment = { ...selectedShipment, ...editForm } as Shipment;
          dispatch({ type: 'UPDATE_SHIPMENT', payload: updatedShipment });
          setSelectedShipment(updatedShipment); 
      } else {
          const newShipment: Shipment = { id: `SH-${Date.now()}`, trackingNo: editForm.trackingNo!, carrier: (editForm.carrier as any) || 'Other', status: (editForm.status as any) || '待处理', productName: editForm.productName || '未命名货品', origin: '未知', destination: '未知', events: [], notes: editForm.notes };
          dispatch({ type: 'ADD_SHIPMENT', payload: newShipment });
      }
      setShowEditModal(false);
  };

  return (
    <div className="ios-glass-panel rounded-3xl border border-white/10 shadow-2xl flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden">
      <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Truck className="w-6 h-6" /></div>
            <div>
                <h2 className="text-white font-black text-xl tracking-tight uppercase italic">全球重要物流情报</h2>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">FEISHU NOTIFICATION HUB ACTIVE</p>
            </div>
        </div>
        <div className="flex gap-3">
            <div className="relative group"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="检索..." className="w-64 pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-300 outline-none"/><Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" /></div>
            <button onClick={handleAddNew} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-900/40 transition-all active:scale-95"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative z-10">
          <div className={`${selectedShipment ? 'hidden lg:block w-[420px]' : 'w-full'} border-r border-white/10 overflow-y-auto p-4 space-y-4 bg-black/20 custom-scrollbar`}>
              {filteredShipments.map(shipment => (
                  <div key={shipment.id} onClick={() => setSelectedShipment(shipment)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${selectedShipment?.id === shipment.id ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}>
                      <div className="flex justify-between items-center"><span className="text-[10px] px-2 py-0.5 bg-white/5 text-slate-400 rounded font-black border border-white/5">{shipment.carrier}</span><span className={`text-[9px] px-2 py-0.5 rounded-lg border font-black uppercase ${getStatusColor(shipment.status)}`}>{translateStatus(shipment.status)}</span></div>
                      <div className="text-sm font-bold text-white truncate">{shipment.productName || '未命名货品'}</div>
                      <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className={`absolute left-0 top-0 h-full ${getStatusColor(shipment.status).split(' ')[1]}`} style={{ width: getProgressWidth(shipment.status) }}></div></div>
                      <div className="flex justify-between items-end"><span className="text-[10px] text-slate-500 font-mono">{shipment.trackingNo}</span><ExternalLink className="w-3 h-3 text-slate-700" /></div>
                  </div>
              ))}
          </div>

          {selectedShipment ? (
              <div className="flex-1 overflow-y-auto bg-black/40 flex flex-col animate-in fade-in">
                  <div className="p-8 border-b border-white/10 bg-white/2 flex justify-between items-start shrink-0 backdrop-blur-md">
                       <div>
                           <div className="flex items-center gap-4 mb-2"><h3 className="text-4xl font-black text-white font-mono tracking-tighter">{selectedShipment.trackingNo}</h3><span className={`text-xs font-black px-3 py-1 rounded-full border shadow-lg ${getStatusColor(selectedShipment.status)}`}>{translateStatus(selectedShipment.status)}</span></div>
                           <div className="flex items-center gap-4"><span className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/30 font-bold text-base flex items-center gap-2"><Box className="w-4 h-4"/> {selectedShipment.productName}</span></div>
                       </div>
                       <div className="flex gap-3">
                           <button onClick={handlePushToFeishu} disabled={isPushingToFeishu} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-xl shadow-emerald-900/40 transition-all active:scale-95">
                               {isPushingToFeishu ? <Loader2 className="w-4 h-4 animate-spin"/> : <MessageCircle className="w-4 h-4" />} 飞书同步
                           </button>
                           <button onClick={handleEditClick} className="px-5 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-black uppercase flex items-center gap-2"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-xl">
                               {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} AI 审计
                           </button>
                       </div>
                  </div>

                  <div className="p-8 space-y-8">
                      {selectedShipment.notes && (
                          <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/40 rounded-3xl p-6 relative overflow-hidden group"><div className="relative z-10"><h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-3">运营备注</h3><p className="text-lg font-bold text-amber-100">{selectedShipment.notes}</p></div></div>
                      )}
                      {aiAnalysis && (
                          <div className="p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl animate-in slide-in-from-top-4 relative overflow-hidden"><div className="relative z-10 text-base text-indigo-100 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div></div>
                      )}
                      <div className="space-y-8 relative pl-4">
                          <div className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-indigo-500/50 via-white/5 to-transparent"></div>
                          {selectedShipment.events?.map((event, idx) => (
                              <div key={idx} className="relative flex items-start gap-6 animate-in slide-in-from-left duration-500">
                                  <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 z-10 ${idx === 0 ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-slate-900 border-slate-800 text-slate-700'}`}>{idx === 0 ? <Navigation className="w-5 h-5 fill-current" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}</div>
                                  <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors"><div className="flex justify-between items-start mb-2"><span className="font-black text-lg text-white">{event.description}</span><span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{event.date} {event.time}</span></div><div className="text-xs text-slate-400 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> {event.location}</div></div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-20"><Truck className="w-20 h-20 opacity-10 mb-6" /><h3 className="text-lg font-black uppercase tracking-[0.4em] mb-2">待命状态</h3><p className="text-[10px] text-center max-w-xs leading-relaxed uppercase font-bold text-slate-500">点击单据以激活全息链路监控</p></div>
          )}
      </div>

      {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-200" onClick={() => setShowEditModal(false)}>
              <div className="ios-glass-panel w-full max-w-xl rounded-3xl shadow-2xl p-8 border border-white/20" onClick={e => e.stopPropagation()}>
                  <h3 className="text-2xl font-black text-white italic uppercase mb-8">货件协议管理</h3>
                  <div className="space-y-6"><input type="text" value={editForm.trackingNo || ''} onChange={e => setEditForm({...editForm, trackingNo: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-sm text-white" placeholder="运单号 ID..." /><textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-white" placeholder="备注..." /></div>
                  <div className="flex justify-end gap-4 mt-8"><button onClick={handleSaveEdit} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-2xl">部署节点</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tracking;