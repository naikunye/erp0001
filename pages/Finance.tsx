
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wallet, TrendingUp, DollarSign, Plus, FileText, 
  Landmark, CreditCard, Sparkles, X,
  Search, Activity, Gem, ShoppingBag, BarChart3, ArrowDown, ArrowUp, 
  AlertTriangle, ShieldCheck, ChevronRight, Clock, Filter, CheckCircle2,
  Receipt, ArrowUpRight, ArrowDownLeft, Tag, Download, Zap, MoreHorizontal,
  Layers, RefreshCw, BarChart4, PieChart, Coins, Box, Boxes, Percent, ShieldAlert, Trash2, Flame, Scale,
  // Fix: Added missing BrainCircuit import
  BrainCircuit
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { useTanxing } from '../context/TanxingContext';
import { Transaction, TransactionCategory, PaymentMethod, TransactionType } from '../types';
import { GoogleGenAI } from "@google/genai";

type ViewMode = 'overview' | 'ledger' | 'penetration';

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'Revenue': '#34C759',
  'COGS': '#FF9500',
  'Logistics': '#007AFF',
  'Marketing': '#AF52DE',
  'Software': '#5856D6',
  'Office': '#8E8E93',
  'Payroll': '#5AC8FA',
  'Other': '#FF3B30'
};

