
import React, { useState, useEffect } from 'react';
import { TanxingProvider, useTanxing } from './context/TanxingContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Intelligence from './pages/Intelligence';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import Tracking from './pages/Tracking';
import Calendar from './pages/Calendar';
import Marketing from './pages/Marketing';
import Analytics from './pages/Analytics'; 
import CalculatorCenter from './pages/CalculatorCenter';
import ToastContainer from './components/Toast';
import GlobalSearch from './components/GlobalSearch';
import Integrations from './pages/Integrations'; 
import Suppliers from './pages/Suppliers'; 
import { ErrorBoundary } from './components/ErrorBoundary';
import { Page } from './types';
import { Hexagon, ArrowRight, Loader2 } from 'lucide-react';
import Logger from './utils/logger';

const MainLayout: React.FC = () => {
  const { state, dispatch } = useTanxing(); // Use Context
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: 'admin@tanxing.com', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  
  useEffect(() => {
      setAuthChecking(false);
      Logger.info("Application mounted");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginLoading(true);
      setTimeout(() => {
          setIsAuthenticated(true);
          setLoginLoading(false);
      }, 800);
  };

  const handleLogout = () => {
      if (confirm('确认断开神经连接并退出系统？')) {
          setIsAuthenticated(false);
      }
  };

  const handleNavigate = (page: Page) => {
      dispatch({ type: 'NAVIGATE', payload: { page } });
  };

  const getPageTitle = (page: Page) => {
    switch (page) {
      case 'dashboard': return '指挥中枢 (Command Center)';
      case 'finance': return '资金财务 (Finance & Capital)';
      case 'tracking': return '全球物流 (Global Logistics)';
      case 'orders': return '订单履约 (Order Fulfillment)';
      case 'customers': return '客户数据库 (Client Database)';
      case 'inventory': return '库存供应链 (Inventory & Supply)';
      case 'intelligence': return 'AI 实验室 (AI Laboratory)';
      case 'marketing': return '增长引擎 (Growth Engine)';
      case 'analytics': return '深度分析 (Deep Analytics)';
      case 'calculator': return '智能计算 (Intelligent Calc)';
      case 'calendar': return '运营日历 (Operations Timeline)';
      case 'settings': return '系统配置 (System Config)';
      case 'integrations': return '店铺集成 (Integrations)';
      case 'suppliers': return '供应商管理 (Suppliers)';
      default: return '探行 OS (Quantum Edition)';
    }
  };

  const renderContent = () => {
    switch (state.activePage) {
      case 'dashboard': return <Dashboard />;
      case 'finance': return <Finance />;
      case 'tracking': return <Tracking />;
      case 'calendar': return <Calendar />;
      case 'orders': return <Orders />;
      case 'customers': return <Customers />;
      case 'inventory': return <Inventory />;
      case 'intelligence': return <Intelligence />;
      case 'marketing': return <Marketing />;
      case 'analytics': return <Analytics />;
      case 'calculator': return <CalculatorCenter />;
      case 'settings': return <Settings />;
      case 'integrations': return <Integrations />;
      case 'suppliers': return <Suppliers />;
      default: return <div className="p-12 text-center text-slate-500 font-mono">模块建设中...</div>;
    }
  };

  if (authChecking) {
      return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
              <div className="ios-glass-panel w-full max-w-[400px] p-10 rounded-3xl relative z-10 border border-white/10 shadow-2xl">
                  <div className="flex flex-col items-center mb-10">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shadow-2xl mb-6 text-white border border-white/10 backdrop-blur-md">
                          <Hexagon className="w-8 h-8 fill-current text-blue-400" />
                      </div>
                      <h1 className="text-3xl font-display font-bold text-white tracking-widest uppercase">探行 OS</h1>
                      <p className="text-xs text-white/40 font-mono mt-2 tracking-[0.3em] uppercase">Enterprise Quantum OS</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-4">
                          <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-blue-500 focus:bg-black/30 transition-all outline-none font-mono" placeholder="账号 ID" />
                          <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-blue-500 focus:bg-black/30 transition-all outline-none font-mono" placeholder="密码 Password" />
                      </div>
                      <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-white text-black hover:bg-slate-200 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-all active:scale-[0.98]">
                          {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>登录系统 <ArrowRight className="w-4 h-4" /></>}
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden p-4 gap-4 font-sans">
      <ToastContainer />
      <GlobalSearch />
      
      {/* Sidebar - using global state for active page */}
      <Sidebar activePage={state.activePage} onNavigate={handleNavigate} onLogout={handleLogout} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 ios-glass-panel rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header sits on top */}
        <div className="relative z-20">
            <Header title={getPageTitle(state.activePage)} />
        </div>
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth p-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <ErrorBoundary>
            <div className="w-full h-full flex flex-col">
                {renderContent()}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <TanxingProvider>
                <MainLayout />
            </TanxingProvider>
        </ErrorBoundary>
    );
};

export default App;
