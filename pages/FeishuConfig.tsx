
import React, { useState, useEffect } from 'react';
import { 
    MessageCircle, RefreshCw, Radio, Bell, 
    Sparkles, Truck, Loader2, Key, CheckCircle2, AlertCircle, Zap, ShieldCheck, 
    Smartphone, Send, Bot, Settings2, Cpu
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { sendMessageToBot } from '../utils/feishu';
import { GoogleGenAI } from "@google/genai";

const FeishuConfig: React.FC = () => {
    const { state, showToast, performLogisticsSentry } = useTanxing();
    const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
    const [isTestingFeishu, setIsTestingFeishu] = useState(false);
    const [isTestingAi, setIsTestingAi] = useState(false);
    const [isManualChecking, setIsManualChecking] = useState(false);

    const getAiStudio = () => {
        try {
            let win = window as any;
            while (win) {
                if (win.aistudio) return win.aistudio;
                if (win === win.parent) break;
                win = win.parent;
            }
        } catch (e) {}
        return (globalThis as any).aistudio;
    };

    const handleForceAuth = async () => {
        const aistudio = getAiStudio();
        if (aistudio) {
            showToast('授权指令已发送，请在弹出窗选择 Paid 密钥。', 'info');
            await aistudio.openSelectKey();
        } else {
            showToast('当前预览模式不支持动态授权，请确保 process.env.API_KEY 已硬编码。', 'error');
        }
    };

    const testAiLink = async () => {
        setIsTestingAi(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const res = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: 'Hello, respond with ONLY the word "CONNECTED" if you can hear me.' }] }]
            });
            if (res.text?.includes('CONNECTED')) {
                showToast('AI 神经链路测试通过：响应正常', 'success');
            } else {
                throw new Error("响应内容异常");
            }
        } catch (e: any) {
            showToast(`AI 链接失败: ${e.message}`, 'error');
            const aistudio = getAiStudio();
            if (aistudio && (e.message.includes('key') || e.message.includes('found'))) aistudio.openSelectKey();
        } finally {
            setIsTestingAi(false);
        }
    };

    const handleManualCheck = async () => {
        if (!feishuUrl) return showToast('请先配置 Webhook 地址', 'warning');
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
                    <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.3em]">
                        <Zap className="w-3 h-3 text-emerald-400 inline mr-2"/> External Communication Adapter
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={testAiLink}
                        disabled={isTestingAi}
                        className="px-6 py-2.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        {/* Fixed missing import for Cpu icon */}
                        {isTestingAi ? <Loader2 className="w-4 h-4 animate-spin"/> : <Cpu className="w-4 h-4"/>} 探测 AI 链路
                    </button>
                    <button 
                        onClick={handleForceAuth}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-2xl active:scale-95"
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
                                    placeholder="https://open.feishu.cn/..."
                                />
                                <div className="mt-4 flex gap-4">
                                    <button 
                                        onClick={async () => {
                                            setIsTestingFeishu(true);
                                            const res = await sendMessageToBot(feishuUrl, '心跳自检', '探行 ERP 通讯中枢响应正常');
                                            setIsTestingFeishu(false);
                                            if (res.success) showToast('心跳同步成功', 'success');
                                            else showToast('飞书发送失败', 'error');
                                        }}
                                        disabled={isTestingFeishu}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2"
                                    >
                                        {isTestingFeishu ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>} 发送测试心跳
                                    </button>
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem('TX_FEISHU_URL', feishuUrl);
                                            showToast('飞书通讯协议已固化', 'success');
                                        }}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase shadow-xl transition-all"
                                    >
                                        保存配置
                                    </button>
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
                                    className={`w-full py-4 border rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isManualChecking ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 shadow-2xl shadow-indigo-900/10'}`}
                                >
                                    {isManualChecking ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                                    {isManualChecking ? 'AI 量子计算处理中...' : '立即触发全球轨迹对账'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="ios-glass-panel p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20 shadow-xl">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> 物流哨兵·联网审计说明
                        </h3>
                        <div className="space-y-6 text-[11px] text-slate-400 leading-relaxed font-bold italic">
                            <p>1. <span className="text-white">权限自适应</span>：系统会自动检测您的 API Key。如果您的 Key 启用了结算，我们将使用 <span className="text-indigo-400">Google Search</span> 进行实时全网核账。</p>
                            <p>2. <span className="text-white">智能降级</span>：如果检测到是免费 Key 或权限受限，系统将自动切换至 <span className="text-emerald-400">智能推演模式</span>，同样会将诊断结果发送至飞书。</p>
                            <p>3. <span className="text-white">同步安全</span>：报文中包含“探行”关键字，确保通过飞书机器人的拦截机制。</p>
                        </div>
                        <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                            <p className="text-[10px] text-emerald-500/70 font-bold leading-relaxed italic">
                                建议：为了获得最精准的全球轨迹，请在 Google AI Studio 控制台中启用 Billing 模式。
                            </p>
                        </div>
                    </div>

                    <div className="ios-glass-panel p-8 rounded-[2.5rem] bg-white/2 border border-white/5 space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Settings2 className="w-4 h-4" /> 调试中枢 (Debugger)</h4>
                        <p className="text-[10px] text-slate-600">如果点击对账无反应，请先点击下方的“探测 AI 链路”进行物理层自检。</p>
                        <button onClick={testAiLink} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase underline">Run AI Connection Self-Test</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeishuConfig;
