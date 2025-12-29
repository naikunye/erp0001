
import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, ArrowRight, Command, CornerDownLeft, ShoppingCart, Truck, History, X } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, dispatch } = useTanxing();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => { if(isOpen) inputRef.current?.focus(); }, [isOpen]);

  if (!isOpen) return null;

  // 纯本地高速检索
  const products = query ? (state.products || []).filter(p => !p.deletedAt && (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))).slice(0, 5) : [];
  const orders = query ? (state.orders || []).filter(o => !o.deletedAt && (o.id.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase()))).slice(0, 5) : [];
  const shipments = query ? (state.shipments || []).filter(s => s.trackingNo.toLowerCase().includes(query.toLowerCase()) || s.productName?.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center px-6 py-5 border-b border-white/5 bg-white/2">
          <Search className="w-6 h-6 text-slate-500 mr-4" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-600 text-lg font-bold"
            placeholder="全域资产高速检索 (SKU, 订单, 运单)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="p-1 bg-white/5 rounded-lg text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto p-3 custom-scrollbar">
            {!query ? (
                <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-4">
                    <History className="w-10 h-10 opacity-10" />
                    <p className="text-xs uppercase font-black tracking-widest opacity-40 italic">键入关键词以唤醒全域索引</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {products.length > 0 && (
                        <div>
                            <div className="px-3 py-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">产品库</div>
                            {products.map(p => (
                                <div key={p.id} onClick={() => { dispatch({type:'NAVIGATE', payload:{page:'inventory'}}); setIsOpen(false); }} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-indigo-600/20 cursor-pointer transition-all">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><Package className="w-5 h-5"/></div>
                                    <div className="flex-1 min-w-0"><div className="text-sm text-white font-black font-mono">{p.sku}</div><div className="text-xs text-slate-500 truncate">{p.name}</div></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {orders.length > 0 && (
                        <div>
                            <div className="px-3 py-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">业务单据</div>
                            {orders.map(o => (
                                <div key={o.id} onClick={() => { dispatch({type:'NAVIGATE', payload:{page:'dashboard'}}); setIsOpen(false); }} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-violet-600/20 cursor-pointer transition-all">
                                    <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400"><ShoppingCart className="w-5 h-5"/></div>
                                    <div className="flex-1 min-w-0"><div className="text-sm text-white font-black font-mono">{o.id}</div><div className="text-xs text-slate-500 truncate">{o.customerName}</div></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {products.length === 0 && orders.length === 0 && (
                        <div className="p-10 text-center text-slate-700 italic text-xs">未匹配到任何相关资产节点</div>
                    )}
                </div>
            )}
        </div>
        
        <div className="px-6 py-3 bg-white/2 border-t border-white/5 text-[9px] text-slate-600 flex justify-between items-center font-bold uppercase tracking-widest">
            <span>Tanxing OS Indexer v6.0</span>
            <div className="flex gap-4"><span>ESC 关闭</span><span>ENTER 查看</span></div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
