
import React, { useState } from 'react';
import { 
    MessageCircle, RefreshCw, Send, Truck, 
    Loader2, Zap, ShieldCheck, ListChecks,
    ClipboardList, ExternalLink, Key, CheckCircle2
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { sendMessageToBot } from '../utils/feishu';

const FeishuConfig: React.FC = () => {
    const { state, showToast, pushTrackingToFeishu } = useTanxing();
    const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
    const [isTesting, setIsTesting] = useState(false);
    const [isPushing, setIsPushing] = useState(false);

    const handleSave = () => {
        localStorage.setItem('TX_FEISHU_URL', feishuUrl);
        showToast('飞书 Webhook 节点已固化', 'success');
    };

    const handlePushTracking = async () => {
        if (!feishuUrl) return showToast('请先配置 Webhook 地址', 'warning');
        setIsPushing(true);
        try {
            await pushTrackingToFeishu(true);
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                    <MessageCircle className="w-10 h-10 text-indigo-500" />
                    飞书通讯矩阵 (MESSAGING MATRIX)
                </h2>
                <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.3em]">
                    <Zap className="w-3 h-3 text-emerald-400 inline mr-2"/> Feishu Bot Integration Center
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    <div className="ios-glass-panel p-8 rounded-[3rem] border-white/10 bg-black/40 space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="space-y-6">
                            {/* Webhook 配置 */}
                            <div>
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 block">机器人 Webhook URL</label>
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
                                            setIsTesting(true);
                                            const res = await sendMessageToBot(feishuUrl, '连接测试', '探行 ERP 通讯测试：单号同步链路已就绪。');
                                            setIsTesting(false);
                                            if (res.success) showToast('心跳测试成功', 'success');
                                            else showToast('发送失败，请检查 URL', 'error');
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
                                        保存配置
                                    </button>
                                </div>
                            </div>

                            {/* 物流单号推送核心卡片 */}
                            <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-[2rem] p-8 flex flex-col gap-6">
                                <div className="flex items-start gap-5">
                                    <div className="p-4 bg-blue-600/20 rounded-2xl">
                                        <Truck className="w-10 h-10 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-white italic uppercase tracking-tight">物流单号镜像同步</div>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            此操作将提取“物流追踪”模块中所有<span className="text-blue-400 font-black">正在运输中</span>的货件名称与 UPS/DHL 单号，并发送清单至飞书。
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handlePushTracking}
                                    disabled={isPushing}
                                    className={`w-full py-5 border rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 transition-all ${isPushing ? 'bg-blue-600/10 border-blue-500/20 text-blue-300' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-900/40 active:scale-[0.98]'}`}
                                >
                                    {isPushing ? <Loader2 className="w-5 h-5 animate-spin"/> : <ListChecks className="w-5 h-5"/>}
                                    {isPushing ? '正在收集物流载荷...' : '立即推送当前物流清单到飞书'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="ios-glass-panel p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20 shadow-xl">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <ClipboardList className="w-5 h-5 text-indigo-400" /> 同步逻辑说明
                        </h3>
                        <div className="space-y-6 text-[11px] text-slate-400 leading-relaxed font-bold italic uppercase">
                            <p>1. <span className="text-white">一键复制</span>：推送的消息采用简洁格式，方便您在飞书移动端直接复制单号到官方 App 查询。</p>
                            <p>2. <span className="text-white">仅限在途</span>：系统会自动过滤“已送达”的货件，只推送当前您最关心的活跃运单。</p>
                            <p>3. <span className="text-white">安全性</span>：数据仅通过 Webhook 直接发送至您的飞书私有频道，不经过任何第三方处理。</p>
                        </div>
                    </div>

                    <div className="ios-glass-panel p-8 rounded-[2.5rem] border border-emerald-500/30 bg-emerald-500/5 shadow-2xl">
                        <h4 className="text-emerald-400 text-xs font-black uppercase mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> 链路状态
                        </h4>
                        <div className="flex items-center gap-2 mt-4">
                            <div className={`w-2 h-2 rounded-full ${feishuUrl ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{feishuUrl ? '通讯链路已激活' : '等待地址输入'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeishuConfig;
