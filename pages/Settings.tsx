
import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command, Search, Fingerprint, ChevronRight,
    Upload, Download, FileUp, FileDown, AlertOctagon, Power, CloudUpload, CloudDownload
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, connectToPb, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'cloud' | 'data'>('cloud'); 
  const [pbInput, setPbInput] = useState(state.pbUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHttps = window.location.protocol === 'https:';

  useEffect(() => {
    setPbInput(state.pbUrl);
  }, [state.pbUrl]);

  const handleConnect = async () => {
      if (!pbInput.trim()) return showToast('请输入节点地址', 'warning');
      setIsTesting(true);
      const cleanUrl = pbInput.trim().replace(/\/$/, ""); 
      try {
          const success = await connectToPb(cleanUrl);
          if (success) {
              showToast('实时链路已激活', 'success');
          }
      } finally {
          setIsTesting(false);
      }
  };

  const handleManualPush = async () => {
      setIsPushing(true);
      try {
          await syncToCloud(true);
      } finally {
          setIsPushing(false);
      }
  };

  const handleManualPull = async () => {
      setIsPulling(true);
      try {
          await pullFromCloud(true);
      } finally {
          setIsPulling(false);
      }
  };

  const handleExportJson = () => {
      const exportData = {
          products: state.products, transactions: state.transactions,
          customers: state.customers, orders: state.orders, shipments: state.shipments,
          tasks: state.tasks, suppliers: state.suppliers, influencers: state.influencers,
          automationRules: state.automationRules, exportDate: new Date().toISOString(), version: "Quantum_V6"
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tanxing_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showToast('全量数据快照已导出', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (confirm('警告：导入将重置当前所有数据并自动同步至云端，是否继续？')) {
                  dispatch({ type: 'BOOT', payload: { ...json, remoteVersion: Date.now() } });
                  showToast('数据已成功注入，正在同步至云端...', 'success');
              }
          } catch (err) { showToast('文件解析失败', 'error'); }
      };
      reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter uppercase">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 核心神经元配置
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Node Session: {SESSION_ID}</p>
        </div>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button onClick={() => setActiveTab('cloud')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'cloud' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Cloud className="w-4 h-4" /> 实时协同云 (Live Sync)
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Database className="w-4 h-4" /> 物理资产管理
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8">
              {isHttps && pbInput.startsWith('http:') && state.connectionStatus !== 'connected' && (
                  <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-[3rem] p-10 animate-in slide-in-from-top-4 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldAlert className="w-40 h-40 text-rose-500" /></div>
                      <div className="flex flex-col md:flex-row gap-12 relative z-10">
                          <div className="md:w-2/5 space-y-6">
                              <div className="w-16 h-16 bg-rose-600 rounded-3xl flex items-center justify-center text-white shadow-xl"><Power className="w-8 h-8" /></div>
                              <h3 className="text-3xl font-black text-white italic tracking-tighter leading-tight uppercase">为什么一直在“转圈圈”？</h3>
                              <p className="text-sm text-rose-200/80 font-bold leading-relaxed">您的浏览器为了安全，拦截了从 HTTPS 页面访问 HTTP 服务器的请求。</p>
                          </div>
                          <div className="md:w-3/5 space-y-4">
                              <div className="bg-black/60 rounded-[2rem] p-8 border border-white/10">
                                  <h4 className="text-white font-bold mb-4 flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-rose-500"/> 快速解决:</h4>
                                  <div className="space-y-4 text-xs text-slate-300">
                                      <p>1. 点击地址栏左侧的 <span className="text-rose-400 font-bold">锁头图标</span></p>
                                      <p>2. 进入【网站设置】，找到 <span className="text-rose-400 font-bold">不安全内容</span></p>
                                      <p>3. 改为 <span className="text-emerald-400 font-bold">允许 (Allow)</span>，然后手动刷新本页面。</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-10 bg-[#0a0a0c] shadow-xl relative">
                  <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Tencent Cloud PocketBase Node (IP:8090)</label>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                             {state.connectionStatus.toUpperCase()}
                          </span>
                      </div>
                      <div className="relative group">
                        <div className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all ${state.connectionStatus === 'connected' ? 'text-emerald-500 scale-110' : 'text-slate-600'}`}>
                           <DatabaseZap className="w-6 h-6"/>
                        </div>
                        <input 
                            type="text" 
                            value={pbInput}
                            onChange={e => setPbInput(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] p-6 pl-16 text-sm text-white font-mono outline-none transition-all focus:border-indigo-500" 
                            placeholder="http://您的服务器IP:8090" 
                        />
                        {isTesting && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                            </div>
                        )}
                      </div>
                      <button 
                        onClick={handleConnect}
                        disabled={isTesting}
                        className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all active:scale-[0.98]"
                      >
                          {isTesting ? '正在握手...' : '激活节点连接'}
                      </button>
                  </div>
                  
                  {state.connectionStatus === 'connected' && (
                      <div className="space-y-6 animate-in fade-in zoom-in-95">
                          <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
                              <div className="flex-1">
                                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                      <CloudUpload className="w-5 h-5 text-indigo-400" />
                                      初始化云端资产
                                  </h4>
                                  <p className="text-xs text-slate-500 leading-relaxed">
                                      如果您在另一台电脑拉取不到数据，请先在此处点击“推送”。它会将您本地的 <b>{state.products.length} 个产品</b>、<b>{state.orders.length} 个订单</b> 等全量数据上传到腾讯云节点。
                                  </p>
                                  {state.lastSyncTime && (
                                      <p className="text-[10px] text-emerald-500 font-mono mt-3 uppercase font-bold tracking-widest">
                                          上次同步时间: {new Date(state.lastSyncTime).toLocaleString()}
                                      </p>
                                  )}
                              </div>
                              <div className="flex gap-4">
                                  <button 
                                    onClick={handleManualPush}
                                    disabled={isPushing}
                                    className="px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                  >
                                      {isPushing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                                      推送全量数据 (Push)
                                  </button>
                                  <button 
                                    onClick={handleManualPull}
                                    disabled={isPulling}
                                    className="px-8 py-5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                  >
                                      {isPulling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                                      从云端拉取 (Pull)
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-8">
                      <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">End-to-End Encryption</span>
                      </div>
                      <div className="flex items-center gap-3 justify-end text-right">
                          <Activity className="w-5 h-5 text-indigo-500" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Latency: ~24ms</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="space-y-6">
              <div className="ios-glass-card p-10 rounded-[3.5rem] border-white/5 space-y-10 bg-black/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="ios-glass-card p-8 rounded-[2rem] border-indigo-500/20 hover:bg-indigo-600/5 transition-all text-left">
                        <FileUp className="w-10 h-10 text-indigo-500 mb-6" />
                        <div className="text-white font-bold text-lg mb-2 uppercase tracking-tight">导入本地数据</div>
                        <p className="text-[11px] text-slate-500 mb-6">上传导出的 JSON 协议包。此操作会重置本地并自动同步。</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJson} />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">选择协议文件</button>
                    </div>

                    <div className="ios-glass-card p-8 rounded-[2rem] border-white/10 hover:bg-white/5 transition-all text-left">
                        <FileDown className="w-10 h-10 text-emerald-500 mb-6" />
                        <div className="text-white font-bold text-lg mb-2 uppercase tracking-tight">导出快照包</div>
                        <p className="text-[11px] text-slate-500 mb-6">下载当前系统的全量数据包，可作为冷备份存档。</p>
                        <button onClick={handleExportJson} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest">执行导出</button>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-red-600/5 border border-red-500/20 rounded-[2rem] flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <AlertOctagon className="w-8 h-8 text-red-500" />
                        <div>
                            <div className="text-red-400 font-bold text-sm uppercase">紧急核心擦除</div>
                            <p className="text-[10px] text-slate-500">这会永久抹除此浏览器的所有缓存，且不可撤销。</p>
                        </div>
                      </div>
                      <button onClick={() => { if(confirm('确定抹除？')) { localStorage.clear(); window.location.reload(); } }} className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-500/30 rounded-xl text-[10px] font-black uppercase">执行擦除</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
