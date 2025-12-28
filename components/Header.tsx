
import React, { useState, useEffect } from 'react';
import { Bell, Menu, Cloud, RefreshCw, Globe, WifiOff, Loader2, Zap, CheckCircle2, Radio, ShieldAlert, CloudDownload } from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [now, setNow] = useState(new Date());
  const { state, dispatch, showToast, syncToCloud, pullFromCloud } = useTanxing();
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  const handlePull = async () => {
      if (state.connectionStatus !== 'connected') {
          showToast('尚未建立云端连接', 'warning');
          return;
      }
      setIsPulling(true);
      try {
          await pullFromCloud(false);
      } finally {
          setIsPulling(false);
      }
  };

  const handlePush = async () => {
      if (state.connectionStatus !== 'connected') {
          showToast('云端配置未就绪', 'warning');
          dispatch({ type: 'NAVIGATE', payload: { page: 'settings' } });
          return;
      }
      await syncToCloud(true);
      showToast('云端镜像已强制覆盖', 'success');
  };

  const formatTime = (tz: string) => {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 relative z-30">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-white/60 hover:text-white" onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}>
            <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-wide uppercase italic">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${state.connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">NODE://{SESSION_ID}</span>
            </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden xl:flex items-center gap-6 pr-8 border-r border-white/5 font-mono">
            <div className="flex flex-col items-end">
                <span className="text-[9px] text-indigo-400 font-bold uppercase">Los Angeles</span>
                <span className="text-xs text-white">{formatTime('America/Los_Angeles')}</span>
            </div>
            <div className="flex flex-col items-end border-l border-white/10 pl-6">
                <span className="text-[9px] text-emerald-400 font-bold uppercase">Beijing</span>
                <span className="text-xs text-white">{formatTime('Asia/Shanghai')}</span>
            </div>
        </div>

        <div className="flex items-center space-x-4">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button 
                    onClick={handlePull}
                    disabled={isPulling}
                    className={`p-2 rounded-lg transition-all hover:bg-white/10 ${isPulling ? 'text-indigo-400 animate-spin' : 'text-slate-400'}`}
                    title="从云端手动同步"
                >
                    <CloudDownload className="w-4.5 h-4.5" />
                </button>
                <button 
                    onClick={handlePush}
                    className={`p-2 rounded-lg transition-all hover:bg-white/10 ${state.saveStatus === 'dirty' ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`}
                    title="强制全量推送到云端"
                >
                    <Cloud className="w-4.5 h-4.5" />
                </button>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-xs shadow-inner">AD</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
