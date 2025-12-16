
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Megaphone, Wand2, RefreshCw, Copy, Check, Hash, TrendingUp, 
  Users, Video, Type as TypeIcon, Mail, Sparkles, Loader2, Share2, 
  BarChart3, Target, Zap, Sliders, Split, Trophy, Percent, MousePointerClick,
  Smartphone, Instagram, Send, Heart, MessageCircle, Bookmark, Music2,
  ThumbsUp, UserCircle2, Ghost, BrainCircuit, Activity, Cpu, Layers, Globe,
  LayoutDashboard, DollarSign, ArrowUpRight, ArrowDownRight, Search, Radar as RadarIcon,
  PlayCircle, PauseCircle, Gauge, AlertCircle, FlaskConical, PenTool, X, Save,
  Plus, Calendar, Gift, Link, Truck, MessageSquare, Calculator, Bot, Trash2, Edit2, Compass, AlertTriangle,
  CandlestickChart, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, ComposedChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine, ErrorBar, Scatter
} from 'recharts';
import { AdCampaign, Influencer, InfluencerStatus } from '../types';

// --- Types ---
type Platform = 'TikTok' | 'Instagram' | 'RedNote';
type Persona = 'Gen Z' | 'Professional' | 'Mom' | 'Techie';

// --- STYLES FOR FLOWING BORDER ---
const FLOWING_BORDER_STYLES = `
  @keyframes border-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .flowing-border-container {
    position: relative;
    border-radius: 0.75rem;
    z-index: 0;
    overflow: hidden;
  }
  .flowing-border-container::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(60deg, #6366f1, #a855f7, #06b6d4, #6366f1);
    background-size: 300% 300%;
    animation: border-flow 4s ease infinite;
    z-index: -1;
    border-radius: 0.85rem;
    opacity: 0.8;
  }
  .glass-inner {
    background: rgba(15, 23, 42, 0.85); /* Slate-900 with opacity */
    backdrop-filter: blur(16px);
    border-radius: 0.75rem;
    height: 100%;
    width: 100%;
    position: relative;
    z-index: 1;
  }
`;

// --- Helper Component: Flowing Border Card ---
const FlowingBorderCard: React.FC<{ children: React.ReactNode, className?: string, p?: string }> = ({ children, className = '', p = 'p-4' }) => (
  <div className={`flowing-border-container ${className}`}>
    <div className={`glass-inner ${p} flex flex-col justify-between h-full border border-white/10`}>
      {children}
    </div>
  </div>
);

