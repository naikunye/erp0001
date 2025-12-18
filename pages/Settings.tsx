
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Trash2, Radio, Smartphone, Zap, Server, Wifi, Terminal, Copy, ChevronDown, ChevronUp } from 'lucide-react';
// Fix: Imported SESSION_ID from TanxingContext
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
          // 简单验证
          const supabase = createClient(supabaseForm.url, supabaseForm.key);
          const { error } = await supabase.from('app_backups').select('id').limit(1);
          
          if (error) throw error;

          dispatch({ type: 'SET_SUPABASE_CONFIG', payload: supabaseForm });
          showToast('云端实时引擎配置已保存', 'success');
      } catch (e: any) {
          showToast(`配置无效: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-400" /> 系统设置 (System Settings)
        </h2>
        <p className="text-sm text-slate-500 mt-1">控制 UI 风格与跨端同步参数</p>
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-6">
          {['theme', 'general', 'cloud'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all capitalize ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                  {tab === 'cloud' ? '云端实时同步' : tab}
              </button>
          ))}
      </div>

      {activeTab === 'cloud' && (
          <div className="bg-black/20 rounded-xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-2 space-y-8">
              <div className="flex flex-col gap-4 p-5 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400">
                        <Wifi className="w-6 h-6" />
                      </div>
                      <div>
                          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                              Supabase 实时协同引擎 (Experimental)
                              {state.supabaseConfig.url && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20 animate-pulse">Running</span>}
                          </h4>
                          <p className="text-xs text-indigo-200/70 leading-relaxed">
                              开启后，系统将自动监听云端数据库变更。任何终端（电脑、手机）的修改都将秒级同步到当前窗口，无需手动刷新。
                          </p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">Project URL</label>
                          <input type="text" value={supabaseForm.url} onChange={e => setSupabaseForm({...supabaseForm, url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono" placeholder="https://xyz.supabase.co" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">Public API Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono pr-10" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                                  {showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                              </button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                          <div>
                              <div className="text-xs font-bold text-white">开启实时监听 (Real-time)</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">自动接收来自其他终端的更新</div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={supabaseForm.isRealTime} 
                            onChange={e => setSupabaseForm({...supabaseForm, isRealTime: e.target.checked})}
                            className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-emerald-600 relative transition-all cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5"
                          />
                      </div>
                      <button 
                        onClick={handleSupabaseSave} 
                        disabled={isSaving}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2"
                      >
                          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                          保存并激活协同引擎
                      </button>
                  </div>

                  <div className="flex flex-col justify-center items-center p-6 border-l border-white/10 pl-8 space-y-4">
                      <div className="text-center">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">当前会话标识</div>
                          <div className="px-4 py-2 bg-black/40 rounded border border-white/10 font-mono text-indigo-400 text-sm">
                              {SESSION_ID}
                          </div>
                      </div>
                      <div className="text-xs text-slate-500 text-center leading-relaxed">
                          同一时刻只能激活一个同步源。<br/>
                          如果多台设备同时修改，系统将以最后一次写入为准。
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <div onClick={() => dispatch({type: 'SET_THEME', payload: 'ios-glass'})} className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${state.theme === 'ios-glass' ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-white/5 opacity-50 hover:opacity-100'}`}>
                <Radio className="w-8 h-8 mb-4 text-indigo-400" />
                <h3 className="font-bold text-white">Vision Glass</h3>
                <p className="text-xs text-slate-500 mt-2">VisionOS 空间磨砂质感</p>
              </div>
              {/* 其他主题按钮同理... */}
          </div>
      )}
    </div>
  );
};

export default Settings;
