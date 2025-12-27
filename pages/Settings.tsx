
import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Palette, Moon, 
    Zap, ShieldCheck, DatabaseZap, Terminal, Globe, HardDrive,
    Sun, Waves, Wind, Link2Off, Lock, DbIcon, Info, ShieldAlert,
    Trash2, RotateCcw, Download, Upload, FileJson, AlertTriangle
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, bootSupa, disconnectSupa, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('cloud'); 
  const [isSaving, setIsSaving] = useState(false);
  const [supaForm, setSupaForm] = useState({ url: '', anonKey: '' });

  const isConnected = state.connectionStatus === 'connected';
  const isRestricted = state.connectionStatus === 'restricted';
  const isError = state.connectionStatus === 'error';
  const currentSize = state.supaConfig?.payloadSize || 0;

  useEffect(() => {
    if (state.supaConfig) {
        setSupaForm({
            url: state.supaConfig.url || '',
            anonKey: state.supaConfig.anonKey || ''
        });
    }
  }, [state.supaConfig]);

  const handleSaveConfig = async () => {
      let cleanUrl = supaForm.url.trim();
      let cleanKey = supaForm.anonKey.trim();

      if (!cleanUrl || !cleanKey) {
          showToast('请完整填写 Supabase 配置', 'warning');
          return;
      }

      if (!cleanUrl.startsWith('http')) {
          cleanUrl = 'https://' + cleanUrl;
      }
      if (cleanUrl.endsWith('/')) {
          cleanUrl = cleanUrl.slice(0, -1);
      }

      setIsSaving(true);
      try {
          dispatch({ type: 'SET_SUPA_CONFIG', payload: { url: cleanUrl, anonKey: cleanKey } });
          await bootSupa(cleanUrl, cleanKey, true);
          const found = await pullFromCloud(true);
          if (found) {
              showToast('同步成功：已从云端恢复数据', 'success');
          } else {
              showToast('连接成功：请点击右上角云图标上传初始数据', 'info');
          }
      } catch (e: any) {
          // bootSupa 会处理具体的报错提示
      } finally {
          setIsSaving(false);
      }
  };

  const handleFullReset = () => {
      if (confirm('警告：此操作将清除所有云端同步配置（不影响本地数据），是否继续？')) {
          disconnectSupa();
          showToast('云端协议已注销', 'info');
      }
  };

  const handleExportData = () => {
      const exportData = {
          products: state.products,
          transactions: state.transactions,
          customers: state.customers,
          orders: state.orders,
          shipments: state.shipments,
          influencers: state.influencers,
          suppliers: state.suppliers,
          tasks: state.tasks,
          inboundShipments: state.inboundShipments,
          automationRules: state.automationRules
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tanxing_OS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据镜像已成功导出至本地', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (!data.products || !Array.isArray(data.products)) {
                  throw new Error("无效的探行数据格式");
              }
              dispatch({ type: 'HYDRATE_STATE', payload: data });
              showToast('本地镜像解析成功，系统节点已重组', 'success');
          } catch (err: any) {
              showToast(`导入失败: ${err.message}`, 'error');
          }
      };
      reader.readAsText(file);
      e.target.value = ''; 
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 系统偏好与数据协议
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono tracking-[0.4em] uppercase">Enterprise Data Control Hub</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleFullReset} className="px-4 py-2 border border-slate-700 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95">Reset Cloud Protocol</button>
            <button onClick={() => confirm('确定重置所有本地缓存数据？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95">Reset Local Node</button>
        </div>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit backdrop-blur-md">
          {[
            { id: 'theme', label: '视觉外观', icon: Palette },
            { id: 'cloud', label: '云端同步 (Supa)', icon: Cloud },
            { id: 'data', label: '离线管理', icon: Database }
          ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              {[{ id: 'ios-glass', name: '曜石深渊', icon: Waves, color: 'from-blue-600 to-indigo-900', desc: '经典深蓝毛玻璃' }, { id: 'midnight-dark', name: '落日地平线', icon: Sun, color: 'from-rose-600 to-amber-900', desc: '暖红基调' }, { id: 'cyber-neon', name: '翡翠星云', icon: Wind, color: 'from-emerald-600 to-teal-900', desc: '极光青绿' }].map(t => (
                  <div key={t.id} onClick={() => dispatch({type:'SET_THEME', payload: t.id as any})} className={`ios-glass-card cursor-pointer border-2 p-1 rounded-[2rem] transition-all group relative overflow-hidden ${state.theme === t.id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-white/5 hover:border-white/20'}`}>
                      <div className={`h-32 w-full rounded-[1.8rem] bg-gradient-to-br ${t.color} mb-4 flex items-center justify-center relative overflow-hidden`}>
                          <t.icon className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="p-5 pt-0"><h4 className="font-black text-white text-sm mb-1 uppercase">{t.name}</h4><p className="text-[10px] text-slate-500">{t.desc}</p></div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'cloud' && (
          <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-indigo-600/10 border-2 border-indigo-500/20 rounded-[2.5rem] p-8 flex items-center gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><Terminal className="w-40 h-40"/></div>
                  <div className="p-5 bg-indigo-600 rounded-3xl text-white shadow-2xl shrink-0"><DatabaseZap className="w-10 h-10"/></div>
                  <div className="flex-1">
                      <h4 className="text-white font-black text-lg uppercase italic tracking-tighter">数据库核心配置 (SQL SETUP)</h4>
                      <p className="text-slate-400 text-sm mt-1">请务必依次执行以下代码，否则同步会报“403 Forbidden”错误：</p>
                      <div className="mt-5 space-y-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-indigo-400 uppercase">1. 创建数据表</span>
                            <code className="block bg-black/60 border border-white/10 px-6 py-4 rounded-2xl text-emerald-400 font-mono text-[10px] shadow-inner leading-relaxed">
                                create table backups (<br/>
                                &nbsp;&nbsp;unique_id text primary key,<br/>
                                &nbsp;&nbsp;payload text,<br/>
                                &nbsp;&nbsp;updated_at timestamptz default now()<br/>
                                );
                            </code>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-amber-400 uppercase">2. 开启 RLS 读写权限 (关键步骤)</span>
                            <code className="block bg-black/60 border border-white/10 px-6 py-4 rounded-2xl text-amber-400 font-mono text-[10px] shadow-inner leading-relaxed">
                                alter table backups enable row level security;<br/>
                                create policy "Allow All" on backups for all using (true) with check (true);
                            </code>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className={`lg:col-span-2 border rounded-[2.5rem] p-8 flex items-start gap-6 transition-all ${isConnected ? 'bg-emerald-500/5 border-emerald-500/30' : isRestricted ? 'bg-amber-500/5 border-amber-500/30' : isError ? 'bg-red-500/5 border-red-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
                      <div className={`p-4 rounded-2xl shrink-0 ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : isRestricted ? 'bg-amber-500/20 text-amber-400' : isError ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {isConnected ? <ShieldCheck className="w-8 h-8" /> : isRestricted ? <AlertTriangle className="w-8 h-8" /> : isError ? <ShieldAlert className="w-8 h-8" /> : <DatabaseZap className="w-8 h-8" />}
                      </div>
                      <div className="flex-1">
                          <h4 className={`font-black text-sm uppercase tracking-wider ${isConnected ? 'text-emerald-400' : isRestricted ? 'text-amber-400' : isError ? 'text-red-400' : 'text-indigo-300'}`}>
                              {isConnected ? 'Supabase：神经链路稳固' : isRestricted ? '同步模式：手动受限' : isError ? '数据库访问受限' : '云端同步协议'}
                          </h4>
                          <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : isRestricted ? 'bg-amber-500' : isError ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                  <span className="text-xs font-bold text-white uppercase">状态: {state.connectionStatus.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${state.supaConfig.remoteUpdatedAt ? 'bg-indigo-500 shadow-[0_0_12px_#6366f1]' : 'bg-slate-700'}`}></div>
                                  <span className="text-xs font-bold text-white uppercase">最新镜像: <span className="font-mono text-indigo-300">{state.supaConfig.remoteUpdatedAt ? new Date(state.supaConfig.remoteUpdatedAt).toLocaleString() : 'N/A'}</span></span>
                              </div>
                          </div>
                      </div>
                      {(isConnected || isRestricted || isError) && (
                          <div className="flex flex-col gap-2">
                              <button onClick={handleFullReset} className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-xl text-red-400 font-black text-[10px] uppercase border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                  注销连接
                              </button>
                          </div>
                      )}
                  </div>
                  <div className="ios-glass-panel p-8 rounded-[2.5rem] flex flex-col justify-center border-white/10">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><HardDrive className="w-4 h-4 text-indigo-400" /> 载荷尺寸</span>
                      </div>
                      <div className="text-2xl font-black text-white font-mono">{formatSize(currentSize)}</div>
                      <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase italic">Syncing via PostgreSQL REST Pipeline</p>
                  </div>
              </div>

              <div className="ios-glass-panel p-10 space-y-10 rounded-[2.5rem] border-white/10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6 relative">
                          {(isConnected || isRestricted) && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-3xl">
                                  <Lock className="w-10 h-10 text-indigo-400 mb-4" />
                                  <p className="text-xs font-black text-indigo-200 uppercase tracking-widest">配置已锁定</p>
                                  <button onClick={handleFullReset} className="mt-4 px-6 py-2 bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase border border-red-500/30">重置并解锁</button>
                              </div>
                          )}
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">Supabase Project URL</label>
                              <input type="text" value={supaForm.url} onChange={e=>setSupaForm({...supaForm, url: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono outline-none" placeholder="https://xyz.supabase.co" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">Anon Public Key</label>
                              <input type="password" value={supaForm.anonKey} onChange={e=>setSupaForm({...supaForm, anonKey: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono outline-none" placeholder="eyJhbG..." />
                          </div>
                          <button onClick={handleSaveConfig} disabled={isSaving || isConnected || isRestricted} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isConnected ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'}`}>
                              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <DatabaseZap className="w-5 h-5" />}
                              接入并测试连接
                          </button>
                      </div>
                      
                      <div className="bg-white/2 border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-4 mb-6">
                              <Info className="w-6 h-6 text-indigo-400" />
                              <h5 className="text-white font-bold uppercase italic tracking-widest">额度超限与同步排障</h5>
                          </div>
                          <ul className="text-xs text-slate-500 space-y-4 leading-relaxed font-bold">
                              <li className="flex gap-3"><span className="text-amber-500 font-bold">！</span><span>**额度预警：** Supabase 免费版有 200 个实时连接限制。如果超限，状态会显示为 **RESTRICTED**，此时“实时更新”将失效，但您仍可以点击右上角图标进行“手动同步”。</span></li>
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">01</span><span>如果提示“Failed to fetch”，说明网络物理不通。**请关闭 VPN 的分流功能或开启全局模式**，Supabase 服务在部分地区存在 DNS 污染。</span></li>
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">02</span><span>请检查 **Anon Key** 是否正确，若 Key 错误会导致所有 REST 请求返回 403。</span></li>
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="ios-glass-card p-8 border-l-4 border-l-blue-500 bg-blue-500/5 group">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><Download className="w-7 h-7"/></div>
                          <div>
                              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">导出全域镜像 (Export)</h4>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">PACKING BUSINESS LOGIC TO JSON</p>
                          </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-8">将当前本地存储中的所有产品、订单、财务和物流协议导出为一份独立的加密 JSON 文件。该文件可用于跨设备离线恢复或长期归档。</p>
                      <button 
                        onClick={handleExportData}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                          <FileJson className="w-5 h-5"/> 执行全量备份导出
                      </button>
                  </div>

                  <div className="ios-glass-card p-8 border-l-4 border-l-purple-500 bg-purple-500/5 group">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-purple-600 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><Upload className="w-7 h-7"/></div>
                          <div>
                              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">重构/恢复镜像 (Import)</h4>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">RECONSTRUCTING SYSTEM STATE</p>
                          </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-8">上传之前导出的 JSON 备份文件。系统将清除当前所有本地内存数据，并根据上传的文件重新初始化所有业务节点。该操作不可撤销。</p>
                      <label className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer">
                          <RefreshCw className="w-5 h-5"/> 解析本地 JSON 镜像
                          <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>
                  </div>
              </div>

              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 bg-amber-500/5 border border-dashed border-amber-500/20">
                  <div className="flex items-center gap-4 mb-4">
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                      <h4 className="text-amber-200 font-bold uppercase tracking-widest">数据主权声明</h4>
                  </div>
                  <p className="text-xs text-amber-500/70 leading-relaxed font-medium">
                      探行 ERP 采用 **本地优先 (Local-First)** 架构。您的业务数据默认仅存储在当前浏览器的 IndexedDB 安全沙箱中。
                      导出功能允许您将数据主权掌握在自己手中。请妥善保管导出的 JSON 文件，任何拥有该文件的人都能读取您的完整经营机密。
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
