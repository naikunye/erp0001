
import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Box, Wallet, BarChart4, ArrowUpRight, Loader2, TrendingUp, Sparkles, Command, Zap, Layers, ArrowRight, Package, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Line, Area } from 'recharts';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const { state } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data loading
  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 500); // Faster load
      return () => clearTimeout(timer);
  }, []);

  // --- 1. Real Data Calculations ---

  // Filter out deleted items to match Inventory/Order pages
  const activeProducts = useMemo(() => state.products.filter(p => !p.deletedAt), [state.products]);
  const activeOrders = useMemo(() => state.orders.filter(o => !o.deletedAt && o.status !== 'cancelled'), [state.orders]);

  // Financial & Inventory Metrics
  const metrics = useMemo(() => {
      
      // 1. Inventory Stock Value (Linked to Replenishment Center)
      // Strictly matches Inventory Page: Sum of (Stock * CostPrice) for active products
      const stockValue = activeProducts.reduce((acc, p) => {
          return acc + (p.stock * (p.costPrice || 0));
      }, 0);
      
      // 2. Estimated Net Profit (Based on Sales - Real Costs)
      const totalRevenue = activeOrders.reduce((acc, o) => acc + o.total, 0);
      let totalCost = 0;
      
      activeOrders.forEach(o => {
          if (o.lineItems && o.lineItems.length > 0) {
              o.lineItems.forEach(item => {
                  const product = state.products.find(p => p.id === item.productId);
                  if (product) {
                      // Cost in CNY converted to USD approx / 7.2 + logistics
                      const unitCostUSD = ((product.costPrice || 0) / 7.2) + (product.logistics?.unitFreightCost || 0); 
                      totalCost += unitCostUSD * item.quantity;
                  }
              });
          } else {
              // Fallback
              totalCost += o.total * 0.6; 
          }
      });
      
      const netProfit = totalRevenue - totalCost;
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

      // 3. Logistics Weight (Inventory total weight)
      const logisticsWeight = activeProducts.reduce((acc, p) => acc + (p.stock * (p.unitWeight || 0)), 0);

      // 4. Top Product by Sales Volume (Quantity)
      const productVolume: Record<string, number> = {};
      activeOrders.forEach(o => {
          o.lineItems?.forEach(item => {
              productVolume[item.sku] = (productVolume[item.sku] || 0) + item.quantity;
          });
      });
      // Sort by volume descending
      const topProductSku = Object.keys(productVolume).sort((a, b) => productVolume[b] - productVolume[a])[0];
      const topProductVol = topProductSku ? productVolume[topProductSku] : 0;
      
      return {
          stockValue: stockValue, // Actual inventory value in CNY
          netProfit: netProfit,
          roi: roi.toFixed(1),
          logisticsWeight: logisticsWeight.toFixed(1),
          topProduct: topProductSku || 'N/A',
          topProductVol: topProductVol
      };
  }, [activeOrders, activeProducts, state.products]);

  // Top Products Chart Data (Profit based)
  // Also enrich with Stock info for the list view
  const profitData = useMemo(() => {
      const profitMap: Record<string, { profit: number, revenue: number, stock: number, daysRemaining: number }> = {};
      
      // Calculate Profit per SKU based on orders
      activeOrders.forEach(o => {
          o.lineItems?.forEach(item => {
              const product = state.products.find(p => p.id === item.productId);
              let itemProfit = 0;
              let itemRevenue = item.price * item.quantity;
              
              if (product) {
                  const unitCostUSD = ((product.costPrice || 0) / 7.2) + (product.logistics?.unitFreightCost || 0);
                  itemProfit = (item.price - unitCostUSD) * item.quantity;
              } else {
                  itemProfit = itemRevenue * 0.3; // Fallback
              }

              const key = product ? product.name : item.sku;
              
              if (!profitMap[key]) {
                  profitMap[key] = { 
                      profit: 0, 
                      revenue: 0, 
                      stock: product ? product.stock : 0,
                      daysRemaining: product && product.dailyBurnRate ? Math.floor(product.stock / product.dailyBurnRate) : 999 
                  };
              }
              
              profitMap[key].profit += itemProfit;
              profitMap[key].revenue += itemRevenue;
          });
      });

      return Object.entries(profitMap)
          .map(([name, data]) => ({ name, value: data.profit, ...data }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
  }, [activeOrders, state.products]);

  // Logistics Cost Structure Data (Sea vs Air based on Active Products)
  const costData = useMemo(() => {
      let seaCost = 0;
      let airCost = 0;
      activeProducts.forEach(p => {
          const method = p.logistics?.method || 'Sea';
          // Estimated logistics value held in stock
          const value = p.stock * (p.logistics?.unitFreightCost || 0); 
          if (method === 'Sea') seaCost += value;
          else airCost += value;
      });
      
      // Avoid empty chart
      if (seaCost === 0 && airCost === 0) return [{ name: '无数据', value: 1 }];

      return [
          { name: '海运 (Sea)', value: parseFloat(seaCost.toFixed(2)) },
          { name: '空运 (Air)', value: parseFloat(airCost.toFixed(2)) },
      ];
  }, [activeProducts]);

  // Forecast Chart Data (Revenue over time)
  // LINKED TO INVENTORY: Future projection is based on active products' Daily Burn Rate
  const forecastChartData = useMemo(() => {
      // 1. Historical Data (Real Orders)
      const revenueByDate: Record<string, number> = {};
      
      // Initialize last 7 days with 0
      const today = new Date();
      for(let i=6; i>=0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          revenueByDate[dateStr] = 0;
      }

      activeOrders.forEach(o => {
          const date = o.date; 
          if (revenueByDate[date] !== undefined) {
              revenueByDate[date] += o.total;
          }
      });

      const history = Object.keys(revenueByDate).sort().map(date => ({
          name: date.slice(5), // MM-DD
          fullDate: date,
          actual: revenueByDate[date],
          forecast: null as number | null
      }));

      // 2. Future Projection (Based on Inventory Settings)
      // Calculate Total Daily Potential Revenue = Sum(BurnRate * Price)
      const dailyPotentialRevenue = activeProducts.reduce((acc, p) => {
          return acc + ((p.dailyBurnRate || 0) * p.price);
      }, 0);

      // If no burn rate set, use average of last 3 days actuals
      const last3DaysAvg = history.slice(-3).reduce((acc, h) => acc + (h.actual || 0), 0) / 3;
      const baseline = dailyPotentialRevenue > 0 ? dailyPotentialRevenue : (last3DaysAvg || 1000);

      const nextDays = [];
      for (let i = 1; i <= 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          // Add slight randomization to simulate reality vs perfect projection
          const noise = 1 + (Math.random() * 0.1 - 0.05); 
          
          nextDays.push({
              name: d.toISOString().split('T')[0].slice(5),
              actual: null,
              forecast: parseFloat((baseline * noise).toFixed(2))
          });
      }

      return [...history, ...nextDays];
  }, [activeOrders, activeProducts]);


  // --- 2. AI Implementation ---

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = `
            Role: Chief Operating Officer (COO) for an E-commerce brand.
            
            Real-time Metrics:
            - Stock Assets: ¥${metrics.stockValue.toLocaleString()}
            - Est. Net Profit: $${metrics.netProfit.toFixed(2)}
            - ROI: ${metrics.roi}%
            - Best Selling SKU: ${metrics.topProduct}
            
            Task: Provide a strategic executive summary (in Chinese).
            1. Analyze the health of the profit margin.
            2. Give a specific suggestion for inventory management based on the stock value.
            
            Format: HTML string using <b> for highlights. Keep it professional and under 60 words.
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
          });

          setReport(response.text);
      } catch (e) {
          setReport(`<b>系统离线:</b> 无法连接至 AI 神经中枢。请检查 API 密钥配置。`);
      } finally {
          setIsGenerating(false);
      }
  };

  // HUD Style Custom Tooltip
  const CustomHUDTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          
          return (
              <div className="bg-black/90 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50 min-w-[150px]">
                  <p className="text-xs text-slate-400 font-bold font-mono mb-2 border-b border-white/10 pb-2 uppercase tracking-wider">{label || data.name}</p>
                  {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-4 text-xs font-mono mb-1">
                          <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: entry.stroke || entry.fill, color: entry.stroke || entry.fill }}></div>
                              <span className="text-slate-300 font-semibold">{entry.name}</span>
                          </div>
                          <span className="text-white font-bold text-sm tabular-nums">
                              {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, {maximumFractionDigits: 0}) : entry.value}
                          </span>
                      </div>
                  ))}
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* AI Command Bar */}
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
                            正在同步 {activeProducts.length} 个活跃 SKU 与 {activeOrders.length} 条有效订单数据...
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-1">
            <StatCard loading={isLoading} title="库存资金占用 (Stock Asset)" value={`¥${metrics.stockValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend="Linked to Inv." trendUp={true} icon={Wallet} accentColor="blue" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-2">
            <StatCard loading={isLoading} title="预估净利 (Est. Net)" value={`$${metrics.netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.roi}% ROI`} trendUp={parseFloat(metrics.roi) > 0} icon={TrendingUp} accentColor="green" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-3">
            <StatCard loading={isLoading} title="爆品 SKU (Top Volume)" value={metrics.topProduct} subValue={`${metrics.topProductVol} Sold`} trend="Hot" trendUp={true} icon={BarChart4} accentColor="purple" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-4">
            <StatCard loading={isLoading} title="物流总重 (Weight)" value={metrics.logisticsWeight} subValue="kg" trend="Stable" trendUp={true} icon={Box} accentColor="orange" />
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
                        营收趋势 (Revenue Trend)
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-mono pl-4 font-semibold">
                        基于 Inventory 设置的 Daily Burn Rate 进行推演
                    </p>
                </div>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_currentColor]"></span> 实际 (Actual)
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_currentColor]"></span> 预测 (Projected)
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
                          style={{filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.3))', outline: 'none'}}
                          name="Actual"
                      />
                      <Line 
                          type="monotone" 
                          dataKey="forecast" 
                          stroke="#a855f7" 
                          strokeWidth={3} 
                          strokeDasharray="4 4" 
                          dot={false}
                          style={{filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.3))', outline: 'none'}}
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
                库存物流资产 (Assets)
            </h3>
            <div className="flex-1 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={costData}
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
                            {costData.map((entry, index) => (
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
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">运费估值</p>
                    <p className="text-3xl font-display font-bold text-white tracking-tight text-glow-cyan mt-1">
                        ¥{(costData.reduce((a,b) => a+b.value, 0) / 1000).toFixed(1)}k
                    </p>
                </div>
            </div>
            <div className="flex justify-center gap-8 mt-4 border-t border-white/5 pt-6">
                <div className={`flex items-center gap-2 transition-opacity ${activeHighlight && activeHighlight !== '海运 (Sea)' ? 'opacity-30' : 'opacity-100'}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
                    <span className="text-sm text-slate-300 font-bold">海运库存</span>
                </div>
                <div className={`flex items-center gap-2 transition-opacity ${activeHighlight && activeHighlight !== '空运 (Air)' ? 'opacity-30' : 'opacity-100'}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                    <span className="text-sm text-slate-300 font-bold">空运库存</span>
                </div>
            </div>
        </div>

      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ios-glass-card p-8 hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-3">
             <h3 className="text-base font-bold text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                <span className="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                真实利润排行 (Real Profit Leaders)
             </h3>
             <div className="h-72">
                {profitData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={profitData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
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
                                {profitData.map((entry, index) => (
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
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        暂无销售利润数据
                    </div>
                )}
             </div>
          </div>

          <div className="ios-glass-card p-8 flex flex-col hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-4">
             <div className="flex justify-between items-center mb-8">
                 <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <span className="w-1 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></span>
                    热销榜单 (Top Sellers & Stock)
                 </h3>
                 <button 
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="text-xs text-cyan-400 hover:text-white border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 rounded-lg transition-all uppercase tracking-widest font-bold shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95"
                 >
                    {showAllProducts ? '收起' : '查看全部'}
                 </button>
             </div>
             <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                 {profitData.slice(0, showAllProducts ? 20 : 4).map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex items-center gap-5 relative z-10 flex-1">
                             <div className="text-lg font-display font-bold text-slate-600 group-hover:text-cyan-400 transition-colors">0{i+1}</div>
                             <div className="flex-1">
                                 <div className="flex justify-between">
                                     <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</p>
                                     <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 rounded font-mono">+${item.value.toLocaleString()}</span>
                                 </div>
                                 <div className="flex items-center gap-4 mt-2">
                                     {/* Simple Stock Indicator */}
                                     <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                         <Package className="w-3 h-3" />
                                         <span>Stock: {item.stock}</span>
                                     </div>
                                     <div className="flex items-center gap-1 text-[10px]">
                                         {item.daysRemaining < 15 ? <AlertTriangle className="w-3 h-3 text-red-500"/> : <ArrowUpRight className="w-3 h-3 text-emerald-500"/>}
                                         <span className={item.daysRemaining < 15 ? 'text-red-400' : 'text-slate-400'}>{item.daysRemaining} Days Left</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 ))}
                 {profitData.length === 0 && (
                     <div className="text-center text-slate-500 py-10">暂无数据</div>
                 )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
