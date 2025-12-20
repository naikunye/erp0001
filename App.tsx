import React, { useState, useEffect } from 'react';
import { TanxingProvider, useTanxing } from './context/TanxingContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
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
import OperationsTasks from './pages/OperationsTasks';
import AICommandCenter from './pages/AICommandCenter';
import InboundShipments from './pages/InboundShipments';
import ToastContainer from './components/Toast';
import GlobalSearch from './components/GlobalSearch';
import Suppliers from './pages/Suppliers'; 
import Profile from './pages/Profile';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Page } from './types';
import { Hexagon, ArrowRight, Loader2, Cpu, Zap } from 'lucide-react';
import Logger from './utils/logger';

const MainLayout: React.FC = () => {
  const { state, dispatch } = useTanxing();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: 'admin@tanxing.com', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  
  // --- 核心修复：同步主题到 body 标签 ---
  useEffect(() => {
      if (state.theme) {
          // 清除所有旧主题类，添加新主题类
          document.body.className = `theme-${state.theme}`;
          Logger.info(`Theme applied: theme-${state.theme}`);
      }
  }, [state.theme]);

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
      case 'finance': return '财务穿透 (Audit & Capital)';
      case 'tracking': return '全球物流 (Global Logistics)';
      case 'customers': return '客户数据库 (Client Database)';
      case 'inventory': return '库存供应链 (Inventory & Supply)';
      case 'intelligence': return 'AI 实验室 (AI Laboratory)';
      case 'marketing': return '增长引擎 (Growth Engine)';
      case 'analytics': return '深度分析 (Deep Analytics)';
      case 'calculator': return '智能计算 (Intelligent Calc)';
      case 'calendar': return '运营日历 (Operations Timeline)';
      case 'settings': return '系统配置 (System Config)';
      case 'suppliers': return '供应商管理 (Suppliers)';
      case 'profile': return '管理员配置 (Admin Profile)';
      case 'tasks': return '运营协同中心 (Operations Hub)';
      case 'ai-command': return 'AI 指令控制台 (Quantum Command)';
      case 'logistics-hub': return '物流中枢 (Logistics Matrix)';
      default: return '探行 OS (Quantum Edition)';
    }
  };

  const renderContent = () => {
    switch (state.activePage) {
      case 'dashboard': return <Dashboard />;
      case 'finance': return <Finance />;
      case 'tracking': return <Tracking />;
      case 'calendar': return <Calendar />;
      case 'customers': return <Customers />;
      case 'inventory': return <Inventory />;
      case 'intelligence': return <Intelligence />;
      case 'marketing': return <Marketing />;
      case 'analytics': return <Analytics />;
      case 'calculator': return <CalculatorCenter />;
      case 'settings': return <Settings />;
      case 'suppliers': return <Suppliers />;
      case 'profile': return <Profile />;
      case 'tasks': return <OperationsTasks />;
      case 'ai-command': return <AICommandCenter />;
      case 'logistics-hub': return <InboundShipments />;
      default: return <div className="p-12 text-center text-slate-500 font-mono">模块建设中...</div>;
    }
  };

  if (authChecking || !state.isInitialized) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] gap-6">
              <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center animate-pulse">
                      <Hexagon className="w-10 h-10 text-indigo-500 animate-spin-slow" />
                  </div>
              </div>
              <h2 className="text-white font-mono font-bold tracking-[0.3em] uppercase text-sm">System Initializing</h2>
          </div>
      );
  }

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
              <div className="ios-glass-panel w-full max-w-[400px] p-10 rounded-3xl relative z-10">
                  <div className="flex flex-col items-center mb-10">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shadow-2xl mb-6 text-white border border-white/10">
                          <Hexagon className="w-8 h-8 fill-current text-violet-400" />
                      </div>
                      <h1 className="text-3xl font-bold text-white tracking-widest uppercase italic">探行 OS</h1>
                      <p className="text-xs text-white/40 font-mono mt-2 tracking-[0.3em] uppercase">Enterprise Quantum OS</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-4">
                          <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none font-mono focus:border-violet-500 transition-all" placeholder="账号 ID" />
                          <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none font-mono focus:border-violet-500 transition-all" placeholder="密码 Password" />
                      </div>
                      <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-white text-black hover:bg-slate-200 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-all">
                          {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>进入系统 <ArrowRight className="w-4 h-4" /></>}
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden p-4 gap-4 font-sans bg-transparent">
      <ToastContainer />
      <GlobalSearch />
      <Sidebar activePage={state.activePage} onNavigate={handleNavigate} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col relative h-full min-w-0 ios-glass-panel rounded-3xl overflow-hidden">
        <div className="relative z-20">
            <Header title={getPageTitle(state.activePage)} />
        </div>
        <main className="flex-1 overflow-y-auto scroll-smooth p-6 relative z-10 custom-scrollbar">
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