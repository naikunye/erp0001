
import React, { useMemo, useState } from 'react';
import { 
    Box, Wallet, Zap, 
    AlertTriangle, ShieldCheck, Activity, Coins, Truck, Sparkles, Loader2,
    MessageCircle, Send, RefreshCw, X, ShieldAlert, Cpu, Network, Server, Database, FileText, ChevronRight, BarChart3, PieChart
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { sendFeishuMessage } from '../utils/feishu';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip } from 'recharts';

const Dashboard: React.FC = () => {
  const { state, showToast, runSentinelSweep, syncToCloud } = useTanxing();

  const metrics = useMemo(() => {
      const products = Array.isArray(state.products) ? state.products : [];
      const transactions = Array.isArray(state.transactions) ? state.transactions : [];
      const exchangeRate = state.exchangeRate || 7.2;

      const stockValue = products.reduce((acc, p) => acc + (Math.max(0, p.stock || 0) * (p.costPrice || 0)), 0);
      
      let cash = 0;
      transactions.forEach(t => {
          if (!t || !t.amount) return;
          const val = t.currency === 'USD' ? (t.amount || 0) * exchangeRate : (t.amount || 0);
          if (t.type === 'income') cash += val; else cash -= val;
      });

      return {
          totalAssets: cash + stockValue,
          stockValue,
          cash,
          lowStock: products.filter(p => (p.stock || 0) < 10).length,
          activeShipments: (state.shipments || []).filter((s:any) => s.status === '运输中').length,
          chartData: [
              { name: '现金', value: Math.max(0, cash), color: '#6366f1' },
              { name: '货值', value: stockValue, color: '#f59e0b' }
          ]
      };
  }, [state.products, state.transactions, state.exchangeRate, state.shipments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* 顶部：云端状态与同步条 */}
      <div className="ios-glass-panel border-indigo-500/20 bg-indigo-950/10 p-5 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${state.connectionStatus === 'connected' ? 'bg-indigo-600 shadow-[0_0_30px_#6366f1]' : 'bg-slate-800'}`}>
                {state.connectionStatus === 'connected' ? <Server className="w-8 h-8 text-white animate-pulse" /> : <Network className="w-8 h-8 text-slate-500" />}
            </div>
            <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">Quantum Computing Node</p>
                <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">远程节点: <span className="text-white font-mono">{state.pbUrl || 'OFFLINE'}</span></span>
                    <div className="h-3 w-px bg-white/10"></div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">状态: <span className={state.saveStatus === 'dirty' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}>{state.saveStatus === 'dirty' ? '检测到本地修改' : '数据对齐完成'}</span></span>
                </div>
            </div>
          </div>

          <div className="flex gap-3">
              <button 
                onClick={() => syncToCloud()}
                className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase flex items-center gap-3 transition-all ${state.saveStatus === 'dirty' ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-500' : 'bg-white/5 text-slate-600 border border-white/5 cursor-default'}`}
              >
                <Database className="w-4 h-4" /> 镜像同步
              </button>
              <button 
                onClick={() => { showToast('正在请求轮询服务...', 'info'); }}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black text-slate-300 uppercase flex items-center gap-3 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> 刷新物流
              </button>
          </div>
      </div>

      {/* 核心指标矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="全口径总资产" value={`¥${metrics.totalAssets.toLocaleString()}`} icon={Coins} accentColor="cyan" />
            <StatCard title="可用现金总额" value={`¥${metrics.cash.toLocaleString()}`} icon={Wallet} accentColor="green" />
            <StatCard title="在库货值" value={`¥${metrics.stockValue.toLocaleString()}`} icon={Box} accentColor="orange" />
            <StatCard title="在途物流载荷" value={`${metrics.activeShipments} 批次`} icon={Truck} accentColor="pink" />
      </div>

      <div className="grid grid-cols-12 gap-6">
          {/* 左侧：资产构成深度分析 (替代 AI) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div className="ios-glass-panel rounded-[3rem] p-10 flex flex-col min-h-[450px] relative overflow-hidden bg-black/40 border-white/5">
                  <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-indigo-600/20 rounded-2xl">
                        <BarChart3 className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-widest">资产健康与流动性透视</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-1">Direct Data Mapping v6.0</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 flex-1">
                      <div className="flex flex-col justify-center items-center h-full">
                          <div className="w-full h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                  <RePieChart>
                                      <Pie data={metrics.chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                          {metrics.chartData.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={entry.color} />
                                          ))}
                                      </Pie>
                                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }} />
                                  </RePieChart>
                              </ResponsiveContainer>
                          </div>
                          <div className="flex gap-6 mt-4">
                              {metrics.chartData.map(d => (
                                  <div key={d.name} className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                                      <span className="text-xs font-bold text-slate-400">{d.name}: {((d.value/metrics.totalAssets)*100).toFixed(1)}%</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="space-y-6 flex flex-col justify-center">
                          <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                              <div className="text-[10px] text-slate-500 font-black uppercase mb-1">现金/资产比率</div>
                              <div className="text-2xl font-black text-indigo-400 font-mono">{(metrics.cash / metrics.totalAssets * 100).toFixed(1)}%</div>
                              <p className="text-[10px] text-slate-600 mt-2">反映企业应对突发风险的即时支付能力。</p>
                          </div>
                          <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                              <div className="text-[10px] text-slate-500 font-black uppercase mb-1">库存沉淀率</div>
                              <div className="text-2xl font-black text-amber-500 font-mono">{(metrics.stockValue / metrics.totalAssets * 100).toFixed(1)}%</div>
                              <p className="text-[10px] text-slate-600 mt-2">反映资金在货物上的占用深度。</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 右侧：物流安全围栏 */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="ios-glass-card p-8 rounded-[3rem] flex flex-col gap-8 bg-black/40 h-full">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-500" /> 物流监控围栏
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 flex-1">
                      {(state.shipments || []).filter((s:any) => s.status === '异常').map((s:any) => (
                          <div key={s.id} className="p-5 bg-rose-500/10 rounded-2xl border border-rose-500/20 group hover:border-rose-500/50 transition-all">
                              <div className="flex justify-between text-[11px] font-black uppercase mb-2">
                                  <span className="text-rose-400 font-mono tracking-tight">{s.trackingNo}</span>
                                  <span className="text-rose-500 animate-pulse italic">异常发生</span>
                              </div>
                              <div className="text-sm text-slate-300 font-bold truncate mb-3">{s.productName}</div>
                          </div>
                      ))}
                      {(state.shipments || []).filter((s:any) => s.status === '异常').length === 0 && (
                          <div className="py-24 text-center">
                            <ShieldCheck className="w-16 h-16 text-emerald-500/10 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">全网载荷链路安全</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-600 uppercase">服务器对齐周期</span>
                          <span className="text-[11px] font-mono font-black text-indigo-400">15 MINS</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-600 uppercase">上一次同步</span>
                          <span className="text-[11px] font-mono font-bold text-slate-500">{state.lastSyncAt ? new Date(state.lastSyncAt).toLocaleTimeString() : 'NEVER'}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
