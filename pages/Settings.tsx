import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Eye, EyeOff, Wifi, 
    Download, Upload, Palette, Sparkles, Moon, MonitorDot,
    FileJson, Eraser, LogOut, Zap, Loader2, ShieldCheck, ExternalLink
} from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud, bootSupa } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('cloud');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supaForm, setSupaForm] = useState({
      url: '',
      anonKey: ''
  });

  useEffect(() => {
    if (state.supaConfig) {
        setSupaForm({
            url: state.supaConfig.url || '',
            anonKey: state.supaConfig.anonKey || ''
        });
    }
  }, [state.supaConfig]);

  const handleSaveConfig = async () => {
      if (!supaForm.url || !supaForm.anonKey) {
          showToast('请提供 Supabase URL 和 Anon Key', 'warning');
          return;
      }
      setIsSaving(true);
      try {
          dispatch({ type: 'SET_SUPA_CONFIG', payload: supaForm });
          await bootSupa(supaForm.url, supaForm.anonKey);
          showToast('Supabase 量子链路已就绪', 'success');
      } catch (e: any) {
          showToast(`激活失败: 请确认 Table 是否已创建并关闭 RLS`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualSync = async () => {
      setIsSyncingNow(true);
      const success = await syncToCloud(true);
      if (success) showToast('5.4MB+ 全量镜像已推送到 Supabase', 'success');
      setIsSyncingNow(false);
  };

  const handleClearConfig = () => {
      if (confirm('确定要清除云端连接吗？')) {
          localStorage.removeItem('TANXING_SUPA_CONFIG');
          dispatch({ type: 'SET_SUPA_CONFIG', payload: { url: '', anonKey: '', lastSync: null } });
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
          showToast('连接已断开', 'info');
      }
  };

  const handleThemeChange = (theme: Theme) => {
      dispatch({ type: 'SET_THEME', payload: theme });
      showToast(`视觉协议已更新`, 'info');
  };

  const handleClearLocalOnly = () => {
      if (confirm('⚠️ 该操作仅清除浏览器本地缓存以释放空间，不影响云端数据。确定继续？')) {
          localStorage.removeItem('TANXING_DB_V10_SUPA');
          showToast('本地缓存已清理', 'success');
          setTimeout(() => window.location.reload(), 800);
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <SettingsIcon className="w-7 h-7 text-indigo-500" /> 系统偏好与 Supabase 云协议
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-[0.2em] uppercase">PostgreSQL Cloud Interface v10.1</p>
        </div>
        <button onClick={() => confirm('重置全部？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">全系统重置</button>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'theme', label: '外观主题', icon: Palette },
            { id: 'cloud', label: '云端同步 (Supabase)', icon: Cloud },
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
                              Supabase 无限制同步 (Large Field Support)
                              <span className="bg-emerald-500 text-[8px] text-black px-1.5 py-0.5 rounded font-black">UNLIMITED SIZE</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
                              状态: <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-500'}`}>{state.connectionStatus.toUpperCase()}</span>
                              {state.supaConfig.lastSync && <span className="ml-3 text-slate-600">Sync: {state.supaConfig.lastSync}</span>}
                          </p>
                          <p className="text-[10px] text-indigo-400/60 font-mono mt-1">
                              优势: 完美支持 5.4MB+ 单次同步，基于 PostgreSQL 强一致性，无需分片，免费且更稳健。
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
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Supabase URL</label>
                          <input type="text" value={supaForm.url} onChange={e=>setSupaForm({...supaForm, url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" placeholder="https://xxx.supabase.co" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Anon Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supaForm.anonKey} onChange={e=>setSupaForm({...supaForm, anonKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-mono" />
                              <button onClick={()=>setShowKey(!showKey)} className="absolute right-3 top-3 text-slate-600">{showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                          </div>
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <button onClick={handleSaveConfig} disabled={isSaving} className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />} 启动 Supabase 协议
                        </button>
                        <button onClick={handleClearConfig} className="p-5 bg-white/5 border border-white/10 text-slate-500 hover:text-red-400 rounded-2xl transition-all" title="断开连接">
                            <LogOut className="w-6 h-6" />
                        </button>
                      </div>
                  </div>

                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-indigo-400" />
                              <h5 className="text-xs font-bold text-white uppercase tracking-widest">初始化脚本 (SQL Editor)</h5>
                          </div>
                          <a href="https://supabase.com/dashboard" target="_blank" className="text-[10px] text-indigo-400 flex items-center gap-1 hover:underline">去控制台 <ExternalLink className="w-3 h-3"/></a>
                      </div>
                      <div className="space-y-4">
                          <div className="text-[10px] text-slate-400 leading-relaxed font-mono">
                              <p className="text-indigo-400 font-bold mb-2">请在 SQL Editor 执行以下代码以开启大文件同步支持：</p>
                              <code className="text-indigo-300 block py-2 whitespace-pre-wrap mt-2 bg-black/40 p-3 rounded border border-white/5 select-all">
{`CREATE TABLE backups (id int8 PRIMARY KEY DEFAULT 1, data text, updated_at timestamptz DEFAULT now());
INSERT INTO backups (id, data) VALUES (1, '{}');
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All" ON backups FOR ALL USING (true);`}
                              </code>
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
                          <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">仅清除本地暂存。完成后刷新页面可从 Supabase 全量拉取最新镜像。</p>
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
