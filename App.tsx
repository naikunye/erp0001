
import React from 'react';
import { TanxingProvider, useTanxing } from './context/TanxingContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Replenishment from './pages/Replenishment';
import Logistics from './pages/Logistics';
import Finance from './pages/Finance';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import ProductAI from './pages/ProductAI';
import Customers from './pages/Customers';
import ToastContainer from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Page } from './types';
import { Command } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { state, dispatch } = useTanxing();

  const handleNavigate = (page: Page) => {
      dispatch({ type: 'NAVIGATE', payload: { page } });
  };

  const renderContent = () => {
    switch (state.activePage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Replenishment />;
      case 'finance': return <Finance />;
      case 'analytics': return <Analytics />;
      case 'logistics': return <Logistics />;
      case 'customers': return <Customers />;
      case 'product_ai': return <ProductAI />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  // Apple-style Boot Sequence
  if (!state.isInitialized) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-black">
              <div className="relative mb-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                      <Command className="text-black w-8 h-8" strokeWidth={2.5} />
                  </div>
                  <div className="absolute inset-0 bg-white blur-2xl opacity-20 animate-pulse"></div>
              </div>
              <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-1/2 animate-[load_2s_infinite_ease-in-out]"></div>
              </div>
              <style>{`@keyframes load { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
          </div>
      );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans text-white bg-transparent">
      <ToastContainer />
      <Sidebar activePage={state.activePage} onNavigate={handleNavigate} onLogout={() => {}} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header title={state.activePage} />
        <main className="flex-1 overflow-hidden relative z-10 p-6 pt-2 no-scrollbar overflow-y-auto">
            <ErrorBoundary>
                <div className="w-full h-full animate-in fade-in duration-700">
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
