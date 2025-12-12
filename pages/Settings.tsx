
import React, { useState, useEffect, useMemo } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Trash2, RotateCcw, Palette, Smartphone, Zap, Moon, Package, ShoppingCart, Loader2, RotateCcw as ResetIcon, UploadCloud, DownloadCloud, Server, Radio, BarChart4, X } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Theme } from '../context/TanxingContext';

// --- Sub-Component: Recycle Bin ---
const RecycleBin = () => {
    const { state, dispatch, showToast } = useTanxing();
    const [filter, setFilter] = useState<'all' | 'product' | 'order'>('all');

    // Aggregate deleted items
    const deletedItems = useMemo(() => {
        const deletedProducts = state.products
            .filter(p => p.deletedAt)
            .map(p => ({ ...p, type: 'product' as const, originalId: p.id }));
        
        const deletedOrders = state.orders
            .filter(o => o.deletedAt)
            .map(o => ({ ...o, type: 'order' as const, originalId: o.id, name: `Order ${o.id}` })); // Normalize name

        let all = [...deletedProducts, ...deletedOrders].sort((a, b) => 
            new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
        );

        if (filter !== 'all') {
            all = all.filter(item => item.type === filter);
        }
        return all;
    }, [state.products, state.orders, filter]);

    const handleRestore = (item: any) => {
        if (item.type === 'product') {
            dispatch({ type: 'RESTORE_PRODUCT', payload: item.originalId });
        } else {
            dispatch({ type: 'RESTORE_ORDER', payload: item.originalId });
        }
        showToast('数据已还原', 'success');
    };

    const handlePermanentDelete = (item: any) => {
        if (confirm('确定要彻底删除吗？此操作无法撤销。')) {
            if (item.type === 'product') {
                dispatch({ type: 'PERMANENT_DELETE_PRODUCT', payload: item.originalId });
            } else {
                dispatch({ type: 'PERMANENT_DELETE_ORDER', payload: item.originalId });
            }
            showToast('数据已彻底清除', 'info');
        }
    };

    const handleEmptyTrash = () => {
        if (confirm('确定清空回收站吗？所有数据将永久丢失。')) {
            deletedItems.forEach(item => {
                if (item.type === 'product') dispatch({ type: 'PERMANENT_DELETE_PRODUCT', payload: item.originalId });
                else dispatch({ type: 'PERMANENT_DELETE_ORDER', payload: item.originalId });
            });
            showToast('回收站已清空', 'success');
        }
    };

    return (
        <div className="flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>全部 ({deletedItems.length})</button>
                    <button onClick={() => setFilter('product')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'product' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>商品</button>
                    <button onClick={() => setFilter('order')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'order' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}>订单</button>
                </div>
                {deletedItems.length > 0 && (
                    <button onClick={handleEmptyTrash} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded border border-red-500/20 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> 清空回收站
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-black/20 rounded-xl border border-white/5 p-2 space-y-2">
                {deletedItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <Trash2 className="w-12 h-12 mb-3" />
                        <p>回收站是空的</p>
                    </div>
                ) : (
                    deletedItems.map((item: any) => (
                        <div key={`${item.type}-${item.originalId}`} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'product' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    {item.type === 'product' ? <Package className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-200">{item.name || item.originalId}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                        <span>删除于: {new Date(item.deletedAt).toLocaleString()}</span>
                                        <span className="px-1.5 py-0.5 bg-black/40 rounded border border-white/5 uppercase">{item.type}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleRestore(item)} className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors" title="还原">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button onClick={() => handlePermanentDelete(item)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="彻底删除">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
  const { state, dispatch, showToast, syncToCloud, pullFromCloud } = useTanxing();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'cloud' | 'integrations' | 'recycle'>('theme');

  // General Settings State
  const [generalForm, setGeneralForm] = useState({
      storeName: 'Tanxing Global Store',
      currency: 'USD',
      timezone: 'Asia/Shanghai',
      apiKey: '',
      apiUrl: 'https://api.tanxing.com/v1',
      notifications: true
  });
  
  // Cloud (Supabase) State
  const [supabaseForm, setSupabaseForm] = useState({
      url: state.supabaseConfig.url || '',
      key: state.supabaseConfig.key || ''
  });

  // EchoTik State
  const [echotikForm, setEchotikForm] = useState({
      username: state.echotikConfig?.username || '',
      password: state.echotikConfig?.password || '',
      region: state.echotikConfig?.region || 'US'
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showKey, setShowKey] = useState(false);
  const [showEchoTikPass, setShowEchoTikPass] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Handlers ---
  const handleThemeChange = (theme: Theme) => dispatch({ type: 'SET_THEME', payload: theme });

  const handleGeneralSave = () => {
      setTimeout(() => showToast('系统设置已保存', 'success'), 500);
  };

  const handleSupabaseSave = () => {
      dispatch({ type: 'SET_SUPABASE_CONFIG', payload: supabaseForm });
      showToast('云端配置已更新', 'success');
  };

  const handleEchotikSave = () => {
      dispatch({ type: 'SET_ECHOTIK_CONFIG', payload: echotikForm as any });
      showToast('EchoTik API 配置已更新', 'success');
  };

  const handleTestConnection = () => {
      setIsTestingConnection(true);
      setConnectionStatus('idle');
      setTimeout(() => {
          setIsTestingConnection(false);
          setConnectionStatus('success');
          showToast('API 连接测试成功', 'success');
      }, 1500);
  };

  const handleSyncPush = async () => {
      setIsSyncing(true);
      await syncToCloud();
      setIsSyncing(false);
  };

  const handleSyncPull = async () => {
      setIsSyncing(true);
      await pullFromCloud();
      setIsSyncing(false);
  };

  const handleResetData = () => {
      if (confirm("⚠️ 警告：这将清空所有本地缓存数据并恢复为演示初始状态。确定继续吗？")) {
          dispatch({ type: 'RESET_DATA' });
          showToast("系统数据已重置", 'success');
          setTimeout(() => window.location.reload(), 500);
      }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-slate-400" />
                系统设置 (System Settings)
            </h2>
            <p className="text-sm text-slate-500 mt-1">个性化与全局参数配置</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto">
          {[
              { id: 'theme', icon: Palette, label: '界面主题' },
              { id: 'general', icon: Globe, label: '常规配置' },
              { id: 'cloud', icon: Cloud, label: '云端同步' },
              { id: 'integrations', icon: BarChart4, label: 'EchoTik 集成' },
              { id: 'recycle', icon: Trash2, label: '数据回收站' }
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-500 text-white bg-white/5 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                  <tab.icon className="w-4 h-4"/> {tab.label}
              </button>
          ))}
      </div>

      {/* THEME TAB */}
      {activeTab === 'theme' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Option 1: iOS Dark */}
              <div onClick={() => handleThemeChange('ios')} className={`cursor-pointer rounded-xl border-2 p-1 transition-all hover:scale-[1.02] ${state.theme === 'ios' ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-white/10 opacity-70 hover:opacity-100'}`}>
                  <div className="bg-[#000] rounded-lg p-6 h-48 flex flex-col justify-center items-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1c1c1e_0%,#000000_100%)]"></div>
                      <div className="w-20 h-20 rounded-full bg-blue-600 blur-[40px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40"></div>
                      <div className="relative z-10 text-center">
                          <Smartphone className="w-10 h-10 text-white mx-auto mb-3" />
                          <h3 className="text-white font-bold text-lg">Cupertino Dark</h3>
                          <p className="text-xs text-slate-400 mt-2">iOS 风格，极致磨砂黑与高斯模糊</p>
                      </div>
                      {state.theme === 'ios' && <div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 className="w-5 h-5 fill-current text-black"/></div>}
                  </div>
              </div>
              {/* Option 2: Cyberpunk */}
              <div onClick={() => handleThemeChange('cyber')} className={`cursor-pointer rounded-xl border-2 p-1 transition-all hover:scale-[1.02] ${state.theme === 'cyber' ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-white/10 opacity-70 hover:opacity-100'}`}>
                  <div className="bg-[#030508] rounded-lg p-6 h-48 flex flex-col justify-center items-center relative overflow-hidden font-display">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                      <div className="relative z-10 text-center">
                          <Zap className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                          <h3 className="text-cyan-400 font-bold text-lg uppercase tracking-widest text-glow-cyan">Cyber Neon</h3>
                          <p className="text-xs text-cyan-700 mt-2">赛博朋克，高对比度霓虹光效</p>
                      </div>
                      {state.theme === 'cyber' && <div className="absolute top-3 right-3 text-cyan-400"><CheckCircle2 className="w-5 h-5 fill-current text-black"/></div>}
                  </div>
              </div>
              {/* Option 3: Obsidian */}
              <div onClick={() => handleThemeChange('obsidian')} className={`cursor-pointer rounded-xl border-2 p-1 transition-all hover:scale-[1.02] ${state.theme === 'obsidian' ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-white/10 opacity-70 hover:opacity-100'}`}>
                  <div className="bg-[#050505] rounded-lg p-6 h-48 flex flex-col justify-center items-center relative overflow-hidden">
                      <div className="relative z-10 text-center">
                          <Moon className="w-10 h-10 text-white mx-auto mb-3" />
                          <h3 className="text-white font-bold text-lg">Obsidian</h3>
                          <p className="text-xs text-slate-500 mt-2">黑曜石极简，无干扰沉浸式体验</p>
                      </div>
                      {state.theme === 'obsidian' && <div className="absolute top-3 right-3 text-white"><CheckCircle2 className="w-5 h-5 fill-current text-black"/></div>}
                  </div>
              </div>
          </div>
      )}

      {/* CLOUD TAB */}
      {activeTab === 'cloud' && (
          <div className="bg-black/20 rounded-xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-2 space-y-8">
              <div className="flex items-start gap-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                  <Server className="w-6 h-6 text-indigo-400 mt-1" />
                  <div>
                      <h4 className="text-sm font-bold text-white mb-1">Supabase 云端同步</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                          配置 Supabase 数据库连接，实现多设备间的数据同步与备份。
                          请确保您的 Supabase 数据库包含 <code className="bg-black/40 px-1 py-0.5 rounded border border-white/10">app_backups</code> 表。
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">Project URL</label>
                          <input type="text" value={supabaseForm.url} onChange={e => setSupabaseForm({...supabaseForm, url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none" placeholder="https://xyz.supabase.co" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">API Key (Anon/Public)</label>
                          <div className="relative">
                              <input type={showKey ? "text" : "password"} value={supabaseForm.key} onChange={e => setSupabaseForm({...supabaseForm, key: e.target.value})} placeholder="eyJ..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none pr-10" />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                                  {showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                              </button>
                          </div>
                      </div>
                      <button onClick={handleSupabaseSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg">
                          保存配置
                      </button>
                  </div>

                  <div className="flex flex-col justify-center items-center gap-4 border-l border-white/10 pl-8">
                      <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">上次同步时间</div>
                          <div className="text-sm font-mono text-white">{state.supabaseConfig.lastSync || '从未同步'}</div>
                      </div>
                      
                      <div className="flex flex-col w-full gap-3">
                          <button onClick={handleSyncPush} disabled={isSyncing || !state.supabaseConfig.url} className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50">
                              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4" />} 上传备份 (Push)
                          </button>
                          <button onClick={handleSyncPull} disabled={isSyncing || !state.supabaseConfig.url} className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50">
                              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin"/> : <DownloadCloud className="w-4 h-4" />} 恢复数据 (Pull)
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ECHOTIK INTEGRATION TAB */}
      {activeTab === 'integrations' && (
          <div className="bg-black/20 rounded-xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-2 space-y-8">
              <div className="flex items-start gap-4 p-4 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                  <BarChart4 className="w-6 h-6 text-pink-400 mt-1" />
                  <div>
                      <h4 className="text-sm font-bold text-white mb-1">EchoTik API 集成</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                          接入 EchoTik 第三方数据服务，用于 TikTok Shop 市场情报、达人搜索与选品分析。
                          请填写 API 密钥管理中的 Username 和 Password。
                      </p>
                  </div>
              </div>

              <div className="space-y-4 max-w-lg">
                  <div className="space-y-1">
                      <label className="text-xs text-slate-400">Username / Access Key</label>
                      <input 
                          type="text" 
                          value={echotikForm.username} 
                          onChange={e => setEchotikForm({...echotikForm, username: e.target.value})} 
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-pink-500 outline-none" 
                          placeholder="e.g. 240906..." 
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs text-slate-400">Password / Secret Key</label>
                      <div className="relative">
                          <input 
                              type={showEchoTikPass ? "text" : "password"} 
                              value={echotikForm.password} 
                              onChange={e => setEchotikForm({...echotikForm, password: e.target.value})} 
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-pink-500 outline-none pr-10" 
                              placeholder="e.g. 962749..." 
                          />
                          <button onClick={() => setShowEchoTikPass(!showEchoTikPass)} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                              {showEchoTikPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                          </button>
                      </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs text-slate-400">默认市场区域 (Region)</label>
                      <select 
                          value={echotikForm.region} 
                          onChange={e => setEchotikForm({...echotikForm, region: e.target.value as any})} 
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-pink-500 outline-none"
                      >
                          <option value="US">美国 (US)</option>
                          <option value="UK">英国 (UK)</option>
                          <option value="SEA">东南亚 (SEA)</option>
                      </select>
                  </div>
                  <button onClick={handleEchotikSave} className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg">
                      保存 EchoTik 配置
                  </button>
              </div>
          </div>
      )}

      {/* GENERAL TAB */}
      {activeTab === 'general' && (
          <div className="bg-black/20 rounded-xl border border-white/10 p-8 animate-in fade-in slide-in-from-bottom-2 space-y-8">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                          <Database className="w-4 h-4" /> 基础信息
                      </h3>
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">店铺名称 (Store Name)</label>
                          <input type="text" value={generalForm.storeName} onChange={e => setGeneralForm({...generalForm, storeName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">默认货币 (Base Currency)</label>
                          <select value={generalForm.currency} onChange={e => setGeneralForm({...generalForm, currency: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none">
                              <option value="USD">美元 (USD)</option>
                              <option value="CNY">人民币 (CNY)</option>
                              <option value="EUR">欧元 (EUR)</option>
                          </select>
                      </div>
                  </div>

                  {/* Section 2: API & Security */}
                  <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                          <Shield className="w-4 h-4" /> API 连接配置
                      </h3>
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">API 密钥 (Secret Key)</label>
                          <div className="relative">
                              <input 
                                  type={showKey ? "text" : "password"} 
                                  value={generalForm.apiKey} 
                                  onChange={e => setGeneralForm({...generalForm, apiKey: e.target.value})} 
                                  placeholder="sk-..."
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none pr-10" 
                              />
                              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                                  {showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                              </button>
                          </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                          <button 
                              onClick={handleTestConnection}
                              disabled={isTestingConnection}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                              {isTestingConnection ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              测试连接
                          </button>
                          {connectionStatus === 'success' && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 连接正常</span>}
                      </div>
                  </div>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> 危险区域 (Danger Zone)
                  </h3>
                  <div className="flex items-center justify-between bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                      <div>
                          <div className="text-sm font-bold text-slate-200">重置所有数据</div>
                          <div className="text-xs text-slate-500 mt-1">清空本地存储，恢复为演示初始数据。操作无法撤销。</div>
                      </div>
                      <button onClick={handleResetData} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                          <ResetIcon className="w-3 h-3" /> 立即重置
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* RECYCLE BIN TAB */}
      {activeTab === 'recycle' && (
          <div className="bg-black/20 rounded-xl border border-white/10 p-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" /> 数据回收站
              </h3>
              <RecycleBin />
          </div>
      )}
    </div>
  );
};

export default Settings;
