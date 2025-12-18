
import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, Sparkles, Send, Loader2, Cpu, Zap, Activity, 
  Trash2, Play, CheckCircle2, AlertTriangle, MessageSquare, Mic, StopCircle
} from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { useTanxing } from '../context/TanxingContext';

interface CommandLog {
    id: string;
    timestamp: string;
    input: string;
    aiResponse: string;
    status: 'parsing' | 'executing' | 'success' | 'error';
    details?: string;
}

const AICommandCenter: React.FC = () => {
    const { state, dispatch, showToast, logEvent } = useTanxing();
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<CommandLog[]>([]);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [logs, isProcessing]);

    // --- Function Definitions for Gemini ---
    const toolDeclarations: FunctionDeclaration[] = [
        {
            name: 'update_inventory_stock',
            parameters: {
                type: Type.OBJECT,
                description: '更新指定 SKU 商品的库存数量。',
                properties: {
                    sku: { type: Type.STRING, description: '商品的 SKU 编号' },
                    change: { type: Type.NUMBER, description: '变化量，正数为增加，负数为减少' }
                },
                required: ['sku', 'change']
            }
        },
        {
            name: 'create_operation_task',
            parameters: {
                type: Type.OBJECT,
                description: '为团队成员创建一个新的运营协作任务。',
                properties: {
                    title: { type: Type.STRING, description: '任务标题' },
                    assignee: { type: Type.STRING, description: '负责人姓名' },
                    priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'], description: '优先级' },
                    category: { type: Type.STRING, enum: ['procurement', 'logistics', 'marketing', 'finance'], description: '业务领域' }
                },
                required: ['title', 'assignee', 'priority']
            }
        }
    ];

    const handleExecute = async () => {
        if (!input.trim() || isProcessing) return;

        const commandInput = input;
        const logId = Date.now().toString();
        setInput('');
        setIsProcessing(true);

        const newLog: CommandLog = {
            id: logId,
            timestamp: new Date().toLocaleTimeString(),
            input: commandInput,
            aiResponse: 'AI 正在解析指令...',
            status: 'parsing'
        };
        setLogs(prev => [...prev, newLog]);

        try {
            if (!process.env.API_KEY) throw new Error("API Key 未配置");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: commandInput }] }],
                config: {
                    tools: [{ functionDeclarations: toolDeclarations }],
                    systemInstruction: "你是一个专业的 ERP 指令中心。请根据用户输入，精准调用相应的函数。如果是更新库存，必须识别 SKU。如果是创建任务，必须识别负责人和优先级。如果用户输入不明确，请要求补充信息，不要编造参数。"
                }
            });

            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'executing', aiResponse: '指令解析成功，正在执行原子操作...' } : l));
                
                let successDetails = [];

                for (const call of functionCalls) {
                    const args = call.args as any;
                    
                    if (call.name === 'update_inventory_stock') {
                        const product = state.products.find(p => p.sku === args.sku);
                        if (product) {
                            const updated = { ...product, stock: Math.max(0, product.stock + args.change), lastUpdated: new Date().toISOString() };
                            dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
                            const detail = `✅ SKU ${args.sku} 库存已${args.change > 0 ? '增加' : '减少'} ${Math.abs(args.change)} 件`;
                            successDetails.push(detail);
                            logEvent('AI_INVENTORY_UPDATE', `AI Command: ${commandInput} | SKU: ${args.sku}, Change: ${args.change}`);
                        } else {
                            throw new Error(`未找到 SKU: ${args.sku}`);
                        }
                    }

                    if (call.name === 'create_operation_task') {
                        const newTask = {
                            id: `T-${Date.now()}`,
                            title: args.title,
                            assignee: args.assignee,
                            priority: args.priority as any,
                            status: 'todo' as any,
                            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                            category: args.category || 'procurement'
                        };
                        dispatch({ type: 'ADD_TASK', payload: newTask });
                        const detail = `✅ 任务已创建: ${args.title} (负责人: ${args.assignee})`;
                        successDetails.push(detail);
                        logEvent('AI_TASK_CREATE', `AI Command: ${commandInput} | Task: ${args.title}, Owner: ${args.assignee}`);
                    }
                }

                setLogs(prev => prev.map(l => l.id === logId ? { 
                    ...l, 
                    status: 'success', 
                    aiResponse: '指令执行完毕。', 
                    details: successDetails.join('\n') 
                } : l));
                showToast('AI 指令执行成功', 'success');

            } else {
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', aiResponse: response.text || '解析失败。' } : l));
            }

        } catch (error: any) {
            setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', aiResponse: `执行失败: ${error.message}` } : l));
            showToast(`执行错误: ${error.message}`, 'error');
            logEvent('AI_COMMAND_ERROR', `Input: ${commandInput}, Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                        <Terminal className="w-8 h-8 text-indigo-400" />
                        AI 量子控制中心
                    </h1>
                    <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-500 animate-pulse"/> 意图驱动架构已激活 • 支持自然语言 SKU 与任务控制
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-300 uppercase">Gemini 3 Pro Engine v2.0</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-12 lg:col-span-8 bg-black/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl relative">
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
                    
                    <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center relative z-20">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">指令执行流 (Execution Flow)</span>
                        </div>
                        <button onClick={() => setLogs([])} className="p-1.5 hover:bg-white/10 rounded text-slate-600 hover:text-white transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-6 relative z-20 scrollbar-none" ref={scrollRef}>
                        {logs.length === 0 && !isProcessing && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-4">
                                <Terminal className="w-16 h-16" />
                                <p className="text-xs uppercase tracking-tighter">等待输入... 请键入业务指令开始</p>
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="animate-in fade-in slide-in-from-left-2 duration-300 border-l-2 border-indigo-500/20 pl-4 py-1">
                                <div className="flex items-center gap-3 text-xs mb-2">
                                    <span className="text-indigo-400 font-bold">[{log.timestamp}]</span>
                                    <span className="text-slate-500 uppercase">User_INTENT:</span>
                                    <span className="text-white font-bold">{log.input}</span>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        {log.status === 'parsing' && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />}
                                        {log.status === 'executing' && <Zap className="w-3 h-3 text-blue-400 animate-pulse" />}
                                        {log.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                        {log.status === 'error' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                                        <span className={`text-[10px] font-bold uppercase ${log.status === 'error' ? 'text-red-400' : 'text-slate-400'}`}>AI_STATUS: {log.status}</span>
                                    </div>
                                    <p className="text-indigo-100 text-xs leading-relaxed">{log.aiResponse}</p>
                                    {log.details && (
                                        <pre className="mt-3 text-[10px] text-emerald-400/80 leading-relaxed whitespace-pre-wrap bg-emerald-500/5 p-2 rounded">
                                            {log.details}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex items-center gap-3 text-xs text-indigo-400 animate-pulse">
                                <span>&gt;</span>
                                <span>量子神经元正在处理中...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-black/60 border-t border-white/10 relative z-30">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-focus-within:bg-indigo-500/10 transition-all rounded-2xl"></div>
                            <div className="relative flex gap-3">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleExecute()}
                                        placeholder="键入指令 (例如：增加 SKU-MA001 的库存 20件)..."
                                        className="w-full bg-black/40 border border-white/20 focus:border-indigo-500/60 rounded-2xl px-6 py-4 text-sm text-white outline-none transition-all placeholder:text-slate-700"
                                    />
                                    <div className="absolute right-4 top-4 flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsListening(!isListening)}
                                            className={`p-1 transition-all ${isListening ? 'text-red-500 scale-125' : 'text-slate-600 hover:text-white'}`}
                                        >
                                            {isListening ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleExecute}
                                    disabled={!input.trim() || isProcessing}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl px-8 font-bold transition-all shadow-lg flex items-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                    执行
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:col-span-4 flex flex-col gap-6">
                    <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">指令控制说明</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 h-fit"><Zap className="w-4 h-4"/></div>
                                <div>
                                    <div className="text-xs font-bold text-white mb-1">意图识别</div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">系统会自动识别您提到的负责人、SKU 和动作，无需遵循固定语法。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
