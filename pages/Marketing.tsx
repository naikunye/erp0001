import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTanxing } from '../context/TanxingContext';
import { Influencer, Product } from '../types';
import { 
  Calculator, Search, Plus, Users, 
  Activity, Zap, Box, 
  ChevronRight, ChevronLeft, ExternalLink, Target, 
  BarChart3, Wallet, Info, Mail, MessageSquare, 
  Truck, CheckCircle2, X, Trash2, Save, 
  Sparkles, Loader2, DollarSign, MapPin, 
  Calendar, ArrowRight, UserPlus, Send,
  Globe, LayoutGrid, List, MoreHorizontal, Copy,
  BadgeDollarSign, TrendingDown, ClipboardList, ShieldCheck,
  Megaphone, Smartphone, Video, Link as LinkIcon, Phone,
  Radar, UserSearch, Type, UserPlus2, UserCheck, CreditCard, Tag,
  ExternalLink as LinkOut, LayoutPanelLeft, Compass, Scan, Image as ImageIcon, Camera, Upload, Clipboard
} from 'lucide-react';
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

const Marketing: React.FC = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [viewMode, setViewMode] = useState<'discovery' | 'pipeline' | 'roi'>('pipeline');
    const influencers = state.influencers || [];
    const products = (state.products || []).filter(p => !p.deletedAt);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [editingInf, setEditingInf] = useState<Influencer | null>(null);
    
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [aiResult, setAiResult] = useState<{title: string, content: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- 全局粘贴监听 ---
    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        showToast('检测到剪贴板图像：正在注入视觉解析链路...', 'info');
                        processVisualAsset(file);
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isScanning]); // 依赖 isScanning 防止重叠

    const handleUpdateDraft = (updates: Partial<Influencer>) => {
        if (!editingInf) return;
        setEditingInf({ ...editingInf, ...updates });
    };

    const handleAddNew = () => {
        const newInf: Influencer = {
            id: `INF-${Date.now()}`,
            name: '',
            handle: '@',
            platform: 'TikTok',
            followers: 0,
            country: 'US',
            status: 'Prospecting',
            tags: [],
            sampleCost: 0,
            generatedSales: 0,
            email: '',
            whatsapp: '',
            shippingAddress: '',
            notes: '',
            videoUrl: '',
            sampleCarrier: 'UPS',
            sampleProductSku: '',
            sampleDate: new Date().toISOString().split('T')[0]
        };
        setEditingInf(newInf);
    };

    // --- 核心：视觉资产处理引擎 (支持上传和粘贴) ---
    const processVisualAsset = async (file: File) => {
        if (isScanning) return;
        if (!process.env.API_KEY) {
            showToast('AI 密钥未配置', 'error');
            return;
        }

        setIsScanning(true);
        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });
            const base64Data = await base64Promise;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `你是一个专业的社交媒体数据抓取专家。请分析这张 TikTok/YouTube/Instagram 主页截图。
            提取以下信息并以 JSON 格式返回：
            {
              "handle": "@用户名",
              "followers": 粉丝数量整数,
              "country": "US/UK等国家代码",
              "platform": "TikTok/YouTube/Instagram",
              "notes": "从简介中提取的达人风格描述",
              "tags": ["标签1", "标签2"]
            }
            要求：如果无法确定某项，请填入合理推测或留空。 handle 必须以 @ 开头。`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: file.type } },
                        { text: prompt }
                    ]
                }
            });

            const rawText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawText);

            const newInf: Influencer = {
                id: `INF-AI-${Date.now()}`,
                name: '',
                handle: parsed.handle || '@',
                platform: parsed.platform || 'TikTok',
                followers: parsed.followers || 0,
                country: parsed.country || 'US',
                status: 'Prospecting',
                tags: parsed.tags || [],
                sampleCost: 0,
                generatedSales: 0,
                email: '',
                whatsapp: '',
                shippingAddress: '',
                notes: parsed.notes || '由 AI 视觉识别（粘贴/上传）自动录入。',
                sampleCarrier: 'UPS',
                sampleDate: new Date().toISOString().split('T')[0]
            };
            
            setEditingInf(newInf);
            showToast('视觉特征提取成功：档案已自动生成', 'success');
        } catch (error) {
            console.error(error);
            showToast('图像识别受干扰，请尝试手动录入或重新截图', 'error');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processVisualAsset(file);
    };

    const commitChanges = () => {
        if (!editingInf) return;
        if (!editingInf.handle || editingInf.handle === '@') {
            showToast('请输入有效的达人 Handle', 'warning');
            return;
        }
        const exists = influencers.find(i => i.id === editingInf.id);
        if (exists) {
            dispatch({ type: 'UPDATE_INFLUENCER', payload: editingInf });
        } else {
            dispatch({ type: 'ADD_INFLUENCER', payload: editingInf });
        }
        showToast('达人数字化档案已同步并锁定', 'success');
        setEditingInf(null);
    };

    const handleDelete = () => {
        if (!editingInf) return;
        if (confirm('确认物理销毁该达人节点？此操作将抹除所有关联的财务权重。')) {
            dispatch({ type: 'DELETE_INFLUENCER', payload: editingInf.id });
            showToast('节点已从矩阵中移除', 'info');
            setEditingInf(null);
        }
    };

    const moveStage = (inf: Influencer, direction: 'forward' | 'backward') => {
        const currentIndex = STAGES.findIndex(s => s.id === inf.status);
        const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < STAGES.length) {
            const updated = { ...inf, status: STAGES[nextIndex].id };
            dispatch({ type: 'UPDATE_INFLUENCER', payload: updated });
            showToast(`状态迁移: ${STAGES[nextIndex].label}`, 'info');
        }
    };

    const runAiAgent = async (inf: Influencer, type: 'outreach' | 'strategy') => {
        if (!process.env.API_KEY) {
            showToast('AI 密钥未就绪', 'error');
            return;
        }
        setIsAiGenerating(true);
        setAiResult(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = type === 'outreach' 
                ? `为 TikTok 达人 ${inf.handle} (${inf.followers}粉丝) 写一封极其专业的商务建联私信。要求：英语，包括自我介绍、产品优势、分佣意向。`
                : `分析达人 ${inf.handle} 的内容风格，并为他准备 3 个针对跨境电商产品的爆款视频脚本创意方向。`;
            
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setAiResult({
                title: type === 'outreach' ? 'AI 智能邀约方案' : 'AI 爆款视频策略',
                content: response.text
            });
        } catch (e) {
            setAiResult({ title: '系统错误', content: "AI 神经元连接异常，请稍后重试。" });
        } finally {
            setIsAiGenerating(false);
        }
    };

    const openTkProfile = (handle: string) => {
        const clean = handle.replace('@', '');
        window.open(`https://www.tiktok.com/@${clean}`, '_blank');
    };

    const filteredInfluencers = influencers.filter(i => 
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.handle || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
            {/* 顶层控制中枢 */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0 bg-black/40 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4 italic">
                        <Megaphone className="w-10 h-10 text-indigo-500" />
                        达人营销·指挥中心
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-2 tracking-[0.4em]">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> NETWORK NODES: {influencers.length} | VISION: PASTE READY
                    </p>
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                        <input 
                            type="text" 
                            placeholder="检索 Handle 或 节点 ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-xs text-white focus:border-indigo-500 outline-none w-72 transition-all font-bold"
                        />
                    </div>
                    
                    <div className="flex flex-col items-center gap-1.5">
                        <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*" className="hidden" />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isScanning}
                            className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
                        >
                            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />} 视觉扫描录入
                        </button>
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] animate-pulse">支持 Ctrl+V 直接粘贴截图</span>
                    </div>

                    <button 
                        onClick={handleAddNew}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl transition-all active:scale-95 italic"
                    >
                        <UserPlus2 className="w-5 h-5" /> 注册新达人
                    </button>
                </div>

                {/* 扫描时的背景光效 */}
                {isScanning && (
                    <div className="absolute inset-0 bg-indigo-600/5 animate-pulse pointer-events-none"></div>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {viewMode === 'pipeline' && (
                    <div className="h-full overflow-x-auto custom-scrollbar pb-6 scroll-smooth">
                        <div className="flex gap-6 h-full min-w-[1800px] px-2">
                            {STAGES.map(stage => (
                                <div key={stage.id} className="flex-1 flex flex-col min-w-[340px] group/stage">
                                    <div className="p-5 mb-5 border-b border-white/10 flex justify-between items-center bg-white/2 rounded-2xl backdrop-blur-md group-hover/stage:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-7 rounded-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: ROI_COLORS[stage.id] }}></div>
                                            <span className="text-xs font-black text-slate-200 uppercase italic tracking-[0.2em]">{stage.label}</span>
                                        </div>
                                        <span className="bg-black px-3 py-1 rounded-xl text-[10px] font-black text-indigo-400 font-mono border border-white/10">
                                            {filteredInfluencers.filter(i => i.status === stage.id).length}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-2">
                                        {filteredInfluencers.filter(i => i.status === stage.id).map(inf => {
                                            const roi = inf.sampleCost && inf.sampleCost > 0 ? (inf.generatedSales || 0) / inf.sampleCost : 0;
                                            return (
                                                <div 
                                                    key={inf.id} 
                                                    onClick={() => setEditingInf(inf)}
                                                    className={`ios-glass-card p-6 transition-all group relative cursor-pointer bg-[#08080a]/90 border-white/5 ${roi > 5 ? 'roi-high-glow ring-1 ring-emerald-500/30' : 'hover:border-indigo-500/50'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-black text-white text-xl tracking-tighter truncate group-hover:text-indigo-400 transition-colors uppercase italic">{inf.handle}</div>
                                                            <div className="flex gap-2 mt-2">
                                                                <span className="text-[9px] px-2 py-0.5 bg-white/5 text-slate-400 rounded-lg border border-white/10 font-black uppercase">{inf.platform}</span>
                                                                <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 font-black">{(inf.followers / 1000).toFixed(0)}k Fans</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                            <div className="flex gap-1.5">
                                                                <button onClick={(e) => { e.stopPropagation(); moveStage(inf, 'backward'); }} className="p-2 bg-white/10 text-slate-400 rounded-xl hover:text-white" title="移回上阶段"><ChevronLeft className="w-4 h-4"/></button>
                                                                <button onClick={(e) => { e.stopPropagation(); moveStage(inf, 'forward'); }} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg" title="进入下阶段"><ChevronRight className="w-4 h-4"/></button>
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); openTkProfile(inf.handle); }} className="p-2 bg-black/60 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-colors" title="TK 直连"><Compass className="w-4 h-4"/></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingInf(inf); }} className="p-2 bg-white/10 text-slate-400 rounded-xl hover:text-white"><MoreHorizontal className="w-4 h-4"/></button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mt-6">
                                                        <a 
                                                            href={inf.whatsapp ? `https://wa.me/${inf.whatsapp.replace(/\D/g,'')}` : '#'} 
                                                            target="_blank" rel="noreferrer" 
                                                            onClick={e => { if(!inf.whatsapp) { e.preventDefault(); showToast('WhatsApp 未录入', 'warning'); } e.stopPropagation(); }}
                                                            className={`flex items-center justify-center gap-2 py-3 border rounded-2xl text-[9px] font-black transition-all ${inf.whatsapp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-black/20 border-white/5 text-slate-700'}`}
                                                        >
                                                            <MessageSquare className="w-4 h-4" /> WHATSAPP
                                                        </a>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setEditingInf(inf); }}
                                                            className="flex items-center justify-center gap-2 py-3 bg-purple-600/10 border border-purple-500/20 rounded-2xl text-[9px] font-black text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
                                                        >
                                                            <Zap className="w-4 h-4" /> 配置/核销
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="mt-5 pt-5 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                        <span className="flex items-center gap-2"><Globe className="w-3 h-3 text-indigo-600"/> {inf.country}</span>
                                                        <span className={`font-mono ${roi > 3 ? 'text-emerald-500' : 'text-slate-700'}`}>{roi.toFixed(1)}x ROI</span>
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
            </div>

            {/* 全功能数字化档案编辑面板 Portal */}
            {editingInf && createPortal(
                <div className="fixed inset-0 z-[999] flex justify-end" onClick={() => setEditingInf(null)}>
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300"></div>
                    <div className="w-full max-w-6xl bg-[#030305] border-l border-white/10 h-full relative z-10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
                        <div className="p-10 border-b border-white/10 flex justify-between items-start bg-white/2 shrink-0">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-white text-4xl font-black shadow-2xl relative overflow-hidden ring-8 ring-white/5 group cursor-pointer">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white,transparent)] opacity-10"></div>
                                    {editingInf.handle?.charAt(1).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="relative group">
                                            <input 
                                                className="text-5xl font-black text-white italic tracking-tighter uppercase bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-all w-fit min-w-[280px] pr-12"
                                                value={editingInf.handle}
                                                placeholder="@HANDLE"
                                                onChange={e => handleUpdateDraft({ handle: e.target.value })}
                                            />
                                            <button 
                                                onClick={() => openTkProfile(editingInf.handle)}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all"
                                                title="直连达人专业版 TikTok 界面"
                                            >
                                                <Compass className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <span className={`text-[11px] font-black px-4 py-1.5 rounded-full border-2 uppercase tracking-widest ${getStatusColor(editingInf.status)}`}>{editingInf.status}</span>
                                    </div>
                                    <div className="flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                        <div className="flex items-center gap-2.5">
                                            <select 
                                                value={editingInf.platform} 
                                                onChange={e => handleUpdateDraft({ platform: e.target.value as any })}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-indigo-400 outline-none"
                                            >
                                                <option value="TikTok">TikTok Network</option>
                                                <option value="YouTube">YouTube Hub</option>
                                                <option value="Instagram">Instagram Node</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-indigo-400">
                                            <Users className="w-4 h-4"/> 
                                            <input 
                                                type="number" 
                                                className="bg-transparent border-b border-white/5 w-32 outline-none focus:border-indigo-500 text-white font-mono"
                                                value={editingInf.followers}
                                                onChange={e => handleUpdateDraft({ followers: parseInt(e.target.value) || 0 })}
                                            />
                                            <span>FANS</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <Tag className="w-4 h-4 text-slate-600"/>
                                            <input 
                                                className="bg-transparent border-b border-white/5 w-40 outline-none focus:border-indigo-500 text-slate-300"
                                                value={editingInf.name}
                                                placeholder="真名 / 内部标识..."
                                                onChange={e => handleUpdateDraft({ name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setEditingInf(null)} className="p-4 hover:bg-white/10 rounded-[1.5rem] transition-all"><X className="w-10 h-10 text-slate-600 hover:text-white" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-10">
                                
                                {/* 列1：联络协议与身份 */}
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                                            <div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div>
                                            联络指挥条 (Direct Protocols)
                                        </h4>
                                        <div className="space-y-4 bg-white/2 p-8 rounded-[2.5rem] border border-white/5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-emerald-400"/> WhatsApp</label>
                                                <input type="text" value={editingInf.whatsapp || ''} onChange={e => handleUpdateDraft({whatsapp: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" placeholder="+1..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-400"/> Email Address</label>
                                                <input type="text" value={editingInf.email || ''} onChange={e => handleUpdateDraft({email: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" placeholder="collab@..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-purple-400"/> 国家/地区</label>
                                                <input type="text" value={editingInf.country || ''} onChange={e => handleUpdateDraft({country: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white" placeholder="US / UK..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5 text-indigo-400"/> 专业主页 URL</label>
                                                <div className="relative">
                                                    <input type="text" value={editingInf.videoUrl || ''} onChange={e => handleUpdateDraft({videoUrl: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white font-mono" placeholder="https://..." />
                                                    <button onClick={() => editingInf.videoUrl && window.open(editingInf.videoUrl, '_blank')} className="absolute right-4 top-4 text-slate-500 hover:text-white"><LinkOut className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">AI 战术辅助</h4>
                                            <button onClick={() => runAiAgent(editingInf, 'strategy')} className="px-5 py-2 bg-purple-600/10 text-purple-400 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all">内容策推</button>
                                        </div>
                                        {isAiGenerating ? (
                                            <div className="h-40 bg-white/2 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                            </div>
                                        ) : aiResult ? (
                                            <div className="bg-gradient-to-br from-indigo-950/40 to-black border border-indigo-500/30 rounded-[2rem] p-6 animate-in zoom-in-95">
                                                <p className="text-xs text-indigo-100 leading-relaxed italic">{aiResult.content}</p>
                                            </div>
                                        ) : (
                                            <div className="h-20 bg-white/2 border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center text-slate-800 text-[10px] font-black uppercase">启动 AI 基因分析</div>
                                        )}
                                    </div>
                                </div>

                                {/* 列2：履约与物流 */}
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                                            <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                                            样品寄送协议 (Sample Logic)
                                        </h4>
                                        <div className="bg-white/2 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-600 font-black uppercase">关联测款 SKU</label>
                                                <select value={editingInf.sampleProductSku || ''} onChange={e => handleUpdateDraft({sampleProductSku: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white">
                                                    <option value="">未挂载产品...</option>
                                                    {products.map(p => <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-slate-600 font-black uppercase">承运商</label>
                                                    <input type="text" value={editingInf.sampleCarrier || ''} onChange={e => handleUpdateDraft({sampleCarrier: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" placeholder="FedEx/UPS/USPS" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-slate-600 font-black uppercase">寄送日期</label>
                                                    <input type="date" value={editingInf.sampleDate || ''} onChange={e => handleUpdateDraft({sampleDate: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-blue-400"/> 物流追踪号 (Tracking)</label>
                                                <input type="text" value={editingInf.sampleTrackingNo || ''} onChange={e => handleUpdateDraft({sampleTrackingNo: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" placeholder="ID: 1Z..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-rose-500"/> 收货物理网格 (Full Address)</label>
                                                <textarea value={editingInf.shippingAddress || ''} onChange={e => handleUpdateDraft({shippingAddress: e.target.value})} className="w-full h-32 bg-black/60 border border-white/10 rounded-[1.8rem] p-5 text-sm text-white focus:border-indigo-500 outline-none resize-none shadow-inner" placeholder="姓名、电话、街道、城市、邮编..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 列3：经营审计与备注 */}
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                                            经营效益审计 (ROI Matrix)
                                        </h4>
                                        <div className="bg-gradient-to-br from-[#0c0c0f] to-[#050508] border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                                            <div className="space-y-6 relative z-10">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-amber-500"/> 样品总投入 (货值+运费 $)</label>
                                                    <input type="number" value={editingInf.sampleCost || ''} onChange={e => handleUpdateDraft({sampleCost: parseFloat(e.target.value) || 0})} className="w-full bg-black/80 border border-white/10 rounded-2xl p-4 text-2xl font-black text-white font-mono shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-slate-600 font-black uppercase flex items-center gap-2"><BadgeDollarSign className="w-3.5 h-3.5 text-emerald-500"/> 累计 GMV 产出 ($)</label>
                                                    <input type="number" value={editingInf.generatedSales || ''} onChange={e => handleUpdateDraft({generatedSales: parseFloat(e.target.value) || 0})} className="w-full bg-black/80 border border-white/10 rounded-2xl p-4 text-2xl font-black text-emerald-400 font-mono shadow-inner" />
                                                </div>
                                                <div className="flex flex-col items-center bg-white/2 rounded-[2rem] p-8 border border-white/10 shadow-inner">
                                                    <div className="text-[10px] text-slate-500 font-black uppercase mb-3 tracking-[0.4em]">Node Efficiency</div>
                                                    <div className={`text-7xl font-black font-mono tracking-tighter transition-all ${(editingInf.generatedSales || 0) / (editingInf.sampleCost || 1) > 5 ? 'text-emerald-400 shadow-emerald-500/20' : 'text-slate-600'}`}>
                                                        {editingInf.sampleCost && editingInf.sampleCost > 0 ? (editingInf.generatedSales! / editingInf.sampleCost).toFixed(2) : '0.00'}
                                                        <span className="text-xl ml-2 text-slate-800 font-black">X</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                                            <div className="w-1.5 h-5 bg-slate-700 rounded-full"></div>
                                            战术笔记 (Intelligence)
                                        </h4>
                                        <textarea value={editingInf.notes || ''} onChange={e => handleUpdateDraft({notes: e.target.value})} className="w-full h-40 bg-black/40 border border-white/10 rounded-[2rem] p-6 text-sm text-slate-400 outline-none" placeholder="记录达人风格、偏好、合作条款等关键情报..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-white/10 bg-white/2 shrink-0 flex justify-between gap-6 backdrop-blur-3xl">
                            <button onClick={handleDelete} className="px-10 py-5 text-[11px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10 rounded-2xl transition-all flex items-center gap-2"><Trash2 className="w-5 h-5"/> TERMINATE</button>
                            <div className="flex gap-6">
                                <button onClick={() => setEditingInf(null)} className="px-10 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">ABORT</button>
                                <button onClick={commitChanges} className="px-16 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 italic shadow-indigo-900/40"><ShieldCheck className="w-6 h-6"/> EXECUTE SYNC</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Marketing;