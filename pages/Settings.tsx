
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Trash2, Radio, Smartphone, Zap, Server, Wifi, Terminal, Copy, ChevronDown, ChevronUp, History, User, Activity, FileText, Search } from 'lucide-react';
import { useTanxing, Theme, SESSION_ID } from '../context/TanxingContext';
import { createClient } from '@supabase/supabase-js';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'cloud' | 'audit'>('theme');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logSearch, setLogSearch] = useState('');

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
          showToast('云端实时引擎配置已保存', 'success');
      } catch (e: any) {
          showToast(`配置无效: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const filteredLogs = state.auditLogs.filter(log => 
    log.action.toLowerCase().includes(logSearch.toLowerCase()) || 
    log.details.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-slate-400" /> 系统设置 (System Settings)
          </h2>
          <p className="text-sm text-slate-500 mt-1">控制 UI 风格、跨端同步及审计日志查询</p>
        </div>
        {activeTab === 'audit' && (
           <button 
              onClick={() => dispatch({ type: 'CLEAR_AUDIT_LOGS' })}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-bold border border-red-500/20 transition-all"
           >
              清空日志
           </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-6">
          {['theme', 'general', 'cloud', 'audit'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all capitalize ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                  {tab === 'cloud' ? '同步引擎' : tab === 'audit' ? '审计日志' : tab}
              </button>
          ))}
      </div>

      {activeTab === 'audit' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="relative group">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 group-hover:text-white transition-colors" />
                  <input 
                      type="text" 
                      placeholder="检索日志操作码或详情明细..." 
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600"
                  />
              </div>

              <div className="bg-black/20 rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-none space-y-1">
                      {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                          <div key={log.id} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all flex flex-col gap-3 group">
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${log.action.includes('ERROR') ? 'bg-red-500/20 text-red-400' : log.action.includes('AI') ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                          {log.action.includes('AI') ? <Terminal className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                      </div>
                                      <div>
                                          <div className="text-xs font-black text-white font-mono uppercase tracking-tighter">{log.action}</div>
                                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-3">
                                              <span className="flex items-center gap-1"><History className="w-3 h-3"/> {new Date(log.timestamp).toLocaleString()}</span>
                                              <span className="flex items-center gap-1"><User className="w-3 h-3"/> {log.user}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-[9px] font-mono text-slate-700 uppercase opacity-0 group-hover:opacity-100 transition-opacity">ID: {log.id}</div>
                              </div>
                              <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-[11px] font-mono text-slate-400 leading-relaxed break-all">
                                  {log.details}
                              </div>
                          </div>
                      )) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                              <FileText className="w-12 h-12 opacity-20" />
                              <p className="text-sm">当前暂无符合条件的审计日志</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

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
                              开启后，系统将自动监听云端数据库变更。任何终端（电脑、手机）的修改都将秒级同步到当前窗口。
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
          </div>
      )}
    </div>
  );
};

export default Settings;
