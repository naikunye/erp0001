import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Eye, EyeOff, Wifi, 
    Download, Upload, Palette, Sparkles, Moon, MonitorDot,
    FileJson, Eraser, LogOut, Zap, Loader2, ShieldCheck, CheckCircle2, ExternalLink, CloudUpload, CloudDownload
} from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('cloud');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isPullingNow, setIsPullingNow] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [leanForm, setLeanForm] = useState({
      appId: '',
      appKey: '',
      serverURL: ''
  });

  useEffect(() => {
    if (state.leanConfig) {
        setLeanForm({
            appId: state.leanConfig.appId || '',
            appKey: state.leanConfig.appKey || '',
            serverURL: state.leanConfig.serverURL || ''
        });
    }
  }, [state.leanConfig]);

  const handleSaveConfig = async () => {
      if (!leanForm.appId || !leanForm.appKey || !leanForm.serverURL) {
          showToast('请完整填写配置信息', 'warning');
          return;
      }
      setIsSaving(true);
      try {
          await bootLean(leanForm.appId, leanForm.appKey, leanForm.serverURL);
          dispatch({ type: 'SET_LEAN_CONFIG', payload: leanForm });
          showToast('连接已建立，请点击下方同步按钮初始化数据', 'success');
      } catch (e: any) {
          showToast(`配置错误: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPush = async () => {
      if (!confirm('确定要将本地数据覆盖云端吗？此操作不可撤销。')) return;
      setIsSyncingNow(true);
      try {
          const success = await syncToCloud(true);
          if (success) showToast('本地数据已全量推送到云端', 'success');
      } finally {
          setIsSyncingNow(false);
      }
  };

  const handleManualPull = async () => {
      if (!confirm('确定要从云端恢复数据吗？本地未保存的修改将会丢失。')) return;
      setIsPullingNow(true);
      try {
          await pullFromCloud(false);
      } finally {
          setIsPullingNow(false);
      }
  };

  const handleClearConfig = () => {
      if (confirm('确定要断开云端链路吗？')) {
          localStorage.removeItem('TANXING_LEAN_CONFIG');
          dispatch({ type: 'SET_LEAN_CONFIG', payload: { appId: '', appKey: '', serverURL: '', lastSync: null } });
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
          showToast('已断开云端连接', 'info');
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <SettingsIcon className="w-7 h-7 text-indigo-500" /> 系统偏好与同步协议
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-[0.2em] uppercase">Enterprise No-SQL Sync v11.2</p>
        </div>
        <button onClick={() => confirm('重置全部？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">重置本地存储</button>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'theme', label: '外观主题', icon: Palette },
            { id: 'cloud', label: '云端镜像 (LeanCloud)', icon: Cloud },
            { id: 'data', label: '本地工具', icon: Database }
          ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 py-2.5 text-[10px] font-bold rounded-xl transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'cloud' && (
          <div className="ios-glass-panel p-10 space-y-10 animate-in fade-in duration-500">
              {/* 状态面板 */}
              <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                        <Wifi className="w-8 h-8" />
                      </div>
                      <div>
                          <h4 className="text-white font-bold uppercase tracking-tighter flex items-center gap-2">
                              LeanCloud 数据镜像中心
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                             <p className="text-[10px] text-slate-500 uppercase font-mono">
                                链路: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span>
                             </p>
                             <div className="h-3 w-px bg-white/10"></div>
                             <p className="text-[10px] text-slate-500 uppercase font-mono">
                                自动同步锁: <span className={`font-black ${state.syncAllowed ? 'text-emerald-400' : 'text-rose-500'}`}>{state.syncAllowed ? '已解锁' : '锁定中 (需手动同步一次)'}</span>
                             </p>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <button 
                        onClick={handleManualPull} 
                        disabled={isPullingNow || state.connectionStatus !== 'connected'}
                        className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                          {isPullingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudDownload className="w-4 h-4" />} 从云端拉取
                      </button>
                      <button 
                        onClick={handleManualPush} 
                        disabled={isSyncingNow || state.connectionStatus !== 'connected'}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                      >
                          {isSyncingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudUpload className="w-4 h-4" />} 推送到云端
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">App ID</label>
                          <input type="text" value={leanForm.appId} onChange={e=>setLeanForm({...leanForm, appId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">App Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={leanForm.appKey} onChange={e=>setLeanForm({...leanForm, appKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" />
                              <button onClick={()=>setShowKey(!showKey)} className="absolute right-3 top-3 text-slate-600">{showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-indigo-400 font-bold uppercase">API 服务器地址</label>
                          <input type="text" value={leanForm.serverURL} onChange={e=>setLeanForm({...leanForm, serverURL: e.target.value})} className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-3 text-sm text-indigo-100 font-mono focus:border-indigo-500 outline-none" placeholder="https://..." />
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <button onClick={handleSaveConfig} disabled={isSaving} className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all">
                            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} 应用配置并连接
                        </button>
                        <button onClick={handleClearConfig} className="p-5 bg-white/5 border border-white/10 text-slate-500 hover:text-red-400 rounded-2xl transition-all">
                            <LogOut className="w-6 h-6" />
                        </button>
                      </div>
                  </div>

                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-indigo-400" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">重要提示</h5>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-relaxed font-mono space-y-4">
                          <p>1. <span className="text-white font-bold">刷新页面后：</span>系统会自动尝试从云端拉取最新数据。如果拉取成功，本地数据会被覆盖。</p>
                          <p>2. <span className="text-white font-bold">关于“数据丢失”：</span>如果您在没有点击“推送到云端”的情况下刷新，且云端没有旧数据，本地的修改将会丢失。请养成定期手动或自动同步的习惯。</p>
                          <p>3. <span className="text-white font-bold">同步机制：</span>只有在手动完成一次成功的同步或拉取后，系统才会开启每15秒一次的静默后台同步。</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 其他 Tab 保持原样 */}
      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              {[
                { id: 'ios-glass', name: 'Obsidian Vision', icon: Moon },
                { id: 'midnight-dark', name: 'Midnight OLED', icon: MonitorDot },
                { id: 'cyber-neon', name: 'Cyber Neon', icon: Sparkles }
              ].map(t => (
                  <div key={t.id} onClick={() => dispatch({type:'SET_THEME', payload: t.id as any})} className={`ios-glass-card cursor-pointer border p-6 flex flex-col items-center gap-4 ${state.theme === t.id ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-white/10 hover:border-white/30'}`}>
                      <t.icon className="w-12 h-12 text-indigo-400" />
                      <h4 className="font-bold text-white text-xs">{t.name}</h4>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default Settings;
