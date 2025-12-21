import React, { useState } from 'react';
import { 
    Zap, Radio, ShieldCheck, Play, Pause, Trash2, Clock, 
    ChevronRight, Terminal, Network, Activity, Settings2, 
    MessageSquare, AlertTriangle, Layers, BrainCircuit
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Automation: React.FC = () => {
    const { state, dispatch } = useTanxing();
    const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');

    const rules = state.automationRules || [];
    const logs = state.automationLogs || [];

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3 italic">
                        <Zap className="w-9 h-9 text-indigo-500" />
                        逻辑神经中枢 (Hooks)
                    </h1>
                    <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2 uppercase tracking-[0.2em]">
                        <Activity className="w-3 h-3 text-emerald-400" /> Automated Response Layer Active
                    </p>
                </div>
                <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
                    <button onClick={() => setActiveTab('rules')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>自动化规则</button>
                    <button onClick={() => setActiveTab('logs')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>执行日志</button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {activeTab === 'rules' ? (
                    <>
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {rules.map(rule => (
                                    <div key={rule.id} className="ios-glass-card p-6 border-l-4 border-l-indigo-500 hover:border-indigo-500/50 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform border border-indigo-500/20">
                                                {rule.trigger === 'logistics_exception' ? <Radio className="w-6 h-6" /> : <BrainCircuit className="w-6 h-6" />}
                                            </div>
                                            <div className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${rule.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                                {rule.status}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">{rule.name}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                                            当系统检测到 <span className="text-indigo-400 font-bold">{(rule.trigger || '').replace(/_/g, ' ').toUpperCase()}</span> 时，
                                            自动执行 <span className="text-emerald-400 font-bold">{(rule.action || '').replace(/_/g, ' ').toUpperCase()}</span> 操作。
                                        </p>
                                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                            <button className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all flex items-center gap-2">
                                                {rule.status === 'active' ? <Pause className="w-3 h-3 fill-current"/> : <Play className="w-3 h-3 fill-current"/>}
                                                {rule.status === 'active' ? '暂停协议' : '激活协议'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button className="border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-700 hover:border-indigo-500/30 hover:text-indigo-500 transition-all group">
                                    <div className="p-4 bg-white/2 rounded-full mb-4 group-hover:scale-110 transition-transform"><Settings2 className="w-8 h-8" /></div>
                                    <span className="text-sm font-black uppercase tracking-widest italic">定义新逻辑勾子</span>
                                </button>
                            </div>
                        </div>

                        <div className="hidden lg:col-span-4 lg:flex flex-col gap-6">
                            <div className="ios-glass-card p-8 bg-indigo-600/5 border-l-4 border-l-indigo-600 rounded-[2rem]">
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3 italic">
                                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> 主动响应矩阵说明
                                </h3>
                                <div className="space-y-8">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl text-slate-400 h-fit"><Layers className="w-5 h-5"/></div>
                                        <div>
                                            <div className="text-sm font-bold text-white mb-1">分布式监听</div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">系统实时轮询物理世界镜像（物流/库位），在事件发生的秒级时间内完成逻辑解构。</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl text-slate-400 h-fit"><MessageSquare className="w-5 h-5"/></div>
                                        <div>
                                            <div className="text-sm font-bold text-white mb-1">无感任务分发</div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">AI 识别风险后自动在运营协同中心创建带上下文的任务，无需人工干预初级对账工作。</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="col-span-12 ios-glass-panel rounded-[2.5rem] flex flex-col overflow-hidden border-white/10">
                        <div className="p-6 bg-black/40 border-b border-white/5 flex items-center gap-4">
                            <Terminal className="w-5 h-5 text-indigo-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Active Sentry Execution Logs</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-6">
                                {logs.length > 0 ? logs.map((log) => (
                                    <div key={log.id} className="ios-glass-card p-5 border-l-4 border-l-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-left-4">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5">
                                                <Zap className="w-5 h-5 text-yellow-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white mb-1">{log.ruleName}</div>
                                                <p className="text-xs text-slate-500 font-bold">{log.details}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-600 font-black uppercase">Timestamp</div>
                                                <div className="text-xs font-mono font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
                                            </div>
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase">Executed</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center text-slate-700 flex flex-col items-center gap-4 opacity-30 italic">
                                        <AlertTriangle className="w-16 h-16 mb-4" />
                                        <p className="text-sm font-black uppercase tracking-[0.5em]">载荷队列空置中...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Automation;