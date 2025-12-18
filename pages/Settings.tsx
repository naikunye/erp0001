import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Trash2, Radio, Smartphone, Zap, Server, Wifi, Terminal, Copy, ChevronDown, ChevronUp, Palette, Box, Layers, Grid, FileText, MonitorDot, Cpu } from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';
import { createClient } from '@supabase/supabase-js';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'cloud'>('theme');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [supabaseForm, setSupabaseForm] = useState({
      url: state.supabaseConfig.url || '',
      key: state.supabaseConfig.key || '',
      isRealTime: state.supabaseConfig.isRealTime
  });

  const handleSupabaseSave = async () => {
      setIsSaving(true);
      try {
          const supabase = createClient(supabaseForm.url, supabaseForm.key);
          const { error } = await supabase.from('app_backups').select('id').limit(1);
          if (error) throw error;
          dispatch({ type: 'SET_SUPABASE_CONFIG', payload: supabaseForm });
          showToast('云端实时协同引擎配置已保存', 'success');
      } catch (e: any) {
          showToast(`配置无效: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const themes = [
    { 
        id: 'ios-glass', 
        name: 'Vision Glass', 
        desc: 'VisionOS 空间磨砂质感', 
        icon: Smartphone, 
        color: 'from-blue-500 to-indigo-600',
        activeColor: 'border-indigo-500 shadow-indigo-500/20'
    },
    { 
        id: 'cyber-neon', 
        name: 'Cyber Neon', 
        desc: '沉浸式量子黑客风格', 
        icon: Zap, 
        color: 'from-cyan-400 to-blue-600',
        activeColor: 'border-cyan-400 shadow-cyan-400/20'
    },
    { 
        id: 'paper-minimal', 
        name: 'Carbon Obsidian', 
        desc: '极致暗黑，碳纤纹理与电光紫', 
        icon: Cpu, 
        color: 'from-violet-600 to-slate-900',
        activeColor: 'border-violet-600 shadow-violet-900/40'
    }
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

              <div className="p-7 rounded-2xl border border-violet-500/20 bg-violet-500/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-600"></div>
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-violet-400" /> 渲染性能提示 (Performance Analytics)
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    当前选中的 <b>Carbon Obsidian</b> 主题针对低对比度、高沉浸感办公场景进行了特殊优化。它使用了极简的着色器，在所有终端（包括移动端与低端显示器）上均具备极高的渲染效能与可读性。
                  </p>
              </div>
          </div>
      )}

      {activeTab === 'cloud' && (
          <div className="ios-glass-panel p-10 animate-in fade-in slide-in-from-bottom-2 space-y-10">
              <div className="flex flex-col gap-6 p-7 bg-violet-900/10 border border-violet-500/20 rounded-2xl">
                  <div className="flex items-start gap-5">
                      <div className="p-4 bg-violet-600/10 rounded-2xl text-violet-400 shadow-inner">
                        <Wifi className="w-8 h-8" />
                      </div>
                      <div>
                          <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                              Supabase 量子同步引擎
                              {state.supabaseConfig.url && <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20 animate-pulse font-mono font-bold">READY</span>}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                              基于 Postgres 实时订阅技术，实现全球范围内的业务数据对等同步。任何修改都将瞬间同步至所有活跃会话。
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
                          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                          连接并初始化同步矩阵
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;