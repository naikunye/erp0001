import React, { useState, useEffect } from 'react';
import { Bell, Menu, Cloud, RefreshCw, Clock, Globe, Wifi, WifiOff, Loader2, AlertCircle, Zap, CheckCircle2, Radio, ShieldAlert } from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [now, setNow] = useState(new Date());
  const { state, dispatch, showToast, syncToCloud, bootLean } = useTanxing();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  const handleCloudSync = async () => {
      if (state.connectionStatus !== 'connected') {
          if (state.leanConfig.appId) {
              showToast('正在尝试重新激活物理链路...', 'info');
              try {
                  await bootLean(state.leanConfig.appId, state.leanConfig.appKey, state.leanConfig.serverURL);
              } catch (e: any) {
                  showToast(e.message, 'error');
                  dispatch({ type: 'NAVIGATE', payload: { page: 'settings' } });
                  return;
              }
          } else {
              showToast('云端配置未就绪', 'warning');
              dispatch({ type: 'NAVIGATE', payload: { page: 'settings' } });
              return;
          }
      }

      setIsManualSyncing(true);
      try {
          const success = await syncToCloud(true);
          if (success) {
              showToast('云端镜像已强制更新', 'success');
          } else {
              showToast('同步指令被拦截，请检查 LeanCloud 控制台安全域名', 'error');
          }
      } catch (e: any) {
          showToast(`通信故障: ${e.message}`, 'error');
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
      if (state.connectionStatus === 'error') {
          return (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600/20 border border-red-500/50 rounded text-[9px] font-black text-red-400 animate-pulse">
                  <ShieldAlert className="w-2.5 h-2.5" /> SECURITY BLOCK (CORS)
              </div>
          );
      }

      switch(state.saveStatus) {
          case 'saving':
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-black text-indigo-400 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> SYNCING...
                  </div>
              );
          case 'saved':
              return (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-400 animate-in fade-in zoom-in">
                        <CheckCircle2 className="w-2.5 h-2.5" /> CLOUD SECURED
                    </div>
                    {state.leanConfig.lastSync && (
                        <span className="text-[8px] text-slate-600 font-mono font-bold uppercase tracking-tighter">
                            Last Ack: {state.leanConfig.lastSync}
                        </span>
                    )}
                  </div>
              );
          case 'dirty':
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-[9px] font-black text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <Zap className="w-2.5 h-2.5 animate-bounce" /> DATA MODIFIED
                  </div>
              );
          case 'error':
              return (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-400">
                      <AlertCircle className="w-2.5 h-2.5" /> SYNC FAILED
                  </div>
              );
          default:
              return (
                  <div className={`flex items-center gap-1.5 px-2 py-1 border rounded text-[8px] font-bold transition-all ${state.connectionStatus === 'connected' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                      <Radio className={`w-2 h-2 ${state.connectionStatus === 'connected' ? 'animate-pulse text-indigo-500' : 'text-slate-700'}`} /> 
                      {state.connectionStatus === 'connected' ? 'SYNC READY' : 'SYNC OFF'}
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
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Live Link</span>
            </div>
          );
      }
      if (state.connectionStatus === 'error') {
          return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-500/30 rounded-full">
                <WifiOff className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Access Denied</span>
            </div>
          );
      }
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/5 rounded-full opacity-50">
            <WifiOff className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Standalone</span>
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
                    SYSTEM DATE (PT)
                </div>
                <div className="text-xs font-mono font-bold text-white">{getUSDate()}</div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">New York</span>
                    <span className="text-xs font-mono text-white/70">{formatTime('America/New_York')}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">Los Angeles</span>
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
                disabled={isManualSyncing}
                className={`p-2.5 border rounded-xl transition-all shadow-xl active:scale-95 disabled:opacity-30 ${
                    isManualSyncing ? 'bg-indigo-600 text-white' : 
                    state.saveStatus === 'dirty' ? 'bg-amber-500 border-amber-400 text-black animate-pulse' : 
                    state.connectionStatus === 'error' ? 'bg-red-600 border-red-500 text-white' : 
                    'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="手动同步当前快照到云端"
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