
import React, { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity, ExternalLink as LinkIcon,
    Lock, Unlock, CheckCircle2, AlertTriangle
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
      try {
          const cleanUrl = pbInput.trim().replace(/\/$/, ""); 
          const success = await connectToPb(cleanUrl);
          // 只有真正建立连接（返回 true）后才会显示成功提示
          if (success) {
              showToast('量子链路已成功激活', 'success');
          }
      } catch (e: any) {
          console.error("Critical error in UI connection flow:", e);
      } finally {
          setIsTesting(false);
      }
  };

  const openAdminPanel = () => {
      if (!pbInput) return;
      const baseUrl = pbInput.endsWith('/') ? pbInput : `${pbInput}/`;
      window.open(`${baseUrl}_/`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
              <SettingsIcon className="w-8 h-8 text-indigo-500" /> 系统中枢配置
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Quantum system configuration module</p>
        </div>
        {state.pbUrl && (
            <button 
                onClick={openAdminPanel}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-indigo-400 uppercase flex items-center gap-2 transition-all"
            >
                <Database className="w-3.5 h-3.5" /> 数据库管理后台 <LinkIcon className="w-3 h-3"/>
            </button>
        )}
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
          <div className="space-y-6">
              {isHttps && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                      <div className="text-xs text-amber-200 font-bold">
                          检测到当前使用 <span className="underline">HTTPS</span> 访问。由于浏览器安全限制，您可能无法连接到 <span className="underline">HTTP</span> 数据库。
                          建议：将地址栏开头的 https:// 手动改为 http:// 重新访问。
                      </div>
                  </div>
              )}

              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-8">
                  <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest flex justify-between">
                          <span>Private Cloud Node (接入点地址)</span>
                          <span className={`${state.connectionStatus === 'connected' ? 'text-emerald-400' : 'text-indigo-400'}`}>STATUS: {state.connectionStatus.toUpperCase()}</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors"><Activity className="w-5 h-5"/></div>
                        <input 
                            type="text" 
                            value={pbInput}
                            onChange={e => setPbInput(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 pl-12 text-sm text-white font-mono outline-none focus:border-indigo-500 shadow-inner" 
                            placeholder="http://119.28.72.106:8090" 
                        />
                      </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={handleConnect}
                        disabled={isTesting}
                        className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95 shadow-indigo-900/40"
                      >
                          {isTesting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                          建立神经链路
                      </button>
                      
                      {state.connectionStatus === 'connected' && (
                          <div className="flex gap-4">
                            <button onClick={() => syncToCloud(true)} className="px-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">同步镜像</button>
                            <button onClick={() => pullFromCloud(true)} className="px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">从云端恢复</button>
                          </div>
                      )}
                  </div>
                  
                  <div className="bg-indigo-600/5 border border-white/5 rounded-3xl p-8">
                      <h4 className="text-white text-sm font-bold mb-6 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-indigo-400"/> 数据库权限配置检查（API Rules）</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                为了让 ERP 能够读写数据，请在 PocketBase 管理后台的 <code className="text-indigo-400">backups</code> 集合中，将 **API Rules** 选项卡内的所有规则解锁。
                            </p>
                            <div className="bg-black/60 rounded-2xl border border-white/5 p-4 space-y-3">
                                {[
                                    { label: 'List/Search', status: 'Anyone' },
                                    { label: 'View', status: 'Anyone' },
                                    { label: 'Create', status: 'Anyone' },
                                    { label: 'Update', status: 'Anyone' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500 font-mono">{item.label}</span>
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                            <Unlock className="w-3 h-3"/> {item.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col justify-center gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">1</div>
                                <p className="text-[11px] text-slate-300">点击规则右侧的 **挂锁图标** 使其变色/消失</p>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">2</div>
                                <p className="text-[11px] text-slate-300">确保输入框变为空白（显示为 Everyone/null）</p>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">3</div>
                                <p className="text-[11px] text-slate-300">点击下方的 **Save changes** 按钮保存生效</p>
                            </div>
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'data' && (
          <div className="ios-glass-card p-10 rounded-[2.5rem] border-white/5 space-y-6">
              <div className="flex items-center gap-6 mb-4">
                <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500"><Layout className="w-8 h-8" /></div>
                <div>
                    <h4 className="text-white font-black text-xl uppercase italic tracking-wider">本地离线节点管理</h4>
                    <p className="text-xs text-slate-500 font-bold mt-1">Local Browser Database (IndexedDB)</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium bg-white/2 p-6 rounded-2xl border border-white/5">
                  即使不使用云端后端，探行 ERP 也会通过高级 IndexedDB 协议在您的浏览器中加密存储。
              </p>
              <div className="pt-6 flex gap-4">
                <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all">
                    <FileJson className="w-5 h-5 text-amber-500"/> 生成离线资产报告 (JSON)
                </button>
                <button onClick={() => { if(confirm('警告：此操作将清空本地所有缓存数据，是否继续？')) { localStorage.clear(); window.location.reload(); } }} className="px-8 py-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-red-500 hover:text-white transition-all">
                    <DatabaseZap className="w-5 h-5"/> 紧急重置本地网格
                </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
