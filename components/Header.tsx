import React, { useState, useEffect } from 'react';
import { Bell, Menu, Cloud, RefreshCw, Clock, Globe, Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [now, setNow] = useState(new Date());
  const { state, dispatch, showToast, syncToCloud } = useTanxing();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  const handleCloudSync = async () => {
      if (!state.firebaseConfig?.apiKey || !state.firebaseConfig?.projectId) {
          showToast('请先在系统设置中配置 Firebase', 'warning');
          return;
      }
      setIsSyncing(true);
      try {
          await syncToCloud(true);
          showToast('已强制同步至云端', 'success');
      } catch (e) {
          showToast('同步失败', 'error');
      } finally {
          setIsSyncing(false);
      }
  };

  const formatTime = (tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
  };

  const getUSDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(now);
  };

  const getUSWeekday = () => {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long',
    }).format(now);
  };

  const getStatusUI = () => {
      switch(state.connectionStatus) {
          case 'connected':
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Realtime Active</span>
                    </div>
                  ),
                  iconClass: "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              };
          case 'connecting':
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tighter">Linking...</span>
                    </div>
                  ),
                  iconClass: "text-amber-400 animate-pulse"
              };
          case 'error':
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Link Error</span>
                    </div>
                  ),
                  iconClass: "text-red-500 animate-bounce"
              };
          default:
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/5 rounded-full opacity-50">
                        <WifiOff className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Offline Mode</span>
                    </div>
                  ),
                  iconClass: "text-slate-600"
              };
      }
  };

  const statusUI = getStatusUI();

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
        <div className="hidden xl:flex items-center gap-6 pr-6 border-r border-white/5">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">
                    <Globe className="w-2.5 h-2.5" />
                    US DATE (PT)
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">{getUSWeekday()}</span>
                    <span className="text-xs font-mono font-bold text-white">{getUSDate()}</span>
                </div>
            </div>
            
            <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">美东 ET</span>
                <span className="text-xs font-mono text-white/70">{formatTime('America/New_York')}</span>
            </div>

            <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">美中 CT</span>
                <span className="text-xs font-mono text-white/70">{formatTime('America/Chicago')}</span>
            </div>

            <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">美西 PT</span>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                    {formatTime('America/Los_Angeles')}
                </span>
            </div>
        </div>

        <div className="hidden md:block">
            {statusUI.pill}
        </div>

        <div className="flex items-center space-x-4">
            <button 
                onClick={handleCloudSync}
                disabled={isSyncing}
                className={`relative p-2 rounded-full transition-all hover:bg-white/5 ${statusUI.iconClass}`}
                title={state.connectionStatus === 'connected' ? `Firebase 已连接 (上次同步: ${state.firebaseConfig?.lastSync || '未知'})` : "云端连接未就绪"}
            >
                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
            </button>

            <button className={`relative p-2 rounded-full transition-all text-white/60 hover:text-white hover:bg-white/5`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#121217]"></span>
            </button>
            
            <div className="relative">
                <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-white/5 transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">AD</div>
                    <div className="text-left hidden md:block">
                        <div className="text-xs font-bold text-white leading-none mb-0.5">管理员</div>
                        <div className="text-[9px] text-white/40 font-mono leading-none uppercase">Session: {SESSION_ID}</div>
                    </div>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;