import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { Influencer, Product } from '../types';
import { 
  Calculator, Search, Plus, Users, 
  TrendingUp, Activity, Zap, Box, 
  ChevronRight, ChevronLeft, ExternalLink, Target, 
  BarChart3, Wallet, Info, Mail, MessageSquare, 
  Truck, CheckCircle2, X, Trash2, Save, 
  Sparkles, Loader2, DollarSign, MapPin, 
  History, Calendar, ArrowRight, UserPlus, Send,
  Globe, LayoutGrid, List, MoreHorizontal, Copy,
  BadgeDollarSign, TrendingDown, ClipboardList, ShieldCheck,
  Megaphone, Smartphone, Video, Link as LinkIcon, Phone,
  Radar, UserSearch, Type
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart as ReBarChart, Bar, Cell
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

const STAGES: { id: Influencer['status']; label: string; color: string }[] = [
    { id: 'Prospecting', label: '节点挖掘', color: 'slate' },
    { id: 'Negotiating', label: '深度洽谈', color: 'blue' },
    { id: 'Pending Sample', label: '待寄样品', color: 'amber' },
    { id: 'Sample Sent', label: '样品途中', color: 'indigo' },
    { id: 'Video Live', label: '视频上线', color: 'emerald' },
    { id: 'Completed', label: '收益结案', color: 'rose' }
];

const ROI_COLORS: Record<string, string> = {
    'Prospecting': '#64748b',
    'Negotiating': '#3b82f6',
    'Pending Sample': '#f59e0b',
    'Sample Sent': '#6366f1',
    'Video Live': '#10b981',
    'Completed': '#f43f5e'
};

// Fix: Added missing getStatusColor function to resolve build error on line 248
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Prospecting': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        case 'Negotiating': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'Pending Sample': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'Sample Sent': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        case 'Video Live': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'Completed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
};