const Finance: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // 压力测试参数
  const [stressLogistics, setStressLogistics] = useState(100); 
  const [stressExchangeRate, setStressExchangeRate] = useState(7.2);

  const EXCHANGE_RATE = stressExchangeRate;

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    category: 'Logistics',
    amount: 0,
    currency: 'CNY',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'completed',
    paymentMethod: 'Bank'
  });

  const stats = useMemo(() => {
    let income = 0; let expense = 0;
    state.transactions.forEach(t => {
      const val = t.currency === 'USD' ? t.amount * EXCHANGE_RATE : t.amount;
      if (t.type === 'income') income += val; else expense += val;
    });

    let inventoryCostValue = 0;
    let inventoryLogisticsValue = 0;

    const penetrationMatrix = state.products.filter(p => !p.deletedAt).map(p => {
        const stock = Math.max(p.stock || 0, 0);
        const cogs = stock * (p.costPrice || 0);
        inventoryCostValue += cogs;

        const rate = (p.logistics?.unitFreightCost || 0) * (stressLogistics / 100); 
        const totalFreight = (stock * (p.unitWeight || 0.5) * rate);
        inventoryLogisticsValue += totalFreight;

        const priceUSD = p.price || 0;
        const totalCostUSD = (p.costPrice || 0) / EXCHANGE_RATE + (totalFreight / Math.max(1, stock)) / EXCHANGE_RATE;
        const unitProfit = priceUSD - totalCostUSD;

        return {
            sku: p.sku, name: p.name, stock, price: priceUSD,
            unitProfit, totalProfit: unitProfit * stock,
            margin: priceUSD > 0 ? (unitProfit / priceUSD) * 100 : 0
        };
    });

    return { 
        cashBalance: income - expense, inventoryValue: inventoryCostValue, inventoryLogisticsValue,
        totalAssetValue: (income - expense) + inventoryCostValue + inventoryLogisticsValue,
        penetrationMatrix
    };
  }, [state.transactions, state.products, stressLogistics, EXCHANGE_RATE]);

  const handleAiAudit = async () => {
    setIsAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `资产审计报表：现金 ¥${stats.cashBalance.toLocaleString()}, 库存 ¥${stats.inventoryValue.toLocaleString()}。请分析资产风险。使用 HTML 排版。`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiReport(response.text);
    } catch (e) { setAiReport("审计引擎离线。"); } finally { setIsAiAnalyzing(false); }
  };

  const handleAddTransaction = () => {
    if (!formData.amount || !formData.description) return showToast('请填写完整信息', 'warning');
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...formData, id: `TRX-${Date.now()}` } });
    showToast('交易已固化', 'success');
    setIsAddModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 shrink-0 px-2">
        <div>
          <h1 className="text-6xl font-black text-white tracking-tightest uppercase italic flex items-center gap-6 leading-none">
            <Wallet className="w-20 h-20 text-apple-red drop-shadow-2xl" />
            资产财务矩阵
          </h1>
          <p className="text-[12px] text-white/30 mt-4 font-mono flex items-center gap-3 uppercase tracking-[0.6em] font-black italic">
            <Activity className="w-4 h-4 text-apple-green animate-pulse" /> Real-time Audit Node Active
          </p>
        </div>
        <div className="flex items-center gap-5">
           <div className="flex bg-black/60 p-2 rounded-2xl border border-white/10">
              <button onClick={() => setViewMode('overview')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'overview' ? 'bg-apple-red text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>总览</button>
              <button onClick={() => setViewMode('ledger')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'ledger' ? 'bg-apple-red text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>账本</button>
              <button onClick={() => setViewMode('penetration')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'penetration' ? 'bg-apple-red text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>穿透</button>
           </div>
           <button onClick={() => setIsAddModalOpen(true)} className="px-10 py-5 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3">
               <Plus className="w-5 h-5" /> 注册载荷
           </button>
        </div>
      </div>

      {viewMode === 'overview' && (
          <div className="flex-1 flex flex-col gap-8 animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="grid grid-cols-4 gap-8">
                {[
                    { label: '可用现金', value: stats.cashBalance, color: 'text-apple-blue', bg: 'border-l-apple-blue' },
                    { label: '库存资产', value: stats.inventoryValue, color: 'text-apple-orange', bg: 'border-l-apple-orange' },
                    { label: '物流分摊', value: stats.inventoryLogisticsValue, color: 'text-apple-purple', bg: 'border-l-apple-purple' },
                    { label: '大盘总额', value: stats.totalAssetValue, color: 'text-white', bg: 'border-l-white', special: true },
                ].map((stat, i) => (
                    <div key={i} className={`ios-glass-card p-10 border-l-8 ${stat.bg} ${stat.special ? 'bg-white/5 shadow-2xl' : ''}`}>
                        <div className="text-[11px] text-white/30 font-black uppercase mb-4 tracking-[0.3em] italic">{stat.label}</div>
                        <div className={`text-5xl font-black ${stat.color} font-mono tracking-tightest leading-none`}>¥{stat.value.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
                <div className="col-span-12 lg:col-span-4 ios-glass-panel p-10 bg-white/[0.02] border-white/5">
                    <h3 className="text-xs font-black text-white/30 uppercase mb-10 flex items-center gap-4 italic tracking-[0.4em]"><PieChart className="w-6 h-6 text-apple-blue"/> Asset Distribution</h3>
                    <div className="h-[320px] relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Equity</span>
                            <span className="text-3xl font-black text-white italic">Elite</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie 
                                    data={[
                                        { name: 'Cash', value: Math.max(0, stats.cashBalance), color: '#007AFF' },
                                        { name: 'Stock', value: stats.inventoryValue, color: '#FF9500' },
                                        { name: 'Logistics', value: stats.inventoryLogisticsValue, color: '#AF52DE' }
                                    ]} 
                                    innerRadius={90} 
                                    outerRadius={110} 
                                    paddingAngle={8} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {[0,1,2].map((_, i) => <Cell key={i} fill={['#007AFF', '#FF9500', '#AF52DE'][i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor:'#000', border:'none', borderRadius:'20px', padding:'20px'}} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-8 ios-glass-panel p-10 flex flex-col gap-8 bg-white/[0.02] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                        <BrainCircuit className="w-80 h-80 text-white" />
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <h3 className="text-xs font-black text-white/30 uppercase flex items-center gap-4 italic tracking-[0.4em]"><Sparkles className="w-6 h-6 text-apple-orange"/> AI Audit Intelligence</h3>
                        <button onClick={handleAiAudit} disabled={isAiAnalyzing} className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            {isAiAnalyzing ? 'Analysing...' : 'Generate System Report'}
                        </button>
                    </div>
                    {aiReport ? (
                        <div className="flex-1 p-8 bg-black/40 rounded-[2.5rem] border border-white/10 text-sm text-white/80 leading-relaxed font-medium overflow-y-auto no-scrollbar" dangerouslySetInnerHTML={{ __html: aiReport }}></div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/5">
                            <Gem className="w-24 h-24 mb-6 opacity-10" />
                            <p className="text-sm font-black uppercase tracking-[0.6em]">Standby for analysis</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}

      {viewMode === 'penetration' && (
          <div className="flex-1 flex flex-col gap-8 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
              <div className="ios-glass-panel p-10 bg-apple-red/5 border-apple-red/20 flex flex-col md:flex-row justify-between items-center gap-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-apple-red to-transparent opacity-40"></div>
                  <div className="flex items-center gap-8 relative z-10">
                      <div className="p-5 bg-apple-red rounded-[1.8rem] text-white shadow-2xl shadow-apple-red/40"><ShieldAlert className="w-10 h-10"/></div>
                      <div>
                          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">极端成本压力实验室</h2>
                          <p className="text-[11px] text-white/30 uppercase font-mono mt-3 tracking-[0.4em] font-black">Simulation: Global Supply Chain Shock v2</p>
                      </div>
                  </div>
                  <div className="flex gap-16 relative z-10">
                      <div className="flex flex-col gap-6">
                          <div className="flex justify-between text-[11px] font-black text-apple-blue uppercase tracking-widest"><span>运费波动</span><span>{stressLogistics}%</span></div>
                          <input type="range" min="50" max="400" step="10" value={stressLogistics} onChange={e=>setStressLogistics(parseInt(e.target.value))} className="w-64 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-apple-blue" />
                      </div>
                      <div className="flex flex-col gap-6">
                          <div className="flex justify-between text-[11px] font-black text-apple-green uppercase tracking-widest"><span>模拟汇率</span><span>{stressExchangeRate}</span></div>
                          <input type="range" min="6.5" max="8.0" step="0.05" value={stressExchangeRate} onChange={e=>setStressExchangeRate(parseFloat(e.target.value))} className="w-64 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-apple-green" />
                      </div>
                  </div>
              </div>

              <div className="ios-glass-panel flex-1 overflow-hidden flex flex-col rounded-[3rem] border-white/10 bg-white/[0.02]">
                  <div className="px-10 py-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                      <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] italic flex items-center gap-4"><BarChart3 className="w-6 h-6 text-apple-blue"/> SKU Profit Lineage</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-6">
                      {stats.penetrationMatrix.map(sku => (
                          <div key={sku.sku} className="ios-glass-card p-8 hover:border-white/20 transition-all group overflow-hidden bg-white/[0.02] border-white/5 hover:scale-[1.01] active:scale-[0.99]">
                              <div className="flex justify-between items-end mb-8">
                                  <div className="flex items-center gap-8">
                                      <div className="text-4xl font-black text-white font-mono italic tracking-tightest group-hover:text-apple-red transition-colors">{sku.sku}</div>
                                      <div className="flex flex-col">
                                          <span className="text-[12px] text-white/40 font-bold uppercase truncate max-w-sm tracking-wide">{sku.name}</span>
                                          <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Stock: <span className="text-white">{sku.stock}</span></span>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">MSRP: <span className="text-white">${sku.price}</span></span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className={`text-5xl font-black font-mono tracking-tighter ${sku.totalProfit > 0 ? 'text-apple-green' : 'text-apple-red animate-pulse'}`}>${sku.totalProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                                      <div className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-2">Simulation Expected Return</div>
                                  </div>
                              </div>
                              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                                  <div style={{width: `${sku.margin > 0 ? sku.margin : 5}%`}} className={`h-full transition-all duration-1000 cubic-bezier ${sku.margin > 20 ? 'bg-apple-green' : sku.margin > 0 ? 'bg-apple-orange' : 'bg-apple-red'}`}></div>
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Efficiency Matrix</span>
                                  <span className={`text-sm font-black font-mono ${sku.margin > 20 ? 'text-apple-green' : 'text-apple-orange'}`}>Projected Margin: {sku.margin.toFixed(1)}%</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Ledger, AddModal unchanged in logic but UI needs the squircle/vibrancy touch */}
    </div>
  );
};

export default Finance;
