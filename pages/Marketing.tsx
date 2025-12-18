import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { 
  Megaphone, Wand2, RefreshCw, Copy, Check, Hash, TrendingUp, 
  Users, Video, Type as TypeIcon, Mail, Sparkles, Loader2, Share2, 
  BarChart3, Target, Zap, Sliders, Split, Trophy, Percent, MousePointerClick,
  Smartphone, Instagram, Send, Heart, MessageCircle, Bookmark, Music2,
  ThumbsUp, UserCircle2, Ghost, BrainCircuit, Activity, Cpu, Layers, Globe,
  LayoutDashboard, DollarSign, ArrowUpRight, ArrowDownRight, Search, Radar as RadarIcon,
  PlayCircle, PauseCircle, Gauge, AlertCircle, FlaskConical, PenTool, X, Save,
  Plus, Calendar, Gift, Link, Truck, MessageSquare, Calculator, Bot, Trash2, Edit2, Compass, AlertTriangle,
  CandlestickChart
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, ComposedChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine, Scatter
} from 'recharts';
import { AdCampaign, Influencer, InfluencerStatus } from '../types';

// --- STYLES ---
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
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(16px);
    border-radius: 0.75rem;
    height: 100%;
    width: 100%;
    position: relative;
    z-index: 1;
  }
