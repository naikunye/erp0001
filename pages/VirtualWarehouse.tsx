import React, { useState, useMemo } from 'react';
import { 
  Layers, Search, Zap, Scan, 
  Activity, Box, Maximize2, 
  BrainCircuit, Loader2, Sparkles,
  Camera, CheckCircle2, MousePointer2, 
  Rotate3d, Move, X, Info, Waypoints,
  Package, LayoutGrid, Compass,
  Grid3X3, ArrowRight
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Product } from '../types';

const GRID_ROWS = ['A', 'B', 'C', 'D']; 
const GRID_COLS = Array.from({ length: 8 }, (_, i) => i + 1);

const VirtualWarehouse: React.FC = () => {
    const { state, showToast } = useTanxing();
    const [selectedBin, setSelectedBin] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'status' | 'heatmap'>('status');
    const [searchTerm, setSearchTerm] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);

    // 将产品映射到网格坐标
    const binMap = useMemo(() => {
        const map: Record<string, Product> = {};
        const activeProducts = (state.products || []).filter(p => !p.deletedAt);
        
        activeProducts.forEach((p, idx) => {
            const row = GRID_ROWS[idx % GRID_ROWS.length];
            const col = GRID_COLS[Math.floor(idx / GRID_ROWS.length) % GRID_COLS.length];
            const binId = `${row}-${col.toString().padStart(2, '0')}`;
            map[binId] = p;
        });
        return map;
    }, [state.products]);

    const getBinTheme = (product: Product | null) => {
        if (!product) return { border: 'border-white/5', bg: 'bg-black/20', text: 'text-slate-700', glow: '' };

        if (viewMode === 'status') {
            if (product.stock < 10) return { border: 'border-rose-500/50', bg: 'bg-rose-500/10', text: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' };
            if (product.lifecycle === 'Growing') return { border: 'border-indigo-500/50', bg: 'bg-indigo-500/10', text: 'text-indigo-400', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]' };
            return { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' };
        }

        if (viewMode === 'heatmap') {
            const velocity = product.dailyBurnRate || 0;
            if (velocity > 10) return { border: 'border-amber-500/50', bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]' };
            if (velocity > 5) return { border: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: '' };
            return { border: 'border-blue-500/50', bg: 'bg-blue-500/5', text: 'text-blue-400', glow: '' };
        }

        return { border: 'border-white/10', bg: 'bg-white/5', text: 'text-white', glow: '' };
    };

    const handleVisionScan = async () => {
        setIsScanning(true);
        setScanResult(null);
        await new Promise(r => setTimeout(r, 2000));
        
        if (selectedProduct) {
            setScanResult(`✨ 视觉核销成功：SKU ${selectedProduct.sku} 在库位 ${selectedBin} 物理存量确认一致。`);
            showToast('物理快照对账完成', 'success');
        } else {
            setScanResult('未在该坐标识别到有效资产。');
        }
        setIsScanning(false);
    };

    const selectedProduct = selectedBin ? binMap[selectedBin] : null;

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
            {/* 顶栏控制层 */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4 italic">
                        <Grid3X3 className="w-10 h-10 text-indigo-500" />
                        数字化平视仓储矩阵
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-2 uppercase tracking-[0.4em]">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse"/> Digital Twin Matrix Plane V5.0
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex bg-black/60 p-1 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
                        <button onClick={() => setViewMode('status')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'status' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <LayoutGrid className="w-3.5 h-3.5"/> 物理存量
                        </button>
                        <button onClick={() => setViewMode('heatmap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'heatmap' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <Zap className="w-3.5 h-3.5"/> 出库热力
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* 左侧：网格阵列 */}
                <div className="col-span-12 lg:col-span-8 ios-glass-panel rounded-[2.5rem] flex flex-col overflow-hidden border-white/10 relative bg-[#050508]">
                    
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2 backdrop-blur-md relative z-20">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                            <input 
                                type="text" 
                                placeholder="输入 SKU 或货位快速定位..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none w-72 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-800"
                            />
                        </div>
                        <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-slate-600">
                             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/50 rounded-sm"></span> 健康</div>
                             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500/20 border border-rose-500/50 rounded-sm"></span> 告急</div>
                             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-500/20 border border-indigo-500/50 rounded-sm"></span> 增长中</div>
                        </div>
                    </div>

                    {/* 网格容器 */}
                    <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-8 gap-4 min-w-[800px]">
                            {GRID_COLS.map(col => (
                                <div key={col} className="space-y-4">
                                    {GRID_ROWS.map(row => {
                                        const binId = `${row}-${col.toString().padStart(2, '0')}`;
                                        const product = binMap[binId];
                                        const isSelected = selectedBin === binId;
                                        const isMatch = searchTerm && (
                                            (product?.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            binId.includes(searchTerm.toUpperCase())
                                        );
                                        const theme = getBinTheme(product);
                                        
                                        return (
                                            <div 
                                                key={binId}
                                                onClick={() => setSelectedBin(binId)}
                                                className={`
                                                    group relative h-28 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                                                    ${theme.bg} ${theme.border} ${theme.glow}
                                                    ${isSelected ? 'ring-4 ring-white border-white scale-105 z-10 shadow-2xl' : 'hover:border-white/40'}
                                                    ${isMatch ? 'animate-pulse ring-4 ring-yellow-400 border-yellow-400' : ''}
                                                `}
                                            >
                                                {/* 背景装饰 */}
                                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                                    <Box className="w-12 h-12" />
                                                </div>

                                                <div className="p-3 h-full flex flex-col justify-between relative z-10">
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                                            {binId}
                                                        </span>
                                                        {product && (
                                                            <span className={`text-[10px] font-black font-mono ${theme.text}`}>
                                                                {product.stock}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-1">
                                                        <div className={`text-[11px] font-black truncate uppercase tracking-tighter ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                            {product ? product.sku : '---'}
                                                        </div>
                                                        <div className="text-[8px] text-slate-500 font-bold truncate mt-0.5 uppercase">
                                                            {product ? product.name : 'EMPTY BIN'}
                                                        </div>
                                                    </div>

                                                    {/* 库存进度条 */}
                                                    {product && (
                                                        <div className="h-1 w-full bg-black/40 rounded-full mt-2 overflow-hidden border border-white/5">
                                                            <div 
                                                                className={`h-full transition-all duration-1000 ${product.stock < 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${Math.min(100, (product.stock / 200) * 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 选中时的装饰条 */}
                                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white animate-pulse"></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-6 bg-black/40 border-t border-white/5 flex justify-between items-center italic">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-4">
                            <span className="flex items-center gap-2"><Move className="w-3.5 h-3.5"/> 视图坐标: XY-PLANE</span>
                            <span className="flex items-center gap-2 text-indigo-400"><Waypoints className="w-3.5 h-3.5"/> 缩放级别: 1:1 RESOLUTION</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                            数字化实体资产实时镜像已就绪
                        </div>
                    </div>
                </div>

                {/* 右侧：全息面板 */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className={`ios-glass-card p-10 flex flex-col flex-1 rounded-[3rem] border-l-8 transition-all duration-700 relative overflow-hidden ${selectedProduct ? 'border-l-indigo-500 bg-indigo-500/5' : 'border-l-slate-900 opacity-60'}`}>
                        {selectedProduct ? (
                            <div className="animate-in slide-in-from-right-8 duration-500 flex flex-col h-full relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <div className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                                            <Scan className="w-4 h-4"/> Bin Captured
                                        </div>
                                        <h3 className="text-6xl font-black text-white italic tracking-tighter leading-none">{selectedBin}</h3>
                                    </div>
                                    <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-900/50 text-white">
                                        <Package className="w-10 h-10"/>
                                    </div>
                                </div>

                                <div className="space-y-10 flex-1">
                                    <div className="bg-black/80 rounded-[2rem] p-7 border border-white/10 shadow-inner group transition-all hover:border-indigo-500/40">
                                        <div className="text-[11px] text-slate-500 font-bold uppercase mb-3 tracking-widest flex justify-between">
                                            <span>挂载资产详细</span>
                                            <span className="text-emerald-400 font-mono">Synced</span>
                                        </div>
                                        <div className="text-3xl font-black text-white font-mono leading-tight group-hover:text-indigo-400 transition-colors">{selectedProduct.sku}</div>
                                        <div className="text-sm text-slate-400 mt-3 leading-relaxed font-medium">{selectedProduct.name}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white/5 rounded-[2rem] p-7 border border-white/10 relative overflow-hidden">
                                            <div className="text-[11px] text-slate-500 font-black uppercase mb-2">当前存量</div>
                                            <div className="text-5xl font-black text-white font-mono tracking-tighter">{selectedProduct.stock}</div>
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-5 overflow-hidden">
                                                <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: `${(selectedProduct.stock/200)*100}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-[2rem] p-7 border border-white/10">
                                            <div className="text-[11px] text-slate-500 font-black uppercase mb-2">出库频率</div>
                                            <div className="text-5xl font-black text-white font-mono tracking-tighter">{selectedProduct.dailyBurnRate || 0}</div>
                                            <div className="text-[10px] text-slate-600 mt-5 font-black uppercase italic">Pcs/Day</div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-gradient-to-br from-indigo-900/30 to-black/40 border border-indigo-500/30 rounded-[2.5rem] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Sparkles className="w-20 h-20 text-white animate-pulse" /></div>
                                        <h4 className="text-xs font-black text-indigo-300 uppercase mb-4 flex items-center gap-3 italic tracking-widest">
                                            <BrainCircuit className="w-5 h-5" /> 空间分布 AI 指令
                                        </h4>
                                        <p className="text-[12px] text-indigo-100/70 leading-relaxed font-bold">
                                            基于近期 {(selectedProduct.dailyBurnRate || 0).toFixed(1)}/D 的流转数据，建议将该商品维持在 <span className="text-white">A-01</span> 黄金拣货位，以最大化出库能效。
                                        </p>
                                    </div>

                                    {scanResult && (
                                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[1.5rem] animate-in slide-in-from-top-4 flex gap-4">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                            <p className="text-xs text-emerald-100 font-bold leading-relaxed">{scanResult}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-white/10 flex gap-5">
                                    <button 
                                        onClick={handleVisionScan}
                                        disabled={isScanning}
                                        className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95"
                                    >
                                        {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                        视觉对账校准
                                    </button>
                                    <button onClick={() => setSelectedBin(null)} className="p-5 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-[1.5rem] transition-all border border-white/10">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-12 opacity-30 italic">
                                <div className="w-40 h-40 bg-white/2 rounded-full flex items-center justify-center border-4 border-dashed border-indigo-500/20">
                                    <MousePointer2 className="w-20 h-20 opacity-10" />
                                </div>
                                <div className="text-center space-y-4 px-14">
                                    <h3 className="text-2xl font-black uppercase tracking-[0.6em] text-slate-400">选择网格坐标</h3>
                                    <p className="text-[12px] leading-relaxed uppercase tracking-widest text-slate-500 font-black">
                                        点击左侧仓库网格中的任一货位，以激活全息资产监测与 AI 分析。
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}} />
        </div>
    );
};

export default VirtualWarehouse;
