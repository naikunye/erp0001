
import React, { useState, useEffect } from 'react';
import { Bell, Search, X, Menu, ChevronDown, Command } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { dispatch } = useTanxing();

  const mockNotifications = [
      { id: 1, title: '库存紧急预警', desc: 'SKU: MA-001 库存不足 10 件', time: '10分钟前', type: 'alert' },
      { id: 2, title: '新订单提醒', desc: 'TikTok Shop 订单 #PO-8823', time: '1小时前', type: 'info' },
  ];

  useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-transparent">
      <div className="flex items-center gap-4">
        <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: true })}
        >
            <Menu className="w-5 h-5" />
        </button>

        <div>
            <h1 className="text-xl font-bold text-white tracking-wide font-display uppercase">{title}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Clock */}
        <div className="hidden xl:flex items-center gap-4 mr-2 text-xs font-mono text-slate-400 bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-300">CN</span>
                <span className="text-white font-bold">{currentTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-300">NY</span>
                <span className="text-white font-bold">{currentTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>

        {/* Search */}
        <div className="relative hidden lg:block group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            readOnly
            placeholder="Search / AI Command..."
            className="block w-64 pl-9 pr-12 py-2 rounded-lg bg-black/20 border border-white/10 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all text-xs cursor-pointer hover:border-white/20 font-mono"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
             <span className="text-[10px] text-slate-500 font-mono border border-white/10 rounded px-1.5 py-0.5 bg-white/5">⌘K</span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex items-center space-x-3">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-all border ${showNotifications ? 'bg-white/10 text-white border-white/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'}`}
            >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_#ef4444]"></span>
            </button>
            
            {showNotifications && (
                <div className="absolute top-14 right-6 w-80 glass-card z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Logs</span>
                        <button onClick={() => setShowNotifications(false)}><X className="w-3 h-3 text-slate-500 hover:text-white"/></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {mockNotifications.map(n => (
                            <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer last:border-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold ${n.type === 'alert' ? 'text-red-400' : 'text-cyan-400'}`}>{n.title}</span>
                                    <span className="text-[9px] text-slate-600 font-mono">{n.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-snug">{n.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <button className="flex items-center gap-3 pl-2 py-1 pr-3 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-900 to-blue-900 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-200 shadow-inner">
                    AD
                </div>
                <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-white leading-none mb-0.5">Admin</div>
                    <div className="text-[9px] text-slate-500 font-mono leading-none">LEVEL 1</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
