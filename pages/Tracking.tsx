import React, { useState } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Truck, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, 
  Search, Plus, MoreHorizontal, Globe, Edit2, Loader2, Bot, X 
} from 'lucide-react';

const Tracking: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Filter shipments
  const filteredShipments = state.shipments.filter(s => 
    s.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleEditClick = () => {
      showToast('编辑功能开发中', 'info');
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
            <button className="flex items-center justify-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-lg text-sm font-medium">
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
                                <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
                                    {selectedShipment.trackingNo}
                                </h1>
                                <a 
                                    href={`https://www.google.com/search?q=${selectedShipment.carrier}+tracking+${selectedShipment.trackingNo}`} 
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
                               className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                           >
                               <Edit2 className="w-3 h-3" /> 编辑
                           </button>
                           <button 
                               onClick={handleAnalyze}
                               disabled={isAnalyzing}
                               className="px-4 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                           >
                               {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                               AI 智能分析
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
                  <p>请选择一个物流单号查看详情</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Tracking;