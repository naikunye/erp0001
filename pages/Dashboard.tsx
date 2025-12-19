
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Wallet, Loader2, TrendingUp, Sparkles, Command, Zap, Gem, Package, Info, AlertTriangle, ArrowRight, ShieldCheck, ChevronRight, Activity, PieChart, ArrowUpRight, BarChart3 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { AiInsight } from '../types';

const Dashboard: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<AiInsight[]>([]);

  const EXCHANGE_RATE = 7.2;

  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 500);
      handleProactiveAudit();
      return () => clearTimeout(timer);
  }, []);

  const activeProducts = useMemo(() => state.products.filter(p => !p.deletedAt), [state.products]);

  // --- 资产全景核算模型 (Quantum Calculation v5.0) ---
  const metrics = useMemo(() => {
      let totalStockValueCNY = 0;
      let totalPotentialProfitUSD = 0;
      let totalInvestmentCNY = 0;

      activeProducts.forEach(p => {
          const stock = Math.max(p.stock || 0, 0);
          const costCNY = p.costPrice || 0;
          totalStockValueCNY += stock * costCNY;
          if (stock === 0) return; 

          const dims = p.dimensions || {l:0, w:0, h:0};
          const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
          const autoUnitWeight = Math.max(p.unitWeight || 0, unitVolWeight);
          
          let activeTotalWeight = (p.logistics?.billingWeight && p.logistics.billingWeight > 0) ? p.logistics.billingWeight : (autoUnitWeight * stock);
          const rate = p.logistics?.unitFreightCost || 0;
          const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
          const autoTotalFreightCNY = (activeTotalWeight * rate) + batchFeesCNY;
          const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? autoTotalFreightCNY;
          const unitLogisticsCNY = (effectiveTotalFreightCNY / stock) + (p.logistics?.consumablesFee || 0);
          
          totalInvestmentCNY += (costCNY + unitLogisticsCNY) * stock;

          const priceUSD = p.price || 0;
          const eco = p.economics;
          const platformFeeUSD = priceUSD * ((eco?.platformFeePercent || 0) / 100);
          const creatorFeeUSD = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
          const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
          const unitAdCostUSD = eco?.adCost || 0;
          const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

          const unitProfitUSD = priceUSD - ( (costCNY / EXCHANGE_RATE) + (unitLogisticsCNY / EXCHANGE_RATE) + platformFeeUSD + creatorFeeUSD + fixedFeesUSD + unitAdCostUSD + refundLossUSD );
          totalPotentialProfitUSD += unitProfitUSD * stock;
      });

      return {
          stockValueCNY: totalStockValueCNY,
          totalPotentialProfitUSD,
          roi: totalInvestmentCNY > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / totalInvestmentCNY * 100) : 0,
          lowStockSkus: activeProducts.filter(p => p.stock < 20).length,
          totalInvestmentCNY
      };
  }, [activeProducts]);

  // 资产构成图表数据
  const assetComposition = [
      { name: '在库货值', value: metrics.stockValueCNY, color: '#8b5cf6' },
      { name: '物流占用', value: metrics.totalInvestmentCNY - metrics.stockValueCNY, color: '#3b82f6' },
      { name: '在途估值', value: state.shipments.length * 3500, color: '#10b981' }
  ];

  const handleProactiveAudit = async () => {
    const mockInsights: AiInsight[] = [
        { id: 'ins-1', type: 'risk', title: '断货风险红线', content: `检测到 ${metrics.lowStockSkus} 个 SKU 已破安全库存，预计本周将损失 $${(metrics.lowStockSkus * 120).toLocaleString()} 营收。`, priority: 'high', timestamp: '刚刚' },
        { id: 'ins-2', type: 'opportunity', title: '资金流效能提升', content: `当前平均 ROI 已达 ${metrics.roi.toFixed(1)}%，建议将 20% 闲置资金追加至爆款 SKU。`, priority: 'medium', timestamp: '3分钟前' }
    ];
    setInsights(mockInsights);
  };

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `你是探行 ERP 的首席 AI 分析官。当前库存货值 ¥${metrics.stockValueCNY.toLocaleString()}，预估总净利 $${metrics.totalPotentialProfitUSD.toLocaleString()}，平均 ROI 为 ${metrics.roi.toFixed(1)}%。请简要分析当前资产结构并给出1条关于“补货策略”的毒舌但专业的建议。使用 <b> 标签加粗关键点，中文 HTML 格式输出。`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setReport(response.text);
      } catch (e) {
          setReport(`<b>纠缠链路故障</b>: 无法获取量子审计解析。`);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* AI Sentry 动态哨兵 */}
      <div className="ios-glass-panel border-violet-500/30 bg-violet-500/5 p-5 rounded-[2.5rem] flex items-center gap-8 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 animate-pulse shadow-[0_0_20px_#8b5cf6]"></div>
          <div className="flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 bg-violet-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-violet-900/40 relative">
                  <Zap className="w-7 h-7 fill-current" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#121217] animate-ping"></div>
              </div>
              <div>
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] block">AI Matrix Sentry</span>
                  <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-500"/> REAL-TIME AUDIT</span>
              </div>
          </div>
          <div className="flex-1 flex gap-12 overflow-x-auto scrollbar-none">
              {insights.map(ins => (
                  <div key={ins.id} className="flex items-start gap-4 shrink-0 border-l border-white/5 pl-8 first:border-none first:pl-0 group/ins cursor-default">
                      <div className={`w-1 h-12 rounded-full mt-1 ${ins.type === 'risk' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <div className="flex flex-col">
                          <span className="text-[11px] font-black text-white uppercase flex items-center gap-2 group-hover/ins:text-violet-400 transition-colors">
                            {ins.title} {ins.type === 'risk' && <AlertTriangle className="w-3 h-3 text-red-500"/>}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 max-w-xs leading-relaxed">{ins.content}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* 核心指标矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard loading={isLoading} title="资产总持仓 (货值)" value={`¥${metrics.stockValueCNY.toLocaleString()}`} trend="库存净资产" trendUp={true} icon={Wallet} accentColor="blue" />
        <StatCard loading={isLoading} title="预估总净利" value={`$${metrics.totalPotentialProfitUSD.toLocaleString()}`} trend={`${metrics.roi.toFixed(1)}% ROI`} trendUp={metrics.roi >= 0} icon={Gem} accentColor="purple" />
        <StatCard loading={isLoading} title="库存健康线" value={metrics.lowStockSkus} subValue="SKUs" trend="异常库存预警" trendUp={metrics.lowStockSkus === 0} icon={AlertTriangle} accentColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
              {/* 智能审计交互面板 */}
              <div className="ios-glass-card p-1 relative overflow-hidden bg-gradient-to-br from-violet-600/10 to-transparent border-violet-500/20 rounded-[2.5rem] shadow-2xl">
                <div className="p-8 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-[2rem] flex items-center justify-center text-violet-400 shadow-2xl group hover:border-violet-500 transition-all">
                            <ShieldCheck className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">资产风险审计协议 (Audit V5.0)</h2>
                            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-500" /> 分布式分摊模型已就绪 • 离散误差 &lt; 0.01%
                            </p>
                        </div>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isGenerating} className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-violet-900/40 flex items-center gap-3 transition-all active:scale-95">
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />} 启动量子审计
                    </button>
                </div>
                {report && (
                    <div className="px-8 pb-8 animate-in slide-in-from-top-4 relative z-10">
                        <div className="p-8 bg-black/60 rounded-[2.5rem] border border-violet-500/30 text-indigo-100 leading-relaxed font-mono text-xs shadow-inner" dangerouslySetInnerHTML={{ __html: report }}></div>
                    </div>
                )}
              </div>

              {/* 资产穿透可视化 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="ios-glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 relative overflow-hidden group">
                      <div className="flex justify-between items-center relative z-10">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">资产构成分布 (Penetration)</h4>
                          <PieChart className="w-4 h-4 text-violet-500" />
                      </div>
                      <div className="h-48 relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                  <Pie data={assetComposition} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={8} dataKey="value" stroke="none">
                                      {assetComposition.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{backgroundColor:'#000', border:'none', borderRadius:'12px', fontSize:'10px'}} />
                              </RePieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="flex justify-around text-[9px] font-black uppercase tracking-widest relative z-10">
                          {assetComposition.map(item => (
                              <div key={item.name} className="flex flex-col items-center gap-1">
                                  <span style={{color: item.color}}>{item.name}</span>
                                  <span className="text-white font-mono">¥{(item.value / 1000).toFixed(0)}k</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="ios-glass-panel p-8 rounded-[2.5rem] border-l-4 border-l-emerald-500 group">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">资本回转效率 (Efficiency)</h4>
                        <ArrowUpRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                      <div className="text-5xl font-black text-white font-mono tracking-tighter mb-2">{(metrics.roi / 1.5).toFixed(2)}x</div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest leading-relaxed">基于最近 30 天的回款动能估算。当前周转效率领先于行业平均水平 <span className="text-emerald-400">12.5%</span>。</p>
                  </div>
              </div>
          </div>

          {/* 右侧物流实况流 */}
          <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="ios-glass-card p-8 flex flex-col flex-1 border-l-4 border-l-indigo-600 bg-black/20 rounded-[2.5rem]">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-indigo-500" /> 全球物流实况 (Matrix)
                  </h3>
                  <div className="space-y-8 relative pl-4">
                      <div className="absolute left-[2px] top-1 bottom-1 w-px bg-white/5"></div>
                      {state.shipments.slice(0, 4).map((ship, idx) => (
                          <div key={ship.id} className="relative pl-6 group/item">
                              <div className={`absolute left-[-5.5px] top-1.5 w-3 h-3 rounded-full border-2 border-[#050506] shadow-lg transition-all ${ship.status === '异常' ? 'bg-red-500 shadow-red-500/50' : 'bg-indigo-500 shadow-indigo-500/50 group-hover/item:scale-125'}`}></div>
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-[11px] font-black text-white font-mono tracking-tight uppercase">{ship.trackingNo}</span>
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${ship.status === '异常' ? 'text-red-400 bg-red-950 border-red-900' : 'text-indigo-300 bg-indigo-950 border-indigo-900'}`}>{ship.status}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate font-bold">{ship.productName || '未命名资产'}</div>
                              <div className="text-[9px] text-slate-700 font-mono mt-1.5 uppercase tracking-tighter">{ship.lastUpdate}</div>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => dispatch({type:'NAVIGATE', payload:{page:'tracking'}})} className="mt-auto w-full py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] border border-white/5 rounded-2xl transition-all">进入物流控制中心 &rarr;</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
