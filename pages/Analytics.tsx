
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  DollarSign, Activity, Truck, Calculator, RefreshCw, 
  BrainCircuit, Loader2, Sparkles, X, Megaphone,
  Video, Play, Map as MapIcon, Globe,
  Wallet, Search, ArrowRight, Target, ShoppingBag, TrendingUp
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
                            {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, {maximumFractionDigits: 2}) : entry.value}
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
              contents: `Act as a Chief Data Officer. Analyze this context: "${context}". Provide 3 short, bulleted strategic insights in Chinese. Use HTML formatting for bolding key terms.`,
          });
          setAiInsight(response.text);
      } catch (e) {
          setAiInsight("AI 服务暂时不可用 (API Key required).");
      } finally {
          setIsAiThinking(false);
      }
  };

  // --- 1. FINANCE VIEW (Real Data) ---
  const FinanceView = () => {
      // Simulator State
      const [selectedProductId, setSelectedProductId] = useState<string>(state.products[0]?.id || '');
      const [simPrice, setSimPrice] = useState(0);
      
      const selectedProduct = useMemo(() => 
          state.products.find(p => p.id === selectedProductId), 
      [selectedProductId, state.products]);

      // Initialize price when product changes
      useEffect(() => {
          if (selectedProduct) setSimPrice(selectedProduct.price);
      }, [selectedProduct]);

      // Dynamic Calculation for Simulator
      const simData = useMemo(() => {
          if (!selectedProduct) return [];
          const cost = selectedProduct.costPrice || 0; // RMB usually, let's assume converted or displayed as base unit
          const logistics = selectedProduct.logistics?.unitFreightCost || 0;
          const fees = simPrice * ((selectedProduct.economics?.platformFeePercent || 0) / 100);
          const ads = selectedProduct.economics?.adCost || 0;
          const profit = simPrice - (cost/7.2) - logistics - fees - ads; // Simple conversion assumption: Cost is CNY, others USD. 
          // Note: In a real app, strict currency handling is needed. Here we assume Product Cost is CNY and others are USD for the simulator visuals.
          // Let's normalize to USD for the chart.
          const costUSD = cost / 7.2;
          
          return [
              { name: '货值 (COGS)', value: costUSD, fill: '#3b82f6' },
              { name: '物流 (Freight)', value: logistics, fill: '#f59e0b' },
              { name: '平台佣金 (Fees)', value: fees, fill: '#ec4899' },
              { name: '广告 (Ads)', value: ads, fill: '#8b5cf6' },
              { name: '净利润 (Profit)', value: Math.max(0, profit), fill: '#10b981' },
          ];
      }, [selectedProduct, simPrice]);

      const profitMargin = useMemo(() => {
          if (!simData.length || simPrice === 0) return 0;
          const profit = simData.find(d => d.name.includes('利润'))?.value || 0;
          return (profit / simPrice) * 100;
      }, [simData, simPrice]);

      // Real Cash Flow Data
      const cashFlowData = useMemo(() => {
          const agg: Record<string, { income: number, expense: number, date: string }> = {};
          // Sort transactions by date
          const sortedTx = [...state.transactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          sortedTx.forEach(tx => {
              const date = tx.date; // YYYY-MM-DD
              if (!agg[date]) agg[date] = { income: 0, expense: 0, date };
              // Simple currency normalization for chart (assuming 1 USD = 7.2 CNY)
              const amountUSD = tx.currency === 'CNY' ? tx.amount / 7.2 : tx.amount;
              
              if (tx.type === 'income') agg[date].income += amountUSD;
              else agg[date].expense += amountUSD;
          });

          // Convert to cumulative balance array (starting from 0 for the period)
          let currentBalance = 50000; // Mock starting balance
          return Object.values(agg).map(day => {
              currentBalance += (day.income - day.expense);
              return {
                  date: day.date.slice(5), // MM-DD
                  balance: parseFloat(currentBalance.toFixed(2)),
                  income: parseFloat(day.income.toFixed(2)),
                  expense: parseFloat(day.expense.toFixed(2))
              };
          });
      }, [state.transactions]);

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cash Flow Chart */}
              <div className="lg:col-span-2 ios-glass-card p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" /> 
                          实时资金流 (Real-time Cash Flow)
                      </h3>
                      <button 
                        onClick={() => handleAiAnalysis(`Based on the chart data: Ending Balance ${cashFlowData[cashFlowData.length-1]?.balance}, Trend is ${cashFlowData[cashFlowData.length-1]?.balance > cashFlowData[0]?.balance ? 'Positive' : 'Negative'}. Provide financial advice.`)}
                        className="text-[10px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                      >
                          <BrainCircuit className="w-3 h-3" /> 资金诊断
                      </button>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                      {cashFlowData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={cashFlowData}>
                                  <defs>
                                      <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                                  <XAxis dataKey="date" stroke={COLORS.text} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                  <YAxis stroke={COLORS.text} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                  <Tooltip content={<CustomHUDTooltip />} />
                                  <Area type="monotone" dataKey="balance" stroke="#10b981" fill="url(#colorBal)" strokeWidth={2} name="现金余额 ($)" />
                                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={false} name="当日支出 ($)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex items-center justify-center text-slate-500">暂无交易数据</div>
                      )}
                  </div>
              </div>

              {/* Interactive Simulator */}
              <div className="lg:col-span-1 ios-glass-card p-6 flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-purple-400" /> 
                      单品模型模拟器 (Unit Economics)
                  </h3>
                  
                  <div className="mb-4 space-y-4">
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">选择产品 (Select SKU)</label>
                          <select 
                              value={selectedProductId} 
                              onChange={(e) => setSelectedProductId(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500"
                          >
                              {state.products.map(p => (
                                  <option key={p.id} value={p.id}>{p.sku} - {p.name.substring(0, 15)}...</option>
                              ))}
                          </select>
                      </div>
                      <div className="bg-black/40 p-3 rounded-lg border border-white/10">
                          <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-400">模拟售价 (Sale Price)</span>
                              <span className="text-white font-mono font-bold">${simPrice.toFixed(2)}</span>
                          </div>
                          <input 
                              type="range" 
                              min="0" 
                              max="200" 
                              step="0.5" 
                              value={simPrice} 
                              onChange={(e) => setSimPrice(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                      </div>
                  </div>

                  <div className="relative h-48 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={simData}
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={2}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {simData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(val:number) => `$${val.toFixed(2)}`} content={<CustomHUDTooltip />} />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs text-slate-500">利润率</span>
                          <span className={`text-xl font-bold ${profitMargin > 20 ? 'text-emerald-400 text-glow-green' : profitMargin > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                              {profitMargin.toFixed(1)}%
                          </span>
                      </div>
                  </div>
                  
                  <div className="mt-auto space-y-1 text-xs border-t border-white/10 pt-2">
                      {simData.map((d, i) => (
                          <div key={i} className="flex justify-between items-center">
                              <span className="text-slate-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: d.fill}}></div> {d.name}</span>
                              <span className="text-white font-mono">${d.value.toFixed(2)}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
      );
  };

  // --- 2. SUPPLY VIEW (Real Inventory Data) ---
  const SupplyView = () => {
      // Aggregate real stock data by Warehouse Region/ID
      const mapNodes = useMemo(() => {
          const nodes: Record<string, { id: string, name: string, region: string, stockCount: number, stockValue: number, topProducts: any[], lat: number, long: number, color: string, type: string }> = {};
          
          // Helper to init node if missing
          const initNode = (wh: any) => {
              // Mock lat/long based on region for visualization
              let lat = 30, long = 0, color = '#3b82f6';
              if (wh.region === 'CN') { lat = 22; long = 114; color = '#10b981'; } // Shenzhen
              if (wh.region === 'US') { lat = 34; long = -118; color = '#00F0FF'; } // LA
              if (wh.type === '3PL') { lat = 40; long = -74; color = '#BD00FF'; } // NY
              
              if (!nodes[wh.id]) {
                  nodes[wh.id] = {
                      id: wh.id,
                      name: wh.name,
                      region: wh.region,
                      type: wh.type,
                      stockCount: 0,
                      stockValue: 0,
                      topProducts: [],
                      lat, long, color
                  };
              }
          };

          // Initialize with known warehouses
          WAREHOUSES.forEach(initNode);

          // Populate data from Products
          state.products.forEach(p => {
              if (p.inventoryBreakdown) {
                  p.inventoryBreakdown.forEach(inv => {
                      if (nodes[inv.warehouseId]) {
                          nodes[inv.warehouseId].stockCount += inv.quantity;
                          nodes[inv.warehouseId].stockValue += (inv.quantity * (p.costPrice || 0));
                          nodes[inv.warehouseId].topProducts.push({ sku: p.sku, qty: inv.quantity });
                      }
                  });
              } else {
                  // Fallback for simple products without breakdown (assume primary warehouse WH-CN-01)
                  if(nodes['WH-CN-01']) {
                      nodes['WH-CN-01'].stockCount += p.stock;
                      nodes['WH-CN-01'].stockValue += (p.stock * (p.costPrice || 0));
                  }
              }
          });

          // Sort top products for each node
          Object.values(nodes).forEach(n => {
              n.topProducts.sort((a,b) => b.qty - a.qty);
              n.topProducts = n.topProducts.slice(0, 5);
          });

          return Object.values(nodes);
      }, [state.products]);

      // Calculate Restock Suggestions (Real)
      const restockSuggestions = useMemo(() => {
          return state.products
              .filter(p => !p.deletedAt)
              .map(p => {
                  const burnRate = p.dailyBurnRate || 1;
                  const daysLeft = p.stock / burnRate;
                  return { ...p, daysLeft, rec: Math.ceil(burnRate * 45 - p.stock) };
              })
              .filter(p => p.daysLeft < 20) // Alert threshold
              .sort((a,b) => a.daysLeft - b.daysLeft);
      }, [state.products]);

      return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Map Visualization */}
          <div className="lg:col-span-2 ios-glass-card p-0 relative overflow-hidden flex flex-col min-h-[400px]">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-10 relative">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" /> 全球库存分布 (Global Inventory)
                  </h3>
                  <div className="text-[10px] text-slate-400">Click nodes for details</div>
              </div>
              
              <div className="flex-1 relative bg-grid">
                  {/* Map Nodes */}
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-3/4 h-3/4 border border-slate-800/50 rounded-full border-dashed opacity-30 animate-[spin_60s_linear_infinite]"></div>
                      <div className="absolute w-full h-full">
                          {mapNodes.map((node) => (
                              <div 
                                  key={node.id}
                                  onClick={() => setSelectedNode(node)}
                                  className="absolute flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform z-20"
                                  style={{
                                      left: `${(node.long + 180) / 3.6}%`, 
                                      top: `${(90 - node.lat) / 1.8}%`,
                                  }}
                              >
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

          {/* Restock Alerts */}
          <div className="lg:col-span-1 ios-glass-card p-6 flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-400" /> 紧急补货 (Urgent Restock)
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {restockSuggestions.length > 0 ? restockSuggestions.map((item, idx) => (
                      <div key={idx} className="bg-black/20 border border-white/10 p-3 rounded-lg flex justify-between items-center group hover:border-white/20 transition-all hover:bg-black/40">
                          <div>
                              <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.daysLeft < 7 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></span>
                                  <span className="font-bold text-white text-xs font-mono">{item.sku}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate w-32">{item.name}</div>
                          </div>
                          <div className="text-right">
                              <button 
                                onClick={() => {
                                    if(confirm(`为 ${item.sku} 生成 ${Math.max(100, item.rec)} 件的采购建议?`)) {
                                        showToast(`已生成 ${item.sku} 的采购需求`, 'success');
                                    }
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] rounded transition-colors shadow-lg mb-1"
                              >
                                  +{Math.max(100, item.rec)} PO
                              </button>
                              <div className="text-[9px] text-red-400 font-bold">{item.daysLeft.toFixed(1)} 天断货</div>
                          </div>
                      </div>
                  )) : (
                      <div className="text-center text-slate-500 text-xs py-10">库存健康，暂无紧急补货建议</div>
                  )}
              </div>
          </div>
      </div>
      );
  };

  // --- 3. ADS VIEW (Real Ads Data) ---
  const AdsView = () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="lg:col-span-8 ios-glass-card p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-pink-400" /> 广告活动表现 (Campaigns ROI)
              </h3>
              
              {/* Scatter Chart for Ad Performance */}
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                          <XAxis type="number" dataKey="spend" name="Spend" unit="$" stroke={COLORS.text} tick={{fontSize: 10}} label={{ value: 'Spend ($)', position: 'insideBottomRight', offset: 0, fill: COLORS.text, fontSize: 10 }} />
                          <YAxis type="number" dataKey="roas" name="ROAS" unit="x" stroke={COLORS.text} tick={{fontSize: 10}} label={{ value: 'ROAS', angle: -90, position: 'insideLeft', fill: COLORS.text, fontSize: 10 }} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomHUDTooltip />} />
                          <Scatter name="Campaigns" data={state.adCampaigns} fill="#8884d8">
                              {state.adCampaigns.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.roas > 3 ? '#10b981' : entry.roas < 2 ? '#ef4444' : '#f59e0b'} />
                              ))}
                          </Scatter>
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {state.adCampaigns.slice(0,4).map(c => (
                      <div key={c.id} className="bg-black/20 p-3 rounded-lg border border-white/5 text-xs">
                          <div className="text-slate-400 truncate mb-1">{c.name}</div>
                          <div className="flex justify-between font-bold">
                              <span className="text-white">${c.spend}</span>
                              <span className={c.roas > 3 ? 'text-emerald-400' : 'text-orange-400'}>{c.roas} ROAS</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="lg:col-span-4 ios-glass-card p-6 flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-400" /> 热门素材 (Top Creatives)
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {/* Mock Creatives for Visuals - in real app, link to media library */}
                  {[
                      { id: 1, name: 'Hook_Video_v3.mp4', ctr: 2.8, roas: 4.2, thumb: 'bg-indigo-500/20' },
                      { id: 2, name: 'Unboxing_ASMR.mp4', ctr: 1.9, roas: 3.1, thumb: 'bg-pink-500/20' },
                      { id: 3, name: 'Feature_Showcase.png', ctr: 1.2, roas: 2.5, thumb: 'bg-emerald-500/20' }
                  ].map(creative => (
                      <div 
                        key={creative.id}
                        onClick={() => setSelectedCreative({...creative, sales: Math.floor(Math.random()*500), score: 8.5})}
                        className="flex gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                          <div className={`w-16 h-16 rounded-lg ${creative.thumb} flex items-center justify-center shrink-0 border border-white/10`}>
                              <Play className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white truncate">{creative.name}</div>
                              <div className="flex gap-3 mt-1.5">
                                  <div>
                                      <div className="text-[9px] text-slate-500 uppercase">CTR</div>
                                      <div className="text-xs font-mono text-blue-400">{creative.ctr}%</div>
                                  </div>
                                  <div>
                                      <div className="text-[9px] text-slate-500 uppercase">ROAS</div>
                                      <div className="text-xs font-mono text-emerald-400">{creative.roas}</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  // --- 4. MARKET VIEW (Mocked but enabled) ---
  const MarketView = () => (
      <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="ios-glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-red-400" /> 市场趋势情报 (Market Intel)
                  </h3>
                  <div className="flex gap-2">
                      <input type="text" placeholder="输入关键词 (如: Mechanical Keyboard)" className="bg-black/40 border border-white/10 rounded px-3 py-1 text-xs text-white w-64 focus:border-red-500 outline-none" />
                      <button className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-600 hover:text-white transition-all">分析</button>
                  </div>
              </div>
              
              <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/20 text-slate-500 text-sm">
                  <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>输入关键词以获取 AI 市场趋势分析 (Mock)</p>
                  </div>
              </div>
          </div>
      </div>
  );

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

        {/* AI Insight Bar */}
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
