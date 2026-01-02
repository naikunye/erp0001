import React from 'react';
import { 
    Palette, Cloud, ShieldCheck, Database, 
    Zap, Monitor, Smartphone, Globe, Check
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Theme } from '../types';

const Settings: React.FC = () => {
    const { state, dispatch, syncToCloud } = useTanxing();

    const themes: { id: Theme; name: string; color: string; desc: string }[] = [
        { id: 'tech-blue', name: '科技蓝 (Tech Blue)', color: 'bg-blue-600', desc: '经典瑞士工业美学，深邃且严谨' },
        { id: 'vitality-orange', name: '活力橙 (Vitality Orange)', color: 'bg-orange-600', desc: '极具行动力的色彩，适合快节奏运营' },
        { id: 'dark-green', name: '暗夜绿 (Dark Green)', color: 'bg-emerald-600', desc: '黑客矩阵风格，低对比度护眼模式' },
    ];

    return (
        <div className="w-full h-full flex flex-col px-10 py-8 no-scrollbar overflow-y-auto">
            <div className="mb-12 shrink-0">
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">System Preferences</p>
                <h1 className="text-5xl font-black tracking-tighter text-white">系统偏好设置</h1>
            </div>

            <div className="grid grid-cols-12 gap-10">
                
                {/* 视觉主题切换 */}
                <div className="col-span-7 space-y-10">
                    <div className="precision-surface rounded-3xl p-10">
                        <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                            <Palette className="w-5 h-5 text-indigo-500" /> 视觉引擎风格 (Appearance)
                        </h3>
                        <div className="space-y-4">
                            {themes.map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => dispatch({ type: 'SET_THEME', payload: t.id })}
                                    className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between group press-effect ${state.theme === t.id ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl' : 'border-white/5 bg-white/2 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl shadow-2xl ${t.color} border border-white/20 flex items-center justify-center`}>
                                            {state.theme === t.id && <Check className="w-8 h-8 text-white" />}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-black text-white italic">{t.name}</div>
                                            <div className="text-[10px] text-white/30 font-bold uppercase mt-1 tracking-widest">{t.desc}</div>
                                        </div>
                                    </div>
                                    {state.theme === t.id && (
                                        <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_var(--accent-500)]"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 腾讯云 Omega 同步 */}
                <div className="col-span-5 space-y-10">
                    <div className="precision-surface rounded-3xl p-10 bg-indigo-500/10 border-indigo-500/20 shadow-[0_30px_90px_rgba(79,70,229,0.15)]">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                                <Cloud className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">腾讯云同步</h3>
                                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">Omega Protocol v4.2</p>
                            </div>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-bold mb-10">
                            激活后，本地资产协议将每隔 300ms 广播至腾讯云 Omega 节点，并由三地六中心进行多重共识校验。
                        </p>
                        <button 
                            onClick={() => syncToCloud(true)}
                            className="w-full py-6 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-colors"
                        >
                            执行全量镜像同步
                        </button>
                    </div>

                    <div className="precision-surface rounded-3xl p-8">
                        <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6">Device Identifier</h3>
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono">
                            <code className="text-sm font-black text-indigo-500 tracking-tighter uppercase italic">TX-KERNEL-9X77-BFA0-OS14</code>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;