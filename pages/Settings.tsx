
import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Trash2, Radio, Smartphone, Zap, Server, Wifi, Terminal, Copy, ChevronDown, ChevronUp, Palette, Box, Layers, Grid, FileText, MonitorDot, Cpu, Info, Power, Link2Off, Download, Upload, History, FileJson, AlertOctagon, Scissors } from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';
import { createClient } from '@supabase/supabase-js';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'cloud' | 'data'>('theme');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

              // 如果文件超过 4MB，提示瘦身
              if (content.length > 4000000) {
                  if (confirm('检测到备份文件体积过大（约 ' + (content.length / 1024 / 1024).toFixed(1) + 'MB），超出了浏览器 LocalStorage 的承载上限。是否执行“脱水导入”（剔除商品详情图片，仅保留订单和财务数据）？')) {
                      importedState = pruneLargeData(importedState);
                  }
              }

              if (confirm('⚠️ 警告：确定要覆盖当前系统内所有数据吗？')) {
                  dispatch({ type: 'FULL_RESTORE', payload: importedState });
                  showToast('全量数据恢复成功', 'success');
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
                              包含: {state.products.length} 商品, {state.orders.length} 订单, {state.customers.length} 客户
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
                              注意：此操作将覆盖现有数据
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
                      <b>解决配额超出 (Quota Exceeded) 指南：</b> 如果导入失败并提示配额超出，通常是因为备份中包含大量高清 Base64 商品图片。建议：<br/>
                      1. 在导入时选择“瘦身”模式。 <br/>
                      2. 尽量使用 **Supabase 云端同步** 功能，云端数据库不限制存储体积，可支持无限量订单数据。
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
                                  {state.connectionStatus === 'error' && <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-[10px] rounded-full border border-red-500/20 font-mono font-bold">LINK ERROR</span>}
                              </h4>
                              <div className="text-[10px] text-slate-500 font-mono">CLIENT ID: {SESSION_ID}</div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                              基于 Postgres 实时订阅技术。任何修改都将瞬发广播至全球所有活跃会话，实现无缝多人协作。
                          </p>
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
                          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Link2Off className="w-5 h-5"/>}
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
                          <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-slate-500">数据上限状态:</span>
                              <span className="text-white">本地受限 (5MB) / 云端不限</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed pt-2">
                            <b>提示：</b> 如果您有超过 500 个 SKU 或 5000 条订单，请务必使用 Supabase 模式，否则浏览器缓存会由于溢出而无法保存新操作。
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
