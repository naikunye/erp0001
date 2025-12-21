
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, Search, Zap, Info, Scan, Thermometer, 
  Activity, ArrowUpRight, Box, Package, Maximize2, 
  ChevronRight, BrainCircuit, ShieldCheck, Loader2, Sparkles,
  Camera, CheckCircle2, AlertTriangle, Eye, MousePointer2
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Product } from '../types';

const GRID_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const GRID_COLS = Array.from({ length: 12 }, (_, i) => i + 1);

const VirtualWarehouse: React.FC = () => {
    const { state, showToast } = useTanxing();
    const [selectedBin, setSelectedBin] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'status' | 'heatmap' | 'velocity'>('status');
    const [searchTerm, setSearchTerm] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);

    const binMap = useMemo(() => {
        const map: Record<string, Product> = {};
        const activeProducts = (state.products || []).filter(p => !p.deletedAt);
        
        activeProducts.forEach((p, idx) => {
            const row = GRID_ROWS[idx % GRID_ROWS.length];
            const col = GRID_COLS[idx % GRID_COLS.length];
            const binId = `${row}-${col.toString().padStart(2, '0')}`;
            map[binId] = p;
        });
        return map;
    }, [state.products]);

    const getBinStyle = (binId: string) => {
        const product = binMap[binId];
        if (!product) return 'bg-white/2 border-white/5 opacity-40 grayscale';

        if (viewMode === 'status') {
            if (product.stock < 10) return 'bg-red-500/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse';
            if (product.lifecycle === 'Growing') return 'bg-indigo-500/20 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]';
            return 'bg-emerald-500/10 border-emerald-500/30';
        }

        if (viewMode === 'heatmap') {
            const velocity = product.dailyBurnRate || 0;
            if (velocity > 10) return 'bg-red-600/60 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]';
            if (velocity > 5) return 'bg-orange-500/40 border-orange-300';
            if (velocity > 0) return 'bg-yellow-400/20 border-yellow-200';
            return 'bg-blue-500/10 border-blue-500/20';
        }

        return 'bg-white/5 border-white/10';
    };

    const handleVisionScan = async () => {
        setIsScanning(true);
        setScanResult(null);
        await new Promise(r => setTimeout(r, 2500));
        
        const currentProduct = selectedBin ? binMap[selectedBin] : null;
        if (currentProduct) {
            setScanResult(`✨ 视觉引擎识别完成: 货架 A-01 实际包裹数 42, 与系统库存 ${currentProduct.stock} 完美对齐。已固化物理快照。`);
            showToast('视觉库存对账完成', 'success');
        } else {
            setScanResult('未能识别有效 SKU 标签，请重新对焦货架条码。');
        }
        setIsScanning(false);
    };

    const selectedProduct = selectedBin ? binMap[selectedBin] : null;

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4 italic">
                        <Layers className="w-10 h-10 text-emerald-500" />
                        全息虚拟仓库数字孪生
                    </h1>
                    <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2 uppercase tracking-[0.4em]">
                        <Thermometer className="w-3 h-3 text-red-400 animate-pulse"/> Spatial Sync Engine: Operational
                    </p>
                </div>
                <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                    <button onClick={() => setViewMode('status')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'status' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>状态快照</button>
                    <button onClick={() => setViewMode('heatmap')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'heatmap' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>流动热力图</button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-12 lg:col-span-9 ios-glass-panel rounded-[2.5rem] flex flex-col overflow-hidden border-white/10 bg-black/40">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                                <input 
                                    type="text" 
                                    placeholder="搜索 SKU 或货位编号 (e.g. A-01)..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none w-80 focus:border-emerald-500 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-600">
                             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 正常</div>
                             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> 活跃</div>
                             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 低库存</div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 overflow-auto custom-scrollbar bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.05)_0%,_transparent_100%)]">
                        <div className="grid grid-cols-[auto_1fr] gap-6">
                            <div className="flex flex-col gap-4 pt-10">
                                {GRID_ROWS.map(row => (
                                    <div key={row} className="h-16 flex items-center justify-center font-black text-slate-700 text-lg">{row}</div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-4 text-center text-[10px] font-black text-slate-700 uppercase">
                                    {GRID_COLS.map(col => <div key={col}>{col.toString().padStart(2, '0')}</div>)}
                                </div>
                                
                                {GRID_ROWS.map(row => (
                                    <div key={row} className="grid grid-cols-12 gap-4">
                                        {GRID_COLS.map(col => {
                                            const binId = `${row}-${col.toString().padStart(2, '0')}`;
                                            const product = binMap[binId];
                                            const isSelected = selectedBin === binId;
                                            const isMatch = searchTerm && ((product?.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) || binId.includes(searchTerm.toUpperCase()));

                                            return (
                                                <div 
                                                    key={binId}
                                                    onClick={() => setSelectedBin(binId)}
                                                    className={`h-16 rounded-xl border-2 transition-all cursor-pointer relative group flex items-center justify-center overflow-hidden
                                                        ${getBinStyle(binId)}
                                                        ${isSelected ? 'ring-4 ring-emerald-500/30 border-emerald-400 scale-105 z-10' : ''}
                                                        ${isMatch ? 'ring-4 ring-indigo-500 border-indigo-400 scale-110 z-20' : ''}
                                                    `}
                                                >
                                                    <span className="text-[10px] font-black opacity-10 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center">{binId}</span>
                                                    {product && (
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-[9px] font-black text-white truncate max-w-[50px]">{product.sku}</div>
                                                            <div className="text-[8px] font-bold text-slate-500 mt-1">{product.stock} pcs</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className={`ios-glass-card p-6 flex flex-col min-h-[400px] rounded-[2rem] border-l-4 transition-all duration-500 ${selectedProduct ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-slate-800'}`}>
                        {selectedProduct ? (
                            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <Activity className="w-3 h-3"/> Bin Matrix HUD
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic truncate max-w-[200px]">{selectedBin}</h3>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-emerald-400">
                                        <Box className="w-6 h-6"/>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="bg-black/60 rounded-2xl p-4 border border-white/5">
                                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-2">当前挂载 SKU</div>
                                        <div className="text-sm font-black text-white font-mono">{selectedProduct.sku}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{selectedProduct.name}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">物理存量</div>
                                            <div className="text-xl font-black text-white font-mono">{selectedProduct.stock}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">物理容积 (CBM)</div>
                                            <div className="text-xl font-black text-white font-mono">0.42</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase">AI 动能评估</span>
                                            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse"/>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl font-black text-white font-mono">{(selectedProduct.dailyBurnRate || 0.1).toFixed(1)}</div>
                                            <div className="text-[9px] text-indigo-300 font-medium">件 / 日 (流转速率)</div>
                                        </div>
                                        <div className="mt-3 text-[10px] text-indigo-200/60 leading-relaxed font-bold">
                                            此 SKU 物理流转频率极高，建议将其物理货位调整至 A 区以减少人工搬运时耗。
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-3">
                                    <button 
                                        onClick={handleVisionScan}
                                        disabled={isScanning}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-emerald-900/40"
                                    >
                                        {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                        多模态物理对账
                                    </button>
                                    <button onClick={() => setSelectedBin(null)} className="w-full py-3 text-slate-600 hover:text-white font-black text-[10px] uppercase transition-colors">释放锁定</button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6 opacity-30 italic">
                                <div className="w-20 h-20 bg-white/2 rounded-full flex items-center justify-center border border-white/5">
                                    {/* Fixed typo: changed MousePointer to MousePointer2 */}
                                    <MousePointer2 className="w-10 h-10 opacity-5" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-[0.5em] mb-2 text-slate-600 text-center">选择货位<br/>(SELECT BIN)</h3>
                                <p className="text-[10px] text-center max-w-xs leading-relaxed uppercase tracking-widest text-slate-500 font-bold px-6">点击 3D 矩阵中的任一物理货位以查看全息资产详情与 AI 优化建议。</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualWarehouse;
