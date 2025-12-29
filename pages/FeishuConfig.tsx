
import React, { useState, useEffect } from 'react';
import { 
    MessageCircle, Zap, Radio, RefreshCw, Save, Bot, 
    ExternalLink, ShieldCheck, Activity, Bell, Info,
    ChevronRight, Settings2, Users, HelpCircle, AlertCircle,
    Smartphone, Link, Globe, ShieldQuestion, CheckCircle2,
    Sparkles, Truck, Loader2, Key
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { sendMessageToBot } from '../utils/feishu';

const FeishuConfig: React.FC = () => {
    const { state, showToast, syncToCloud, performLogisticsSentry } = useTanxing();
    const [platform, setPlatform] = useState<'feishu' | 'dingtalk'>('feishu');
    
    const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
    const [autoNotify, setAutoNotify] = useState(localStorage.getItem('TX_FEISHU_AUTO') === 'true');
    const [isTesting, setIsTesting] = useState(false);
    const [isManualChecking, setIsManualChecking] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [lastSync, setLastSync] = useState(localStorage.getItem('TX_FEISHU_LAST') || '从未同步');

    useEffect(() => {
        if (feishuUrl && feishuUrl.startsWith('http')) {
            localStorage.setItem('TX_FEISHU_URL', feishuUrl);
        }
    }, [feishuUrl]);

    const handleSave = async () => {
        if (!feishuUrl || !feishuUrl.startsWith('http')) {
            showToast('无效的 Webhook 地址格式', 'error');
            return;
        }
        setIsDeploying(true);
        localStorage.setItem('TX_FEISHU_URL', feishuUrl);
        localStorage.setItem('TX_FEISHU_AUTO', autoNotify.toString());
        try {
            await syncToCloud(true);
            const now = new Date().toLocaleString();
            setLastSync(now);
            localStorage.setItem('TX_FEISHU_LAST', now);
        } finally {
            setIsDeploying(false);
        }
    };

    const handleForceAuth = async () => {
        const win = window as any;
        const aistudio = win.aistudio || win.parent?.aistudio;
        if (aistudio) {
            showToast('正在调起官方授权窗口...', 'info');
            await aistudio.openSelectKey();
        } else {
            showToast('当前环境不支持动态授权，请手动配置 process.env.API_KEY', 'error');
        }
    };

    const handleManualCheck = async () => {
        if (!feishuUrl) return showToast('请先配置并保存 Webhook 地址', 'warning');
        setIsManualChecking(true);
        try {
            await performLogisticsSentry(true);
        } finally {
            setIsManualChecking(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                        <MessageCircle className="w-10 h-10 text-indigo-500" />
                        跨端通讯矩阵 (Bot Matrix)
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.3em]">
                        <Activity className="w-3 h-3 text-emerald-400 inline mr-2"/> External Communication Adapter
                    </p>
                </div>
                {!process.env.API_KEY && (
                    <button 
                        onClick={handleForceAuth}
                        className="px-6 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all animate-pulse"
                    >
                        <Key className="w-4 h-4"/> 激活 AI 授权
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    <div className="ios-glass-panel p-8 rounded-[3rem] border-white/10 bg-black/40 space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                            <button onClick={() => setPlatform('feishu')} className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all ${platform === 'feishu' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>飞书 (Feishu)</button>
                            <button onClick={() => setPlatform('dingtalk')} className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all ${platform === 'dingtalk' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>钉钉 (DingTalk)</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 block">机器人 Webhook URL</label>
                                <input 
                                    type="text" 
                                    value={feishuUrl}
                                    onChange={e => setFeishuUrl(e.target.value)}
                                    className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm text-white font-mono outline-none focus:border-indigo-500 transition-all"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-[2rem]">
                                <div className="flex gap-4 items-center">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Bell className="w-5 h-5 animate-pulse"/></div>
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">全球物流哨兵计划 (Sentry)</div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">自动识别轨迹状态并同步至移动端</p>
                                    </div>
                                </div>
                                <button onClick={() => setAutoNotify(!autoNotify)} className={`w-14 h-8 rounded-full relative transition-all ${autoNotify ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${autoNotify ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <Truck className="w-6 h-6 text-indigo-400 mt-1" />
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">哨兵状态监控</div>
                                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                            监控范围：<span className="text-indigo-400 font-black">物流追踪页所有单号</span> | 上次对账：<span className="text-white">{state.lastLogisticsCheck ? new Date(state.lastLogisticsCheck).toLocaleString() : '等待首次激活'}</span>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleManualCheck}
                                    disabled={isManualChecking}
                                    className={`w-full py-4 border rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isManualChecking ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300'}`}
                                >
                                    {isManualChecking ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                                    {isManualChecking ? 'AI 量子引擎对账中...' : '立即触发全球轨迹对账'}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={async () => {
                                    setIsTesting(true);
                                    await sendMessageToBot(feishuUrl, '心跳测试', '响应正常');
                                    setIsTesting(false);
                                }}
                                className="flex-1 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase"
                            >
                                {isTesting ? '发送中...' : '发送测试心跳'}
                            </button>
                            <button onClick={handleSave} className="flex-[1.5] py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all">
                                {isDeploying ? '激活中...' : '部署并激活通讯链路'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="ios-glass-panel p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> 物流哨兵·联网对账
                        </h3>
                        <div className="space-y-6 text-[11px] text-slate-400 leading-relaxed font-medium">
                            <p>1. <span className="text-white font-bold">无感核账</span>：系统利用 Gemini 3 的联网能力，直接在互联网扫描公开物流状态。</p>
                            <p>2. <span className="text-white font-bold">关键反馈</span>：当 AI 识别到异常，会自动向飞书广播详细的中文诊断结果。</p>
                            {!process.env.API_KEY && (
                                <p className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
                                    <b>授权警告：</b> 检测到 API Key 未就绪。请点击右上方“激活 AI 授权”并在弹出的对话框中选择一个 Paid API Key。
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeishuConfig;
