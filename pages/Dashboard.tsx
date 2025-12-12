
import React, { useState, useMemo } from 'react';
import { DollarSign, Box, Wallet, BarChart4, ArrowUpRight, Loader2, TrendingUp, Sparkles, Command, Zap, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Line, Area } from 'recharts';
import StatCard from '../components/StatCard';
import { SALES_DATA } from '../constants';

const Dashboard: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

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
  
  // Data for Unit Economics (New Feature)
  const UNIT_ECONOMICS_DATA = [
    {
      name: 'MAD ACID 赛博卫衣',
      sku: 'MA-001',
      total: 15.62,
      breakdown: [
        { label: '货值', value: 6.5, color: '#3b82f6', percent: 41 }, // blue-500
        { label: '头程', value: 2.5, color: '#f97316', percent: 16 }, // orange-500
        { label: '尾程', value: 3.5, color: '#a855f7', percent: 22 }, // purple-500
        { label: '佣金', value: 1.12, color: '#ec4899', percent: 8 }, // pink-500
        { label: '广告', value: 2.0, color: '#64748b', percent: 13 }  // slate-500
      ]
    },
    {
      name: 'Carplay Q1M 车机盒',
      sku: 'CP-Q1M',
      total: 25.37,
      breakdown: [
        { label: '货值', value: 10.5, color: '#3b82f6', percent: 41 },
        { label: '头程', value: 1.2, color: '#f97316', percent: 5 },
        { label: '尾程', value: 4.0, color: '#a855f7', percent: 16 },
        { label: '佣金', value: 4.67, color: '#ec4899', percent: 18 },
        { label: '广告', value: 5.0, color: '#64748b', percent: 20 }
      ]
    },
    {
      name: 'AI BOX2 (Fan Edition)',
      sku: 'BOX2-NEW',
      total: 42.52,
      breakdown: [
        { label: '货值', value: 18.0, color: '#3b82f6', percent: 42 },
        { label: '头程', value: 0.8, color: '#f97316', percent: 2 },
        { label: '尾程', value: 4.5, color: '#a855f7', percent: 11 },
        { label: '佣金', value: 11.22, color: '#ec4899', percent: 26 },
        { label: '广告', value: 8.0, color: '#64748b', percent: 19 }
      ]
    }
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

  // HUD Style Custom Tooltip
  const CustomHUDTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-black/90 border border-neon-cyan/30 p-3 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.2)] backdrop-blur-md">
                  <p className="text-[10px] text-neon-cyan font-bold font-mono mb-1 border-b border-neon-cyan/20 pb-1">{label}</p>
                  {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs font-mono">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }}></div>
                          <span className="text-slate-300">{entry.name}:</span>
                          <span className="text-white font-bold">{entry.value?.toLocaleString()}</span>
                      </div>
                  ))}
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* AI Command Bar - Animated Entrance */}
      <div className="holo-card p-1 group animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 p-4 opacity-20 animate-pulse"><Sparkles className="w-32 h-32 text-neon-purple" /></div>
        <div className="p-5 flex items-center justify-between relative z-10 bg-gradient-to-r from-neon-purple/10 to-transparent rounded-[20px]">
            <div className="flex items-center gap-5">
                <div className="relative">
                    <div className="absolute inset-0 bg-neon-purple blur-md opacity-50"></div>
                    <div className={`relative p-3 rounded-xl border border-neon-purple/30 bg-black/40 text-neon-purple`}>
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-wide text-glow-purple">
                        AI 策略洞察 (AI Strategy Insight)
                    </h2>
                    {!report && (
                        <p className="text-xs text-slate-400 font-mono mt-1">
                            等待指令，点击生成实时数据简报...
                        </p>
                    )}
                </div>
            </div>
            
            {!report && (
                <button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-neon-purple hover:bg-fuchsia-600 text-white transition-all shadow-[0_0_20px_#BD00FF] hover:shadow-[0_0_30px_#BD00FF] disabled:opacity-50 border border-white/20 active:scale-95"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />}
                    生成简报
                </button>
            )}
        </div>

        {report && (
            <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 relative z-10">
                <div className="p-4 bg-black/40 rounded-xl border border-neon-purple/20 text-sm text-slate-200 leading-relaxed font-mono shadow-inner" dangerouslySetInnerHTML={{ __html: report }}></div>
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

      {/* Unit Economics Chart (NEW SECTION) */}
      <div className="holo-card p-6 hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 mt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
                      $ TikTok 成本结构拆解 (Unit Economics)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 pl-3">单品全链路成本透视 • 利润空间分析</p>
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> 货值 (Goods)</div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> 头程 (Logistics)</div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> 尾程 (Last Leg)</div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-pink-500 rounded-full"></div> 佣金 (Fees)</div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-500 rounded-full"></div> 广告 (Ads)</div>
              </div>
          </div>
          
          <div className="space-y-8">
              {UNIT_ECONOMICS_DATA.map(item => (
                  <div key={item.sku} className="relative group">
                      <div className="flex justify-between text-xs mb-2 items-end">
                          <div>
                              <span className="font-bold text-white text-sm">{item.name}</span>
                              <span className="text-slate-500 ml-2 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">{item.sku}</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[10px]">
                              总成本: <span className="font-bold text-white text-sm ml-1">${item.total.toFixed(2)}</span>
                          </div>
                      </div>
                      
                      {/* Stacked Bar */}
                      <div className="h-6 w-full flex rounded overflow-hidden bg-slate-800/50 ring-1 ring-white/5">
                          {item.breakdown.map((part, idx) => (
                              <div 
                                  key={idx} 
                                  style={{ width: `${(part.value / item.total) * 100}%`, backgroundColor: part.color }}
                                  className="h-full relative group/segment flex items-center justify-center transition-all hover:brightness-110"
                              >
                                  {/* Tooltip on Hover */}
                                  <div className="absolute bottom-full mb-2 opacity-0 group-hover/segment:opacity-100 transition-opacity bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 border border-white/10 shadow-xl pointer-events-none">
                                      <span className="font-bold" style={{color: part.color}}>{part.label}</span>: ${part.value} ({part.percent}%)
                                  </div>
                                  
                                  {/* Segment Label (only if wide enough) */}
                                  {(part.value / item.total) > 0.1 && (
                                      <span className="text-[9px] font-bold text-white/90 drop-shadow-md truncate px-1">
                                          {part.label}
                                      </span>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forecast Chart */}
        <div className="lg:col-span-2 holo-card p-6 hud-card scanline-overlay animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-1">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1 h-4 bg-neon-cyan rounded-full shadow-[0_0_10px_#00F0FF]"></span>
                        营收预测 (Forecast)
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono pl-3">实际值 vs AI 预测模型 v4.2</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_5px_#00F0FF]"></span> 实际
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_5px_#BD00FF]"></span> AI 预测
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#BD00FF" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#BD00FF" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8'}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" tick={{fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomHUDTooltip />} />
                      <Area 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#00F0FF" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorActual)" 
                          style={{filter: 'drop-shadow(0 0 5px rgba(0,240,255,0.5))'}}
                          name="Actual"
                      />
                      <Line 
                          type="monotone" 
                          dataKey="forecast" 
                          stroke="#BD00FF" 
                          strokeWidth={2} 
                          strokeDasharray="4 4" 
                          dot={false}
                          style={{filter: 'drop-shadow(0 0 5px rgba(189,0,255,0.5))'}}
                          name="Forecast"
                      />
                  </ComposedChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Cost Structure (Donut) */}
        <div className="holo-card p-6 flex flex-col hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_orange]"></span>
                物流成本分布 (Logistics)
            </h3>
            <div className="flex-1 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                        <Pie
                            data={COST_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {COST_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#00F0FF' : '#1e293b'} style={{filter: index===0 ? 'drop-shadow(0 0 10px rgba(0,240,255,0.4))' : ''}} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">总计</p>
                    <p className="text-3xl font-black text-white tracking-tight font-mono text-glow-cyan">3.3k</p>
                </div>
            </div>
            <div className="flex justify-center gap-6 mt-2 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#00F0FF]"></span>
                    <span className="text-xs text-slate-300 font-mono">海运 94%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                    <span className="text-xs text-slate-300 font-mono">空运 6%</span>
                </div>
            </div>
        </div>

      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="holo-card p-6 hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-3">
             <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                净利排行 (Net Profit Leaders)
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PROFIT_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600, fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomHUDTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                        <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]}>
                            {PROFIT_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? 'url(#barGradient)' : '#334155'} style={{filter: index < 3 ? 'drop-shadow(0 0 5px rgba(16,185,129,0.4))' : ''}} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="holo-card p-6 flex flex-col hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-4">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></span>
                    贡献度排名 (Contribution)
                 </h3>
                 <button className="text-[10px] text-neon-cyan hover:text-white border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 rounded transition-all uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:bg-cyan-500/20 active:scale-95">
                    查看全部
                 </button>
             </div>
             <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                 {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-cyan/30 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex items-center gap-4 relative z-10">
                             <div className="text-sm font-mono font-bold text-slate-500 group-hover:text-neon-cyan transition-colors">0{i}</div>
                             <div>
                                 <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">产品线 {String.fromCharCode(64+i)}</p>
                                 <div className="w-24 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                     <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width: `${100 - i*20}%`}}></div>
                                 </div>
                             </div>
                         </div>
                         <div className="text-right relative z-10">
                             <p className="text-sm font-mono text-white font-bold group-hover:text-neon-cyan group-hover:text-glow-cyan transition-colors">${(1500 - i*200).toLocaleString()}</p>
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
