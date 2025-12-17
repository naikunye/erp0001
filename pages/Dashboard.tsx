
import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Box, Wallet, BarChart4, ArrowUpRight, ArrowDownRight, Loader2, TrendingUp, Sparkles, Command, Zap, Layers, ArrowRight, Package, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Line, Area } from 'recharts';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const { state, dispatch } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data loading
  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 500); // Faster load
      return () => clearTimeout(timer);
  }, []);

  // --- Handlers for Interactivity ---
  const handleNavigateToInventory = (sku: string) => {
      if (!sku) return;
      // Navigate to Inventory and pass the SKU as a search filter
      dispatch({ type: 'NAVIGATE', payload: { page: 'inventory', params: { searchQuery: sku } } });
  };

  // --- 1. Real Data Calculations ---

  // Filter out deleted items to match Inventory/Order pages
  const activeProducts = useMemo(() => state.products.filter(p => !p.deletedAt), [state.products]);
  const activeOrders = useMemo(() => state.orders.filter(o => !o.deletedAt && o.status !== 'cancelled'), [state.orders]);

  // Financial & Inventory Metrics
  const metrics = useMemo(() => {
      
      // 1. Inventory Stock Value (Linked to Replenishment Center)
      const stockValue = activeProducts.reduce((acc, p) => {
          return acc + (p.stock * (p.costPrice || 0));
      }, 0);
      
      // 2. Real Net Profit (REAL LOGIC: Revenue - Actual Expenses from Transactions)
      const totalRevenue = activeOrders.reduce((acc, o) => acc + o.total, 0);
      
      // Calculate actual expenses from Transactions (Cash Basis)
      let totalActualExpenses = 0;
      const EXCHANGE_RATE = 7.2; // Assumed CNY to USD rate for normalization

      state.transactions.forEach(t => {
          if (t.type === 'expense' && t.status === 'completed') {
              // Convert to USD
              const amountUSD = t.currency === 'CNY' ? t.amount / EXCHANGE_RATE : t.amount;
              totalActualExpenses += amountUSD;
          }
      });

      const netProfit = totalRevenue - totalActualExpenses;
      // ROI = Net Profit / Total Invested (Expenses)
      const roi = totalActualExpenses > 0 ? (netProfit / totalActualExpenses) * 100 : 0;

      // 3. Logistics Weight (Inventory total weight)
      const logisticsWeight = activeProducts.reduce((acc, p) => acc + (p.stock * (p.unitWeight || 0)), 0);
      
      return {
          stockValue: stockValue, // Actual inventory value in CNY
          netProfit: netProfit,
          roi: roi.toFixed(1),
          logisticsWeight: logisticsWeight.toFixed(1),
      };
  }, [activeOrders, activeProducts, state.products, state.transactions]);

  // Top Products Chart Data (Profit based)
  const profitData = useMemo(() => {
      const profitMap: Record<string, { profit: number, revenue: number, stock: number, daysRemaining: number, sku: string }> = {};
      const EXCHANGE_RATE = 7.2;

      // Calculate Profit per SKU based on orders
      activeOrders.forEach(o => {
          o.lineItems?.forEach(item => {
              const product = state.products.find(p => p.id === item.productId);
              let itemProfit = 0;
              let itemRevenue = item.price * item.quantity;
              
              if (product) {
                  // Replicate Deep Cost Calculation for per-item accuracy
                  const cogsUSD = (product.costPrice || 0) / EXCHANGE_RATE;
                  const freightUSD = ((product.logistics?.unitFreightCost || 0) * (product.unitWeight || 0)) / EXCHANGE_RATE;
                  const eco = product.economics || {};
                  const otherCosts = (item.price * ((eco.platformFeePercent||0)/100)) + 
                                     (item.price * ((eco.creatorFeePercent||0)/100)) + 
                                     (eco.fixedCost||0) + (eco.lastLegShipping||0) + (eco.adCost||0);
                  
                  const unitCost = cogsUSD + freightUSD + otherCosts;
                  itemProfit = (item.price - unitCost) * item.quantity;
              } else {
                  itemProfit = itemRevenue * 0.3; // Fallback
              }

              // Use SKU as key to ensure mapping to real inventory
              const sku = product ? product.sku : item.sku;
              const name = product ? product.name : item.sku; // Fallback name
              
              if (!profitMap[sku]) {
                  profitMap[sku] = { 
                      profit: 0, 
                      revenue: 0, 
                      stock: product ? product.stock : 0,
                      daysRemaining: product && product.dailyBurnRate ? Math.floor(product.stock / product.dailyBurnRate) : 999,
                      sku: sku
                  };
              }
              (profitMap[sku] as any).name = name; 
              
              profitMap[sku].profit += itemProfit;
              profitMap[sku].revenue += itemRevenue;
          });
      });

      return Object.values(profitMap)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 10);
  }, [activeOrders, state.products]);

  // Logistics Cost Structure Data (Sea vs Air based on Active Products)
  const costData = useMemo(() => {
      let seaCost = 0;
      let airCost = 0;
      activeProducts.forEach(p => {
          const method = p.logistics?.method || 'Sea';
          // Estimated logistics value held in stock
          // Rate * Weight * Stock
          const value = (p.logistics?.unitFreightCost || 0) * (p.unitWeight || 0) * p.stock; 
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

  // --- 2. AI Implementation ---

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = `
            Role: Chief Operating Officer (COO) for an E-commerce brand.
            
            Real-time Metrics (Verified):
            - Stock Assets: ¥${metrics.stockValue.toLocaleString()}
            - Real Net Profit: $${metrics.netProfit.toFixed(2)} (Calculated via Actual Expenses vs Revenue)
            - ROI: ${metrics.roi}%
            
            Task: Provide a strategic executive summary (in Chinese).
            1. Analyze the health of the profit margin considering the real cost structure.
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
          // If using the bar chart, payload is profitData item
          const data = payload[0].payload;
          const displayLabel = (data as any).name || label;
          
          return (
              <div className="bg-black/90 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50 min-w-[150px]">
                  <p className="text-xs text-slate-400 font-bold font-mono mb-2 border-b border-white/10 pb-2 uppercase tracking-wider">{displayLabel}</p>
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

      {/* Metrics Grid - Adjusted to 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-1">
            <StatCard loading={isLoading} title="库存资金占用 (Stock Asset)" value={`¥${metrics.stockValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend="Linked to Inv." trendUp={true} icon={Wallet} accentColor="blue" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-2">
            <StatCard loading={isLoading} title="真实净利 (Real Net)" value={`$${metrics.netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`} trend={`${metrics.roi}% ROI`} trendUp={parseFloat(metrics.roi) > 0} icon={TrendingUp} accentColor="green" />
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animate-stagger-4">
            <StatCard loading={isLoading} title="物流总重 (Total Weight)" value={metrics.logisticsWeight} subValue="kg" trend="Stable" trendUp={true} icon={Box} accentColor="orange" />
        </div>
      </div>

      {/* Main Charts Section - Redesigned Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real Profit Leaders (Moved Up, Expanded) */}
        <div className="lg:col-span-2 ios-glass-card p-8 hud-card animate-in fade-in slide-in-from-bottom-4 duration-700 animate-stagger-3">
             <h3 className="text-base font-bold text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                <span className="w-1 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                真实利润排行 (Real Profit Leaders)
             </h3>
             <div className="h-[350px]">
                {profitData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={profitData} 
                            layout="vertical" 
                            margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
                            onClick={(data) => {
                                if (data && data.activePayload && data.activePayload.length > 0) {
                                    handleNavigateToInventory(data.activePayload[0].payload.sku);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="sku" type="category" width={90} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace'}} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomHUDTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                            <Bar 
                                dataKey="profit" 
                                name="Profit"
                                barSize={16} 
                                radius={[0, 4, 4, 0]}
                            >
                                {profitData.map((entry: any, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={index < 3 ? 'url(#barGradient)' : '#334155'} 
                                        fillOpacity={activeHighlight && activeHighlight !== entry.sku ? 0.3 : 1}
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
    </div>
  );
};

export default Dashboard;
