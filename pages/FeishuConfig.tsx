
import React, { useState, useEffect } from 'react';
import { 
    MessageCircle, Zap, Radio, RefreshCw, Save, Bot, 
    ExternalLink, ShieldCheck, Activity, Bell, Info,
    ChevronRight, Settings2, Users, HelpCircle, AlertCircle,
    Smartphone, Link, Globe, ShieldQuestion, CheckCircle2,
    Sparkles, Truck, Loader2
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { sendMessageToBot } from '../utils/feishu';

const FeishuConfig: React.FC = () => {
    const { state, showToast, syncToCloud, performLogisticsSentry } = useTanxing();
    const [platform, setPlatform] = useState<'feishu' | 'dingtalk'>('feishu');
    
    // 实时状态
    const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
    const [autoNotify, setAutoNotify] = useState(localStorage.getItem('TX_FEISHU_AUTO') === 'true');
    const [isTesting, setIsTesting] = useState(false);
    const [isManualChecking, setIsManualChecking] = useState(false);
    const [lastSync, setLastSync] = useState(localStorage.getItem('TX_FEISHU_LAST') || '从未同步');

    // 监听 URL 变化，同步到本地存储，防止点击对账时读取不到
    useEffect(() => {
        if (feishuUrl.startsWith('http')) {
            localStorage.setItem('TX_FEISHU_URL', feishuUrl);
        }
    }, [feishuUrl]);

    const handleSave = async () => {
        if (!feishuUrl || !feishuUrl.startsWith('http')) {
            showToast('无效的 Webhook 地址格式', 'error');
            return;
        }
        localStorage.setItem('TX_FEISHU_URL', feishuUrl);
        localStorage.setItem('TX_FEISHU_AUTO', autoNotify.toString());
        
        await syncToCloud(true);
        
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('TX_FEISHU_LAST', now);
        showToast('通讯矩阵协议已部署并生效', 'success');
    };

    const testBot = async () => {
        const targetUrl = feishuUrl || localStorage.getItem('TX_FEISHU_URL');
        if (!targetUrl) return showToast('请先录入 Webhook 地址', 'warning');
        
        setIsTesting(true);
        const res = await sendMessageToBot(targetUrl, '链路压力测试', '探行 ERP 通讯节点响应正常。\n当前状态：量子中枢已接入。');
        setIsTesting(false);
        
        if (res.success) showToast('心跳报文发送成功！', 'success');
        else showToast('发送失败。请检查 URL 是否正确，或飞书机器人安全设置是否包含关键词“探行”', 'error');
    };

    const handleManualCheck = async () => {
        const targetUrl = feishuUrl || localStorage.getItem('TX_FEISHU_URL');
        if (!targetUrl) {
            showToast('未检测到 Webhook 配置，请先录入 URL', 'warning');
            return;
        }

        setIsManualChecking(true);
        try {
            // 确保同步最新的配置到上下文
            localStorage.setItem('TX_FEISHU_URL', targetUrl);
            localStorage.setItem('TX_FEISHU_AUTO', autoNotify.toString());
            
            // 执行对账推送
            await performLogisticsSentry();
            showToast('手动触发成功：正在扫描 UPS 轨迹并推送...', 'success');
        } catch (e) {
            showToast('对账任务启动失败', 'error');
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 左侧：配置面板 */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="ios-glass-panel p-8 rounded-[3rem] border-white/10 bg-black/40 space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full"></div>
                        
                        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit relative z-10">
                            <button onClick={() => setPlatform('feishu')} className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all ${platform === 'feishu' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-500'}`}>飞书 (Feishu)</button>
                            <button onClick={() => setPlatform('dingtalk')} className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all ${platform === 'dingtalk' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>钉钉 (DingTalk)</button>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 block">机器人 Webhook URL (接收端节点)</label>
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10 group-focus-within:opacity-40 transition-all"></div>
                                    <input 
                                        type="text" 
                                        value={feishuUrl}
                                        onChange={e => setFeishuUrl(e.target.value)}
                                        className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm text-white font-mono outline-none focus:border-indigo-500 transition-all relative z-10"
                                        placeholder={platform === 'feishu' ? 'https://open.feishu.cn/open-apis/bot/v2/hook/...' : 'https://oapi.dingtalk.com/robot/send?...'}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all">
                                <div className="flex gap-4 items-center">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Bell className="w-5 h-5 animate-pulse"/></div>
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">UPS 物流哨兵计划 (Sentry)</div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">自动同步 UPS 全球轨迹异常至移动端 (每3小时)</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAutoNotify(!autoNotify)}
                                    className={`w-14 h-8 rounded-full relative transition-all ${autoNotify ? 'bg-indigo-600 shadow-[0_0:10px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${autoNotify ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <Truck className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">哨兵状态监控</div>
                                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                            监控目标：<span className="text-indigo-400 font-black">UPS 全球件</span> | 上次巡检：<span className="text-white">{state.lastLogisticsCheck ? new Date(state.lastLogisticsCheck).toLocaleString() : '等待首次运行'}</span>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleManualCheck}
                                    disabled={isManualChecking}
                                    className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-[10px] font-black text-indigo-300 uppercase flex items-center justify-center gap-2 transition-all"
                                >
                                    {isManualChecking ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
                                    立即触发全球轨迹对账
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 relative z-10">
                            <button 
                                onClick={testBot}
                                disabled={isTesting}
                                className="flex-1 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4 text-yellow-500"/>}
                                发送测试心跳
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-[1.5] py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 italic shadow-indigo-900/40"
                            >
                                <Save className="w-4 h-4"/> 部署并激活通讯链路
                            </button>
                        </div>
                    </div>
                </div>

                {/* 右侧：操作引导 */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="ios-glass-panel p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> 物流哨兵如何工作？
                        </h3>
                        
                        <div className="space-y-6 text-[11px] text-slate-400 leading-relaxed font-medium">
                            <p>1. <span className="text-white font-bold">自动识别</span>：系统每 3 小时扫描一次您的“物流追踪”矩阵。凡是 UPS 承运且未妥投的单据，都会进入哨兵池。</p>
                            <p>2. <span className="text-white font-bold">AI 翻译与压缩</span>：Gemini 3 会自动将复杂的物流更新（如：Arrival Scan, Departure Scan）翻译成易懂的中文动态。</p>
                            <p>3. <span className="text-white font-bold">静默推送</span>：当识别到轨迹发生物理位移或出现“异常”状态时，飞书群将收到即时预警。</p>
                        </div>

                        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-emerald-200/70 font-bold leading-relaxed uppercase">
                                <b>注意：</b> 由于是浏览器端 AI 逻辑，请在电脑上保持 ERP 标签页开启以维持自动推送。若需 24/7 离线推送，需配合后端 Node 脚本。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeishuConfig;
