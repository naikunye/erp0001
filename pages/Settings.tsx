
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Save, Shield, Cloud, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Bell, Lock, KeyRound, X, Trash2, RotateCcw } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const RecycleBin = () => {
    const { state, dispatch, showToast } = useTanxing();
    
    // Filter deleted items
    const deletedProducts = state.products.filter(p => p.deletedAt);
    const deletedOrders = state.orders.filter(o => o.deletedAt);

    const handleRestoreProduct = (id: string) => {
        dispatch({ type: 'RESTORE_PRODUCT', payload: id });
        showToast('商品已恢复', 'success');
    };

    const handlePermanentDeleteProduct = (id: string) => {
        if(confirm('此操作不可撤销，确定要永久删除吗？')) {
            dispatch({ type: 'PERMANENT_DELETE_PRODUCT', payload: id });
            showToast('商品已永久删除', 'info');
        }
    };

    const handleRestoreOrder = (id: string) => {
        dispatch({ type: 'RESTORE_ORDER', payload: id });
        showToast('订单已恢复', 'success');
    };

    const handlePermanentDeleteOrder = (id: string) => {
        if(confirm('此操作不可撤销，确定要永久删除吗？')) {
            dispatch({ type: 'PERMANENT_DELETE_ORDER', payload: id });
            showToast('订单已永久删除', 'info');
        }
    };

    const getDaysRemaining = (deletedAt?: string) => {
        if(!deletedAt) return 7;
        const deleted = new Date(deletedAt);
        const expiry = new Date(deleted);
        expiry.setDate(expiry.getDate() + 7);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-slate-400" />
                回收站 (Recycle Bin)
            </h3>
            <p className="text-xs text-slate-500 mb-6">已删除的项目将在此保留 7 天，之后会自动永久清除。</p>

            <div className="space-y-6">
                {/* Deleted Products */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-between">
                        <span>已删除商品 ({deletedProducts.length})</span>
                    </h4>
                    {deletedProducts.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-600 bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
                            暂无已删除商品
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {deletedProducts.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                                    <div>
                                        <div className="text-sm font-bold text-slate-300">{p.name}</div>
                                        <div className="text-xs text-slate-500 font-mono">SKU: {p.sku} • {getDaysRemaining(p.deletedAt)}天后清除</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRestoreProduct(p.id)} className="p-1.5 hover:bg-slate-800 rounded text-emerald-500 hover:text-emerald-400" title="恢复"><RotateCcw className="w-4 h-4" /></button>
                                        <button onClick={() => handlePermanentDeleteProduct(p.id)} className="p-1.5 hover:bg-slate-800 rounded text-red-500 hover:text-red-400" title="永久删除"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Deleted Orders */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-between">
                        <span>已删除订单 ({deletedOrders.length})</span>
                    </h4>
                    {deletedOrders.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-600 bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
                            暂无已删除订单
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {deletedOrders.map(o => (
                                <div key={o.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                                    <div>
                                        <div className="text-sm font-bold text-slate-300">{o.id}</div>
                                        <div className="text-xs text-slate-500 font-mono">{o.customerName} • ¥{o.total} • {getDaysRemaining(o.deletedAt)}天后清除</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRestoreOrder(o.id)} className="p-1.5 hover:bg-slate-800 rounded text-emerald-500 hover:text-emerald-400" title="恢复"><RotateCcw className="w-4 h-4" /></button>
                                        <button onClick={() => handlePermanentDeleteOrder(o.id)} className="p-1.5 hover:bg-slate-800 rounded text-red-500 hover:text-red-400" title="永久删除"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
  // Supabase Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<string>('从未同步');

  // Preferences State
  const [language, setLanguage] = useState('zh-CN');
  const [currency, setCurrency] = useState('USD');
  
  // Security State
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  
  // Notifications State
  const [notifications, setNotifications] = useState({
    stockAlert: true,
    newOrder: true,
    weeklyReport: false
  });

  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'recycle'>('general');

  // Load saved settings from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('tanxing_supabase_url');
    const savedKey = localStorage.getItem('tanxing_supabase_key');
    const savedStatus = localStorage.getItem('tanxing_connection_status');
    const savedPrefs = localStorage.getItem('tanxing_preferences');
    
    if (savedUrl) setSupabaseUrl(savedUrl);
    if (savedKey) setSupabaseKey(savedKey);
    if (savedStatus === 'connected') setConnectionStatus('connected');
    
    if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setLanguage(prefs.language || 'zh-CN');
        setCurrency(prefs.currency || 'USD');
        if (prefs.notifications) setNotifications(prefs.notifications);
        if (prefs.is2FAEnabled !== undefined) setIs2FAEnabled(prefs.is2FAEnabled);
    }
    
    setLastSyncTime(new Date().toLocaleString());
  }, []);

  // Save Preferences automatically when changed
  useEffect(() => {
      const prefs = { language, currency, notifications, is2FAEnabled };
      localStorage.setItem('tanxing_preferences', JSON.stringify(prefs));
  }, [language, currency, notifications, is2FAEnabled]);

  const handleConnect = () => {
    if (!supabaseUrl || !supabaseKey) {
        alert("请输入完整的 Supabase URL 和 Anon Key");
        return;
    }

    setConnectionStatus('connecting');

    // Simulate network connection delay and validation
    setTimeout(() => {
        // Simple mock validation logic
        if (supabaseUrl.includes('supabase.co')) {
            setConnectionStatus('connected');
            localStorage.setItem('tanxing_supabase_url', supabaseUrl);
            localStorage.setItem('tanxing_supabase_key', supabaseKey);
            localStorage.setItem('tanxing_connection_status', 'connected');
            setLastSyncTime(new Date().toLocaleString());
        } else {
            setConnectionStatus('error');
        }
    }, 1500);
  };

  const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      setSupabaseUrl('');
      setSupabaseKey('');
      localStorage.removeItem('tanxing_supabase_url');
      localStorage.removeItem('tanxing_supabase_key');
      localStorage.removeItem('tanxing_connection_status');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggle2FA = () => {
      // Simulate API call toggle
      const newState = !is2FAEnabled;
      setIs2FAEnabled(newState);
      alert(newState ? "二步验证已开启" : "二步验证已关闭 (不推荐)");
  };

  const handleChangePassword = () => {
      if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
          alert("请填写所有字段");
          return;
      }
      if (passwordForm.new !== passwordForm.confirm) {
          alert("两次输入的新密码不一致");
          return;
      }
      if (passwordForm.new.length < 6) {
          alert("新密码长度不能少于6位");
          return;
      }

      // Simulate API call
      alert("密码修改成功！下次登录请使用新密码。");
      setShowPasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-slate-400" />
                系统设置 (System Settings)
            </h2>
            <p className="text-sm text-slate-500 mt-1">管理数据库连接与全局参数</p>
         </div>
         <div className="text-xs text-slate-500 font-mono">
             Version 5.0.3 (Build 20231028)
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
              常规设置
          </button>
          <button 
            onClick={() => setActiveTab('recycle')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'recycle' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
              <Trash2 className="w-4 h-4" /> 回收站
          </button>
      </div>

      {activeTab === 'recycle' ? (
          <RecycleBin />
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Database Connection */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                          <h3 className="font-bold text-white flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-500" />
                              Supabase 云端数据库连接
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
                              connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              connectionStatus === 'connecting' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              connectionStatus === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                  connectionStatus === 'connected' ? 'bg-emerald-500' :
                                  connectionStatus === 'connecting' ? 'bg-blue-500 animate-pulse' :
                                  connectionStatus === 'error' ? 'bg-red-500' :
                                  'bg-slate-500'
                              }`}></div>
                              {connectionStatus === 'connected' ? '已连接 (Connected)' :
                              connectionStatus === 'connecting' ? '连接中... (Connecting)' :
                              connectionStatus === 'error' ? '连接失败 (Error)' :
                              '未连接 (Disconnected)'}
                          </div>
                      </div>
                      
                      <div className="p-6 space-y-5">
                          <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-400 flex justify-between">
                                  Project URL
                                  <span className="text-xs text-slate-600">https://your-project.supabase.co</span>
                              </label>
                              <div className="relative">
                                  <Cloud className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                  <input 
                                      type="text" 
                                      value={supabaseUrl}
                                      onChange={(e) => setSupabaseUrl(e.target.value)}
                                      disabled={connectionStatus === 'connected'}
                                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      placeholder="https://xyz.supabase.co"
                                  />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-400 flex justify-between">
                                  API Key (public/anon)
                                  <span className="text-xs text-slate-600">Settings &gt; API</span>
                              </label>
                              <div className="relative">
                                  <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                  <input 
                                      type={showKey ? "text" : "password"} 
                                      value={supabaseKey}
                                      onChange={(e) => setSupabaseKey(e.target.value)}
                                      disabled={connectionStatus === 'connected'}
                                      className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                  />
                                  <button 
                                      onClick={() => setShowKey(!showKey)}
                                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                                  >
                                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                              </div>
                          </div>

                          {connectionStatus === 'error' && (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                  <div className="text-xs text-red-400">
                                      <p className="font-bold">连接失败</p>
                                      <p>无法连接到数据库，请检查 URL 格式是否正确，或者 API Key 是否有效。</p>
                                  </div>
                              </div>
                          )}

                          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                              <div className="text-xs text-slate-500">
                                  最后同步: <span className="font-mono text-slate-400">{lastSyncTime}</span>
                              </div>
                              <div className="flex gap-3">
                                  {connectionStatus === 'connected' ? (
                                      <>
                                        <button 
                                            onClick={handleDisconnect}
                                            className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-colors"
                                        >
                                            断开连接
                                        </button>
                                        <button 
                                            onClick={() => setLastSyncTime(new Date().toLocaleString())}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                                        >
                                            <RefreshCw className="w-4 h-4" /> 立即同步
                                        </button>
                                      </>
                                  ) : (
                                      <button 
                                        onClick={handleConnect}
                                        disabled={connectionStatus === 'connecting'}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-wait"
                                      >
                                        {connectionStatus === 'connecting' ? (
                                            <>连接中...</>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" /> 保存并连接
                                            </>
                                        )}
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* General Preferences */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-purple-500" />
                          通用偏好 (Preferences)
                      </h3>
                      <div className="space-y-4">
                          <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                              <div>
                                  <div className="text-sm text-slate-300">系统语言</div>
                                  <div className="text-xs text-slate-500">System Language</div>
                              </div>
                              <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:border-indigo-500 focus:outline-none"
                              >
                                  <option value="zh-CN">简体中文 (Chinese)</option>
                                  <option value="en-US">English</option>
                              </select>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                              <div>
                                  <div className="text-sm text-slate-300">默认货币</div>
                                  <div className="text-xs text-slate-500">Default Currency for Analytics</div>
                              </div>
                              <select 
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:border-indigo-500 focus:outline-none"
                              >
                                  <option value="USD">USD ($)</option>
                                  <option value="CNY">CNY (¥)</option>
                                  <option value="EUR">EUR (€)</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Right Column: System Info */}
              <div className="space-y-6">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          账户安全
                      </h3>
                      <div className="space-y-3">
                          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                              <span className="text-sm text-slate-300">当前角色</span>
                              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">管理员</span>
                          </div>
                          <div 
                              className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors group"
                              onClick={toggle2FA}
                          >
                              <span className="text-sm text-slate-300">2FA 验证</span>
                              <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                                  is2FAEnabled 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-slate-700 text-slate-400 border-slate-600'
                              }`}>
                                  {is2FAEnabled ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  {is2FAEnabled ? '已开启' : '已关闭'}
                              </span>
                          </div>
                          <button 
                              onClick={() => setShowPasswordModal(true)}
                              className="w-full p-2 mt-2 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                              <KeyRound className="w-3 h-3" /> 修改登录密码
                          </button>
                      </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-500" />
                          通知设置
                      </h3>
                      <div className="space-y-3">
                          <div onClick={() => toggleNotification('stockAlert')} className="flex items-center justify-between cursor-pointer group">
                              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">库存预警通知</span>
                              <div className={`w-10 h-5 rounded-full relative transition-colors ${notifications.stockAlert ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${notifications.stockAlert ? 'right-1' : 'left-1'}`}></div>
                              </div>
                          </div>
                          <div onClick={() => toggleNotification('newOrder')} className="flex items-center justify-between cursor-pointer group">
                              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">新订单提醒</span>
                              <div className={`w-10 h-5 rounded-full relative transition-colors ${notifications.newOrder ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${notifications.newOrder ? 'right-1' : 'left-1'}`}></div>
                              </div>
                          </div>
                          <div onClick={() => toggleNotification('weeklyReport')} className="flex items-center justify-between cursor-pointer group">
                              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">AI 周报推送</span>
                              <div className={`w-10 h-5 rounded-full relative transition-colors ${notifications.weeklyReport ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${notifications.weeklyReport ? 'right-1' : 'left-1'}`}></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={() => setShowPasswordModal(false)}>
              <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-indigo-500" />
                      修改密码
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">当前密码</label>
                          <input 
                              type="password" 
                              value={passwordForm.current}
                              onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">新密码</label>
                          <input 
                              type="password" 
                              value={passwordForm.new}
                              onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-slate-400">确认新密码</label>
                          <input 
                              type="password" 
                              value={passwordForm.confirm}
                              onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                      </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">取消</button>
                      <button onClick={handleChangePassword} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold">
                          确认修改
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
