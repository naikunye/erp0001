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
          showToast('Firebase 连接成功', 'success');
      } catch (e: any) {
          showToast(`配置应用失败: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleClearConfig = () => {
      if (confirm('确定要清除 Firebase 配置并断开云端连接吗？')) {
          localStorage.removeItem('TANXING_FIREBASE_CONFIG');
          dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { apiKey: '', projectId: '', authDomain: '', appId: '', lastSync: null } });
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
          showToast('配置已清除，已恢复离线模式', 'info');
          setTimeout(() => window.location.reload(), 500);
      }
  };

  const handleThemeChange = (theme: Theme) => {
      dispatch({ type: 'SET_THEME', payload: theme });
      showToast(`视觉主题已切换`, 'info');
  };

  const handleClearLocalOnly = () => {
      if (confirm('⚠️ 该操作仅清除浏览器本地缓存以释放空间，不影响 Firebase 云端数据。确定继续？')) {
          localStorage.removeItem('TANXING_DB_V9_FIREBASE');
          showToast('本地缓存已清理，请刷新页面从云端重新拉取', 'success');
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
                  showToast('导入失败：文件格式不符合 Tanxing 备份规范', 'error');
                  setIsImporting(false);
                  return;
              }

              // 1. 注入本地
              dispatch({ type: 'HYDRATE_STATE', payload: importedData });
              showToast('本地数据恢复成功，正在同步至云端...', 'info');

              // 2. 检查连接状态并强制推送到云端
              if (state.connectionStatus === 'connected') {
                  // 稍微延迟确保 dispatch 完成
                  setTimeout(async () => {
                      const success = await syncToCloud(true);
                      if (success) {
                          showToast('云端镜像同步完成，数据已安全存证', 'success');
                      } else {
                          showToast('数据已恢复到本地，但同步云端失败 (可能由于体积超限)', 'warning');
                      }
                      setIsImporting(false);
                  }, 1000);
              } else {
                  showToast('数据已恢复到本地，请连接 Firebase 以同步云端', 'warning');
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

  const rulesUrl = fbForm.projectId 
    ? `https://console.firebase.google.com/project/${fbForm.projectId}/firestore/rules`
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
                          <h4 className="text-white font-bold uppercase tracking-tighter">Firebase 实时矩阵状态</h4>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">当前节点: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : state.connectionStatus === 'error' ? 'text-red-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span></p>
                          <p className="text-[10px] text-slate-600 font-mono mt-1">SESSION: {SESSION_ID}</p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={pullFromCloud} disabled={state.connectionStatus !== 'connected'} className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-white/10 uppercase transition-all disabled:opacity-20"><ArrowDownCircle className="w-4 h-4"/> 拉取快照</button>
                      <button onClick={() => syncToCloud(true)} disabled={state.connectionStatus !== 'connected'} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 shadow-lg uppercase active:scale-95 transition-all disabled:opacity-20"><ArrowUpCircle className="w-4 h-4"/> 强行同步</button>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">Project ID</label>
                              <input type="text" value={fbForm.projectId} onChange={e=>setFbForm({...fbForm, projectId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none" placeholder="my-erp-project" />
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
                            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} 启动 Firebase 神经连接
                        </button>
                        <button onClick={handleClearConfig} className="p-5 bg-white/5 border border-white/10 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all" title="断开并清除配置">
                            <LogOut className="w-6 h-6" />
                        </button>
                      </div>
                  </div>

                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-emerald-400" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">快速配置指南</h5>
                      </div>
                      <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                              1. 在 Firebase 控制台创建项目。<br/>
                              2. 开启 Firestore Database。<br/>
                              3. 在 Rules 选项卡设置允许读写：<br/>
                              <code className="text-indigo-300 block py-2">allow read, write: if true;</code>
                          </p>
                          <div className="pt-2">
                              <a href={rulesUrl} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                                <ExternalLink className="w-3 h-3"/> 直达 Rules 配置页面
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
                            <h4 className="font-bold italic uppercase tracking-tighter">导出数据 (Export JSON)</h4>
                        </div>
                      </div>
                      <button onClick={() => {
                          const dataStr = JSON.stringify(state);
                          const blob = new Blob([dataStr], {type: "application/json"});
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a'); a.href = url; a.download = `tanxing_backup.json`; a.click();
                      }} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                          <Download className="w-4 h-4"/> 生成导出
                      </button>
                  </div>

                  <div className="space-y-6 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                      <div className="flex items-center gap-4 text-white">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold italic uppercase tracking-tighter">恢复数据 (Import JSON)</h4>
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
                          <h4 className="text-sm font-bold text-white uppercase italic">清理本地空间 (Free Storage)</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">如果遇到数据溢出或卡顿，此操作将安全清理本地缓存。刷新后系统将自动从云端重新拉取。</p>
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