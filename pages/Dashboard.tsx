
import React, { useState, useMemo } from 'react';
import { DollarSign, Box, Wallet, BarChart4, ArrowUpRight, Loader2, TrendingUp, Sparkles, Command, Zap, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Line, Area } from 'recharts';
import StatCard from '../components/StatCard';
import { SALES_DATA } from '../constants';

const Dashboard: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  // Data for "Top 8 Net Profit" Chart
  const PROFIT_DATA = [
    { name: 'Hoodie X', value: 4500 },
    { name: 'Carplay Box', value: 3800 },
    { name: 'AI Chip', value: 3200 },
    { name: 'Keyboard K7', value: 2900 },
    { name: 'Magsafe Stand', value: 2100 },
    { name: 'Lens Kit', value: 1800 },
    { name: 'Tripod X', value: 1200 },
    { name: 'GaN Charger', value: 900 },
  ];

  // Data for Logistics Cost Structure
  const COST_DATA = [
    { name: '海运 (Sea)', value: 3100 },
    { name: '空运 (Air)', value: 200 },
  ];
  
  const metrics = {
      totalInvestment: 294300,
      netProfit: 1403,
      roi: 48.6,
      logisticsWeight: 47,
      topProduct: PROFIT_DATA[0].name
  };

  const forecastChartData = useMemo(() => {
      const history = SALES_DATA.map((item) => ({
          name: item.name,
          actual: item.value,
          forecast: null as number | null,
      }));
      // Simple projection logic
      const nextDays = ['周一', '周二', '周三', '周四', '周五'];
      const forecast = nextDays.map((day, i) => ({
          name: day,
          actual: null,
          forecast: 4000 + Math.random() * 2000
      }));
      return [...history, ...forecast];
  }, []);

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      setTimeout(() => {
          setReport("<b>AI 策略更新:</b> 当前综合 ROI 为 <span class='text-neon-cyan'>48.6%</span>，表现健康。建议将 'Hoodie X' 的广告预算增加 15% 以最大化 Q4 收益。推荐行动：增加 TikTok 投放预算。");
          setIsGenerating(false);
      }, 1500);
  };

  // HUD Style Custom Tooltip with Simulated AI Insight
  const CustomHUDTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          const variance = Math.floor(Math.random() * 30) - 10; 
          const insight = variance > 10 ? "表现强劲 (Strong)" : variance < -5 ? "需关注 (Focus)" : "表现平稳 (Stable)";
          
          return (
              <div className="bg-black/80 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md z-50 min-w-[200px]">
                  <p className="text-xs text-slate-400 font-bold font-mono mb-2 border-b border-white/10 pb-2 uppercase tracking-wider">{label || data.name}</p>
                  {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-4 text-xs font-mono mb-1">
                          <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: entry.stroke || entry.fill, color: entry.stroke || entry.fill }}></div>
                              <span className="text-slate-300 font-semibold">{entry.name}</span>
                          </div>
                          <span className="text-white font-bold text-sm tabular-nums">{entry.value?.toLocaleString()}</span>
                      </div>
                  ))}
                  
                  {/* Simulated AI Insight Section */}
                  <div className="mt-3 pt-2 border-t border-white/10 text-[10px]">
                      <div className="flex items-center gap-1 text-purple-400 mb-1 font-bold">
                          <Sparkles className="w-3 h-3" /> AI 洞察
                      </div>
                      <p className="text-slate-400 mt-0.5">
                          环比波动: <span className={variance > 0 ? 'text-emerald-400' : 'text-red-400'}>{variance > 0 ? '+' : ''}{variance}%</span>
                      </p>
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* AI Command Bar - Animated Entrance */}
      <div className="holo-card p-1 group animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 p-4 opacity-20 animate-pulse"><Sparkles className="w-32 h-32 text-purple-500" /></div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-between relative z-10 bg-gradient-to-r from-purple-900/20 to-transparent rounded-[20px] border border-purple-500/20">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20"></div>
                    <div className={`relative p-3.5 rounded-xl border border-purple-500/30 bg-black/40 text-purple-400`}>
                        <Zap className="w-7 h-7 fill-current" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-wide text-glow-purple">
                        AI 策略洞察 (AI Strategy Insight)
                    </h2>
                    {!report && (
                        <p className="text-sm text-slate-400 font-mono mt-1 font-medium">
                            等待指令，点击生成实时数据简报...
                        </p>
                    )}
                </div>
            </div>
            
            {!report && (
                <button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:opacity-50 border border-white/20 active:scale-95"
                >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />}
                    生成简报
                </button>
            )}
        </div>

        {report && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 relative z-10">
                <div className="p-5 bg-black/40 rounded-xl border border-purple-500/20 text-base text-slate-200 leading-relaxed font-mono shadow-inner" dangerouslySetInnerHTML={{ __html: report }}></div>
            </div>
        )}
      </div>

      {/* Metrics Grid - Staggered */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-1">
            <StatCard title="总投入 (Investment)" value={`¥${metrics.totalInvestment.toLocaleString()}`} trend="8.2%" trendUp={true} icon={Wallet} accentColor="blue" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-2">
            <StatCard title="预估净利 (Est. Net)" value={`$${metrics.netProfit.toLocaleString()}`} trend="12.5%" trendUp={true} icon={TrendingUp} accentColor="green" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-3">
            <StatCard title="综合 ROI" value={`${metrics.roi}%`} trend="-2.1%" trendUp={false} icon={BarChart4} accentColor="purple" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-4">
            <StatCard title="物流负载 (Logistics)" value={metrics.logisticsWeight} subValue="kg" trend="Stable" trendUp={true} icon={Box} accentColor="orange" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forecast Chart */}
        <div className="lg:col-span-2 ios-glass-card p-8 hud-card scanline-overlay animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-1">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <span className="w-1 h-5 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]"></span>
                        营收预测 (Forecast)
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-mono pl-4 font-semibold">实际值 vs AI 预测模型 v4.2</p>
                </div>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_currentColor]"></span> 实际
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_currentColor]"></span> AI 预测
                    </div>
                </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12, fontFamily: '"JetBrains Mono", monospace', fill: '#94a3b8', fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                      <YAxis stroke="#64748b" tick={{fontSize: 12, fontFamily: '"JetBrains Mono", monospace', fill: '#94a3b8', fontWeight: 500}} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomHUDTooltip />} />
                      <Area 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#06b6d4" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorActual)" 
                          style={{filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.3))'}}
                          name="Actual"
                      />
                      <Line 
                          type="monotone" 
                          dataKey="forecast" 
                          stroke="#a855f7" 
                          strokeWidth={3} 
                          strokeDasharray="4 4" 
                          dot={false}
                          style={{filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.3))'}}
                          name="Forecast"
                      />
                  </ComposedChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Cost Structure (Donut) */}
        <div className="ios-glass-card p-8 flex flex-col hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                <span className="w-1 h-5 bg-orange-500 rounded-full shadow-[0_0_10px_orange]"></span>
                物流成本分布 (Logistics)
            </h3>
            <div className="flex-1 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={COST_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={105}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            onClick={(data) => setActiveHighlight(activeHighlight === data.name ? null : data.name)}
                            cursor="pointer"
                        >
                            {COST_DATA.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={index === 0 ? '#06b6d4' : '#334155'} 
                                    fillOpacity={activeHighlight && activeHighlight !== entry.name ? 0.3 : 1}
                                    style={{
                                        filter: index===0 ? 'drop-shadow(0 0 10px rgba(6,182,212,0.3))' : '',
                                        outline: 'none'
                                    }} 
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">总计</p>
                    <p className="text-4xl font-display font-bold text-white tracking-tight text-glow-cyan mt-1">3.3k</p>
                </div>
            </div>
            <div className="flex justify-center gap-8 mt-4 border-t border-white/5 pt-6">
                <div className={`flex items-center gap-2 transition-opacity ${activeHighlight && activeHighlight !== '海运 (Sea)' ? 'opacity-30' : 'opacity-100'}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
                    <span className="text-sm text-slate-300 font-bold">海运 94%</span>
                </div>
                <div className={`flex items-center gap-2 transition-opacity ${activeHighlight && activeHighlight !== '空运 (Air)' ? 'opacity-30' : 'opacity-100'}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                    <span className="text-sm text-slate-300 font-bold">空运 6%</span>
                </div>
            </div>
        </div>

      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ios-glass-card p-8 hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-3">
             <h3 className="text-base font-bold text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                <span className="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                净利排行 (Net Profit Leaders)
             </h3>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PROFIT_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={110} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace'}} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomHUDTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                        <Bar 
                            dataKey="value" 
                            barSize={12} 
                            radius={[0, 4, 4, 0]}
                            onClick={(data) => setActiveHighlight(activeHighlight === data.name ? null : data.name)}
                            cursor="pointer"
                        >
                            {PROFIT_DATA.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={index < 3 ? 'url(#barGradient)' : '#334155'} 
                                    fillOpacity={activeHighlight && activeHighlight !== entry.name ? 0.3 : 1}
                                    style={{
                                        filter: index < 3 ? 'drop-shadow(0 0 4px rgba(16,185,129,0.3))' : '',
                                        outline: 'none'
                                    }} 
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="ios-glass-card p-8 flex flex-col hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-4">
             <div className="flex justify-between items-center mb-8">
                 <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <span className="w-1 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></span>
                    贡献度排名 (Contribution)
                 </h3>
                 <button className="text-xs text-cyan-400 hover:text-white border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 rounded-lg transition-all uppercase tracking-widest font-bold shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95">
                    查看全部
                 </button>
             </div>
             <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                 {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex items-center gap-5 relative z-10">
                             <div className="text-lg font-display font-bold text-slate-600 group-hover:text-cyan-400 transition-colors">0{i}</div>
                             <div>
                                 <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">产品线 {String.fromCharCode(64+i)}</p>
                                 <div className="w-32 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                     <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width: `${100 - i*20}%`}}></div>
                                 </div>
                             </div>
                         </div>
                         <div className="text-right relative z-10">
                             <p className="text-lg font-display font-bold text-white group-hover:text-cyan-400 group-hover:text-glow-cyan transition-colors">${(1500 - i*200).toLocaleString()}</p>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
