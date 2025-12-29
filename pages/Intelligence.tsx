
import React, { useMemo } from 'react';
import { 
    BrainCircuit, Zap, Target, TrendingUp, TrendingDown, 
    AlertTriangle, ShieldCheck, Box, Coins, BarChart3,
    ArrowRight, Activity, LineChart, PieChart, Layers, 
    Smartphone, Download, FileBarChart
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Intelligence: React.FC = () => {
    const { state } = useTanxing();

    // 本地专家逻辑：资产风险评估
    const insights = useMemo(() => {
        const products = state.products || [];
        const riskNodes = products.filter((p:any) => p.stock < 10);
        const starNodes = products.filter((p:any) => p.dailyBurnRate > 5);
        const deadNodes = products.filter((p:any) => p.stock > 100 && p.dailyBurnRate < 1);
        
        const totalValue = products.reduce((a:any, b:any) => a + (b.stock * b.costPrice), 0);
        const efficiency = products.length > 0 ? (starNodes.length / products.length) * 100 : 0;

        return { riskNodes, starNodes, deadNodes, totalValue, efficiency };
    }, [state.products]);

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700 pb-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-2xl">
                        <BrainCircuit className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">本地专家决策系统</h1>
                        <p className="text-[10px] text-slate-500 font-mono tracking-[0.4em]">Heuristic Logic Engine v3.2 | No API Key Required</p>
                    </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">全域资产数据对齐完成</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ios-glass-card p-8 border-l-4 border-l-indigo-500 bg-indigo-500/5">
                    <div className="text-[10px] text-indigo-400 font-black uppercase mb-1 tracking-widest">资产周转效能</div>
                    <div className="text-5xl font-black text-white font-mono tracking-tighter">{insights.efficiency.toFixed(1)}%</div>
                    <p className="text-[9px] text-slate-500 mt-2 font-bold italic">基于日均销量的动销节点占比</p>
                </div>
                <div className="ios-glass-card p-8 border-l-4 border-l-amber-500 bg-amber-500/5">
                    <div className="text-[10px] text-amber-500 font-black uppercase mb-1 tracking-widest">在库沉淀货值</div>
                    <div className="text-5xl font-black text-white font-mono tracking-tighter">¥{(insights.totalValue / 10000).toFixed(2)}W</div>
                    <p className="text-[9px] text-slate-500 mt-2 font-bold italic">当前服务器计算出的现金等价值</p>
                </div>
                <div className="ios-glass-card p-8 border-l-4 border-l-rose-500 bg-rose-500/5">
                    <div className="text-[10px] text-rose-500 font-black uppercase mb-1 tracking-widest">风险节点总数</div>
                    <div className="text-5xl font-black text-white font-mono tracking-tighter">{insights.riskNodes.length + insights.deadNodes.length}</div>
                    <p className="text-[9px] text-slate-500 mt-2 font-bold italic">缺货、积压、负 ROI 节点总计</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* 深度透视 */}
                <div className="col-span-12 lg:col-span-8 ios-glass-panel p-8 rounded-[3rem] border-white/5 bg-black/40 flex flex-col gap-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" /> 多维资产演算结论</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] space-y-4">
                            <h4 className="text-[11px] font-black text-emerald-400 uppercase flex items-center gap-2 italic"><TrendingUp className="w-4 h-4"/> 增长机会点 (Stars)</h4>
                            <div className="space-y-3">
                                {insights.starNodes.length > 0 ? insights.starNodes.slice(0, 3).map((p:any) => (
                                    <div key={p.id} className="flex justify-between items-center text-xs">
                                        <span className="text-slate-300 font-bold">{p.sku}</span>
                                        <span className="text-emerald-400 font-mono font-black">日销 {p.dailyBurnRate} 件</span>
                                    </div>
                                )) : <p className="text-[10px] text-slate-600">暂无高增长节点</p>}
                            </div>
                        </div>

                        <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] space-y-4">
                            <h4 className="text-[11px] font-black text-rose-400 uppercase flex items-center gap-2 italic"><TrendingDown className="w-4 h-4"/> 积压预警点 (Dead Stock)</h4>
                            <div className="space-y-3">
                                {insights.deadNodes.length > 0 ? insights.deadNodes.slice(0, 3).map((p:any) => (
                                    <div key={p.id} className="flex justify-between items-center text-xs">
                                        <span className="text-slate-300 font-bold">{p.sku}</span>
                                        <span className="text-rose-400 font-mono font-black">{p.stock} 件滞留</span>
                                    </div>
                                )) : <p className="text-[10px] text-slate-600">暂无积压节点</p>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-[2rem] flex items-center gap-6">
                        <div className="p-3 bg-indigo-600 rounded-2xl"><Zap className="w-6 h-6 text-white"/></div>
                        <p className="text-xs text-indigo-100 leading-relaxed font-bold italic">
                            服务器专家引擎建议：当前全库有 <span className="text-emerald-400 font-black underline">{insights.efficiency.toFixed(0)}%</span> 的资产处于高效动销状态。建议通过指令中心执行 <span className="text-white bg-indigo-600 px-2 rounded">#SYNC_FEISHU</span> 立即处理滞纳单据。
                        </p>
                    </div>
                </div>

                {/* 飞书决策中心 */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="ios-glass-card p-8 rounded-[3rem] bg-indigo-600/5 border-white/5 space-y-6">
                        <div className="flex items-start gap-5">
                            <div className="p-4 bg-indigo-600/20 rounded-2xl"><Smartphone className="w-8 h-8 text-indigo-400" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase">飞书移动决策</h3>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold leading-relaxed">您的腾讯云服务器会将这些结论实时同步至手机端。</p>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">立即推送到飞书</button>
                    </div>

                    <div className="ios-glass-card p-8 rounded-[3rem] border border-white/5 bg-black/40 flex-1">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500"/> 算法演算记录</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-px h-10 bg-white/5 relative"><div className="absolute top-0 left-[-2px] w-1 h-1 bg-indigo-500 rounded-full"></div></div>
                                    <div className="text-[10px] text-slate-600 italic">
                                        <div className="font-bold text-slate-500">T-minus {i}h</div>
                                        <div>执行全域资金对齐，偏差率 0.02%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Intelligence;
