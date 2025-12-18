
import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, Eye, EyeOff, Globe, Trash2, Wifi, ArrowUpCircle, ArrowDownCircle, Download, Upload, Info } from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';
import { createClient } from '@supabase/supabase-js';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'cloud' | 'data'>('cloud');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isForcePushing, setIsForcePushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supabaseForm, setSupabaseForm] = useState({
      url: state.supabaseConfig?.url || '',
      key: state.supabaseConfig?.key || '',
      isRealTime: state.supabaseConfig?.isRealTime ?? true
  });

  useEffect(() => {
    setSupabaseForm({
        url: state.supabaseConfig?.url || '',
        key: state.supabaseConfig?.key || '',
        isRealTime: state.supabaseConfig?.isRealTime ?? true
    });
  }, [state.supabaseConfig]);

  const handleNukeSystem = () => {
      if (confirm('🆘 终极警告：这将彻底清除浏览器中的本地数据。确定继续？')) {
          dispatch({ type: 'RESET_DATA' });
          showToast('系统已重置', 'success');
          setTimeout(() => window.location.reload(), 500);
      }
  };

  const handleSupabaseSave = async () => {
      setIsSaving(true);
      try {
          const client = createClient(supabaseForm.url, supabaseForm.key);
          // 测试连接
          const { error } = await client.from('app_backups').select('id').limit(1);
          if (error) throw error;
          
          dispatch({ type: 'SET_SUPABASE_CONFIG', payload: supabaseForm });
          showToast('云端连接配置已保存', 'success');
          
          // 保存后立即尝试拉取一次，确保新环境数据同步
          setTimeout(() => pullFromCloud(), 500);
      } catch (e: any) {
          showToast(`连接失败: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPull = async () => {
      setIsPulling(true);
      try {
          await pullFromCloud();
          showToast('已从云端拉取最新快照', 'success');
      } catch (e: any) {
          showToast(`拉取失败: ${e.message}`, 'error');
      } finally {
          setIsPulling(false);
      }
  };

  const handleForcePush = async () => {
      setIsForcePushing(true);
      try {
          await syncToCloud(true);
          showToast('全量数据已强制推送至云端', 'success');
      } catch (e: any) {
          showToast(`同步失败: ${e.message}`, 'error');
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
            if (confirm('确定要恢复此归档吗？这将覆盖现有数据并强制同步到云端。')) {
                dispatch({ type: 'FULL_RESTORE', payload: importedState });
                showToast('本地恢复成功', 'success');
                // 延时触发一次强制推送
                setTimeout(() => syncToCloud(true), 1000);
            }
        } catch (err: any) {
            showToast(`文件解析失败: ${err.message}`, 'error');
        }
    };
    reader.readAsText(file);
};

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-violet-500" /> 全球数据同步中心
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-mono tracking-widest uppercase italic">Secure Cloud Matrix V7.0</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleNukeSystem} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all">重置本地数据库</button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 mb-8">
          {[
            { id: 'cloud', label: '云同步设置', icon: Cloud },
            { id: 'data', label: '数据导入导出', icon: Database }
          ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'border-violet-500 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'cloud' && (
          <div className="ios-glass-panel p-10 space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col gap-6 p-7 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-800 text-slate-500'}`}>
                            <Wifi className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2">Supabase 连接状态</h4>
                            <p className="text-xs text-slate-500 mt-1">终端状态: <span className={state.connectionStatus === 'connected' ? 'text-emerald-400 font-black' : 'text-amber-500'}>{state.connectionStatus.toUpperCase()}</span></p>
                            <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase">ID: {SESSION_ID}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={handleManualPull} disabled={isPulling} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border border-white/10">
                              {isPulling ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowDownCircle className="w-4 h-4"/>} 强制云端拉取
                          </button>
                          <button onClick={handleForcePush} disabled={isForcePushing} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg shadow-violet-900/40">
                              {isForcePushing ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowUpCircle className="w-4 h-4"/>} 全量覆盖推送
                          </button>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Supabase URL</label>
                          <input type="text" value={supabaseForm.url} onChange={e => setSupabaseForm({...supabaseForm, url: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:border-violet-500 outline-none" placeholder="https://xxx.supabase.co" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Anon / Service Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:border-violet-500 outline-none" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-4 text-slate-600">{showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
                          </div>
                      </div>
                      <button onClick={handleSupabaseSave} disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                          {isSaving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />} 保存并激活同步矩阵
                      </button>
                  </div>
                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Shield className="w-5 h-5"/></div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">数据一致性协议</h5>
                      </div>
                      <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-2">
                              <span className="text-violet-500 font-black">01</span>
                              <span>系统采用“云端覆盖本地”的初始加载策略。刷新页面将首先检查云端最新镜像，防止多设备数据冲突。</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-2">
                              <span className="text-violet-500 font-black">02</span>
                              <span>自动同步已启用防抖保护。本地数据修改后，将在 3 秒无操作后静默同步。</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-2">
                              <span className="text-violet-500 font-black">03</span>
                              <span>手动导入文件时，系统会立即锁定本地存储，待同步完成后再释放，确保导入数据永不丢失。</span>
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
                    <h4 className="text-white font-bold">导出本地归档</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">下载当前的本地数据状态为 JSON 文件，用于脱机备份。</p>
                  <button onClick={() => {
                      const dataStr = JSON.stringify(state);
                      const blob = new Blob([dataStr], {type: "application/json"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `tanxing_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
                  }} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"><Download className="w-4 h-4"/> 导出 JSON 归档</button>
              </div>
              <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-amber-400" />
                    <h4 className="text-white font-bold">恢复数据归档</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">从 JSON 归档中恢复数据。注意：这将覆盖所有现有业务记录！</p>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleLocalImport} accept=".json" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-white text-black hover:bg-slate-100 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"><Upload className="w-4 h-4"/> 选择归档并导入</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