`;

const FlowingBorderCard: React.FC<{ children: React.ReactNode, className?: string, p?: string }> = ({ children, className = '', p = 'p-4' }) => (
  <div className={`flowing-border-container ${className}`}>
    <div className={`glass-inner ${p} flex flex-col justify-between h-full border border-white/10`}>
      {children}
    </div>
  </div>
);

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

// --- DASHBOARD ---
const MarketingCockpit = () => {
    const forecastData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = -14; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const isFuture = i > 0;
            const baseEng = 5000 + Math.random() * 2000;
            data.push({
                date: date.toISOString().split('T')[0].slice(5),
                Actual: isFuture ? null : baseEng,
                Predicted: isFuture ? baseEng * (1 + i * 0.05) : null,
                ConfidenceUpper: isFuture ? baseEng * (1 + i * 0.08) : null,
            });
        }
        return data;
    }, []);

    const kLineData = useMemo(() => {
        return Array.from({length: 10}, (_, i) => {
            const open = 10 + Math.random() * 5;
            const close = 10 + Math.random() * 5;
            return {
                day: `D-${10-i}`,
                open, close,
                high: Math.max(open, close) + 2,
                low: Math.min(open, close) - 2,
                range: [Math.min(open, close) - 2, Math.max(open, close) + 2]
            };
        });
    }, []);

    const radarData = [
        { subject: 'SOV', A: 85, B: 60 },
        { subject: 'Sentiment', A: 90, B: 75 },
        { subject: 'CPA', A: 65, B: 85 },
        { subject: 'Creative', A: 80, B: 70 },
        { subject: 'Conversion', A: 75, B: 65 }
    ];

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FlowingBorderCard p="p-4" className="md:col-span-1">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">AI 预测 ROI</span>
                        </div>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                            4.25x
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Confidence: High (89%)</div>
                    </div>
                </FlowingBorderCard>
                <MetricCard label="当前 CAC" value="$12.45" subValue="Target: $10.00" trend={-5.2} icon={Target} color="text-emerald-400" />
                <MetricCard label="全网声量" value="24.5k" subValue="Weekly Volume" trend={18.3} icon={MessageCircle} color="text-blue-400" />
                <MetricCard label="竞品指数" value="High" subValue="Price Drop Alert" trend={12.0} icon={AlertTriangle} color="text-orange-400" />
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col relative overflow-hidden">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
                            <TrendingUp className="w-4 h-4 text-cyan-400" /> 全渠道互动量预测
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[...forecastData]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                                    <YAxis stroke="#475569" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                    <Area type="monotone" dataKey="Actual" stroke="#94a3b8" fillOpacity={0.3} fill="#94a3b8" />
                                    <Area type="monotone" dataKey="Predicted" stroke="#8b5cf6" strokeDasharray="5 5" fillOpacity={0.4} fill="#8b5cf6" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="h-64 bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <CandlestickChart className="w-4 h-4 text-pink-400" /> CPA 市场波动率
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[...kLineData]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="day" stroke="#475569" fontSize={10} />
                                    <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} unit="$" />
                                    <Tooltip />
                                    <Bar dataKey="range" barSize={8}>
                                        {kLineData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 h-80 flex flex-col">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                            <RadarIcon className="w-4 h-4 text-orange-400" /> 竞品雷达
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[...radarData]}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Radar name="My Brand" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                                <Radar name="Competitor" dataKey="B" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex-1 bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/30 rounded-xl p-5 flex flex-col">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                            <BrainCircuit className="w-4 h-4 text-indigo-400" /> AI 策略建议
                        </h3>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-none">
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs">
                                <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> 提高预算</div>
                                <p className="text-indigo-100/80">建议将 TikTok 广告预算提高 20%，预期 ROI 将上行 15%。</p>
                            </div>
                            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs">
                                <div className="font-bold text-orange-300 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 竞品降价</div>
                                <p className="text-orange-100/80">竞品 SKU-A 在 Amazon 降价 10%。建议启动 Bundle Deal 应对。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- INFLUENCER CRM ---
const InfluencerCRM = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showOutreachModal, setShowOutreachModal] = useState<Influencer | null>(null);
    const [emailDraft, setEmailDraft] = useState('');
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

    const [newInf, setNewInf] = useState<Partial<Influencer>>({
        name: '', handle: '', platform: 'TikTok', followers: 0, country: 'US', status: 'To Contact'
    });

    const filteredInfluencers = state.influencers.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.handle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveInfluencer = () => {
        if (!newInf.name || !newInf.handle) return showToast('请填写昵称和账号', 'warning');
        const inf: Influencer = {
            id: `INF-${Date.now()}`,
            name: newInf.name!,
            handle: newInf.handle!,
            platform: newInf.platform as any,
            followers: newInf.followers || 0,
            country: newInf.country || 'US',
            status: 'To Contact',
            tags: []
        };
        dispatch({ type: 'ADD_INFLUENCER', payload: inf });
        showToast('红人已添加', 'success');
        setShowAddModal(false);
    };

    const handleGenerateEmail = async (inf: Influencer) => {
        setIsGeneratingEmail(true);
        setEmailDraft('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Write an outreach email to ${inf.name} (${inf.platform}) for our cyber-tech brand Tanxing.`
            });
            setEmailDraft(response.text || "Unable to generate.");
        } catch (e) {
            setEmailDraft("AI 生成失败。");
        } finally {
            setIsGeneratingEmail(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    {['To Contact', 'Sample Sent', 'Video Live', 'Completed'].map(stage => (
                        <div key={stage} className="flex-1 bg-slate-900/40 border border-white/5 rounded-xl flex flex-col min-w-[280px]">
                            <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between font-bold text-sm">
                                <span>{stage}</span>
                                <span className="text-slate-500">{filteredInfluencers.filter(i => i.status === stage).length}</span>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto">
                                {filteredInfluencers.filter(i => i.status === stage).map(inf => (
                                    <div key={inf.id} className="bg-black/40 border border-white/5 p-3 rounded-lg hover:border-pink-500/30 transition-all group">
                                        <div className="font-bold text-white text-sm">{inf.handle}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">{inf.platform} • {inf.followers.toLocaleString()}</div>
                                        <button onClick={() => { setShowOutreachModal(inf); handleGenerateEmail(inf); }} className="w-full mt-3 py-1.5 bg-white/5 text-xs text-slate-300 rounded border border-white/10 hover:bg-white/10">AI 话术</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showOutreachModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowOutreachModal(null)}>
                    <div className="ios-glass-panel w-full max-w-2xl rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between mb-4"><h3 className="font-bold text-white">AI 智能外联</h3><button onClick={() => setShowOutreachModal(null)}><X className="w-5 h-5 text-slate-500"/></button></div>
                        <textarea value={emailDraft} readOnly className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-300 font-mono resize-none"/>
                        <div className="mt-4 flex justify-end gap-3">
                            <button onClick={() => { navigator.clipboard.writeText(emailDraft); showToast('已复制', 'success'); }} className="px-4 py-2 text-slate-400">复制</button>
                            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">发送</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- AD COMMAND CENTER ---
const AdCommandCenter = () => {
    const { state, dispatch, showToast } = useTanxing();
    const { adCampaigns } = state;
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [formData, setFormData] = useState<Partial<AdCampaign>>({ name: '', platform: 'TikTok', budget: 50 });

    const handleSaveCampaign = () => {
        if (!formData.name) return showToast('请输入名称', 'warning');
        const camp: AdCampaign = {
            id: `CMP-${Date.now()}`,
            name: formData.name!,
            platform: formData.platform as any || 'TikTok',
            status: 'Active',
            budget: Number(formData.budget) || 50,
            spend: 0, sales: 0, acos: 0, roas: 0, clicks: 0, impressions: 0, ctr: 0, cpc: 0
        };
        dispatch({ type: 'CREATE_AD_CAMPAIGN', payload: camp });
        showToast('计划已创建', 'success');
        setShowCampaignModal(false);
    };

    const chartData = useMemo(() => adCampaigns.map(c => ({
        name: c.name.length > 12 ? c.name.substring(0, 10) + '...' : c.name,
        roas: Number(c.roas) || 0
    })), [adCampaigns]);

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                <div className="flex-[1] ios-glass-panel rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-white">计划管理</h3>
                        <button onClick={() => setShowCampaignModal(true)} className="px-3 py-1 bg-indigo-600 text-xs text-white rounded font-bold">新建</button>
                    </div>
                    <div className="p-2 space-y-2 overflow-y-auto">
                        {adCampaigns.map(camp => (
                            <div key={camp.id} className="bg-white/5 border border-white/5 rounded-lg p-3 group">
                                <div className="flex justify-between font-bold text-sm text-white"><span>{camp.name}</span><span className="text-slate-500 text-[10px]">{camp.platform}</span></div>
                                <div className="text-[10px] text-slate-500 mt-2 flex gap-4"><span>Spend: ${camp.spend}</span><span className={Number(camp.roas) >= 4 ? 'text-emerald-400' : 'text-red-400'}>ROAS: {camp.roas}</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-[2] ios-glass-panel rounded-xl p-6 flex flex-col">
                    <div className="mb-6"><h4 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400"/> 各计划 ROAS 表现 (Target: 4.0)</h4></div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...chartData]} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    interval={0} 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={50}
                                />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'ROAS', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}} />
                                <ReferenceLine y={4.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: 'Target 4.0', fill: '#f59e0b', fontSize: 10 }} />
                                <Bar dataKey="roas" radius={[4, 4, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.roas >= 4.0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {showCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowCampaignModal(false)}>
                    <div className="ios-glass-panel w-full max-w-md rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-white mb-4">新建计划</h3>
                        <div className="space-y-4">
                            <input placeholder="计划名称" onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"/>
                            <div className="grid grid-cols-2 gap-4">
                                <select onChange={e => setFormData({...formData, platform: e.target.value as any})} className="bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none">
                                    <option value="TikTok">TikTok</option>
                                    <option value="Amazon">Amazon</option>
                                    <option value="Meta">Meta</option>
                                </select>
                                <input type="number" placeholder="日预算" onChange={e => setFormData({...formData, budget: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none"/>
                            </div>
                            <button onClick={handleSaveCampaign} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg transition-all">保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Marketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'seeding' | 'ads'>('overview');

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 p-2">
        <style>{FLOWING_BORDER_STYLES}</style>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit backdrop-blur-md">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}>AI 驾驶舱</button>
            <button onClick={() => setActiveTab('seeding')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'seeding' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}>红人寄样</button>
            <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'ads' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}>广告计划</button>
        </div>
        <div className="flex-1 min-h-0 relative">
            {activeTab === 'overview' && <MarketingCockpit />}
            {activeTab === 'seeding' && <InfluencerCRM />}
            {activeTab === 'ads' && <AdCommandCenter />}
        </div>
    </div>
  );
};

export default Marketing;