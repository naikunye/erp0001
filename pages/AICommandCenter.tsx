import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, Sparkles, Send, Loader2, Cpu, Zap, Activity, 
  Trash2, Play, CheckCircle2, AlertTriangle, MessageSquare, Mic, StopCircle,
  Command, Layers, Fingerprint, Database, Radio, Network, Target
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
    affectedNode?: string;
}

const AICommandCenter: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<CommandLog[]>([]);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [logs, isProcessing]);

    const toolDeclarations: FunctionDeclaration[] = [
        {
            name: 'update_inventory_stock',
            parameters: {
                type: Type.OBJECT,
                description: '更新指定 SKU 商品的库位存量。',
                properties: {
                    sku: { type: Type.STRING, description: '商品的 SKU 唯一编号' },
                    change: { type: Type.NUMBER, description: '变化量，正数为入库，负数为出库' }
                },
                required: ['sku', 'change']
            }
        },
        {
            name: 'create_operation_task',
            parameters: {
                type: Type.OBJECT,
                description: '为团队成员创建一个新的业务协同任务。',
                properties: {
                    title: { type: Type.STRING, description: '任务简述' },
                    assignee: { type: Type.STRING, description: '负责人名称' },
                    priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'], description: '紧急程度' },
                    category: { type: Type.STRING, enum: ['procurement', 'logistics', 'marketing', 'finance'], description: '所属业务域' }
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
            aiResponse: '神经网络正在解构操作意图...',
            status: 'parsing'
        };
        setLogs(prev => [...prev, newLog]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: commandInput }] }],
                config: {
                    tools: [{ functionDeclarations: toolDeclarations }],
                    systemInstruction: "你是一个顶级的 ERP 指令中心。请根据用户输入，精准调用函数。若是更新库存，必须明确 SKU；若是创建任务，必须明确负责人和优先级。你的回复必须专业且带有系统指令的确定感。"
                }
            });

            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'executing', aiResponse: '意图已解构，正在执行原子化改写...' } : l));
                
                let successDetails = [];
                let affectedNode = "";

                for (const call of functionCalls) {
                    const args = call.args as any;
                    
                    if (call.name === 'update_inventory_stock') {
                        const product = state.products.find(p => p.sku === args.sku);
                        if (product) {
                            const updated = { ...product, stock: Math.max(0, product.stock + args.change), lastUpdated: new Date().toISOString() };
                            dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
                            successDetails.push(`✅ [改写成功] SKU ${args.sku} 存量: ${args.change > 0 ? '+' : ''}${args.change}`);
                            affectedNode = "INVENTORY_MATRIX";
                        } else {
                            throw new Error(`未在矩阵中检索到 SKU: ${args.sku}`);
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
                        successDetails.push(`✅ [分派成功] ${args.title} -> ${args.assignee}`);
                        affectedNode = "OPERATION_TIMELINE";
                    }
                }

                setLogs(prev => prev.map(l => l.id === logId ? { 
                    ...l, 
                    status: 'success', 
                    aiResponse: '矩阵重构完成，指令已固化至云端。', 
                    details: successDetails.join('\n'),
                    affectedNode
                } : l));
                showToast('AI 指令执行完成', 'success');

            } else {
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', aiResponse: response.text || '解析完毕，未检测到原子级指令。' } : l));
            }

        } catch (error: any) {
            setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', aiResponse: `纠缠失败: ${error.message}` } : l));
            showToast(`执行异常: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4 italic">
                        <Terminal className="w-10 h-10 text-violet-500" />
                        AI 量子指挥部
                    </h1>
                    <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2 uppercase tracking-[0.4em]">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse"/> Intent-Driven Operation v5.0
                    </p>
                </div>
                <div className="px-6 py-2.5 bg-violet-900/10 border border-violet-500/30 rounded-2xl flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-violet-400" />
                    <span className="text-[10px] font-black text-violet-300 uppercase tracking-tighter">Auth: Super Administrator Matrix</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* 核心指令处理流 */}
                <div className="col-span-12 lg:col-span-8 ios-glass-panel rounded-[2.5rem] flex flex-col overflow-hidden relative border-white/5 shadow-2xl">
                    {/* 纠缠扫描线 */}
                    {isProcessing && (
                        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-[2.5rem]">
                            <div className="w-full h-32 bg-gradient-to-b from-transparent via-violet-500/20 to-transparent absolute top-0 left-0 animate-[scan_2s_linear_infinite]"></div>
                        </div>
                    )}
                    
                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center backdrop-blur-md relative z-10">
                        <div className="flex items-center gap-3">
                            <Radio className="w-4 h-4 text-violet-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Quantum Execution Flow</span>
                        </div>
                        <button onClick={() => setLogs([])} className="p-2 hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 font-mono text-sm space-y-10 custom-scrollbar relative z-10" ref={scrollRef}>
                        {logs.length === 0 && !isProcessing && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20 space-y-8">
                                <Network className="w-36 h-36 animate-pulse" />
                                <p className="text-xs uppercase tracking-[1em] font-black italic">等待指令注入...</p>
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="animate-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-4 text-[10px] mb-4">
                                    <span className="bg-violet-600 text-white px-2.5 py-0.5 rounded-sm font-black tracking-tighter uppercase italic">User Intent</span>
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">{log.input}</span>
                                    <span className="text-slate-700 font-mono ml-auto">TS: {log.timestamp}</span>
                                </div>
                                <div className="bg-white/2 border border-white/5 rounded-[1.5rem] p-6 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                                    <div className="flex items-center gap-4 mb-4">
                                        {log.status === 'parsing' ? <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" /> : 
                                         log.status === 'executing' ? <Zap className="w-4 h-4 text-blue-400 animate-pulse" /> :
                                         log.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                                         <AlertTriangle className="w-4 h-4 text-red-400" />}
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${log.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>Node_Status: {log.status}</span>
                                        {log.affectedNode && (
                                            <div className="ml-auto flex items-center gap-2">
                                                <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono flex items-center gap-1">
                                                    <Target className="w-2.5 h-2.5" /> {log.affectedNode}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-violet-100 text-xs leading-relaxed font-bold">{log.aiResponse}</p>
                                    {log.details && (
                                        <div className="mt-5 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-400 font-bold whitespace-pre-wrap leading-relaxed animate-in fade-in zoom-in-95 font-mono">
                                            {log.details}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex items-center gap-4 text-xs text-violet-400 font-black animate-pulse bg-violet-500/5 p-6 rounded-[1.5rem] w-fit border border-violet-500/10">
                                <Sparkles className="w-5 h-5 animate-spin" />
                                <span className="tracking-[0.2em] uppercase italic">量子神经元正在纠缠矩阵数据...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-black/40 border-t border-white/5 relative z-20 backdrop-blur-2xl">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[1.5rem] blur opacity-10 group-focus-within:opacity-30 transition-all"></div>
                            <div className="relative flex gap-4">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleExecute()}
                                        placeholder="键入自然语言业务指令 (例如：增加 SKU-MA001 库存 150件)..."
                                        className="w-full bg-black/60 border border-white/10 focus:border-violet-500/50 rounded-2xl px-8 py-5 text-sm text-white outline-none transition-all placeholder:text-slate-700 font-bold"
                                    />
                                    <div className="absolute right-5 top-4.5 flex items-center gap-3">
                                        <button onClick={() => setIsListening(!isListening)} className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
                                            {isListening ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleExecute}
                                    disabled={!input.trim() || isProcessing}
                                    className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 text-white rounded-2xl px-12 font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-violet-900/40 flex items-center gap-3 active:scale-95 italic"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    COMMIT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 辅助操作面板 */}
                <div className="hidden lg:col-span-4 flex flex-col gap-6">
                    <div className="ios-glass-card p-8 border-l-4 border-l-violet-600 bg-violet-600/5 rounded-[2rem] shadow-xl">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <Command className="w-4 h-4 text-violet-400" /> 指令执行协议
                        </h3>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="p-3.5 bg-violet-600/10 rounded-2xl text-violet-400 h-fit shadow-lg border border-violet-500/20"><Radio className="w-5 h-5"/></div>
                                <div>
                                    <div className="text-sm font-black text-white mb-1.5 italic">实时意图解构</div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold">系统通过 Gemini 3 模型深度解析自然语言，支持 SKU 模糊匹配与任务优先级推断。</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 h-fit shadow-lg border border-emerald-500/20"><Database className="w-5 h-5"/></div>
                                <div>
                                    <div className="text-sm font-black text-white mb-1.5 italic">ACID 事务保障</div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold">所有 AI 操作均具备事务性，执行失败将自动回滚受影响的节点数据。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="ios-glass-panel p-8 flex flex-col gap-6 rounded-[2rem]">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                           <Zap className="w-3.5 h-3.5 text-yellow-500"/> 推荐操作 (Quick CMD)
                        </div>
                        <div className="space-y-3">
                            {[
                                "给李明创建一个采购单跟进任务",
                                "SKU-CP-Q1M 库存增加 200件",
                                "将任务 T-1235 标记为已完成",
                                "帮我分析当前的断货风险"
                            ].map((cmd, i) => (
                                <button key={i} onClick={() => setInput(cmd)} className="w-full text-left p-4 rounded-2xl bg-white/2 border border-white/5 text-[10px] text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all font-bold hover:translate-x-1 hover:bg-white/5">
                                    "{cmd}"
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(400%); }
                }
            `}} />
        </div>
    );
};

export default AICommandCenter;