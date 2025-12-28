
import React, { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity, ExternalLink as LinkIcon,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command, Search, Fingerprint, ChevronRight
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
              showToast('量子链路激活成功', 'success');
          } else if (isHttps && cleanUrl.startsWith('http:')) {
              // 混合内容拦截静默处理，由下方的提示 UI 负责
          } else {
              showToast('连接超时：请确认 IP 端口 8090 已开放且防火墙放行', 'error');
          }
      } catch (e: any) {
          showToast('链路异常', 'error');
      } finally {
          setIsTesting(false);
      }
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
              <Database className="w-4 h-4" /> 离线数据 (Local)
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8">
              {/* 如果没有看到网站设置，这里的引导会更加具象 */}
              {isHttps && pbInput.startsWith('http:') && (
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
                              <div className="pt-4 flex flex-col gap-4">
                                  <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest"><CheckCircle2 className="w-4 h-4"/> 无需配置证书</div>
                                  <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest"><CheckCircle2 className="w-4 h-4"/> 仅对本站生效</div>
                              </div>
                          </div>
                          
                          <div className="md:w-3/5 space-y-4">
                              {/* 模拟浏览器顶栏引导 */}
                              <div className="bg-black/60 rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group">
                                  <div className="flex items-center gap-2 mb-6">
                                      <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                      <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                      <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                                  </div>
                                  
                                  <div className="space-y-6">
                                      <div className="flex items-start gap-4">
                                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                          <div className="text-sm">
                                              <p className="text-white font-bold mb-2">点击地址栏最左侧的【调整】或【锁头】图标</p>
                                              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                                                  <div className="p-1.5 bg-white/10 rounded-md"><Settings2 className="w-4 h-4 text-white"/></div>
                                                  <div className="flex-1 bg-black/40 rounded-full h-8 flex items-center px-4 text-[10px] text-slate-500 font-mono italic">erp0001.vercel.app</div>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-start gap-4">
                                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                          <div className="text-sm">
                                              <p className="text-white font-bold mb-2">选择【网站设置 (Site Settings)】</p>
                                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                                  如果没有看到这一项，请点击弹窗底部的 <b>"查看网站权限"</b>。
                                              </p>
                                          </div>
                                      </div>

                                      <div className="flex items-start gap-4">
                                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                                          <div className="text-sm">
                                              <p className="text-white font-bold mb-2">找到【不安全内容 (Insecure content)】并改为【允许 (Allow)】</p>
                                              <div className="mt-2 p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl flex items-center justify-between">
                                                  <span className="text-[10px] font-black text-indigo-100 uppercase">Insecure content</span>
                                                  <div className="px-3 py-1 bg-indigo-600 rounded text-[9px] font-black text-white">ALLOW / 允许</div>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                                          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin-slow" />
                                          <p className="text-[10px] text-amber-200/80 font-bold uppercase tracking-widest">设置完成后，请手动刷新本页面</p>
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
                            className={`w-full bg-black/60 border rounded-[1.5rem] p-6 pl-16 text-sm text-white font-mono outline-none transition-all ${isHttps && pbInput.startsWith('http:') ? 'border-indigo-500/40 ring-4 ring-indigo-500/5' : 'border-white/10 focus:border-indigo-500'}`} 
                            placeholder="http://119.28.72.106:8090" 
                        />
                      </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-5">
                      <button 
                        onClick={handleConnect}
                        disabled={isTesting}
                        className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-indigo-900/40 disabled:opacity-50"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="ios-glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-6">
                    <h4 className="text-white text-sm font-black flex items-center gap-3 uppercase italic tracking-widest"><Shield className="w-5 h-5 text-indigo-400"/> 接入审计规则</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                        请确保您的 PocketBase 后台 <code className="text-indigo-400 font-mono">backups</code> 集合已开放 API Rules 为 <b>Anyone</b>。
                    </p>
                    <div className="bg-black/40 rounded-2xl border border-white/5 p-5 space-y-3">
                        {['List/Search', 'View', 'Create', 'Update'].map((it) => (
                            <div key={it} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-slate-600">{it}</span>
                                <div className="text-emerald-400 flex items-center gap-2"><Unlock className="w-3 h-3"/> Public Access</div>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="ios-glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-center items-center text-center space-y-6 group">
                    <Monitor className="w-16 h-16 text-slate-800 group-hover:text-indigo-500 transition-colors" />
                    <div>
                        <h4 className="text-white text-sm font-black uppercase italic tracking-widest">全功能离线沙盒</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-bold mt-2">
                            即使云端节点未就绪，系统仍会自动激活高级 IndexedDB。您的所有数据将永久锁定在当前浏览器容器中。
                        </p>
                    </div>
                 </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="ios-glass-card p-10 rounded-[3.5rem] border-white/5 space-y-10 bg-black/40 shadow-2xl">
              <div className="flex items-center gap-8">
                <div className="p-6 bg-indigo-600/10 rounded-[2rem] text-indigo-500 border border-indigo-500/20"><Layout className="w-10 h-10" /></div>
                <div>
                    <h4 className="text-white font-black text-2xl uppercase italic tracking-widest leading-none">本地离线节点管理</h4>
                    <p className="text-[10px] text-slate-500 font-black mt-2 uppercase tracking-[0.4em]">Local Grid Integrity: VERIFIED</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button className="ios-glass-card p-8 rounded-[2rem] border-white/10 hover:bg-white/5 transition-all text-left group">
                    <FileJson className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-white font-bold text-sm mb-1 uppercase">导出加密快照 (JSON)</div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">生成完整的本地数据协议包，用于物理备份或跨端迁移。</p>
                </button>
                <button 
                  onClick={() => { if(confirm('⚠️ 警告：这将从物理层面抹除该浏览器的所有离线数据，是否执行？')) { localStorage.clear(); window.location.reload(); } }}
                  className="ios-glass-card p-8 rounded-[2rem] border-red-500/10 hover:bg-red-500/5 transition-all text-left group"
                >
                    <DatabaseZap className="w-8 h-8 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-red-400 font-bold text-sm mb-1 uppercase">紧急重置本地网格</div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">清空所有 IndexedDB 缓存并重载系统核心内核。</p>
                </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
