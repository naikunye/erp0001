
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Brain, Zap, Globe, MapPin, Image as ImageIcon, Video, Mic, 
  Speaker, Upload, Sparkles, Loader2, Send, Play, Square, Pause,
  Maximize2, RefreshCw, Download, AlertCircle, Wand2, Film, StopCircle,
  ClipboardCheck, ShoppingCart, Mail, ArrowRight
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useTanxing } from '../context/TanxingContext';

const AI_AGENTS = [
    { id: 'procure', name: '采购助手', desc: '根据库存预警草拟采购合同', icon: ShoppingCart, color: 'text-orange-400' },
    { id: 'marketing', name: '邮件营销', desc: '生成海外达人外联模版', icon: Mail, color: 'text-indigo-400' },
    { id: 'audit', name: '风险审计', desc: '深度检查本月财务异常点', icon: ClipboardCheck, color: 'text-emerald-400' }
];

const OmniChat = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [mode, setMode] = useState('standard');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{role: 'user'|'model', text: string, actions?: any[]}[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: userText }] }]
            });

            // 模拟 AI Agent 逻辑：如果提到补货或邮件，注入 Action Card
            let actions = undefined;
            if (userText.includes('补货') || userText.includes('库存')) {
                actions = [{ id: 'nav_inv', label: '前往备货中心', page: 'inventory' }];
            }

            setMessages(prev => [...prev, { role: 'model', text: response.text || "无响应内容。", actions }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "AI 暂时无法连接。" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-6 h-full">
            <div className="flex-1 flex flex-col bg-black/20 rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-white/5'}`}>
                                {msg.text}
                            </div>
                            {msg.actions && (
                                <div className="mt-3 flex gap-2">
                                    {msg.actions.map(act => (
                                        <button 
                                            key={act.id}
                                            onClick={() => dispatch({ type: 'NAVIGATE', payload: { page: act.page } })}
                                            className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-500 hover:text-white transition-all"
                                        >
                                            {act.label} <ArrowRight className="w-3 h-3" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && <div className="flex items-center gap-2 text-slate-500 text-xs"><Loader2 className="w-4 h-4 animate-spin"/> AI Agent 正在介入...</div>}
                </div>
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex gap-3">
                        <input 
                            value={input} 
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" 
                            placeholder="下达智能指令..." 
                        />
                        <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-xl"><Send className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>

            <div className="w-80 flex flex-col gap-4">
                <div className="ios-glass-card p-5">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">智能插件集 (Agents)</h3>
                    <div className="space-y-3">
                        {AI_AGENTS.map(agent => (
                            <button key={agent.id} className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-xl hover:border-indigo-500/50 transition-all group">
                                <div className="flex items-center gap-3 mb-1">
                                    <agent.icon className={`w-4 h-4 ${agent.color}`} />
                                    <span className="text-xs font-bold text-white">{agent.name}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">{agent.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Intelligence: React.FC = () => {
  return (
    <div className="h-[calc(100vh-6rem)]">
        <OmniChat />
    </div>
  );
};

export default Intelligence;
