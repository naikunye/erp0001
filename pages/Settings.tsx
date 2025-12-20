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
          showToast('请填写完整的配置信息', 'warning');
          return;
      }
      setIsSaving(true);
      try {
          await bootLean(leanForm.appId, leanForm.appKey, leanForm.serverURL);
          dispatch({ type: 'SET_LEAN_CONFIG', payload: leanForm });
          showToast('连接已建立，正在握手...', 'info');
          const success = await pullFromCloud(false);
          if (!success) {
              showToast('连接成功，但云端暂无数据，请点击“推送到云端”', 'info');
          }
      } catch (e: any) {
          showToast(`物理链路故障: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPush = async () => {
      if (!confirm('此操作将用本地数据【覆盖】云端。确认继续？')) return;
      setIsSyncingNow(true);
      try {
          const success = await syncToCloud(true);
          if (success) showToast('全量数据已推送至 LeanCloud Storage', 'success');
      } finally {
          setIsSyncingNow(false);
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <SettingsIcon className="w-7 h-7 text-indigo-500" /> 系统偏好与同步协议
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-[0.2em] uppercase">Enterprise No-SQL Sync v11.3</p>
        </div>
        <button onClick={() => confirm('确定重置本地环境？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">初始化环境</button>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'theme', label: '视觉外观', icon: Palette },
            { id: 'cloud', label: '云端同步 (LeanCloud)', icon: Cloud },
            { id: 'data', label: '离线管理', icon: Database }
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
              <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                        <Wifi className="w-8 h-8" />
                      </div>
                      <div>
                          <h4 className="text-white font-bold uppercase tracking-tighter flex items-center gap-2">
                              LeanCloud 结构化数据镜像 (REST API)
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                             <p className="text-[10px] text-slate-500 uppercase font-mono">
                                物理链路: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span>
                             </p>
                             <div className="h-3 w-px bg-white/10"></div>
                             <p className="text-[10px] text-slate-500 uppercase font-mono">
                                同步锁: <span className={`font-black ${state.syncAllowed ? 'text-emerald-400' : 'text-rose-500'}`}>{state.syncAllowed ? '已解除 (自动运行)' : '锁定 (等待初次同步)'}</span>
                             </p>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <button 
                        onClick={() => pullFromCloud(false)} 
                        disabled={isPullingNow || state.connectionStatus !== 'connected'}
                        className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                          <CloudDownload className="w-4 h-4" /> 强制拉取
                      </button>
                      <button 
                        onClick={handleManualPush} 
                        disabled={isSyncingNow || state.connectionStatus !== 'connected'}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                      >
                          {isSyncingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudUpload className="w-4 h-4" />} 强制推送
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
                          <input type={showKey ? "text" : "password"} value={leanForm.appKey} onChange={e=>setLeanForm({...leanForm, appKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-indigo-400 font-bold uppercase">REST API 服务器地址</label>
                          <input type="text" value={leanForm.serverURL} onChange={e=>setLeanForm({...leanForm, serverURL: e.target.value})} className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-3 text-sm text-indigo-100 font-mono focus:border-indigo-500 outline-none" placeholder="https://..." />
                      </div>
                      <button onClick={handleSaveConfig} disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">
                          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} 激活同步链路
                      </button>
                  </div>

                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-indigo-400" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">排障与指引</h5>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-relaxed font-mono space-y-4">
                          <p>1. <span className="text-indigo-400 font-bold">数据查看路径：</span>{"登录控制台 -> 结构化数据 -> Class -> Backup"}。您的数据存储在这里，而不是实时通讯模块。</p>
                          <p>2. <span className="text-indigo-400 font-bold">刷新后数据消失：</span>如果您是第一次连接，请点击“强制推送”将当前数据上传。系统随后会自动开启后台每 15 秒的增量保存。</p>
                          <p>3. <span className="text-indigo-400 font-bold">连接超时：</span>请检查您的“REST API 服务器地址”是否包含协议头（https://）并且已在 LeanCloud 后台白名单中。</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
      {/* 视觉主题与数据导出 Tab 保持不变... */}
    </div>
  );
};

export default Settings;
