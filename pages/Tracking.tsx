
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Map, Truck, Package, Clock, AlertTriangle, 
  CheckCircle2, Plus, ArrowRight, Loader2, Bot, Sparkles, Navigation,
  Trash2, RefreshCw, MoreHorizontal, FileText, Save, X, Globe,
  AlertOctagon, Plane, Ship, AlertCircle, DollarSign, Zap, Anchor, Shield,
  Edit2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Shipment, LogisticsEvent } from '../types';
import { useTanxing } from '../context/TanxingContext';

const Tracking: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const shipments = state.shipments; 

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'auto' | 'manual' | 'edit'>('auto');
  
  // Route Planner State
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [plannerForm, setPlannerForm] = useState({ origin: 'Shenzhen, CN', destination: 'Los Angeles, US', weight: 20 });
  const [routeOptions, setRouteOptions] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Loading States
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState<Partial<Shipment>>({
      trackingNo: '',
      carrier: 'DHL',
      status: 'In Transit',
      origin: 'China',
      destination: 'USA',
      productName: '',
      estimatedDelivery: '',
      notes: '',
      events: []
  });

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

  const shipmentProgress = useMemo(() => {
      if (!selectedShipment) return 0;
      if (selectedShipment.status === 'Delivered') return 100;
      if (selectedShipment.status === 'Pending') return 5;
      const eventCount = selectedShipment.events.length;
      return Math.min(90, Math.max(10, eventCount * 20));
  }, [selectedShipment]);

  // --- Handlers ---

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('确定要删除这条物流记录吗?')) {
          dispatch({ type: 'DELETE_SHIPMENT', payload: id });
          if (selectedShipment?.id === id) {
              const remaining = shipments.filter(s => s.id !== id);
              setSelectedShipment(remaining.length > 0 ? remaining[0] : null);
          }
          showToast('物流记录已删除', 'info');
      }
  };

  const handleEditClick = () => {
      if (!selectedShipment) return;
      setManualForm({
          trackingNo: selectedShipment.trackingNo,
          carrier: selectedShipment.carrier,
          status: selectedShipment.status,
          origin: selectedShipment.origin,
          destination: selectedShipment.destination,
          productName: selectedShipment.productName,
          estimatedDelivery: selectedShipment.estimatedDelivery,
          notes: selectedShipment.notes || '',
          events: selectedShipment.events
      });
      setAddMode('edit');
      setShowAddModal(true);
  };

  const handleRefreshStatus = async () => {
      if (!selectedShipment) return;
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const now = new Date();
      const newEvent: LogisticsEvent = {
          date: now.toISOString().split('T')[0],
          time: now.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}),
          location: selectedShipment.destination.split(',')[0] + ' Dist. Center',
          description: 'Arrived at Distribution Facility',
          status: 'InTransit'
      };

      const updatedShipment = {
          ...selectedShipment,
          lastUpdate: newEvent.description,
          events: [newEvent, ...selectedShipment.events]
      };

      dispatch({ type: 'UPDATE_SHIPMENT', payload: updatedShipment });
      setSelectedShipment(updatedShipment); 
      showToast('状态已更新: Arrived at Distribution Facility', 'success');
      setIsRefreshing(false);
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

      if (addMode === 'edit' && selectedShipment) {
           const updatedShipment: Shipment = {
              ...selectedShipment,
              trackingNo: manualForm.trackingNo || selectedShipment.trackingNo,
              carrier: manualForm.carrier as any,
              status: manualForm.status as any,
              origin: manualForm.origin!,
              destination: manualForm.destination!,
              estimatedDelivery: manualForm.estimatedDelivery || selectedShipment.estimatedDelivery,
              productName: manualForm.productName || selectedShipment.productName,
              notes: manualForm.notes || '',
           };
           dispatch({ type: 'UPDATE_SHIPMENT', payload: updatedShipment });
           setSelectedShipment(updatedShipment);
           showToast("运单信息已更新", "success");
      } else {
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
              events: events as LogisticsEvent[],
              notes: manualForm.notes || ''
          };

          dispatch({ type: 'ADD_SHIPMENT', payload: newShipment });
          setSelectedShipment(newShipment);
          showToast("运单已添加", "success");
      }

      setShowAddModal(false);
      setManualForm({ trackingNo: '', productName: '', origin: 'China', destination: 'USA', notes: '', events: [] });
      setAddMode('auto');
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

  const handleOptimizeRoute = async () => {
      if (!plannerForm.origin || !plannerForm.destination) {
          showToast("请完善起止地点", "warning");
          return;
      }
      setIsOptimizing(true);
      setRouteOptions([]);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const prompt = `
            Act as a Logistics Expert. 
            Task: Recommend 3 optimal shipping routes for a package.
            Details:
            - Origin: ${plannerForm.origin}
            - Destination: ${plannerForm.destination}
            - Weight: ${plannerForm.weight} kg
            
            Provide 3 distinct options: 
            1. Fastest (Air Express)
            2. Cheapest (Sea Freight/Economy)
            3. Balanced (Air Freight/Standard)

            Return strictly a JSON array of objects with this schema:
            [
              {
                "type": "Fastest" | "Cheapest" | "Balanced",
                "carrier": "Carrier Name (e.g. DHL, Matson)",
                "method": "Air" | "Sea" | "Rail",
                "estimatedCost": "Number (USD)",
                "transitTime": "String (e.g. 3-5 days)",
                "riskScore": "Number (1-10, 1 is safe)",
                "reasoning": "Brief explanation in Chinese"
              }
            ]
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: "application/json" }
          });

          const data = JSON.parse(response.text || '[]');
          setRouteOptions(data);

      } catch (error) {
          showToast("AI 规划服务暂时不可用", "error");
      } finally {
          setIsOptimizing(false);
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
                  <div className="flex gap-2">
                      <button 
                          onClick={() => setShowPlannerModal(true)}
                          className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          title="AI 智能路由规划"
                      >
                          <Sparkles className="w-3.5 h-3.5" /> 智能路由
                      </button>
                      <button 
                          onClick={() => {
                              setManualForm({ trackingNo: '', productName: '', origin: 'China', destination: 'USA', notes: '', events: [] });
                              setAddMode('auto');
                              setShowAddModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-1 transition-all active:scale-95"
                      >
                          <Plus className="w-4 h-4" /> 新增运单
                      </button>
                  </div>
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
                          <div className="w-3/4 h-0.5 bg-slate-800 relative rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-500 transition-all duration-1000 ease-out relative"
                                style={{ width: `${shipmentProgress}%` }}
                              >
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                              </div>
                          </div>
                          
                          <div className="absolute left-[10%] top-1/2 -translate-y-1/2 -mt-4">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full mb-1 mx-auto shadow-[0_0_10px_#10b981]"></div>
                          </div>
                          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 -mt-4">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mb-1 mx-auto shadow-[0_0_10px_#3b82f6]"></div>
                          </div>
                          
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 -mt-6 transition-all duration-1000 ease-out"
                            style={{ left: `calc(12.5% + ${shipmentProgress * 0.75}%)` }}
                          >
                              <div className="p-1 bg-black/80 rounded-full border border-indigo-500 shadow-lg shadow-indigo-500/50">
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
                        disabled={isRefreshing}
                        className="absolute top-4 right-4 p-2 bg-black/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors backdrop-blur-sm shadow-lg active:scale-95"
                        title="刷新状态"
                      >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                      </button>
                  </div>

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
                               <div className="flex items-center gap-2">
                                   <span className="bg-white/5 px-2 py-0.5 rounded text-slate-300">{selectedShipment.productName}</span>
                                   <span>预计送达: <span className="text-white font-mono">{selectedShipment.estimatedDelivery}</span></span>
                               </div>
                               {selectedShipment.notes && (
                                   <div className="mt-2 text-xs text-slate-400 bg-white/5 p-2 rounded border border-white/5">
                                       <span className="font-bold text-slate-500 mr-1">备注:</span>
                                       {selectedShipment.notes}
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
                              <div key={index} className="flex gap-6 group animate-in slide-in-from-bottom-2 duration-500" style={{animationDelay: `${index * 100}ms`}}>
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

      {/* Route Planner Modal */}
      {showPlannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowPlannerModal(false)}>
              <div className="ios-glass-panel w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                          AI 智能物流规划 (Route Optimizer)
                      </h3>
                      <button onClick={() => setShowPlannerModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                      {/* Input Section */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                          <div className="md:col-span-1">
                              <label className="text-xs text-slate-400 block mb-1">发货地 Origin</label>
                              <input 
                                type="text" value={plannerForm.origin} 
                                onChange={e => setPlannerForm({...plannerForm, origin: e.target.value})} 
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                              />
                          </div>
                          <div className="md:col-span-1">
                              <label className="text-xs text-slate-400 block mb-1">目的地 Destination</label>
                              <input 
                                type="text" value={plannerForm.destination} 
                                onChange={e => setPlannerForm({...plannerForm, destination: e.target.value})} 
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                              />
                          </div>
                          <div className="md:col-span-1">
                              <label className="text-xs text-slate-400 block mb-1">预估重量 (kg)</label>
                              <input 
                                type="number" value={plannerForm.weight} 
                                onChange={e => setPlannerForm({...plannerForm, weight: Number(e.target.value)})} 
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                              />
                          </div>
                          <div className="md:col-span-1 flex items-end">
                              <button 
                                onClick={handleOptimizeRoute}
                                disabled={isOptimizing}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                              >
                                  {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                                  {isOptimizing ? 'AI 计算中...' : '生成方案'}
                              </button>
                          </div>
                      </div>

                      {/* Results Section */}
                      {routeOptions.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {routeOptions.map((opt, idx) => (
                                  <div key={idx} className="ios-glass-card p-5 hover:border-indigo-500/30 transition-all group flex flex-col">
                                      <div className="flex justify-between items-start mb-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                              opt.type === 'Fastest' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                              opt.type === 'Cheapest' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                          }`}>
                                              {opt.type === 'Fastest' ? <Zap className="w-3 h-3 inline mr-1"/> : opt.type === 'Cheapest' ? <Anchor className="w-3 h-3 inline mr-1"/> : <Truck className="w-3 h-3 inline mr-1"/>}
                                              {opt.type}
                                          </span>
                                          <div className="text-right">
                                              <div className="text-xl font-bold text-white font-mono">{opt.estimatedCost}</div>
                                              <div className="text-[10px] text-slate-500">预估成本</div>
                                          </div>
                                      </div>
                                      
                                      <div className="mb-4">
                                          <div className="text-lg font-bold text-white mb-1">{opt.carrier}</div>
                                          <div className="text-xs text-slate-400 flex items-center gap-2">
                                              {opt.method === 'Air' ? <Plane className="w-3 h-3" /> : <Ship className="w-3 h-3" />}
                                              {opt.method} Freight
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 mb-4 bg-black/20 p-2 rounded-lg text-xs">
                                          <div>
                                              <span className="text-slate-500 block">时效</span>
                                              <span className="text-white font-mono">{opt.transitTime}</span>
                                          </div>
                                          <div>
                                              <span className="text-slate-500 block">风险指数</span>
                                              <span className={`font-mono font-bold ${opt.riskScore > 5 ? 'text-red-400' : 'text-emerald-400'}`}>{opt.riskScore}/10</span>
                                          </div>
                                      </div>

                                      <div className="mt-auto pt-4 border-t border-white/5">
                                          <p className="text-xs text-slate-400 leading-relaxed">
                                              <span className="text-indigo-400 font-bold">AI 推荐: </span>
                                              {opt.reasoning}
                                          </p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/10 rounded-xl">
                              <Navigation className="w-12 h-12 mb-3 opacity-20" />
                              <p className="text-sm">输入参数并点击“生成方案”以获取 AI 建议</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
              <div className="ios-glass-panel w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Plus className="w-5 h-5 text-indigo-500" /> {addMode === 'edit' ? '编辑运单信息' : '新增物流追踪'}
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
                          
                          {/* NEW: Status & Date inputs for manual/edit mode */}
                          <div className="grid grid-cols-2 gap-4">
                               <div>
                                    <label className="text-xs text-slate-400 block mb-1">当前状态</label>
                                    <select value={manualForm.status} onChange={e => setManualForm({...manualForm, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white">
                                        <option value="In Transit">In Transit</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Exception">Exception</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                               </div>
                               <div>
                                    <label className="text-xs text-slate-400 block mb-1">预计送达</label>
                                    <input type="date" value={manualForm.estimatedDelivery} onChange={e => setManualForm({...manualForm, estimatedDelivery: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                               </div>
                          </div>

                          {/* Remarks / Notes field */}
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">备注 (商品明细/特殊说明)</label>
                              <textarea 
                                  value={manualForm.notes} 
                                  onChange={e => setManualForm({...manualForm, notes: e.target.value})} 
                                  className="w-full h-20 bg-black/40 border border-white/10 rounded p-2 text-sm text-white resize-none"
                                  placeholder="例如：包含 100件 SKU-A, 50件 SKU-B..."
                              />
                          </div>
                          
                          <button onClick={handleManualSubmit} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4">
                              {addMode === 'edit' ? '更新运单' : '保存运单'}
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
