import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Eye, EyeOff, Wifi, 
    Download, Upload, Palette, Sparkles, Moon, MonitorDot,
    FileJson, Eraser, LogOut, Zap, Loader2, ShieldCheck, CheckCircle2, ExternalLink, CloudUpload, CloudDownload, Info, MousePointer2, AlertCircle, ListChecks, DatabaseZap
} from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('cloud');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isPullingNow, setIsPullingNow] = useState(false);
  const [cloudTableExists, setCloudTableExists] = useState<boolean | null>(null);

  const [leanForm, setLeanForm] = useState({ appId: '', appKey: '', serverURL: '' });

  useEffect(() => {
    if (state.leanConfig) {
        setLeanForm({
            appId: state.leanConfig.appId || '',
            appKey: state.leanConfig.appKey || '',
            serverURL: state.leanConfig.serverURL || ''
        });
    }
  }, [state.leanConfig]);

  const checkCloudStatus = async () => {
      try {
          const success = await pullFromCloud(true);
          setCloudTableExists(success);
      } catch (e) {
          setCloudTableExists(false);
      }
  };

  useEffect(() => {
      if (state.connectionStatus === 'connected') {
          checkCloudStatus();
      }
  }, [state.connectionStatus]);

  const handleSaveConfig = async () => {
      if (!leanForm.appId || !leanForm.appKey || !leanForm.serverURL) {
          showToast('请完整填写配置信息', 'warning');
          return;
      }
      setIsSaving(true);
      try {
          await bootLean(leanForm.appId, leanForm.appKey, leanForm.serverURL);
          dispatch({ type: 'SET_LEAN_CONFIG', payload: leanForm });
          await checkCloudStatus();
          showToast('物理连接验证成功', 'success');
      } catch (e: any) {
          showToast(`连接失败: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPush = async () => {
      if (!confirm('此操作将本地数据推送到云端。如果是第一次使用，这将创建 Backup 表。')) return;
      setIsSyncingNow(true);
      try {
          const success = await syncToCloud(true);
          if (success) {
              setCloudTableExists(true);
              showToast('全量数据推送成功！Backup 表已创建。', 'success');
          }
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
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-[0.2em] uppercase">Enterprise Cloud Sync v11.6</p>
        </div>
        <button onClick={() => confirm('确定初始化？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">初始化环境</button>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'theme', label: '视觉外观', icon: Palette },
            { id: 'cloud', label: '云端同步', icon: Cloud },
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
          <div className="space-y-6 animate-in fade-in duration-500">
              {/* 位置指引 */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-6 flex items-start gap-5">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl shrink-0"><DatabaseZap className="w-6 h-6 text-indigo-400" /></div>
                  <div>
                      <h4 className="text-indigo-300 font-black text-sm uppercase tracking-wider">LeanCloud 后台核对指南</h4>
                      <div className="text-xs text-indigo-100/60 mt-2 leading-relaxed space-y-2">
                        <p>1. 您目前已经在正确页面：<span className="text-white font-bold underline">“结构化数据”</span>。</p>
                        <p>2. 如果左侧列表没有 <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">Backup</code> 表，说明您还没有点下方的 <span className="text-white font-bold">“立即同步到云端”</span>。</p>
                        <p>3. 只要推送一次，云端就会生成表格，从此数据永不丢失。</p>
                      </div>
                  </div>
              </div>

              <div className="ios-glass-panel p-10 space-y-10">
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-8 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                            <Wifi className="w-8 h-8" />
                          </div>
                          <div>
                              <h4 className="text-white font-bold uppercase tracking-tighter flex items-center gap-2">REST API 实时状态</h4>
                              <div className="flex items-center gap-4 mt-1">
                                 <p className="text-[10px] text-slate-500 uppercase font-mono">链路: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span></p>
                                 <div className="h-3 w-px bg-white/10"></div>
                                 <p className="text-[10px] text-slate-500 uppercase font-mono">云端表: <span className={`font-black ${cloudTableExists ? 'text-emerald-400' : 'text-rose-500'}`}>{cloudTableExists ? '已创建 (Backup Found)' : '不存在 (Need Push)'}</span></p>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <button 
                            onClick={() => pullFromCloud(false)} 
                            disabled={isPullingNow || state.connectionStatus !== 'connected'}
                            className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                          >
                              {isPullingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudDownload className="w-4 h-4" />} 手动拉回
                          </button>
                          <button 
                            onClick={handleManualPush} 
                            disabled={isSyncingNow || state.connectionStatus !== 'connected'}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 ${!cloudTableExists ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white/5 text-slate-300 border border-white/10'}`}
                          >
                              {isSyncingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudUpload className="w-4 h-4" />} 
                              {!cloudTableExists ? '点我执行初次同步' : '立即同步到云端'}
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">App ID</label>
                              <input type="text" value={leanForm.appId} onChange={e=>setLeanForm({...leanForm, appId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">App Key</label>
                              <input type={showKey ? "text" : "password"} value={leanForm.appKey} onChange={e=>setLeanForm({...leanForm, appKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] text-indigo-400 font-bold uppercase">REST API 服务器地址</label>
                              <input type="text" value={leanForm.serverURL} onChange={e=>setLeanForm({...leanForm, serverURL: e.target.value})} className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-3 text-sm text-indigo-100 font-mono focus:border-indigo-500 outline-none" placeholder="https://..." />
                          </div>
                          <button onClick={handleSaveConfig} disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">
                              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} 验证并激活物理链路
                          </button>
                      </div>

                      <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                          <div className="flex items-center gap-3">
                              <ListChecks className="w-5 h-5 text-indigo-400" />
                              <h5 className="text-xs font-bold text-white uppercase tracking-widest">物理链路自检表</h5>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-relaxed font-mono space-y-4">
                              <p className="flex items-center gap-3"><div className={`w-1.5 h-1.5 rounded-full ${leanForm.appId ? 'bg-emerald-500' : 'bg-slate-700'}`}></div> App ID 已注入</p>
                              <p className="flex items-center gap-3"><div className={`w-1.5 h-1.5 rounded-full ${leanForm.appKey ? 'bg-emerald-500' : 'bg-slate-700'}`}></div> App Key 已注入</p>
                              <p className="flex items-center gap-3"><div className={`w-1.5 h-1.5 rounded-full ${leanForm.serverURL.includes('https://') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div> API 地址格式校验</p>
                              <div className="h-px bg-white/5 my-2"></div>
                              <p className="text-[10px] text-slate-500 italic">提示：点完“立即同步”后，LeanCloud 网页刷新就能看到数据。建议在不同浏览器尝试，确保同步成功。</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

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
