
import React, { useState, useEffect } from 'react';
import { 
    Server, Activity, MessageCircle, Clock, Zap, ShieldCheck, 
    ArrowRight, RefreshCw, Terminal, Play, Pause, Bell, 
    Cpu, Database, Network, CheckCircle2, AlertTriangle, Truck
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

const Automation: React.FC = () => {
    const { state, showToast } = useTanxing();
    const [tasks, setTasks] = useState([
        { id: 'JOB-001', name: '全网物流追踪巡检', status: 'running', interval: '15m', lastRun: '刚刚', type: 'logistics' },
        { id: 'JOB-002', name: '库存水位安全对账', status: 'idle', interval: '1h', lastRun: '22分钟前', type: 'inventory' },
        { id: 'JOB-003', name: '飞书经营早报推送', status: 'idle', interval: 'Daily', lastRun: '今早 08:00', type: 'feishu' },
        { id: 'JOB-004', name: 'SKU 盈利波动预警', status: 'running', interval: '30m', lastRun: '刚刚', type: 'finance' }
    ]);

    const [logs, setLogs] = useState<string[]>([
        `[${new Date().toLocaleTimeString()}] Cloud node initialized on Tencent Server.`,
        `[${new Date().toLocaleTimeString()}] Sentinel protocol v2.0 active.`,
        `[${new Date().toLocaleTimeString()}] Feishu Webhook handshake successful.`
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newLog = `[${new Date().toLocaleTimeString()}] 执行巡检: 正在对齐 ${state.products.length} 个资产节点的物理状态...`;
            setLogs(prev => [newLog, ...prev].slice(0, 10));
        }, 10000);
        return () => clearInterval(interval);
    }, [state.products]);

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0 bg-indigo-900/10 p-6 rounded-[2.5rem] border border-indigo-500/20">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                        <Server className="w-9 h-9 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">云端哨兵控制台</h1>
                        <p className="text-[10px] text-indigo-400 font-mono mt-1 uppercase tracking-[0.4em]">Node ID: {SESSION_ID} | Tencent Cloud 24/7 Active</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-black/60 px-6 py-3 rounded-2xl border border-white/5 text-right">
                        <div className="text-[9px] text-slate-500 font-black uppercase">服务器 CPU 负载</div>
                        <div className="text-lg font-mono font-black text-emerald-400">4.2% <span className="text-[10px] text-slate-600">IDLE</span></div>
                    </div>
                    <div className="bg-black/60 px-6 py-3 rounded-2xl border border-white/5 text-right">
                        <div className="text-[9px] text-slate-500 font-black uppercase">内存占用</div>
                        <div className="text-lg font-mono font-black text-blue-400">128MB / 2GB</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* 任务列表 */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] px-2 mb-2">活跃后台任务 (Background Workers)</h3>
                    {tasks.map(task => (
                        <div key={task.id} className="ios-glass-panel p-5 rounded-[2rem] border-white/5 bg-white/2 hover:bg-white/5 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl ${task.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                    {task.type === 'logistics' && <Truck className="w-5 h-5" />}
                                    {task.type === 'inventory' && <Database className="w-5 h-5" />}
                                    {task.type === 'feishu' && <MessageCircle className="w-5 h-5" />}
                                    {task.type === 'finance' && <Zap className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white">{task.name}</div>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> 周期: {task.interval}</span>
                                        <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                                        <span>上次运行: {task.lastRun}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {task.status === 'running' && <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 uppercase animate-pulse">Running</span>}
                                <button className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white group-hover:bg-indigo-600 transition-all"><Pause className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 实时流水 */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <div className="ios-glass-panel flex-1 rounded-[2.5rem] border-white/10 bg-black/40 p-6 flex flex-col overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-indigo-500" /> Server Console Output
                        </h3>
                        <div className="flex-1 font-mono text-[10px] space-y-3 overflow-y-auto custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 text-slate-400 animate-in slide-in-from-left duration-300">
                                    <span className="text-indigo-600/50 shrink-0">#</span>
                                    <span className="leading-relaxed">{log}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="ios-glass-card p-6 rounded-[2.5rem] bg-emerald-500/5 border-emerald-500/20">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4"/> 飞书链路健康度
                        </h4>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-300">实时 Webhook 状态</span>
                            <span className="text-xs font-black text-emerald-400 font-mono">CONNECTED (200 OK)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Automation;
