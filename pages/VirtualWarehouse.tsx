
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Layers, Search, Zap, Scan, 
  Activity, Box, Maximize2, 
  BrainCircuit, Loader2, Sparkles,
  Camera, CheckCircle2, MousePointer2, 
  Rotate3d, Move, X, Info, Waypoints,
  Package, LayoutGrid, Compass,
  Grid3X3, ArrowRight, Video, CameraOff
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Product } from '../types';
import { GoogleGenAI } from "@google/genai";

const GRID_ROWS = ['A', 'B', 'C', 'D']; 
const GRID_COLS = Array.from({ length: 8 }, (_, i) => i + 1);

const VirtualWarehouse: React.FC = () => {
    const { state, showToast, syncToCloud } = useTanxing();
    const [selectedBin, setSelectedBin] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'status' | 'heatmap'>('status');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isScanning, setIsScanning] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const startCamera = async () => {
        setShowCamera(true);
        setScanResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            showToast('无法访问摄像头设备', 'error');
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
        setShowCamera(false);
    };

    const handleVisionScan = async () => {
        if (!selectedProduct || !videoRef.current || !canvasRef.current) return;
        setIsScanning(true);
        try {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0);
            const base64Image = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `仓库实物核验。库位 ${selectedBin}。应有 SKU: ${selectedProduct.sku} (${selectedProduct.name})，账面 ${selectedProduct.stock}。判断实物是否相符，指出差异。`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/jpeg' } }, { text: prompt }] }
            });

            setScanResult(response.text);
            // 扫描成功后，触发云端心跳备份，记录该时刻状态
            if (state.connectionStatus === 'connected') syncToCloud();
        } catch (err) {
            setScanResult('视觉引擎计算偏差，请重试。');
        } finally {
            setIsScanning(false);
            stopCamera();
        }
    };

    const getBinTheme = (product: Product | null) => {
        if (!product) return { border: 'border-white/5', bg: 'bg-black/20', text: 'text-slate-700', glow: '' };
        if (viewMode === 'status') {
            if (product.stock < 10) return { border: 'border-rose-500/50', bg: 'bg-rose-500/10', text: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' };
            return { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: '' };
        }
        return { border: 'border-white/10', bg: 'bg-white/5', text: 'text-white', glow: '' };
    };

    const selectedProduct = selectedBin ? binMap[selectedBin] : null;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-end shrink-0 px-2">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4 italic">
                        <Grid3X3 className="w-10 h-10 text-indigo-500" /> 全息数字仓库
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-2 uppercase tracking-[0.4em]">
                        {state.connectionStatus === 'connected' ? <Activity className="w-3 h-3 text-emerald-400 animate-pulse"/> : <Info className="w-3 h-3 text-amber-500"/>}
                        {state.connectionStatus === 'connected' ? 'CLOUD MATRIX SYNCED' : 'OFFLINE GRID MODE'}
                    </p>
                </div>
                <div className="flex bg-black/60 p-1 rounded-2xl border border-white/10">
                    <button onClick={() => setViewMode('status')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'status' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>物理存量</button>
                    <button onClick={() => setViewMode('heatmap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'heatmap' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>出库热力</button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-8 ios-glass-panel rounded-[2.5rem] overflow-hidden border-white/10 relative bg-[#050508]">
                    <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-8 gap-4 min-w-[900px] pb-10">
                            {GRID_COLS.map(col => (
                                <div key={col} className="space-y-4">
                                    {GRID_ROWS.map(row => {
                                        const binId = `${row}-${col.toString().padStart(2, '0')}`;
                                        const product = binMap[binId];
                                        const isSelected = selectedBin === binId;
                                        const theme = getBinTheme(product);
                                        return (
                                            <div key={binId} onClick={() => setSelectedBin(binId)} className={`group relative h-24 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${theme.bg} ${theme.border} ${theme.glow} ${isSelected ? 'ring-4 ring-white border-white scale-[1.05] z-10 shadow-2xl' : 'hover:border-white/40'}`}>
                                                <div className="p-3 h-full flex flex-col justify-between relative z-10">
                                                    <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-black/40 ${isSelected ? 'text-white' : 'text-slate-500'}`}>{binId}</span>
                                                    <div className="mt-1">
                                                        <div className="text-[11px] font-black truncate text-slate-200">{product ? product.sku : '---'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-span-4 flex flex-col min-h-0">
                    <div className={`ios-glass-card flex-1 rounded-[3rem] border-l-8 transition-all duration-700 relative overflow-hidden ${selectedProduct ? 'border-l-indigo-500 bg-indigo-500/5' : 'border-l-slate-900 opacity-60'}`}>
                        {selectedProduct ? (
                            <div className="p-10 flex flex-col h-full">
                                <h3 className="text-6xl font-black text-white italic tracking-tighter mb-10">{selectedBin}</h3>
                                <div className="space-y-6 flex-1">
                                    {showCamera ? (
                                        <div className="relative rounded-[2rem] overflow-hidden border border-white/20 aspect-video bg-black">
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                            <canvas ref={canvasRef} className="hidden" />
                                            <button onClick={handleVisionScan} disabled={isScanning} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase">执行对账</button>
                                        </div>
                                    ) : (
                                        <div className="bg-black/60 rounded-[2rem] p-7 border border-white/10">
                                            <div className="text-3xl font-black text-white font-mono">{selectedProduct.sku}</div>
                                            <div className="text-sm text-slate-500 mt-2">{selectedProduct.name}</div>
                                            <div className="mt-8 pt-8 border-t border-white/5 flex justify-between">
                                                <div><div className="text-[10px] text-slate-600 font-black">STOCK</div><div className="text-3xl font-black text-white">{selectedProduct.stock}</div></div>
                                                <div className="text-right"><div className="text-[10px] text-slate-600 font-black">RATE</div><div className="text-3xl font-black text-emerald-400">{selectedProduct.dailyBurnRate || 0}</div></div>
                                            </div>
                                        </div>
                                    )}
                                    {scanResult && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-bold leading-relaxed">{scanResult}</div>}
                                </div>
                                <div className="pt-10 flex gap-4">
                                    {!showCamera ? (
                                        <button onClick={startCamera} className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl">开启视觉核验</button>
                                    ) : (
                                        <button onClick={stopCamera} className="flex-1 py-5 bg-slate-800 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">关闭</button>
                                    )}
                                    <button onClick={() => setSelectedBin(null)} className="p-5 bg-white/5 text-slate-500 rounded-[1.5rem]"><X className="w-6 h-6" /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-800 p-20 text-center">
                                <MousePointer2 className="w-16 h-16 opacity-10 mb-6" />
                                <p className="text-xs font-black uppercase tracking-widest">选择库位激活全息透视</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualWarehouse;
