
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  ComposedChart, ReferenceLine, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  DollarSign, Activity, Truck, Calculator, RefreshCw, 
  BrainCircuit, Loader2, Sparkles, X, Megaphone,
  Video, Play, Map as MapIcon, Globe,
  Wallet, Search, ArrowRight, Target, ShoppingBag, TrendingUp,
  Filter, Calendar, Layers, BarChart4, PieChart as PieIcon,
  MousePointerClick, Zap, Cpu, Sliders, Trophy, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';
import { WAREHOUSES } from '../constants';

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
  const { state, showToast } = useTanxing();
  const [activeTab, setActiveTab] = useState<'finance' | 'supply' | 'ads' | 'market'>('finance');
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

  // --- 1. FINANCE VIEW (Deep Dive) ---
  const FinanceView = () => {
      const plData = useMemo(() => {
          const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
          return Array.from({ length: days }, (_, i) => {
              const revenue = Math.floor(Math.random() * 5000) + 3000 + (i * 50);
              const cogs = revenue * 0.32;
              const ads = revenue * 0.28;
              const net = revenue - cogs - ads;
              return {
                  date: `D${i + 1}`,
                  Revenue: revenue,
                  COGS: cogs,
                  Ads: ads,
                  NetProfit: net,
                  Margin: parseFloat(((net / revenue) * 100).toFixed(1))
              };
          });
      }, [timeRange]);

      const totalRev = plData.reduce((a,b) => a+b.Revenue, 0);
      const totalNet = plData.reduce((a,b) => a+b.NetProfit, 0);
      const avgMargin = (totalNet / totalRev) * 100;

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPIBox title="总营收 (Revenue)" value={`$${(totalRev/1000).toFixed(1)}k`} subValue="USD" trend={12.5} icon={DollarSign} color="text-cyan-400" />
              <KPIBox title="净利润 (Net Profit)" value={`$${(totalNet/1000).toFixed(1)}k`} subValue="USD" trend={-2.4} icon={Wallet} color="text-emerald-400" />
              <KPIBox title="利润率 (Net Margin)" value={`${avgMargin.toFixed(1)}%`} subValue="Avg" trend={5.1} icon={Activity} color="text-purple-400" />
              <KPIBox title="营销占比 (Ad Ratio)" value="28.0%" subValue="of Rev" trend={-1.2} icon={Megaphone} color="text-pink-400" />
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
                        onClick={() => handleAiAnalysis(`Revenue $${totalRev}, Margin ${avgMargin.toFixed(1)}%. Ad spend is stable but margin is slightly declining.`)}
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
                              <YAxis yAxisId="left" stroke={COLORS.text} tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v)=>`${v/1000}k`} />
                              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{fontSize: 10}} axisLine={false} tickLine={false} unit="%" domain={[0, 40]} />
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
                                  data={[
                                      { name: '采购 (COGS)', value: 35, color: '#3b82f6' },
                                      { name: '广告 (Ads)', value: 28, color: '#ec4899' },
                                      { name: '物流 (Logistics)', value: 15, color: '#06b6d4' },
                                      { name: '运营 (Ops)', value: 10, color: '#64748b' },
                                      { name: '净利 (Net)', value: 12, color: '#10b981' },
                                  ]}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {[0,1,2,3,4].map((i) => <Cell key={i} fill={['#3b82f6', '#ec4899', '#06b6d4', '#64748b', '#10b981'][i]} />)}
                              </Pie>
                              <Tooltip content={<CustomHUDTooltip />} />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-white">88%</span>
                          <span className="text-[10px] text-slate-500 uppercase">Total Expense</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500"></div> 采购 35%</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-pink-500"></div> 广告 28%</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-cyan-500"></div> 物流 15%</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> 净利 12%</div>
                  </div>
              </div>
          </div>
      </div>
      );
  };

  // --- 2. SUPPLY VIEW (Inventory Matrix) ---
  const SupplyView = () => {
      // Mock Data for BCG Matrix (Inventory Health)
      const scatterData = useMemo(() => [
          { x: 120, y: 50, z: 200, name: '滞销积压 (Dead Stock)', fill: '#ef4444' }, // High Stock, Low Sales
          { x: 15, y: 120, z: 500, name: '爆品缺货 (Risk)', fill: '#f59e0b' }, // Low Stock, High Sales
          { x: 30, y: 80, z: 1000, name: '健康周转 (Healthy)', fill: '#10b981' }, // Good Stock, Good Sales
          { x: 60, y: 10, z: 100, name: '长尾商品 (Long Tail)', fill: '#64748b' }, // Med Stock, Low Sales
          // Random points
          { x: 45, y: 60, z: 300, name: 'SKU-A', fill: '#3b82f6' },
          { x: 20, y: 90, z: 400, name: 'SKU-B', fill: '#3b82f6' },
          { x: 100, y: 20, z: 150, name: 'SKU-C', fill: '#ef4444' },
      ], []);

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Visualization (Visual Appeal) */}
              <div className="lg:col-span-1 ios-glass-card p-0 relative overflow-hidden flex flex-col h-[450px]">
                  <div className="p-4 border-b border-white/10 bg-white/5 z-10 relative">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400" /> 全球节点监控
                      </h3>
                  </div>
                  <div className="flex-1 relative bg-[radial-gradient(circle_at_center,#1e293b_0%,#000000_100%)]">
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
                      {/* Mock Nodes */}
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

              {/* Inventory Health Matrix (The Core Feature) */}
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
                              <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg Sales', fontSize: 10, fill: '#64748b' }} />
                              <Scatter name="SKUs" data={scatterData} fill="#8884d8">
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

  // --- 3. ADS VIEW (Enhanced Simulator) ---
  const AdsView = () => {
      const [simCpc, setSimCpc] = useState(1.5);
      const [simCvr, setSimCvr] = useState(2.5);
      const budget = 1000;

      const currentRoas = 2.2;
      const simRoas = (budget / simCpc * (simCvr/100) * 50) / budget; // Mock formula (Revenue / Cost)
      const roasDiff = simRoas - currentRoas;

      const simChartData = [
          { name: 'Current Strategy', roas: currentRoas, profit: 450, fill: '#334155' },
          { name: 'Simulated', roas: simRoas, profit: simRoas * 200, fill: simRoas > currentRoas ? '#10b981' : '#ef4444' }
      ];

      return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Simulator Controls */}
          <div className="ios-glass-card p-6 flex flex-col bg-gradient-to-b from-slate-900 to-black border-indigo-500/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" /> 竞价敏感性分析 (Sensitivity Analysis)
              </h3>
              
              <div className="space-y-8 flex-1">
                  <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                          <span>CPC 点击成本 ($)</span>
                          <span className="text-white font-mono font-bold">${simCpc.toFixed(2)}</span>
                      </div>
                      <input type="range" min="0.5" max="3.0" step="0.1" value={simCpc} onChange={e=>setSimCpc(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>$0.50</span><span>$3.00</span></div>
                  </div>

                  <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                          <span>CVR 转化率 (%)</span>
                          <span className="text-white font-mono font-bold">{simCvr.toFixed(1)}%</span>
                      </div>
                      <input type="range" min="0.5" max="5.0" step="0.1" value={simCvr} onChange={e=>setSimCvr(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>0.5%</span><span>5.0%</span></div>
                  </div>
              </div>

              <div className="mt-8 p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase mb-1">Simulated ROAS</div>
                  <div className="flex items-end gap-3">
                      <span className={`text-4xl font-black font-mono ${simRoas >= 2 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {simRoas.toFixed(2)}
                      </span>
                      <span className={`text-xs mb-1.5 font-bold ${roasDiff > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {roasDiff > 0 ? '+' : ''}{roasDiff.toFixed(2)} vs Current
                      </span>
                  </div>
              </div>
          </div>

          {/* Comparison Chart */}
          <div className="ios-glass-card p-6 flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart4 className="w-4 h-4 text-purple-400" /> 策略对比 (Strategy Comparison)
              </h3>
              <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={simChartData} layout="vertical" margin={{left: 20, right: 30}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                          <XAxis type="number" stroke={COLORS.text} fontSize={10} domain={[0, 'auto']} />
                          <YAxis dataKey="name" type="category" width={100} stroke={COLORS.text} fontSize={10} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomHUDTooltip />} />
                          <Bar dataKey="roas" barSize={30} radius={[0, 4, 4, 0]}>
                              {simChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                  *模拟基于 AOV $50 固定客单价。
              </p>
          </div>
      </div>
      );
  };

  // --- 4. MARKET VIEW (Radar Competitor Analysis) ---
  const MarketView = () => {
      const radarData = [
          { subject: '价格竞争力 (Price)', A: 85, B: 65, fullMark: 100 },
          { subject: '发货速度 (Speed)', A: 90, B: 70, fullMark: 100 },
          { subject: '好评率 (Reviews)', A: 75, B: 95, fullMark: 100 },
          { subject: '社媒声量 (Social)', A: 60, B: 85, fullMark: 100 },
          { subject: '产品创新 (Innovation)', A: 80, B: 50, fullMark: 100 },
          { subject: '复购率 (Retention)', A: 70, B: 75, fullMark: 100 },
      ];

      return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="ios-glass-card p-6 flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-red-400" /> 品牌竞争力雷达 (Competitive Radar)
                  </h3>
              </div>
              
              <div className="flex justify-center gap-6 text-xs mb-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-500/50 rounded-full border border-cyan-400"></div> <span className="text-cyan-400 font-bold">我方品牌 (My Brand)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-500/50 rounded-full border border-pink-400"></div> <span className="text-pink-400 font-bold">竞品 Top 1</span></div>
              </div>

              <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="我方品牌" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                          <Radar name="竞品 Top 1" dataKey="B" stroke="#ec4899" strokeWidth={2} fill="#ec4899" fillOpacity={0.3} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }} />
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="ios-glass-card p-6 flex flex-col h-[500px]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" /> 市场渗透率趋势 (Market Share)
              </h3>
              {/* Mock Area Chart for Market Share */}
              <div className="flex-1 w-full min-h-0 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                      [此处展示 90天 市场份额变化曲线]
                      <br/>
                      (需连接 Google Trends API)
                  </div>
                  {/* Placeholder Visual */}
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{v:30},{v:35},{v:32},{v:40},{v:45},{v:42},{v:50}]} margin={{top:20}}>
                          <defs>
                              <linearGradient id="colorShare" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke="#f59e0b" fill="url(#colorShare)" strokeWidth={2} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                      <div>
                          <h4 className="text-xs font-bold text-yellow-500 mb-1">机会洞察</h4>
                          <p className="text-[10px] text-slate-300 leading-relaxed">
                              竞品在“发货速度”上评分较低 (70分)。建议在下个季度重点宣传“24h极速发货”服务，有望提升 5-8% 的转化率。
                          </p>
                      </div>
                  </div>
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
                        { id: 'ads', label: '广告沙盒', icon: Megaphone },
                        { id: 'market', label: '竞争雷达', icon: Target },
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
            {activeTab === 'ads' && <AdsView />}
            {activeTab === 'market' && <MarketView />}
        </div>
    </div>
  );
};

export default Analytics;
