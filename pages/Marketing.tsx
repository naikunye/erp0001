import React, { useState, useMemo } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { Influencer } from '../types';
import { 
  Calculator, Search, Plus, Users, 
  TrendingUp, Activity, Zap, Box, 
  ChevronRight, ExternalLink, Target, 
  BarChart3, Wallet, Info
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart as ReBarChart, Bar, Cell
} from 'recharts';

const ROISimulator = () => {
    const { state } = useTanxing();
    const products = state.products || [];
    const [budget, setBudget] = useState(1000);
    const [expectedCPA, setExpectedCPA] = useState(10);
    const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');

    const product = useMemo(() => 
        products.find(p => p.sku === selectedSku) || products[0], 
    [selectedSku, products]);

    const exchangeRate = 7.2;
    const estOrders = Math.floor(budget / expectedCPA);
    
    const calculateProfit = () => {
        if (!product) return 0;
        const priceUSD = product.price || 0;
        const eco = product.economics;
        const costUSD = (product.costPrice || 0) / exchangeRate;
        const platformFees = priceUSD * ((eco?.platformFeePercent || 0) / 100 + (eco?.creatorFeePercent || 0) / 100);
        const fixedFees = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
        const baseUnitProfit = priceUSD - (costUSD + platformFees + fixedFees);
        return baseUnitProfit - expectedCPA;
    };

    const unitProfitAfterAd = calculateProfit();
    const totalProjectedProfit = unitProfitAfterAd * estOrders;
    const breakEvenCPA = expectedCPA + unitProfitAfterAd;

    const chartData = [
        { name: '投入预算', value: budget, color: '#6366f1' },
        { name: '预期营收', value: estOrders * (product?.price || 0), color: '#10b981' },
        { name: '净利润推演', value: Math.max(0, totalProjectedProfit), color: '#8b5cf6' }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-1 space-y-6">
                <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-indigo-400" /> 增长模型推演 (V2.5)
                    </h3>
                    <div className="space-y-5">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">测试商品</label>
                            <select 
                                value={selectedSku} 
                                onChange={e => setSelectedSku(e.target.value)} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                            >
                                {products.map(p => <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-2 flex justify-between">
                                <span>单日拟投预算</span>
                                <span className="text-indigo-400 font-mono">${budget}</span>
                            </label>
                            <input type="range" min="100" max="10000" step="100" value={budget} onChange={e => setBudget(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-2 flex justify-between">
                                <span>容忍获客成本 (CPA)</span>
                                <span className="text-emerald-400 font-mono">${expectedCPA}</span>
                            </label>
                            <input type="range" min="1" max="100" step="0.5" value={expectedCPA} onChange={e => setExpectedCPA(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp className="w-12 h-12 text-indigo-400"/></div>
                    <div className="relative z-10">
                        <p className="text-xs text-indigo-200 font-bold flex items-center gap-1">
                            <Target className="w-3 h-3 text-red-400" /> 
                            盈亏平衡线 (Break-even CPA): ${breakEvenCPA.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-indigo-300/60 mt-2 leading-relaxed">
                            当实际 CPA 超过此数值时，每产生一个订单都将导致营销亏损。建议优化转化率或提高售价。
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="ios-glass-card p-5 text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">预计成交单量</div>
                        <div className="text-2xl font-mono font-bold text-white">{estOrders} <span className="text-xs">Orders</span></div>
                    </div>
                    <div className="ios-glass-card p-5 text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">推演 ROI</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">{budget > 0 ? ((estOrders * (product?.price || 0)) / budget).toFixed(2) : 0}x</div>
                    </div>
                    <div className="ios-glass-card p-5 text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">模拟净利润</div>
                        <div className={`text-2xl font-mono font-bold ${totalProjectedProfit > 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                            ${totalProjectedProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </div>
                    </div>
                </div>

                <div className="flex-1 ios-glass-card p-6 min-h-[350px]">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">投放价值穿透模型 (Value Analysis)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor:'#000', border:'1px solid #333', borderRadius:'12px'}} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                                {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Bar>
                        </ReBarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const InfluencerCRM = () => {
    const { state, dispatch, showToast } = useTanxing();
    const influencers = state.influencers || [];
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newInf, setNewInf] = useState<Partial<Influencer>>({
        name: '', handle: '', platform: 'TikTok', followers: 0, country: 'US', status: 'To Contact'
    });

    const filteredInfluencers = influencers.filter(i => 
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.handle || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveInfluencer = () => {
        if (!newInf.name || !newInf.handle) return showToast('请填写昵称和账号', 'warning');
        const inf: Influencer = {
            id: `INF-${Date.now()}`,
            name: newInf.name!,
            handle: newInf.handle!,
            platform: (newInf.platform as any) || 'TikTok',
            followers: newInf.followers || 0,
            country: newInf.country || 'US',
            status: 'To Contact',
            tags: []
        };
        dispatch({ type: 'ADD_INFLUENCER', payload: inf });
        showToast('红人合作数据已记录', 'success');
        setShowAddModal(false);
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input type="text" placeholder="检索红人账号..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:border-indigo-500 w-80 outline-none uppercase font-bold tracking-tighter"/>
                </div>
                <button onClick={() => setShowAddModal(true)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                    <Plus className="w-4 h-4" /> 记录新合作
                </button>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar pb-6">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {['To Contact', 'Sample Sent', 'Video Live', 'Completed'].map(stage => (
                        <div key={stage} className="flex-1 bg-white/2 border border-white/5 rounded-2xl flex flex-col min-w-[300px]">
                            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{stage}</span>
                                <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 font-mono">
                                    {filteredInfluencers.filter(i => i.status === stage).length}
                                </span>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto">
                                {filteredInfluencers.filter(i => i.status === stage).map(inf => (
                                    <div key={inf.id} className="ios-glass-card p-4 hover:border-indigo-500/40 transition-all group relative">
                                        <div className="font-bold text-white text-sm mb-1">{inf.handle}</div>
                                        <div className="text-[10px] text-slate-500 flex justify-between">
                                            <span>{inf.platform} • {inf.country}</span>
                                            <span className="font-mono text-indigo-400">{(inf.followers / 1000).toFixed(0)}k Fans</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="ios-glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-6 uppercase italic tracking-tight">记录新红人合作</h3>
                        <div className="space-y-4">
                            <div><label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">红人昵称</label><input onChange={e => setNewInf({...newInf, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none" /></div>
                            <div><label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">账号 Handle (@)</label><input onChange={e => setNewInf({...newInf, handle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none" placeholder="@username" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">粉丝数</label><input type="number" onChange={e => setNewInf({...newInf, followers: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none" /></div>
                                <div><label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">平台</label><select onChange={e => setNewInf({...newInf, platform: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"><option value="TikTok">TikTok</option><option value="Instagram">Instagram</option><option value="YouTube">YouTube</option></select></div>
                            </div>
                            <button onClick={handleSaveInfluencer} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all mt-4">确认记录</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Marketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'influencer'>('strategy');

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 w-fit backdrop-blur-md shadow-xl mx-auto lg:mx-0">
            {[
                { id: 'strategy', label: '投放模型推演', sub: 'ROI Strategy', icon: Calculator },
                { id: 'influencer', label: '红人合作管理', sub: 'KOL CRM', icon: Users }
            ].map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-8 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-500 hover:text-white'}`}
                >
                    <tab.icon className="w-4 h-4" />
                    <div className="text-left">
                        <div className="text-xs font-bold leading-none">{tab.label}</div>
                        <div className="text-[9px] uppercase tracking-tighter opacity-50 font-mono mt-1">{tab.sub}</div>
                    </div>
                </button>
            ))}
        </div>

        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 h-full">
                {activeTab === 'strategy' && <ROISimulator />}
                {activeTab === 'influencer' && <InfluencerCRM />}
            </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-900/10 border border-indigo-500/20 rounded-xl w-fit">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-[10px] text-indigo-300/80 font-bold uppercase tracking-widest">
                注：实际营销支出已移至「财务资金」模块统一核算
            </p>
        </div>
    </div>
  );
};

export default Marketing;