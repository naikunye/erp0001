import React, { useState, useMemo } from 'react';
import { 
  Megaphone, Search, Plus, Sparkles, Filter, 
  ChevronRight, ArrowRight, MessageSquare, 
  Smartphone, Zap, Globe, Target, UserPlus,
  Video, DollarSign, TrendingUp, Instagram
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Marketing: React.FC = () => {
    const { state } = useTanxing();
    const influencers = state.influencers || [];

    const STAGES = [
        { id: 'Prospecting', label: '节点挖掘', color: '#007AFF' },
        { id: 'Negotiating', label: '深度洽谈', color: '#AF52DE' },
        { id: 'Sample Sent', label: '样品在途', color: '#FF9500' },
        { id: 'Video Live', label: '视频上线', color: '#34C759' },
        { id: 'Completed', label: '收益结案', color: '#FF3B30' }
    ];

    return (
        <div className="h-full flex flex-col gap-12 animate-in fade-in duration-1000 overflow-hidden pb-4">
            
            {/* Command Strip */}
            <div className="flex justify-between items-end px-2 shrink-0 spring-in">
                <div>
                    <p className="text-apple-red font-black text-[11px] uppercase tracking-[0.5em] mb-4 opacity-80 italic">Connect Matrix v4.0</p>
                    <h1 className="text-8xl font-black tracking-tightest text-white italic leading-none">红人建联</h1>
                </div>
                <div className="flex gap-6 mb-2">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-apple-red transition-colors" />
                        <input 
                            type="text" 
                            placeholder="检索达人 Handle..." 
                            className="w-[380px] pl-16 pr-8 py-5 apple-vibrancy-regular squircle-lg text-base text-white outline-none focus:ring-2 focus:ring-apple-red/40"
                        />
                    </div>
                    <button className="px-12 py-5 bg-apple-red text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,59,48,0.3)] apple-tap flex items-center gap-4 italic">
                        <UserPlus className="w-6 h-6" /> 注册新达人
                    </button>
                </div>
            </div>

            {/* Stage Pipeline: Pro Kanban with Blur Backgrounds */}
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-6 spring-in" style={{ animationDelay: '200ms' }}>
                <div className="flex gap-10 h-full min-w-[1800px] px-2">
                    {STAGES.map(stage => (
                        <div key={stage.id} className="flex-1 flex flex-col gap-8 bg-white/[0.01] rounded-[2.5rem] p-4 border border-white/5">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-6 rounded-full" style={{ backgroundColor: stage.color }}></div>
                                    <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.5em] italic">{stage.label}</h3>
                                </div>
                                <span className="text-[11px] font-mono font-black text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                    {influencers.filter(i => i.status === stage.id).length}
                                </span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-10">
                                {influencers.filter(i => i.status === stage.id).map((inf, idx) => {
                                    const roi = (inf.generatedSales || 0) / (inf.sampleCost || 1);
                                    const isHot = roi > 5;

                                    return (
                                        <div key={inf.id} className={`apple-platter p-10 squircle-lg group cursor-pointer transition-all hover:bg-white/[0.06] relative spring-in ${isHot ? 'roi-gold-glow border-apple-orange/40 bg-apple-orange/5' : ''}`} style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl font-black text-white/20 italic group-hover:scale-110 transition-transform">
                                                        {inf.handle.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-3xl font-black text-white italic tracking-tightest uppercase group-hover:text-apple-red transition-colors leading-none mb-3">{inf.handle}</div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                                                {inf.platform === 'TikTok' ? <Video className="w-3 h-3 text-pink-500" /> : <Instagram className="w-3 h-3 text-purple-500" />}
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{inf.platform}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-apple-blue">{(inf.followers/1000).toFixed(0)}K Fans</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all">
                                                    <ChevronRight className="w-5 h-5 text-white/40" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <div className="apple-vibrancy-thin border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 italic">模拟产出</span>
                                                    <span className="text-2xl font-black text-apple-green font-mono italic tracking-tighter">${inf.generatedSales?.toLocaleString()}</span>
                                                </div>
                                                <div className="apple-vibrancy-thin border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 italic">ROI 指数</span>
                                                    <span className={`text-2xl font-black font-mono italic tracking-tighter ${isHot ? 'text-apple-orange animate-pulse' : 'text-white/40'}`}>
                                                        {roi.toFixed(1)}x
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500/10 hover:text-emerald-400 transition-all flex items-center justify-center gap-3">
                                                    <MessageSquare className="w-4 h-4" /> WhatsApp
                                                </button>
                                                <button className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-xl group-hover:scale-105">
                                                    <Sparkles className="w-5 h-5" />
                                                </button>
                                            </div>
                                            
                                            {isHot && (
                                                <div className="absolute top-4 right-16 p-2 bg-apple-orange text-white rounded-full shadow-[0_0_20px_rgba(255,149,0,0.5)]">
                                                    <TrendingUp className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <style>{`
                .roi-gold-glow { 
                    box-shadow: 0 0 40px rgba(255, 149, 0, 0.15);
                    border: 0.5px solid rgba(255, 149, 0, 0.4);
                }
            `}</style>
        </div>
    );
};

export default Marketing;