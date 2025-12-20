import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Save, Shield, Cloud, 
    RefreshCw, Eye, EyeOff, Trash2, Wifi, 
    ArrowUpCircle, ArrowDownCircle, Download, Upload,
    Palette, Monitor, Sparkles, Check, Moon, MonitorDot, AlertCircle,
    ExternalLink, FileJson, ArrowRight, Eraser, LogOut
} from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud, bootFirebase } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('cloud');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fbForm, setFbForm] = useState({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
  });

  useEffect(() => {
    if (state.firebaseConfig) {
        setFbForm({
            apiKey: state.firebaseConfig.apiKey || '',
            authDomain: state.firebaseConfig.authDomain || '',
            projectId: state.firebaseConfig.projectId || '',
            storageBucket: state.firebaseConfig.storageBucket || '',
            messagingSenderId: state.firebaseConfig.messagingSenderId || '',
            appId: state.firebaseConfig.appId || ''
        });
    }
  }, [state.firebaseConfig]);

  const handleSaveConfig = async () => {
      if (!fbForm.apiKey || !fbForm.projectId) {
          showToast('请至少填写 API Key 和 Project ID', 'warning');
          return;
      }
      setIsSaving(true);
      try {
          dispatch({ type: 'SET_FIREBASE_CONFIG', payload: fbForm });
          await bootFirebase(fbForm as any);
          showToast('Firebase 物理链路已接通', 'success');
      } catch (e: any) {
          // 详细错误提示
          let err = e.message;
          if (e.code === 'permission-denied') err = "数据库 Rules 拒绝写入。";
          showToast(`配置激活失败: ${err}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleClearConfig = () => {
      if (confirm('确定要清除 Firebase 配置并断开云端连接吗？')) {
          localStorage.removeItem('TANXING_FIREBASE_CONFIG');
          dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { apiKey: '', projectId: '', authDomain: '', appId: '', lastSync: null } });
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
          showToast('配置已清除，系统切换至离线模式', 'info');
          setTimeout(() => window.location.reload(), 500);
      }
  };

  const handleThemeChange = (theme: Theme) => {
      dispatch({ type: 'SET_THEME', payload: theme });
      showToast(`视觉协议已更新`, 'info');
  };

  const handleClearLocalOnly = () => {
      if (confirm('⚠️ 该操作仅清除浏览器本地缓存以释放空间，不影响云端数据。确定继续？')) {
          localStorage.removeItem('TANXING_DB_V9_FIREBASE');
          showToast('本地缓存已清理，刷新后将从云端重构镜像', 'success');
          setTimeout(() => window.location.reload(), 800);
      }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const content = event.target?.result as string;
              const importedData = JSON.parse(content);
              
              if (!importedData.products && !importedData.orders && !importedData.transactions) {
                  showToast('导入失败：非 Tanxing 标准备份格式', 'error');
                  setIsImporting(false);
                  return;
              }

              dispatch({ type: 'HYDRATE_STATE', payload: importedData });
              showToast('本地重构成功，正在向云端提交变更...', 'info');

              if (state.connectionStatus === 'connected') {
                  setTimeout(async () => {
                      const success = await syncToCloud(true);
                      if (success) {
                          showToast('云端数据同步完成', 'success');
                      } else {
                          showToast('本地已更新，但同步云端超时', 'warning');
                      }
                      setIsImporting(false);
                  }, 1000);
              } else {
                  showToast('本地数据已就绪，请接通云端以实现备份', 'warning');
                  setIsImporting(false);
              }
          } catch (err) {
              showToast('解析 JSON 失败', 'error');
              setIsImporting(false);
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const isUrlInProjectId = fbForm.projectId.includes('http') || fbForm.projectId.includes('.');
  const rulesUrl = fbForm.projectId 
    ? `https://console.firebase.google.com/project/${fbForm.projectId.split('.')[0]}/firestore/rules`
    : 'https://console.firebase.google.com/';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <SettingsIcon className="w-7 h-7 text-indigo-500" /> 系统偏好与同步协议
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-[0.2em] uppercase">Control Matrix Interface v9.2</p>
        </div>
        <button onClick={() => confirm('确定重置全系统数据？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">全系统重置</button>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'theme', label: '外观主题', icon: Palette },
            { id: 'cloud', label: 'Firebase 云端', icon: Cloud },
            { id: 'data', label: '本地管理', icon: Database }
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
                      <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : state.connectionStatus === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                        <Wifi className="w-8 h-8" />
                      </div>
                      <div>
                          <h4 className="text-white font-bold uppercase tracking-tighter">Firebase 矩阵连接状态</h4>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">当前节点: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : state.connectionStatus === 'error' ? 'text-red-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span></p>
                          <p className="text-[10px] text-slate-600 font-mono mt-1">SESSION: {SESSION_ID}</p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={pullFromCloud} disabled={state.connectionStatus !== 'connected'} className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-white/10 uppercase transition-all disabled:opacity-20"><ArrowDownCircle className="w-4 h-4"/> 拉取快照</button>
                      <button onClick={() => syncToCloud(true)} disabled={state.connectionStatus !== 'connected'} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 shadow-lg uppercase active:scale-95 transition-all disabled:opacity-20"><ArrowUpCircle className="w-4 h-4"/> 提交镜像</button>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                                  Project ID 
                                  {isUrlInProjectId && <span className="text-rose-400 animate-pulse">! 勿输入网址</span>}
                              </label>
                              <input type="text" value={fbForm.projectId} onChange={e=>setFbForm({...fbForm, projectId: e.target.value})} className={`w-full bg-black/40 border rounded-xl p-3 text-sm text-white font-mono outline-none ${isUrlInProjectId ? 'border-rose-500 ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-white/10 focus:border-indigo-500'}`} placeholder="my-erp-project" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">API Key</label>
                              <div className="relative">
                                  <input type={showKey ? "text" : "password"} value={fbForm.apiKey} onChange={e=>setFbForm({...fbForm, apiKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none" />
                                  <button onClick={()=>setShowKey(!showKey)} className="absolute right-3 top-3 text-slate-600">{showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Auth Domain</label>
                          <input type="text" value={fbForm.authDomain} onChange={e=>setFbForm({...fbForm, authDomain: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none" placeholder="xxx.firebaseapp.com" />
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <button onClick={handleSaveConfig} disabled={isSaving} className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} 接通物理链路
                        </button>
                        <button onClick={handleClearConfig} className="p-5 bg-white/5 border border-white/10 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all" title="断开连接">
                            <LogOut className="w-6 h-6" />
                        </button>
                      </div>
                  </div>

                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-emerald-400" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">排障与配置指南</h5>
                      </div>
                      <div className="space-y-4">
                          <div className="text-[11px] text-slate-500 leading-relaxed font-mono">
                              <p className="text-emerald-400 font-bold mb-2">1. 检查 Project ID：</p>
                              必须是简短字符串（如 <code className="text-white">tanxing-erp-abc</code>），禁止填入 <code className="text-rose-400">https://...</code> 这种网址。<br/><br/>
                              <p className="text-emerald-400 font-bold mb-2">2. 设置 Firestore Rules：</p>
                              在控制台 Rules 选项卡设置允许读写：<br/>
                              <code className="text-indigo-300 block py-2">allow read, write: if true;</code>
                          </div>
                          <div className="pt-2">
                              <a href={rulesUrl} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                                <ExternalLink className="w-3 h-3"/> 前往控制台配置 Rules
                              </a>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              {[
                { id: 'ios-glass', name: 'Obsidian Vision', desc: '经典深色磨砂玻璃', preview: 'bg-slate-900', icon: Moon },
                { id: 'midnight-dark', name: 'Midnight OLED', desc: '极致纯黑 OLED 模式', preview: 'bg-black', icon: MonitorDot },
                { id: 'cyber-neon', name: 'Cyber Neon', desc: '赛博霓虹，未来黑客', preview: 'bg-blue-950', icon: Sparkles }
              ].map(t => (
                  <div key={t.id} onClick={() => handleThemeChange(t.id as Theme)} className={`ios-glass-card cursor-pointer border ${state.theme === t.id ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-white/10 hover:border-white/30'}`}>
                      <div className={`h-24 ${t.preview} p-4 relative`}>
                          <t.icon className="absolute bottom-3 right-3 w-6 h-6 text-indigo-400 opacity-40" />
                      </div>
                      <div className="p-4 bg-black/40">
                          <h4 className="font-bold text-white text-xs">{t.name}</h4>
                          <p className="text-[9px] text-slate-500 uppercase">{t.desc}</p>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'data' && (
          <div className="ios-glass-panel p-10 animate-in fade-in duration-500 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-4 text-white">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold italic uppercase tracking-tighter">导出镜像 (Export JSON)</h4>
                        </div>
                      </div>
                      <button onClick={() => {
                          const dataStr = JSON.stringify(state);
                          const blob = new Blob([dataStr], {type: "application/json"});
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a'); a.href = url; a.download = `tanxing_backup.json`; a.click();
                      }} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                          <Download className="w-4 h-4"/> 生成本地备份
                      </button>
                  </div>

                  <div className="space-y-6 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                      <div className="flex items-center gap-4 text-white">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold italic uppercase tracking-tighter">重构镜像 (Import JSON)</h4>
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
                      <button disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg transition-all disabled:opacity-50">
                          {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4"/>}
                          导入备份文件
                      </button>
                  </div>
              </div>

              <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center justify-between">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500"><Eraser className="w-6 h-6" /></div>
                      <div>
                          <h4 className="text-sm font-bold text-white uppercase italic">清理本地缓存 (Free Storage)</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">重置本地浏览器存储。如果链路通畅，刷新后系统会自动同步云端最新镜像。</p>
                      </div>
                  </div>
                  <button onClick={handleClearLocalOnly} className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">释放本地空间</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;