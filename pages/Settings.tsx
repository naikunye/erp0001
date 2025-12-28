
import React, { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity, ExternalLink as LinkIcon,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Settings: React.FC = () => {
  const { state, dispatch, showToast, connectToPb, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'cloud' | 'data'>('cloud'); 
  const [pbInput, setPbInput] = useState(state.pbUrl || '');
  const [isTesting, setIsTesting] = useState(false);

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
              showToast('量子链路已成功激活', 'success');
          } else {
              // 失败逻辑由 Context 触发或 UI 提示面板展示
              if (!isHttps || !cleanUrl.startsWith('http:')) {
                  showToast('连接失败：请检查地址或网络', 'error');
              }
          }
      } catch (e: any) {
          showToast('连接发生异常', 'error');
      } finally {
          setIsTesting(false);
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 系统中枢配置
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Deployment Protocol: {isHttps ? 'HTTPS (ENCRYPTED)' : 'HTTP (INSECURE)'}</p>
        </div>
      </div>

      <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button onClick={() => setActiveTab('cloud')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'cloud' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Cloud className="w-4 h-4" /> 云端同步 (Cloud)
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Database className="w-4 h-4" /> 离线数据 (Local)
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8">
              {/* 核心修复方案面板：当检测到 Vercel HTTPS 冲突时显示 */}
              {isHttps && pbInput.startsWith('http:') && (
                  <div className="bg-indigo-600/10 border-2 border-indigo-500/30 rounded-[2.5rem] p-10 animate-in slide-in-from-top-4 shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                      <div className="flex flex-col md:flex-row gap-10">
                          <div className="md:w-1/3 space-y-6">
                              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/40">
                                  <ShieldAlert className="w-8 h-8" />
                              </div>
                              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">Vercel 部署<br/>强制安全限制修复</h3>
                              <p className="text-xs text-indigo-200/70 font-bold leading-relaxed">
                                  您在 Vercel 上运行 (HTTPS)，浏览器为了保护隐私，默认禁止连接到您的 HTTP 数据库。这被称为“混合内容拦截”。
                              </p>
                          </div>
                          
                          <div className="md:w-2/3 grid grid-cols-1 gap-4">
                              <div className="bg-black/60 rounded-[2rem] p-6 border border-white/10 relative group overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Command className="w-20 h-20 text-white"/></div>
                                  <div className="flex items-start gap-4">
                                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shrink-0">1</div>
                                      <div>
                                          <h4 className="text-emerald-400 font-black text-sm uppercase mb-2">手动开启浏览器白名单 (推荐)</h4>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                                              点击浏览器地址栏左侧的 <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-white font-bold"><Settings2 className="w-3 h-3"/> 设置/调整图标</span> 或 <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-white font-bold"><Lock className="w-3 h-3"/> 锁头图标</span>，选择 **[网站设置] (Site Settings)**。
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed mt-3 font-medium">
                                              在打开的页面中找到 **[不安全内容] (Insecure content)**，将右侧的选项改为 **[允许] (Allow)**。
                                          </p>
                                          <div className="mt-4 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                              <RefreshCw className="w-3 h-3"/> 修改后刷新页面即可建立连接
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="bg-black/40 rounded-[2rem] p-6 border border-white/5 opacity-80">
                                  <div className="flex items-start gap-4">
                                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-black shrink-0">2</div>
                                      <div>
                                          <h4 className="text-slate-400 font-black text-sm uppercase mb-2">部署正式域名 SSL (生产环境方案)</h4>
                                          <p className="text-[11px] text-slate-500 leading-relaxed">
                                              如果您打算长期使用，建议购买域名并为数据库配置 SSL 证书（由 http 改为 https）。
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-8 bg-[#0a0a0c]">
                  <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest flex justify-between">
                          <span>Private Cloud Node (接入点地址)</span>
                          <span className={`font-black ${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                             STATUS: {state.connectionStatus.toUpperCase()}
                          </span>
                      </label>
                      <div className="relative group">
                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${state.connectionStatus === 'connected' ? 'text-emerald-500' : 'text-slate-500'}`}>
                           <Database className="w-5 h-5"/>
                        </div>
                        <input 
                            type="text" 
                            value={pbInput}
                            onChange={e => setPbInput(e.target.value)}
                            className={`w-full bg-black/60 border rounded-3xl p-6 pl-14 text-sm text-white font-mono outline-none transition-all ${isHttps && pbInput.startsWith('http:') ? 'border-indigo-500/50 focus:border-indigo-500 ring-2 ring-indigo-500/10' : 'border-white/10 focus:border-indigo-500'}`} 
                            placeholder="http://119.28.72.106:8090" 
                        />
                      </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={handleConnect}
                        disabled={isTesting}
                        className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-indigo-900/40 disabled:opacity-50"
                      >
                          {isTesting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                          建立量子神经链路
                      </button>
                      
                      {state.connectionStatus === 'connected' && (
                          <div className="flex gap-4 animate-in zoom-in-95 duration-300">
                            <button onClick={() => syncToCloud(true)} className="px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">同步镜像</button>
                            <button onClick={() => pullFromCloud(true)} className="px-10 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">从云端恢复</button>
                          </div>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="ios-glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-6">
                    <h4 className="text-white text-sm font-black flex items-center gap-3 uppercase italic"><Shield className="w-5 h-5 text-indigo-400"/> 数据库准入审计</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                        请确保 PocketBase 的 <code className="text-indigo-400">backups</code> 集合已开放 API Rules 为 Everyone 权限。
                    </p>
                    <div className="bg-black/60 rounded-2xl border border-white/5 p-5 space-y-3">
                        {['List/Search', 'View', 'Create', 'Update'].map((it) => (
                            <div key={it} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-slate-600">{it}</span>
                                <div className="text-emerald-400 flex items-center gap-2"><Unlock className="w-3 h-3"/> Anyone</div>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="ios-glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-center items-center text-center space-y-4">
                    <Monitor className="w-12 h-12 text-slate-700" />
                    <h4 className="text-white text-sm font-black uppercase italic">本地脱域模式 (Local Only)</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                        如果您无法绕过 HTTPS 限制，系统仍会自动启用高级 IndexedDB。您的所有数据将离线存储在当前浏览器，永不丢失，直到您清除浏览器缓存。
                    </p>
                 </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="ios-glass-card p-10 rounded-[3.5rem] border-white/5 space-y-10 bg-black/40">
              <div className="flex items-center gap-8">
                <div className="p-6 bg-blue-600/10 rounded-[2rem] text-blue-500 shadow-2xl border border-blue-500/20"><Layout className="w-10 h-10" /></div>
                <div>
                    <h4 className="text-white font-black text-2xl uppercase italic tracking-widest leading-none">本地离线节点管理</h4>
                    <p className="text-[10px] text-slate-500 font-black mt-2 uppercase tracking-[0.4em]">Local Grid Protocol: ACTIVE</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button className="ios-glass-card p-8 rounded-[2rem] border-white/10 hover:bg-white/5 transition-all text-left group">
                    <FileJson className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-white font-bold text-sm mb-1">导出加密快照 (JSON)</div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">生成一份完整的本地数据包，可用于在其他浏览器手动恢复。</p>
                </button>
                <button 
                  onClick={() => { if(confirm('警告：此操作将清空本地所有缓存数据，是否继续？')) { localStorage.clear(); window.location.reload(); } }}
                  className="ios-glass-card p-8 rounded-[2rem] border-red-500/10 hover:bg-red-500/5 transition-all text-left group"
                >
                    <DatabaseZap className="w-8 h-8 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-red-400 font-bold text-sm mb-1">紧急重置本地网格</div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">清除所有本地缓存并强制重新初始化系统内核。</p>
                </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
