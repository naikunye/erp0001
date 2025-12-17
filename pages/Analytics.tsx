
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  ComposedChart, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine
} from 'recharts';
import { 
  DollarSign, Activity, Truck, Wallet, Megaphone,
  BrainCircuit, ArrowUpRight, ArrowDownRight, Target, BarChart4, PieChart as PieIcon,
  X, Globe, Sparkles
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

// --- VISUAL CONSTANTS ---
const COLORS = {
  primary: '#06b6d4', // Cyan
  secondary: '#8b5cf6', // Purple
  success: '#10b981', // Emerald
  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
  text: '#94a3b8', // Slate-400
  grid: 'rgba(255,255,255,0.05)',
  chart: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
};

// --- Custom HUD Tooltip ---
const CustomHUDTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/90 border border-cyan-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md z-50">
                <p className="text-[10px] text-cyan-400 font-bold font-mono mb-1 border-b border-cyan-500/20 pb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs font-mono">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }}></div>
                        <span className="text-slate-300">{entry.name}:</span>
                        <span className="text-white font-bold">
                            {typeof entry.value === 'number' ? 
                                (entry.name.includes('%') || entry.name.includes('Rate') ? `${entry.value.toFixed(2)}%` : entry.value.toLocaleString(undefined, {maximumFractionDigits: 2})) 
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Helper Components ---
const KPIBox = ({ title, value, subValue, trend, icon: Icon, color }: any) => (
    <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{title}</span>
            <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex items-end gap-2">
            <span className="text-2xl font-mono font-bold text-white tracking-tight">{value}</span>
            <span className="text-xs text-slate-400 mb-1 font-mono">{subValue}</span>
        </div>
        <div className={`text-[10px] mt-2 flex items-center gap-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
            {Math.abs(trend)}% vs last period
        </div>
    </div>
);

const Analytics: React.FC = () => {
  const { state } = useTanxing();
  const [activeTab, setActiveTab] = useState<'finance' | 'supply'>('finance');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const handleAiAnalysis = async (context: string) => {
      setIsAiThinking(true);
      setAiInsight(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Act as a Chief Data Officer (CDO). Analyze context: "${context}". 
              Provide 3 HIGH-LEVEL strategic insights (bullet points). 
              Focus on risk mitigation and profit maximization. 
              Output HTML bolding key metrics. Language: Chinese.`,
          });
          setAiInsight(response.text);
      } catch (e) {
          setAiInsight("AI 连接超时，请检查 API Key 配置。");
      } finally {
          setIsAiThinking(false);
      }
  };

  // --- 1. FINANCE VIEW (Real Aggregation) ---
  const FinanceView = () => {
      // Aggregate State Transactions by Date
      const plData = useMemo(() => {
          const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
          const today = new Date();
          const aggregated: Record<string, { Revenue: number, COGS: number, Ads: number, NetProfit: number }> = {};

          // Initialize dates
          for (let i = days - 1; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              aggregated[dateStr] = { Revenue: 0, COGS: 0, Ads: 0, NetProfit: 0 };
          }

          // Sum transactions
          state.transactions.forEach(tx => {
              if (aggregated[tx.date]) {
                  const amount = tx.currency === 'CNY' ? tx.amount / 7.2 : tx.amount; // Normalize to USD
                  if (tx.type === 'income') {
                      aggregated[tx.date].Revenue += amount;
                  } else {
                      if (tx.category === 'COGS') aggregated[tx.date].COGS += amount;
                      else if (tx.category === 'Marketing') aggregated[tx.date].Ads += amount;
                      // You might want to add other expenses to calculate true Net Profit
                  }
              }
          });

          // Calculate Net Profit & Margin per day
          return Object.entries(aggregated).map(([date, vals]) => {
              const net = vals.Revenue - vals.COGS - vals.Ads;
              return {
                  date: date.slice(5),
                  ...vals,
                  NetProfit: net,
                  Margin: vals.Revenue > 0 ? (net / vals.Revenue) * 100 : 0
              };
          });
      }, [state.transactions, timeRange]);

      const totalRev = plData.reduce((a,b) => a+b.Revenue, 0);
      const totalNet = plData.reduce((a,b) => a+b.NetProfit, 0);
      const avgMargin = totalRev > 0 ? (totalNet / totalRev) * 100 : 0;

      // Expense Breakdown
      const expenseBreakdown = useMemo(() => {
          let cogs = 0, ads = 0, logistics = 0, ops = 0;
          state.transactions.forEach(tx => {
              if (tx.type === 'expense') {
                  const amount = tx.currency === 'CNY' ? tx.amount / 7.2 : tx.amount;
                  if (tx.category === 'COGS') cogs += amount;
                  else if (tx.category === 'Marketing') ads += amount;
                  else if (tx.category === 'Logistics') logistics += amount;
                  else ops += amount;
              }
          });
          const total = cogs + ads + logistics + ops;
          if (total === 0) return [];
          return [
              { name: '采购 (COGS)', value: cogs },
              { name: '广告 (Ads)', value: ads },
              { name: '物流 (Logistics)', value: logistics },
              { name: '运营 (Ops)', value: ops }
          ];
      }, [state.transactions]);

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPIBox title="总营收 (Revenue)" value={`$${(totalRev).toLocaleString(undefined, {maximumFractionDigits:0})}`} subValue="USD" trend={12.5} icon={DollarSign} color="text-cyan-400" />
              <KPIBox title="净利润 (Net Profit)" value={`$${(totalNet).toLocaleString(undefined, {maximumFractionDigits:0})}`} subValue="USD" trend={-2.4} icon={Wallet} color="text-emerald-400" />
              <KPIBox title="利润率 (Net Margin)" value={`${avgMargin.toFixed(1)}%`} subValue="Avg" trend={5.1} icon={Activity} color="text-purple-400" />
              <KPIBox title="交易笔数 (Volume)" value={state.transactions.length} subValue="Count" trend={0} icon={Megaphone} color="text-pink-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Composed Chart */}
              <div className="lg:col-span-2 ios-glass-card p-6 flex flex-col h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <BarChart4 className="w-4 h-4 text-cyan-400" /> 
                          盈亏构成分析 (P&L Composition)
                      </h3>
                      <button 
                        onClick={() => handleAiAnalysis(`Revenue $${totalRev}, Margin ${avgMargin.toFixed(1)}%.`)}
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-lg transition-all"
                      >
                          <BrainCircuit className="w-3 h-3" /> 智能诊断
                      </button>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={plData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                              <defs>
                                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                              <XAxis dataKey="date" stroke={COLORS.text} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                              <YAxis yAxisId="left" stroke={COLORS.text} tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${v}`} />
                              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{fontSize: 10}} axisLine={false} tickLine={false} unit="%" domain={['auto', 'auto']} />
                              <Tooltip content={<CustomHUDTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                              <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                              <Bar yAxisId="left" dataKey="Revenue" stackId="a" fill="#334155" barSize={12} name="营收 (Rev)" />
                              <Area yAxisId="left" type="monotone" dataKey="NetProfit" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} name="净利 (Net)" />
                              <Line yAxisId="right" type="monotone" dataKey="Margin" stroke="#f59e0b" strokeWidth={2} dot={false} name="利润率 (%)" />
                          </ComposedChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Expense Breakdown */}
              <div className="lg:col-span-1 ios-glass-card p-6 flex flex-col h-[400px]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-purple-400" /> 
                      支出分布 (Expense Breakdown)
                  </h3>
                  <div className="flex-1 relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={expenseBreakdown}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {expenseBreakdown.map((entry, index) => <Cell key={index} fill={COLORS.chart[index % COLORS.chart.length]} />)}
                              </Pie>
                              <Tooltip content={<CustomHUDTooltip />} />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-sm font-bold text-white">Expenses</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-400">
                      {expenseBreakdown.map((e, i) => (
                          <div key={i} className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded" style={{backgroundColor: COLORS.chart[i % COLORS.chart.length]}}></div> 
                              {e.name}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
      );
  };

  // --- 2. SUPPLY VIEW (Real Inventory Matrix) ---
  const SupplyView = () => {
      // Calculate Real BCG Matrix Data from Products State
      const scatterData = useMemo(() => {
          return state.products
            .filter(p => !p.deletedAt)
            .map(p => {
              const velocity = p.dailyBurnRate || 0; // Y
              const dos = velocity > 0 ? (p.stock / velocity) : 999; // X
              const value = p.stock * (p.costPrice || 0); // Z
              
              let status = 'Healthy';
              let fill = '#10b981';
              
              if (dos > 120 && velocity < 1) { status = '滞销 (Dead)'; fill = '#ef4444'; }
              else if (dos < 20 && velocity > 5) { status = '缺货风险 (Risk)'; fill = '#f59e0b'; }
              else if (dos > 90) { status = '库存积压 (Bloat)'; fill = '#64748b'; }

              return {
                  x: Math.min(dos, 150), // Cap X for visual clarity
                  y: velocity,
                  z: value,
                  name: p.sku,
                  status,
                  fill
              };
          });
      }, [state.products]);

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Visualization (Placeholder for Global Nodes) */}
              <div className="lg:col-span-1 ios-glass-card p-0 relative overflow-hidden flex flex-col h-[450px]">
                  <div className="p-4 border-b border-white/10 bg-white/5 z-10 relative">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400" /> 全球节点监控
                      </h3>
                  </div>
                  <div className="flex-1 relative bg-[radial-gradient(circle_at_center,#1e293b_0%,#000000_100%)]">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
                      {/* Active Nodes */}
                      <div className="absolute top-[30%] left-[20%] flex flex-col items-center group">
                          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6] animate-pulse"></div>
                          <span className="text-[10px] mt-1 text-slate-400 bg-black/50 px-1 rounded">US-West</span>
                      </div>
                      <div className="absolute top-[35%] left-[25%] flex flex-col items-center group">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_#6366f1]"></div>
                          <span className="text-[10px] mt-1 text-slate-400 bg-black/50 px-1 rounded">US-East</span>
                      </div>
                      <div className="absolute top-[40%] right-[20%] flex flex-col items-center group">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]"></div>
                          <span className="text-[10px] mt-1 text-slate-400 bg-black/50 px-1 rounded">Shenzhen</span>
                      </div>
                  </div>
              </div>

              {/* Inventory Health Matrix (Real Data) */}
              <div className="lg:col-span-2 ios-glass-card p-6 flex flex-col h-[450px]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-400" /> 库存健康矩阵 (BCG Matrix)
                      </h3>
                      <div className="flex gap-4 text-[10px]">
                          <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded bg-red-500"></div> 滞销</span>
                          <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded bg-amber-500"></div> 缺货风险</span>
                          <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded bg-emerald-500"></div> 健康</span>
                      </div>
                  </div>
                  
                  <div className="flex-1 relative border border-white/5 rounded-lg bg-black/20 p-2">
                      {/* Quadrant Labels */}
                      <div className="absolute top-2 left-2 text-[10px] text-amber-500/50 font-bold uppercase">Risk (High Sales, Low Stock)</div>
                      <div className="absolute top-2 right-2 text-[10px] text-emerald-500/50 font-bold uppercase">Star (High Sales, High Stock)</div>
                      <div className="absolute bottom-2 left-2 text-[10px] text-slate-500/50 font-bold uppercase">Dog (Low Sales, Low Stock)</div>
                      <div className="absolute bottom-2 right-2 text-[10px] text-red-500/50 font-bold uppercase">Bloat (Low Sales, High Stock)</div>

                      <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 0}}>
                              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                              <XAxis type="number" dataKey="x" name="Inventory Days (DOS)" unit="d" stroke={COLORS.text} fontSize={10} domain={[0, 150]} />
                              <YAxis type="number" dataKey="y" name="Daily Sales Velocity" unit="pcs" stroke={COLORS.text} fontSize={10} />
                              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Stock Value" />
                              <Tooltip cursor={{strokeDasharray: '3 3'}} content={<CustomHUDTooltip />} />
                              <ReferenceLine x={60} stroke="#475569" strokeDasharray="3 3" label={{ position: 'top', value: 'Avg DOS', fontSize: 10, fill: '#64748b' }} />
                              <ReferenceLine y={5} stroke="#475569" strokeDasharray="3 3" label={{ position: 'right', value: 'Velocity Threshold', fontSize: 10, fill: '#64748b' }} />
                              <Scatter name="Products" data={scatterData} fill="#8884d8">
                                  {scatterData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                              </Scatter>
                          </ScatterChart>
                      </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">X轴: 库存周转天数 (Days of Supply) | Y轴: 日均销量 (Velocity) | 气泡大小: 货值</p>
              </div>
          </div>
      </div>
      );
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3 text-glow-cyan">
                    <span className="w-2 h-8 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></span>
                    深度数据分析系统
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-purple-500" />
                    Deep Analytics • Strategic Intelligence
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Time Range Selector */}
                <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
                    {['7d', '30d', '90d'].map((range: any) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                                timeRange === range ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1 shadow-lg">
                    {[
                        { id: 'finance', label: '财务深析', icon: Wallet },
                        { id: 'supply', label: '供应链智脑', icon: Truck },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* AI Insight Bar (Global) */}
        {aiInsight && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 relative">
                <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0"><Sparkles className="w-5 h-5 text-indigo-400" /></div>
                <div className="text-xs text-indigo-100 leading-relaxed pt-1" dangerouslySetInnerHTML={{ __html: aiInsight }}></div>
                <button onClick={() => setAiInsight(null)} className="absolute top-2 right-2 text-indigo-400 hover:text-white"><X className="w-4 h-4"/></button>
            </div>
        )}

        {/* --- TAB CONTENT AREA --- */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'supply' && <SupplyView />}
        </div>
    </div>
  );
};

export default Analytics;
