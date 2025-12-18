
import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Trash2, Radio, Smartphone, Zap, Server, Wifi, Terminal, Copy, ChevronDown, ChevronUp, Palette, Box, Layers, Grid, FileText, MonitorDot, Cpu, Info, Power, Link2Off, Download, Upload, History, FileJson, AlertOctagon, Scissors, ArrowUpCircle } from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';
import { createClient } from '@supabase/supabase-js';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'cloud' | 'data'>('theme');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isForcePushing, setIsForcePushing] = useState(false);
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

  // --- 本地数据全量导出 ---
  const handleLocalExport = () => {
      try {
          const dataStr = JSON.stringify(state, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const exportFileDefaultName = `Tanxing_Backup_${new Date().toISOString().slice(0,10)}_${SESSION_ID}.json`;
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          showToast('本地量子归档已生成', 'success');
      } catch (e) {
          showToast('导出失败，请检查浏览器权限', 'error');
      }
  };

  // --- 关键：数据瘦身工具 (剔除大体积 Base64 图片) ---
  const pruneLargeData = (data: any) => {
      const slimmed = { ...data };
      if (slimmed.products) {
          slimmed.products = slimmed.products.map((p: any) => {
              const { image, images, ...rest } = p;
              return rest;
          });
      }
      return slimmed;
  };

  // --- 本地数据全量上传恢复 ---
  const handleLocalImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              let importedState = JSON.parse(content);
              
              const hasCoreData = !!(importedState.products || importedState.orders || importedState.customers);
              if (!hasCoreData) {
                  throw new Error('归档文件不含有效的业务数据对象');
              }

              if (content.length > 4000000) {
                  if (confirm('检测到备份文件体积过大（约 ' + (content.length / 1024 / 1024).toFixed(1) + 'MB）。是否执行“脱水导入”（剔除图片，仅保留核心数据）以确保成功保存？')) {
                      importedState = pruneLargeData(importedState);
                  }
              }

              if (confirm('⚠️ 警告：确定要覆盖当前系统内所有数据吗？导入后，请务必在“云端同步”中执行一次“强制覆盖云端”，否则旧云端数据可能会回传同步。')) {
                  dispatch({ type: 'FULL_RESTORE', payload: importedState });
                  showToast('全量数据恢复成功，请检查云同步状态', 'success');
              }
          } catch (err: any) {
              showToast(`导入失败: ${err.message}`, 'error');
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSupabaseSave = async () => {
      setIsSaving(true);
      try {
          const supabase = createClient(supabaseForm.url, supabaseForm.key);
          const { error } = await supabase.from('app_backups').select('id').limit(1);
          if (error) throw error;
          dispatch({ type: 'SET_SUPABASE_CONFIG', payload: supabaseForm });
          showToast('云端协同引擎配置成功', 'success');
      } catch (e: any) {
          showToast(`配置无效: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  // --- 强制云端同步逻辑 ---
  const handleForcePush = async () => {
      if (!state.supabaseConfig?.url || !state.supabaseConfig?.key) {
          showToast('请先配置云端连接', 'warning');
          return;
      }
      if (!confirm('确定将当前本地数据强制上传并覆盖云端吗？这将清理云端旧的历史记录快照。')) return;
      
      setIsForcePushing(true);
      try {
          await syncToCloud(true);
          showToast('本地数据已强制覆盖云端镜像', 'success');
      } catch (e: any) {
          showToast(`强制同步失败: ${e.message}`, 'error');
      } finally {
          setIsForcePushing(false);
      }
  };

  const themes = [
    { id: 'ios-glass', name: 'Vision Glass', desc: 'VisionOS 空间磨砂质感', icon: Smartphone, color: 'from-blue-500 to-indigo-600', activeColor: 'border-indigo-500 shadow-indigo-500/20' },
    { id: 'cyber-neon', name: 'Cyber Neon', desc: '沉浸式量子黑客风格', icon: Zap, color: 'from-cyan-400 to-blue-600', activeColor: 'border-cyan-400 shadow-cyan-400/20' },
    { id: 'paper-minimal', name: 'Carbon Obsidian', desc: '极致暗黑，碳纤纹理与电光紫', icon: Cpu, color: 'from-violet-600 to-slate-900', activeColor: 'border-violet-600 shadow-violet-900/40' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-violet-500" /> 系统核心配置 (Kernel)
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono uppercase tracking-widest">Management of UI Protocol & Synchronization Matrix</p>
      </div>

      <div className="flex gap-4 border-b border-white/5 mb-8">
          {[
            { id: 'theme', label: '视觉外观', icon: Palette },
            { id: 'cloud', label: '云端同步', icon: Cloud },
            { id: 'data', label: '数据归档', icon: Database },
            { id: 'general', label: '系统通用', icon: Server }
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
          <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {themes.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => dispatch({type: 'SET_THEME', payload: t.id as Theme})} 
                        className={`group relative cursor-pointer rounded-2xl border-2 p-7 transition-all duration-300 overflow-hidden ${
                            state.theme === t.id 
                            ? `${t.activeColor} bg-white/5` 
                            : 'border-white/5 bg-black/40 opacity-50 hover:opacity-100 hover:bg-white/5'
                        }`}
                      >
                        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${t.color} opacity-10 blur-3xl group-hover:opacity-30 transition-opacity`}></div>
                        <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${t.color} shadow-2xl text-white`}>
                            <t.icon className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-white text-lg">{t.name}</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed h-10">{t.desc}</p>
                        {state.theme === t.id && (
                            <div className="absolute bottom-5 right-5 bg-violet-500/20 text-violet-400 p-1.5 rounded-full border border-violet-500/30">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="ios-glass-panel p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Export Section */}
                  <div className="space-y-6 flex flex-col">
                      <div className="flex items-center gap-4 mb-2">
                          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                              <Download className="w-6 h-6" />
                          </div>
                          <div>
                              <h4 className="text-base font-bold text-white">量子归档导出</h4>
                              <p className="text-xs text-slate-500">下载当前系统的完整数据镜像文件</p>
                          </div>
                      </div>
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                          <FileJson className="w-12 h-12 text-slate-700" />
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
                              包含: {state.products.length} 商品, {state.orders.length} 订单
                          </p>
                          <button 
                            onClick={handleLocalExport}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xl shadow-blue-900/40 flex items-center gap-2 transition-all active:scale-95"
                          >
                              <Download className="w-4 h-4" /> 生成归档并下载 (.json)
                          </button>
                      </div>
                  </div>

                  {/* Import Section */}
                  <div className="space-y-6 flex flex-col">
                      <div className="flex items-center gap-4 mb-2">
                          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                              <Upload className="w-6 h-6" />
                          </div>
                          <div>
                              <h4 className="text-base font-bold text-white">归档数据恢复</h4>
                              <p className="text-xs text-slate-500">上传 JSON 归档文件以覆盖当前数据</p>
                          </div>
                      </div>
                      <div className="flex-1 border-2 border-dashed border-amber-500/20 bg-amber-500/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 group hover:border-amber-500/40 transition-all">
                          <AlertOctagon className="w-12 h-12 text-amber-600/50 group-hover:text-amber-500 transition-colors" />
                          <p className="text-[10px] text-amber-200/40 uppercase tracking-widest font-bold">
                              注意：此操作将覆盖本地现有数据
                          </p>
                          <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef} 
                            onChange={handleLocalImport} 
                            className="hidden" 
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-8 py-3 bg-white text-black hover:bg-amber-50 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95"
                          >
                              <Upload className="w-4 h-4" /> 选择并上传归档文件
                          </button>
                      </div>
                  </div>
              </div>

              <div className="bg-white/2 border border-white/5 rounded-2xl p-6 flex items-start gap-4">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Scissors className="w-4 h-4" /></div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                      <b>重要提醒：</b> 导入旧版 JSON 后，本地状态可能尚未广播。如果发现数据又变回了云端的旧版本，请在“云端同步”选项卡中手动点击一次“<b>强制本地覆盖云端</b>”按钮。
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'cloud' && (
          <div className="ios-glass-panel p-10 animate-in fade-in slide-in-from-bottom-2 space-y-10">
              <div className="flex flex-col gap-6 p-7 bg-violet-900/10 border border-violet-500/20 rounded-2xl">
                  <div className="flex items-start gap-5">
                      <div className={`p-4 rounded-2xl shadow-inner ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-600/10 text-violet-400'}`}>
                        {state.connectionStatus === 'connected' ? <Wifi className="w-8 h-8" /> : <Power className="w-8 h-8" />}
                      </div>
                      <div className="flex-1">
                          <div className="flex items-center justify-between">
                              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                                  Supabase 量子同步引擎
                                  {state.connectionStatus === 'connected' && <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20 animate-pulse font-mono font-bold">REALTIME ACTIVE</span>}
                              </h4>
                              <div className="text-[10px] text-slate-500 font-mono tracking-tighter">NODE_ID: {SESSION_ID}</div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                              实时协同已激活。当多个终端同时在线时，变更将实现毫秒级双向同步。
                          </p>
                          {state.connectionStatus === 'connected' && (
                              <div className="mt-4 flex gap-4">
                                  <button 
                                    onClick={handleForcePush} 
                                    disabled={isForcePushing}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                                  >
                                      {isForcePushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                                      强制本地覆盖云端 (Force Push)
                                  </button>
                                  <p className="text-[9px] text-slate-600 italic flex items-center">同步异常？点击此按钮将当前本地数据强行作为“最新版本”推送到云端。</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Project Endpoint</label>
                          <input type="text" value={supabaseForm.url} onChange={e => setSupabaseForm({...supabaseForm, url: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:border-violet-500 outline-none" placeholder="https://xyz.supabase.co" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Master Protocol Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white font-mono pr-12 focus:border-violet-500 outline-none" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-3 text-slate-600 hover:text-white">
                                  {showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                              </button>
                          </div>
                      </div>
                      <button 
                        onClick={handleSupabaseSave} 
                        disabled={isSaving}
                        className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-violet-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>}
                          连接并初始化同步矩阵
                      </button>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Info className="w-4 h-4" /> 实时诊断报告 (Diagnosis)</h4>
                      <div className="space-y-4 font-mono text-[10px]">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-slate-500">连接状态:</span>
                              <span className={state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>{state.connectionStatus.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-slate-500">上次心跳广播:</span>
                              <span className="text-white">{state.supabaseConfig?.lastSync || 'N/A'}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed pt-2">
                            <b>冲突解决：</b> 如果导入数据后云端仍然显示旧数据，说明云端的记录序列号（timestamp）更新或由于网络波动，本地变更未被云端接受。使用顶部的“<b>强制覆盖</b>”按钮可一键清除冲突。
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
