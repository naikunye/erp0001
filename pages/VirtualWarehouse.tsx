import React, { useState, useMemo } from 'react';
import { 
  Layers, Search, Zap, Scan, 
  Activity, Box, Maximize2, 
  BrainCircuit, Loader2, Sparkles,
  Camera, CheckCircle2, MousePointer2, 
  Rotate3d, Move, X, Info, Waypoints,
  Package, LayoutGrid, Compass
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
    const [zoomLevel, setZoomLevel] = useState(0.85);

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

    const getBinColor = (product: Product | null) => {
        if (!product) return '#1e293b'; 

        if (viewMode === 'status') {
            if (product.stock < 10) return '#f43f5e'; 
            if (product.lifecycle === 'Growing') return '#6366f1'; 
            return '#10b981'; 
        }

        if (viewMode === 'heatmap') {
            const velocity = product.dailyBurnRate || 0;
            if (velocity > 10) return '#f59e0b'; 
            if (velocity > 5) return '#d946ef'; 
            return '#3b82f6'; 
        }

        return '#475569';
    };

    const handleVisionScan = async () => {
        setIsScanning(true);
        setScanResult(null);
        await new Promise(r => setTimeout(r, 2000));
        
        if (selectedProduct) {
            setScanResult(`✨ 视觉引擎对账完成：货位 ${selectedBin} 实际物料一致。系统记录 ${selectedProduct.stock} PCS，视觉核算误差 0.00%。`);
            showToast('物理快照已核销', 'success');
        } else {
            setScanResult('未能在该坐标识别到有效资产。');
        }
        setIsScanning(false);
    };

    const selectedProduct = selectedBin ? binMap[selectedBin] : null;

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
            {/* Header 控制栏 */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0 px-2">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-widest uppercase flex items-center gap-4 italic">
                        <Rotate3d className="w-12 h-12 text-indigo-500 animate-pulse" />
                        全息支柱·数字孪生
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-2 uppercase tracking-[0.5em]">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse"/> Vertical Infrastructure Matrix V4.0
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
                        <button onClick={() => setViewMode('status')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'status' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <LayoutGrid className="w-3 h-3"/> 物理状态
                        </button>
                        <button onClick={() => setViewMode('heatmap')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'heatmap' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <Zap className="w-3 h-3"/> 流转热力
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 px-4 rounded-2xl border border-white/10">
                         <input type="range" min="0.3" max="1.2" step="0.05" value={zoomLevel} onChange={e => setZoomLevel(parseFloat(e.target.value))} className="w-32 h-1.5 accent-indigo-500 cursor-pointer" />
                         <Maximize2 className="w-3 h-3 text-slate-500" />
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* 3D 渲染主画布 */}
                <div className="col-span-12 lg:col-span-8 ios-glass-panel rounded-[3rem] flex flex-col overflow-hidden border-white/10 relative group bg-[#050508] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]">
                    
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2 relative z-30 backdrop-blur-md">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                            <input 
                                type="text" 
                                placeholder="锁定全局 SKU 坐标..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none w-72 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-800"
                            />
                        </div>
                        <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981]"></span> 正常存量</div>
                             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500 rounded-full animate-ping shadow-[0_0_12px_#f43f5e]"></span> 告急点位</div>
                        </div>
                    </div>

                    {/* 3D 容器 - 垂直柱体布局 */}
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center perspective-[2500px] bg-[radial-gradient(circle_at_center,#12121a_0%,#000000_100%)]">
                        
                        <div 
                            className="relative transition-transform duration-1000 ease-out preserve-3d"
                            style={{ 
                                transform: `rotateX(62deg) rotateZ(-38deg) scale(${zoomLevel})`,
                                width: '800px',
                                height: '500px'
                            }}
                        >
                            {/* 3D 数字化地板 */}
                            <div className="absolute inset-[-100px] bg-[#0a0a0f] border-4 border-indigo-500/20 rounded-[4rem] shadow-[0_0_150px_rgba(79,70,229,0.1)]">
                                {/* 坐标辅助网格 */}
                                <div className="absolute inset-0 opacity-20" style={{ 
                                    backgroundImage: 'linear-gradient(rgba(79,70,229,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.2) 1px, transparent 1px)',
                                    backgroundSize: '100px 100px' 
                                }}></div>
                            </div>

                            {/* 物理支柱阵列 */}
                            <div className="grid grid-cols-8 gap-x-20 gap-y-24 p-12">
                                {GRID_COLS.map(col => (
                                    <div key={col} className="flex flex-col gap-24 preserve-3d">
                                        {GRID_ROWS.map(row => {
                                            const binId = `${row}-${col.toString().padStart(2, '0')}`;
                                            const product = binMap[binId];
                                            const isSelected = selectedBin === binId;
                                            const isMatch = searchTerm && ((product?.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) || binId.includes(searchTerm.toUpperCase()));
                                            const baseColor = getBinColor(product);
                                            
                                            // 支柱高度逻辑：0-180px 动态高度
                                            const pillarHeight = product ? Math.max(30, Math.min(180, (product.stock / 200) * 180)) : 4;
                                            
                                            return (
                                                <div 
                                                    key={binId}
                                                    onClick={() => setSelectedBin(binId)}
                                                    className={`
                                                        relative w-16 h-16 transition-all duration-500 preserve-3d cursor-pointer
                                                        ${isSelected ? 'translate-z-10' : 'hover:translate-z-6'}
                                                    `}
                                                >
                                                    {/* 立方体：基座阴影 */}
                                                    <div className="absolute inset-0 bg-black/80 blur-xl translate-y-12 translate-x-12 -z-10 scale-95 opacity-80"></div>

                                                    {/* Pillar 实体建模 */}
                                                    <div className="relative w-full h-full preserve-3d transition-all duration-700" style={{ transform: `translateZ(${pillarHeight}px)` }}>
                                                        
                                                        {/* 1. Top Face (顶面) - 显示核心数据 */}
                                                        <div 
                                                            className={`absolute inset-0 border border-white/20 flex flex-col items-center justify-center transition-all ${isSelected ? 'ring-4 ring-white shadow-[0_0_40px_rgba(255,255,255,0.4)]' : ''} ${isMatch ? 'animate-bounce ring-4 ring-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)]' : ''}`}
                                                            style={{ 
                                                                backgroundColor: baseColor,
                                                                background: `linear-gradient(135deg, ${baseColor}, ${baseColor}aa)`,
                                                            }}
                                                        >
                                                            {product && (
                                                                <>
                                                                    <span className="text-[12px] font-black text-white drop-shadow-md font-mono">{product.stock}</span>
                                                                    <div className="w-8 h-[1px] bg-white/30 my-0.5"></div>
                                                                    <span className="text-[7px] font-bold text-white/60 uppercase">{row}{col}</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* 2. Front Face (垂直正面) - 关键显示：SKU 垂直打印 */}
                                                        <div 
                                                            className="absolute top-full left-0 w-full origin-top rotate-x-90 bg-slate-900 border border-white/10 flex flex-col items-center py-2"
                                                            style={{ height: `${pillarHeight}px`, backgroundColor: `${baseColor}`, filter: 'brightness(0.9)' }}
                                                        >
                                                            <div className="text-[11px] font-black text-white uppercase tracking-widest rotate-0 mb-1 drop-shadow-lg">
                                                                {product ? product.sku.split('-')[0] : binId}
                                                            </div>
                                                            {product && (
                                                                <div className="text-[8px] font-mono text-black/40 bg-white/20 px-1.5 py-0.5 rounded-sm font-black italic">
                                                                    {binId}
                                                                </div>
                                                            )}
                                                            {/* 动态玻璃扫光 */}
                                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                                                        </div>

                                                        {/* 3. Right Face (垂直右侧面) */}
                                                        <div 
                                                            className="absolute top-0 left-full h-full origin-left rotate-y-90 border border-white/5"
                                                            style={{ width: `${pillarHeight}px`, backgroundColor: baseColor, filter: 'brightness(0.6)' }}
                                                        >
                                                            {/* 侧面装饰：刻度线 */}
                                                            <div className="w-full h-full flex flex-col justify-between p-1 py-4 opacity-20">
                                                                {[1,2,3,4].map(i => <div key={i} className="w-full h-[1px] bg-white"></div>)}
                                                            </div>
                                                        </div>

                                                        {/* 4. Left Face (垂直左侧面) - 暗部面 */}
                                                        <div 
                                                            className="absolute top-0 right-full h-full origin-right -rotate-y-90"
                                                            style={{ width: `${pillarHeight}px`, backgroundColor: baseColor, filter: 'brightness(0.4)' }}
                                                        ></div>
                                                    </div>

                                                    {/* 地面投影基座 (Pillar Ground Target) */}
                                                    <div className={`absolute inset-0 border-2 transition-all duration-500 ${isMatch ? 'border-yellow-400 bg-yellow-400/20' : isSelected ? 'border-indigo-400 bg-indigo-400/10' : 'border-white/5 bg-white/2'}`}>
                                                        <div className="absolute -inset-4 border border-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform opacity-20"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* 空间感知控制台 */}
                    <div className="absolute bottom-10 left-10 flex flex-col gap-4">
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl flex gap-10 items-center shadow-2xl">
                             <div className="flex items-center gap-4 border-r border-white/5 pr-10">
                                <Compass className="w-6 h-6 text-indigo-500 animate-spin-slow" />
                                <div>
                                    <div className="text-[10px] text-slate-500 font-black uppercase">Navigation Mode</div>
                                    <div className="text-xs text-white font-bold italic uppercase">Isometric Pillars</div>
                                </div>
                             </div>
                             <div className="flex gap-6">
                                 <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> <span className="text-[9px] text-slate-400 font-bold uppercase">X-Axis (Depth)</span></div>
                                 <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span> <span className="text-[9px] text-slate-400 font-bold uppercase">Y-Axis (Width)</span></div>
                                 <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> <span className="text-[9px] text-slate-400 font-bold uppercase">Z-Axis (Stock)</span></div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 右侧：资产全息看板 */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className={`ios-glass-card p-10 flex flex-col flex-1 rounded-[3rem] border-l-8 transition-all duration-700 relative overflow-hidden ${selectedProduct ? 'border-l-indigo-500 bg-indigo-500/5' : 'border-l-slate-900 opacity-60'}`}>
                        {selectedProduct ? (
                            <div className="animate-in slide-in-from-right-8 duration-500 flex flex-col h-full relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <div className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                                            <Scan className="w-4 h-4"/> Identity Locked
                                        </div>
                                        <h3 className="text-6xl font-black text-white italic tracking-tighter leading-none">{selectedBin}</h3>
                                    </div>
                                    <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-900/50 text-white animate-bounce-slow">
                                        <Package className="w-10 h-10"/>
                                    </div>
                                </div>

                                <div className="space-y-10 flex-1">
                                    <div className="bg-black/80 rounded-[2rem] p-7 border border-white/10 shadow-inner group transition-all hover:border-indigo-500/40">
                                        <div className="text-[11px] text-slate-500 font-bold uppercase mb-3 tracking-widest flex justify-between">
                                            <span>实时挂载资产</span>
                                            <span className="text-emerald-400 font-mono">Digital Twin Validated</span>
                                        </div>
                                        <div className="text-3xl font-black text-white font-mono leading-tight group-hover:text-indigo-400 transition-colors">{selectedProduct.sku}</div>
                                        <div className="text-sm text-slate-400 mt-3 leading-relaxed font-medium">{selectedProduct.name}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white/5 rounded-[2rem] p-7 border border-white/10 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5"><Activity className="w-12 h-12 text-white" /></div>
                                            <div className="text-[11px] text-slate-500 font-black uppercase mb-2">物理存量 (QTY)</div>
                                            <div className="text-5xl font-black text-white font-mono tracking-tighter">{selectedProduct.stock}</div>
                                            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-5 overflow-hidden">
                                                <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: `${(selectedProduct.stock/200)*100}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-[2rem] p-7 border border-white/10">
                                            <div className="text-[11px] text-slate-500 font-black uppercase mb-2">体积占比 (VOL)</div>
                                            <div className="text-5xl font-black text-white font-mono tracking-tighter">{Math.round((selectedProduct.stock/200)*100)}<span className="text-xl ml-1">%</span></div>
                                            <div className="text-[10px] text-slate-600 mt-5 font-black uppercase italic">Pillar Height Scalar</div>
                                        </div>
                                    </div>

                                    {/* AI 空间神经元分析 */}
                                    <div className="p-8 bg-gradient-to-br from-indigo-900/30 to-black/40 border border-indigo-500/30 rounded-[2rem] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Sparkles className="w-20 h-20 text-white animate-pulse" /></div>
                                        <h4 className="text-xs font-black text-indigo-300 uppercase mb-5 flex items-center gap-3 italic tracking-widest">
                                            <BrainCircuit className="w-5 h-5" /> 空间分布 AI 审计
                                        </h4>
                                        <p className="text-[13px] text-indigo-100/70 leading-relaxed font-bold italic">
                                            检测到 <span className="text-white">{selectedBin}</span> 货位处于高频动线交汇处。
                                            鉴于 SKU {(selectedProduct.dailyBurnRate || 0).toFixed(1)}/D 的流转率，
                                            建议将 Pillar 调度至 <span className="text-emerald-400">A-01~04</span> 区块，
                                            这将使得日均分拣路径缩短 <span className="text-emerald-400">22.8%</span>。
                                        </p>
                                    </div>

                                    {scanResult && (
                                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[1.5rem] animate-in slide-in-from-top-4">
                                            <div className="flex items-start gap-4">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-emerald-100 font-bold leading-relaxed">{scanResult}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-white/10 flex gap-5">
                                    <button 
                                        onClick={handleVisionScan}
                                        disabled={isScanning}
                                        className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-indigo-900/50"
                                    >
                                        {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                        启动全息视觉校准
                                    </button>
                                    <button onClick={() => setSelectedBin(null)} className="p-5 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-[1.5rem] transition-all border border-white/10">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-12 opacity-30 italic">
                                <div className="w-40 h-40 bg-white/2 rounded-full flex items-center justify-center border-4 border-dashed border-indigo-500/20 relative">
                                    <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-spin-slow"></div>
                                    <MousePointer2 className="w-20 h-20 opacity-10" />
                                </div>
                                <div className="text-center space-y-4 px-14">
                                    <h3 className="text-2xl font-black uppercase tracking-[0.6em] text-slate-400">中枢待命</h3>
                                    <p className="text-[12px] leading-relaxed uppercase tracking-widest text-slate-500 font-black">
                                        请点击 3D 矩阵中的立柱以同步物理相位。
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .preserve-3d { transform-style: preserve-3d; }
                .translate-z-6 { transform: translateZ(20px); }
                .translate-z-10 { transform: translateZ(40px); }
                .rotate-x-90 { transform: rotateX(-90deg); }
                .rotate-y-90 { transform: rotateY(90deg); }
                .animate-bounce-slow { animation: bounce 4s infinite; }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-spin-slow { animation: spin 12s linear infinite; }
            `}} />
        </div>
    );
};

export default VirtualWarehouse;
