import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Eye, EyeOff, Wifi, 
    Download, Upload, Palette, Sparkles, Moon, MonitorDot,
    FileJson, Eraser, LogOut, Zap, Loader2, ShieldCheck, CheckCircle2, ExternalLink
} from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('cloud');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
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
          showToast('请完整填写 App ID, Key 和服务器 URL', 'warning');
          return;
      }
      setIsSaving(true);
      try {
          dispatch({ type: 'SET_LEAN_CONFIG', payload: leanForm });
          await bootLean(leanForm.appId, leanForm.appKey, leanForm.serverURL);
          showToast('LeanCloud 镜像链路已就绪', 'success');
      } catch (e: any) {
          showToast(`激活失败: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualSync = async () => {
      setIsSyncingNow(true);
      try {
          const success = await syncToCloud(true);
          if (success) showToast('5.4MB+ 数据已成功同步至云端', 'success');
      } finally {
          setIsSyncingNow(false);
      }
  };

  const handleClearConfig = () => {
      if (confirm('确定要清除云端连接吗？')) {
          localStorage.removeItem('TANXING_LEAN_CONFIG');
          dispatch({ type: 'SET_LEAN_CONFIG', payload: { appId: '', appKey: '', serverURL: '', lastSync: null } });
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
          showToast('同步协议已注销', 'info');
      }
  };

  const handleThemeChange = (theme: Theme) => {
      dispatch({ type: 'SET_THEME', payload: theme });
      showToast(`视觉协议已更新`, 'info');
  };

  const handleClearLocalOnly = () => {
      if (confirm('⚠️ 该操作仅清除浏览器本地缓存以释放空间。确定继续？')) {
          localStorage.removeItem('TANXING_DB_V11_LEAN');
          showToast('本地缓存已清理', 'success');
          setTimeout(() => window.location.reload(), 800);
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <SettingsIcon className="w-7 h-7 text-indigo-500" /> 系统偏好与 LeanCloud 协议
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-[0.2em] uppercase">Enterprise No-SQL Sync v11.1</p>
        </div>
        <button onClick={() => confirm('重置全部？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">全系统重置</button>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'theme', label: '外观主题', icon: Palette },
            { id: 'cloud', label: '云端同步 (LeanCloud)', icon: Cloud },
            { id: 'data', label: '本地数据', icon: Database }
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
                              LeanCloud 全量镜像同步 (Managed Schema)
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
                              状态: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span>
                              {state.leanConfig.lastSync && <span className="ml-3 text-slate-600 font-bold tracking-tighter">上次成功: {state.leanConfig.lastSync}</span>}
                          </p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={pullFromCloud} className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all">拉取重构</button>
                      <button 
                        onClick={handleManualSync} 
                        disabled={isSyncingNow || state.connectionStatus !== 'connected'}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                      >
                          {isSyncingNow ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />} 立即同步
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">App ID</label>
                          <input type="text" value={leanForm.appId} onChange={e=>setLeanForm({...leanForm, appId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" placeholder="从控制台复制..." />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">App Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={leanForm.appKey} onChange={e=>setLeanForm({...leanForm, appKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" />
                              <button onClick={()=>setShowKey(!showKey)} className="absolute right-3 top-3 text-slate-600">{showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <label className="text-[10px] text-indigo-400 font-bold uppercase">REST API 服务器地址 (必填)</label>
                              <a href="https://leancloud.app/dashboard/applist.html#/apps" target="_blank" className="text-[9px] text-slate-500 flex items-center gap-1 hover:text-white transition-colors">去控制台获取 <ExternalLink className="w-2.5 h-2.5"/></a>
                          </div>
                          <input type="text" value={leanForm.serverURL} onChange={e=>setLeanForm({...leanForm, serverURL: e.target.value})} className="w-full bg-black/40 border border-indigo-500/30 rounded-xl p-3 text-sm text-indigo-100 font-mono focus:border-indigo-500 outline-none" placeholder="https://your-app-prefix.example.com" />
                          <p className="text-[9px] text-slate-600 italic mt-1">注：设置 &rarr; 应用凭证 &rarr; 服务器地址 (API 地址)</p>
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <button onClick={handleSaveConfig} disabled={isSaving} className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} 启动同步协议
                        </button>
                        <button onClick={handleClearConfig} className="p-5 bg-white/5 border border-white/10 text-slate-500 hover:text-red-400 rounded-2xl transition-all" title="断开连接">
                            <LogOut className="w-6 h-6" />
                        </button>
                      </div>
                  </div>

                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-indigo-400" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">排障建议</h5>
                      </div>
                      <div className="space-y-4">
                          <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
                              <p className="text-indigo-400 font-bold mb-2 underline decoration-indigo-500/30 underline-offset-4">关于 "undefined server URL" 错误：</p>
                              LeanCloud 自 2020 年起强制要求开发者通过绑定域名或官方分配的 API 域名进行访问。请务必在左侧填入 <span className="text-white">API 服务器地址</span>。
                              <br/><br/>
                              <p className="text-indigo-400 font-bold mb-2">如何查找：</p>
                              1. 登录 LeanCloud 控制台。<br/>
                              2. 进入您的应用。<br/>
                              3. 设置 &rarr; 应用凭证 &rarr; 服务器地址。<br/>
                              4. 复制 <span className="text-white">API</span> 栏位对应的 HTTPS 链接。
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
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Download className="w-6 h-6" /></div>
                        <h4 className="font-bold uppercase tracking-tighter">导出本地备份</h4>
                      </div>
                      <button onClick={() => {
                          const dataStr = JSON.stringify(state);
                          const blob = new Blob([dataStr], {type: "application/json"});
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a'); a.href = url; a.download = `tanxing_backup_${Date.now()}.json`; a.click();
                      }} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                          <Download className="w-4 h-4"/> 生成 JSON 备份
                      </button>
                  </div>

                  <div className="space-y-6 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                      <div className="flex items-center gap-4 text-white">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><Upload className="w-6 h-6" /></div>
                        <h4 className="font-bold uppercase tracking-tighter">重构本地数据</h4>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsImporting(true);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                              try {
                                  const imported = JSON.parse(event.target?.result as string);
                                  dispatch({ type: 'HYDRATE_STATE', payload: imported });
                                  showToast('本地重构成功', 'info');
                              } catch (err) { showToast('解析失败', 'error'); }
                              setIsImporting(false);
                          };
                          reader.readAsText(file);
                      }} accept=".json" className="hidden" />
                      <button disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all">
                          {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4"/>} 导入备份文件
                      </button>
                  </div>
              </div>

              <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center justify-between">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500"><Eraser className="w-6 h-6" /></div>
                      <div>
                          <h4 className="text-sm font-bold text-white uppercase italic">清理本地缓存</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">仅清除本地暂存。完成后刷新页面可从 LeanCloud 镜像同步回最新数据。</p>
                      </div>
                  </div>
                  <button onClick={handleClearLocalOnly} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">释放本地空间</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
