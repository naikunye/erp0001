
import React, { useMemo, useState } from 'react';
import { 
    Box, Wallet, Zap, 
    AlertTriangle, ShieldCheck, Activity, Coins, Truck, Sparkles, Loader2, BrainCircuit,
    MessageCircle, Send, RefreshCw, X, ShieldAlert, Cpu, Network, Server, Database, FileText, ChevronRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { sendFeishuMessage } from '../utils/feishu';

const Dashboard: React.FC = () => {
  const { state, showToast, runSentinelSweep, syncToCloud } = useTanxing();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

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
          activeShipments: (state.shipments || []).filter((s:any) => s.status === '运输中').length
      };
  }, [state.products, state.transactions, state.exchangeRate, state.shipments]);

  const generateAiBrief = async () => {
      if (isAiLoading) return;
      setIsAiLoading(true);
      setAiReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            你是一个资深的跨境电商运营总监。请根据以下经营数据生成一份极具洞察力的“经营简报”：
            1. 总资产: ¥${metrics.totalAssets.toLocaleString()}
            2. 可用现金: ¥${metrics.cash.toLocaleString()}
            3. 库存货值: ¥${metrics.stockValue.toLocaleString()}
            4. 在途货件: ${metrics.activeShipments} 个
            5. 库存告急 SKU: ${metrics.lowStock} 款
            要求：指出 1 个核心风险和 1 个增长机会。语言精练、专业，使用 HTML <b> 标签标注重点。
          `;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiReport(response.text || "AI 未能返回结论。");
      } catch (e) {
          setAiReport("<b>AI 指挥系统响应超时，请检查网络链路。</b>");
      } finally {
          setIsAiLoading(false);
      }
  };

  const pushToFeishuBrief = async () => {
      const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
      if (!webhookUrl) return showToast('请先在设置中配置飞书 Webhook', 'warning');
      if (!aiReport) return showToast('请先生成 AI 简报再推送', 'warning');

      setIsPushing(true);
      try {
          const content = `📊 探行经营摘要·量子推送\n----------------\n${aiReport.replace(/<[^>]*>/g, '')}\n----------------\n同步节点: ${state.pbUrl || 'Local Node'}\n推送时间: ${new Date().toLocaleString()}`;
          const res = await sendFeishuMessage(webhookUrl, '经营看板', content);
          if (res.success) showToast('经营简报已送达飞书群组', 'success');
      } finally {
          setIsPushing(false);
      }
  };

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
                <Database className="w-4 h-4" /> 镜像强制同步
              </button>
              <button 
                onClick={() => { runSentinelSweep(); showToast('主动触发全网巡检', 'info'); }}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black text-slate-300 uppercase flex items-center gap-3 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> 立即轮询物流
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
          {/* 左侧：AI 经营大脑 */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div className="ios-glass-panel rounded-[3rem] p-10 flex flex-col min-h-[450px] relative overflow-hidden group bg-gradient-to-br from-[#0c0c14] to-black border-white/5">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                      <BrainCircuit className="w-80 h-80 text-white" />
                  </div>
                  
                  <div className="flex justify-between items-center mb-10 relative z-10">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-widest">AI 经营战术简报</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-1">Deep Intelligence Layer v2.5</p>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <button 
                            onClick={generateAiBrief} 
                            disabled={isAiLoading}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase shadow-xl flex items-center gap-3 active:scale-95 transition-all italic"
                          >
                            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                            生成经营摘要
                          </button>
                          {aiReport && (
                              <button 
                                onClick={pushToFeishuBrief}
                                disabled={isPushing}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase shadow-xl flex items-center gap-3 active:scale-95 transition-all italic"
                              >
                                {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                推送至飞书群
                              </button>
                          )}
                      </div>
                  </div>

                  <div className="flex-1 relative z-10">
                      {aiReport ? (
                          <div className="p-8 bg-white/2 border border-white/5 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500 shadow-inner">
                              <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-loose text-lg italic font-medium" dangerouslySetInnerHTML={{ __html: aiReport }}></div>
                          </div>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-20">
                              <FileText className="w-24 h-24 mb-6" />
                              <p className="text-xs font-black uppercase tracking-[1em]">Awaiting Analysis</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* 右侧：实时安全围栏 */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="ios-glass-card p-8 rounded-[3rem] flex flex-col gap-8 bg-black/40">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-500" /> 物流安全围栏 (Sentinel)
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {(state.shipments || []).filter((s:any) => s.status === '异常').map((s:any) => (
                          <div key={s.id} className="p-5 bg-rose-500/10 rounded-2xl border border-rose-500/20 group hover:border-rose-500/50 transition-all">
                              <div className="flex justify-between text-[11px] font-black uppercase mb-2">
                                  <span className="text-rose-400 font-mono tracking-tight">{s.trackingNo}</span>
                                  <span className="text-rose-500 animate-pulse italic">异常发生</span>
                              </div>
                              <div className="text-sm text-slate-300 font-bold truncate mb-3">{s.productName}</div>
                              <button 
                                onClick={() => showToast('已创建追踪任务', 'info')}
                                className="w-full py-2 bg-rose-600/10 text-rose-500 rounded-xl text-[9px] font-black uppercase border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                              >
                                立即介入诊断
                              </button>
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
                          <span className="text-[10px] font-black text-slate-600 uppercase">服务器巡检间隔</span>
                          <span className="text-[11px] font-mono font-black text-indigo-400">15 MINS</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-600 uppercase">上一次全量同步</span>
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
