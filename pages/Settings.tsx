import React, { useState, useEffect, useRef } from 'react';
import { 
    Settings as SettingsIcon, Database, Cloud, 
    RefreshCw, Zap, ShieldCheck, DatabaseZap, Terminal, 
    Info, ShieldAlert, FileJson, Server, Layout, ExternalLink, Activity,
    Lock, Unlock, CheckCircle2, AlertTriangle, MousePointerClick, HelpCircle,
    Shield, Monitor, Globe, Settings2, Command, Search, Fingerprint, ChevronRight,
    Upload, Download, FileUp, FileDown, AlertOctagon, Power, CloudUpload, CloudDownload,
    Wifi, WifiOff, Fingerprint as ScanIcon, Palette, Sparkles, Box, Check, MessageCircle, Bot, Radio,
    // Fix: Added missing Save icon import
    Save
} from 'lucide-react';
import { useTanxing, SESSION_ID } from '../context/TanxingContext';
import { Theme } from '../types';
import { sendFeishuMessage } from '../utils/feishu';

const THEMES: { id: Theme; name: string; desc: string; colors: string[] }[] = [
    { id: 'quantum', name: '量子深邃 (Default)', desc: '经典靛蓝与紫罗兰的科技平衡', colors: ['#6366f1', '#312e81', '#1e1b4b'] },
    { id: 'cyber', name: '赛博霓虹 (Cyber)', desc: '高对比度的玫红与电光青', colors: ['#ff007f', '#5a002d', '#00ffff'] },
    { id: 'emerald', name: '翡翠矩阵 (Emerald)', desc: '舒适自然的森林绿意', colors: ['#10b981', '#064e3b', '#022c22'] },
    { id: 'amber', name: '余晖落日 (Amber)', desc: '温暖和煦的琥珀色调', colors: ['#f59e0b', '#78350f', '#451a03'] },
    { id: 'oled', name: '极致纯黑 (OLED)', desc: '深邃沉稳，节省能耗', colors: ['#94a3b8', '#111', '#000'] },
];

const Settings: React.FC = () => {
  const { state, dispatch, showToast, connectToPb, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'cloud' | 'appearance' | 'comm' | 'data'>('cloud'); 
  const [pbInput, setPbInput] = useState(state.pbUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isTestingFeishu, setIsTestingFeishu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 飞书配置本地状态
  const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
  const [autoNotify, setAutoNotify] = useState(localStorage.getItem('TX_FEISHU_AUTO') === 'true');

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

  const handleSaveFeishu = () => {
      localStorage.setItem('TX_FEISHU_URL', feishuUrl);
      localStorage.setItem('TX_FEISHU_AUTO', autoNotify.toString());
      showToast('飞书通讯协议已更新', 'success');
  };

  const testFeishu = async () => {
      if (!feishuUrl) return showToast('请先输入 Webhook URL', 'warning');
      setIsTestingFeishu(true);
      const res = await sendFeishuMessage(feishuUrl, '系统自检测试', '探行 ERP 量子中枢连接正常。当前时间：' + new Date().toLocaleString());
      setIsTestingFeishu(false);
      if (res.success) showToast('飞书同步测试成功', 'success');
      else showToast('发送失败，请检查 URL', 'error');
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
              <Cloud className="w-4 h-4" /> 实时协同云
          </button>
          <button onClick={() => setActiveTab('comm')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'comm' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <MessageCircle className="w-4 h-4" /> 通讯矩阵 (飞书)
          </button>
          <button onClick={() => setActiveTab('appearance')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'appearance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Palette className="w-4 h-4" /> 视觉外观
          </button>
          <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Database className="w-4 h-4" /> 数据资产
          </button>
      </div>

      {activeTab === 'cloud' && (
          <div className="space-y-8">
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
                      </div>
                      <button onClick={handleConnect} disabled={isTesting} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all">
                          {isTesting ? '正在握手...' : '激活节点连接'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'comm' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="ios-glass-panel p-10 rounded-[2.5rem] border-white/5 bg-black/40 space-y-8">
                  <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-3 uppercase italic">
                          <Bot className="w-6 h-6 text-indigo-500" /> 飞书机器人·指挥协议
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">External Communication Node Layer</p>
                  </div>

                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">飞书自定义机器人 Webhook URL</label>
                          <div className="relative">
                            <MessageCircle className="absolute left-4 top-4 w-5 h-5 text-indigo-500" />
                            <input 
                                type="text" 
                                value={feishuUrl}
                                onChange={e => setFeishuUrl(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 pl-12 text-sm text-white font-mono outline-none focus:border-indigo-500"
                                placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                            />
                          </div>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-[2rem]">
                          <div className="flex gap-4 items-start">
                              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Radio className="w-5 h-5 animate-pulse"/></div>
                              <div>
                                  <div className="text-sm font-bold text-white uppercase tracking-tight">自动物流同步报告 (3H周期)</div>
                                  <p className="text-[10px] text-slate-500 mt-1">系统将每 3 小时通过服务器后台分析“运输中”单据，并自动推送轨迹变化到飞书。</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => setAutoNotify(!autoNotify)}
                            className={`w-14 h-8 rounded-full relative transition-all ${autoNotify ? 'bg-indigo-600' : 'bg-slate-800'}`}
                          >
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${autoNotify ? 'left-7' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={testFeishu}
                            disabled={isTestingFeishu}
                            className="py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                              {isTestingFeishu ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
                              发送自检报文
                          </button>
                          <button 
                            onClick={handleSaveFeishu}
                            className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                          >
                              <Save className="w-4 h-4"/> 部署通讯协议
                          </button>
                      </div>
                  </div>

                  <div className="p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-[2rem] flex items-center gap-6">
                      <Sparkles className="w-8 h-8 text-indigo-400" />
                      <div>
                          <div className="text-indigo-300 font-bold text-sm uppercase italic">腾讯云效能提示</div>
                          <p className="text-[10px] text-slate-500 font-medium">配置完成后，系统将自动利用您的腾讯云实例执行定时查询。这不会消耗浏览器的资源，确保 24/7 监控您的全球货物流向。</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'appearance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
              {THEMES.map(t => (
                  <button key={t.id} onClick={() => handleThemeChange(t.id)} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-4 text-left group relative overflow-hidden ${state.theme === t.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/2 border-white/5 hover:border-white/20'}`}>
                      {state.theme === t.id && <div className="absolute top-4 right-4 bg-indigo-600 p-1.5 rounded-full text-white z-10"><Check className="w-4 h-4" /></div>}
                      <div className="flex items-center gap-4 relative z-10">
                          <div className="flex -space-x-2">{t.colors.map((c, i) => <div key={i} className="w-8 h-8 rounded-full border-2 border-black" style={{ backgroundColor: c }}></div>)}</div>
                          <div><div className="text-sm font-bold text-white uppercase italic">{t.name}</div><div className="text-[10px] text-slate-500 font-bold">{t.desc}</div></div>
                      </div>
                  </button>
              ))}
          </div>
      )}
    </div>
  );
};

export default Settings;