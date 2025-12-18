
import React, { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, DollarSign, Plus, FileText, 
  PieChart as PieIcon, Landmark, CreditCard, Sparkles, Bot, Loader2, X,
  Wand2, Search, Activity, Gem, ShoppingBag, BarChart3, ArrowDown, ArrowUp, AlertTriangle, ShieldCheck, ChevronRight, Clock
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTanxing } from '../context/TanxingContext';

type ViewMode = 'overview' | 'ledger' | 'analysis' | 'penetration';

const Finance: React.FC = () => {
  const { state } = useTanxing();
  const [viewMode, setViewMode] = useState<ViewMode>('penetration');
  const [selectedSku, setSelectedSku] = useState<string | null>(state.products[0]?.sku || null);
  
  const EXCHANGE_RATE = 7.2;

  // --- 穿透式核算核心引擎 V3.0 ---
  const penetrationData = useMemo(() => {
      const product = state.products.find(p => p.sku === selectedSku) || state.products[0];
      if (!product) return null;

      const stock = Math.max(product.stock || 0, 1);
      const price = product.price || 0;
      const costUSD = (product.costPrice || 0) / EXCHANGE_RATE;
      
      const eco = product.economics;
      const platformFee = price * ((eco?.platformFeePercent || 0) / 100);
      const creatorFee = price * ((eco?.creatorFeePercent || 0) / 100);
      
      // 核心修复：广告费和固定费的分摊判断
      const unitAds = (eco?.adCost || 0) > 50 ? (eco?.adCost || 0) / Math.max(stock, 50) : (eco?.adCost || 0);
      const lastLeg = eco?.lastLegShipping || 0;
      const refundRateLoss = price * ((eco?.refundRatePercent || 0) / 100);

      const dims = product.dimensions || {l:0, w:0, h:0};
      const theoreticalWeight = Math.max(product.unitWeight || 0, (dims.l * dims.w * dims.h) / 6000);
      const rate = product.logistics?.unitFreightCost || 0;
      const batchFees = (product.logistics?.customsFee || 0) + (product.logistics?.portFee || 0);
      
      // 物流杂费分摊（归一化 divisor）
      const unitLogisticsCNY = (theoreticalWeight * rate) + (batchFees / Math.max(stock, 50)) + (product.logistics?.consumablesFee || 0);
      const logisticsUSD = unitLogisticsCNY / EXCHANGE_RATE;

      const totalUnitCost = costUSD + platformFee + creatorFee + unitAds + lastLeg + refundRateLoss + logisticsUSD;
      const netProfit = price - totalUnitCost;

      return {
          sku: product.sku,
          price,
          breakdown: [
              { name: '售价 (GMV)', value: price, type: 'plus', color: '#10b981' },
              { name: '采购成本', value: -costUSD, type: 'minus', color: '#ef4444' },
              { name: '头程物流分摊', value: -logisticsUSD, type: 'minus', color: '#f59e0b' },
              { name: '平台/达人抽成', value: -(platformFee + creatorFee), type: 'minus', color: '#ef4444' },
              { name: '分摊广告支出', value: -unitAds, type: 'minus', color: '#ec4899' },
              { name: '尾程/损耗', value: -(lastLeg + refundRateLoss), type: 'minus', color: '#ef4444' },
              { name: '单品穿透净利', value: netProfit, type: 'total', color: '#8b5cf6' }
          ],
          margin: (netProfit / price) * 100,
          roi: (netProfit * EXCHANGE_RATE / (product.costPrice! + unitLogisticsCNY)) * 100,
          stockAge: product.warehouseAgeDays || 12
      };
  }, [selectedSku, state.products]);

  const totalStockValue = useMemo(() => {
      return state.products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
  }, [state.products]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2 italic uppercase tracking-tighter">
                  <Wallet className="w-7 h-7 text-violet-500" /> 财务审计控制台
              </h1>
          </div>
          <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/5">
              <button onClick={() => setViewMode('overview')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'overview' ? 'bg-violet-600 text-white' : 'text-slate-500'}`}>资产总览</button>
              <button onClick={() => setViewMode('penetration')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'penetration' ? 'bg-violet-600 text-white' : 'text-slate-500'}`}>成本穿透</button>
          </div>
      </div>

      {viewMode === 'penetration' && penetrationData && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in">
              <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-4 space-y-6">
                      <div className="ios-glass-card p-6">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 block">选择 SKU 进行审计</label>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {state.products.filter(p => !p.deletedAt).map(p => (
                                  <div 
                                    key={p.id}
                                    onClick={() => setSelectedSku(p.sku)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedSku === p.sku ? 'bg-violet-600/10 border-violet-500/50' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                                  >
                                      <div className="text-sm font-bold text-white font-mono">{p.sku}</div>
                                      <ChevronRight className="w-4 h-4 text-slate-700" />
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                      <div className="ios-glass-card p-8 min-h-[500px]">
                          <h3 className="text-lg font-bold text-white mb-10 italic">单品利润瀑布模型 (Audit Waterfall)</h3>
                          <div className="space-y-4">
                              {penetrationData.breakdown.map((item, idx) => (
                                  <div key={idx} className="group">
                                      <div className="flex justify-between text-xs font-bold mb-1.5">
                                          <span className={item.type === 'total' ? 'text-violet-400' : 'text-slate-400'}>{item.name}</span>
                                          <span className={item.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                              {item.value.toFixed(2)}
                                          </span>
                                      </div>
                                      <div className="h-3 bg-white/2 rounded-full overflow-hidden border border-white/5">
                                          <div 
                                            className="h-full transition-all duration-1000"
                                            style={{ width: `${Math.abs((item.value/penetrationData.price)*100)}%`, backgroundColor: item.color }}
                                          ></div>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-8">
                              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                  <div className="text-[9px] text-emerald-600 font-bold uppercase">实际穿透利润率</div>
                                  <div className={`text-3xl font-black font-mono ${penetrationData.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {penetrationData.margin.toFixed(1)}%
                                  </div>
                              </div>
                              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                  <div className="text-[9px] text-indigo-600 font-bold uppercase">预期资金回报率 (ROI)</div>
                                  <div className={`text-3xl font-black font-mono ${penetrationData.roi >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                                      {penetrationData.roi.toFixed(1)}%
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {viewMode === 'overview' && (
          <div className="flex-1 ios-glass-card p-10 flex flex-col items-center justify-center">
              <ShoppingBag className="w-16 h-16 opacity-10 mb-4" />
              <p className="text-xl font-bold text-white">总采购资产价值: ¥ {totalStockValue.toLocaleString()}</p>
          </div>
      )}
    </div>
  );
};

export default Finance;
