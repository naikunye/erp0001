
import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command, Search, Fingerprint, ChevronRight,
    Upload, Download, FileUp, FileDown, AlertOctagon, Power, CloudUpload, CloudDownload,
    Wifi, WifiOff, Fingerprint as ScanIcon, BellRing, MessageSquare, Send, Smartphone,
    Bot
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, connectToPb, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'cloud' | 'data' | 'notif'>('cloud'); 
  const [pbInput, setPbInput] = useState(state.pbUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isNotifTesting, setIsNotifTesting] = useState(false);
  
  // 通知配置状态 (通常保存在本地或随快照同步)
  const [notifConfig, setNotifConfig] = useState({
      tgToken: localStorage.getItem('TG_BOT_TOKEN') || '',
      tgChatId: localStorage.getItem('TG_CHAT_ID') || '',
      frequency: '2h',
      enabled: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isHttps = window.location.protocol === 'https:';

  useEffect(() => {
    setPbInput(state.pbUrl);
  }, [state.pbUrl]);

  const handleSaveNotif = () => {
      localStorage.setItem('TG_BOT_TOKEN', notifConfig.tgToken);
      localStorage.setItem('TG_CHAT_ID', notifConfig.tgChatId);
      showToast('推送协议已保存在本地，下次同步将广播至云端', 'success');
  };

  const testTgPush = async () => {
      if (!notifConfig.tgToken || !notifConfig.tgChatId) {
          showToast('请先配置 Token 和 ChatID', 'warning');
          return;
      }
      setIsNotifTesting(true);
      try {
          const url = `https://api.telegram.org/bot${notifConfig.tgToken}/sendMessage`;
          const text = `🚀 *探行 ERP 链路测试成功*\n\n节点: ${SESSION_ID}\n状态: 活跃 (Active)\n时间: ${new Date().toLocaleString()}\n\n服务器已准备好每隔 ${notifConfig.frequency} 扫描一次物流矩阵。`;
          
          const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: notifConfig.tgChatId, text, parse_mode: 'Markdown' })
          });
          
          if (res.ok) {
              showToast('测试指令已发出，请检查手机 Telegram', 'success');
          } else {
              throw new Error('Telegram API 响应异常');
          }
      } catch (e: any) {
          showToast(`推送失败: ${e.message}`, 'error');
      } finally {
          setIsNotifTesting(false);
      }
  };

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
          <button onClick={() => setActiveTab('notif')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'notif' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <BellRing className="w-4 h-4" /> 自动推送中枢 (Notif)
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Database className="w-4 h-4" /> 物理资产管理
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8">
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
              </div>
          </div>
      )}

      {activeTab === 'notif' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 bg-[#0a0a0c] shadow-xl space-y-8">
                  <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-purple-900/40">
                          <Bot className="w-8 h-8" />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Telegram 自动化推送引擎</h3>
                          <p className="text-xs text-slate-500 mt-1">服务器后端将每隔 2 小时通过此链路向您手机汇报物流实况</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                          <div>
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 block">Bot API Token</label>
                            <input 
                                type="password"
                                value={notifConfig.tgToken}
                                onChange={e => setNotifConfig({...notifConfig, tgToken: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-indigo-400 font-mono focus:border-purple-500 outline-none" 
                                placeholder="通过 @BotFather 获取的 Token..." 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 block">Chat ID (Your Account)</label>
                            <input 
                                type="text"
                                value={notifConfig.tgChatId}
                                onChange={e => setNotifConfig({...notifConfig, tgChatId: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-white font-mono focus:border-purple-500 outline-none" 
                                placeholder="您的 Telegram ID (可通过 @userinfobot 获取)..." 
                            />
                          </div>
                      </div>

                      <div className="space-y-6 bg-white/2 border border-white/5 p-8 rounded-[2rem]">
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400">自动巡检频率</span>
                              <select 
                                value={notifConfig.frequency}
                                onChange={e => setNotifConfig({...notifConfig, frequency: e.target.value})}
                                className="bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-xs text-white outline-none"
                              >
                                  <option value="1h">每 1 小时 (高频)</option>
                                  <option value="2h">每 2 小时 (建议)</option>
                                  <option value="4h">每 4 小时 (省电)</option>
                                  <option value="12h">每天两次</option>
                              </select>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400">推送状态</span>
                              <button 
                                onClick={() => setNotifConfig({...notifConfig, enabled: !notifConfig.enabled})}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${notifConfig.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                              >
                                  {notifConfig.enabled ? '协议运行中' : '已离线'}
                              </button>
                          </div>
                          <div className="pt-4 border-t border-white/5">
                              <button 
                                onClick={testTgPush}
                                disabled={isNotifTesting}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-3 transition-all"
                              >
                                  {isNotifTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                  向手机发送测试信号
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-white/5">
                      <button onClick={handleSaveNotif} className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
                          保存推送协议
                      </button>
                  </div>
              </div>

              <div className="ios-glass-card p-8 bg-blue-600/5 border-l-4 border-l-blue-600 rounded-[2rem] flex items-start gap-6">
                  <Info className="w-8 h-8 text-blue-500 shrink-0" />
                  <div className="space-y-2">
                      <h4 className="text-white font-bold text-sm uppercase">为什么需要手动保存？</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                          通知配置包含您的私密 Token，保存后它将作为“系统载荷”的一部分存储在您的 PocketBase 云端。
                          只要您的服务器运行着 <b>Logistics Watcher</b> 脚本，它就能读取这些配置并自动开始推送工作。
                      </p>
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
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
