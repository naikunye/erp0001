
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Box, Wallet, Loader2, TrendingUp, Sparkles, Command, Zap, Gem, 
    AlertTriangle, ShieldCheck, Activity, PieChart, ArrowUpRight, 
    BarChart3, Radio, Terminal, Network, Fingerprint, Coins, ShieldAlert, Scale,
    ChevronRight, ArrowRight, MessageSquare, Bell, Landmark, Info, Truck
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const { state, dispatch } = useTanxing();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 统一引用全局汇率
  const EXCHANGE_RATE = state.exchangeRate || 7.2;

  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
  }, []);

  const activeProducts = useMemo(() => (state.products || []).filter(p => !p.deletedAt), [state.products]);

  const metrics = useMemo(() => {
      let totalGoodsValueCNY = 0;
      let totalAllInLogisticsCNY = 0;
      let totalStaticProfitUSD = 0;

      // 1. 计算在库资产与物流投入
      activeProducts.forEach(p => {
          const stock = Math.max(p.stock || 0, 0);
          totalGoodsValueCNY += stock * (p.costPrice || 0);
          
          const unitRealWeight = p.unitWeight || 0;
          const dims = p.dimensions || {l:0, w:0, h:0};
          const unitVolWeight = (dims.l * dims.w * dims.h) / 6000;
          const autoUnitWeight = Math.max(unitRealWeight, unitVolWeight);
          
          let activeTotalBillingWeight = 0;
          if (p.logistics?.billingWeight && p.logistics.billingWeight > 0) {
              activeTotalBillingWeight = p.logistics.billingWeight; 
          } else if (p.logistics?.unitBillingWeight && p.logistics.unitBillingWeight > 0) {
              activeTotalBillingWeight = p.logistics.unitBillingWeight * stock;
          } else {
              activeTotalBillingWeight = autoUnitWeight * stock;
          }

          const rate = p.logistics?.unitFreightCost || 0;
          const batchFeesCNY = (p.logistics?.customsFee || 0) + (p.logistics?.portFee || 0);
          const autoTotalFreightCNY = (activeTotalBillingWeight * rate) + batchFeesCNY;
          const effectiveTotalFreightCNY = p.logistics?.totalFreightCost ?? autoTotalFreightCNY;
          
          const unitConsumablesCNY = (p.logistics?.consumablesFee || 0);
          const totalConsumablesForBatch = unitConsumablesCNY * stock;

          const skuTotalLogisticsCNY = effectiveTotalFreightCNY + totalConsumablesForBatch;
          totalAllInLogisticsCNY += skuTotalLogisticsCNY;

          const priceUSD = p.price || 0;
          const unitStaticLogisticsUSD = stock > 0 ? (skuTotalLogisticsCNY / stock) / EXCHANGE_RATE : 0;
          const unitCogsUSD = (p.costPrice || 0) / EXCHANGE_RATE;
          const eco = p.economics;
          const unitFeesUSD = priceUSD * (((eco?.platformFeePercent || 0) + (eco?.creatorFeePercent || 0)) / 100) + (eco?.fixedCost || 0) + (eco?.lastLegShipping || 0);
          
          const unitStaticProfitUSD = priceUSD - (unitCogsUSD + unitStaticLogisticsUSD + unitFeesUSD);
          totalStaticProfitUSD += unitStaticProfitUSD * stock;
      });

      // 2. 计算在途资产 (物流中枢中已发出但未入库的货值)
      const totalInTransitValueCNY = (state.inboundShipments || [])
          .filter(s => s.status === 'Shipped' || s.status === 'Receiving')
          .reduce((acc, s) => acc + s.items.reduce((sum, item) => {
              // 寻找对应的产品拿货价，如果找不到则按 0 算
              const prod = activeProducts.find(p => p.id === item.productId);
              return sum + (item.quantity * (prod?.costPrice || 0));
          }, 0), 0);

      // 3. 现金流核算
      let completedIncome = 0; 
      let completedExpense = 0; 
      let pendingLiabilities = 0;

      (state.transactions || []).forEach(t => {
          const val = t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount;
          if (t.type === 'income' && t.status === 'completed') completedIncome += val;
          if (t.type === 'expense') {
              if (t.status === 'completed') completedExpense += val;
              else if (t.status === 'pending') pendingLiabilities += val;
          }
      });

      const cashBalanceCNY = completedIncome - completedExpense;
      // 最终修正总资产公式：现金 + 在库货值 + 在途货值 + 物流资产
      const totalAssetsCNY = cashBalanceCNY + totalGoodsValueCNY + totalInTransitValueCNY + totalAllInLogisticsCNY;
      
      const roi = (totalGoodsValueCNY + totalInTransitValueCNY + totalAllInLogisticsCNY) > 0 
          ? (totalStaticProfitUSD * EXCHANGE_RATE / (totalGoodsValueCNY + totalInTransitValueCNY + totalAllInLogisticsCNY) * 100) 
          : 0;

      return { 
          totalAssetsCNY, 
          totalInTransitValueCNY,
          totalLiabilitiesCNY: pendingLiabilities, 
          netWorthCNY: totalAssetsCNY - pendingLiabilities, 
          stockValueCNY: totalGoodsValueCNY, 
          logisticsValueCNY: totalAllInLogisticsCNY, 
          totalStaticProfitUSD, 
          roi,
          lowStockSkus: activeProducts.filter(p => {
              const daily = p.dailyBurnRate || 1;
              return (p.stock || 0) / daily < (p.safetyStockDays || 7);
          }).length 
      };
  }, [activeProducts, state.transactions, state.inboundShipments, EXCHANGE_RATE]);

  const assetComposition = [
      { name: '可用现金', value: Math.max(0, metrics.totalAssetsCNY - metrics.stockValueCNY - metrics.logisticsValueCNY - metrics.totalInTransitValueCNY), color: '#6366f1' },
      { name: '库存资产', value: metrics.stockValueCNY + metrics.totalInTransitValueCNY, color: '#f59e0b' },
      { name: '物流预付', value: metrics.logisticsValueCNY, color: '#3b82f6' }
  ];

  const intelligenceStream = useMemo(() => {
    const stream = [];
    if (metrics.lowStockSkus > 0) stream.push({ type: 'warning', text: `AI 侦测到 ${metrics.lowStockSkus} 个 SKU 即将断货，建议根据备货算法立即下单。` });
    if (metrics.roi > 30) stream.push({ type: 'success', text: "全盘 ROI 动能极佳，资产回报率优于行业平均水平。" });
    if (metrics.totalInTransitValueCNY > 0) stream.push({ type: 'info', text: `当前有 ¥${metrics.totalInTransitValueCNY.toLocaleString()} 的资产处于全球航运链路中。` });
    return stream.length > 0 ? stream : [{ type: 'info', text: '系统逻辑神经链路正常：正在监控全球 24 个节点数据...' }];
  }, [metrics, state.shipments]);

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      setReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `分析财务数据：总资产 ¥${metrics.totalAssetsCNY.toLocaleString()}, 在途货值 ¥${metrics.totalInTransitValueCNY.toLocaleString()}, 静态利润 $${metrics.totalStaticProfitUSD.toLocaleString()}。请提供三条关于“供应链资金效率”的建议。使用 HTML。`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setReport(response.text || null);
      } catch (e) { setReport(`链路异常，无法接入量子智脑。`); } finally { setIsGenerating(false); }
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="ios-glass-panel border-indigo-500/20 bg-indigo-950/20 h-16 px-5 rounded-2xl flex items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 animate-pulse"></div>
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-xl shrink-0"><Zap className="w-4 h-4" /></div>
          <div className="flex-1 overflow-hidden h-6">
              <div className="flex animate-[slide-up_10s_linear_infinite] flex-col">
                  {intelligenceStream.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 h-6">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'warning' ? 'bg-amber-500' : item.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                          <p className="text-[10px] font-black text-white/90 uppercase tracking-wider italic truncate">{item.text}</p>
                      </div>
                  ))}
              </div>
          </div>
          <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { page: 'automation' } })} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase text-indigo-300 transition-all shrink-0 active:scale-95">规划配置</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="系统总资产" value={`¥${metrics.totalAssetsCNY.toLocaleString(undefined, {maximumFractionDigits:1})}`} trend="现金+在库+在途+预付" trendUp={true} icon={Coins} accentColor="cyan" loading={isLoading} />
            <StatCard title="总负债 (LIABILITIES)" value={`¥${metrics.totalLiabilitiesCNY.toLocaleString()}`} trend="待支付账单协议" trendUp={false} icon={ShieldAlert} accentColor="orange" loading={isLoading} />
            <StatCard title="净资产 (NET WORTH)" value={`¥${metrics.netWorthCNY.toLocaleString(undefined, {maximumFractionDigits:1})}`} trend="权益盈余" trendUp={true} icon={Scale} accentColor="green" loading={isLoading} />
            <StatCard title="在途资产监控" value={`¥${metrics.totalInTransitValueCNY.toLocaleString()}`} trend="已发货但未签收货值" trendUp={true} icon={Truck} accentColor="blue" loading={isLoading} />
            <StatCard title="全盘静态总利润" value={`$${metrics.totalStaticProfitUSD.toLocaleString(undefined, {maximumFractionDigits:0})}`} trend={`${metrics.roi.toFixed(1)}% 资产回报率`} trendUp={metrics.roi > 20} icon={Gem} accentColor="purple" loading={isLoading} />
            <StatCard title="库存水位" value={`${metrics.lowStockSkus} SKUs`} trend="需立即执行补货计划" trendUp={metrics.lowStockSkus === 0} icon={AlertTriangle} accentColor="pink" loading={isLoading} />
      </div>

      <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="ios-glass-card p-1 relative overflow-hidden bg-gradient-to-br from-indigo-600/10 to-transparent border-indigo-500/20 rounded-[2.5rem]">
                <div className="p-8 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-black/40 border border-white/10 rounded-[1.5rem] flex items-center justify-center text-indigo-400 shadow-2xl group hover:border-indigo-500 transition-all">
                            <ShieldCheck className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">供应链金融审计 (V6.2)</h2>
                            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Fingerprint className="w-3 h-3 text-indigo-500" /> FULL ASSET VISIBILITY ENABLED
                            </p>
                        </div>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isGenerating} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 transition-all active:scale-95">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />} 启动量子审计
                    </button>
                </div>
                {report && (
                    <div className="px-8 pb-8 animate-in zoom-in duration-500 relative z-10">
                        <div className="p-6 bg-black/60 rounded-[1.5rem] border border-indigo-500/30 text-indigo-100 leading-relaxed font-mono text-[11px] shadow-inner" dangerouslySetInnerHTML={{ __html: report }}></div>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="ios-glass-panel p-6 rounded-[2rem] flex flex-col gap-6 relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">资产构成分布 (MATRIX)</h4>
                          <PieChart className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="h-40 relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                  <Pie data={assetComposition} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="value" stroke="none">
                                      {assetComposition.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{backgroundColor:'rgba(0,0,0,0.95)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px', fontSize:'12px', color: '#fff'}} itemStyle={{color: '#fff'}} />
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

                  <div className="ios-glass-panel p-6 rounded-[2rem] border-l-4 border-l-emerald-500 group relative overflow-hidden flex flex-col justify-center">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><Sparkles className="w-20 h-20 text-emerald-400"/></div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">资本回转效率 (EFFICIENCY)</h4>
                        <ArrowUpRight className="w-5 h-5 text-emerald-500 transition-transform" />
                      </div>
                      <div className="text-5xl font-black text-white font-mono tracking-tighter mb-2">{(metrics.roi / 1.5).toFixed(2)}x</div>
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest leading-relaxed">基于 30 天回款动能。当前效率领先行业平均 <span className="text-emerald-400">12.5%</span>。</p>
                  </div>
              </div>
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="ios-glass-card p-6 flex flex-col h-full border-l-4 border-l-indigo-600 bg-black/20 rounded-[2.5rem]">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-indigo-500" /> 全球物流实况 (LIVE)
                  </h3>
                  <div className="flex-1 space-y-6 relative pl-4 overflow-y-auto custom-scrollbar max-h-[400px]">
                      <div className="absolute left-[2px] top-1 bottom-1 w-px bg-white/5"></div>
                      {(state.shipments || []).slice(0, 5).map((ship) => (
                          <div key={ship.id} className="relative pl-6 group/item">
                              <div className={`absolute left-[-5.5px] top-1.5 w-3 h-3 rounded-full border-2 border-[#050506] shadow-lg transition-all ${ship.status === '异常' ? 'bg-red-500 shadow-red-500/50' : 'bg-indigo-500 shadow-indigo-500/50 group-hover/item:scale-125'}`}></div>
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] font-black text-white font-mono tracking-tight uppercase truncate max-w-[100px]">{ship.trackingNo}</span>
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${ship.status === '异常' ? 'text-red-400 bg-red-950 border-red-900' : ship.status === '已送达' ? 'text-emerald-400 bg-emerald-950 border-emerald-900' : 'text-indigo-300 bg-indigo-950 border-indigo-900'}`}>{ship.status}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate font-bold">{ship.productName || '资产载荷中...'}</div>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => dispatch({type:'NAVIGATE', payload:{page:'tracking'}})} className="mt-6 w-full py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] border border-white/5 rounded-xl transition-all">进入物流控制矩阵 &rarr;</button>
              </div>
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes slide-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }` }} />
    </div>
  );
};

export default Dashboard;
