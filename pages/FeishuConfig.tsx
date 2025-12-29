
import React, { useState, useEffect } from 'react';
import { 
    MessageCircle, RefreshCw, Radio, Bell, 
    Sparkles, Truck, Loader2, Key, CheckCircle2, AlertCircle, Zap, ShieldCheck
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { sendMessageToBot } from '../utils/feishu';

const FeishuConfig: React.FC = () => {
    const { state, showToast, performLogisticsSentry } = useTanxing();
    const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
    const [isTesting, setIsTesting] = useState(false);
    const [isManualChecking, setIsManualChecking] = useState(false);
    const [aiLinkReady, setAiLinkReady] = useState(false);

    // 深度查找 aistudio
    const getAiStudio = () => {
        let curr: any = window;
        try {
            while (curr) {
                if (curr.aistudio) return curr.aistudio;
                if (curr === curr.parent) break;
                curr = curr.parent;
            }
        } catch (e) {}
        return (globalThis as any).aistudio;
    };

    useEffect(() => {
        const checkKey = async () => {
            const aistudio = getAiStudio();
            if (aistudio) {
                try {
                    const hasKey = await aistudio.hasSelectedApiKey();
                    setAiLinkReady(hasKey && !!process.env.API_KEY);
                } catch (e) { setAiLinkReady(false); }
            } else {
                setAiLinkReady(!!process.env.API_KEY);
            }
        };
        const timer = setInterval(checkKey, 2000);
        return () => clearInterval(timer);
    }, []);

    const handleForceAuth = async () => {
        const aistudio = getAiStudio();
        if (aistudio) {
            showToast('正在调起官方授权窗口...', 'info');
            await aistudio.openSelectKey();
            showToast('授权流程已启动，请在弹窗中选择 Paid API Key', 'success');
        } else {
            showToast('当前浏览器环境未检测到 AI Studio 授权接口，请尝试刷新页面。', 'error');
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
                        跨端通讯矩阵 (Messaging Matrix)
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.3em]">External Communication Adapter</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${aiLinkReady ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                        {aiLinkReady ? <Zap className="w-3 h-3 fill-current animate-pulse" /> : <AlertCircle className="w-3 h-3" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">AI Link: {aiLinkReady ? 'Active' : 'Missing Key'}</span>
                    </div>
                    <button 
                        onClick={handleForceAuth}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl"
                    >
                        <Key className="w-4 h-4"/> 激活 AI 授权
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    <div className="ios-glass-panel p-8 rounded-[3rem] border-white/10 bg-black/40 space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                            <button className="px-6 py-2 text-[10px] font-black rounded-xl bg-indigo-600 text-white shadow-lg">飞书 (Feishu)</button>
                            <button className="px-6 py-2 text-[10px] font-black rounded-xl text-slate-500">钉钉 (DingTalk)</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 block">机器人 Webhook URL (接收端节点)</label>
                                <input 
                                    type="text" 
                                    value={feishuUrl}
                                    onChange={e => setFeishuUrl(e.target.value)}
                                    className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm text-white font-mono outline-none focus:border-indigo-500 transition-all"
                                    placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                                />
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[9px] text-slate-600 font-bold uppercase">云端状态: Connected</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-[2rem]">
                                <div className="flex gap-4 items-center">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Bell className="w-5 h-5 animate-pulse"/></div>
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">全球物流哨兵计划 (Sentry)</div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">自动识别轨迹状态并同步至移动端 (每3小时轮询)</p>
                                    </div>
                                </div>
                                <div className="w-14 h-8 bg-indigo-600 rounded-full relative">
                                    <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full"></div>
                                </div>
                            </div>

                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <Truck className="w-6 h-6 text-indigo-400 mt-1" />
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">哨兵状态监控</div>
                                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                            监控范围：<span className="text-indigo-400 font-black">物流追踪页所有单号</span> | 上次巡检：<span className="text-white">{state.lastLogisticsCheck ? new Date(state.lastLogisticsCheck).toLocaleString() : '等待首次激活'}</span>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleManualCheck}
                                    disabled={isManualChecking}
                                    className={`w-full py-4 border rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isManualChecking ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.1)]'}`}
                                >
                                    {isManualChecking ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                                    {isManualChecking ? '量子链路处理中...' : '立即触发全球轨迹对账'}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={async () => {
                                    setIsTesting(true);
                                    await sendMessageToBot(feishuUrl, '心跳测试', '探行 ERP 通讯中枢响应正常');
                                    setIsTesting(false);
                                    showToast('测试心跳已发送', 'success');
                                }}
                                className="flex-1 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase"
                            >
                                发送测试心跳
                            </button>
                            <button onClick={() => {
                                localStorage.setItem('TX_FEISHU_URL', feishuUrl);
                                showToast('通讯协议已固化', 'success');
                            }} className="flex-[1.5] py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all">
                                部署并激活通讯链路
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
                            <p>1. <span className="text-white font-bold">无感核账</span>：系统利用 Gemini 3 的联网能力，直接在互联网扫描公开物流状态，<span className="text-indigo-400 font-bold">无需 UPS 官方 API 密钥</span>。</p>
                            <p>2. <span className="text-white font-bold">关键反馈</span>：当 AI 识别到单号发生“滞留”、“报关异常”或“已签收”时，会自动向飞书群广播详细的中文诊断结果。</p>
                            <p>3. <span className="text-white font-bold">同步机制</span>：点击左侧按钮前，请确保您已在“物流追踪”页录入了 UPS、DHL 等有效单号。</p>
                        </div>
                        <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                            <p className="text-[10px] text-emerald-500/70 font-bold leading-relaxed italic">
                                注意：飞书机器人安全设置中必须包含关键词“探行”，否则报文将被拦截。
                            </p>
                        </div>
                    </div>

                    {!aiLinkReady && (
                        <div className="ios-glass-panel p-8 rounded-[2.5rem] border border-rose-500/30 bg-rose-500/5 animate-pulse">
                            <h4 className="text-rose-400 text-xs font-black uppercase mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> 授权异常诊断
                            </h4>
                            <p className="text-[10px] text-rose-400/70 leading-relaxed font-bold">
                                未检测到有效的 API 令牌。请点击右上角“激活 AI 授权”并选择一个有效密钥。如果没有弹出窗口，请检查浏览器是否拦截了弹出窗或尝试 Ctrl+F5 刷新整个页面。
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeishuConfig;
