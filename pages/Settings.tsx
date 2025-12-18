
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
  }, [state.supabaseConfig.url, state.supabaseConfig.key]);

  const handleNukeSystem = () => {
      if (confirm('🆘 终极警告：这将彻底清除浏览器中的本地数据和连接配置。确定继续？')) {
          dispatch({ type: 'RESET_DATA' });
          showToast('系统已彻底重置', 'success');
          setTimeout(() => window.location.reload(), 500);
      }
  };

  const handleSupabaseSave = async () => {
      if (!supabaseForm.url || !supabaseForm.key) {
          showToast('请填写完整的连接参数', 'warning');
          return;
      }
      setIsSaving(true);
      try {
          const client = createClient(supabaseForm.url, supabaseForm.key);
          const { error } = await client.from('app_backups').select('id').limit(1);
          if (error) throw error;
          
          dispatch({ type: 'SET_SUPABASE_CONFIG', payload: supabaseForm });
          showToast('云端协议已激活并持久化', 'success');
          
          // 保存配置后立即执行一次拉取尝试
          setTimeout(() => pullFromCloud(), 500);
      } catch (e: any) {
          showToast(`鉴权失败: ${e.message}`, 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleManualPull = async () => {
      setIsPulling(true);
      try {
          await pullFromCloud();
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
          showToast('本地数据已强制同步至云端', 'success');
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
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            let importedState = JSON.parse(content);
            
            // 校验导入的数据是否包含基本数组结构
            if (!importedState.products && !importedState.orders) {
                throw new Error("JSON 结构不符合 Tanxing 标准协议");
            }

            if (confirm('确定要恢复此本地镜像吗？系统将立即载入并准备推送至云端。')) {
                dispatch({ type: 'FULL_RESTORE', payload: importedState });
                showToast('本地镜像已成功载入', 'success');
                // 延迟强制推送，确保状态机已完成重写
                setTimeout(() => syncToCloud(true), 1500);
            }
        } catch (err: any) {
            showToast(`镜像文件解析失败: ${err.message}`, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // 清除选择
};

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-violet-500" /> 全球同步控制矩阵
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-mono tracking-widest uppercase italic">Neural Persistent V10.0</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleNukeSystem} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all">重置本地核心</button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 mb-8">
          {[
            { id: 'cloud', label: '云端同步', icon: Cloud },
            { id: 'data', label: '本地镜像', icon: Database }
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
                        <div className={`p-4 rounded-2xl ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-slate-800 text-slate-500'}`}>
                            <Wifi className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2">核心连接状态 (Socket)</h4>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-tight">状态: <span className={state.connectionStatus === 'connected' ? 'text-emerald-400 font-black' : 'text-amber-500'}>{state.connectionStatus}</span></p>
                            <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase italic">ID: {SESSION_ID}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={handleManualPull} disabled={isPulling} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border border-white/10">
                              {isPulling ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowDownCircle className="w-4 h-4"/>} 拉取云端
                          </button>
                          <button onClick={handleForcePush} disabled={isForcePushing} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg shadow-violet-900/40">
                              {isForcePushing ? <RefreshCw className="w-3 h-3 animate-spin"/> : <ArrowUpCircle className="w-4 h-4"/>} 强制推送
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
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Secret Key</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:border-violet-500 outline-none" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-4 text-slate-600">{showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
                          </div>
                      </div>
                      <button onClick={handleSupabaseSave} disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                          {isSaving ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />} 保存并激活同步
                      </button>
                  </div>
                  <div className="p-8 bg-black/40 border border-white/10 rounded-3xl space-y-5">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Shield className="w-5 h-5"/></div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest">同步协议 V10.0</h5>
                      </div>
                      <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-3">
                              <span className="text-violet-500 font-black">1.</span>
                              <span>配置持久化：URL 和 Key 已加密保存至独立存储区，刷新页面自动重连。</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-3">
                              <span className="text-violet-500 font-black">2.</span>
                              <span>数据幂等性：系统通过 MD5 指纹校验数据，仅在确实发生变更时才执行上行广播，节省流量。</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-mono flex gap-3">
                              <span className="text-violet-500 font-black">3.</span>
                              <span> Demo 锁：配置云端后，系统将强制切换为生产模式，禁止自动加载模拟数据。</span>
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
                    <h4 className="text-white font-bold">导出 JSON 备份</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">生成系统完整快照。建议每周导出一次并妥善保存。</p>
                  <button onClick={() => {
                      const dataStr = JSON.stringify(state);
                      const blob = new Blob([dataStr], {type: "application/json"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `tanxing_v10_${new Date().toISOString().slice(0,10)}.json`; a.click();
                  }} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 font-mono uppercase tracking-widest"><Download className="w-4 h-4"/> 立即导出</button>
              </div>
              <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-amber-400" />
                    <h4 className="text-white font-bold">恢复数据镜像</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">从本地文件恢复。系统将自动识别历史数据并与当前配置合并。</p>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleLocalImport} accept=".json" />
                  <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-white text-black hover:bg-slate-100 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 font-mono uppercase tracking-widest"><Upload className="w-4 h-4"/> 选择镜像文件</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
