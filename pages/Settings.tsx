
import React, { useState, useRef, useEffect } from 'react';
/* Added AlertTriangle to imports */
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle, Eye, EyeOff, Globe, Trash2, Radio, Smartphone, Zap, Server, Wifi, Terminal, Copy, ChevronDown, ChevronUp, Palette, Box, Layers, Grid, FileText, MonitorDot, Cpu, Info, Power, Link2Off, Download, Upload, History, FileJson, AlertOctagon, Scissors, ArrowUpCircle, ArrowDownCircle, TestTube2, Ghost } from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';
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

  // --- 系统终极重置 ---
  const handleNukeSystem = () => {
      if (confirm('🆘 终极警告：这将彻底清除浏览器中的所有本地数据、缓存和云端连接配置。您的云端数据库不会被删除，但本设备将回归出厂状态。确定继续？')) {
          dispatch({ type: 'RESET_DATA' });
          showToast('系统已成功执行初始化重置', 'success');
          setTimeout(() => window.location.reload(), 1000);
      }
  };

  const handleLoadMock = () => {
      if (confirm('加载模拟演示数据将覆盖当前界面的显示。演示模式下“自动云同步”将临时禁用以防止污染。确定继续？')) {
          dispatch({ type: 'LOAD_MOCK_DATA' });
          showToast('模拟演示数据载入成功 (Read-Only Mode)', 'info');
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
              if (confirm('⚠️ 警告：确定要覆盖本地数据吗？导入后应用将正式进入“生产模式”并允许同步。')) {
                  dispatch({ type: 'FULL_RESTORE', payload: importedState });
                  showToast('全量真实数据恢复成功', 'success');
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
          showToast('云端连接成功，正在拉取...', 'success');
          await pullFromCloud();
      } catch (e: any) {
          showToast(`配置无效: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPull = async () => {
      setIsPulling(true);
      try {
          await pullFromCloud();
          showToast('已从云端拉取最新历史记录', 'success');
      } catch (e: any) {
          showToast(`拉取失败: ${e.message}`, 'error');
      } finally {
          setIsPulling(false);
      }
  };

  const handleForcePush = async () => {
      if (!confirm('确定要将当前本地数据“强制”推送到云端吗？这将清除旧版本。')) return;
      setIsForcePushing(true);
      try {
          await syncToCloud(true);
          showToast('本地数据已强制同步', 'success');
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
              <SettingsIcon className="w-7 h-7 text-violet-500" /> 系统核心配置
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-mono tracking-widest uppercase">System Control & Sync Matrix</p>
        </div>
        <div className="flex gap-3">
            {!state.isDemoMode && state.products.length === 0 && (
                <button onClick={handleLoadMock} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-500 hover:text-white transition-all">
                    <TestTube2 className="w-4 h-4"/> 载入演示模拟数据
                </button>
            )}
            <button onClick={handleNukeSystem} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                <Ghost className="w-4 h-4"/> 重置本地缓存
            </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 mb-8">
          {[
            { id: 'theme', label: '视觉外观', icon: Palette },
            { id: 'cloud', label: '云端同步', icon: Cloud },
            { id: 'data', label: '数据归档', icon: Database }
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 py-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'border-violet-500 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'}`}
              >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              {['ios-glass', 'cyber-neon', 'paper-minimal'].map(id => (
                  <div 
                    key={id} 
                    onClick={() => dispatch({type: 'SET_THEME', payload: id as Theme})}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${state.theme === id ? 'border-violet-500 bg-white/5' : 'border-white/5 bg-black/40 opacity-50'}`}
                  >
                      <h3 className="font-bold text-white capitalize">{id.replace('-', ' ')}</h3>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'data' && (
          <div className="ios-glass-panel p-8 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in">
              <div className="space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-2"><Download className="w-5 h-5 text-blue-400"/> 导出本地 JSON</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">下载当前系统的完整数据镜像。建议在进行重大变更前执行此操作。</p>
                  <button onClick={() => {
                      const dataStr = JSON.stringify(state);
                      const blob = new Blob([dataStr], {type: "application/json"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `tanxing_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
                  }} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">生成并下载</button>
              </div>
              <div className="space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-amber-400"/> 恢复 JSON 归档</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">上传 JSON 归档文件。这将清除当前所有数据并替换为归档内容。</p>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleLocalImport} accept=".json" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white text-black rounded-lg text-xs font-bold">选择文件并恢复</button>
              </div>
          </div>
      )}

      {activeTab === 'cloud' && (
          <div className="ios-glass-panel p-10 space-y-10 animate-in fade-in">
              {state.isDemoMode && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <span className="text-xs text-amber-200 font-bold uppercase tracking-wider">演示模式生效中：自动同步已锁定。请导入真实 JSON 备份或清空模拟数据以开启实时同步。</span>
                  </div>
              )}
              
              <div className="flex flex-col gap-6 p-7 bg-violet-900/10 border border-violet-500/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Wifi className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2">
                                Supabase 协同矩阵
                                {state.connectionStatus === 'connected' && <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] rounded font-black">ACTIVE</span>}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">云端拉取优先模式：启动时自动同步最近的一份有效记录。</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                          <button 
                            onClick={handleManualPull}
                            disabled={isPulling || state.connectionStatus !== 'connected'}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border border-white/10 disabled:opacity-30"
                          >
                              {isPulling ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowDownCircle className="w-3 h-3"/>}
                              拉取 (Pull)
                          </button>
                          <button 
                            onClick={handleForcePush}
                            disabled={isForcePushing || state.connectionStatus !== 'connected'}
                            className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border border-emerald-500/30 disabled:opacity-30"
                          >
                              {isForcePushing ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowUpCircle className="w-3 h-3"/>}
                              推送 (Push)
                          </button>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Supabase URL</label>
                          <input type="text" value={supabaseForm.url} onChange={e => setSupabaseForm({...supabaseForm, url: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-violet-500" placeholder="https://xxx.supabase.co" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Supabase Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-violet-500" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-3 text-slate-600 hover:text-white">{showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
                          </div>
                      </div>
                      <button onClick={handleSupabaseSave} disabled={isSaving} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          保存连接并覆盖本地缓存
                      </button>
                  </div>
                  
                  <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400"/> 安全性策略</h5>
                      <div className="space-y-4 text-[11px] text-slate-500 leading-relaxed font-mono">
                          <p>&gt; 系统现已采取“真实性优先”启动：若检测到有效的云配置，系统将**挂起渲染**直到拉取到最新真实数据。</p>
                          <p>&gt; 自动同步逻辑已增加“反模拟”指纹。加载模拟数据期间，所有向云端的自动推送均被锁定，保护您的生产数据库。</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
