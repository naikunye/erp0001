
import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: LucideIcon;
  accentColor?: 'purple' | 'green' | 'blue' | 'orange' | 'cyan' | 'pink';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, trend, trendUp, icon: Icon, accentColor = 'cyan', loading = false }) => {
  
  const colors = {
      cyan: 'text-cyan-400 from-cyan-500/10 to-transparent border-cyan-500/20 shadow-cyan-500/10',
      purple: 'text-purple-400 from-purple-500/10 to-transparent border-purple-500/20 shadow-purple-500/10',
      green: 'text-emerald-400 from-emerald-500/10 to-transparent border-emerald-500/20 shadow-emerald-500/10',
      orange: 'text-orange-400 from-orange-500/10 to-transparent border-orange-500/20 shadow-orange-500/10',
      blue: 'text-blue-400 from-blue-500/10 to-transparent border-blue-500/20 shadow-blue-500/10',
      pink: 'text-pink-400 from-pink-500/10 to-transparent border-pink-500/20 shadow-pink-500/10'
  };

  const trendColor = trendUp ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;
  
  // Extract base color class for icon bg
  const iconBaseColor = colors[accentColor].split(' ')[0];

  return (
    <div className="ios-glass-card p-6 flex flex-col justify-between h-full group relative overflow-hidden">
      
      {loading ? (
        <div className="animate-pulse flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-3 w-full">
                    <div className="h-3 w-24 bg-slate-700/50 rounded"></div>
                    <div className="h-8 w-32 bg-slate-700/50 rounded"></div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-700/50"></div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="h-5 w-16 bg-slate-700/50 rounded"></div>
                <div className="flex gap-1 items-end h-4">
                    {[30, 50, 40, 60, 40, 70].map((h, i) => (
                        <div key={i} className="w-1 bg-slate-700/50 rounded-t-sm" style={{height: `${h}%`}}></div>
                    ))}
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between animate-in fade-in duration-700 slide-in-from-bottom-2">
            {/* Background Gradient Blob on Hover */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${colors[accentColor].split(' ')[1]} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 opacity-50" />
                        {title}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-4xl font-display font-bold text-white tracking-tight drop-shadow-md">
                            {value}
                        </h3>
                        {subValue && <span className="text-xs text-slate-500 font-mono self-end mb-1.5">{subValue}</span>}
                    </div>
                </div>
                
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg ${iconBaseColor}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            
            <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                {trend && (
                    <div className={`flex items-center gap-1 ${trendColor} text-xs font-bold px-2 py-1 rounded border`}>
                        <TrendIcon className="w-3 h-3" /> 
                        {trend}
                    </div>
                )}
                {/* Mini Sparkline Visualization */}
                <div className="flex gap-0.5 items-end h-4 opacity-50">
                    {[30, 50, 40, 70, 50, 80].map((h, i) => (
                        <div key={i} className={`w-1 rounded-t-sm ${iconBaseColor.replace('text-', 'bg-')}`} style={{ height: `${h}%` }}></div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
