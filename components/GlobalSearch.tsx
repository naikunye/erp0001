import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, ArrowRight, Sparkles, Command, CornerDownLeft, Loader2, ShoppingCart, Truck, History } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { state, dispatch } = useTanxing();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
      if(isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && query) {
          if (query.length > 3 && !query.startsWith('#')) {
              await executeAiCommand();
          }
      }
  };

  const executeAiCommand = async () => {
      setIsAiProcessing(true);
      setAiSuggestion(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `你是一个 ERP 导航控制中心。
          可用页面: dashboard, finance, customers, tracking, marketing, intelligence, calendar, inventory, suppliers, settings.
          用户意图: "${query}"
          返回 JSON: { "action": "navigate" | "unknown", "targetPage": "页面名", "reason": "中文解释" }`;

          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview', 
              contents: prompt,
              config: { responseMimeType: "application/json" }
          });

          const result = JSON.parse(response.text || '{}');
          if (result.action === 'navigate' && result.targetPage) {
              setAiSuggestion(`✨ AI 导航: ${result.reason}`);
              setTimeout(() => {
                  dispatch({ type: 'NAVIGATE', payload: { page: result.targetPage } });
                  setIsOpen(false);
              }, 800);
          } else {
              setAiSuggestion(`✨ AI: 系统未识别到明确跳转指令`);
          }
      } catch (error) {
          console.error("AI Command Error", error);
      } finally {
          setIsAiProcessing(false);
      }
  };

  if (!isOpen) return null;

  // 跨表检索逻辑
  const products = (state.products || []).filter(p => !p.deletedAt && (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))).slice(0, 3);
  const orders = (state.orders || []).filter(o => !o.deletedAt && (o.id.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase()))).slice(0, 3);
  const shipments = (state.shipments || []).filter(s => s.trackingNo.toLowerCase().includes(query.toLowerCase()) || s.productName?.toLowerCase().includes(query.toLowerCase())).slice(0, 3);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4 backdrop-blur-sm bg-black/60 transition-opacity duration-200" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className={`mr-4 transition-all duration-300 ${isAiProcessing ? 'text-indigo-500 animate-pulse' : 'text-slate-500'}`}>
              {isAiProcessing ? <Sparkles className="w-6 h-6" /> : <Command className="w-6 h-6" />}
          </div>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-600 text-lg font-bold"
            placeholder="检索 SKU、运单、客户或键入语义指令..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-2">
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-black uppercase">ESC 关闭</span>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar space-y-4">
            {(isAiProcessing || aiSuggestion) && (
                <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    {isAiProcessing ? <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                    <span className="text-sm text-indigo-200 font-bold">{isAiProcessing ? "正在对全域节点进行语义解析..." : aiSuggestion}</span>
                </div>
            )}

            {!query && !aiSuggestion && (
                <div className="p-10 text-center text-slate-500 text-sm flex flex-col items-center gap-4 italic">
                    <History className="w-10 h-10 opacity-10" />
                    <p className="font-bold opacity-40 uppercase tracking-widest text-xs">Awaiting Global Query Matrix Input</p>
                </div>
            )}

            {query && (
                <div className="space-y-4">
                    {products.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">资产库 (Products)</div>
                            {products.map(p => (
                                <div key={p.id} onClick={() => { dispatch({type:'NAVIGATE', payload:{page:'inventory'}}); setIsOpen(false); }} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 cursor-pointer group transition-all border border-transparent hover:border-white/5">
                                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20"><Package className="w-5 h-5"/></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white font-black font-mono">{p.sku}</div>
                                        <div className="text-xs text-slate-500 truncate">{p.name}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-emerald-400 font-mono font-bold">{p.stock} units</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {orders.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">业务单据 (Orders)</div>
                            {orders.map(o => (
                                <div key={o.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5">
                                    <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20"><ShoppingCart className="w-5 h-5"/></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white font-black font-mono">{o.id}</div>
                                        <div className="text-xs text-slate-500 truncate">{o.customerName}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-violet-300 font-mono font-bold">¥{o.total?.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {shipments.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">物流轨迹 (Logistics)</div>
                            {shipments.map(s => (
                                <div key={s.id} onClick={() => { dispatch({type:'NAVIGATE', payload:{page:'tracking'}}); setIsOpen(false); }} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5">
                                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20"><Truck className="w-5 h-5"/></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white font-black font-mono">{s.trackingNo}</div>
                                        <div className="text-xs text-slate-500 truncate">{s.productName}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-blue-300 font-black uppercase px-2 py-0.5 rounded border border-blue-500/30">{s.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-600 flex justify-between items-center font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2 italic"><Sparkles className="w-3 h-3 text-indigo-500"/> Core Intelligence v5.0</span>
            <div className="flex gap-6">
                <span>Tab 键穿透</span>
                <span>Enter 执行</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;