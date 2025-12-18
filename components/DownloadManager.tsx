
import React from 'react';
import { useTanxing } from '../context/TanxingContext';
import { FileDown, X, CheckCircle, Loader2, HardDrive } from 'lucide-react';

const DownloadManager: React.FC = () => {
    const { state, dispatch } = useTanxing();
    const activeTasks = state.exportTasks.filter(t => t.status === 'processing');
    const recentTasks = state.exportTasks.filter(t => t.status === 'completed').slice(0, 3);

    if (state.exportTasks.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-80 animate-in slide-in-from-bottom-4">
            <div className="ios-glass-panel rounded-2xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-3xl">
                <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">任务中心 (Tasks)</span>
                    </div>
                    {activeTasks.length === 0 && (
                        <button onClick={() => dispatch({ type: 'HYDRATE_STATE', payload: { exportTasks: [] } })}>
                            <X className="w-4 h-4 text-slate-500 hover:text-white" />
                        </button>
                    )}
                </div>

                <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                    {activeTasks.map(task => (
                        <div key={task.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-[11px] font-bold text-slate-300 truncate w-40">{task.fileName}</div>
                                <div className="text-[10px] text-indigo-400 font-mono font-bold">{task.progress}%</div>
                            </div>
                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                    style={{ width: `${task.progress}%` }}
                                />
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                正在进行 AI 结构化导出...
                            </div>
                        </div>
                    ))}

                    {recentTasks.map(task => (
                        <div key={task.id} className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <div className="text-[11px] font-bold text-emerald-200 truncate w-32">{task.fileName}</div>
                            </div>
                            <span className="text-[9px] text-emerald-600 font-bold uppercase">已完成</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DownloadManager;
