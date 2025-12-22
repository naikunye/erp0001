import React, { useState, useEffect } from 'react';
import { Bell, Menu, Cloud, RefreshCw, Clock, Globe, Wifi, WifiOff, Loader2, AlertCircle, Zap, CheckCircle2, Radio } from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [now, setNow] = useState(new Date());
  const { state, dispatch, showToast, syncToCloud } = useTanxing();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  const handleCloudSync = async () => {
      if (state.connectionStatus !== 'connected') {
          showToast('云端连接未就绪', 'warning');
          return;
      }
      setIsManualSyncing(true);
      try {
          const success = await syncToCloud(true);
          if (success) showToast('全量数据已强制固化至云端', 'success');
      } finally {
          setIsManualSyncing(false);
      }
  };

  const formatTime = (tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
  };

  const getUSDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(now);
  };

  const renderSaveStatus = () => {
      switch(state.saveStatus) {
          case 'saving':
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-black text-indigo-400 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> UPLOADING...
                  </div>
              );
          case 'saved':
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-400 animate-in fade-in zoom-in">
                      <CheckCircle2 className="w-2.5 h-2.5" /> CLOUD SECURED
                  </div>
              );
          case 'dirty':
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-[9px] font-black text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <Zap className="w-2.5 h-2.5 animate-bounce" /> AUTO-SAVE PENDING
                  </div>
              );
          case 'error':
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-400">
                      <AlertCircle className="w-2.5 h-2.5" /> SYNC ERROR
                  </div>
              );
          default:
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-bold text-slate-500">
                      <Radio className="w-2 h-2 animate-pulse text-indigo-500" /> SYNC ACTIVE
                  </div>
              );
      }
  };

  const getStatusUI = () => {
      if (state.connectionStatus === 'connected') {
          return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Connected</span>
            </div>
          );
      }
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/5 rounded-full opacity-50">
            <WifiOff className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Offline</span>
        </div>
      );
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 relative z-30">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-white/60 hover:text-white" onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: true })}>
            <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
            <div className="mt-1">{renderSaveStatus()}</div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden xl:flex items-center gap-6 pr-6 border-r border-white/5">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">
                    <Globe className="w-2.5 h-2.5" />
                    US DATE (PT)
                </div>
                <div className="text-xs font-mono font-bold text-white">{getUSDate()}</div>
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
            {getStatusUI()}
        </div>

        <div className="flex items-center space-x-4">
            <button 
                onClick={handleCloudSync}
                disabled={isManualSyncing || state.connectionStatus !== 'connected'}
                className={`p-2.5 border rounded-xl transition-all ${state.saveStatus === 'dirty' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 animate-pulse' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'} disabled:opacity-20`}
                title="强制同步全量数据"
            >
                {isManualSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-xs">AD</div>
        </div>
      </div>
    </header>
  );
};

export default Header;