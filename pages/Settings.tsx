
import React, { useRef } from 'react';
import { 
    Palette, Cloud, ShieldCheck, Database, 
    Zap, Monitor, Smartphone, Globe, Check,
    FileJson, FileSpreadsheet, Upload, Download, HardDrive, FileText
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Theme } from '../types';

const Settings: React.FC = () => {
    const { state, dispatch, syncToCloud, showToast } = useTanxing();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const themes: { id: Theme; name: string; color: string; desc: string }[] = [
        { id: 'tech-blue', name: '科技蓝 (Tech Blue)', color: 'bg-blue-600', desc: '经典瑞士工业美学，深邃且严谨' },
        { id: 'vitality-orange', name: '活力橙 (Vitality Orange)', color: 'bg-orange-600', desc: '极具行动力的色彩，适合快节奏运营' },
        { id: 'dark-green', name: '暗夜绿 (Dark Green)', color: 'bg-emerald-600', desc: '黑客矩阵风格，低对比度护眼模式' },
    ];

    // --- Data Handlers ---

    const handleExportJSON = () => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tanxing_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('全量系统快照已导出', 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);
                
                // Simple validation
                if (!parsedData.products && !parsedData.activePage) {
                    throw new Error("无效的备份文件格式");
                }

                if (confirm('警告：此操作将覆盖当前所有系统数据。确定要恢复备份吗？')) {
                    dispatch({ type: 'BOOT', payload: parsedData });
                    showToast('系统状态已成功回溯', 'success');
                }
            } catch (err) {
                console.error(err);
                showToast('导入失败：文件格式错误或已损坏', 'error');
            } finally {
                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleExportCSV = (type: 'inventory' | 'orders' | 'finance') => {
        let data: any[] = [];
        let filename = '';
        let headers: string[] = [];

        switch (type) {
            case 'inventory':
                data = (state.products || []).map((p: any) => ({
                    SKU: p.sku,
                    Name: p.name,
                    Stock: p.stock,
                    CostPrice: p.costPrice,
                    SalesPrice: p.price,
                    Status: p.lifecycle || 'Normal'
                }));
                filename = 'inventory_matrix.csv';
                break;
            case 'orders':
                data = (state.orders || []).map((o: any) => ({
                    OrderID: o.id,
                    Customer: o.customerName,
                    Total: o.total,
                    Status: o.status,
                    Date: o.date,
                    Items: o.itemsCount
                }));
                filename = 'orders_history.csv';
                break;
            case 'finance':
                data = (state.transactions || []).map((t: any) => ({
                    Date: t.date,
                    Type: t.type,
                    Category: t.category,
                    Amount: t.amount,
                    Currency: t.currency,
                    Description: t.description
                }));
                filename = 'financial_ledger.csv';
                break;
        }

        if (data.length === 0) {
            showToast('暂无数据可导出', 'warning');
            return;
        }

        headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => {
                const val = row[fieldName] ? String(row[fieldName]).replace(/"/g, '""') : '';
                return `"${val}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`${type.toUpperCase()} 数据表已导出`, 'success');
    };

    return (
        <div className="w-full h-full flex flex-col px-10 py-8 no-scrollbar overflow-y-auto">
            <div className="mb-12 shrink-0">
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">System Preferences</p>
                <h1 className="text-5xl font-black tracking-tighter text-white">系统偏好设置</h1>
            </div>

            <div className="grid grid-cols-12 gap-10 pb-10">
                
                {/* 视觉主题切换 */}
                <div className="col-span-7 space-y-10">
                    <div className="precision-surface rounded-3xl p-10">
                        <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                            <Palette className="w-5 h-5 text-indigo-500" /> 视觉引擎风格 (Appearance)
                        </h3>
                        <div className="space-y-4">
                            {themes.map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => dispatch({ type: 'SET_THEME', payload: t.id })}
                                    className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between group press-effect ${state.theme === t.id ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl' : 'border-white/5 bg-white/2 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl shadow-2xl ${t.color} border border-white/20 flex items-center justify-center`}>
                                            {state.theme === t.id && <Check className="w-8 h-8 text-white" />}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-black text-white italic">{t.name}</div>
                                            <div className="text-[10px] text-white/30 font-bold uppercase mt-1 tracking-widest">{t.desc}</div>
                                        </div>
                                    </div>
                                    {state.theme === t.id && (
                                        <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_var(--accent-500)]"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 腾讯云 Omega 同步 */}
                <div className="col-span-5 space-y-10">
                    <div className="precision-surface rounded-3xl p-10 bg-indigo-500/10 border-indigo-500/20 shadow-[0_30px_90px_rgba(79,70,229,0.15)]">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                                <Cloud className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">腾讯云同步</h3>
                                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">Omega Protocol v4.2</p>
                            </div>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed font-bold mb-10">
                            激活后，本地资产协议将每隔 300ms 广播至腾讯云 Omega 节点，并由三地六中心进行多重共识校验。
                        </p>
                        <button 
                            onClick={() => syncToCloud(true)}
                            className="w-full py-6 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-100 transition-colors"
                        >
                            执行全量镜像同步
                        </button>
                    </div>

                    <div className="precision-surface rounded-3xl p-8">
                        <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6">Device Identifier</h3>
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono">
                            <code className="text-sm font-black text-indigo-500 tracking-tighter uppercase italic">TX-KERNEL-9X77-BFA0-OS14</code>
                        </div>
                    </div>
                </div>

                {/* 数据主权与迁移 */}
                <div className="col-span-12 space-y-10">
                    <div className="precision-surface rounded-3xl p-10 bg-white/[0.02] border border-white/5">
                        <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                            <HardDrive className="w-5 h-5 text-emerald-500" /> 数据主权与迁移 (Data Governance)
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* JSON Backup Zone */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-slate-400"/> 全量系统快照 (JSON)
                                </h4>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleExportJSON}
                                        className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between"
                                    >
                                        <div className="text-left">
                                            <div className="text-xs font-black text-white uppercase tracking-wider mb-1">Backup</div>
                                            <div className="text-[10px] text-slate-500 font-bold">导出系统完整状态</div>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                    </button>
                                    
                                    <button 
                                        onClick={handleImportClick}
                                        className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between"
                                    >
                                        <div className="text-left">
                                            <div className="text-xs font-black text-white uppercase tracking-wider mb-1">Restore</div>
                                            <div className="text-[10px] text-slate-500 font-bold">恢复系统快照</div>
                                        </div>
                                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                        accept=".json"
                                    />
                                </div>
                            </div>

                            {/* CSV Export Zone */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-slate-400"/> 业务数据导出 (CSV)
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => handleExportCSV('inventory')}
                                        className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all text-center flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Database className="w-4 h-4 text-slate-500 group-hover:text-emerald-400"/>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Inventory</div>
                                    </button>
                                    <button 
                                        onClick={() => handleExportCSV('orders')}
                                        className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all text-center flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <FileText className="w-4 h-4 text-slate-500 group-hover:text-blue-400"/>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Orders</div>
                                    </button>
                                    <button 
                                        onClick={() => handleExportCSV('finance')}
                                        className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-400 transition-all text-center flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Monitor className="w-4 h-4 text-slate-500 group-hover:text-purple-400"/>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Finance</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
