
import React, { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Palette, 
    Zap, ShieldCheck, DatabaseZap, Terminal, Globe, HardDrive,
    Sun, Waves, Wind, Lock, Info, ShieldAlert,
    Download, Upload, FileJson, AlertTriangle
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, bootSupa, disconnectSupa, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'theme' | 'cloud' | 'data'>('cloud'); 
  const [isSaving, setIsSaving] = useState(false);
  const [pbUrl, setPbUrl] = useState('');

  const isConnected = state.connectionStatus === 'connected';
  const isError = state.connectionStatus === 'error';
  const currentSize = state.pbConfig?.payloadSize || 0;

  useEffect(() => {
    if (state.pbConfig) {
        setPbUrl(state.pbConfig.url || '');
    }
  }, [state.pbConfig]);

  const handleSaveConfig = async () => {
      let cleanUrl = pbUrl.trim();

      if (!cleanUrl) {
          showToast('请填入 PocketBase 节点地址', 'warning');
          return;
      }

      if (!cleanUrl.startsWith('http')) {
          cleanUrl = 'http://' + cleanUrl;
      }
      if (cleanUrl.endsWith('/')) {
          cleanUrl = cleanUrl.slice(0, -1);
      }

      setIsSaving(true);
      try {
          dispatch({ type: 'SET_PB_CONFIG', payload: { url: cleanUrl } });
          await bootSupa(cleanUrl, '', true);
          const found = await pullFromCloud(true);
          if (found) {
              showToast('同步成功：已恢复最新经营镜像', 'success');
          }
      } catch (e: any) {
          // bootSupa 内部有错误处理
      } finally {
          setIsSaving(false);
      }
  };

  const handleFullReset = () => {
      if (confirm('警告：此操作将断开私有云连接（不影响本地数据），是否继续？')) {
          disconnectSupa();
          showToast('私有云网关已离线', 'info');
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
      a.download = `Tanxing_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('全域镜像导出完成', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              dispatch({ type: 'HYDRATE_STATE', payload: data });
              showToast('数据节点已重组', 'success');
          } catch (err: any) {
              showToast('镜像解析异常', 'error');
          }
      };
      reader.readAsText(file);
      e.target.value = ''; 
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 系统偏好与私有云协议
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono tracking-[0.4em] uppercase">Private Matrix Control Hub</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleFullReset} className="px-4 py-2 border border-slate-700 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95">Reset Cloud Protocol</button>
            <button onClick={() => confirm('重置所有本地数据？') && dispatch({type:'RESET_DATA'})} className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95">Reset Local Node</button>
        </div>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit backdrop-blur-md">
          {[
            { id: 'theme', label: '视觉外观', icon: Palette },
            { id: 'cloud', label: '私有云同步 (PocketBase)', icon: Cloud },
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
                      <h4 className="text-white font-black text-lg uppercase italic tracking-tighter">私有云节点部署 (SERVER SETUP)</h4>
                      <p className="text-slate-400 text-sm mt-1">推荐使用腾讯云香港轻量服务器（约32元/月），部署 PocketBase 单文件后端：</p>
                      <div className="mt-5 space-y-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-indigo-400 uppercase">1. 创建集合 (Collection)</span>
                            <p className="text-xs text-slate-500 mb-2">在 PocketBase 管理后台创建一个名为 <code className="text-indigo-400">backups</code> 的集合。</p>
                            <span className="text-[10px] font-black text-amber-400 uppercase">2. 添加字段 (Fields)</span>
                            <code className="block bg-black/60 border border-white/10 px-6 py-4 rounded-2xl text-emerald-400 font-mono text-[10px] shadow-inner leading-relaxed">
                                unique_id: Plain Text (Required, Unique)<br/>
                                payload: Plain Text (Max 5MB)
                            </code>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className={`lg:col-span-2 border rounded-[2.5rem] p-8 flex items-start gap-6 transition-all ${isConnected ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
                      <div className={`p-4 rounded-2xl shrink-0 ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {isConnected ? <ShieldCheck className="w-8 h-8" /> : <DatabaseZap className="w-8 h-8" />}
                      </div>
                      <div className="flex-1">
                          <h4 className={`font-black text-sm uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-indigo-300'}`}>
                              {isConnected ? '私有链路已激活' : '私有云同步协议'}
                          </h4>
                          <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-slate-700'}`}></div>
                                  <span className="text-xs font-bold text-white uppercase">状态: {state.connectionStatus.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-3 text-indigo-400">
                                  <Zap className="w-3 h-3" />
                                  <span className="text-[10px] font-black uppercase">PocketBase 无硬性并发限制 • 香港节点加速</span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="ios-glass-panel p-8 rounded-[2.5rem] flex flex-col justify-center border-white/10">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><HardDrive className="w-4 h-4 text-indigo-400" /> 同步载荷尺寸</span>
                      </div>
                      <div className="text-2xl font-black text-white font-mono">{formatSize(currentSize)}</div>
                      <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase italic">Encrypted Payload Stream</p>
                  </div>
              </div>

              <div className="ios-glass-panel p-10 space-y-10 rounded-[2.5rem] border-white/10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6 relative">
                          {isConnected && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-3xl">
                                  <Lock className="w-10 h-10 text-indigo-400 mb-4" />
                                  <p className="text-xs font-black text-indigo-200 uppercase tracking-widest">链路已锁定</p>
                                  <button onClick={handleFullReset} className="mt-4 px-6 py-2 bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase border border-red-500/30">解除协议</button>
                              </div>
                          )}
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">PocketBase Endpoint</label>
                              <input type="text" value={pbUrl} onChange={e=>setPbUrl(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white font-mono outline-none" placeholder="http://1.2.3.4:8090" />
                          </div>
                          <button onClick={handleSaveConfig} disabled={isSaving || isConnected} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isConnected ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'}`}>
                              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <DatabaseZap className="w-5 h-5" />}
                              接入私有云节点
                          </button>
                      </div>
                      
                      <div className="bg-white/2 border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-4 mb-6">
                              <ShieldAlert className="w-6 h-6 text-indigo-500" />
                              <h5 className="text-white font-bold uppercase italic tracking-widest">迁移与稳定性说明</h5>
                          </div>
                          <ul className="text-xs text-slate-500 space-y-4 leading-relaxed font-bold">
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">01</span><span>**解除枷锁：** PocketBase 基于 SQLite，即使在 1C1G 服务器上也能支撑极高频的数据同步，不再受 Supabase 免费版 200 连接的限制。</span></li>
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">02</span><span>**网络直连：** 由于腾讯云香港到 Vercel 属于国际链路优化区间，您的 VPN 即使在“分流模式”下也能保持极高成功率。</span></li>
                              <li className="flex gap-3"><span className="text-indigo-500 font-bold">03</span><span>**数据主权：** 您的所有经营数据现在存储在您自己租用的服务器中，系统不保留任何 Key 副本。</span></li>
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
                              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">导出镜像 (Export)</h4>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">DATA PERSISTENCE</p>
                          </div>
                      </div>
                      <button onClick={handleExportData} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3"><FileJson className="w-5 h-5"/> 执行全量备份导出</button>
                  </div>

                  <div className="ios-glass-card p-8 border-l-4 border-l-purple-500 bg-purple-500/5 group">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-purple-600 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform"><Upload className="w-7 h-7"/></div>
                          <div>
                              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">重构镜像 (Import)</h4>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">SYSTEM RESTORE</p>
                          </div>
                      </div>
                      <label className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 cursor-pointer">
                          <RefreshCw className="w-5 h-5"/> 解析本地 JSON 镜像
                          <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
