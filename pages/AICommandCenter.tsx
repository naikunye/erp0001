
import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, Command, Send, Code, Cpu, Zap, 
  Database, Network, Trash2, Play, CheckCircle2, 
  X, Loader2, Link2, Monitor, Box, Truck, Wallet, AlertTriangle
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

const AICommandCenter: React.FC = () => {
    const { state, showToast, dispatch } = useTanxing();
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<{cmd: string, res: string, time: string}[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const COMMAND_HINTS = [
        { key: '#SYNC_FEISHU', desc: '立即将异常单号推送至飞书', icon: Send },
        { key: '#SCAN_RISK', desc: '全库扫描库存缺货风险', icon: AlertTriangle },
        { key: '#DAILY_REPORT', desc: '生成今日经营财务快照', icon: Monitor },
        { key: '#DB_BACKUP', desc: '备份本地镜像到云端', icon: Database }
    ];

    const executeCommand = async (cmd: string) => {
        const command = cmd.trim().toUpperCase();
        setIsExecuting(true);
        
        // 模拟服务器处理逻辑
        await new Promise(resolve => setTimeout(resolve, 800));

        let result = "";
        switch(command) {
            case '#SYNC_FEISHU':
                result = "指令成功：提取到 2 个异常物流节点，已排队进入飞书推送链路。";
                break;
            case '#SCAN_RISK':
                const low = state.products.filter((p:any) => p.stock < 10).length;
                result = `指令成功：扫描完成。发现 ${low} 个 SKU 存在断货风险，建议介入。`;
                break;
            case '#DAILY_REPORT':
                result = `指令成功：今日 GMV ¥${state.orders.reduce((a:any,b:any)=>a+b.total,0).toLocaleString()}，已生成报表快照。`;
                break;
            case '#DB_BACKUP':
                result = "指令成功：本地 IndexedDB 镜像已成功上传至腾讯云持久化存储节点。";
                break;
            default:
                result = "未知指令：无法识别该宏命令，请检查语法或参考侧边栏。";
        }

        setLogs(prev => [{ cmd, res: result, time: new Date().toLocaleTimeString() }, ...prev]);
        setIsExecuting(false);
        setInput('');
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-black rounded-2xl border border-white/10 text-indigo-500 shadow-2xl">
                        <Terminal className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">云端矩阵终端 (Console)</h1>
                        <p className="text-[10px] text-slate-500 font-mono tracking-[0.4em]">Direct Link to Tencent Server Node</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* 终端界面 */}
                <div className="col-span-12 lg:col-span-8 flex flex-col bg-black/60 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Root@Tanxing-Server:~#</span>
                        </div>
                        <button onClick={() => setLogs([])} className="text-[10px] text-slate-600 hover:text-white font-black uppercase">Clear Buffer</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-6 custom-scrollbar" ref={scrollRef}>
                        {logs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-20">
                                <Code className="w-20 h-20 mb-4" />
                                <p className="text-xs uppercase tracking-[0.5em]">Waiting for System Command...</p>
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="animate-in slide-in-from-left duration-300">
                                <div className="flex items-center gap-3 text-[10px] text-indigo-400/50 mb-1">
                                    <span>{log.time}</span>
                                    <span>&gt; {log.cmd}</span>
                                </div>
                                <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-slate-300 leading-relaxed italic">
                                    {log.res}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-black/80 border-t border-white/5">
                        <div className="relative">
                            <input 
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && executeCommand(input)}
                                placeholder="键入指令 (例如 #SYNC_FEISHU)..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-indigo-500 font-mono italic"
                            />
                            <button 
                                onClick={() => executeCommand(input)}
                                disabled={!input || isExecuting}
                                className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {isExecuting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3" />} EXEC
                            </button>
                        </div>
                    </div>
                </div>

                {/* 指令库 */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="ios-glass-panel p-8 rounded-[2.5rem] border-white/10 bg-indigo-900/5 space-y-6 shadow-xl">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 italic">系统宏指令集 (Macros)</h3>
                        <div className="space-y-4">
                            {COMMAND_HINTS.map(hint => (
                                <button 
                                    key={hint.key}
                                    onClick={() => setInput(hint.key)}
                                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-indigo-500/40 text-left transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <hint.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-white font-mono">{hint.key}</div>
                                            <div className="text-[9px] text-slate-500 font-bold mt-1 uppercase">{hint.desc}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
