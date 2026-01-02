
import React, { useMemo } from 'react';
import { 
    Activity, DollarSign, Package, Globe, 
    TrendingUp, Zap, Layers,
    Smartphone
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { useTanxing } from '../context/TanxingContext';

const Dashboard: React.FC = () => {
  const { state } = useTanxing();

  const metrics = useMemo(() => {
    const products = state.products || [];
    const stockValue = products.reduce((acc: number, p: any) => acc + (p.stock * (p.costPrice || 0)), 0);
    return {
      equity: 3620000 + stockValue,
      stockValue,
      activeNodes: (state.shipments || []).filter((s:any) => s.status === 'InTransit').length,
      alerts: products.filter((p:any) => p.stock < 10).length,
      dailySales: [
        { t: '10:00', v: 4000 }, { t: '12:00', v: 3000 }, { t: '14:00', v: 2000 },
        { t: '16:00', v: 2780 }, { t: '18:00', v: 1890 }, { t: '20:00', v: 2390 },
        { t: '22:00', v: 3490 }
      ],
      healthData: [
          {n:'A', v:65}, {n:'B', v:40}, {n:'C', v:85}, {n:'D', v:30}, {n:'E', v:55}
      ]
    };
  }, [state.products, state.shipments]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-4 grid-rows-3 gap-6 h-full min-h-[800px]">
        
        {/* Card 1: Main Equity - Large Square */}
        <div className="col-span-2 row-span-1 glass-card rounded-apple p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-ios-blue/20 rounded-full blur-3xl group-hover:bg-ios-blue/30 transition-all duration-700"></div>
            <div>
                <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-ios-blue/10 rounded-lg"><DollarSign className="w-4 h-4 text-ios-blue" /></div>
                     <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Total Equity</span>
                </div>
                <h2 className="text-5xl font-black text-white tracking-tight">¥{(metrics.equity / 10000).toFixed(2)}w</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">+12.5%</span>
                </div>
                <span className="text-xs text-white/30 font-medium">vs last month</span>
            </div>
        </div>

        {/* Card 2: Inventory Health - Vertical Rectangle */}
        <div className="col-span-1 row-span-2 glass-card rounded-apple p-6 flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center mb-6">
                 <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Stock Health</span>
                 <Package className="w-5 h-5 text-ios-purple" />
             </div>
             
             <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 bg-black/20 rounded-apple-inner p-4 flex flex-col justify-center items-center relative overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={metrics.healthData}>
                            <Bar dataKey="v" radius={[4, 4, 4, 4]}>
                                {metrics.healthData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#AF52DE' : '#5856D6'} fillOpacity={0.8} />
                                ))}
                            </Bar>
                         </BarChart>
                    </ResponsiveContainer>
                    <div className="text-3xl font-black text-white mt-2">89%</div>
                    <div className="text-[10px] text-white/40 uppercase">Healthy</div>
                </div>
                
                <div className="p-4 bg-ios-red/10 border border-ios-red/20 rounded-apple-inner flex items-center justify-between">
                    <div>
                        <div className="text-xl font-bold text-white">{metrics.alerts}</div>
                        <div className="text-[10px] text-ios-red font-bold uppercase">Critical Alerts</div>
                    </div>
                    <Activity className="w-5 h-5 text-ios-red animate-pulse" />
                </div>
             </div>
        </div>

        {/* Card 3: Logistics Map (Conceptual) */}
        <div className="col-span-1 row-span-1 glass-card rounded-apple p-6 flex flex-col justify-between relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div className="flex justify-between items-center z-10">
                 <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Global Logistics</span>
                 <Globe className="w-5 h-5 text-ios-indigo" />
             </div>
             <div className="relative z-10">
                 <div className="text-4xl font-black text-white">{metrics.activeNodes}</div>
                 <div className="text-xs text-white/40 mt-1">Active shipments in transit</div>
             </div>
             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-4 z-10">
                 <div className="h-full bg-ios-indigo w-2/3 animate-pulse"></div>
             </div>
        </div>

        {/* Card 4: Sales Trend - Wide Chart */}
        <div className="col-span-2 row-span-1 glass-card rounded-apple p-0 relative overflow-hidden flex flex-col">
            <div className="absolute top-6 left-6 z-10">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Live Revenue</span>
            </div>
            <div className="flex-1 w-full relative -bottom-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.dailySales}>
                        <defs>
                            <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                        <Area type="monotone" dataKey="v" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Card 5: AI Insights */}
        <div className="col-span-1 row-span-1 glass-card rounded-apple p-6 relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/10 border-white/20">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full"></div>
             <div className="flex items-center gap-2 mb-4">
                 <Zap className="w-5 h-5 text-yellow-300 fill-current" />
                 <span className="text-xs font-black text-white uppercase tracking-widest">Gemini AI</span>
             </div>
             <p className="text-sm font-medium text-white/90 leading-relaxed">
                 "Supply chain velocity increased by 8% this week. Suggest restocking SKU-8821 immediately."
             </p>
             <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-bold text-white uppercase backdrop-blur-md transition-all border border-white/10">
                 View Analysis
             </button>
        </div>

        {/* Card 6: Time / System Status */}
        <div className="col-span-2 row-span-1 glass-card rounded-apple p-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Layers className="w-6 h-6 text-white/60" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">System Status</h3>
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        All Systems Operational
                    </p>
                </div>
            </div>
            
            <div className="flex gap-8 border-l border-white/10 pl-8">
                <div>
                    <div className="text-[10px] text-white/40 font-bold uppercase mb-1">PST (Los Angeles)</div>
                    <div className="text-xl font-mono text-white">09:41 AM</div>
                </div>
                <div>
                    <div className="text-[10px] text-white/40 font-bold uppercase mb-1">CST (Beijing)</div>
                    <div className="text-xl font-mono text-white">00:41 AM</div>
                </div>
            </div>
        </div>

        {/* Card 7: Mobile Link */}
        <div className="col-span-1 row-span-1 glass-card rounded-apple p-6 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-white/5 transition-colors">
            <Smartphone className="w-10 h-10 text-white/20 mb-3 group-hover:text-white group-hover:scale-110 transition-all" />
            <h3 className="text-sm font-bold text-white">Connect Mobile</h3>
            <p className="text-[10px] text-white/40 mt-1">Sync via Feishu/Lark</p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
