import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Eye, EyeOff, Wifi, 
    Download, Upload, Palette, Sparkles, Moon, MonitorDot,
    FileJson, Eraser, LogOut, Zap, Loader2, ShieldCheck, CheckCircle2, ExternalLink, CloudUpload, CloudDownload, Info, MousePointer2, AlertCircle, ListChecks, DatabaseZap, FileCode, History, HardDrive,
    Sun, Waves, Wind, Search
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('theme');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isPullingNow, setIsPullingNow] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'unknown' | 'found' | 'not_found'>('unknown');

  const [leanForm, setLeanForm] = useState({ appId: '', appKey: '', serverURL: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LEANCLOUD_LIMIT = 16 * 1024 * 1024; 
  const currentSize = state.leanConfig?.payloadSize || 0;
  const sizePercentage = Math.min(100, (currentSize / LEANCLOUD_LIMIT) * 100);

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
      setCloudStatus('unknown');
      try {
          // 1. 初始化连接
          await bootLean(leanForm.appId, leanForm.appKey, leanForm.serverURL);
          dispatch({ type: 'SET_LEAN_CONFIG', payload: leanForm });
          
          // 2. 探测云端数据
          const found = await pullFromCloud(true);
          if (found) {
              setCloudStatus('found');
              showToast('神经链路握手成功：已发现并回填云端镜像', 'success');
          } else {
              setCloudStatus('not_found');
              showToast('物理连接成功：云端暂无此应用的备份记录', 'info');
          }
      } catch (e: any) {
          showToast(`链路激活失败: ${e.message}`, 'error');
          setCloudStatus('unknown');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPush = async () => {
      if (!confirm('此操作将本地数据推送到云端？')) return;
      setIsSyncingNow(true);
      try {
          const success = await syncToCloud(true);
          if (success) {
              setCloudStatus('found');
              showToast('全量数据推送成功', 'success');
          }
      } finally {
          setIsSyncingNow(false);
      }
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 系统偏好与同步协议
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono tracking-[0.4em] uppercase">Enterprise Data Control Hub</p>
        </div>
        <button onClick={() => confirm('确定重置所有本地缓存数据？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95">Reset Local Node</button>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit backdrop-blur-md">
          {[
            { id: 'theme', label: '视觉外观', icon: Palette },
            { id: 'cloud', label: '云端同步', icon: Cloud },
            { id: 'data', label: '离线管理', icon: Database }
          ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              {[{ id: 'ios-glass', name: '曜石深渊', icon: Waves, color: 'from-blue-600 to-indigo-900', desc: '经典深蓝毛玻璃' }, { id: 'midnight-dark', name: '落日地平线', icon: Sun, color: 'from-rose-600 to-amber-900', desc: '暖红基调' }, { id: 'cyber-neon', name: '翡翠星云', icon: Wind, color: 'from-emerald-600 to-teal-900', desc: '极光青绿' }].map(t => (
                  <div key={t.id} onClick={() => dispatch({type:'SET_THEME', payload: t.id as any})} className={`ios-glass-card cursor-pointer border-2 p-1 rounded-[2rem] transition-all group relative overflow-hidden ${state.theme === t.id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-white/5 hover:border-white/20'}`}>
                      <div className={`h-32 w-full rounded-[1.8rem] bg-gradient-to-br ${t.color} mb-4 flex items-center justify-center relative overflow-hidden`}>
                          <t.icon className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="p-5 pt-0"><h4 className="font-black text-white text-sm mb-1 uppercase">{t.name}</h4><p className="text-[10px] text-slate-500">{t.desc}</p></div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'cloud' && (
          <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-8 flex items-start gap-6">
                      <div className="p-4 bg-indigo-500/20 rounded-2xl shrink-0"><DatabaseZap className="w-8 h-8 text-indigo-400" /></div>
                      <div>
                          <h4 className="text-indigo-300 font-black text-sm uppercase tracking-wider">存储协议状态</h4>
                          <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${state.connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></div>
                                  <span className="text-xs font-bold text-white">Rest API 连接: {state.connectionStatus.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${cloudStatus === 'found' ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : cloudStatus === 'not_found' ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                                  <span className="text-xs font-bold text-white">
                                      云端镜像探测: {cloudStatus === 'found' ? '已定位数据节点' : cloudStatus === 'not_found' ? '未发现有效节点' : '等待探测...'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="ios-glass-panel p-8 rounded-3xl flex flex-col justify-center border-white/10">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-indigo-400" /> 镜像包大小
                          </span>
                          <span className={`text-[10px] font-mono font-black ${sizePercentage > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {sizePercentage.toFixed(2)}%
                          </span>
                      </div>
                      <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden mb-4 p-0.5"><div className={`h-full rounded-full ${sizePercentage > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${sizePercentage}%` }}></div></div>
                      <div className="flex justify-between items-baseline"><span className="text-2xl font-black text-white font-mono">{formatSize(currentSize)}</span><span className="text-[9px] text-slate-600 font-bold">MAX: 16 MB</span></div>
                  </div>
              </div>

              <div className="ios-glass-panel p-10 space-y-10 rounded-[2.5rem] border-white/10">
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                          <div className={`p-5 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-xl' : 'bg-slate-800 text-slate-500'}`}><Wifi className="w-10 h-10" /></div>
                          <div>
                              <h4 className="text-white text-xl font-black uppercase tracking-tighter italic">REST API 实时链路</h4>
                              <p className="text-[10px] text-slate-500 uppercase font-mono font-bold mt-2">上次同步: <span className="text-indigo-400">{state.leanConfig?.lastSync || '永不'}</span></p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <button onClick={() => pullFromCloud(false)} disabled={isPullingNow || state.connectionStatus !== 'connected'} className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-20">{isPullingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudDownload className="w-4 h-4" />} 强制找回旧数据</button>
                          <button onClick={handleManualPush} disabled={isSyncingNow || state.connectionStatus !== 'connected'} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl disabled:opacity-20">{isSyncingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudUpload className="w-4 h-4" />} 手动推送当前数据</button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-5">
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">Application ID</label>
                              <input type="text" value={leanForm.appId} onChange={e=>setLeanForm({...leanForm, appId: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" placeholder="填入 LeanCloud App ID" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">App Key</label>
                              <input type="password" value={leanForm.appKey} onChange={e=>setLeanForm({...leanForm, appKey: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" placeholder="填入 LeanCloud App Key" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">Rest API Server URL</label>
                              <input type="text" value={leanForm.serverURL} onChange={e=>setLeanForm({...leanForm, serverURL: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono" placeholder="https://xxx.lncldglobal.com" />
                          </div>
                          <button onClick={handleSaveConfig} disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95">
                              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} 激活链路并找回旧数据
                          </button>
                      </div>
                      
                      <div className="bg-white/2 border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-4 mb-6">
                              <Info className="w-6 h-6 text-indigo-400" />
                              <h5 className="text-white font-bold">同步指南</h5>
                          </div>
                          <ul className="text-xs text-slate-500 space-y-4 leading-relaxed">
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">01</span><span>在<b>第一台电脑</b>配置好密钥并点击“手动推送同步”。</span></li>
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">02</span><span>在<b>第二台电脑</b>填入完全相同的密钥，点击“激活链路”。</span></li>
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">03</span><span>系统会自动识别云端记录并覆盖本地 Mock 数据。</span></li>
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="ios-glass-panel p-10 grid grid-cols-1 md:grid-cols-2 gap-10 rounded-[2.5rem]">
                  <div className="space-y-8">
                      <div className="flex items-center gap-5"><div className="p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 shadow-inner"><FileCode className="w-10 h-10"/></div><h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">本地 JSON 备份</h4></div>
                      <div className="p-8 bg-black/40 border border-white/5 rounded-3xl space-y-10">
                          <button onClick={() => {
                              const { toasts, connectionStatus, isInitialized, isMobileMenuOpen, ...persistentData } = state;
                              const dataStr = JSON.stringify(persistentData, null, 2);
                              const blob = new Blob([dataStr], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `tanxing_backup_${new Date().toISOString().split('T')[0]}.json`;
                              link.click();
                              showToast('JSON 备份成功', 'success');
                          }} className="w-full py-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">生成离线快照</button>
                          <div className="h-px bg-white/5"></div>
                          <input type="file" ref={fileInputRef} onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                  try {
                                      const content = event.target?.result as string;
                                      const importedData = JSON.parse(content);
                                      if (confirm('导入将覆盖当前所有数据！是否继续？')) {
                                          dispatch({ type: 'HYDRATE_STATE', payload: importedData });
                                          showToast('数据还原成功', 'success');
                                      }
                                  } catch (err: any) {
                                      showToast(`导入失败: ${err.message}`, 'error');
                                  }
                              };
                              reader.readAsText(file);
                          }} accept=".json" className="hidden" />
                          <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">手动上传还原</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;