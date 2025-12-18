
import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle, Eye, EyeOff, Globe, Trash2, Radio, Smartphone, Zap, Server, Wifi, Terminal, Copy, ChevronDown, ChevronUp, Palette, Box, Layers, Grid, FileText, MonitorDot, Cpu, Info, Power, Link2Off, Download, Upload, History, FileJson, AlertOctagon, Scissors, ArrowUpCircle, ArrowDownCircle, TestTube2, Ghost } from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';
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

  const handleLoadMock = () => {
      if (confirm('加载模拟数据将覆盖当前显示。确定继续？')) {
          dispatch({ type: 'LOAD_MOCK_DATA' });
          showToast('模拟数据已载入', 'info');
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
              if (confirm('确定要恢复此归档吗？这将覆盖现有数据并强制同步。')) {
                  dispatch({ type: 'FULL_RESTORE', payload: importedState });
                  showToast('数据恢复成功', 'success');
                  // 延时触发一次强制云同步
                  setTimeout(() => syncToCloud(true), 1000);
              }
          } catch (err: any) {
              showToast(`导入失败: ${err.message}`, 'error');
          }
      };
      reader.readAsText(file);
  };

  const handleSupabaseSave = async () => {
      setIsSaving(true);
      try {
          const supabase = createClient(supabaseForm.url, supabaseForm.key);
          const { error } = await supabase.from('app_backups').select('id').limit(1);
          if (error) throw error;
          dispatch({ type: 'SET_SUPABASE_CONFIG', payload: supabaseForm });
          showToast('云端配置已保存', 'success');
          await pullFromCloud();
      } catch (e: any) {
          showToast(`无效配置: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPull = async () => {
      setIsPulling(true);
      try {
          await pullFromCloud();
          showToast('已拉取最新云端镜像', 'success');
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
          showToast('当前数据已强制推送到云端', 'success');
      } catch (e: any) {
          showToast(`同步失败: ${e.message}`, 'error');
      } finally {
          setIsForcePushing(false);
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-violet-500" /> 全球同步配置
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-mono tracking-widest uppercase">Encryption & Sync Matrix</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleLoadMock} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all">模拟数据</button>
            <button onClick={handleNukeSystem} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all">重置系统</button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 mb-8">
          {[
            { id: 'cloud', label: '云端同步', icon: Cloud },
            { id: 'data', label: '数据归档', icon: Database },
            { id: 'theme', label: '界面视觉', icon: Palette }
          ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'border-violet-500 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'cloud' && (
          <div className="ios-glass-panel p-10 space-y-10 animate-in fade-in">
              <div className="flex flex-col gap-6 p-7 bg-violet-900/10 border border-violet-500/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Wifi className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2">Supabase 核心连接池</h4>
                            <p className="text-xs text-slate-500 mt-1">Status: <span className="text-emerald-400 uppercase font-black">{state.connectionStatus}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={handleManualPull} disabled={isPulling} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border border-white/10">
                              {isPulling ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowDownCircle className="w-3 h-3"/>} 下行拉取
                          </button>
                          <button onClick={handleForcePush} disabled={isForcePushing} className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border border-emerald-500/30">
                              {isForcePushing ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowUpCircle className="w-3 h-3"/>} 上行同步
                          </button>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Uplink URL</label>
                          <input type="text" value={supabaseForm.url} onChange={e => setSupabaseForm({...supabaseForm, url: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white font-mono" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Secret Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white font-mono" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-3 text-slate-600">{showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
                          </div>
                      </div>
                      <button onClick={handleSupabaseSave} disabled={isSaving} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3">
                          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 启动同步矩阵
                      </button>
                  </div>
                  <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400"/> 安全协议已启用</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-mono">&gt; 数据现已采用双路持久化。刷新页面将首先检索云端快照，确保多终端数据强一致性。</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-mono">&gt; 检测到手动导入数据时，系统将自动触发一次强制上行同步，以固化变更。</p>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="ios-glass-panel p-8 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in">
              <div className="space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-2"><Download className="w-5 h-5 text-blue-400"/> 下载离线归档</h4>
                  <button onClick={() => {
                      const dataStr = JSON.stringify(state);
                      const blob = new Blob([dataStr], {type: "application/json"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `tanxing_export.json`; a.click();
                  }} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">导出 JSON</button>
              </div>
              <div className="space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-amber-400"/> 恢复本地数据</h4>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleLocalImport} accept=".json" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white text-black rounded-lg text-xs font-bold">选择文件并导入</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
