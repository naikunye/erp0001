import React, { useState, useEffect } from 'react';
import { Bell, Menu, Cloud, RefreshCw, Clock, Globe, Wifi, WifiOff, Loader2, AlertCircle, Zap } from 'lucide-react';
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
      if (state.connectionStatus !== 'connected') {
          showToast('云端连接未就绪', 'warning');
          return;
      }
      
      setIsSyncing(true);
      
      const timeout = setTimeout(() => {
          if (isSyncing) {
              setIsSyncing(false);
              showToast('同步响应超时，请检查服务器 URL', 'error');
          }
      }, 30000);

      try {
          const success = await syncToCloud(true);
          if (success) {
              showToast('云端镜像同步成功', 'success');
          }
      } catch (e) {
          showToast('核心链路发生异常', 'error');
      } finally {
          clearTimeout(timeout);
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
    // 强制使用洛杉矶时区计算当前日期
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(now);
  };

  const getStatusUI = () => {
      switch(state.connectionStatus) {
          case 'connected':
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full ring-1 ring-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Cloud Linked</span>
                    </div>
                  ),
                  iconClass: "text-emerald-400"
              };
          case 'connecting':
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tighter">Handshaking...</span>
                    </div>
                  ),
                  iconClass: "text-amber-400 animate-pulse"
              };
          case 'error':
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Link Broken</span>
                    </div>
                  ),
                  iconClass: "text-red-500 animate-bounce"
              };
          default:
              return {
                  pill: (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/5 rounded-full opacity-50">
                        <WifiOff className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Local Cache</span>
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
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            {title}
            {state.connectionStatus === 'connected' && <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />}
        </h1>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden xl:flex items-center gap-6 pr-6 border-r border-white/5">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">
                    <Globe className="w-2.5 h-2.5" />
                    US DATE (PT)
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold font-mono">PT</span>
                    <span className="text-xs font-mono font-bold text-white">{getUSDate()}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">纽约 ET</span>
                    <span className="text-xs font-mono text-white/70">{formatTime('America/New_York')}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">芝加哥 CT</span>
                    <span className="text-xs font-mono text-white/70">{formatTime('America/Chicago')}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">洛杉矶 PT</span>
                    <span className="text-xs font-mono text-indigo-100 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 font-bold">
                        {formatTime('America/Los_Angeles')}
                    </span>
                </div>
            </div>
        </div>

        <div className="hidden md:block">
            {statusUI.pill}
        </div>

        <div className="flex items-center space-x-4">
            <button 
                onClick={handleCloudSync}
                disabled={isSyncing || state.connectionStatus !== 'connected'}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white disabled:opacity-20"
                title="手动云端同步"
            >
                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-xs cursor-pointer hover:border-indigo-500 transition-colors">
                AD
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;