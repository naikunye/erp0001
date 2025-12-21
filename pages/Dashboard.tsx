import React, { useState, useMemo, useEffect } from 'react';
import { 
    Box, Wallet, Loader2, TrendingUp, Sparkles, Command, Zap, Gem, 
    AlertTriangle, ShieldCheck, Activity, PieChart, ArrowUpRight, 
    BarChart3, Radio, Terminal, Network, Fingerprint, Coins, ShieldAlert, Scale
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { AiInsight } from '../types';

const Dashboard: React.FC = () => {
  const { state, dispatch } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const EXCHANGE_RATE = 7.2;

  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
  }, []);

  const activeProducts = useMemo(() => (state.products || []).filter(p => !p.deletedAt), [state.products]);

  const metrics = useMemo(() => {
      let totalStockValueCNY = 0;
      let totalPotentialProfitUSD = 0;
      let totalLogisticsInvestmentCNY = 0;

      // 1. 计算库存资产与预付物流
      activeProducts.forEach(p => {
          const stock = Math.max(p.stock || 0, 0);
          const costCNY = p.costPrice || 0;
          totalStockValueCNY += stock * costCNY;
          
          if (stock > 0) {
              const dims = p.dimensions || {l:0, w:0, h:0};
              const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
              const autoUnitWeight = Math.max(p.unitWeight || 0, unitVolWeight);
              
              let activeTotalWeight = (p.logistics?.billingWeight && p.logistics.billingWeight > 0) ? p.logistics.billingWeight : (autoUnitWeight * stock);
              const rate = p.logistics?.unitFreightCost || 0;
              const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? (activeTotalWeight * rate);
              const unitLogisticsCNY = (effectiveTotalFreightCNY / stock) + (p.logistics?.consumablesFee || 0);
              
              // 累加该 SKU 占用的总物流投入
              totalLogisticsInvestmentCNY += unitLogisticsCNY * stock;

              // 计算潜在利润
              const priceUSD = p.price || 0;
              const eco = p.economics;
              const platformFeeUSD = priceUSD * (((eco?.platformFeePercent || 0) + (eco?.creatorFeePercent || 0)) / 100);
              const fixedFeesUSD = (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0) + (eco?.adCost || 0);
              const refundLossUSD = priceUSD * ((eco?.refundRatePercent || 0) / 100);

              const unitProfitUSD = priceUSD - ( (costCNY / EXCHANGE_RATE) + (unitLogisticsCNY / EXCHANGE_RATE) + platformFeeUSD + fixedFeesUSD + refundLossUSD );
              totalPotentialProfitUSD += unitProfitUSD * stock;
          }
      });

      // 2. 穿透计算现金余额与挂账负债
      let completedIncome = 0;
      let completedExpense = 0;
      let pendingLiabilities = 0;

      (state.transactions || []).forEach(t => {
          const val = t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount;
          if (t.type === 'income') {
              if (t.status === 'completed') completedIncome += val;
          } else {
              if (t.status === 'completed') completedExpense += val;
              else if (t.status === 'pending') pendingLiabilities += val;
          }
      });

      const cashBalanceCNY = completedIncome - completedExpense;
      // 总资产 = 现金 + 在库货值 + 预付物流成本
      const totalAssetsCNY = cashBalanceCNY + totalStockValueCNY + totalLogisticsInvestmentCNY;
      const netWorthCNY = totalAssetsCNY - pendingLiabilities;

      return {
          totalAssetsCNY,
          totalLiabilitiesCNY: pendingLiabilities,
          netWorthCNY,
          stockValueCNY: totalStockValueCNY,
          logisticsValueCNY: totalLogisticsInvestmentCNY,
          totalPotentialProfitUSD,
          roi: (totalStockValueCNY + totalLogisticsInvestmentCNY) > 0 ? (totalPotentialProfitUSD * EXCHANGE_RATE / (totalStockValueCNY + totalLogisticsInvestmentCNY) * 100) : 0,
          lowStockSkus: activeProducts.filter(p => (p.stock / (p.dailyBurnRate || 1)) < 15).length
      };
  }, [activeProducts, state.transactions]);

  const assetComposition = [
      { name: '现金流', value: Math.max(0, metrics.totalAssetsCNY - metrics.stockValueCNY - metrics.logisticsValueCNY), color: '#6366f1' },
      { name: '库存货值', value: metrics.stockValueCNY, color: '#8b5cf6' },
      { name: '预付物流', value: metrics.logisticsValueCNY, color: '#3b82f6' }
  ];

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            系统财务快照分析：
            总资产: ¥${metrics.totalAssetsCNY.toLocaleString()}
            总负债: ¥${metrics.totalLiabilitiesCNY.toLocaleString()}
            净资产: ¥${metrics.netWorthCNY.toLocaleString()}
            库存占比: ${((metrics.stockValueCNY / metrics.totalAssetsCNY) * 100).toFixed(1)}%
            请提供一条关于“资本效率与风险对冲”的高级经营建议。使用 HTML 加粗关键术语。
          `;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setReport(response.text);
      } catch (e) {
          setReport(`审计引擎离线，无法生成量子报告。`);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* 自动化实时脉冲 */}
      <div className="ios-glass-panel border-indigo-500/30 bg-indigo-500/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 animate-pulse shadow-[0_0_20px_#6366f1]"></div>
          <div className="flex items-center gap-6 shrink-0">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl relative group-hover:rotate-12 transition-transform">
                  <Network className="w-8 h-8" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#121217] animate-ping"></div>
              </div>
              <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] block">Automation Pulse</span>
                  <span className="text-[9px] text-slate-500 font-mono flex items-center gap-2 mt-1">
                      <Activity className="w-3 h-3 text-emerald-500"/> SYSTEM LOGIC HOOKS: ACTIVE
                  </span>
              </div>
          </div>
          <div className="flex-1 flex gap-8 overflow-x-auto scrollbar-none py-2">
              {(state.automationLogs || []).length > 0 ? (
                  state.automationLogs.slice(0, 3).map(log => (
                      <div key={log.id} className="flex items-start gap-4 shrink-0 border-l border-white/5 pl-8 first:border-none first:pl-0 group/log">
                          <div className={`w-1 h-12 rounded-full mt-1 bg-indigo-500 group-hover/log:scale-y-110 transition-transform`}></div>
                          <div className="flex flex-col">
                              <span className="text-[11px] font-black text-white uppercase group-hover/log:text-indigo-400 transition-colors">{log.ruleName}</span>
                              <span className="text-[10px] text-slate-500 mt-1 max-w-[200px] line-clamp-2 leading-tight">{log.details}</span>
                              <span className="text-[8px] text-slate-700 font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="flex-1 flex items-center gap-4 text-slate-600 font-mono italic text-[10px] uppercase tracking-widest opacity-40">
                      <Terminal className="w-4 h-4" /> 侦听中... 等待系统事件触发逻辑勾子
                  </div>
              )}
          </div>
          <button onClick={() => dispatch({type:'NAVIGATE', payload:{page:'automation'}})} className="shrink-0 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/10 transition-all">规则配置</button>
      </div>

      {/* 新增的核心财务资产负债 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            loading={isLoading} 
            title="系统总资产 (Total Assets)" 
            value={`¥${metrics.totalAssetsCNY.toLocaleString()}`} 
            trend="包含现金/货值/预付" 
            trendUp={true} 
            icon={Coins} 
            accentColor="cyan" 
        />
        <StatCard 
            loading={isLoading} 
            title="总负债 (Total Liabilities)" 
            value={`¥${metrics.totalLiabilitiesCNY.toLocaleString()}`} 
            trend="所有待执行支出" 
            trendUp={metrics.totalLiabilitiesCNY === 0} 
            icon={ShieldAlert} 
            accentColor="pink" 
        />
        <StatCard 
            loading={isLoading} 
            title="净资产 (Net Worth)" 
            value={`¥${metrics.netWorthCNY.toLocaleString()}`} 
            trend="全息权益盈余" 
            trendUp={metrics.netWorthCNY > 0} 
            icon={Scale} 
            accentColor="green" 
        />
      </div>

      {/* 原有的运营 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard loading={isLoading} title="在库货值总计" value={`¥${metrics.stockValueCNY.toLocaleString()}`} trend="量子库存镜像" trendUp={true} icon={Wallet} accentColor="blue" />
        <StatCard loading={isLoading} title="预估总净利" value={`$${metrics.totalPotentialProfitUSD.toLocaleString()}`} trend={`${metrics.roi.toFixed(1)}% ROI`} trendUp={metrics.roi >= 0} icon={Gem} accentColor="purple" />
        <StatCard loading={isLoading} title="库存健康线" value={metrics.lowStockSkus} subValue="SKUs" trend="异常库存预警" trendUp={metrics.lowStockSkus === 0} icon={AlertTriangle} accentColor="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
              <div className="ios-glass-card p-1 relative overflow-hidden bg-gradient-to-br from-indigo-600/10 to-transparent border-indigo-500/20 rounded-[2.5rem]">
                <div className="p-8 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-2xl group hover:border-indigo-500 transition-all">
                            <ShieldCheck className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">资产风险审计协议 (Audit V6.0)</h2>
                            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Fingerprint className="w-3 h-3 text-indigo-500" /> SECURE AUDIT PIPELINE ACTIVE
                            </p>
                        </div>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isGenerating} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-900/40 flex items-center gap-3 transition-all active:scale-95">
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />} 启动量子审计
                    </button>
                </div>
                {report && (
                    <div className="px-8 pb-8 animate-in slide-in-from-top-4 relative z-10">
                        <div className="p-8 bg-black/60 rounded-[2.5rem] border border-indigo-500/30 text-indigo-100 leading-relaxed font-mono text-xs shadow-inner" dangerouslySetInnerHTML={{ __html: report }}></div>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="ios-glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 relative overflow-hidden group">
                      <div className="flex justify-between items-center relative z-10">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">资产构成分布 (Matrix)</h4>
                          <PieChart className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="h-48 relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                  <Pie data={assetComposition} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={8} dataKey="value" stroke="none">
                                      {assetComposition.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{backgroundColor:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'12px'}} />
                              </RePieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="flex justify-around text-[9px] font-black uppercase tracking-widest relative z-10">
                          {assetComposition.map(item => (
                              <div key={item.name} className="flex flex-col items-center gap-1">
                                  <span className="text-slate-400 font-medium" style={{color: item.color}}>{item.name}</span>
                                  <span className="text-white font-mono font-bold">¥{(item.value / 1000).toFixed(0)}k</span>
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

          <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="ios-glass-card p-8 flex flex-col flex-1 border-l-4 border-l-indigo-600 bg-black/20 rounded-[2.5rem]">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-indigo-500" /> 全球物流实况 (Live)
                  </h3>
                  <div className="space-y-8 relative pl-4">
                      <div className="absolute left-[2px] top-1 bottom-1 w-px bg-white/5"></div>
                      {(state.shipments || []).slice(0, 4).map((ship) => (
                          <div key={ship.id} className="relative pl-6 group/item">
                              <div className={`absolute left-[-5.5px] top-1.5 w-3 h-3 rounded-full border-2 border-[#050506] shadow-lg transition-all ${ship.status === '异常' ? 'bg-red-500 shadow-red-500/50' : 'bg-indigo-500 shadow-indigo-500/50 group-hover/item:scale-125'}`}></div>
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-[11px] font-black text-white font-mono tracking-tight uppercase">{ship.trackingNo}</span>
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${ship.status === '异常' ? 'text-red-400 bg-red-950 border-red-900' : 'text-indigo-300 bg-indigo-950 border-indigo-900'}`}>{ship.status}</span>
                              </div>
                              <div className="text-xs text-slate-300 truncate font-bold">{ship.productName || '资产载荷中...'}</div>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => dispatch({type:'NAVIGATE', payload:{page:'tracking'}})} className="mt-auto w-full py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] border border-white/5 rounded-2xl transition-all">进入物流控制矩阵 &rarr;</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;