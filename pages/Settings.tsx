
import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Save, Shield, Cloud, 
    RefreshCw, Eye, EyeOff, Globe, Trash2, Wifi, 
    ArrowUpCircle, ArrowDownCircle, Download, Upload, Info,
    Palette, Monitor, Layout, Sparkles, Check, Moon, Sun, MonitorDot, AlertCircle
} from 'lucide-react';
import { useTanxing, SESSION_ID, Theme } from '../context/TanxingContext';
import { createClient } from '@supabase/supabase-js';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'cloud' | 'data'>('theme');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isForcePushing, setIsForcePushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supabaseForm, setSupabaseForm] = useState({
      url: '',
      key: '',
      isRealTime: true
  });

  useEffect(() => {
    if (state.supabaseConfig) {
        setSupabaseForm({
            url: state.supabaseConfig.url || '',
            key: state.supabaseConfig.key || '',
            isRealTime: state.supabaseConfig.isRealTime ?? true
        });
    }
  }, [state.supabaseConfig]);

  const handleNukeSystem = () => {
      if (confirm('🆘 终极警告：这将彻底清除浏览器中的本地数据和连接配置。确定继续？')) {
          dispatch({ type: 'RESET_DATA' });
          showToast('系统已彻底重置', 'success');
          setTimeout(() => window.location.reload(), 500);
      }
  };

  const handleSupabaseSave = async () => {
      let cleanUrl = supabaseForm.url.trim().replace(/\/$/, "");
      if (cleanUrl && !cleanUrl.startsWith('http')) {
          cleanUrl = `https://${cleanUrl}`;
      }
      const cleanKey = supabaseForm.key.trim();

      if (!cleanUrl || !cleanKey) {
          showToast('请填写完整的连接参数 (URL & Key)', 'warning');
          return;
      }

      setIsSaving(true);
      try {
          const client = createClient(cleanUrl, cleanKey);
          const { error } = await client.from('app_backups').select('id').limit(1);
          if (error && error.code === 'PGRST116') {
              // Auth success but table empty
          } else if (error && error.message.includes("failed to fetch")) {
              throw new Error("FAILED_TO_FETCH");
          } else if (error) {
              throw error;
          }
          dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { ...supabaseForm, url: cleanUrl, key: cleanKey } });
          showToast('云端协议已激活并持久化', 'success');
          await pullFromCloud();
      } catch (e: any) {
          if (e.message === "FAILED_TO_FETCH" || e.toString().includes("TypeError: Failed to fetch")) {
              showToast('连接失败：请检查 URL 是否正确，或在 Supabase 后台允许当前域名的 CORS 访问', 'error');
          } else {
              showToast(`鉴权失败: ${e.message || '未知协议错误'}`, 'error');
          }
      } finally {
          setIsSaving(false);
      }
  };

  const handleThemeChange = (theme: Theme) => {
      dispatch({ type: 'SET_THEME', payload: theme });
      showToast(`视觉主题已切换`, 'info');
  };

  const handleManualPull = async () => {
      setIsPulling(true);
      try {
          await pullFromCloud();
          showToast('云端镜像同步成功', 'success');
      } catch (e: any) {
          showToast(`同步失败: ${e.message}`, 'error');
      } finally {
          setIsPulling(false);
      }
  };

  const handleForcePush = async () => {
      setIsForcePushing(true);
      try {
          await syncToCloud(true);
          showToast('本地数据已强制覆盖云端', 'success');
      } catch (e: any) {
          showToast(`推送失败: ${e.message}`, 'error');
      } finally {
          setIsForcePushing(false);
      }
  };

  const handleLocalImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            let importedState = JSON.parse(content);
            if (confirm('确定要恢复此归档吗？这将立即同步到云端。')) {
                dispatch({ type: 'FULL_RESTORE', payload: importedState });
                showToast('本地快照已载入', 'success');
                setTimeout(() => syncToCloud(true), 1000);
            }
        } catch (err: any) {
            showToast(`无效的归档文件: ${err.message}`, 'error');
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <SettingsIcon className="w-7 h-7 text-indigo-500" /> 系统偏好与同步协议
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-[0.2em] uppercase">Control Matrix Interface v8.5</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleNukeSystem} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">全系统注销</button>
        </div>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'theme', label: '外观主题', icon: Palette },
            { id: 'cloud', label: '云端同步', icon: Cloud },
            { id: 'data', label: '离线归档', icon: Database }
          ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 py-2.5 text-[10px] font-bold rounded-xl transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-white'}`}
              >
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {[
                { 
                    id: 'ios-glass', 
                    name: 'Obsidian Vision', 
                    desc: '经典深色磨砂玻璃', 
                    preview: 'bg-slate-900',
                    icon: Moon
                },
                { 
                    id: 'titanium-light', 
                    name: 'Titanium Light', 
                    desc: '商务明亮钛金白', 
                    preview: 'bg-slate-100',
                    icon: Sun
                },
                { 
                    id: 'midnight-dark', 
                    name: 'Midnight OLED', 
                    desc: '极致纯黑 OLED 模式', 
                    preview: 'bg-black',
                    icon: MonitorDot
                },
                { 
                    id: 'cyber-neon', 
                    name: 'Cyber Neon', 
                    desc: '赛博霓虹，未来黑客', 
                    preview: 'bg-blue-950 shadow-[inset_0_0_20px_rgba(34,211,238,0.3)]',
                    icon: Sparkles
                }
              ].map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => handleThemeChange(t.id as Theme)}
                    className={`ios-glass-card cursor-pointer group transition-all relative overflow-hidden flex flex-col border ${state.theme === t.id ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-4 ring-offset-black' : 'border-white/10 hover:border-white/30'}`}
                  >
                      <div className={`h-24 ${t.preview} p-4 flex flex-col gap-2 relative transition-transform group-hover:scale-105`}>
                          <div className="w-1/2 h-1.5 bg-white/10 rounded"></div>
                          <div className="w-1/3 h-1.5 bg-white/5 rounded"></div>
                          <t.icon className={`absolute bottom-3 right-3 w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity ${t.id === 'titanium-light' ? 'text-amber-500' : 'text-indigo-400'}`} />
                      </div>
                      <div className="p-4 bg-black/40 border-t border-white/5">
                          <div className="flex justify-between items-center mb-1">
                              <h4 className="font-bold text-white text-xs">{t.name}</h4>
                              {state.theme === t.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <p className="text-[9px] text-slate-500 leading-relaxed uppercase tracking-tight">{t.desc}</p>
                      </div>
                  </div>
              ))}
              
              <div className="lg:col-span-4 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-start gap-4">
                  <Monitor className="w-6 h-6 text-indigo-400 shrink-0" />
                  <div>
                      <h4 className="text-xs font-bold text-white uppercase mb-1">响应式色彩协议</h4>
                      <p className="text-[10px] text-indigo-300/60 leading-relaxed uppercase tracking-tighter font-mono">Tanxing OS 采用原子级 CSS变量。切换主题将实时重绘全局阴影、模糊度和色温，而无需刷新页面。Titanium Light 模式在强光下表现更佳。</p>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'cloud' && (
          <div className="ios-glass-panel p-10 space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col gap-6 p-7 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-slate-800 text-slate-500'}`}>
                            <Wifi className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2 uppercase tracking-tighter">核心连接状态 (Realtime)</h4>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight font-mono">矩阵状态: <span className={state.connectionStatus === 'connected' ? 'text-emerald-400 font-black' : 'text-amber-500'}>{state.connectionStatus.toUpperCase()}</span></p>
                            <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase">Terminal ID: {SESSION_ID}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={handleManualPull} disabled={isPulling} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border border-white/10">
                              {isPulling ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowDownCircle className="w-4 h-4"/>} 拉取云端镜像
                          </button>
                          <button onClick={handleForcePush} disabled={isForcePushing} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg shadow-indigo-900/40">
                              {isForcePushing ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowUpCircle className="w-4 h-4"/>} 强制覆盖云端
                          </button>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Supabase URL (Uplink)</label>
                          <input type="text" value={supabaseForm.url} onChange={e => setSupabaseForm({...supabaseForm, url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:border-indigo-500 outline-none" placeholder="https://xxx.supabase.co" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Access Secret Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:border-indigo-500 outline-none" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-4 text-slate-600">{showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
                          </div>
                      </div>
                      <button onClick={handleSupabaseSave} disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                          {isSaving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />} 建立加密上行链路
                      </button>
                  </div>
                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><AlertCircle className="w-5 h-5"/></div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">常见连接故障诊断</h5>
                      </div>
                      <div className="space-y-5">
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-3">
                              <span className="text-indigo-500 font-black">01</span>
                              <span><b>TypeError: Failed to fetch</b>：这是浏览器抛出的网络阻塞。请检查你的 Supabase URL 是否包含 https://，以及是否在 Supabase 的 <b>Settings &rarr; API &rarr; Allow Origins</b> 中添加了当前域名。</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-3">
                              <span className="text-indigo-500 font-black">02</span>
                              <span><b>Relation not found</b>：如果报错找不到表，请在 Supabase 的 SQL Editor 中创建一个名为 <code className="text-indigo-400">app_backups</code> 的表，包含 <code className="text-indigo-400">data</code> (jsonb) 列。</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-3">
                              <span className="text-indigo-500 font-black">03</span>
                              <span><b>Realtime Sync</b>：一旦连接成功，所有开启了 Realtime 协议的终端将保持毫秒级同步。</span>
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="ios-glass-panel p-10 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
              <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Download className="w-6 h-6 text-blue-400" />
                    <h4 className="text-white font-bold italic">导出 JSON 归档</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono leading-relaxed">生成当前系统完整快照。用于手动冷备份或在不同账号间快速迁移全量业务数据。</p>
                  <button onClick={() => {
                      const dataStr = JSON.stringify(state);
                      const blob = new Blob([dataStr], {type: "application/json"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `tanxing_snapshot_${new Date().toISOString().slice(0,10)}.json`; a.click();
                  }} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 font-mono uppercase tracking-widest"><Download className="w-4 h-4"/> 立即生成导出</button>
              </div>
              <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-amber-400" />
                    <h4 className="text-white font-bold italic">恢复数据镜像</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono leading-relaxed">从本地 JSON 文件恢复。注意：此操作将清空当前所有本地记录并尝试重写云端镜像！</p>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleLocalImport} accept=".json" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-white text-black hover:bg-slate-100 rounded-xl text-[10px] font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 font-mono uppercase tracking-widest"><Upload className="w-4 h-4"/> 选择本地快照</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
