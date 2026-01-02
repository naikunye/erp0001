
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, trend, trendUp }) => {
  return (
    <div className="chrono-panel p-4 border border-white/5 hover:border-titan-accent/30 transition-all group overflow-hidden relative">
      <div className="scanline"></div>
      <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
              // {title}
          </span>
          {trend && (
              <span className={`text-[9px] font-mono font-bold ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {trendUp ? '+' : '-'}{trend}%
              </span>
          )}
      </div>
      
      <div className="flex items-baseline gap-2">
          <span className="text-2xl font-light text-white font-mono tracking-tighter group-hover:text-titan-accent transition-colors">
              {value}
          </span>
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{subValue}</span>
      </div>
      
      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${trendUp ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`} 
            style={{ width: trendUp ? '70%' : '40%' }}
          ></div>
      </div>
    </div>
  );
};

export default StatCard;