// Fix: Added missing ROISimulator component to resolve build error on line 225
const ROISimulator: React.FC = () => {
    const { state } = useTanxing();
    const influencers = state.influencers || [];

    const roiData = useMemo(() => {
        return influencers
            .filter(i => i.sampleCost && i.sampleCost > 0)
            .map(i => ({
                name: i.handle,
                roi: (i.generatedSales || 0) / i.sampleCost,
                sales: i.generatedSales || 0,
                cost: i.sampleCost
            }))
            .sort((a, b) => b.roi - a.roi);
    }, [influencers]);

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="ios-glass-card p-6 bg-emerald-500/5 border-l-4 border-l-emerald-500">
                    <div className="text-[10px] text-emerald-500 font-black uppercase mb-1">平均联络 ROI</div>
                    <div className="text-4xl font-black text-white font-mono">
                        {(roiData.reduce((acc, curr) => acc + curr.roi, 0) / (roiData.length || 1)).toFixed(2)}x
                    </div>
                </div>
                <div className="ios-glass-card p-6 bg-blue-500/5 border-l-4 border-l-blue-500">
                    <div className="text-[10px] text-blue-500 font-black uppercase mb-1">总带货产值</div>
                    <div className="text-4xl font-black text-white font-mono">
                        ${roiData.reduce((acc, curr) => acc + curr.sales, 0).toLocaleString()}
                    </div>
                </div>
                <div className="ios-glass-card p-6 bg-indigo-500/5 border-l-4 border-l-indigo-500">
                    <div className="text-[10px] text-indigo-500 font-black uppercase mb-1">样品累计投入</div>
                    <div className="text-4xl font-black text-white font-mono">
                        ${roiData.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="flex-1 ios-glass-panel p-6 overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-400"/> 达人产出矩阵 (ROI Matrix)</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={roiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{backgroundColor:'#0a0a0c', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px'}} />
                            <Bar dataKey="roi" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                {roiData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.roi || 0) > 5 ? '#10b981' : '#6366f1'} />
                                ))}
                            </Bar>
                        </ReBarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const Marketing: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [viewMode, setViewMode] = useState<'discovery' | 'pipeline' | 'roi'>('pipeline');
    const influencers = state.influencers || [];
    const products = (state.products || []).filter(p => !p.deletedAt);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInf, setSelectedInf] = useState<Influencer | null>(null);
    const [editingInf, setEditingInf] = useState<Influencer | null>(null);
    
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [aiResult, setAiResult] = useState<{title: string, content: string} | null>(null);

    useEffect(() => {
        if (selectedInf) {
            setEditingInf({ ...selectedInf });
        } else {
            setEditingInf(null);
            setAiResult(null);
        }
    }, [selectedInf]);

    const handleUpdateDraft = (updates: Partial<Influencer>) => {
        if (!editingInf) return;
        setEditingInf({ ...editingInf, ...updates });
    };

    const commitChanges = () => {
        if (!editingInf) return;
        dispatch({ type: 'UPDATE_INFLUENCER', payload: editingInf });
        showToast('达人档案已固化并广播', 'success');
        setSelectedInf(null);
    };

    const moveStage = (inf: Influencer, direction: 'forward' | 'backward') => {
        const currentIndex = STAGES.findIndex(s => s.id === inf.status);
        const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < STAGES.length) {
            const updated = { ...inf, status: STAGES[nextIndex].id };
            dispatch({ type: 'UPDATE_INFLUENCER', payload: updated });
            showToast(`节点状态迁移: ${STAGES[nextIndex].label}`, 'info');
        }
    };

    const runAiAgent = async (inf: Influencer, type: 'outreach' | 'strategy') => {
        setIsAiGenerating(true);
        setAiResult(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = type === 'outreach' 
                ? `为 TikTok 达人 ${inf.handle} (${inf.followers}粉丝) 写一封极其专业的商务建联私信。要求：英语，包括自我介绍、产品优势、分佣意向。`
                : `分析达人 ${inf.handle} 的内容风格，并为他准备 3 个针对跨境电商产品的爆款视频脚本创意方向。`;
            
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setAiResult({
                title: type === 'outreach' ? 'AI 邀约话术生成' : 'AI 内容创意矩阵',
                content: response.text
            });
        } catch (e) {
            setAiResult({ title: '系统错误', content: "AI 神经元连接异常，请稍后重试。" });
        } finally {
            setIsAiGenerating(false);
        }
    };

    const filteredInfluencers = influencers.filter(i => 
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.handle || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
            {/* 顶层控制中枢 */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0 bg-black/20 p-5 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3 italic">
                        <Megaphone className="w-9 h-9 text-indigo-500" />
                        达人营销·作战中心
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-2 tracking-[0.2em]">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> NODES: {influencers.length} | ACTIVE: {influencers.filter(i=>i.status!=='Completed').length}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                        <input 
                            type="text" 
                            placeholder="检索当前已存在的节点..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-indigo-500 outline-none w-64 transition-all"
                        />
                    </div>
                    <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setViewMode('discovery')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'discovery' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <Radar className="w-4 h-4" /> 全网挖掘
                        </button>
                        <button onClick={() => setViewMode('pipeline')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'pipeline' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <LayoutGrid className="w-4 h-4" /> 履约管线
                        </button>
                        <button onClick={() => setViewMode('roi')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'roi' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <TrendingUp className="w-4 h-4" /> 效益模拟
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {viewMode === 'discovery' && <DiscoveryModule />}
                {viewMode === 'pipeline' && (
                    <div className="h-full overflow-x-auto custom-scrollbar pb-6 scroll-smooth">
                        <div className="flex gap-6 h-full min-w-[1700px] px-2">
                            {STAGES.map(stage => (
                                <div key={stage.id} className="flex-1 flex flex-col min-w-[320px] group/stage">
                                    <div className="p-4 mb-4 border-b border-white/10 flex justify-between items-center bg-white/2 rounded-2xl backdrop-blur-sm group-hover/stage:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-6 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: ROI_COLORS[stage.id] }}></div>
                                            <span className="text-xs font-black text-slate-200 uppercase italic tracking-[0.2em]">{stage.label}</span>
                                        </div>
                                        <span className="bg-black px-2.5 py-1 rounded-lg text-[10px] font-black text-indigo-400 font-mono border border-white/5">
                                            {filteredInfluencers.filter(i => i.status === stage.id).length}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                                        {filteredInfluencers.filter(i => i.status === stage.id).map(inf => {
                                            const roi = inf.sampleCost && inf.sampleCost > 0 ? (inf.generatedSales || 0) / inf.sampleCost : 0;
                                            const isHighRoi = roi > 5;
                                            return (
                                                <div 
                                                    key={inf.id} 
                                                    onClick={() => setSelectedInf(inf)}
                                                    className={`ios-glass-card p-5 transition-all group relative cursor-pointer bg-[#0a0a0c]/80 border-white/5 ${isHighRoi ? 'roi-high-glow' : 'hover:border-indigo-500/50'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-black text-white text-lg tracking-tight truncate group-hover:text-indigo-400 transition-colors uppercase italic">{inf.handle}</div>
                                                            <div className="flex gap-2 mt-1">
                                                                <span className="text-[9px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded-sm border border-white/5 font-black uppercase">{inf.platform}</span>
                                                                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-sm border border-indigo-500/20 font-black">{(inf.followers / 1000).toFixed(0)}k Fans</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={(e) => { e.stopPropagation(); moveStage(inf, 'forward'); }} className="p-1.5 bg-indigo-600 text-white rounded-lg"><ChevronRight className="w-3 h-3"/></button>
                                                            <button onClick={(e) => { e.stopPropagation(); moveStage(inf, 'backward'); }} className="p-1.5 bg-white/5 text-slate-500 rounded-lg"><ChevronLeft className="w-3 h-3"/></button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 mt-5">
                                                        <a href={`https://www.tiktok.com/@${inf.handle.replace('@','')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex flex-col items-center justify-center gap-1 py-2 bg-black/40 border border-white/5 rounded-xl text-[8px] font-black text-slate-500 hover:text-white transition-all group/s">
                                                            <LinkIcon className="w-3.5 h-3.5 group-hover/s:text-indigo-400" /> TIKTOK
                                                        </a>
                                                        <a 
                                                            href={inf.whatsapp ? `https://wa.me/${inf.whatsapp.replace(/\D/g,'')}` : '#'} 
                                                            target="_blank" rel="noreferrer" 
                                                            onClick={e => { if(!inf.whatsapp) { e.preventDefault(); showToast('未录入 WhatsApp', 'warning'); } e.stopPropagation(); }}
                                                            className={`flex flex-col items-center justify-center gap-1 py-2 border rounded-xl text-[8px] font-black transition-all ${inf.whatsapp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-black/20 border-white/5 text-slate-700'}`}
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" /> WHATSAPP
                                                        </a>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); runAiAgent(inf, 'outreach'); setSelectedInf(inf); }}
                                                            className="flex flex-col items-center justify-center gap-1 py-2 bg-purple-600/10 border border-purple-500/20 rounded-xl text-[8px] font-black text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" /> AI-AGENT
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-slate-600 uppercase">
                                                        <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5"/> {inf.country}</span>
                                                        <span>{inf.lastFollowUp?.split('T')[0] || '待跟进'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {viewMode === 'roi' && <ROISimulator />}
            </div>

            {/* 详情编辑 Portal */}
            {editingInf && createPortal(
                <div className="fixed inset-0 z-[999] flex justify-end" onClick={() => setSelectedInf(null)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"></div>
                    <div className="w-full max-w-5xl bg-[#08080a] border-l border-white/10 h-full relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-white/10 flex justify-between items-start bg-white/2 shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-3xl font-black shadow-2xl relative overflow-hidden ring-4 ring-white/5">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white,transparent)] opacity-10"></div>
                                    {editingInf.handle?.charAt(1).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <input 
                                        className="text-4xl font-black text-white italic tracking-tighter uppercase bg-transparent outline-none border-b border-white/5 focus:border-indigo-500 w-full mb-2"
                                        value={editingInf.handle}
                                        onChange={e => handleUpdateDraft({ handle: e.target.value })}
                                    />
                                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                        <span className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-indigo-500"/> {editingInf.platform} NODE</span>
                                        <span className="flex items-center gap-2 text-indigo-400"><Users className="w-3.5 h-3.5"/> {(editingInf.followers / 1000).toFixed(0)}K Fans</span>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${getStatusColor(editingInf.status)}`}>{editingInf.status}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInf(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-8 h-8 text-slate-600 hover:text-white" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,#111,transparent)]">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div className="bg-white/2 border border-white/5 rounded-3xl p-6 space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> 联络指挥条</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] text-slate-500 font-bold uppercase mb-2 block">WhatsApp</label>
                                                <input type="text" value={editingInf.whatsapp || ''} onChange={e => handleUpdateDraft({whatsapp: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" placeholder="+1..." />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-500 font-bold uppercase mb-2 block">Email</label>
                                                <input type="text" value={editingInf.email || ''} onChange={e => handleUpdateDraft({email: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" placeholder="collab@..." />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">AI 深度增长引擎</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => runAiAgent(editingInf, 'strategy')} className="px-3 py-1 bg-purple-600/10 text-purple-400 border border-purple-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all">内容策略</button>
                                                <button onClick={() => runAiAgent(editingInf, 'outreach')} className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">邀约话术</button>
                                            </div>
                                        </div>
                                        {isAiGenerating ? (
                                            <div className="h-40 bg-white/2 rounded-3xl flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 animate-pulse">Computing Node DNA...</p>
                                            </div>
                                        ) : aiResult ? (
                                            <div className="bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden animate-in zoom-in-95">
                                                <div className="text-[10px] text-indigo-400 font-black uppercase mb-4 flex justify-between items-center">
                                                    <span>{aiResult.title}</span>
                                                    <button onClick={() => { navigator.clipboard.writeText(aiResult.content); showToast('已存入剪贴板', 'success'); }} className="flex items-center gap-1 hover:text-white transition-colors"><Copy className="w-3 h-3"/> COPY</button>
                                                </div>
                                                <p className="text-sm text-indigo-100 leading-relaxed font-medium whitespace-pre-wrap italic bg-black/20 p-4 rounded-xl border border-white/5">{aiResult.content}</p>
                                            </div>
                                        ) : (
                                            <div className="h-20 bg-white/2 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-slate-700 text-[9px] font-black uppercase tracking-widest">点击上方启动 AI 实验室</div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="bg-white/2 border border-white/5 rounded-3xl p-6 space-y-5">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> 样品履约协议</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] text-slate-500 font-bold uppercase mb-2 block">关联测款 SKU</label>
                                                <select value={editingInf.sampleProductSku || ''} onChange={e => handleUpdateDraft({sampleProductSku: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white">
                                                    <option value="">未挂载产品...</option>
                                                    {products.map(p => <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-500 font-bold uppercase mb-2 block">物流追踪号 (Tracking)</label>
                                                <input type="text" value={editingInf.sampleTrackingNo || ''} onChange={e => handleUpdateDraft({sampleTrackingNo: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" placeholder="FedEx / UPS / USPS..." />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-[#151518] to-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 mb-8"><BarChart3 className="w-4 h-4 text-emerald-400"/> 经营效益审计</h4>
                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            <div><label className="text-[9px] text-slate-600 font-black uppercase mb-1 block">样品总成本 ($)</label><input type="number" value={editingInf.sampleCost || ''} onChange={e => handleUpdateDraft({sampleCost: parseFloat(e.target.value)})} className="w-full bg-black/80 border border-white/10 rounded-xl p-3 text-xl font-black text-white font-mono" /></div>
                                            <div><label className="text-[9px] text-slate-600 font-black uppercase mb-1 block">产生销售 GMV ($)</label><input type="number" value={editingInf.generatedSales || ''} onChange={e => handleUpdateDraft({generatedSales: parseFloat(e.target.value)})} className="w-full bg-black/80 border border-white/10 rounded-xl p-3 text-xl font-black text-white font-mono" /></div>
                                        </div>
                                        <div className="flex flex-col items-center bg-white/2 rounded-2xl p-6 border border-white/5">
                                            <div className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">单兵 ROI 回报率</div>
                                            <div className={`text-6xl font-black font-mono tracking-tighter transition-all ${(editingInf.generatedSales || 0) / (editingInf.sampleCost || 1) > 5 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {editingInf.sampleCost && editingInf.sampleCost > 0 ? (editingInf.generatedSales! / editingInf.sampleCost).toFixed(2) : '0.00'}
                                                <span className="text-xl ml-1 text-slate-700 font-bold">x</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500"/> 物理交付网格 (Shipping Address)</h4>
                                <textarea value={editingInf.shippingAddress || ''} onChange={e => handleUpdateDraft({shippingAddress: e.target.value})} className="w-full h-24 bg-black/60 border border-white/10 rounded-3xl p-5 text-sm text-white focus:border-indigo-500 outline-none resize-none shadow-inner" placeholder="输入完整的收货人、地址、邮编及联系电话..." />
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/10 bg-white/2 shrink-0 flex gap-4">
                            <button onClick={() => setSelectedInf(null)} className="px-10 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">ABORT</button>
                            <button onClick={commitChanges} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 italic"><ShieldCheck className="w-5 h-5"/> EXECUTE & SAVE DATA NODE</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const DiscoveryModule = () => {
    const { dispatch, showToast } = useTanxing();
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = async () => {
        if (!q.trim()) return;
        setLoading(true);
        setResults([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `你是一个跨境电商红人数据库搜索引擎。用户搜索词是 "${q}"。
            请生成 6 个高度符合该搜索词、看起来非常真实的 TikTok 达人画像。
            返回一个 JSON 数组，每个对象包含：
            id (唯一字符串), handle (带@的用户名), platform (TikTok), followers (整数，10k到5M之间), region (US/UK/CA), engagement (百分比字符串), gmv (30天销售额，带$单位), tags (数组，3个相关标签)。
            仅返回 JSON 代码块。`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            
            const data = JSON.parse(response.text);
            setResults(data);
        } catch (e) {
            showToast('AI 挖掘引擎受干扰', 'error');
        } finally {
            setLoading(false);
        }
    };

    const injectToPipeline = (inf: any) => {
        const newInf: Influencer = {
            id: `INF-${Date.now()}-${inf.id}`,
            name: inf.handle,
            handle: inf.handle,
            platform: inf.platform || 'TikTok',
            followers: inf.followers,
            country: inf.region || 'US',
            status: 'Prospecting',
            tags: inf.tags || []
        };
        dispatch({ type: 'ADD_INFLUENCER', payload: newInf });
        showToast(`已将达人 ${inf.handle} 注入联络管线`, 'success');
        setResults(prev => prev.filter(r => r.id !== inf.id));
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="ios-glass-panel p-8 rounded-[3rem] border-white/10 bg-indigo-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><Radar className="w-40 h-40 text-indigo-500" /></div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">全网节点挖掘引擎 (Discovery)</h2>
                    <p className="text-xs text-indigo-300 font-bold mb-8 uppercase tracking-widest">根据关键词实时驱动 AI 全网透析潜在带货节点。</p>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-4 text-indigo-400 w-5 h-5" />
                            <input 
                                type="text" 
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="输入品类、关键词或达人风格 (如: 'Cyberpunk PC Builder')..." 
                                className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-indigo-500 outline-none font-bold"
                            />
                        </div>
                        <button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-10 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Radar className="w-5 h-5" />} 启动 AI 挖掘
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-6 text-indigo-400">
                        <div className="relative">
                            <Radar className="w-16 h-16 animate-spin-slow opacity-20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Activity className="w-8 h-8 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse italic">正在透析全网达人数据图谱...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map(res => (
                            <div key={res.id} className="ios-glass-card p-6 border-white/10 hover:border-indigo-500/40 transition-all group animate-in zoom-in-95">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg uppercase">{res.handle.charAt(1)}</div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">预测 GMV (30D)</div>
                                        <div className="text-sm font-black text-emerald-400 font-mono">{res.gmv}</div>
                                    </div>
                                </div>
                                <h4 className="text-lg font-black text-white italic truncate mb-1">{res.handle}</h4>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase">{(res.followers / 1000).toFixed(0)}k Fans</span>
                                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase">{res.region}</span>
                                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                                    <span className="text-[9px] font-black text-amber-500 uppercase">{res.engagement} ENG</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {res.tags?.map((t: string) => (
                                        <span key={t} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-bold text-slate-500 uppercase">{t}</span>
                                    ))}
                                </div>
                                <button onClick={() => injectToPipeline(res)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all flex items-center justify-center gap-2">
                                    <UserPlus className="w-4 h-4"/> 注入业务管线
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4 opacity-30 italic">
                        <UserSearch className="w-16 h-16" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">输入关键词启动 AI 全域探索</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Marketing;