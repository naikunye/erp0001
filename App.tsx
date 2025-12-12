
import React, { useState, useEffect } from 'react';
import { TanxingProvider } from './context/TanxingContext';
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
import ToastContainer from './components/Toast';
import GlobalSearch from './components/GlobalSearch';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Page } from './types';
import { Hexagon, ArrowRight, Loader2 } from 'lucide-react';
import Logger from './utils/logger';

const MainLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: 'admin@tanxing.com', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [activePage, setActivePage] = useState<Page>('dashboard');

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
      if (confirm('确认断开神经连接？')) {
          setIsAuthenticated(false);
      }
  };

  const getPageTitle = (page: Page) => {
    switch (page) {
      case 'dashboard': return 'Command Center';
      case 'finance': return 'Finance & Capital';
      case 'tracking': return 'Global Logistics';
      case 'orders': return 'Order Fulfillment';
      case 'customers': return 'Client Database';
      case 'inventory': return 'Inventory & Supply';
      case 'intelligence': return 'AI Laboratory';
      case 'marketing': return 'Growth Engine';
      case 'analytics': return 'Deep Analytics';
      case 'calendar': return 'Operations Timeline';
      case 'settings': return 'System Config';
      default: return 'Quantum OS';
    }
  };

  const renderContent = () => {
    switch (activePage) {
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
      case 'settings': return <Settings />;
      default: return <div className="p-12 text-center text-slate-500 font-mono">Module Offline</div>;
    }
  };

  if (authChecking) {
      return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;
  }

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
              <div className="glass-panel w-full max-w-[380px] p-10 rounded-2xl relative z-10 border border-white/10 shadow-2xl">
                  <div className="flex flex-col items-center mb-10">
                      <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.4)] mb-6 text-white rotate-45 border border-white/20">
                          <Hexagon className="w-8 h-8 fill-current -rotate-45" />
                      </div>
                      <h1 className="text-3xl font-display font-bold text-white tracking-widest uppercase">TANXING</h1>
                      <p className="text-[10px] text-cyan-400 font-mono mt-1 tracking-[0.3em] uppercase">Quantum OS v5.0</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-4">
                          <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none font-mono" placeholder="OPERATOR ID" />
                          <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all outline-none font-mono" placeholder="ACCESS KEY" />
                      </div>
                      <button type="submit" disabled={loginLoading} className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 mt-4 transition-all active:scale-[0.98] border border-white/10">
                          {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>INITIALIZE LINK <ArrowRight className="w-4 h-4" /></>}
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden p-2 gap-2 bg-transparent font-sans">
      <ToastContainer />
      <GlobalSearch />
      
      <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col relative h-full min-w-0 glass-panel rounded-xl shadow-2xl overflow-hidden">
        <div className="relative z-10">
            <Header title={getPageTitle(activePage)} />
        </div>
        
        <main className="flex-1 overflow-y-auto scroll-smooth p-6 relative z-10">
          <ErrorBoundary>
            <div className="max-w-[1800px] mx-auto h-full flex flex-col">
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
