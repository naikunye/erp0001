
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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, trend, trendUp, icon: Icon, accentColor = 'cyan' }) => {
  
  const colors = {
      cyan: 'text-cyan-400 from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
      purple: 'text-purple-400 from-purple-500/20 to-pink-500/20 border-purple-500/30',
      green: 'text-emerald-400 from-emerald-400/20 to-teal-500/20 border-emerald-500/30',
      orange: 'text-orange-400 from-orange-400/20 to-red-500/20 border-orange-500/30',
      blue: 'text-blue-400 from-blue-500/20 to-indigo-600/20 border-blue-500/30',
      pink: 'text-pink-400 from-pink-500/20 to-rose-500/20 border-pink-500/30'
  };

  const trendColor = trendUp ? 'text-emerald-400' : 'text-rose-400';
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;
  
  return (
    <div className="glass-card p-5 flex flex-col justify-between h-full group">
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3 opacity-50" />
                {title}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-display font-bold text-white tracking-wide text-glow">
                    {value}
                </h3>
                {subValue && <span className="text-xs text-slate-500 font-mono self-end mb-1">{subValue}</span>}
            </div>
        </div>
        
        {Icon && (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[accentColor].replace('text-', '').replace('border-', '')} flex items-center justify-center border ${colors[accentColor].split(' ')[2]} opacity-80 group-hover:opacity-100 transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)] group-hover:scale-110`}>
                <Icon className={`w-5 h-5 ${colors[accentColor].split(' ')[0]}`} />
            </div>
        )}
      </div>
      
      <div className="relative z-10 pt-3 border-t border-white/5 flex items-center justify-between">
         {trend && (
            <div className={`flex items-center gap-1 ${trendColor} text-xs font-bold bg-black/30 px-2 py-1 rounded border border-white/5`}>
                <TrendIcon className="w-3 h-3" /> 
                {trend}
            </div>
         )}
         {/* Simple sparkline or bar */}
         <div className="h-1 flex-1 mx-3 bg-slate-800 rounded-full overflow-hidden">
             <div className={`h-full w-2/3 bg-current opacity-60 ${colors[accentColor].split(' ')[0]}`}></div>
         </div>
      </div>
    </div>
  );
};

export default StatCard;
