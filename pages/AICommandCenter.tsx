import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, Sparkles, Send, Loader2, Cpu, Zap, Activity, 
  Trash2, Play, CheckCircle2, AlertTriangle, MessageSquare, Mic, StopCircle,
  Command, Layers, Fingerprint, Database, Radio, Network, Target, Image as ImageIcon, X, Paperclip,
  ChevronRight, ArrowRight, BrainCircuit, Scan, ShieldAlert, BadgeCheck, RotateCcw, ClipboardList
} from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from "@google/genai";
import { useTanxing } from '../context/TanxingContext';
import { ProposedAction, Task, Product } from '../types';

interface CommandLog {
    id: string;
    timestamp: string;
    input: string;
    aiResponse: string;
    status: 'parsing' | 'executing' | 'success' | 'error';
    details?: string;
    affectedNode?: string;
    hasImage?: boolean;
}

const AICommandCenter: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<CommandLog[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [proposals, setProposals] = useState<ProposedAction[]>([]);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Context for Live API
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const liveSessionRef = useRef<any>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [logs, isProcessing]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (liveSessionRef.current) liveSessionRef.current.close();
        };
    }, [previewUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve({ inlineData: { data: base64String, mimeType: file.type } });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const toolDeclarations: FunctionDeclaration[] = [
        {
            name: 'propose_inventory_update',
            parameters: {
                type: Type.OBJECT,
                description: '建议更新指定 SKU 商品的库位存量。',
                properties: {
                    sku: { type: Type.STRING, description: '商品的 SKU 唯一编号' },
                    change: { type: Type.NUMBER, description: '变化量，正数为入库，负数为出库' },
                    reason: { type: Type.STRING, description: '变更原因，如“入库单识别”' }
                },
                required: ['sku', 'change']
            }
        },
        {
            name: 'propose_task_creation',
            parameters: {
                type: Type.OBJECT,
                description: '建议为团队成员创建一个新的业务协同任务。',
                properties: {
                    title: { type: Type.STRING, description: '任务简述' },
                    assignee: { type: Type.STRING, description: '建议负责人名称' },
                    priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
                    category: { type: Type.STRING, enum: ['procurement', 'logistics', 'marketing', 'finance'] }
                },
                required: ['title', 'assignee', 'priority']
            }
        }
    ];

    const handleExecute = async () => {
        if ((!input.trim() && !selectedFile) || isProcessing) return;

        const commandInput = input || (selectedFile ? "[图像资产深度识别请求]" : "");
        const hasImage = !!selectedFile;
        const logId = Date.now().toString();
        
        setInput('');
        const currentFile = selectedFile;
        clearFile();
        setIsProcessing(true);

        const newLog: CommandLog = {
            id: logId,
            timestamp: new Date().toLocaleTimeString(),
            input: commandInput,
            aiResponse: hasImage ? '正在多模态扫描视觉资产...' : '量子神经元正在解构操作意图...',
            status: 'parsing',
            hasImage
        };
        setLogs(prev => [...prev, newLog]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const parts: any[] = [{ text: commandInput }];
            if (hasImage && currentFile) {
                const imgPart = await fileToGenerativePart(currentFile);
                parts.unshift(imgPart);
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts }],
                config: {
                    tools: [{ functionDeclarations: toolDeclarations }],
                    systemInstruction: `你是一个具身智能 ERP 指令专家。
                    1. 如果有图片，通过 OCR 深度扫描图片中的单据、条码。
                    2. 如果识别到库位变动，严禁直接更新，必须调用 propose_inventory_update 提交议案。
                    3. 结合系统现有数据（库位、物流单号）进行验证，如果图中单号在系统中不存在，请给出预警。
                    4. 保持绝对专业，输出精炼。`
                }
            });

            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'executing', aiResponse: '视觉与语义特征提取完成，生成待决策议案。' } : l));
                
                const newProposals: ProposedAction[] = functionCalls.map((call, idx) => {
                    const args = call.args as any;
                    if (call.name === 'propose_inventory_update') {
                        return {
                            id: `PROP-${Date.now()}-${idx}`,
                            type: 'inventory_update',
                            description: `建议更新 SKU [${args.sku}] 的库存: ${args.change > 0 ? '+' : ''}${args.change}`,
                            payload: args,
                            status: 'pending',
                            confidence: 0.95
                        };
                    }
                    if (call.name === 'propose_task_creation') {
                        return {
                            id: `PROP-${Date.now()}-${idx}`,
                            type: 'task_creation',
                            description: `建议创建协同任务: ${args.title}`,
                            payload: args,
                            status: 'pending',
                            confidence: 0.88
                        };
                    }
                    return null;
                }).filter(Boolean) as ProposedAction[];

                setProposals(prev => [...newProposals, ...prev]);
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', aiResponse: `已提取 ${newProposals.length} 项可执行议案，请在右侧看板审核确认。` } : l));
            } else {
                setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', aiResponse: response.text || '解析完毕，未检测到结构化改写需求。' } : l));
            }

        } catch (error: any) {
            setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', aiResponse: `纠缠链路中断: ${error.message}` } : l));
        } finally {
            setIsProcessing(false);
        }
    };

    const commitAction = (prop: ProposedAction) => {
        try {
            const products = state.products || [];
            if (prop.type === 'inventory_update') {
                const product = products.find(p => p.sku === prop.payload.sku);
                if (product) {
                    dispatch({ 
                        type: 'UPDATE_PRODUCT', 
                        payload: { ...product, stock: product.stock + prop.payload.change, lastUpdated: new Date().toISOString() } 
                    });
                    showToast(`库存已原子化更新: ${prop.payload.sku}`, 'success');
                }
            } else if (prop.type === 'task_creation') {
                const newTask: Task = {
                    id: `T-${Date.now()}`,
                    title: prop.payload.title,
                    assignee: prop.payload.assignee,
                    priority: prop.payload.priority,
                    status: 'todo',
                    dueDate: new Date().toISOString().split('T')[0],
                    category: prop.payload.category || 'procurement',
                    autoGenerated: true
                };
                dispatch({ type: 'ADD_TASK', payload: newTask });
                showToast(`协同任务已分派`, 'success');
            }
            setProposals(prev => prev.filter(p => p.id !== prop.id));
        } catch (e) {
            showToast('操作固化失败', 'error');
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4 italic">
                        <Terminal className="w-10 h-10 text-indigo-500" />
                        量子智能指挥中枢
                    </h1>
                    <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2 uppercase tracking-[0.4em]">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse"/> Multimodal Cognition Layer Active
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-6 py-2.5 bg-indigo-900/10 border border-indigo-500/30 rounded-2xl flex items-center gap-3">
                        <Fingerprint className="w-5 h-5 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Human-in-the-Loop Loop Verified</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* 左侧：神经链接流 */}
                <div className="col-span-12 lg:col-span-7 ios-glass-panel rounded-[2.5rem] flex flex-col overflow-hidden relative border-white/5 shadow-2xl">
                    {isProcessing && (
                        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-[2.5rem]">
                            <div className="w-full h-32 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent absolute top-0 left-0 animate-[scan_2s_linear_infinite]"></div>
                        </div>
                    )}
                    
                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center backdrop-blur-md relative z-10">
                        <div className="flex items-center gap-3">
                            <Radio className="w-4 h-4 text-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Neural Execution Flow</span>
                        </div>
                        <button onClick={() => setLogs([])} className="p-2 hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 font-mono text-sm space-y-10 custom-scrollbar relative z-10" ref={scrollRef}>
                        {logs.length === 0 && !isProcessing && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20 space-y-8">
                                <Network className="w-36 h-36 animate-pulse" />
                                <p className="text-xs uppercase tracking-[1em] font-black italic">Awaiting Visual or Text CMD Injection</p>
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="animate-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-4 text-[10px] mb-4">
                                    <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-sm font-black tracking-tighter uppercase italic">User Intent</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest truncate max-w-xs">{log.input}</span>
                                        {log.hasImage && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/20 text-[8px] font-black uppercase">Multimodal Payload Detected</span>}
                                    </div>
                                    <span className="text-slate-700 font-mono ml-auto">TS: {log.timestamp}</span>
                                </div>
                                <div className="bg-white/2 border border-white/5 rounded-[1.5rem] p-6 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                    <div className="flex items-center gap-4 mb-4">
                                        {log.status === 'parsing' ? <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" /> : 
                                         log.status === 'executing' ? <Zap className="w-4 h-4 text-blue-400 animate-pulse" /> :
                                         log.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                                         <AlertTriangle className="w-4 h-4 text-red-400" />}
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${log.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>Node Status: {log.status}</span>
                                    </div>
                                    <p className="text-indigo-100 text-xs leading-relaxed font-bold">{log.aiResponse}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 输入控制台 */}
                    <div className="p-8 bg-black/40 border-t border-white/5 relative z-20 backdrop-blur-2xl">
                        {previewUrl && (
                            <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="relative w-24 h-24 group">
                                    <img src={previewUrl} className="w-full h-full object-cover rounded-xl border border-white/20 shadow-2xl" />
                                    <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                        <Scan className="w-8 h-8 text-white animate-pulse"/>
                                    </div>
                                    <button onClick={clearFile} className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-500 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[1.5rem] blur opacity-10 group-focus-within:opacity-30 transition-all"></div>
                            <div className="relative flex gap-4">
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-4.5 flex items-center gap-2">
                                        <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-xl transition-all ${selectedFile ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-white'}`} title="注入物理视觉证据">
                                            <ImageIcon className="w-5 h-5" />
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleExecute()}
                                        placeholder="键入语义指令或扫描入库单据、异常照片..."
                                        className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/50 rounded-2xl pl-16 pr-20 py-5 text-sm text-white outline-none transition-all placeholder:text-slate-700 font-bold"
                                    />
                                    <div className="absolute right-5 top-4.5">
                                        <button onClick={() => setIsListening(!isListening)} className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-600 hover:text-white'}`}>
                                            {isListening ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleExecute}
                                    disabled={(!input.trim() && !selectedFile) || isProcessing}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 text-white rounded-2xl px-12 font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center gap-3 active:scale-95 italic"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    COMMIT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右侧：逻辑建议矩阵 */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <div className="ios-glass-card p-6 bg-emerald-500/5 border-l-4 border-l-emerald-600 rounded-[2rem] shadow-xl">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <BrainCircuit className="w-4 h-4 text-emerald-400" /> Intelligence Proposals
                        </h3>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            {proposals.length === 0 ? (
                                <div className="py-20 text-center text-slate-700 flex flex-col items-center gap-4 opacity-30 italic">
                                    <BadgeCheck className="w-12 h-12 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">待审核决策队列为空</p>
                                </div>
                            ) : (
                                proposals.map((prop) => (
                                    <div key={prop.id} className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-emerald-500/30 transition-all animate-in zoom-in-95 duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${prop.type === 'inventory_update' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {prop.type === 'inventory_update' ? <Database className="w-4 h-4"/> : <ClipboardList className="w-4 h-4"/>}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 uppercase font-mono">{prop.type}</span>
                                            </div>
                                            <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[8px] font-black uppercase">
                                                Conf: {(prop.confidence * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                        <p className="text-xs text-white font-bold mb-5 leading-relaxed">{prop.description}</p>
                                        <div className="flex gap-3 pt-4 border-t border-white/5">
                                            <button onClick={() => setProposals(p => p.filter(x => x.id !== prop.id))} className="flex-1 py-2 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl text-[10px] font-black uppercase transition-all">Dismiss</button>
                                            <button onClick={() => commitAction(prop)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-900/20 transition-all">Accept & Commit</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="ios-glass-panel p-8 flex flex-col gap-6 rounded-[2rem] border-white/5">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                           <Zap className="w-3.5 h-3.5 text-yellow-500"/> Multi-Modal Sandbox
                        </div>
                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                                <div className="text-sm font-black text-indigo-400 mb-1">视觉场景化逻辑</div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-bold">系统支持直接拖入“发货物流面单”照片。AI 将自动解析单号，并在“物流追踪”模块中匹配对应的货件节点进行物理对账。</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                                <div className="text-sm font-black text-emerald-400 mb-1">语义决策安全</div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-bold">所有 AI 自动生成的指令都会进入右侧“待决策议案区”。只有经过人工审计确认的操作才会影响量子核心数据库。</p>
                            </div>
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