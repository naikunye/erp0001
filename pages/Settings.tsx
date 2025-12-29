
import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command, Search, Fingerprint, ChevronRight,
    Upload, Download, FileUp, FileDown, AlertOctagon, Power, CloudUpload, CloudDownload,
    Wifi, WifiOff, Fingerprint as ScanIcon, Palette, Sparkles, Box, Check, MessageCircle, Bot, Radio,
    Save, Send, Loader2, Truck, ListChecks, Bell, Eye, Timer, FileOutput, FileInput
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';
import { Theme, CloudAutomationSettings } from '../types';
import { sendMessageToBot } from '../utils/feishu';

const THEMES: { id: Theme; name: string; desc: string; colors: string[] }[] = [
    { id: 'quantum', name: '量子深邃 (Default)', desc: '经典靛蓝与紫罗兰的科技平衡', colors: ['#6366f1', '#312e81', '#1e1b4b'] },
    { id: 'cyber', name: '赛博霓虹 (Cyber)', desc: '高对比度的玫红与电光青', colors: ['#ff007f', '#5a002d', '#00ffff'] },
    { id: 'emerald', name: '翡翠矩阵 (Emerald)', desc: '舒适自然的森林绿意', colors: ['#10b981', '#064e3b', '#022c22'] },
    { id: 'amber', name: '余晖落日 (Amber)', desc: '温暖和煦的琥珀色调', colors: ['#f59e0b', '#78350f', '#451a03'] },
    { id: 'oled', name: '极致纯黑 (OLED)', desc: '深邃沉稳，节省能耗', colors: ['#94a3b8', '#111', '#000'] },
];

