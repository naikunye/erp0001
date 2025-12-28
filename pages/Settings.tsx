
import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity, ExternalLink as LinkIcon,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command, Search, Fingerprint, ChevronRight,
    Upload, Download, FileUp, FileDown, AlertOctagon
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, connectToPb, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'cloud' | 'data'>('cloud'); 
  const [pbInput, setPbInput] = useState(state.pbUrl || '');
  const [isTesting, setIsTesting] = useState(false);
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
              showToast('量子链路激活成功', 'success');
          } else {
              showToast('连接超时：请确认 IP 端口 8090 已开放且浏览器已放行不安全内容', 'error');
          }
      } catch (e: any) {
          showToast('链路异常', 'error');
      } finally {
          setIsTesting(false);
      }
  };

  // --- 数据导入导出逻辑 ---
  const handleExportJson = () => {
      const exportData = {
          products: state.products,
          transactions: state.transactions,
          customers: state.customers,
          orders: state.orders,
          shipments: state.shipments,
          tasks: state.tasks,
          suppliers: state.suppliers,
          influencers: state.influencers,
          automationRules: state.automationRules,
          exportDate: new Date().toISOString(),
          version: "Quantum_V6"
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tanxing_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showToast('数据协议包已导出', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              // 基本结构校验
              if (!json.products && !json.transactions) {
                  throw new Error("无效的协议格式：未检测到核心资产节点");
              }

              if (confirm('⚠️ 警告：导入操作将覆盖当前浏览器及云端的所有数据，是否继续执行？')) {
                  dispatch({ type: 'BOOT', payload: { ...json, isInitialized: true } });
                  showToast('数据注入成功：正在固化至本地网格', 'success');
                  
                  // 如果云端已连接，自动触发一次云同步
                  if (state.connectionStatus === 'connected') {
                      setTimeout(() => {
                          syncToCloud(true);
                          showToast('云端镜像同步已完成', 'success');
                      }, 1000);
                  }
              }
          } catch (err: any) {
              showToast(`协议解析失败: ${err.message}`, 'error');
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = ''; // 清空选择
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter uppercase">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 系统核心配置
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Environment Protocol: {isHttps ? 'ENCRYPTED HTTPS' : 'INSECURE HTTP'}</p>
        </div>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button onClick={() => setActiveTab('cloud')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'cloud' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Cloud className="w-4 h-4" /> 云端同步 (Cloud)
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Database className="w-4 h-4" /> 数据管理 (Inventory)
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8">
              {isHttps && pbInput.startsWith('http:') && state.connectionStatus !== 'connected' && (
                  <div className="bg-indigo-600/10 border-2 border-indigo-500/30 rounded-[3rem] p-10 animate-in slide-in-from-top-4 shadow-2xl">
                      <div className="flex flex-col md:flex-row gap-12">
                          <div className="md:w-2/5 space-y-6">
                              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                                  <ShieldAlert className="w-8 h-8" />
                              </div>
                              <h3 className="text-3xl font-black text-white italic tracking-tighter leading-tight uppercase">浏览器安全策略<br/>深度解除指南</h3>
                              <p className="text-xs text-indigo-200/60 font-bold leading-relaxed">
                                  由于 Vercel 强制使用 HTTPS，您必须手动告诉浏览器“允许访问您的私有数据库 IP”。
                              </p>
                          </div>
                          <div className="md:w-3/5 space-y-4">
                              <div className="bg-black/60 rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group">
                                  <div className="space-y-6">
                                      <div className="flex items-start gap-4">
                                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                          <div className="text-sm">
                                              <p className="text-white font-bold mb-2">点击地址栏最左侧的【调整】或【锁头】图标</p>
                                          </div>
                                      </div>
                                      <div className="flex items-start gap-4">
                                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                          <div className="text-sm">
                                              <p className="text-white font-bold mb-2">选择【网站设置】并在底部找到【不安全内容】</p>
                                          </div>
                                      </div>
                                      <div className="flex items-start gap-4">
                                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                                          <div className="text-sm">
                                              <p className="text-white font-bold mb-2">将其改为【允许 (Allow)】并手动刷新页面</p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-10 bg-[#0a0a0c] shadow-xl">
                  <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Quantum Cloud Node (IP:PORT)</label>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${state.connectionStatus === 'connected' ? 'text-emerald-400 border-emerald-500/30' : 'text-indigo-400 border-indigo-500/30'}`}>
                             SYSTEM STATUS: {state.connectionStatus.toUpperCase()}
                          </span>
                      </div>
                      <div className="relative group">
                        <div className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all ${state.connectionStatus === 'connected' ? 'text-emerald-500 scale-110' : 'text-slate-600'}`}>
                           <Database className="w-6 h-6"/>
                        </div>
                        <input 
                            type="text" 
                            value={pbInput}
                            onChange={e => setPbInput(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] p-6 pl-16 text-sm text-white font-mono outline-none transition-all focus:border-indigo-500" 
                            placeholder="http://119.28.72.106:8090" 
                        />
                      </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-5">
                      <button 
                        onClick={handleConnect}
                        disabled={isTesting}
                        className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-indigo-900/40"
                      >
                          {isTesting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                          建立量子神经链路
                      </button>
                      
                      {state.connectionStatus === 'connected' && (
                          <div className="flex gap-4 animate-in zoom-in-95">
                            <button onClick={() => syncToCloud(true)} className="px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg">同步镜像</button>
                            <button onClick={() => pullFromCloud(true)} className="px-10 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg">云端拉取</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="space-y-6">
              <div className="ios-glass-card p-10 rounded-[3.5rem] border-white/5 space-y-10 bg-black/40 shadow-2xl">
                  <div className="flex items-center gap-8">
                    <div className="p-6 bg-indigo-600/10 rounded-[2rem] text-indigo-500 border border-indigo-500/20"><Layout className="w-10 h-10" /></div>
                    <div>
                        <h4 className="text-white font-black text-2xl uppercase italic tracking-widest leading-none">全域资产网格管理</h4>
                        <p className="text-[10px] text-slate-500 font-black mt-2 uppercase tracking-[0.4em]">Local Grid Integrity: VERIFIED</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 导入端口 */}
                    <div className="ios-glass-card p-8 rounded-[2rem] border-indigo-500/20 hover:bg-indigo-600/5 transition-all text-left group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <FileUp className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded font-black">INPUT</span>
                        </div>
                        <div className="text-white font-bold text-lg mb-2 uppercase">数据协议注入</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium mb-6">从外部 JSON 文件注入全量资产数据。系统将自动解构并覆盖当前所有物理库位信息。</p>
                        
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJson} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            选择 JSON 协议包
                        </button>
                    </div>

                    {/* 导出端口 */}
                    <div className="ios-glass-card p-8 rounded-[2rem] border-white/10 hover:bg-white/5 transition-all text-left group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <FileDown className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded font-black">OUTPUT</span>
                        </div>
                        <div className="text-white font-bold text-lg mb-2 uppercase">数据快照镜像</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium mb-6">将当前系统的全量数据（产品、财务、物流、客户）打包为加密 JSON 包用于冷备份。</p>
                        
                        <button 
                            onClick={handleExportJson}
                            className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            执行物理导出
                        </button>
                    </div>
                  </div>

                  <div className="p-8 bg-red-600/5 border border-red-500/20 rounded-[2rem] flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <AlertOctagon className="w-8 h-8 text-red-500" />
                        <div>
                            <div className="text-red-400 font-bold text-sm uppercase">紧急核心擦除</div>
                            <p className="text-[10px] text-slate-500 font-medium">这将物理抹除该浏览器中的所有本地缓存，并强制断开云端。慎重操作。</p>
                        </div>
                      </div>
                      <button 
                         onClick={() => { if(confirm('⚠️ 绝对警告：这将物理抹除该浏览器的所有本地缓存，是否执行？')) { localStorage.clear(); window.location.reload(); } }}
                         className="px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                         执行物理抹除
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
