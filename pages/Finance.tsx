
import React, { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, DollarSign, Plus, FileText, 
  PieChart as PieIcon, Landmark, CreditCard, Sparkles, Loader2, X,
  Search, Activity, Gem, ShoppingBag, BarChart3, ArrowDown, ArrowUp, 
  AlertTriangle, ShieldCheck, ChevronRight, Clock, Filter, CheckCircle2,
  Receipt, ArrowUpRight, ArrowDownLeft, Tag, Download, Zap
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';
import { Transaction, TransactionCategory, PaymentMethod } from '../types';

type ViewMode = 'ledger' | 'overview' | 'penetration';

const Finance: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<ViewMode>('ledger');
  const [selectedSku, setSelectedSku] = useState<string | null>(state.products.find(p => !p.deletedAt)?.sku || null);
  const [searchTerm, setSearchTerm] = useState('');

  const EXCHANGE_RATE = 7.2;

  // --- 财务概览数据计算 ---
  const financeStats = useMemo(() => {
      const income = state.transactions
          .filter(t => t.type === 'income' && t.status === 'completed')
          .reduce((acc, t) => acc + (t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount), 0);
      
      const expense = state.transactions
          .filter(t => t.type === 'expense' && t.status === 'completed')
          .reduce((acc, t) => acc + (t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount), 0);
      
      const pending = state.transactions
          .filter(t => t.status === 'pending')
          .reduce((acc, t) => acc + (t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount), 0);

      return { income, expense, balance: income - expense, pending };
  }, [state.transactions]);

  // --- 交易流水过滤 ---
  const filteredTransactions = useMemo(() => {
      return [...state.transactions]
          .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, searchTerm]);

  // --- 核心算法：单品盈利穿透 V3.5 (异常保护) ---
  const penetrationData = useMemo(() => {
      const product = state.products.find(p => p.sku === selectedSku) || state.products[0];
      if (!product) return null;

      const stock = Math.max(product.stock || 0, 0);
      const priceUSD = product.price || 0;
      const costUSD = (product.costPrice || 0) / EXCHANGE_RATE;
      
      // 1. 物流成本 - 保护性分摊
      const dims = product.dimensions || {l:0, w:0, h:0};
      const autoUnitWeight = Math.max(product.unitWeight || 0, (dims.l * dims.w * dims.h) / 6000);
      const rate = product.logistics?.unitFreightCost || 0;
      
      let unitLogisticsCNY = 0;
      const manualTotal = product.logistics?.totalFreightCost;
      
      // 逻辑：如果总运费存在且库存大于一定阈值，采用平均分摊；否则采用理论单价模型
      if (manualTotal && manualTotal > 0 && stock > 5) {
          unitLogisticsCNY = (manualTotal / stock) + (product.logistics?.consumablesFee || 0);
      } else {
          unitLogisticsCNY = (autoUnitWeight * rate) + (product.logistics?.consumablesFee || 0);
      }

      const unitLogisticsUSD = unitLogisticsCNY / EXCHANGE_RATE;

      // 2. 经营成本
      const eco = product.economics;
      const platformFee = priceUSD * ((eco?.platformFeePercent || 0) / 100);
      const creatorFee = priceUSD * ((eco?.creatorFeePercent || 0) / 100);
      const unitAds = eco?.adCost || 0; 
      const lastLeg = eco?.lastLegShipping || 0;
      const fixedFee = eco?.fixedCost || 0;
      const refundRateLoss = priceUSD * ((eco?.refundRatePercent || 0) / 100);

      const totalUnitCost = costUSD + platformFee + creatorFee + unitAds + lastLeg + fixedFee + refundRateLoss + unitLogisticsUSD;
      const netProfit = priceUSD - totalUnitCost;

      return {
          sku: product.sku,
          price: priceUSD,
          breakdown: [
              { name: '销售定价 (GMV)', value: priceUSD, color: '#10b981' },
              { name: '采购成本', value: -costUSD, color: '#ef4444' },
              { name: '头程物流分摊', value: -unitLogisticsUSD, color: '#f59e0b' },
              { name: '平台/达人扣点', value: -(platformFee + creatorFee), color: '#ec4899' },
              { name: '营销广告 (CPA)', value: -unitAds, color: '#ec4899' },
              { name: '尾程派送', value: -lastLeg, color: '#6366f1' },
              { name: '预估退货及杂费', value: -(fixedFee + refundRateLoss), color: '#94a3b8' },
              { name: '单品穿透净利', value: netProfit, color: '#8b5cf6' }
          ],
          margin: priceUSD > 0 ? (netProfit / priceUSD) * 100 : 0,
          totalPotentialProfit: netProfit * stock
      };
  }, [selectedSku, state.products]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3 italic uppercase tracking-tighter">
                  <Wallet className="w-8 h-8 text-violet-500" /> 财务穿透中枢 (Audit Matrix)
              </h1>
              <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Global Sync V5 • Persistence Guard Active</p>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 shadow-xl">
                  <button onClick={() => setViewMode('ledger')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'ledger' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>收支流水</button>
                  <button onClick={() => setViewMode('overview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'overview' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>资产看板</button>
                  <button onClick={() => setViewMode('penetration')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'penetration' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>盈利穿透</button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="ios-glass-card p-4 border-l-4 border-l-blue-500"><div className="text-[9px] text-slate-500 font-bold uppercase mb-1">现金池</div><div className="text-xl font-black text-white font-mono">¥ {financeStats.balance.toLocaleString()}</div></div>
          <div className="ios-glass-card p-4 border-l-4 border-l-emerald-500"><div className="text-[9px] text-slate-500 font-bold uppercase mb-1">库存货值</div><div className="text-xl font-black text-emerald-400 font-mono">¥ {state.products.reduce((a,b)=>a+(b.stock*(b.costPrice||0)),0).toLocaleString()}</div></div>
          <div className="ios-glass-card p-4 border-l-4 border-l-rose-500"><div className="text-[9px] text-slate-500 font-bold uppercase mb-1">本月支出</div><div className="text-xl font-black text-rose-400 font-mono">¥ {financeStats.expense.toLocaleString()}</div></div>
          <div className="ios-glass-card p-4 border-l-4 border-l-amber-500"><div className="text-[9px] text-slate-500 font-bold uppercase mb-1">待结/待审</div><div className="text-xl font-black text-amber-500 font-mono">¥ {financeStats.pending.toLocaleString()}</div></div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === 'ledger' && (
              <div className="h-full flex flex-col ios-glass-panel rounded-2xl overflow-hidden animate-in fade-in">
                  <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                      <div className="relative">
                          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                          <input type="text" placeholder="检索流水..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-indigo-500 outline-none w-64"/>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                          <thead className="bg-black/40 sticky top-0 z-10 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <tr><th className="p-4">日期</th><th className="p-4">分类</th><th className="p-4">摘要</th><th className="p-4 text-right">金额</th><th className="p-4 text-center">状态</th></tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {filteredTransactions.map(tx => (
                                  <tr key={tx.id} className="hover:bg-white/2 transition-colors group">
                                      <td className="p-4 text-xs text-slate-400 font-mono">{tx.date}</td>
                                      <td className="p-4 text-xs font-bold text-slate-200">{tx.category}</td>
                                      <td className="p-4 text-xs text-slate-300 truncate max-w-xs">{tx.description}</td>
                                      <td className={`p-4 text-right font-mono font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency}</td>
                                      <td className="p-4 text-center"><span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-black ${tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>{tx.status}</span></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {viewMode === 'penetration' && penetrationData && (
              <div className="h-full grid grid-cols-12 gap-6 animate-in slide-in-from-right-4">
                   <div className="col-span-4 ios-glass-card p-6 overflow-y-auto">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">选择核算对象</h4>
                        <div className="space-y-2">
                            {state.products.filter(p => !p.deletedAt).map(p => (
                                <div key={p.id} onClick={() => setSelectedSku(p.sku)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedSku === p.sku ? 'bg-violet-600/10 border-violet-500' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="text-sm font-bold text-white font-mono">{p.sku}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">库: {p.stock}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 truncate">{p.name}</div>
                                </div>
                            ))}
                        </div>
                   </div>
                   <div className="col-span-8 ios-glass-card p-10 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <TrendingUp className="w-64 h-64 text-white" />
                        </div>
                        
                        <div className="flex justify-between items-end mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white italic uppercase tracking-tighter mb-1">单品穿透损益瀑布模型</h3>
                                <p className="text-xs text-slate-500 font-mono">P&L Waterfall | 汇率 1:{EXCHANGE_RATE}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">预估累计利润 (USD)</div>
                                <div className={`text-4xl font-black font-mono tracking-tighter ${penetrationData.totalPotentialProfit >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                    ${penetrationData.totalPotentialProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 flex-1 relative z-10 pr-2 overflow-y-auto custom-scrollbar">
                            {penetrationData.breakdown.map((item, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-400 uppercase tracking-tight">{item.name}</span>
                                        <span className={item.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                            {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (Math.abs(item.value)/penetrationData.price)*100)}%`, backgroundColor: item.color }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-violet-600/10 border border-violet-500/30 rounded-2xl flex justify-between items-center relative overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-violet-600 rounded-xl text-white shadow-xl shadow-violet-900/40"><Zap className="w-5 h-5 fill-current"/></div>
                                <div>
                                    <div className="text-xs font-bold text-white uppercase tracking-widest">穿透综合净利率</div>
                                    <div className="text-[10px] text-violet-400 font-mono mt-0.5">计入 CPA、头程物流及退货损益</div>
                                </div>
                            </div>
                            <div className={`text-4xl font-black font-mono tracking-tighter relative z-10 ${penetrationData.margin > 15 ? 'text-emerald-400' : penetrationData.margin > 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                                {penetrationData.margin.toFixed(1)}%
                            </div>
                        </div>
                   </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Finance;
