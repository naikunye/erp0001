import React, { useState } from 'react';
import { 
    MessageCircle, Zap, Radio, RefreshCw, Save, Bot, 
    ExternalLink, ShieldCheck, Activity, Bell, Info,
    ChevronRight, Settings2, Users, HelpCircle, AlertCircle,
    Smartphone, Link, Globe, ShieldQuestion, CheckCircle2,
    // Fix: Added missing Sparkles icon import
    Sparkles
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { sendMessageToBot } from '../utils/feishu';

const FeishuConfig: React.FC = () => {
    const { state, showToast, syncToCloud } = useTanxing();
    const [platform, setPlatform] = useState<'feishu' | 'dingtalk'>('feishu');
    
    const [feishuUrl, setFeishuUrl] = useState(localStorage.getItem('TX_FEISHU_URL') || '');
    const [autoNotify, setAutoNotify] = useState(localStorage.getItem('TX_FEISHU_AUTO') === 'true');
    const [isTesting, setIsTesting] = useState(false);
    const [lastSync, setLastSync] = useState(localStorage.getItem('TX_FEISHU_LAST') || '从未同步');

    const handleSave = async () => {
        if (!feishuUrl.startsWith('http')) {
            showToast('无效的 Webhook 地址格式', 'error');
            return;
        }
        localStorage.setItem('TX_FEISHU_URL', feishuUrl);
        localStorage.setItem('TX_FEISHU_AUTO', autoNotify.toString());
        
        await syncToCloud(true);
        
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('TX_FEISHU_LAST', now);
        showToast('通讯矩阵协议已更新', 'success');
    };

    const testBot = async () => {
        if (!feishuUrl) return showToast('请先录入 Webhook 地址', 'warning');
        setIsTesting(true);
        const res = await sendMessageToBot(feishuUrl, '系统心跳对账', '通讯链路已打通。\nERP 中枢状态：全功能就绪。');
        setIsTesting(false);
        if (res.success) showToast('心跳报文发送成功！请查看群聊', 'success');
        else showToast('发送失败。请检查是否在飞书后台设置了关键词“探行”', 'error');
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
                        {/* 装饰性背景 */}
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

                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 flex items-start gap-4">
                                <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                                <div>
                                    <div className="text-sm font-bold text-white uppercase italic">必做：安全设置校验</div>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                        在{platform === 'feishu' ? '飞书' : '钉钉'}机器人后台，请务必启用 <span className="text-indigo-400 font-black">“自定义关键词”</span>，并添加关键词：<span className="text-white bg-indigo-600 px-2 py-0.5 rounded font-mono">探行</span>。否则消息会被平台拦截。
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all">
                                <div className="flex gap-4 items-center">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Bell className="w-5 h-5 animate-pulse"/></div>
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase italic">异常实时推算</div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">自动同步全球物流轨迹异常至移动端</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAutoNotify(!autoNotify)}
                                    className={`w-14 h-8 rounded-full relative transition-all ${autoNotify ? 'bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${autoNotify ? 'left-7' : 'left-1'}`}></div>
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

                    <div className="ios-glass-card p-6 border-l-4 border-l-emerald-500 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            <div>
                                <div className="text-xs font-black text-white uppercase tracking-widest">物理链路状态：已就绪</div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Ready to broadcast logistics events</p>
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono italic">v12.0 Stable</span>
                    </div>
                </div>

                {/* 右侧：操作引导 */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="ios-glass-panel p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <HelpCircle className="w-5 h-5 text-indigo-400" /> 成功配置的最后 2 步
                        </h3>
                        
                        <div className="space-y-6 relative pl-4">
                            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/5"></div>
                            {[
                                { step: '1', title: '复制 URL 地址', desc: '点击飞书机器人界面的“复制”按钮，拿到 Webhook 地址。', icon: Link },
                                { step: '2', title: '设置安全关键词', desc: '在“安全设置”中勾选“自定义关键词”，输入“探行”。', icon: ShieldCheck },
                                { step: '3', title: '粘贴并部署', desc: '将地址粘贴到左侧，点击“部署并激活”按钮。', icon: ExternalLink },
                                { step: '4', title: '心跳测试', desc: '点击“发送测试心跳”，如果飞书群里弹出消息，说明大功告成！', icon: Zap }
                            ].map((item, idx) => (
                                <div key={idx} className="relative pl-8">
                                    <div className="absolute left-[-11px] top-1 w-5 h-5 rounded-full bg-black border border-indigo-500/50 flex items-center justify-center text-[10px] font-black text-indigo-400 z-10">{item.step}</div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-white/5 rounded-lg text-indigo-300 mt-1"><item.icon className="w-4 h-4" /></div>
                                        <div><div className="text-xs font-bold text-slate-200 mb-1">{item.title}</div><p className="text-[10px] text-slate-500 leading-relaxed font-medium">{item.desc}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-emerald-200/70 font-bold leading-relaxed">
                                完成后，ERP 系统将自动在后台通过“逻辑神经中枢”监控您的全球物流状态。一旦轨迹发生变化，机器人会立即在手机上通知您。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeishuConfig;