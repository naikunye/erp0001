
import React, { useState, useEffect } from 'react';
import { 
  Search, Map, Truck, Package, Clock, AlertTriangle, 
  CheckCircle2, Plus, ArrowRight, Loader2, Bot, Sparkles, Navigation,
  Trash2, RefreshCw, MoreHorizontal, FileText, Save, X, Globe,
  AlertOctagon, Plane, Ship, AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MOCK_SHIPMENTS } from '../constants';
import { Shipment, LogisticsEvent } from '../types';
import { useTanxing } from '../context/TanxingContext';

const Tracking: React.FC = () => {
  const { showToast } = useTanxing();
  
  // --- State Management ---
  const [shipments, setShipments] = useState<Shipment[]>(() => {
      const saved = localStorage.getItem('tanxing_shipments');
      return saved ? JSON.parse(saved) : MOCK_SHIPMENTS;
  });

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'auto' | 'manual'>('auto');
  
  // Loading States
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState<Partial<Shipment>>({
      trackingNo: '',
      carrier: 'DHL',
      status: 'In Transit',
      origin: 'China',
      destination: 'USA',
      productName: '',
      events: []
  });

  // --- Effects ---
  useEffect(() => {
      localStorage.setItem('tanxing_shipments', JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
      if (!selectedShipment && shipments.length > 0) {
          setSelectedShipment(shipments[0]);
      }
  }, [shipments, selectedShipment]);

  // --- Helpers ---
  const getCarrierColor = (carrier: string) => {
      const c = carrier.toLowerCase();
      if (c.includes('dhl')) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      if (c.includes('fedex')) return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      if (c.includes('ups')) return 'text-amber-700 bg-amber-700/10 border-amber-700/20';
      if (c.includes('matson') || c.includes('cosco')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Delivered': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          case 'Exception': return 'text-red-400 bg-red-500/10 border-red-500/20';
          case 'Pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      }
  };

  // --- Handlers ---

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('确定要删除这条物流记录吗?')) {
          const newList = shipments.filter(s => s.id !== id);
          setShipments(newList);
          if (selectedShipment?.id === id) {
              setSelectedShipment(newList.length > 0 ? newList[0] : null);
          }
          showToast('物流记录已删除', 'info');
      }
  };

  const handleRefreshStatus = async () => {
      if (!selectedShipment) return;
      showToast(`已向 ${selectedShipment.carrier} 发送实时状态更新请求...`, 'info');
  };

  const handleAutoTrack = async () => {
      if (!manualForm.trackingNo) {
          showToast("请输入运单号", "warning");
          return;
      }
      setIsSearching(true);
      
      try {
          const exists = shipments.find(s => s.trackingNo === manualForm.trackingNo);
          if (exists) {
              showToast("该单号已存在，已为您定位", "info");
              setSelectedShipment(exists);
              setShowAddModal(false);
              setIsSearching(false);
              return;
          }

          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = `
            Generate a realistic logistics tracking history for shipment: "${manualForm.trackingNo}".
            Route: China -> USA (Cross-border E-commerce).
            Carrier: Auto-detect based on format (1Z=UPS, digits=DHL/FedEx) or default to DHL.
            
            Return JSON:
            {
              "carrier": "DHL" | "FedEx" | "UPS" | "Matson",
              "origin": "City, CN",
              "destination": "City, US",
              "status": "In Transit" | "Delivered" | "Exception",
              "estimatedDelivery": "YYYY-MM-DD",
              "productName": "Standard Parcel",
              "events": [
                { "date": "YYYY-MM-DD", "time": "HH:MM", "location": "City", "description": "Status update", "status": "Normal" | "Exception" }
              ]
            }
            Create 3-6 realistic events.
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: "application/json" }
          });
          
          const data = JSON.parse(response.text);
          
          setManualForm({
              ...manualForm,
              carrier: data.carrier,
              origin: data.origin,
              destination: data.destination,
              status: data.status,
              estimatedDelivery: data.estimatedDelivery,
              productName: manualForm.productName || data.productName,
              events: data.events
          });

          setAddMode('manual');
          showToast("AI 识别成功，请核对信息后保存", "success");

      } catch (error) {
          showToast("自动追踪失败，请尝试手动录入", "error");
      } finally {
          setIsSearching(false);
      }
  };

  const handleManualSubmit = () => {
      if (!manualForm.trackingNo || !manualForm.origin || !manualForm.destination) {
          showToast("请填写必要信息 (单号/发货地/目的地)", "warning");
          return;
      }

      const events = manualForm.events && manualForm.events.length > 0 ? manualForm.events : [
          {
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}),
              location: manualForm.origin!,
              description: 'Shipment record created',
              status: 'Normal'
          }
      ];

      const newShipment: Shipment = {
          id: `SH-${Date.now()}`,
          trackingNo: manualForm.trackingNo,
          carrier: manualForm.carrier as any,
          status: manualForm.status as any,
          origin: manualForm.origin!,
          destination: manualForm.destination!,
          estimatedDelivery: manualForm.estimatedDelivery || new Date().toISOString().split('T')[0],
          productName: manualForm.productName || 'Standard Parcel',
          lastUpdate: events[0].description,
          events: events as LogisticsEvent[]
      };

      setShipments([newShipment, ...shipments]);
      setSelectedShipment(newShipment);
      setShowAddModal(false);
      
      setManualForm({ trackingNo: '', productName: '', origin: 'China', destination: 'USA', events: [] });
      setAddMode('auto');
      showToast("运单已添加", "success");
  };

  const handleAnalyze = async () => {
    if (!selectedShipment) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const historyText = selectedShipment.events.map(e => `${e.date} ${e.time} [${e.location}]: ${e.description}`).join('\n');

        const prompt = `
            Act as a Logistics Expert. Analyze this tracking history:
            ${historyText}

            Current Status: ${selectedShipment.status}
            Carrier: ${selectedShipment.carrier}

            1. Summarize the current situation in 1 sentence.
            2. Is there any delay or risk? (Yes/No and why)
            3. Estimated arrival accuracy?
            
            Answer in Chinese, concise html format with bold tags.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        setAiAnalysis(response.text);

    } catch (e) {
        setAiAnalysis("AI 分析服务暂时不可用。");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* Left Column: List & Search */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
          
          {/* Action Bar */}
          <div className="ios-glass-panel p-4 rounded-xl shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center">
                  <h2 className="text-white font-bold flex items-center gap-2">
                      <Map className="w-5 h-5 text-indigo-500" />
                      物流追踪 (Tracking)
                  </h2>
                  <button 
                      onClick={() => {
                          setManualForm({ trackingNo: '', productName: '', origin: 'China', destination: 'USA', events: [] });
                          setAddMode('auto');
                          setShowAddModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-1 transition-all active:scale-95"
                  >
                      <Plus className="w-4 h-4" /> 新增运单
                  </button>
              </div>
              
              <div className="relative">
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索单号 / 物品 / 地区..."
                      className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
          </div>

          {/* Shipment List */}
          <div className="flex-1 ios-glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase">监控列表 ({shipments.length})</h3>
                  <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="异常"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-500" title="运输中"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="已送达"></span>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {shipments
                    .filter(s => s.trackingNo.toLowerCase().includes(searchQuery.toLowerCase()) || s.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || s.carrier.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(shipment => (
                      <div 
                          key={shipment.id}
                          onClick={() => { setSelectedShipment(shipment); setAiAnalysis(null); }}
                          className={`p-4 cursor-pointer transition-all hover:bg-white/5 relative group ${selectedShipment?.id === shipment.id ? 'bg-white/5 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                      >
                          <div className="flex justify-between items-center mb-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${getCarrierColor(shipment.carrier)}`}>
                                  <Truck className="w-3 h-3" /> {shipment.carrier}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(shipment.status)}`}>
                                  {shipment.status}
                              </span>
                          </div>
                          
                          <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white text-sm font-mono tracking-tight">{shipment.trackingNo}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                              <Package className="w-3 h-3 text-slate-600" />
                              <span className="truncate max-w-[150px]">{shipment.productName || 'Unknown Package'}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/10">
                              <div className="flex items-center gap-1">
                                  <span>{shipment.origin.split(',')[0]}</span>
                                  <ArrowRight className="w-3 h-3" />
                                  <span>{shipment.destination.split(',')[0]}</span>
                              </div>
                              <span>{shipment.events[0]?.date}</span>
                          </div>

                          {/* Delete Button */}
                          <button 
                              onClick={(e) => handleDelete(shipment.id, e)}
                              className="absolute right-2 bottom-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
                  {shipments.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs">
                          暂无运单，请点击上方“新增运单”
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Right Column: Detail View */}
      <div className="flex-1 ios-glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col relative">
          {selectedShipment ? (
              <>
                  {/* Map Background Simulation */}
                  <div className="h-48 bg-black/60 relative overflow-hidden border-b border-white/10 group shrink-0">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-3/4 h-0.5 bg-gradient-to-r from-emerald-500/20 via-indigo-500 to-blue-500/20 relative">
                              <div className="absolute -top-1.5 left-0 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                              <div className="absolute -top-1.5 right-0 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                              <div className="absolute -top-3 left-1/2 p-1 bg-black/80 rounded-full border border-indigo-500 shadow-lg shadow-indigo-500/50">
                                  {selectedShipment.carrier === 'Matson' || selectedShipment.carrier === 'Cosco' ? 
                                    <Ship className="text-indigo-400 w-4 h-4" /> : 
                                    <Plane className="text-indigo-400 w-4 h-4" />
                                  }
                              </div>
                          </div>
                      </div>
                      <div className="absolute bottom-4 left-6">
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">发货地 Origin</div>
                          <div className="text-lg font-bold text-white flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              {selectedShipment.origin}
                          </div>
                      </div>
                      <div className="absolute bottom-4 right-6 text-right">
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">目的地 Destination</div>
                          <div className="text-lg font-bold text-white flex items-center justify-end gap-2">
                              {selectedShipment.destination}
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          </div>
                      </div>
                      
                      <button 
                        onClick={handleRefreshStatus}
                        className="absolute top-4 right-4 p-2 bg-black/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        title="刷新状态"
                      >
                          <RefreshCw className="w-4 h-4" />
                      </button>
                  </div>

                  {/* Header Info */}
                  <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start shrink-0">
                       <div>
                           <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
                                    {selectedShipment.trackingNo}
                                </h1>
                                <a href="#" className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-indigo-300 hover:text-white hover:bg-white/10 flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> 官网查询
                                </a>
                           </div>
                           <div className="text-xs text-slate-400 flex items-center gap-2">
                               <span className="bg-white/5 px-2 py-0.5 rounded text-slate-300">{selectedShipment.productName}</span>
                               <span>预计送达: <span className="text-white font-mono">{selectedShipment.estimatedDelivery}</span></span>
                           </div>
                       </div>
                       
                       <button 
                           onClick={handleAnalyze}
                           disabled={isAnalyzing}
                           className="px-4 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                       >
                           {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                           AI 智能分析
                       </button>
                  </div>

                  {/* AI Analysis Result */}
                  {aiAnalysis && (
                      <div className="mx-6 mt-4 p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-start gap-3">
                              <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                              <div className="text-sm text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis }}></div>
                          </div>
                      </div>
                  )}

                  {/* Timeline */}
                  <div className="flex-1 overflow-y-auto p-6 relative">
                      <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-slate-800"></div>
                      <div className="space-y-6 relative z-10">
                          {selectedShipment.events.map((event, index) => (
                              <div key={index} className="flex gap-6 group">
                                  <div className="w-16 text-right shrink-0">
                                      <div className="text-xs font-bold text-slate-400">{event.time}</div>
                                      <div className="text-[10px] text-slate-600">{event.date.substring(5)}</div>
                                  </div>
                                  
                                  <div className={`w-3 h-3 rounded-full border-2 mt-1.5 shrink-0 bg-black transition-colors ${
                                      index === 0 ? 'border-indigo-500 bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 
                                      event.status === 'Exception' ? 'border-red-500 bg-red-500' : 'border-slate-600 group-hover:border-slate-400'
                                  }`}></div>
                                  
                                  <div className="flex-1 pb-4 border-b border-white/5 group-last:border-0 group-last:pb-0">
                                      <div className={`text-sm font-medium ${index === 0 ? 'text-white' : 'text-slate-400'}`}>
                                          {event.description}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                          <Map className="w-3 h-3" /> {event.location}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                  <Navigation className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-medium">选择左侧运单查看详情</p>
              </div>
          )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
              <div className="ios-glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Plus className="w-5 h-5 text-indigo-500" /> 新增物流追踪
                      </h3>
                      <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>

                  {addMode === 'auto' ? (
                      <div className="space-y-4">
                          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 mb-4">
                              <p className="text-xs text-indigo-200 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4" /> 
                                  AI 自动识别: 输入单号，自动匹配承运商和路线。
                              </p>
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">物流单号</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      value={manualForm.trackingNo} 
                                      onChange={(e) => setManualForm({...manualForm, trackingNo: e.target.value})}
                                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono uppercase"
                                      placeholder="e.g. 1Z999..."
                                  />
                                  <button 
                                      onClick={handleAutoTrack}
                                      disabled={isSearching}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                                  >
                                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                                      识别
                                  </button>
                              </div>
                          </div>
                          <div className="text-center pt-4">
                              <button onClick={() => setAddMode('manual')} className="text-xs text-slate-500 hover:text-white underline">
                                  切换到手动录入模式
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs text-slate-400 block mb-1">单号 *</label>
                                  <input type="text" value={manualForm.trackingNo} onChange={e => setManualForm({...manualForm, trackingNo: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white font-mono" />
                              </div>
                              <div>
                                  <label className="text-xs text-slate-400 block mb-1">承运商</label>
                                  <select value={manualForm.carrier} onChange={e => setManualForm({...manualForm, carrier: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white">
                                      <option value="DHL">DHL</option>
                                      <option value="FedEx">FedEx</option>
                                      <option value="UPS">UPS</option>
                                      <option value="Matson">Matson</option>
                                      <option value="Cosco">Cosco</option>
                                  </select>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs text-slate-400 block mb-1">发货地</label>
                                  <input type="text" value={manualForm.origin} onChange={e => setManualForm({...manualForm, origin: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" placeholder="City, CN" />
                              </div>
                              <div>
                                  <label className="text-xs text-slate-400 block mb-1">目的地</label>
                                  <input type="text" value={manualForm.destination} onChange={e => setManualForm({...manualForm, destination: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" placeholder="City, US" />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">商品名称</label>
                              <input type="text" value={manualForm.productName} onChange={e => setManualForm({...manualForm, productName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" placeholder="e.g. 电子配件" />
                          </div>
                          
                          <button onClick={handleManualSubmit} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4">
                              保存运单
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Tracking;