const Settings: React.FC = () => {
  const { state, dispatch, showToast, connectToPb, syncToCloud, pullFromCloud, pushTrackingToFeishu } = useTanxing();
  const [activeTab, setActiveTab] = useState<'cloud' | 'comm' | 'appearance' | 'data'>('cloud'); 
  const [pbInput, setPbInput] = useState(state.pbUrl || '');
  const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isFeishuPushing, setIsFeishuPushing] = useState(false);
  const [isFeishuTesting, setIsFeishuTesting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // 云端设置局部状态
  const [cloudConfig, setCloudConfig] = useState<CloudAutomationSettings>(state.cloudSettings);

  const handleUpdateCloudConfig = (updates: Partial<CloudAutomationSettings>) => {
      const updated = { ...cloudConfig, ...updates };
      setCloudConfig(updated);
      dispatch({ type: 'UPDATE_CLOUD_SETTINGS', payload: updated });
  };

  const handleSaveFeishu = () => {
      localStorage.setItem('TX_FEISHU_URL', feishuUrl);
      showToast('飞书 Webhook 节点已固化', 'success');
  };

  const handleConnect = async () => {
      if (!pbInput) {
          showToast('请输入 PocketBase 节点地址', 'warning');
          return;
      }
      setIsTesting(true);
      try {
          await connectToPb(pbInput);
      } catch (e) {
          showToast('无法连接至指定节点', 'error');
      } finally {
          setIsTesting(false);
      }
  };

  const handleThemeChange = (id: Theme) => {
      dispatch({ type: 'SET_THEME', payload: id });
      localStorage.setItem('TX_ACTIVE_THEME', id);
      showToast(`视觉风格已重构: ${id}`, 'success');
  };

  // --- 本地备份核心逻辑 ---
  const handleExportBackup = () => {
      const backupData = {
          ...state,
          exportDate: new Date().toISOString(),
          version: '6.0.0-Quantum'
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tanxing_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('全量资产快照已导出', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (!data.products || !data.transactions) throw new Error('无效的备份文件结构');
              dispatch({ type: 'BOOT', payload: data });
              showToast('量子载荷恢复成功：全域数据已对齐', 'success');
          } catch (err) {
              showToast('解析失败：备份文件损坏或版本不兼容', 'error');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
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
              <Cloud className="w-4 h-4" /> 实时协同云
          </button>
          <button onClick={() => setActiveTab('comm')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'comm' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <MessageCircle className="w-4 h-4" /> 通讯矩阵
          </button>
          <button onClick={() => setActiveTab('appearance')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'appearance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Palette className="w-4 h-4" /> 视觉外观
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Database className="w-4 h-4" /> 数据资产
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95">
              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-10 bg-[#0a0a0c] shadow-xl">
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
                      <input 
                        type="text" 
                        value={pbInput}
                        onChange={e => setPbInput(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] p-6 text-sm text-white font-mono outline-none transition-all focus:border-indigo-500" 
                        placeholder="http://IP:8090" 
                      />
                      <button onClick={handleConnect} disabled={isTesting} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase border border-white/10 transition-all">
                          {isTesting ? '正在握手...' : '激活节点连接'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'comm' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95">
              <div className="ios-glass-panel p-8 rounded-[2.5rem] border-white/10 bg-black/40 space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 block">飞书机器人 Webhook URL</label>
                            <input 
                                type="text" 
                                value={feishuUrl}
                                onChange={e => setFeishuUrl(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm text-white font-mono outline-none focus:border-indigo-500 transition-all"
                                placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                            />
                            <div className="mt-4 flex gap-4">
                                <button 
                                    onClick={async () => {
                                        setIsFeishuTesting(true);
                                        const res = await sendMessageToBot(feishuUrl, '连接测试', '探行 ERP 通讯测试：单号同步链路已就绪。');
                                        setIsFeishuTesting(false);
                                        if (res.success) showToast('心跳测试成功', 'success');
                                        else showToast('发送失败，请检查 URL', 'error');
                                    }}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2"
                                >
                                    {isFeishuTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>} 测试脉搏
                                </button>
                                <button onClick={handleSaveFeishu} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase shadow-xl transition-all">保存配置</button>
                            </div>
                        </div>

                        <div className="bg-white/2 border border-white/5 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4"/> 自动化哨兵策略 (Sentinel)</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl">
                                    <span className="text-xs text-slate-300">开启物流异常主动推送</span>
                                    <button 
                                        onClick={() => handleUpdateCloudConfig({ enableSentinel: !cloudConfig.enableSentinel })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${cloudConfig.enableSentinel ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cloudConfig.enableSentinel ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl">
                                    <span className="text-xs text-slate-300">开启低库存每日简报</span>
                                    <button 
                                        onClick={() => handleUpdateCloudConfig({ enableStockAlert: !cloudConfig.enableStockAlert })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${cloudConfig.enableStockAlert ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cloudConfig.enableStockAlert ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-[2rem] p-8 flex flex-col justify-between">
                        <div className="flex items-start gap-5">
                            <div className="p-4 bg-blue-600/20 rounded-2xl">
                                <Truck className="w-10 h-10 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-white italic uppercase tracking-tight">物流单号镜像同步</div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">一键推送当前所有<span className="text-blue-400 font-black">在途货件</span>清单，方便移动端快速复制查询。</p>
                            </div>
                        </div>
                        <button 
                            onClick={async () => { setIsFeishuPushing(true); await pushTrackingToFeishu(true); setIsFeishuPushing(false); }}
                            className={`w-full mt-6 py-5 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 transition-all ${isFeishuPushing ? 'bg-blue-600/10 border-blue-500/20 text-blue-300' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xl'}`}
                        >
                            {isFeishuPushing ? <Loader2 className="w-5 h-5 animate-spin"/> : <ListChecks className="w-5 h-5"/>} 立即同步清单
                        </button>
                    </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'appearance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
              {THEMES.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => handleThemeChange(t.id)} 
                    className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col gap-6 text-left group relative overflow-hidden ${state.theme === t.id ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                  >
                      {state.theme === t.id && (
                          <div className="absolute top-6 right-6 bg-indigo-600 p-2 rounded-full text-white z-10 animate-in zoom-in">
                              <Check className="w-4 h-4" />
                          </div>
                      )}
                      <div className="flex items-center gap-5 relative z-10">
                          <div className="flex -space-x-3">
                              {t.colors.map((c, i) => (
                                  <div key={i} className="w-10 h-10 rounded-full border-4 border-[#030508] shadow-lg" style={{ backgroundColor: c }}></div>
                              ))}
                          </div>
                          <div>
                              <div className="text-lg font-black text-white uppercase italic tracking-tighter">{t.name}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.desc}</div>
                          </div>
                      </div>
                      <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                          <div className="flex gap-2">
                              <div className="w-full h-1.5 rounded-full bg-white/10">
                                  <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: t.colors[0] }}></div>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/10">
                                  <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: t.colors[2] }}></div>
                              </div>
                          </div>
                      </div>
                  </button>
              ))}
          </div>
      )}

      {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
              {/* 云端同步区 */}
              <div className="ios-glass-panel p-10 rounded-[3rem] border-white/5 bg-black/40 space-y-8 shadow-2xl">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-3 uppercase italic">
                              <Cloud className="w-6 h-6 text-indigo-500" /> 云端载荷同步 (Collaboration)
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Real-time cloud resonance protocol</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button onClick={async () => { await syncToCloud(true); }} className="p-8 bg-indigo-600/10 border border-indigo-500/30 rounded-[2rem] hover:bg-indigo-600/20 transition-all group flex items-center gap-6">
                          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform"><CloudUpload className="w-8 h-8" /></div>
                          <div className="text-left">
                              <div className="text-white font-bold text-sm uppercase">全量覆盖推送</div>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase">本地状态强制同步至腾讯云节点</p>
                          </div>
                      </button>
                      <button onClick={async () => { await pullFromCloud(true); }} className="p-8 bg-emerald-600/10 border border-emerald-500/30 rounded-[2rem] hover:bg-emerald-600/20 transition-all group flex items-center gap-6">
                          <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform"><CloudDownload className="w-8 h-8" /></div>
                          <div className="text-left">
                              <div className="text-white font-bold text-sm uppercase">云端镜像拉取</div>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase">从节点下载最新载荷，覆盖本地数据</p>
                          </div>
                      </button>
                  </div>
              </div>

              {/* 本地备份区 */}
              <div className="ios-glass-panel p-10 rounded-[3rem] border-white/5 bg-black/40 space-y-8 shadow-2xl">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-3 uppercase italic">
                              <DatabaseZap className="w-6 h-6 text-amber-500" /> 本地资产快照 (Snapshots)
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Manual local archival & restoration</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button onClick={handleExportBackup} className="p-8 bg-amber-600/10 border border-amber-500/30 rounded-[2rem] hover:bg-amber-600/20 transition-all group flex items-center gap-6">
                          <div className="p-4 bg-amber-600 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform"><FileOutput className="w-8 h-8" /></div>
                          <div className="text-left">
                              <div className="text-white font-bold text-sm uppercase">导出本地备份 (.json)</div>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase">下载全量离线加密数据包</p>
                          </div>
                      </button>
                      
                      <div className="relative">
                          <input type="file" ref={importFileRef} onChange={handleImportBackup} accept=".json" className="hidden" />
                          <button onClick={() => importFileRef.current?.click()} className="w-full p-8 bg-slate-800/40 border border-white/10 rounded-[2rem] hover:bg-slate-700/40 transition-all group flex items-center gap-6">
                              <div className="p-4 bg-slate-600 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform"><FileInput className="w-8 h-8" /></div>
                              <div className="text-left">
                                  <div className="text-white font-bold text-sm uppercase">导入本地备份 (.json)</div>
                                  <p className="text-[10px] text-slate-500 mt-1 uppercase">选择并恢复全域历史快照</p>
                              </div>
                          </button>
                      </div>
                  </div>
                  <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-3xl flex items-start gap-4">
                      <AlertOctagon className="w-6 h-6 text-red-500 shrink-0" />
                      <p className="text-[11px] text-red-200/80 leading-relaxed font-bold italic uppercase">
                        注意：导入操作将执行全量量子重构，当前未同步至云端的本地临时修改将被永久覆盖。请在导入前确保已导出当前备份。
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
