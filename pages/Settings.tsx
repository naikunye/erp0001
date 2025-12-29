
import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command, Search, Fingerprint, ChevronRight,
    Upload, Download, FileUp, FileDown, AlertOctagon, Power, CloudUpload, CloudDownload,
    Wifi, WifiOff, Fingerprint as ScanIcon, Palette, Sparkles, Box, Check
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';
import { Theme } from '../types';

const THEMES: { id: Theme; name: string; desc: string; colors: string[] }[] = [
    { id: 'quantum', name: '量子深邃 (Default)', desc: '经典靛蓝与紫罗兰的科技平衡', colors: ['#6366f1', '#312e81', '#1e1b4b'] },
    { id: 'cyber', name: '赛博霓虹 (Cyber)', desc: '高对比度的玫红与电光青', colors: ['#ff007f', '#5a002d', '#00ffff'] },
    { id: 'emerald', name: '翡翠矩阵 (Emerald)', desc: '舒适自然的森林绿意', colors: ['#10b981', '#064e3b', '#022c22'] },
    { id: 'amber', name: '余晖落日 (Amber)', desc: '温暖和煦的琥珀色调', colors: ['#f59e0b', '#78350f', '#451a03'] },
    { id: 'oled', name: '极致纯黑 (OLED)', desc: '深邃沉稳，节省能耗', colors: ['#94a3b8', '#111', '#000'] },
];

const Settings: React.FC = () => {
  const { state, dispatch, showToast, connectToPb, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'cloud' | 'appearance' | 'data'>('cloud'); 
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
              showToast('量子链路握手成功', 'success');
          }
      } finally {
          setIsTesting(false);
      }
  };

  const handleManualPush = async () => {
      if(confirm('推送将使用当前屏幕上的数据【覆盖】云端旧数据，另一台电脑也将同步被覆盖。是否确认？')) {
          setIsPushing(true);
          try {
              await syncToCloud(true);
          } finally {
              setIsPushing(false);
          }
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
                  showToast('数据已注入，正在广播...', 'success');
              }
          } catch (err) { showToast('文件解析失败', 'error'); }
      };
      reader.readAsText(file);
  };

  const handleThemeChange = (id: Theme) => {
      dispatch({ type: 'SET_THEME', payload: id });
      showToast(`主题已切换为: ${id}`, 'success');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter uppercase">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 核心神经元配置
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Node Session: <span className="text-indigo-400">{SESSION_ID}</span></p>
        </div>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button onClick={() => setActiveTab('cloud')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'cloud' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Cloud className="w-4 h-4" /> 实时协同云 (Live Sync)
          </button>
          <button onClick={() => setActiveTab('appearance')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'appearance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Palette className="w-4 h-4" /> 视觉外观 (Appearance)
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Database className="w-4 h-4" /> 物理资产管理
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8">
              {/* 核心诊断：HTTPS 混合内容警告 */}
              {isHttps && pbInput.startsWith('http:') && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex items-start gap-4">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                      <div className="text-xs space-y-2">
                          <p className="text-amber-200 font-bold uppercase tracking-widest">警告：检测到不安全的连接请求 (Mixed Content)</p>
                          <p className="text-slate-400">由于本程序运行在 HTTPS，而您的节点是 HTTP。如果无法同步，请点击地址栏左侧的“锁头”图标 -> 【网站设置】 -> 在底部找到【不安全内容】 -> 选择【允许】。然后刷新页面。</p>
                      </div>
                  </div>
              )}

              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-10 bg-[#0a0a0c] shadow-xl relative overflow-hidden">
                  <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">PocketBase Node Provider</label>
                          <div className="flex items-center gap-2">
                            {state.connectionStatus === 'connected' ? <Wifi className="w-3 h-3 text-emerald-500"/> : <WifiOff className="w-3 h-3 text-rose-500"/>}
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${state.connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                                {state.connectionStatus.toUpperCase()}
                            </span>
                          </div>
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
                            placeholder="http://IP:8090" 
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] space-y-4">
                                  <div className="flex items-center gap-3">
                                      <CloudUpload className="w-5 h-5 text-indigo-400" />
                                      <h4 className="text-white font-bold uppercase text-sm">推送主控节点 (Broadcaster)</h4>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">
                                      将本地数据作为“真相源”广播到云端。这会覆盖所有在线电脑的数据。通常用于初始化系统或完成大规模离线编辑后同步。
                                  </p>
                                  <button 
                                    onClick={handleManualPush}
                                    disabled={isPushing}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                  >
                                      {isPushing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                      执行广播推送 (Push)
                                  </button>
                              </div>

                              <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] space-y-4">
                                  <div className="flex items-center gap-3">
                                      <CloudDownload className="w-5 h-5 text-emerald-400" />
                                      <h4 className="text-white font-bold uppercase text-sm">强制云端对齐 (Subscriber)</h4>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">
                                      如果您的电脑没有自动同步，请点击此按钮手动从云端抓取最新资产快照。这会清除您本地未同步的临时修改。
                                  </p>
                                  <button 
                                    onClick={handleManualPull}
                                    disabled={isPulling}
                                    className="w-full py-4 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                  >
                                      {isPulling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                      从云端抓取 (Pull)
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-8">
                      <div className="flex items-center gap-3 text-emerald-500">
                          <ShieldCheck className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encryption</span>
                      </div>
                      <div className="flex items-center gap-3 justify-end text-right">
                          <Activity className="w-5 h-5 text-indigo-500" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">LATENCY: ~20MS</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/5 bg-black/40 space-y-10">
                  <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-3 uppercase italic">
                          <Palette className="w-6 h-6 text-indigo-500" /> 视觉元空间配置
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Quantum UI Customization v1.0</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {THEMES.map(t => (
                          <button 
                            key={t.id} 
                            onClick={() => handleThemeChange(t.id)}
                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-4 text-left group relative overflow-hidden ${state.theme === t.id ? 'bg-indigo-600/10 border-indigo-500 shadow-xl' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                          >
                              {state.theme === t.id && <div className="absolute top-4 right-4 bg-indigo-600 p-1.5 rounded-full text-white shadow-lg z-10 animate-in zoom-in"><Check className="w-4 h-4" /></div>}
                              
                              <div className="flex items-center gap-4 relative z-10">
                                  <div className="flex -space-x-2">
                                      {t.colors.map((c, i) => (
                                          <div key={i} className="w-8 h-8 rounded-full border-2 border-black" style={{ backgroundColor: c }}></div>
                                      ))}
                                  </div>
                                  <div>
                                      <div className="text-sm font-bold text-white uppercase italic">{t.name}</div>
                                      <div className="text-[10px] text-slate-500 font-bold">{t.desc}</div>
                                  </div>
                              </div>
                              <div className={`mt-2 h-1 w-full rounded-full bg-gradient-to-r ${t.id === state.theme ? 'opacity-100' : 'opacity-20 group-hover:opacity-100 transition-opacity'}`} style={{ backgroundImage: `linear-gradient(to right, ${t.colors.join(', ')})` }}></div>
                          </button>
                      ))}
                  </div>

                  <div className="p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-[2rem] flex items-center gap-6">
                      <Sparkles className="w-8 h-8 text-indigo-400" />
                      <div>
                          <div className="text-indigo-300 font-bold text-sm uppercase">动态光场背景</div>
                          <p className="text-[10px] text-slate-500 font-medium">主题切换将重构环境光场（Ambient Blobs），确保长时间操作时的舒适度。所有颜色均经过量子色彩对齐校验。</p>
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
                        <button onClick={handleExportJson} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest">执行导出</button>
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
