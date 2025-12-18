
import React, { useState, useEffect } from 'react';
import { Bell, Search, X, Menu, ChevronDown, CalendarDays, Cloud, RefreshCw, Radio } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { state, dispatch, showToast, syncToCloud } = useTanxing();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  const handleCloudSync = async () => {
      if (!state.supabaseConfig.url || !state.supabaseConfig.key) {
          showToast('请在系统设置中配置云端连接', 'warning');
          return;
      }
      setIsSyncing(true);
      await syncToCloud();
      setIsSyncing(false);
      showToast('数据已即时广播至所有终端', 'success');
  };

  const isCloudConnected = !!(state.supabaseConfig.url && state.supabaseConfig.key);
  const isRealTimeActive = state.supabaseConfig.isRealTime && isCloudConnected;

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 relative z-30">
      <div className="flex items-center gap-4">
        <button 
            className="lg:hidden p-2 text-white/60 hover:text-white"
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: true })}
        >
            <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
      </div>

      <div className="flex items-center space-x-6">
        {/* Real-time Status Pill */}
        {isRealTimeActive && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Live Sync Active</span>
            </div>
        )}

        <div className="flex items-center space-x-4">
            <button 
                onClick={handleCloudSync}
                className={`relative p-2 rounded-full transition-all ${isCloudConnected ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400'}`}
                title={isCloudConnected ? `云端同步中 (上次: ${state.supabaseConfig.lastSync || '未知'})` : "云端未连接"}
            >
                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
            </button>

            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-all ${showNotifications ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#121217]"></span>
            </button>
            
            <div className="relative">
                <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-white/5 transition-all border border-transparent"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">AD</div>
                    <div className="text-left hidden md:block">
                        <div className="text-xs font-bold text-white leading-none mb-0.5">管理员</div>
                        <div className="text-[9px] text-white/40 font-mono leading-none">ROOT</div>
                    </div>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
