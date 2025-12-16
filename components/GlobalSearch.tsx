
import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, ShoppingCart, ArrowRight, Sparkles, Command, CornerDownLeft, Loader2 } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { Page } from '../types';

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { state } = useTanxing();

  // --- Keyboard Shortcuts ---
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

  // Focus input when opened
  useEffect(() => {
      if(isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // --- AI Command Logic ---
  const handleKeyDown = async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && query) {
          // If query is simple, just let the standard filter run.
          // If query looks like a command, use AI.
          if (query.length > 3 && !query.startsWith('#')) {
              await executeAiCommand();
          }
      }
  };

  const executeAiCommand = async () => {
      setIsAiProcessing(true);
      setAiSuggestion(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const prompt = `
            You are the Navigation Controller for an ERP system.
            Available Pages: dashboard, orders, finance, customers, tracking, marketing, intelligence (AI Lab), calendar, replenishment (TikTok List), suppliers, settings.
            
            User Intent: "${query}"
            
            Return a JSON object:
            {
                "action": "navigate" | "filter_products" | "filter_orders" | "unknown",
                "targetPage": "page_name" (if navigate),
                "filterKeyword": "string" (if filter),
                "reason": "Brief explanation in Chinese"
            }
            Example: "Check my sales" -> { "action": "navigate", "targetPage": "finance", "reason": "为您导航至财务页面" }
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-lite', // Use Flash-Lite for speed
              contents: prompt,
              config: { responseMimeType: "application/json" }
          });

          const result = JSON.parse(response.text || '{}');
          
          if (result.action === 'navigate' && result.targetPage) {
              setAiSuggestion(`✨ AI 导航: ${result.reason}`);
              setTimeout(() => {
                  setIsOpen(false);
              }, 1000);
          } else {
              setAiSuggestion(`✨ AI: ${result.reason || "已为您筛选结果"}`);
          }

      } catch (error) {
          console.error("AI Command Error", error);
      } finally {
          setIsAiProcessing(false);
      }
  };

  if (!isOpen) return null;

  // --- Standard Local Filtering ---
  const filteredProducts = state.products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredOrders = state.orders.filter(o => 
      o.id.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4 backdrop-blur-sm bg-black/60 transition-opacity duration-200" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
        
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className={`mr-4 transition-all duration-300 ${isAiProcessing ? 'text-indigo-500 animate-pulse' : 'text-slate-500'}`}>
              {isAiProcessing ? <Sparkles className="w-6 h-6" /> : <Command className="w-6 h-6" />}
          </div>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg font-medium"
            placeholder="搜索数据或输入 AI 指令 (如 '查看最近订单')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-2">
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">ESC 关闭</span>
              {query && <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded flex items-center gap-1"><CornerDownLeft className="w-3 h-3"/> 执行</span>}
          </div>
        </div>
        
        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {/* AI Feedback Banner */}
            {(isAiProcessing || aiSuggestion) && (
                <div className="mb-2 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    {isAiProcessing ? <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                    <span className="text-sm text-indigo-200">
                        {isAiProcessing ? "AI 正在解析您的意图..." : aiSuggestion}
                    </span>
                </div>
            )}

            {!query && !aiSuggestion && (
                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                    <Sparkles className="w-8 h-8 opacity-20" />
                    <p>您可以输入自然语言指令，Tanxing AI 将为您导航。</p>
                    <div className="flex gap-2 text-xs">
                        <span className="bg-slate-800 px-2 py-1 rounded">"跳转到财务总览"</span>
                        <span className="bg-slate-800 px-2 py-1 rounded">"显示最近的订单"</span>
                    </div>
                </div>
            )}

            {query && (
                <>
                    {filteredProducts.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                <span>相关产品 (Products)</span>
                                <span className="bg-slate-800 px-1.5 rounded text-[10px]">{filteredProducts.length}</span>
                            </div>
                            {filteredProducts.map(p => (
                                <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/80 cursor-pointer group transition-colors border border-transparent hover:border-slate-700">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Package className="w-5 h-5"/></div>
                                    <div className="flex-1">
                                        <div className="text-sm text-white font-bold flex items-center gap-2">
                                            {p.sku} 
                                            {p.stock < 10 && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded border border-red-500/20">缺货风险</span>}
                                        </div>
                                        <div className="text-xs text-slate-400">{p.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-300 font-mono">{p.stock} 件</div>
                                        <div className="text-[10px] text-slate-500">¥{p.price}</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredOrders.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                <span>相关订单 (Orders)</span>
                                <span className="bg-slate-800 px-1.5 rounded text-[10px]">{filteredOrders.length}</span>
                            </div>
                            {filteredOrders.map(o => (
                                <div key={o.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/80 cursor-pointer group transition-colors border border-transparent hover:border-slate-700">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><ShoppingCart className="w-5 h-5"/></div>
                                    <div className="flex-1">
                                        <div className="text-sm text-white font-bold">{o.id}</div>
                                        <div className="text-xs text-slate-400">{o.customerName}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                            o.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                            'bg-slate-700 text-slate-300 border-slate-600'
                                        }`}>
                                            {o.status}
                                        </span>
                                        <div className="text-[10px] text-slate-500 mt-0.5">¥{o.total}</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
        
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-500"/> Powered by Gemini 2.5 Flash-Lite</span>
            <div className="flex gap-4">
                <span>Tab 键选择</span>
                <span>Enter 键确认</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
