
import React, { useMemo, useState } from 'react';
import { 
    Box, Wallet, Zap, 
    AlertTriangle, ShieldCheck, Activity, Coins, Truck, Sparkles, Loader2, BrainCircuit,
    MessageCircle, Send, RefreshCw, X, ShieldAlert, Cpu
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";
import { sendFeishuMessage } from '../utils/feishu';

const Dashboard: React.FC = () => {
  const { state, showToast, runSentinelSweep } = useTanxing();
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
          lowStock: products.filter(p => (p.stock || 0) < 10).length
      };
  }, [state.products, state.transactions, state.exchangeRate]);

  const handleAiHealthCheck = async () => {
      if (isAiLoading) return;
      setIsAiLoading(true);
      setAiReport(null);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `分析探行ERP资产快照：总资产 ¥${metrics.totalAssets.toLocaleString()}, 现金 ¥${metrics.cash.toLocaleString()}, 库存货值 ¥${metrics.stockValue.toLocaleString()}。给出3句简短风险评估，使用HTML。`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setAiReport(response.text || "AI 未能返回分析结论。");
      } catch (e) {
          setAiReport("<b>AI 神经元当前处于休眠状态。</b>");
      } finally {
          setIsAiLoading(false);
      }
  };

  const pushManualReport = async () => {
      setIsPushing(true);
      try {
          const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
          if (!webhookUrl) return showToast('请先配置飞书 Webhook', 'warning');
          const content = `探行经营简报\n总资产: ¥${metrics.totalAssets.toLocaleString()}\n现金: ¥${metrics.cash.toLocaleString()}\n库存告急: ${metrics.lowStock} 款\n更新于: ${new Date().toLocaleString()}`;
          await sendFeishuMessage(webhookUrl, '手动摘要', content);
          showToast('简报已推送至飞书', 'success');
      } finally { setIsPushing(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 云端哨兵状态栏 */}
      <div className="ios-glass-panel border-emerald-500/20 bg-emerald-950/5 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-emerald-600 shadow-[0_0_15px_#10b981]`}>
                <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">Cloud Sentinel Active</p>
                <p className="text-[9px] text-slate-500 font-bold">上次全域巡检时间: {state.lastSentryRun || '正在初始化...'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => { runSentinelSweep(); showToast('手动触发全域扫描', 'info'); }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-slate-300 uppercase flex items-center gap-2 transition-all"
            >
                <RefreshCw className="w-3 h-3" /> 立即轮询
            </button>
            <button 
                onClick={pushManualReport}
                disabled={isPushing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[9px] font-black text-white uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
                {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <MessageCircle className="w-3.5 h-3.5"/>} 推送快照
            </button>
          </div>
      </div>

      {aiReport && (
          <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500 bg-indigo-950/10 animate-in slide-in-from-top-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 opacity-10"><BrainCircuit className="w-20 h-20 text-indigo-500"/></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3"/> AI 风险审计报告</span>
                  <button onClick={() => setAiReport(null)} className="text-slate-600 hover:text-white"><X className="w-3 h-3"/></button>
              </div>
              <div className="text-xs text-indigo-100 leading-relaxed font-bold relative z-10" dangerouslySetInnerHTML={{ __html: aiReport }}></div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="全口径总资产" value={`¥${metrics.totalAssets.toLocaleString()}`} icon={Coins} accentColor="cyan" />
            <StatCard title="可用现金余额" value={`¥${metrics.cash.toLocaleString()}`} icon={Wallet} accentColor="green" />
            <StatCard title="在库资产价值" value={`¥${metrics.stockValue.toLocaleString()}`} icon={Box} accentColor="orange" />
            <StatCard title="供应链预警" value={`${metrics.lowStock} SKU`} icon={AlertTriangle} accentColor="pink" />
      </div>

      <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-black/40 border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[400px] group">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-100 transition-opacity"><ShieldCheck className="w-64 h-64 text-indigo-500"/></div>
              <Activity className="w-12 h-12 text-indigo-500 mb-6 animate-pulse" />
              <h2 className="text-2xl font-black text-white italic uppercase tracking-widest">探行·云端数字孪生节点</h2>
              <p className="text-xs text-slate-500 mt-4 max-w-md leading-relaxed font-bold uppercase tracking-wider">
                  您的腾讯云服务器正在后台持续运行“逻辑哨兵”。系统将自动监控物流状态并在发生查验或异常时通过飞书提醒您。建议保持浏览器 Tab 开启以维持长连接。
              </p>
          </div>
          <div className="col-span-12 lg:col-span-4 ios-glass-card p-8 flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> 实时安全围栏
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {(state.shipments || []).filter((s:any) => s.status === '异常').map((s:any) => (
                      <div key={s.id} className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                              <span className="text-rose-400 font-mono">{s.trackingNo}</span>
                              <span className="text-rose-500 animate-pulse">异常 (Exception)</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate font-bold">{s.productName}</div>
                      </div>
                  ))}
                  {(state.shipments || []).filter((s:any) => s.status === '异常').length === 0 && (
                      <div className="py-20 text-center italic text-slate-700 text-[10px] font-black uppercase tracking-widest">
                        全域物流链路未见异常
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
