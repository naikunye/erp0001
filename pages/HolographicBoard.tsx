
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Globe, Activity, Terminal, Package, Truck, 
  DollarSign, AlertOctagon
} from 'lucide-react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, Cell, XAxis } from 'recharts';
import { useTanxing } from '../context/TanxingContext';
import { Page } from '../types';

interface HolographicBoardProps {
    onNavigate: (page: Page) => void;
}

const HolographicBoard: React.FC<HolographicBoardProps> = ({ onNavigate }) => {
  const { state } = useTanxing(); // Global Real Data
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Real Data Calculation ---
  const totalRevenue = state.orders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const lowStockCount = state.products.filter(p => p.stock <= (p.safetyStockDays || 10) * (p.dailyBurnRate || 1)).length;
  const totalStockValue = state.products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);

  // --- Generate Real Logs ---
  useEffect(() => {
      const generatedLogs: string[] = [];
      const timeStr = new Date().toLocaleTimeString('zh-CN', {hour12: false});

      // 1. Order Logs
      state.orders.slice(0, 5).forEach(o => {
          generatedLogs.push(`[${o.date}] [Order] 新增订单 ${o.id} (${o.customerName}) - ¥${o.total}`);
      });

      // 2. Inventory Logs
      state.products.forEach(p => {
          if (p.stock < 10) {
              generatedLogs.push(`[${timeStr}] [Alert] SKU-${p.sku} 库存严重不足 (${p.stock}件)`);
          }
      });

      // 3. Shipment Logs
      state.shipments.slice(0, 3).forEach(s => {
          generatedLogs.push(`[${s.lastUpdate}] [Logistics] ${s.trackingNo} 状态更新: ${s.status}`);
      });

      // 4. System Heartbeat
      generatedLogs.push(`[${timeStr}] [System] 数据节点同步完成`);
      
      setLogs(generatedLogs.reverse());
  }, [state]);

  // --- Clock ---
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Channel Data
  const channelData = useMemo(() => {
      const data = [
          { name: 'Amazon', value: 0, color: '#f59e0b' },
          { name: 'TikTok', value: 0, color: '#db2777' },
          { name: 'Shopify', value: 0, color: '#10b981' },
      ];
      state.orders.forEach(order => {
          const source = order.customerName.includes('Amazon') ? 'Amazon' : 
                         order.customerName.includes('TikTok') ? 'TikTok' : 'Shopify';
          const target = data.find(d => d.name === source);
          if (target) target.value += order.total;
      });
      return data;
  }, [state.orders]);

  return (
    <div className="h-[calc(100vh-6rem)] bg-black overflow-hidden rounded-2xl relative flex flex-col p-6 font-mono text-cyan-500 selection:bg-cyan-500/30">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#000000_120%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
        
        {/* Top Status Bar */}
        <div className="relative z-10 flex justify-between items-end mb-6 border-b border-cyan-900/50 pb-4">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-widest text-cyan-50 uppercase">探行·指挥中枢</h1>
                    <p className="text-xs text-cyan-700 mt-1">REAL-TIME DATA CENTER</p>
                </div>
            </div>
            <div className="flex gap-12">
                <div className="text-right">
                    <div className="text-[10px] text-cyan-700 uppercase tracking-widest">System Time</div>
                    <div className="text-2xl font-bold text-cyan-300 font-mono">{currentTime.toLocaleTimeString('en-GB')}</div>
                </div>
            </div>
        </div>

        {/* Main Content Grid */}
        <div className="relative z-10 grid grid-cols-12 gap-6 flex-1 min-h-0">
            
            {/* Left Column: Fulfillment & Logs */}
            <div className="col-span-3 flex flex-col gap-4">
                {/* Fulfillment Monitor */}
                <div 
                    onClick={() => onNavigate('orders')}
                    className="border border-cyan-900/50 bg-black/40 p-4 rounded-xl relative overflow-hidden group cursor-pointer hover:border-cyan-500/50 transition-all"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><Package className="w-16 h-16" /></div>
                    <h3 className="text-cyan-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> 履约监控 (Fulfillment)
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <div className="flex justify-between text-xs text-cyan-300 mb-1">
                                <span>待处理订单 (Pending)</span>
                                <span className="font-bold text-white">{pendingOrders} 单</span>
                            </div>
                            <div className="h-2 w-full bg-cyan-950 rounded-full overflow-hidden border border-cyan-900/30">
                                <div className="h-full bg-cyan-600" style={{width: `${Math.min(100, pendingOrders * 5)}%`}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live System Logs */}
                <div className="flex-1 border border-cyan-900/50 bg-black/40 backdrop-blur-sm p-4 rounded-xl flex flex-col overflow-hidden relative">
                    <h3 className="text-cyan-500 text-xs font-bold uppercase mb-3 flex items-center gap-2 border-b border-cyan-900/30 pb-2">
                        <Terminal className="w-4 h-4" /> 实时业务流 (Logs)
                    </h3>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2.5 text-cyan-400/90 scrollbar-none pb-4" ref={scrollRef}>
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-cyan-800 shrink-0">&gt;</span>
                                <span className={log.includes('[Alert]') ? 'text-red-400 font-bold' : log.includes('[Order]') ? 'text-emerald-400' : 'text-cyan-300'}>{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Center Column: Core Metrics & Map */}
            <div className="col-span-6 flex flex-col gap-6 relative">
                {/* Big Number Cards */}
                <div className="grid grid-cols-1 gap-4">
                    <div 
                        onClick={() => onNavigate('finance')}
                        className="border border-cyan-500/30 bg-cyan-950/20 p-5 rounded-xl flex flex-col justify-center relative overflow-hidden cursor-pointer hover:bg-cyan-900/30 transition-all"
                    >
                        <div className="text-xs text-cyan-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> 累计 GMV (Total Sales)
                        </div>
                        <div className="text-5xl font-black text-white font-mono tracking-tight">
                            ¥{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Visualization Area */}
                <div className="flex-1 border border-cyan-800/30 bg-black/40 rounded-xl relative overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-cyan-900/30 flex justify-between items-center">
                        <h3 className="text-cyan-400 text-sm font-bold flex items-center gap-2">
                            <Globe className="w-4 h-4" /> 渠道销售构成 (Channel Mix)
                        </h3>
                    </div>
                    
                    <div className="flex-1 p-6">
                        {/* Channel Bar Chart */}
                        <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={channelData}>
                                    <XAxis dataKey="name" stroke="#0e7490" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(6,182,212,0.1)'}}
                                        contentStyle={{ backgroundColor: '#000', borderColor: '#0e7490', color: '#fff' }}
                                    />
                                    <Bar dataKey="value" barSize={80}>
                                        {channelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Risks & Overview */}
            <div className="col-span-3 flex flex-col gap-6">
                
                {/* Asset Brief */}
                <div className="p-6 border border-cyan-900/50 rounded-xl bg-cyan-950/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-cyan-600 font-bold uppercase">当前库存资产</span>
                        <Package className="w-4 h-4 text-cyan-700" />
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">
                        ¥{(totalStockValue / 10000).toFixed(2)}w
                    </div>
                    <div className="text-[10px] text-cyan-700 mt-1">
                        基于采购成本核算
                    </div>
                </div>

                {/* Risk Alert Area */}
                <div className="flex-1 border border-red-900/30 bg-red-950/5 p-4 rounded-xl relative overflow-hidden">
                    <h3 className="text-red-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4" /> 异常监控 (Risks)
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 border border-red-500/30 bg-red-900/10 rounded flex items-start gap-3">
                            <div className="text-center min-w-[30px]">
                                <div className="text-xl font-bold text-red-500 font-mono">{lowStockCount}</div>
                                <div className="text-[8px] text-red-400">SKUs</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-red-400">库存告急</div>
                                <div className="text-[10px] text-red-300/70">触达安全库存警戒线</div>
                            </div>
                        </div>
                        
                        {pendingOrders > 10 && (
                            <div className="p-3 border border-orange-500/30 bg-orange-900/10 rounded flex items-start gap-3">
                                <div className="text-center min-w-[30px]">
                                    <Activity className="w-5 h-5 text-orange-500 mx-auto mt-1" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-400">订单积压</div>
                                    <div className="text-[10px] text-orange-300/70">待处理订单较多，请关注。</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default HolographicBoard;