// --- Custom Components ---
const MetricCard = ({ label, value, subValue, trend, icon: Icon, color = "text-white" }: any) => (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/5 transition-colors group">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
            <Icon className={`w-4 h-4 ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
        </div>
        <div>
            <div className="text-2xl font-mono font-bold text-white">{value}</div>
            <div className="flex justify-between items-end mt-1">
                <span className="text-[10px] text-slate-500">{subValue}</span>
                {trend && (
                    <span className={`text-[10px] font-bold flex items-center ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    </div>
);

// --- 0. MARKETING COCKPIT (New Dashboard) ---
const MarketingCockpit = () => {
    const { state } = useTanxing();
    
    // Mock Data for Forecast
    const forecastData = useMemo(() => {
        const data = [];
        const today = new Date();
        // Past 14 days + Future 7 days
        for (let i = -14; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const isFuture = i > 0;
            const baseEng = 5000 + Math.random() * 2000;
            
            data.push({
                date: date.toISOString().split('T')[0].slice(5),
                isFuture,
                Actual: isFuture ? null : baseEng,
                Predicted: isFuture ? baseEng * (1 + i * 0.05) : null, // Growth trend
                ConfidenceLower: isFuture ? baseEng * (1 + i * 0.02) : null,
                ConfidenceUpper: isFuture ? baseEng * (1 + i * 0.08) : null,
            });
        }
        return data;
    }, []);

    // Mock K-Line Data (Ad Market Volatility - CPA)
    const kLineData = useMemo(() => {
        return Array.from({length: 10}, (_, i) => {
            const open = 10 + Math.random() * 5;
            const close = 10 + Math.random() * 5;
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            return {
                day: `D-${10-i}`,
                open, close, high, low,
                range: [low, high] // For Floating Bar
            };
        });
    }, []);

    // Competitor Data
    const radarData = [
        { subject: 'SOV (声量)', A: 85, B: 60, fullMark: 100 },
        { subject: 'Sentiment (好评)', A: 90, B: 75, fullMark: 100 },
        { subject: 'CPA (成本)', A: 65, B: 85, fullMark: 100 }, // Lower is better, but here assume normalized score
        { subject: 'Creative (创意)', A: 80, B: 70, fullMark: 100 },
        { subject: 'Conversion (转化)', A: 75, B: 65, fullMark: 100 },
    ];

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FlowingBorderCard p="p-4" className="md:col-span-1">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">AI 预测 ROI (30d)</span>
                        </div>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                            4.25x
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                            Confidence: <span className="text-emerald-400 font-bold">High (89%)</span>
                        </div>
                    </div>
                </FlowingBorderCard>
                
                <MetricCard label="当前 CAC (获客成本)" value="$12.45" subValue="Target: $10.00" trend={-5.2} icon={Target} color="text-emerald-400" />
                <MetricCard label="全网声量 (Mentions)" value="24.5k" subValue="Weekly Volume" trend={18.3} icon={MessageCircle} color="text-blue-400" />
                <MetricCard label="竞品活跃指数" value="High" subValue="Alert: Price Drop" trend={12.0} icon={AlertTriangle} color="text-orange-400" />
            </div>

            {/* Main Dashboard Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                
                {/* Left Column: Forecast & Trend */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Forecast Chart */}
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 z-10">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-cyan-400" /> 
                                    全渠道互动量预测 (Engagement Forecast)
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-1">Grey: Historical • Purple: AI Prediction Range</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-slate-400">TikTok</span>
                                <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-slate-400">IG</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 w-full min-h-0 z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Area type="monotone" dataKey="Actual" stroke="#94a3b8" strokeWidth={2} fill="url(#colorActual)" />
                                    <Area type="monotone" dataKey="Predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorPred)" />
                                    <Area type="monotone" dataKey="ConfidenceUpper" stroke="none" fill="#8b5cf6" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Volatility K-Line (Simplified) */}
                    <div className="h-64 bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <CandlestickChart className="w-4 h-4 text-pink-400" /> 
                            CPA 市场波动率 (Market Volatility)
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={kLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} unit="$" />
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-black/90 border border-white/10 p-2 rounded text-xs text-white font-mono">
                                                        <div>Open: {d.open.toFixed(2)}</div>
                                                        <div>Close: {d.close.toFixed(2)}</div>
                                                        <div>High: {d.high.toFixed(2)}</div>
                                                        <div>Low: {d.low.toFixed(2)}</div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {/* Wicks (using ErrorBar simulation logic or simpler range bar) */}
                                    {/* Using Floating Bar to represent High-Low Range */}
                                    <Bar dataKey="range" fill="#334155" barSize={2} />
                                    {/* Using Floating Bar to represent Body (Open-Close) */}
                                    <Bar dataKey="range" fill="transparent" barSize={8}>
                                        {kLineData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                    {/* Proper Body Implementation using stacked bar logic is complex, simpler approximation: Scatter for Open/Close? */}
                                    <Scatter dataKey="close" shape="square" fill="#fff" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Competitor & Strategy */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Radar Chart */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 h-80 flex flex-col">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                            <RadarIcon className="w-4 h-4 text-orange-400" /> 
                            竞品能力雷达 (Competitor Radar)
                        </h3>
                        <div className="flex-1 w-full min-h-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="My Brand" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                                    <Radar name="Competitor" dataKey="B" stroke="#ec4899" strokeWidth={2} fill="#ec4899" fillOpacity={0.3} />
                                    <Legend wrapperStyle={{fontSize: '10px'}} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Strategy Suggestions */}
                    <div className="flex-1 bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/30 rounded-xl p-5 flex flex-col">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <BrainCircuit className="w-4 h-4 text-indigo-400" /> 
                            AI 策略建议 (Tactics)
                        </h3>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs">
                                <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> 增加预算建议</div>
                                <p className="text-indigo-100/80 leading-relaxed">ROI 预测显示未来 7 天有 15% 上行空间。建议将 TikTok 广告预算提高 20%。</p>
                            </div>
                            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs">
                                <div className="font-bold text-orange-300 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 竞品降价预警</div>
                                <p className="text-orange-100/80 leading-relaxed">监测到主要竞品 SKU-A 在 Amazon 降价 10%。建议启动 "Bundle Deal" 应对。</p>
                            </div>
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
                                <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1"><Check className="w-3 h-3"/> 优质素材发现</div>
                                <p className="text-emerald-100/80 leading-relaxed">视频 "Unboxing V2" CTR 突破 3.5%，建议复制该脚本结构制作新素材。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 1. INFLUENCER CRM (Seeding)
const InfluencerCRM = () => {
    const { state, dispatch, showToast } = useTanxing();
    const { influencers, products } = state;
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSampleModal, setShowSampleModal] = useState<Influencer | null>(null);
    const [editingInf, setEditingInf] = useState<Influencer | null>(null);
    
    // Outreach Modal State
    const [showOutreachModal, setShowOutreachModal] = useState<Influencer | null>(null);
    const [emailDraft, setEmailDraft] = useState('');
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

    const [newInf, setNewInf] = useState<Partial<Influencer>>({
        name: '', handle: '', platform: 'TikTok', followers: 0, country: 'US', status: 'To Contact', tags: []
    });
    const [sampleForm, setSampleForm] = useState({ sku: '', tracking: '', cost: 0 });

    const stages: { id: InfluencerStatus, label: string, color: string }[] = [
        { id: 'To Contact', label: '待联系 (To Contact)', color: 'border-slate-600' },
        { id: 'Sample Sent', label: '已寄样 (Sample Sent)', color: 'border-blue-500' },
        { id: 'Video Live', label: '视频已发布 (Live)', color: 'border-pink-500' },
        { id: 'Completed', label: '结算/归档 (Done)', color: 'border-emerald-500' },
    ];

    // Filter Logic
    const filteredInfluencers = influencers.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.handle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handlers
    const handleSaveInfluencer = () => {
        if (!newInf.name || !newInf.handle) {
            showToast('请填写昵称和账号', 'warning');
            return;
        }
        
        if (editingInf) {
            dispatch({ type: 'UPDATE_INFLUENCER', payload: { ...editingInf, ...newInf } as Influencer });
            showToast('红人信息已更新', 'success');
        } else {
            const inf: Influencer = {
                id: `INF-${Date.now()}`,
                name: newInf.name!,
                handle: newInf.handle!,
                platform: newInf.platform as any,
                followers: newInf.followers || 0,
                country: newInf.country || 'US',
                status: 'To Contact',
                tags: newInf.tags || []
            };
            dispatch({ type: 'ADD_INFLUENCER', payload: inf });
            showToast('红人已添加', 'success');
        }
        
        setShowAddModal(false);
        setEditingInf(null);
        setNewInf({ name: '', handle: '', platform: 'TikTok', followers: 0, country: 'US', status: 'To Contact', tags: [] });
    };

    const handleEdit = (inf: Influencer) => {
        setEditingInf(inf);
        setNewInf({ ...inf });
        setShowAddModal(true);
    };

    const handleDelete = (id: string) => {
        if(confirm('确定要删除此红人记录吗？')) {
            dispatch({ type: 'DELETE_INFLUENCER', payload: id });
            showToast('已删除', 'info');
        }
    };

    const handleSendSample = () => {
        if (!showSampleModal || !sampleForm.sku) return;
        const product = products.find(p => p.sku === sampleForm.sku);
        if (!product) { showToast('找不到该 SKU', 'error'); return; }
        const updatedInf: Influencer = {
            ...showSampleModal, status: 'Sample Sent', sampleProductSku: sampleForm.sku, sampleDate: new Date().toISOString().split('T')[0], sampleCost: (product.costPrice || 0) + 5 
        };
        dispatch({ type: 'UPDATE_INFLUENCER', payload: updatedInf });
        showToast(`样品 ${sampleForm.sku} 已标记为寄出`, 'success');
        setShowSampleModal(null);
        setSampleForm({ sku: '', tracking: '', cost: 0 });
    };

    const handleUpdateStatus = (inf: Influencer, newStatus: InfluencerStatus) => {
        if (newStatus === 'Sample Sent' && inf.status !== 'Sample Sent') { setShowSampleModal(inf); return; }
        dispatch({ type: 'UPDATE_INFLUENCER', payload: { ...inf, status: newStatus } });
    };

    const handleCopyEmail = () => {
        if (!emailDraft) return;
        navigator.clipboard.writeText(emailDraft);
        showToast('邮件内容已复制到剪贴板', 'success');
    };

    // --- AI Outreach Logic ---
    const handleOpenOutreach = (inf: Influencer) => {
        setShowOutreachModal(inf);
        generateEmail(inf);
    };

    const generateEmail = async (inf: Influencer) => {
        setIsGeneratingEmail(true);
        setEmailDraft('');
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                Write a concise, engaging outreach email to an influencer.
                Influencer: ${inf.name} (${inf.platform}, ${inf.followers} followers).
                Context: We are a cool tech brand "Tanxing". We want to send them a free sample of our new cyberpunk mechanical keyboard.
                Tone: Professional but exciting, localized for ${inf.country}.
                
                Structure:
                Subject: ...
                Body: ...
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setEmailDraft(response.text || "无法生成邮件。");
        } catch (e) {
            setEmailDraft("AI 生成失败，请检查 API Key。");
        } finally {
            setIsGeneratingEmail(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 relative">
            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    {stages.map(stage => (
                        <div key={stage.id} className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl min-w-[280px]">
                            <div className={`p-3 border-b border-white/5 rounded-t-xl flex justify-between items-center ${stage.id === 'Video Live' ? 'bg-pink-900/10' : 'bg-white/5'}`}>
                                <div className="font-bold text-sm text-slate-200">{stage.label}</div>
                                <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-slate-400 border border-white/5">{filteredInfluencers.filter(i => i.status === stage.id).length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {filteredInfluencers.filter(i => i.status === stage.id).map(inf => (
                                    <div key={inf.id} className="bg-black/40 border border-white/5 rounded-lg p-3 hover:border-pink-500/50 hover:bg-white/5 transition-all group relative shadow-lg hover:shadow-pink-500/10">
                                        
                                        {/* Edit/Delete Actions */}
                                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button onClick={() => handleEdit(inf)} className="p-1 text-slate-400 hover:text-white bg-black/60 rounded hover:bg-slate-700"><Edit2 className="w-3 h-3" /></button>
                                            <button onClick={() => handleDelete(inf.id)} className="p-1 text-slate-400 hover:text-red-400 bg-black/60 rounded hover:bg-slate-700"><Trash2 className="w-3 h-3" /></button>
                                        </div>

                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs shadow-lg ring-1 ring-white/10">{inf.name.charAt(0)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-sm truncate">{inf.handle}</div>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1">{inf.platform} • {(inf.followers/1000).toFixed(1)}k</div>
                                            </div>
                                            <div className="text-[10px] bg-black/20 border border-white/5 px-1.5 py-0.5 rounded text-slate-400">{inf.country}</div>
                                        </div>

                                        {inf.status === 'To Contact' && (
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => handleOpenOutreach(inf)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs border border-white/10 flex items-center justify-center gap-1 transition-colors"><MessageSquare className="w-3 h-3" /> 话术</button>
                                                <button onClick={() => handleUpdateStatus(inf, 'Sample Sent')} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1 shadow-lg shadow-indigo-900/30 transition-colors"><Gift className="w-3 h-3" /> 寄样</button>
                                            </div>
                                        )}
                                        {inf.status === 'Sample Sent' && (
                                            <div className="mt-2 text-xs bg-black/20 p-2 rounded border border-white/5">
                                                <div className="text-slate-400 flex items-center gap-1 mb-1"><Gift className="w-3 h-3"/> SKU: {inf.sampleProductSku}</div>
                                                <div className="text-slate-500 text-[10px]">{inf.sampleDate}</div>
                                                <button onClick={() => handleUpdateStatus(inf, 'Video Live')} className="w-full mt-2 py-1 bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white rounded border border-pink-600/30 transition-colors">录入视频</button>
                                            </div>
                                        )}
                                        {(inf.status === 'Video Live' || inf.status === 'Completed') && (
                                            <div className="mt-2 text-xs">
                                                <div className="grid grid-cols-2 gap-1 bg-black/20 p-2 rounded border border-white/5">
                                                    <div><div className="text-[9px] text-slate-500">GMV</div><div className="text-white font-mono">${inf.generatedSales}</div></div>
                                                    <div><div className="text-[9px] text-slate-500">ROI</div><div className={`font-mono font-bold ${(inf.roi || 0) > 2 ? 'text-emerald-400' : 'text-red-400'}`}>{inf.roi}x</div></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Outreach Modal */}
            {showOutreachModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowOutreachModal(null)}>
                    <div className="ios-glass-panel w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> AI 智能外联 (Outreach Agent)</h3>
                            <button onClick={() => setShowOutreachModal(null)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
                        </div>
                        <div className="flex-1 flex p-6 gap-6 overflow-hidden">
                            {/* Profile */}
                            <div className="w-1/3 border-r border-white/10 pr-6 space-y-4">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 mb-2 flex items-center justify-center text-2xl font-bold ring-2 ring-white/10">{showOutreachModal.name.charAt(0)}</div>
                                    <h4 className="font-bold text-white">{showOutreachModal.name}</h4>
                                    <p className="text-slate-500 text-sm">{showOutreachModal.platform} • {showOutreachModal.country}</p>
                                </div>
                                <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-xs space-y-2">
                                    <div className="flex justify-between"><span className="text-slate-500">粉丝数</span><span className="text-white">{showOutreachModal.followers}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">风格</span><span className="text-white">Tech / Gaming</span></div>
                                </div>
                                <button 
                                    onClick={() => generateEmail(showOutreachModal)} 
                                    className="w-full py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className={`w-3 h-3 ${isGeneratingEmail ? 'animate-spin' : ''}`} /> 重新生成
                                </button>
                            </div>
                            
                            {/* Email Draft */}
                            <div className="flex-1 flex flex-col">
                                <label className="text-xs text-slate-500 uppercase font-bold mb-2">AI 生成草稿 (Email Draft)</label>
                                <textarea 
                                    value={emailDraft}
                                    onChange={e => setEmailDraft(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 resize-none font-mono leading-relaxed"
                                    placeholder="正在生成..."
                                />
                                <div className="mt-4 flex justify-end gap-3">
                                    <button onClick={handleCopyEmail} className="px-4 py-2 text-slate-400 hover:text-white text-sm flex items-center gap-2"><Copy className="w-4 h-4"/> 复制</button>
                                    <button 
                                        onClick={() => { showToast('邮件已发送', 'success'); setShowOutreachModal(null); }}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" /> 发送
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Modals (Add, Sample) */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
                    <div className="ios-glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">{editingInf ? '编辑红人' : '添加红人'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">昵称</label>
                                <input type="text" value={newInf.name} onChange={e => setNewInf({...newInf, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">平台账号 (@Handle)</label>
                                <input type="text" value={newInf.handle} onChange={e => setNewInf({...newInf, handle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">粉丝数</label>
                                    <input type="number" value={newInf.followers} onChange={e => setNewInf({...newInf, followers: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">国家</label>
                                    <input type="text" value={newInf.country} onChange={e => setNewInf({...newInf, country: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                                </div>
                            </div>
                            <button onClick={handleSaveInfluencer} className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white rounded text-sm font-bold mt-2 shadow-lg shadow-pink-900/30">保存</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showSampleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowSampleModal(null)}>
                    <div className="ios-glass-panel w-full max-w-sm rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">寄样登记</h3>
                        <div className="space-y-4">
                            <select value={sampleForm.sku} onChange={e => setSampleForm({...sampleForm, sku: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white"><option value="">Select SKU...</option>{products.map(p => <option key={p.id} value={p.sku}>{p.sku}</option>)}</select>
                            <button onClick={handleSendSample} className="w-full py-2 bg-indigo-600 text-white rounded font-bold shadow-lg">确认</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. AD COMMAND CENTER
const AdCommandCenter = () => {
    const { state, dispatch, showToast } = useTanxing();
    const { adCampaigns } = state;
    
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
    const [formData, setFormData] = useState<Partial<AdCampaign>>({
        name: '', platform: 'TikTok', status: 'Active', budget: 50
    });

    const [aiOptimization, setAiOptimization] = useState<string | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // --- Stats ---
    const totalSpend = adCampaigns.reduce((a, b) => a + b.spend, 0);
    const totalSales = adCampaigns.reduce((a, b) => a + b.sales, 0);
    const avgRoas = totalSpend > 0 ? (totalSales / totalSpend) : 0;

    // --- Handlers ---
    const handleSaveCampaign = () => {
        if (!formData.name) return showToast('请输入计划名称', 'warning');
        
        if (editingCampaign) {
            dispatch({ type: 'UPDATE_AD_CAMPAIGN', payload: { ...editingCampaign, ...formData } as AdCampaign });
            showToast('广告计划已更新', 'success');
        } else {
            const newCamp: AdCampaign = {
                id: `CMP-${Date.now()}`,
                name: formData.name!,
                platform: formData.platform as any || 'TikTok',
                status: formData.status as any || 'Active',
                budget: Number(formData.budget) || 50,
                spend: 0, sales: 0, acos: 0, roas: 0, clicks: 0, impressions: 0, ctr: 0, cpc: 0
            };
            dispatch({ type: 'CREATE_AD_CAMPAIGN', payload: newCamp });
            showToast('新广告计划已创建', 'success');
        }
        setShowCampaignModal(false);
        setEditingCampaign(null);
        setFormData({ name: '', platform: 'TikTok', status: 'Active', budget: 50 });
    };

    const handleDelete = (id: string) => {
        if(confirm('确定删除此广告计划？')) {
            dispatch({ type: 'DELETE_AD_CAMPAIGN', payload: id });
            showToast('计划已删除', 'info');
        }
    };

    const handleToggleStatus = (camp: AdCampaign) => {
        const newStatus = camp.status === 'Active' ? 'Paused' : 'Active';
        dispatch({ type: 'UPDATE_AD_CAMPAIGN', payload: { ...camp, status: newStatus } });
    };

    const handleAiOptimize = async () => {
        setIsOptimizing(true);
        setAiOptimization(null);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const dataStr = adCampaigns.map(c => `${c.name} (${c.platform}): Spend $${c.spend}, ROAS ${c.roas}, Status ${c.status}`).join('\n');
            const prompt = `
                Act as a Senior Media Buyer. Analyze these campaigns:
                ${dataStr}
                
                Provide 3 brief, actionable optimization suggestions in Chinese (HTML format).
                Focus on budget allocation and pausing inefficient ads.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setAiOptimization(response.text);
        } catch (e) {
            setAiOptimization('AI 服务暂时不可用。');
        } finally {
            setIsOptimizing(false);
        }
    };

    // Chart Data
    const chartData = adCampaigns.map(c => ({
        name: c.name.substring(0, 10),
        roas: c.roas,
        spend: c.spend
    }));

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
            {/* AI Suggestion Box */}
            {aiOptimization && (
                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 relative">
                    <button onClick={() => setAiOptimization(null)} className="absolute top-2 right-2 text-indigo-400 hover:text-white"><X className="w-4 h-4"/></button>
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
                        <div className="text-sm text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiOptimization }}></div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                {/* Campaign List */}
                <div className="flex-[2] ios-glass-panel rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-pink-500"/> 广告计划管理</h3>
                        <button onClick={() => { setEditingCampaign(null); setFormData({name: '', platform: 'TikTok', status: 'Active', budget: 50}); setShowCampaignModal(true); }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow-lg"><Plus className="w-3 h-3"/> 新建计划</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {adCampaigns.map(camp => (
                            <div key={camp.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 flex justify-between items-center group transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${camp.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                                        <span className="font-bold text-sm text-white">{camp.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-black/40 rounded text-slate-400 border border-white/5">{camp.platform}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex gap-3 font-mono">
                                        <span>Spend: ${camp.spend}</span>
                                        <span className={camp.roas > 2 ? 'text-emerald-400' : 'text-orange-400'}>ROAS: {camp.roas}</span>
                                        <span>Sales: ${camp.sales}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleToggleStatus(camp)} className={`p-1.5 rounded ${camp.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-700/50'}`} title={camp.status === 'Active' ? 'Pause' : 'Activate'}>
                                        {camp.status === 'Active' ? <PauseCircle className="w-4 h-4"/> : <PlayCircle className="w-4 h-4"/>}
                                    </button>
                                    <button onClick={() => { setEditingCampaign(camp); setFormData({...camp}); setShowCampaignModal(true); }} className="p-1.5 text-slate-400 hover:text-white bg-black/40 rounded"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(camp.id)} className="p-1.5 text-red-400 hover:text-red-300 bg-black/40 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                        {adCampaigns.length === 0 && <div className="text-center text-slate-500 py-10 text-sm">暂无广告计划，请点击新建。</div>}
                    </div>
                </div>

                {/* Charts Area */}
                <div className="flex-1 ios-glass-panel rounded-xl p-4 flex flex-col">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">ROAS 表现分布</h4>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{left: 10, right: 10}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                                <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={10} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px'}} />
                                <Bar dataKey="roas" name="ROAS" barSize={15} radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.roas > 3 ? '#10b981' : entry.roas > 2 ? '#3b82f6' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Campaign Modal */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowCampaignModal(false)}>
                    <div className="ios-glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">{editingCampaign ? '编辑广告计划' : '新建广告计划'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">计划名称</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">投放平台</label>
                                    <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white">
                                        <option value="TikTok">TikTok</option>
                                        <option value="Amazon">Amazon</option>
                                        <option value="Meta">Meta (FB/IG)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">日预算 ($)</label>
                                    <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">状态</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setFormData({...formData, status: 'Active'})} className={`flex-1 py-2 text-xs rounded border ${formData.status === 'Active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/40 border-white/10 text-slate-500'}`}>开启 (Active)</button>
                                    <button onClick={() => setFormData({...formData, status: 'Paused'})} className={`flex-1 py-2 text-xs rounded border ${formData.status === 'Paused' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-black/40 border-white/10 text-slate-500'}`}>暂停 (Paused)</button>
                                </div>
                            </div>
                            <button onClick={handleSaveCampaign} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold mt-2 shadow-lg">保存计划</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3. CONTENT ENGINE & COST ANALYZER
const ContentEngine = () => {
    const [sellingPrice, setSellingPrice] = useState(29.99);
    const [productCost, setProductCost] = useState(8.50);
    const [platformFeePercent, setPlatformFeePercent] = useState(5);
    const [logisticsCost, setLogisticsCost] = useState(4.20);
    const [adSpend, setAdSpend] = useState(6.00);
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    // --- A/B Test States ---
    const [abCopies, setAbCopies] = useState<{a: string, b: string} | null>(null);
    const [abResult, setAbResult] = useState<any>(null);
    const [isGenAb, setIsGenAb] = useState(false);
    const [isSimAb, setIsSimAb] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setReport(null);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Calculate basics for context
            const platformFee = sellingPrice * (platformFeePercent / 100);
            const totalCost = productCost + logisticsCost + platformFee + adSpend;
            const profit = sellingPrice - totalCost;
            const margin = (profit / sellingPrice) * 100;

            const prompt = `
                Role: E-commerce Financial Analyst & Content Strategist.
                
                Product Data:
                - Selling Price: $${sellingPrice}
                - COGS: $${productCost}
                - Logistics: $${logisticsCost}
                - Platform Fee: ${platformFeePercent}% ($${platformFee.toFixed(2)})
                - Ad Spend (CPA): $${adSpend}
                
                Computed:
                - Total Cost: $${totalCost.toFixed(2)}
                - Net Profit: $${profit.toFixed(2)}
                - Margin: ${margin.toFixed(2)}%

                Task:
                1. Analyze this cost structure. Is it healthy?
                2. Provide 3 specific optimization strategies to increase net profit (e.g. raise price, lower CPA target, switch logistics).
                3. Suggest a marketing content angle based on the margin strategy.

                Output: HTML format. Use <b> for emphasis. Keep it concise.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            
            setReport(response.text);
        } catch (e) {
            console.error(e);
            setReport("AI 分析服务暂时不可用，请检查网络或 API Key。");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateAbCopies = async () => {
        setIsGenAb(true);
        setAbResult(null);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                Generate 2 distinct short ad copy versions (Title + Body) for a product priced at $${sellingPrice}.
                Target Audience: E-commerce shoppers.
                Version A Strategy: Value/Savings/Deal focus.
                Version B Strategy: Premium Quality/Lifestyle/Feature focus.
                
                Return VALID JSON in this format:
                { 
                  "versionA": "Title: ...\nBody: ...", 
                  "versionB": "Title: ...\nBody: ..." 
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            
            const result = JSON.parse(response.text || '{}');
            if (result.versionA && result.versionB) {
                setAbCopies({ a: result.versionA, b: result.versionB });
            }
        } catch(e) {
            console.error("Gen Copy Error", e);
        } finally {
            setIsGenAb(false);
        }
    };

    const handleSimulateAb = async () => {
        if (!abCopies) return;
        setIsSimAb(true);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                Simulate an A/B test performance for these two ad copies targeting tech-savvy buyers.
                Copy A: "${abCopies.a}"
                Copy B: "${abCopies.b}"
                
                Predict CTR (Click Through Rate) and CVR (Conversion Rate) based on copywriting psychology.
                Pick a winner.
                
                Return VALID JSON in this format:
                { 
                  "a": { "ctr": number (e.g. 1.5), "cvr": number (e.g. 2.2) }, 
                  "b": { "ctr": number, "cvr": number }, 
                  "winner": "A" or "B", 
                  "reason": "Short explanation why" 
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            
            const result = JSON.parse(response.text || '{}');
            setAbResult(result);
        } catch(e) {
            console.error("Sim Error", e);
        } finally {
            setIsSimAb(false);
        }
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-2 animate-in fade-in slide-in-from-bottom-2">
            {/* Input Panel - Flowing Border */}
            <div className="lg:col-span-1 flex flex-col gap-5">
                <FlowingBorderCard p="p-6">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-2 text-white font-bold text-lg mb-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Calculator className="w-5 h-5"/></div>
                            成本结构计算器
                        </div>
                        
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">销售定价 ($)</label>
                                <input type="number" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">采购成本 ($)</label>
                                    <input type="number" value={productCost} onChange={e => setProductCost(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">物流履约 ($)</label>
                                    <input type="number" value={logisticsCost} onChange={e => setLogisticsCost(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">平台佣金 (%)</label>
                                    <input type="number" value={platformFeePercent} onChange={e => setPlatformFeePercent(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">广告 CPA ($)</label>
                                    <input type="number" value={adSpend} onChange={e => setAdSpend(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10">
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                {isAnalyzing ? '正在分析...' : '生成优化报告'}
                            </button>
                        </div>
                    </div>
                </FlowingBorderCard>
            </div>

            {/* Report Panel - Flowing Card */}
            <div className="lg:col-span-2 flex flex-col">
                <FlowingBorderCard p="p-6">
                    <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold text-sm uppercase tracking-wider relative z-10">
                        <Bot className="w-4 h-4 text-indigo-500" />
                        AI 深度分析报告 (Analysis Report)
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 relative z-10 scrollbar-thin scrollbar-thumb-white/10 mb-6">
                        {report ? (
                            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: report }}></div>
                            </div>
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-600 opacity-50 border border-dashed border-white/10 rounded-xl bg-white/5">
                                <BarChart3 className="w-12 h-12 mb-2" />
                                <p className="text-xs">输入成本数据，获取利润优化建议</p>
                            </div>
                        )}
                    </div>

                    {/* A/B Test Section */}
                    <div className="border-t border-white/10 pt-6 relative z-10">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                            <Split className="w-4 h-4 text-purple-500" /> A/B 测试实验室 (Simulation)
                        </h4>
                        
                        {!abCopies ? (
                            <div className="text-center py-6 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-xs text-slate-400 mb-3">暂无测试文案。点击生成以基于当前产品创建两组不同策略的广告语。</p>
                                <button 
                                    onClick={handleGenerateAbCopies}
                                    disabled={isGenAb}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
                                >
                                    {isGenAb ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                    生成 A/B 测试文案
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Version A */}
                                    <div className={`p-4 rounded-xl border transition-all relative ${abResult?.winner === 'A' ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 bg-black/40'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Version A (Value)</span>
                                            {abResult?.winner === 'A' && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">WINNER</span>}
                                        </div>
                                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[60px]">{abCopies.a}</div>
                                        {abResult && (
                                            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-black/30 rounded p-1 text-center">
                                                    <div className="text-slate-500 text-[10px]">CTR</div>
                                                    <div className="font-mono font-bold text-white">{abResult.a.ctr}%</div>
                                                </div>
                                                <div className="bg-black/30 rounded p-1 text-center">
                                                    <div className="text-slate-500 text-[10px]">CVR</div>
                                                    <div className="font-mono font-bold text-white">{abResult.a.cvr}%</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Version B */}
                                    <div className={`p-4 rounded-xl border transition-all relative ${abResult?.winner === 'B' ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 bg-black/40'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-pink-400 font-bold uppercase tracking-wider">Version B (Quality)</span>
                                            {abResult?.winner === 'B' && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">WINNER</span>}
                                        </div>
                                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[60px]">{abCopies.b}</div>
                                        {abResult && (
                                            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-black/30 rounded p-1 text-center">
                                                    <div className="text-slate-500 text-[10px]">CTR</div>
                                                    <div className="font-mono font-bold text-white">{abResult.b.ctr}%</div>
                                                </div>
                                                <div className="bg-black/30 rounded p-1 text-center">
                                                    <div className="text-slate-500 text-[10px]">CVR</div>
                                                    <div className="font-mono font-bold text-white">{abResult.b.cvr}%</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {!abResult ? (
                                    <button 
                                        onClick={handleSimulateAb}
                                        disabled={isSimAb}
                                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSimAb ? <Loader2 className="w-3 h-3 animate-spin"/> : <FlaskConical className="w-3 h-3"/>}
                                        开始 A/B 模拟测试 (Run Simulation)
                                    </button>
                                ) : (
                                    <div className="bg-indigo-500/20 p-3 rounded border border-indigo-500/30 text-xs text-indigo-200 flex gap-2 items-start animate-in fade-in">
                                        <Bot className="w-4 h-4 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold text-indigo-400 block mb-1">AI 预测结论:</span> 
                                            {abResult.reason}
                                        </div>
                                        <button onClick={() => { setAbResult(null); setAbCopies(null); }} className="ml-auto text-indigo-400 hover:text-white underline text-[10px]">重置</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </FlowingBorderCard>
            </div>
        </div>
    );
};

const Marketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'seeding' | 'ads' | 'content'>('overview');

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 p-2">
        <style>{FLOWING_BORDER_STYLES}</style>
        
        {/* Glass Tab Switcher */}
        <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 w-fit shadow-lg">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}><LayoutDashboard className="w-3.5 h-3.5" /> AI 驾驶舱</button>
            <button onClick={() => setActiveTab('seeding')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'seeding' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}><Users className="w-3.5 h-3.5" /> 红人寄样</button>
            <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'ads' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}><Megaphone className="w-3.5 h-3.5" /> 广告计划</button>
            <button onClick={() => setActiveTab('content')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}><PenTool className="w-3.5 h-3.5" /> 内容策略</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
            {activeTab === 'overview' && <MarketingCockpit />}
            {activeTab === 'seeding' && <InfluencerCRM />}
            {activeTab === 'ads' && <AdCommandCenter />}
            {activeTab === 'content' && <ContentEngine />}
        </div>
    </div>
  );
};

export default Marketing;
