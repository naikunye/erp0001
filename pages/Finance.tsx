
import React, { useState, useMemo } from 'react';
/* Added Clock to lucide-react imports */
import { 
  Wallet, TrendingUp, DollarSign, Plus, FileText, 
  PieChart as PieIcon, Landmark, CreditCard, Sparkles, Bot, Loader2, X,
  Wand2, Search, Activity, Gem, ShoppingBag, BarChart3, ArrowDown, ArrowUp, AlertTriangle, ShieldCheck, ChevronRight, Clock
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { MOCK_TRANSACTIONS } from '../constants';
import { Transaction, Product } from '../types';
import { useTanxing } from '../context/TanxingContext';

type ViewMode = 'overview' | 'ledger' | 'analysis' | 'penetration';

const Finance: React.FC = () => {
  const { state, showToast } = useTanxing();
  const [activeCurrency, setActiveCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedSku, setSelectedSku] = useState<string | null>(state.products[0]?.sku || null);
  
  const EXCHANGE_RATE = 7.2;

  // --- 穿透式核算核心引擎 ---
  const penetrationData = useMemo(() => {
      const product = state.products.find(p => p.sku === selectedSku) || state.products[0];
      if (!product) return null;

      const price = product.price || 0;
      const costUSD = (product.costPrice || 0) / EXCHANGE_RATE;
      
      const eco = product.economics;
      const platformFee = price * ((eco?.platformFeePercent || 0) / 100);
      const creatorFee = price * ((eco?.creatorFeePercent || 0) / 100);
      const ads = eco?.adCost || 0;
      const lastLeg = eco?.lastLegShipping || 0;
      const refundRate = price * ((eco?.refundRatePercent || 0) / 100);

      const dims = product.dimensions || {l:0, w:0, h:0};
      const theoreticalWeight = Math.max(product.unitWeight || 0, (dims.l * dims.w * dims.h) / 6000);
      const rate = product.logistics?.unitFreightCost || 0;
      const batchFees = (product.logistics?.customsFee || 0) + (product.logistics?.portFee || 0);
      const unitLogisticsCNY = (theoreticalWeight * rate) + (batchFees / 100) + (product.logistics?.consumablesFee || 0);
      const logisticsUSD = unitLogisticsCNY / EXCHANGE_RATE;

      const totalCost = costUSD + platformFee + creatorFee + ads + lastLeg + refundRate + logisticsUSD;
      const netProfit = price - totalCost;

      return {
          sku: product.sku,
          price,
          breakdown: [
              { name: '售价 (GMV)', value: price, type: 'plus', color: '#10b981' },
              { name: '采购成本', value: -costUSD, type: 'minus', color: '#ef4444' },
              { name: '头程物流', value: -logisticsUSD, type: 'minus', color: '#f59e0b' },
              { name: '平台/达人佣金', value: -(platformFee + creatorFee), type: 'minus', color: '#ef4444' },
              { name: '广告支出 (CPA)', value: -ads, type: 'minus', color: '#ec4899' },
              { name: '尾程/退货损耗', value: -(lastLeg + refundRate), type: 'minus', color: '#ef4444' },
              { name: '单品净利', value: netProfit, type: 'total', color: '#8b5cf6' }
          ],
          margin: (netProfit / price) * 100,
          roi: (netProfit * EXCHANGE_RATE / (product.costPrice! + unitLogisticsCNY)) * 100,
          stockAge: product.warehouseAgeDays || 12
      };
  }, [selectedSku, state.products]);

  const stats = useMemo(() => {
    let totalStockValue = 0;
    let totalProfit = 0;
    state.products.forEach(p => {
        totalStockValue += (p.stock || 0) * (p.costPrice || 0);
    });
    return { totalStockValue };
  }, [state.products]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2 italic uppercase tracking-tighter">
                  <Wallet className="w-7 h-7 text-violet-500" />
                  财务资产穿透控制 (Audit Console)
              </h1>
              <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-[0.2em]">Full Lifecycle Cost Penetration Module v2.5</p>
          </div>
          
          <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
              <button onClick={() => setViewMode('overview')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'overview' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-500 hover:text-slate-300'}`}>资产总览</button>
              <button onClick={() => setViewMode('penetration')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'penetration' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-500 hover:text-slate-300'}`}>利润穿透</button>
              <button onClick={() => setViewMode('ledger')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ledger' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-500 hover:text-slate-300'}`}>收支明细</button>
          </div>
      </div>

      {viewMode === 'penetration' && penetrationData && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-12 gap-6">
                  {/* SKU Selector Side */}
                  <div className="col-span-12 lg:col-span-4 space-y-6">
                      <div className="ios-glass-card p-6">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 block">选择核算对象</label>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {state.products.filter(p => !p.deletedAt).map(p => (
                                  <div 
                                    key={p.id}
                                    onClick={() => setSelectedSku(p.sku)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedSku === p.sku ? 'bg-violet-600/10 border-violet-500/50' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                                  >
                                      <div>
                                          <div className="text-sm font-bold text-white font-mono">{p.sku}</div>
                                          <div className="text-[10px] text-slate-500 mt-0.5">{p.name}</div>
                                      </div>
                                      <ChevronRight className={`w-4 h-4 ${selectedSku === p.sku ? 'text-violet-400' : 'text-slate-700'}`} />
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="ios-glass-panel border-amber-500/20 bg-amber-500/5 p-6 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-amber-500"/></div>
                          <h4 className="text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-2"><Clock className="w-4 h-4"/> 库龄与减值评估</h4>
                          <p className="text-xs text-amber-200/70 leading-relaxed mb-4">
                              当前 SKU 在库平均库龄为 <b>{penetrationData.stockAge} 天</b>。
                              {penetrationData.stockAge > 90 ? '已触达库龄红线，建议下月开启 20% 折扣清仓以加速资金回笼。' : '库龄表现优异，资金周转处于安全区间。'}
                          </p>
                          <div className="flex justify-between items-end">
                              <div>
                                  <div className="text-[9px] text-amber-600 font-bold uppercase">资金占用周转率</div>
                                  <div className="text-xl font-black text-amber-200 font-mono">{(365 / penetrationData.stockAge).toFixed(1)}x</div>
                              </div>
                              <div className="text-right">
                                  <div className="text-[9px] text-amber-600 font-bold uppercase">减值风险</div>
                                  <div className="text-xl font-black text-amber-200 font-mono">{penetrationData.stockAge > 180 ? 'HIGH' : 'LOW'}</div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Profit Waterfall Visualization */}
                  <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                      <div className="ios-glass-card p-8 flex-1 flex flex-col min-h-[500px]">
                          <div className="flex justify-between items-center mb-10">
                              <h3 className="text-lg font-bold text-white flex items-center gap-3 italic">
                                  利润穿透模型 (Waterfall Audit)
                                  <span className="px-2 py-0.5 bg-black text-violet-400 border border-violet-500/30 text-[10px] rounded font-mono font-bold tracking-widest">{penetrationData.sku}</span>
                              </h3>
                              <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">V2.5 Engine Verified</span>
                              </div>
                          </div>

                          <div className="flex-1 flex flex-col gap-4">
                              {penetrationData.breakdown.map((item, idx) => {
                                  const total = penetrationData.price;
                                  const width = (Math.abs(item.value) / total) * 100;
                                  return (
                                      <div key={idx} className="group">
                                          <div className="flex justify-between items-center mb-1.5 px-1">
                                              <span className={`text-xs font-bold ${item.type === 'total' ? 'text-violet-400' : 'text-slate-400'}`}>{item.name}</span>
                                              <span className={`text-xs font-mono font-bold ${item.value > 0 ? 'text-emerald-400' : item.value < 0 ? 'text-red-400' : 'text-white'}`}>
                                                  {item.value > 0 ? '+' : ''}{item.value.toFixed(2)}
                                              </span>
                                          </div>
                                          <div className="h-4 bg-white/2 rounded-full overflow-hidden border border-white/5 relative">
                                              <div 
                                                className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                                                style={{ 
                                                    width: `${width}%`, 
                                                    backgroundColor: item.color,
                                                    boxShadow: `0 0 15px ${item.color}33`
                                                }}
                                              ></div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>

                          <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-8">
                              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                  <div>
                                      <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">穿透利润率 (Net Margin)</div>
                                      <div className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">{penetrationData.margin.toFixed(1)}%</div>
                                  </div>
                                  <TrendingUp className="w-8 h-8 text-emerald-500 opacity-20" />
                              </div>
                              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                                  <div>
                                      <div className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest">预计本金回报 (ROI)</div>
                                      <div className="text-3xl font-black text-indigo-400 font-mono tracking-tighter">{penetrationData.roi.toFixed(1)}%</div>
                                  </div>
                                  <Activity className="w-8 h-8 text-indigo-500 opacity-20" />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {viewMode === 'overview' && (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="ios-glass-card p-5 border-l-4 border-l-blue-500">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><ShoppingBag className="w-3 h-3 text-blue-400"/> 库存采购资产价值</div>
                      <div className="text-2xl font-mono font-bold text-white">¥ {stats.totalStockValue.toLocaleString()}</div>
                  </div>
              </div>
              <div className="ios-glass-card p-8 h-96 flex flex-col items-center justify-center text-slate-700">
                  <BarChart3 className="w-16 h-16 opacity-10 mb-4" />
                  <p className="text-sm uppercase tracking-widest font-bold">概览报表正在实时计算同步中...</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default Finance;
