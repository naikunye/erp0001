import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Eye, EyeOff, Wifi, 
    Download, Upload, Palette, Sparkles, Moon, MonitorDot,
    FileJson, Eraser, LogOut, Zap, Loader2, ShieldCheck, CheckCircle2, ExternalLink, CloudUpload, CloudDownload, Info, MousePointer2, AlertCircle, ListChecks, DatabaseZap, FileCode, History, HardDrive,
    Sun, Waves, Wind
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('theme');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isPullingNow, setIsPullingNow] = useState(false);
  const [cloudTableExists, setCloudTableExists] = useState<boolean | null>(null);

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
      if (!confirm('此操作将本地数据推送到云端？')) return;
      setIsSyncingNow(true);
      try {
          const success = await syncToCloud(true);
          if (success) {
              setCloudTableExists(true);
              showToast('全量数据推送成功', 'success');
          }
      } finally {
          setIsSyncingNow(false);
      }
  };

  const handleExportJSON = () => {
      try {
          const { toasts, exportTasks, connectionStatus, isInitialized, isMobileMenuOpen, ...persistentData } = state;
          const dataStr = JSON.stringify(persistentData, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `tanxing_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('JSON 备份文件已生成', 'success');
      } catch (e) {
          showToast('导出失败', 'error');
      }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const importedData = JSON.parse(content);
              if (confirm('警告：导入将覆盖当前系统内所有数据！是否继续还原？')) {
                  dispatch({ type: 'HYDRATE_STATE', payload: importedData });
                  showToast('数据还原成功', 'success');
                  setTimeout(() => dispatch({ type: 'NAVIGATE', payload: { page: 'dashboard' } }), 1000);
              }
          } catch (err: any) {
              showToast(`导入失败: ${err.message}`, 'error');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const themes = [
    { id: 'ios-glass', name: '曜石深渊 (Obsidian)', icon: Waves, color: 'from-blue-600 to-indigo-900', desc: '经典深蓝毛玻璃，沉浸式体验' },
    { id: 'midnight-dark', name: '落日地平线 (Sunset)', icon: Sun, color: 'from-rose-600 to-amber-900', desc: '暖红基调，透出晚霞般的色彩' },
    { id: 'cyber-neon', name: '翡翠星云 (Nebula)', icon: Wind, color: 'from-emerald-600 to-teal-900', desc: '极光青绿，极具科技动感' }
  ];

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
              {themes.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => dispatch({type:'SET_THEME', payload: t.id as any})} 
                    className={`ios-glass-card cursor-pointer border-2 p-1 rounded-[2rem] transition-all group relative overflow-hidden ${state.theme === t.id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-white/5 hover:border-white/20'}`}
                  >
                      <div className={`h-32 w-full rounded-[1.8rem] bg-gradient-to-br ${t.color} mb-4 flex items-center justify-center relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                          <t.icon className={`w-12 h-12 text-white/80 group-hover:scale-110 transition-transform duration-500 ${state.theme === t.id ? 'scale-110' : ''}`} />
                      </div>
                      <div className="p-5 pt-0">
                          <h4 className="font-black text-white text-sm mb-1 uppercase tracking-tight">{t.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{t.desc}</p>
                      </div>
                      {state.theme === t.id && (
                          <div className="absolute top-4 right-4 bg-white text-black p-1.5 rounded-full shadow-xl">
                              <CheckCircle2 className="w-3 h-3" />
                          </div>
                      )}
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
                          <h4 className="text-indigo-300 font-black text-sm uppercase tracking-wider">LeanCloud 存储限额</h4>
                          <div className="text-[11px] text-indigo-100/60 mt-3 leading-relaxed space-y-2">
                            <p>1. 免费版单条记录上限为 <span className="text-white font-bold">16 MB</span>。</p>
                            <p>2. 当前 ERP 采用单表镜像模式，所有业务数据打包为单一原子记录。</p>
                            <p>3. 系统将每 15 秒检测一次数据变动并尝试背景同步。</p>
                          </div>
                      </div>
                  </div>

                  <div className="ios-glass-panel p-8 rounded-3xl flex flex-col justify-center border-white/10">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-indigo-400" /> 包体占用比例
                          </span>
                          <span className={`text-[10px] font-mono font-black ${sizePercentage > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {sizePercentage.toFixed(2)}%
                          </span>
                      </div>
                      <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden mb-4 border border-white/5 p-0.5">
                          <div 
                            className={`h-full transition-all duration-1000 rounded-full ${sizePercentage > 80 ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]' : sizePercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'}`}
                            style={{ width: `${sizePercentage}%` }}
                          ></div>
                      </div>
                      <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-black text-white font-mono">{formatSize(currentSize)}</span>
                          <span className="text-[9px] text-slate-600 font-bold">MAX: 16 MB</span>
                      </div>
                  </div>
              </div>

              <div className="ios-glass-panel p-10 space-y-10 rounded-[2.5rem] border-white/10">
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                          <div className={`p-5 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                            <Wifi className="w-10 h-10" />
                          </div>
                          <div>
                              <h4 className="text-white text-xl font-black uppercase tracking-tighter italic">REST API 实时链路</h4>
                              <div className="flex items-center gap-4 mt-2">
                                 <p className="text-[10px] text-slate-500 uppercase font-mono font-bold">Status: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span></p>
                                 <div className="h-3 w-px bg-white/10"></div>
                                 <p className="text-[10px] text-slate-500 uppercase font-mono font-bold">Cloud: <span className={`font-black ${cloudTableExists ? 'text-emerald-400' : 'text-rose-500'}`}>{cloudTableExists ? 'Mirror Found' : 'Mirror Missing'}</span></p>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-4">
                          <button 
                            onClick={() => pullFromCloud(false)} 
                            disabled={isPullingNow || state.connectionStatus !== 'connected'}
                            className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-20"
                          >
                              {isPullingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudDownload className="w-4 h-4" />} 拉取镜像
                          </button>
                          <button 
                            onClick={handleManualPush} 
                            disabled={isSyncingNow || state.connectionStatus !== 'connected'}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl disabled:opacity-20 ${!cloudTableExists ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                          >
                              {isSyncingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <CloudUpload className="w-4 h-4" />} 
                              推送同步
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-5">
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Application ID</label>
                              <input type="text" value={leanForm.appId} onChange={e=>setLeanForm({...leanForm, appId: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Application Key</label>
                              <input type="password" value={leanForm.appKey} onChange={e=>setLeanForm({...leanForm, appKey: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] text-indigo-400 font-black uppercase tracking-widest ml-1">Restful API Endpoint</label>
                              <input type="text" value={leanForm.serverURL} onChange={e=>setLeanForm({...leanForm, serverURL: e.target.value})} className="w-full bg-black/60 border border-indigo-500/20 rounded-2xl p-4 text-sm text-indigo-100 font-mono focus:border-indigo-500 outline-none transition-all" placeholder="https://..." />
                          </div>
                          <button onClick={handleSaveConfig} disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 hover:shadow-indigo-500/20">
                              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} 激活物理链路
                          </button>
                      </div>

                      <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem] space-y-6 flex flex-col justify-center">
                          <div className="flex items-center gap-3">
                              <ListChecks className="w-6 h-6 text-indigo-400" />
                              <h5 className="text-sm font-black text-white uppercase tracking-widest italic">物理链路自检报告</h5>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-relaxed font-mono space-y-5">
                              <p className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${leanForm.appId ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></div> APP_ID 握手信号: {leanForm.appId ? 'Valid' : 'Wait'}</p>
                              <p className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${leanForm.appKey ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></div> APP_KEY 校验凭证: {leanForm.appKey ? 'Loaded' : 'Wait'}</p>
                              <p className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${leanForm.serverURL.includes('https://') ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}></div> 接入点域名解析: {leanForm.serverURL.includes('https://') ? 'Resolved' : 'Error'}</p>
                              <div className="h-px bg-white/5 my-4"></div>
                              <p className="text-[10px] text-slate-500 italic font-sans">注：若初次配置，点击上方“推送同步”即可自动创建 Backup 存储表，之后系统将接管数据同步。</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="ios-glass-panel p-10 grid grid-cols-1 md:grid-cols-2 gap-10 rounded-[2.5rem]">
                  <div className="space-y-8">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 shadow-inner"><FileCode className="w-10 h-10"/></div>
                          <div>
                              <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">原子数据快照</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Local JSON Backup & Restore</p>
                          </div>
                      </div>

                      <div className="p-8 bg-black/40 border border-white/5 rounded-3xl space-y-10">
                          <div className="space-y-4">
                              <h5 className="text-xs font-black text-white uppercase flex items-center gap-2">
                                  <Download className="w-4 h-4 text-emerald-400" /> 导出本地加密镜像
                              </h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                  将当前浏览器持久化存储中的所有业务实体（商品、订单、财务、物流）打包为单一 JSON 文件，用于离线存档。
                              </p>
                              <button 
                                onClick={handleExportJSON}
                                className="w-full py-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95"
                              >
                                  生成并下载快照
                              </button>
                          </div>

                          <div className="h-px bg-white/5"></div>

                          <div className="space-y-4">
                              <h5 className="text-xs font-black text-white uppercase flex items-center gap-2">
                                  <Upload className="w-4 h-4 text-indigo-400" /> 从快照恢复
                              </h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                  警告：上传备份文件将完全重置当前所有业务节点！请在操作前确保已完成最新的云端同步。
                              </p>
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImportJSON} 
                                accept=".json" 
                                className="hidden" 
                              />
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95"
                              >
                                  选择快照文件并部署
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="flex flex-col">
                      <div className="flex items-center gap-5 mb-8">
                          <div className="p-4 bg-amber-600/10 rounded-2xl text-amber-400 shadow-inner"><History className="w-10 h-10"/></div>
                          <div>
                              <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">同步审计日志</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Node Sync Audit History</p>
                          </div>
                      </div>
                      
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-10 flex flex-col justify-center items-center text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><SettingsIcon className="w-48 h-48" /></div>
                          <AlertCircle className="w-16 h-16 text-slate-800 mb-6" />
                          <div className="space-y-2">
                              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">上次同步包体大小</p>
                              <p className="text-4xl font-black text-white font-mono">{formatSize(currentSize)}</p>
                          </div>
                          
                          <div className="mt-12 p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] w-full max-w-sm">
                             <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase mb-3 justify-center">
                                <Zap className="w-3.5 h-3.5" /> Dangerous Zone
                             </div>
                             <p className="text-[10px] text-red-400/60 leading-relaxed">
                                清除本地存储将切断所有离线数据的可追溯性。如果云端同步失效，该操作将导致不可逆的数据丢失。
                             </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;