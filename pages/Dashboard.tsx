
import React, { useMemo, useState } from 'react';
import { 
    Box, Wallet, Zap, 
    AlertTriangle, ShieldCheck, Activity, Coins, Truck, Sparkles, Loader2, BrainCircuit
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useTanxing } from '../context/TanxingContext';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const { state } = useTanxing();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const metrics = useMemo(() => {
      // 核心防御：确保在数据未加载或加载失败时程序不崩溃
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
          const prompt = `
            Act as an ERP Auditor. Analyze this snapshot:
            Total Assets: ¥${metrics.totalAssets.toLocaleString()}
            Cash: ¥${metrics.cash.toLocaleString()}
            Inventory: ¥${metrics.stockValue.toLocaleString()}
            Low Stock Alerts: ${metrics.lowStock} SKUs.
            Give a 3-sentence risk summary and 1 key advice. Use HTML for highlights.
          `;
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt
          });
          setAiReport(response.text);
      } catch (e) {
          setAiReport("<b>AI 神经元当前处于休眠状态。</b>");
      } finally {
          setIsAiLoading(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="ios-glass-panel border-indigo-500/20 bg-indigo-950/10 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg text-white ${state.connectionStatus === 'connected' ? 'bg-indigo-600 shadow-[0_0_15px_#4f46e5]' : 'bg-slate-700'}`}>
                <Zap className={`w-5 h-5 ${state.connectionStatus === 'connected' ? 'animate-pulse' : ''}`}/>
            </div>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] italic">
                {state.connectionStatus === 'connected' 
                    ? "量子中枢已连接 - 实时云端同步中" 
                    : state.connectionStatus === 'connecting' ? "正在建立神经连接..." : "离线网格已激活 - 仅保存于本地"}
            </p>
          </div>
          <button 
            onClick={handleAiHealthCheck}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-indigo-400 uppercase flex items-center gap-2 transition-all"
          >
              {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <BrainCircuit className="w-3 h-3"/>}
              AI 风险扫描
          </button>
      </div>

      {aiReport && (
          <div className="ios-glass-card p-6 border-l-4 border-l-indigo-500 bg-indigo-950/10 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3"/> AI 健康监测报告</span>
                  <button onClick={() => setAiReport(null)} className="text-slate-600 hover:text-white"><Activity className="w-3 h-3"/></button>
              </div>
              <div className="text-xs text-indigo-100 leading-relaxed font-bold" dangerouslySetInnerHTML={{ __html: aiReport }}></div>
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
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><ShieldCheck className="w-64 h-64 text-indigo-500"/></div>
              <Activity className="w-12 h-12 text-indigo-500 mb-6 animate-pulse" />
              <h2 className="text-2xl font-black text-white italic uppercase tracking-widest">
                  {state.connectionStatus === 'connected' ? '云端指挥矩阵已固化' : '本地离线节点在线'}
              </h2>
              <p className="text-xs text-slate-500 mt-4 max-w-md leading-relaxed font-bold uppercase tracking-wider">
                  系统已成功加载经营节点。您可以点击侧边栏进入不同模块进行深度资产穿透。当前系统运行正常，数据一致性已校验。
              </p>
          </div>
          <div className="col-span-12 lg:col-span-4 ios-glass-card p-8 flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" /> 物流实况
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {(Array.isArray(state.shipments) ? state.shipments : []).slice(0, 5).map(s => (
                      <div key={s.id} className="p-4 bg-white/2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                              <span className="text-white font-mono">{s.trackingNo}</span>
                              <span className="text-indigo-400">{s.status}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-bold uppercase">{s.productName || "未知载荷"}</div>
                      </div>
                  ))}
                  {(!state.shipments || state.shipments.length === 0) && (
                      <div className="py-20 text-center italic text-slate-700 text-[10px] font-black uppercase tracking-widest">
                        Awaiting Logistics Node
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
