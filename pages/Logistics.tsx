import React, { useState } from 'react';
import { 
    Compass, Search, MapPin, Truck, 
    ArrowRight, Globe, Zap, ExternalLink, Package,
    Activity, ShieldAlert, CheckCircle2, ChevronRight,
    Navigation, Radio
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Shipment } from '../types';

const Logistics: React.FC = () => {
    const { state } = useTanxing();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(state.shipments[0]?.id || null);

    const shipments: Shipment[] = state.shipments || [];
    const selectedShipment = shipments.find(s => s.id === selectedId) || null;

    const filtered = shipments.filter(s => 
        (s.trackingNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'InTransit': return 'text-apple-blue bg-apple-blue/10 border-apple-blue/30';
            case 'Delivered': return 'text-apple-green bg-apple-green/10 border-apple-green/30';
            case 'Exception': return 'text-apple-red bg-apple-red/10 border-apple-red/30 animate-pulse';
            default: return 'text-white/30 bg-white/5 border-white/10';
        }
    };

    return (
        <div className="flex h-full gap-10 animate-in fade-in duration-1000 overflow-hidden pb-4">
            
            {/* Left Column: Physical Node List */}
            <div className="w-[450px] flex flex-col gap-8 shrink-0 spring-in">
                <div className="flex justify-between items-end px-2">
                    <div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">物理节点</h2>
                        <span className="text-[11px] font-mono text-white/20 font-black uppercase tracking-[0.4em]">{filtered.length} Active Nodes</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-apple-blue">
                        <Navigation className="w-6 h-6" />
                    </div>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-apple-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="检索物流单据或 SKU..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 apple-vibrancy-regular squircle-lg text-base text-white focus:ring-2 focus:ring-apple-blue/40 outline-none transition-all"
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4">
                    {filtered.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => setSelectedId(s.id)}
                            className={`p-8 squircle-lg border-[3px] transition-all cursor-pointer group relative overflow-hidden ${selectedId === s.id ? 'apple-vibrancy-regular border-apple-blue shadow-[0_30px_60px_rgba(0,122,255,0.2)]' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                        >
                            {selectedId === s.id && (
                                <div className="absolute top-0 left-0 w-2 h-full bg-apple-blue shadow-[0_0_30px_#007AFF]"></div>
                            )}
                            <div className="flex justify-between items-start mb-6">
                                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border-2 uppercase tracking-widest ${getStatusTheme(s.status)}`}>
                                    {s.status}
                                </span>
                                <span className="text-[11px] font-black text-white/20 italic tracking-widest uppercase">{s.carrier}</span>
                            </div>
                            <div className="text-white font-black text-2xl tracking-tightest mb-3 group-hover:text-apple-blue transition-colors uppercase italic truncate">{s.productName}</div>
                            <div className="text-[11px] text-white/30 font-mono tracking-[0.2em]">{s.trackingNo}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Spatial Tracking & Map Visualization */}
            <div className="flex-1 flex flex-col min-w-0 spring-in" style={{ animationDelay: '200ms' }}>
                {selectedShipment ? (
                    <div className="h-full flex flex-col gap-10">
                        
                        {/* Spatial Map Header */}
                        <div className="apple-vibrancy-regular p-16 squircle-xl relative overflow-hidden border-white/10 shadow-2xl">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.04] group-hover:rotate-12 transition-transform duration-[5000ms]">
                                <Globe className="w-[500px] h-[500px] text-white" />
                            </div>
                            
                            <div className="relative z-10 flex justify-between items-start mb-24">
                                <div>
                                    <h3 className="text-7xl font-black text-white font-mono tracking-tightest italic leading-none">{selectedShipment.trackingNo}</h3>
                                    <div className="flex items-center gap-8 mt-6">
                                        <div className="flex items-center gap-3 px-5 py-2 bg-apple-blue/10 border border-apple-blue/30 rounded-full">
                                            <Package className="w-5 h-5 text-apple-blue"/>
                                            <span className="text-[12px] font-black text-apple-blue uppercase tracking-widest">SKU: {selectedShipment.sku || 'AWAITING'}</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Radio className="w-4 h-4 text-apple-green animate-pulse" /> Last Check-in: {selectedShipment.lastUpdateAt}
                                        </span>
                                    </div>
                                </div>
                                <button className="p-6 apple-platter rounded-[2rem] text-white/40 hover:text-white transition-all hover:bg-white/10 active:scale-90">
                                    <ExternalLink className="w-8 h-8" />
                                </button>
                            </div>

                            {/* Node Timeline Visual - The High-End Part */}
                            <div className="mt-12 flex items-center justify-between relative px-32">
                                <div className="absolute top-1/2 left-32 right-32 h-[2px] bg-white/5 -translate-y-1/2"></div>
                                <div className="absolute top-1/2 left-32 w-1/2 h-[3px] bg-apple-blue -translate-y-1/2 shadow-[0_0_40px_#007AFF]"></div>
                                
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-apple-blue border-8 border-black flex items-center justify-center text-white shadow-2xl shadow-apple-blue/30 ring-8 ring-apple-blue/5">
                                        <MapPin className="w-8 h-8" />
                                    </div>
                                    <span className="text-[12px] font-black text-white mt-6 uppercase tracking-[0.3em] italic">{selectedShipment.origin}</span>
                                </div>

                                <div className="relative z-10 flex flex-col items-center translate-y-[-20px]">
                                    <div className="w-20 h-20 rounded-full bg-black border-4 border-white/10 flex items-center justify-center text-white/20 shadow-2xl relative">
                                        <div className="absolute inset-0 bg-apple-blue/20 rounded-full animate-ping opacity-40"></div>
                                        <Activity className="w-8 h-8 animate-pulse text-apple-blue relative z-10" />
                                    </div>
                                    <span className="text-[11px] font-black text-apple-blue mt-6 uppercase tracking-[0.4em] italic">节点跳变中...</span>
                                </div>

                                <div className="relative z-10 flex flex-col items-center opacity-30">
                                    <div className="w-16 h-16 rounded-full bg-black border-4 border-white/5 flex items-center justify-center text-white/5">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <span className="text-[12px] font-black text-white/20 mt-6 uppercase tracking-[0.3em] italic">{selectedShipment.destination}</span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Audit Logs Layer */}
                        <div className="flex-1 apple-vibrancy-regular squircle-xl p-16 overflow-hidden flex flex-col border-white/10 shadow-2xl">
                            <h4 className="text-[13px] font-black text-white/30 uppercase tracking-[0.6em] mb-16 flex items-center gap-5 italic">
                                <Zap className="w-6 h-6 text-apple-blue" /> Physical Lineage Audit Records
                            </h4>
                            <div className="flex-1 overflow-y-auto space-y-12 custom-scrollbar pr-6">
                                {selectedShipment.events.map((event, idx) => (
                                    <div key={idx} className="flex gap-12 relative group spring-in" style={{ animationDelay: `${idx * 150}ms` }}>
                                        {idx !== selectedShipment.events.length - 1 && (
                                            <div className="absolute left-[31px] top-16 bottom-[-48px] w-px bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]"></div>
                                        )}
                                        <div className={`w-16 h-16 squircle-md flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${idx === 0 ? 'bg-apple-blue border-white/30 shadow-[0_15px_30px_#007AFF55] text-white scale-110' : 'bg-black border-white/5 text-white/20 hover:border-white/20'}`}>
                                            {event.status === 'Exception' ? <ShieldAlert className="w-8 h-8 text-apple-red" /> : <ArrowRight className="w-8 h-8" />}
                                        </div>
                                        <div className="pt-2 min-w-0 flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-white font-black text-2xl italic tracking-tight uppercase">{event.location}</span>
                                                <span className="text-[11px] font-mono text-white/20 font-black tracking-[0.2em]">{event.date} {event.time}</span>
                                            </div>
                                            <p className={`text-lg leading-relaxed ${idx === 0 ? 'text-apple-blue font-bold italic' : 'text-white/40 font-medium'}`}>{event.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full apple-vibrancy-regular squircle-xl flex flex-col items-center justify-center text-white/5 border-white/10">
                        <Compass className="w-48 h-48 opacity-10 mb-12 animate-spin-slow" />
                        <p className="text-[13px] font-black uppercase tracking-[1em] italic text-white/10">Quantum Terminal Awaiting Input</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logistics;