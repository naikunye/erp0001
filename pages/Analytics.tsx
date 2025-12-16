import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  ComposedChart, ReferenceLine, Legend
} from 'recharts';
import { 
  DollarSign, Activity, Truck, Calculator, RefreshCw, 
  BrainCircuit, Loader2, Sparkles, X, Megaphone,
  Video, Play, Map as MapIcon, Globe,
  Wallet, Search, ArrowRight, Target, ShoppingBag, TrendingUp,
  Filter, Calendar, Layers, BarChart4, PieChart as PieIcon,
  MousePointerClick, Zap, Cpu, Sliders, Trophy
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';
import { WAREHOUSES } from '../constants';

// --- VISUAL CONSTANTS ---
const COLORS = {
  primary: '#00F0FF', // Cyan
  secondary: '#BD00FF', // Purple
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
            <div className="bg-black/90 border border-cyan-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.2)] backdrop-blur-md z-50">
                <p className="text-[10px] text-cyan-400 font-bold font-mono mb-1 border-b border-cyan-500/20 pb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs font-mono">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }}></div>
                        <span className="text-slate-300">{entry.name}:</span>
                        <span className="text-white font-bold">
                            {typeof entry.value === 'number' ? 
                                (entry.name.includes('%') ? `${entry.value.toFixed(2)}%` : entry.value.toLocaleString(undefined, {maximumFractionDigits: 2})) 
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Modals ---

const WarehouseDetailModal = ({ node, onClose }: { node: any, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80" onClick={onClose}>
        <div className="ios-glass-panel w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{backgroundColor: node.color, color: node.color}}></div>
                    <h3 className="font-bold text-white tracking-widest">{node.name}</h3>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-slate-400 border border-white/10">{node.region}</span>
                </div>
                <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-white"/></button>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">总库存量 (Qty)</div>
                        <div className="text-2xl font-bold text-white font-mono text-glow">{node.stockCount.toLocaleString()} pcs</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">库存货值 (Value)</div>
                        <div className="text-2xl font-bold text-emerald-400 font-mono text-glow">¥{node.stockValue.toLocaleString()}</div>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">主要 SKU 分布</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {node.topProducts.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                                <span className="text-slate-300">{p.sku}</span>
                                <span className="text-white font-mono">{p.qty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CreativeDetailModal = ({ creative, onClose }: { creative: any, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80" onClick={onClose}>
        <div className="ios-glass-panel w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl overflow-hidden flex animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-1/3 bg-black flex items-center justify-center relative border-r border-white/10">
                <div className={`w-full aspect-[9/16] bg-gradient-to-b from-slate-800 to-black flex items-center justify-center opacity-80`}>
                    <Play className="w-12 h-12 text-white/80" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                    <span className="text-xs font-mono text-slate-500">{creative.name}</span>
                </div>
            </div>
            <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">素材深度分析</h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">Platform: {creative.platform} • Status: {creative.status}</p>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6 text-slate-500 hover:text-white"/></button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="text-xs text-slate-500 uppercase">ROAS</div>
                        <div className="text-2xl font-bold text-emerald-400 text-glow-green">{creative.roas}</div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="text-xs text-slate-500 uppercase">CTR 点击率</div>
                        <div className="text-2xl font-bold text-blue-400 text-glow">{creative.ctr}%</div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="text-xs text-slate-500 uppercase">转化数 (Sales)</div>
                        <div className="text-2xl font-bold text-purple-400 text-glow-purple">{creative.sales}</div>
                    </div>
                </div>

                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-500" /> 
                        趋势分析 (Trend)
                    </h4>
                    <div className="h-48 w-full bg-black/20 rounded-xl border border-white/10 p-2 flex items-center justify-center text-slate-500 text-xs">
                        [此处展示该素材过去30天的点击与转化趋势图表]
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Analytics: React.FC = () => {
  const { state, showToast, dispatch } = useTanxing();
  const [activeTab, setActiveTab] = useState<'finance' | 'supply' | 'ads' | 'market'>('finance');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedCreative, setSelectedCreative] = useState<any>(null);

  const handleAiAnalysis = async (context: string) => {
      setIsAiThinking(true);
      setAiInsight(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Act as a Chief Data Officer for a Cross-border E-commerce company. Analyze this context: "${context}". Provide 3 short, bulleted strategic insights in Chinese. Use HTML formatting for bolding key terms.`,
          });
          setAiInsight(response.text);
      } catch (e) {
          setAiInsight("AI 服务暂时不可用 (API Key required).");
      } finally {
          setIsAiThinking(false);
      }
  };

  // --- 1. FINANCE VIEW (Advanced P&L) ---
  const FinanceView = () => {
      // Mock P&L Trend Data
      const plData = useMemo(() => {
          const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
          return Array.from({ length: days }, (_, i) => {
              const revenue = Math.floor(Math.random() * 5000) + 2000;
              const cogs = revenue * 0.35;
              const ads = revenue * 0.25;
              const fees = revenue * 0.15;
              const net = revenue - cogs - ads - fees;
              return {
                  date: `Day ${i + 1}`,
                  Revenue: revenue,
                  COGS: cogs,
                  Ads: ads,
                  Fees: fees,
                  NetProfit: net,
                  Margin: parseFloat(((net / revenue) * 100).toFixed(1))
              };
          });
      }, [timeRange]);

      // Cost Composition breakdown
      const costComposition = useMemo(() => {
          const totalRev = plData.reduce((a, b) => a + b.Revenue, 0);
          const totalCogs = plData.reduce((a, b) => a + b.COGS, 0);
          const totalAds = plData.reduce((a, b) => a + b.Ads, 0);
          const totalFees = plData.reduce((a, b) => a + b.Fees, 0);
          const totalNet = plData.reduce((a, b) => a + b.NetProfit, 0);
          return [
              { name: '采购成本', value: totalCogs, color: '#3b82f6' },
              { name: '广告营销', value: totalAds, color: '#ec4899' },
              { name: '平台/物流', value: totalFees, color: '#f59e0b' },
              { name: '净利润', value: totalNet, color: '#10b981' },
          ];
      }, [plData]);

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main P&L Chart */}
              <div className="lg:col-span-2 ios-glass-card p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" /> 
                          全渠道盈亏趋势 (Profit & Loss Trend)
                      </h3>
                      <button 
                        onClick={() => handleAiAnalysis(`Revenue trend is fluctuating. Avg Margin is around 25%. Ad spend is 25% of revenue.`)}
                        className="text-[10px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                      >
                          <BrainCircuit className="w-3 h-3" /> 财务诊断
                      </button>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={plData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                              <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                              <XAxis dataKey="date" stroke={COLORS.text} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                              <YAxis yAxisId="left" stroke={COLORS.text} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                              <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{fontSize: 10}} axisLine={false} tickLine={false} unit="%" />
                              <Tooltip content={<CustomHUDTooltip />} />
                              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                              <Area yAxisId="left" type="monotone" dataKey="Revenue" stroke="#3b82f6" fill="url(#colorRev)" strokeWidth={2} name="总营收" />
                              <Bar yAxisId="left" dataKey="NetProfit" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} name="净利润" />
                              <Line yAxisId="right" type="monotone" dataKey="Margin" stroke="#f59e0b" strokeWidth={2} dot={false} name="利润率%" />
                          </ComposedChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Cost Breakdown */}
              <div className="lg:col-span-1 ios-glass-card p-6 flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-purple-400" /> 
                      成本结构拆解 (Cost Structure)
                  </h3>
                  <div className="relative h-56 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={costComposition}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {costComposition.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} contentStyle={{backgroundColor:'#000', borderColor:'#333'}} />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs text-slate-500">总毛利</span>
                          <span className="text-xl font-bold text-white">
                              ${(plData.reduce((a, b) => a + b.NetProfit, 0)).toLocaleString(undefined, {maximumFractionDigits:0})}
                          </span>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {costComposition.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                                  <span className="text-slate-300">{item.name}</span>
                              </div>
                              <div className="text-white font-mono font-bold">${item.value.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
      );
  };

  // --- 2. SUPPLY VIEW (Inventory Health) ---
  const SupplyView = () => {
      const mapNodes = useMemo(() => {
          // ... (Existing Logic for Map Nodes - kept same for visual) ...
          const nodes: any = {};
          const initNode = (wh: any) => {
              let lat = 30, long = 0, color = '#3b82f6';
              if (wh.region === 'CN') { lat = 22; long = 114; color = '#10b981'; } 
              if (wh.region === 'US') { lat = 34; long = -118; color = '#00F0FF'; } 
              if (wh.type === '3PL') { lat = 40; long = -74; color = '#BD00FF'; } 
              
              if (!nodes[wh.id]) {
                  nodes[wh.id] = { id: wh.id, name: wh.name, region: wh.region, type: wh.type, stockCount: 0, stockValue: 0, topProducts: [], lat, long, color };
              }
          };
          WAREHOUSES.forEach(initNode);
          state.products.forEach(p => {
              if (p.inventoryBreakdown) {
                  p.inventoryBreakdown.forEach(inv => {
                      if (nodes[inv.warehouseId]) {
                          nodes[inv.warehouseId].stockCount += inv.quantity;
                          nodes[inv.warehouseId].stockValue += (inv.quantity * (p.costPrice || 0));
                          nodes[inv.warehouseId].topProducts.push({ sku: p.sku, qty: inv.quantity });
                      }
                  });
              }
          });
          return Object.values(nodes);
      }, [state.products]);

      // NEW: Inventory Aging Data (Mocked based on product status)
      const agingData = useMemo(() => {
          return [
              { range: '0-30 Days', qty: 1200, value: 45000 },
              { range: '31-60 Days', qty: 800, value: 32000 },
              { range: '61-90 Days', qty: 300, value: 12000 },
              { range: '90+ Days', qty: 150, value: 4500 }, // Dead stock
          ];
      }, []);

      // NEW: Unit Cost Breakdown Data (Mocked for popular SKUs)
      const costBreakdownData = useMemo(() => {
          return [
              { name: 'MA-001 卫衣', production: 6.5, logistics: 2.5, marketing: 2.0, platform: 1.5, profit: 4.49 }, // Total ~16.99
              { name: 'CP-Q1M 车盒', production: 18.0, logistics: 1.2, marketing: 5.0, platform: 3.0, profit: 12.4 },
              { name: 'AI BOX2', production: 32.0, logistics: 0.8, marketing: 8.0, platform: 4.0, profit: 23.76 },
              { name: 'K7500 键盘', production: 22.0, logistics: 2.0, marketing: 3.0, platform: 2.5, profit: 12.72 },
              { name: 'MG-PRO-01', production: 2.5, logistics: 0.5, marketing: 1.5, platform: 2.0, profit: 6.0 },
          ];
      }, []);

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Visualization */}
              <div className="lg:col-span-2 ios-glass-card p-0 relative overflow-hidden flex flex-col min-h-[400px]">
                  <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-10 relative">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400" /> 全球库存分布 (Global Inventory)
                      </h3>
                      <div className="text-[10px] text-slate-400">Click nodes for details</div>
                  </div>
                  <div className="flex-1 relative bg-grid">
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative w-3/4 h-3/4 border border-slate-800/50 rounded-full border-dashed opacity-30 animate-[spin_60s_linear_infinite]"></div>
                          <div className="absolute w-full h-full">
                              {mapNodes.map((node: any) => (
                                  <div key={node.id} onClick={() => setSelectedNode(node)} className="absolute flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform z-20" style={{ left: `${(node.long + 180) / 3.6}%`, top: `${(90 - node.lat) / 1.8}%`, }}>
                                      <div className="relative">
                                          <div className="w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] border-2 border-white" style={{backgroundColor: node.color, color: node.color}}></div>
                                          <div className="absolute -inset-4 rounded-full border opacity-50 animate-ping" style={{borderColor: node.color}}></div>
                                      </div>
                                      <div className="mt-2 bg-black/80 backdrop-blur-md border border-slate-700 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap shadow-lg">
                                          {node.name}
                                          <div className="text-[9px] text-slate-400">{node.stockCount} pcs</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Inventory Health & Aging */}
              <div className="lg:col-span-1 ios-glass-card p-6 flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-400" /> 库存库龄分析 (Aging)
                  </h3>
                  <div className="flex-1 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={agingData} layout="vertical" margin={{left: 10, right: 30}}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                              <XAxis type="number" stroke={COLORS.text} fontSize={10} hide />
                              <YAxis dataKey="range" type="category" width={70} stroke={COLORS.text} fontSize={10} />
                              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomHUDTooltip />} />
                              <Bar dataKey="qty" barSize={20} radius={[0, 4, 4, 0]}>
                                  {agingData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 3 ? '#ef4444' : index === 2 ? '#f59e0b' : '#3b82f6'} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-red-400 font-bold flex items-center gap-1"><Truck className="w-3 h-3"/> 滞销预警</span>
                          <span className="text-xs text-white font-mono">150 pcs</span>
                      </div>
                      <p className="text-[10px] text-slate-400">90天以上未动销库存占比 5.2%，建议开启清仓促销。</p>
                  </div>
              </div>
          </div>

          {/* NEW: Product Unit Cost Breakdown */}
          <div className="ios-glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-purple-400" /> 单品成本构成拆解 (Unit Cost Breakdown)
                  </h3>
                  <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500"></div> 采购成本</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-cyan-400"></div> 头程运费</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-pink-500"></div> 广告营销</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-500"></div> 平台佣金</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> 净利润</div>
                  </div>
              </div>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costBreakdownData} margin={{top: 20, right: 30, left: 0, bottom: 0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                          <XAxis dataKey="name" stroke={COLORS.text} fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis stroke={COLORS.text} fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip content={<CustomHUDTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                          <Bar dataKey="production" stackId="a" fill="#3b82f6" barSize={40} name="采购成本" />
                          <Bar dataKey="logistics" stackId="a" fill="#22d3ee" barSize={40} name="头程运费" />
                          <Bar dataKey="marketing" stackId="a" fill="#ec4899" barSize={40} name="广告营销" />
                          <Bar dataKey="platform" stackId="a" fill="#f97316" barSize={40} name="平台佣金" />
                          <Bar dataKey="profit" stackId="a" fill="#10b981" barSize={40} radius={[4, 4, 0, 0]} name="净利润" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
      );
  };

  // --- 3. ADS VIEW (Enhanced with Simulation & Attribution) ---
  const AdsView = () => {
      // 1. GMV Attribution Data
      const gmvData = useMemo(() => {
          return Array.from({length: 14}, (_, i) => ({
              date: `Day ${i+1}`,
              organic: Math.floor(Math.random() * 2000) + 1000,
              paid: Math.floor(Math.random() * 4000) + 2000,
              affiliate: Math.floor(Math.random() * 1500) + 500
          }));
      }, []);

      // 2. Simulator State
      const [simState, setSimState] = useState({ budget: 500, cpc: 1.5, cvr: 2.5, aov: 45 });
      const simResults = useMemo(() => {
          const clicks = simState.budget / simState.cpc;
          const conversions = clicks * (simState.cvr / 100);
          const revenue = conversions * simState.aov;
          const roas = simState.budget > 0 ? revenue / simState.budget : 0;
          const profit = revenue - simState.budget - (conversions * 15); // Mock COGS of $15
          return { clicks, conversions, revenue, roas, profit };
      }, [simState]);

      // 3. AI Copilot
      const [adQuery, setAdQuery] = useState('');
      const [aiResponse, setAiResponse] = useState<string | null>(null);
      const [isAnalyzingAds, setIsAnalyzingAds] = useState(false);

      const handleAdCopilot = async () => {
          if (!adQuery) return;
          setIsAnalyzingAds(true);
          try {
              if (!process.env.API_KEY) throw new Error("API Key missing");
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const prompt = `
                  Act as a TikTok Ads Expert. 
                  Current Simulation: Budget $${simState.budget}, CPC $${simState.cpc}, CVR ${simState.cvr}%, AOV $${simState.aov}.
                  Projected ROAS: ${simResults.roas.toFixed(2)}.
                  
                  User Question: "${adQuery}"
                  
                  Provide a concise, strategic answer in Chinese (max 100 words).
              `;
              const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
              setAiResponse(response.text);
          } catch (e) {
              setAiResponse("AI 连接失败");
          } finally {
              setIsAnalyzingAds(false);
          }
      };

      // Mock Funnel Data (Existing)
      const funnelData = [
          { stage: 'Impressions', value: 450000, color: '#3b82f6' },
          { stage: 'Clicks', value: 12500, color: '#8b5cf6' },
          { stage: 'Add to Cart', value: 3200, color: '#ec4899' },
          { stage: 'Initiate Checkout', value: 1800, color: '#f59e0b' },
          { stage: 'Purchase', value: 850, color: '#10b981' }
      ];

      return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Left Column: Visualizations */}
          <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* GMV Attribution Chart */}
              <div className="ios-glass-card p-6 h-80">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" /> GMV 渠道归因 (Attribution)
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={gmvData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                          <defs>
                              <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient>
                              <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                              <linearGradient id="colorAff" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                          <XAxis dataKey="date" stroke={COLORS.text} fontSize={10} tickFormatter={(v) => v.replace('Day ','D')} />
                          <YAxis stroke={COLORS.text} fontSize={10} />
                          <Tooltip content={<CustomHUDTooltip />} />
                          <Legend wrapperStyle={{fontSize: '10px'}} iconType="circle" />
                          <Area type="monotone" dataKey="paid" stackId="1" stroke="#ec4899" fill="url(#colorPaid)" name="Paid Ads (TikTok)" />
                          <Area type="monotone" dataKey="affiliate" stackId="1" stroke="#f59e0b" fill="url(#colorAff)" name="Affiliate (达人)" />
                          <Area type="monotone" dataKey="organic" stackId="1" stroke="#3b82f6" fill="url(#colorOrg)" name="Organic (自然流)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>

              {/* Funnel */}
              <div className="ios-glass-card p-6 h-64 flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-pink-400" /> 转化漏斗 (Conversion Funnel)
                  </h3>
                  <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="stage" type="category" width={100} stroke={COLORS.text} fontSize={10} />
                              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomHUDTooltip />} />
                              <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                  {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          {/* Right Column: Tools */}
          <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Bidding Sandbox */}
              <div className="ios-glass-card p-6 bg-gradient-to-b from-slate-900 to-black border-indigo-500/20">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-400" /> TikTok 竞价策略沙盒
                  </h3>
                  
                  {/* Controls */}
                  <div className="space-y-5 mb-6">
                      <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>日预算 (Daily Budget)</span>
                              <span className="text-white font-mono">${simState.budget}</span>
                          </div>
                          <input type="range" min="50" max="5000" step="50" value={simState.budget} onChange={e=>setSimState({...simState, budget: +e.target.value})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                      <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>目标点击成本 (CPC Bid)</span>
                              <span className="text-white font-mono">${simState.cpc.toFixed(2)}</span>
                          </div>
                          <input type="range" min="0.1" max="5.0" step="0.1" value={simState.cpc} onChange={e=>setSimState({...simState, cpc: +e.target.value})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>预估 CVR (%)</span><span className="text-white font-mono">{simState.cvr}%</span></div>
                              <input type="range" min="0.1" max="10" step="0.1" value={simState.cvr} onChange={e=>setSimState({...simState, cvr: +e.target.value})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                          </div>
                          <div>
                              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>客单价 AOV ($)</span><span className="text-white font-mono">${simState.aov}</span></div>
                              <input type="range" min="10" max="200" step="5" value={simState.aov} onChange={e=>setSimState({...simState, aov: +e.target.value})} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                          </div>
                      </div>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
                          <div className="text-[10px] text-slate-500 uppercase">Est. Revenue</div>
                          <div className="text-lg font-bold text-white font-mono">${simResults.revenue.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
                          <div className="text-[10px] text-slate-500 uppercase">Est. Profit</div>
                          <div className={`text-lg font-bold font-mono ${simResults.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${simResults.profit.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                      </div>
                      <div className="bg-indigo-600/20 p-3 rounded-lg border border-indigo-500/30 text-center col-span-2">
                          <div className="text-[10px] text-indigo-300 uppercase">Projected ROAS</div>
                          <div className="text-2xl font-bold text-indigo-400 font-mono tracking-tight">{simResults.roas.toFixed(2)}</div>
                      </div>
                  </div>
              </div>

              {/* AI Copilot */}
              <div className="flex-1 ios-glass-card p-6 flex flex-col bg-gradient-to-br from-indigo-900/10 to-purple-900/10">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-purple-400" /> AI 投放顾问 (Ad Copilot)
                  </h3>
                  
                  <div className="flex-1 bg-black/40 rounded-lg p-3 mb-3 overflow-y-auto text-xs text-slate-300 border border-white/5 font-mono leading-relaxed relative">
                      {aiInsight ? (
                          <div dangerouslySetInnerHTML={{ __html: aiInsight }} className="animate-in fade-in"></div>
                      ) : (
                          <div className="text-slate-600 italic flex items-center justify-center h-full gap-2">
                              <Sparkles className="w-4 h-4" /> 
                              请输入问题，获取优化建议...
                          </div>
                      )}
                      {isAnalyzingAds && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-purple-500"/></div>}
                  </div>

                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          value={adQuery}
                          onChange={e => setAdQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAdCopilot()}
                          placeholder="例如：如何将 ROAS 提升到 3.0？"
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                      />
                      <button onClick={handleAdCopilot} disabled={isAnalyzingAds} className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50">
                          <MousePointerClick className="w-4 h-4" />
                      </button>
                  </div>
              </div>

          </div>
      </div>
      );
  };

  // --- 4. MARKET VIEW (Keyword Trends) ---
  const MarketView = () => {
      // Mock Keyword Trend Data
      const trendData = [
          { name: 'Week 1', kw1: 4000, kw2: 2400, kw3: 2400 },
          { name: 'Week 2', kw1: 3000, kw2: 1398, kw3: 2210 },
          { name: 'Week 3', kw1: 2000, kw2: 9800, kw3: 2290 },
          { name: 'Week 4', kw1: 2780, kw2: 3908, kw3: 2000 },
          { name: 'Week 5', kw1: 1890, kw2: 4800, kw3: 2181 },
          { name: 'Week 6', kw1: 2390, kw2: 3800, kw3: 2500 },
          { name: 'Week 7', kw1: 3490, kw2: 4300, kw3: 2100 },
      ];

      return (
      <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="ios-glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-red-400" /> 关键词搜索趋势 (Keyword Volume)
                  </h3>
                  <div className="flex gap-2">
                      <input type="text" placeholder="输入关键词 (如: Mechanical Keyboard)" className="bg-black/40 border border-white/10 rounded px-3 py-1 text-xs text-white w-64 focus:border-red-500 outline-none" />
                      <button className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-600 hover:text-white transition-all">分析</button>
                  </div>
              </div>
              
              <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                          <XAxis dataKey="name" stroke={COLORS.text} fontSize={10} />
                          <YAxis stroke={COLORS.text} fontSize={10} />
                          <Tooltip content={<CustomHUDTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="kw1" name="Mechanical Keyboard" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="kw2" name="Gaming Mouse" stroke="#f59e0b" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="kw3" name="Desk Mat" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
      );
  };

  const handleAdCopilot = async () => {
        // Need to define handlers inside component scope to access state
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
        
        {/* Modals */}
        {selectedNode && createPortal(<WarehouseDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />, document.body)}
        {selectedCreative && createPortal(<CreativeDetailModal creative={selectedCreative} onClose={() => setSelectedCreative(null)} />, document.body)}

        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
            <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3 text-glow-cyan">
                    <span className="w-2 h-8 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></span>
                    数据指挥中心
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-purple-500" />
                    智能情报中心 • 实时数据
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
                        { id: 'finance', label: '深度财务', icon: Wallet },
                        { id: 'supply', label: '供应链智脑', icon: Truck },
                        { id: 'ads', label: '广告智脑', icon: Megaphone },
                        { id: 'market', label: '市场情报', icon: Target },
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
        {aiInsight && activeTab !== 'ads' && (
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