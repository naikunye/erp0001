
import React, { useState, useEffect } from 'react';
import { Bell, Menu, Cloud, RefreshCw, Globe, WifiOff, Loader2, Zap, CheckCircle2, Radio, ShieldAlert, CloudDownload, Users2, ShieldCheck } from 'lucide-react';
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
          await pullFromCloud(true);
      } finally {
          setIsPulling(false);
      }
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
                {state.connectionStatus === 'connected' && (
                    <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md animate-in fade-in">
                        <Users2 className="w-3 h-3 text-indigo-400" />
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">Live Collaboration Active</span>
                    </div>
                )}
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
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 relative">
                {state.saveStatus === 'dirty' && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-black animate-pulse shadow-lg z-10"></div>
                )}
                <button 
                    onClick={handlePull}
                    disabled={isPulling}
                    className={`p-2 rounded-lg transition-all hover:bg-white/10 ${isPulling ? 'text-indigo-400 animate-spin' : 'text-slate-400'}`}
                    title="强制从云端对齐最新数据"
                >
                    <CloudDownload className="w-4.5 h-4.5" />
                </button>
                <div 
                    className={`p-2 rounded-lg transition-all ${state.saveStatus === 'dirty' ? 'text-indigo-400' : 'text-emerald-500'}`}
                    title={state.saveStatus === 'dirty' ? "检测到本地修改，正在准备自动同步..." : "所有设备数据已对齐"}
                >
                    {/* Fix: Line 90 - Use ShieldCheck from lucide-react */}
                    {state.saveStatus === 'dirty' ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <ShieldCheck className="w-4.5 h-4.5" />}
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-xs shadow-inner uppercase">Admin</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
