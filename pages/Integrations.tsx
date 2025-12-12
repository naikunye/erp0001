
import React, { useState } from 'react';
import { Integration } from '../types';
import { 
  Link2, CheckCircle2, AlertCircle, RefreshCw, Plus, 
  Trash2, ExternalLink, ShieldCheck, Loader2, Globe 
} from 'lucide-react';

// Mock Integration Data
const INITIAL_INTEGRATIONS: Integration[] = [
    { id: '1', platform: 'TikTok', name: 'TikTok Shop US (TechFlow)', region: '北美', status: 'connected', lastSync: '2分钟前' },
    { id: '2', platform: 'Amazon', name: 'Amazon FBA (Main)', region: '北美', status: 'connected', lastSync: '15分钟前' },
    { id: '3', platform: 'Shopify', name: 'Brand Store', region: '全球', status: 'error', lastSync: '2天前' },
];

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSync = (id: string) => {
      setIsSyncing(id);
      setTimeout(() => {
          setIntegrations(prev => prev.map(i => 
              i.id === id ? { ...i, status: 'connected', lastSync: '刚刚' } : i
          ));
          setIsSyncing(null);
      }, 2000);
  };

  const getPlatformColor = (platform: string) => {
      switch(platform) {
          case 'Amazon': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
          case 'TikTok': return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
          case 'Shopify': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
          default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Link2 className="w-6 h-6 text-indigo-500" />
                  店铺授权与集成 (Integrations)
              </h1>
              <p className="text-sm text-slate-500 mt-1">管理多平台店铺连接，实现订单、库存与财务的自动同步。</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40"
          >
              <Plus className="w-4 h-4" /> 添加新店铺
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map(integration => (
              <div key={integration.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative group hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${getPlatformColor(integration.platform)}`}>
                          <Globe className="w-6 h-6" />
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${
                          integration.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          integration.status === 'syncing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                          {isSyncing === integration.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                           integration.status === 'connected' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {isSyncing === integration.id ? '同步中...' : integration.status.toUpperCase()}
                      </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1">{integration.name}</h3>
                  <div className="text-xs text-slate-500 mb-6 flex items-center gap-2">
                      <span className="font-mono">{integration.platform.toUpperCase()} API</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span>{integration.region}</span>
                  </div>

                  <div className="space-y-3 border-t border-slate-800 pt-4">
                      <div className="flex justify-between text-xs">
                          <span className="text-slate-500">上次同步</span>
                          <span className="text-slate-300 font-mono">{integration.lastSync}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                          <span className="text-slate-500">API 权限</span>
                          <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 读/写 (Read/Write)</span>
                      </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                      <button 
                          onClick={() => handleSync(integration.id)}
                          disabled={isSyncing === integration.id}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                          <RefreshCw className={`w-3 h-3 ${isSyncing === integration.id ? 'animate-spin' : ''}`} /> 立即同步
                      </button>
                      <button className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-950 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          ))}

          {/* Add New Placeholder */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-900/5 transition-all group"
          >
              <div className="w-12 h-12 rounded-full bg-slate-900 group-hover:bg-indigo-500/10 flex items-center justify-center mb-4 transition-colors">
                  <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm">连接新店铺</span>
              <span className="text-xs opacity-50 mt-1">支持 50+ 跨境平台</span>
          </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowAddModal(false)}>
              <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <h2 className="text-xl font-bold text-white mb-6">选择平台进行授权</h2>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                      {['Amazon', 'TikTok', 'Shopify', 'eBay', 'WooCommerce', 'Walmart'].map(p => (
                          <button key={p} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-900/10 transition-all flex flex-col items-center gap-2 group">
                              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                  <span className="font-bold text-xs">{p[0]}</span>
                              </div>
                              <span className="text-sm font-medium text-slate-300 group-hover:text-white">{p}</span>
                          </button>
                      ))}
                  </div>
                  <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-400 mb-6">
                      <p className="flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Tanxing.OS 采用银行级加密传输 (TLS 1.3) 保护您的 API 密钥。授权过程将跳转至平台官方 OAuth 页面，我们不会保存您的登录密码。</span>
                      </p>
                  </div>
                  <div className="flex justify-end">
                      <button onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">取消</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Integrations;
