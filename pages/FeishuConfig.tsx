
import React, { useState } from 'react';
import { 
    MessageCircle, RefreshCw, Radio, Bell, 
    Sparkles, Truck, Loader2, Key, CheckCircle2, AlertCircle, Zap, ShieldCheck, 
    Send, Bot, Settings2, Cpu, BarChart3, ShieldAlert
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { sendMessageToBot } from '../utils/feishu';

const FeishuConfig: React.FC = () => {
    const { state, showToast, performOperationalAudit } = useTanxing();
    const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
    const [isTesting, setIsTesting] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);

    const handleSave = () => {
        localStorage.setItem('TX_FEISHU_URL', feishuUrl);
        showToast('飞书通讯协议已在云端固化', 'success');
    };

    const triggerAudit = async () => {
        if (!feishuUrl) return showToast('请先配置 Webhook 地址', 'warning');
        setIsAuditing(true);
        try {
            await performOperationalAudit(true);
        } finally {
            setIsAuditing(false);
        }
    };

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

    const handleAuth = async () => {
        const aistudio = getAiStudio();
        if (aistudio) {
            await aistudio.openSelectKey();
            showToast('正在激活量子授权窗口...', 'info');
        } else {
            showToast('当前预览环境不支持动态授权', 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                        <MessageCircle className="w-10 h-10 text-indigo-500" />
                        飞书通讯矩阵 (MESSAGING MATRIX)
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.3em]">
                        <Zap className="w-3 h-3 text-emerald-400 inline mr-2"/> ERP Command Center Integration
                    </p>
                </div>
                <button 
                    onClick={handleAuth}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                >
                    <Key className="w-4 h-4"/> 重新授权 AI 链路
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    <div className="ios-glass-panel p-8 rounded-[3rem] border-white/10 bg-black/40 space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="space-y-6">
                            {/* Webhook 配置区块 */}
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
                                            setIsTesting(true);
                                            const res = await sendMessageToBot(feishuUrl, '连接测试', '探行 ERP 数字化中枢连接成功，准备接收指挥官简报。');
                                            setIsTesting(false);
                                            if (res.success) showToast('心跳测试成功', 'success');
                                            else showToast('发送失败', 'error');
                                        }}
                                        disabled={isTesting}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2"
                                    >
                                        {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>} 发送测试脉搏
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase shadow-xl transition-all"
                                    >
                                        保存中枢配置
                                    </button>
                                </div>
                            </div>

                            {/* 经营现状审计 - 核心按钮 */}
                            <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-8 flex flex-col gap-6">
                                <div className="flex items-start gap-5">
                                    <div className="p-4 bg-indigo-600/20 rounded-2xl">
                                        <BarChart3 className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-white italic uppercase tracking-tight">AI 经营现状审计</div>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            扫描范围：<span className="text-indigo-400 font-black">全量 SKU 库存 | 财务历史流水 | 运营协作任务</span>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={triggerAudit}
                                    disabled={isAuditing}
                                    className={`w-full py-5 border rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 transition-all ${isAuditing ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-900/40 active:scale-[0.98]'}`}
                                >
                                    {isAuditing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                                    {isAuditing ? '正在解构经营位面...' : '立即生成今日指挥官简报并推送'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="ios-glass-panel p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20 shadow-xl">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <Settings2 className="w-5 h-5 text-indigo-400" /> 云服务器联动说明
                        </h3>
                        <div className="space-y-6 text-[11px] text-slate-400 leading-relaxed font-bold italic uppercase">
                            <p>1. <span className="text-white">本地数据闭环</span>：该功能仅分析您 ERP 内部的库存、订单和任务，不涉及任何外部 API 的联网搜索，响应速度快且稳定。</p>
                            <p>2. <span className="text-white">智能决策压缩</span>：AI 会将海量表格数据转化为手机端易读的“关键行动建议”，实现精准管理。</p>
                            <p>3. <span className="text-white">私有指挥链路</span>：报文通过私有 Webhook 发送，确保商业数据仅在您的飞书工作台流通。</p>
                        </div>
                    </div>

                    <div className="ios-glass-panel p-8 rounded-[2.5rem] border border-emerald-500/30 bg-emerald-500/5 shadow-2xl">
                        <h4 className="text-emerald-400 text-xs font-black uppercase mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> 通讯安全性校验
                        </h4>
                        <p className="text-[10px] text-emerald-500/80 leading-relaxed font-bold italic">
                            探行 ERP 采用 TLS 1.3 加密传输。生成的简报将自动包含“探行”关键字，以通过飞书机器人的内容过滤机制。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeishuConfig;
