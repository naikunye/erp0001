
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Settings, LogOut, Hexagon, BrainCircuit, Wallet, Map, CalendarDays, Megaphone, X, PieChart, PackageCheck } from 'lucide-react';
import { Page } from '../types';
import { useTanxing } from '../context/TanxingContext';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const { state, dispatch } = useTanxing();
  const isOpen = state.isMobileMenuOpen;

  const menuItems = [
    { id: 'dashboard', label: '总览仪表盘', icon: LayoutDashboard },
    { id: 'intelligence', label: 'AI 智脑实验室', icon: BrainCircuit, highlight: true },
    { id: 'inventory', label: '智能备货', icon: PackageCheck },
    { id: 'finance', label: '财务资金', icon: Wallet },
    { id: 'analytics', label: '数据分析', icon: PieChart }, 
    { id: 'tracking', label: '物流追踪', icon: Map },
    { id: 'calendar', label: '运营日历', icon: CalendarDays },
    { id: 'orders', label: '订单履约', icon: ShoppingCart },
    { id: 'marketing', label: '营销与投放', icon: Megaphone },
    { id: 'customers', label: '客户管理', icon: Users },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  const handleNav = (page: Page) => {
      onNavigate(page);
      if (window.innerWidth < 1024) {
          dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: false });
      }
  };

  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: false })}
            />
        )}

        {/* Sidebar Container */}
        <div className={`fixed lg:static inset-y-4 left-4 w-[260px] flex flex-col z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
            <div className="glass-panel h-full flex flex-col p-4 rounded-2xl shadow-2xl">
                
                {/* Brand Header */}
                <div className="h-20 flex items-center px-2 mb-2">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,240,255,0.3)] border border-white/20">
                            <Hexagon className="w-6 h-6 fill-current" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-display font-bold text-white tracking-widest leading-none">TANXING</span>
                            <span className="text-[10px] text-cyan-400 font-mono tracking-widest mt-1">QUANTUM OS</span>
                        </div>
                        <button 
                            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: false })}
                            className="lg:hidden ml-auto text-slate-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none pr-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        // @ts-ignore
                        const isHighlight = item.highlight;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id as Page)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative border ${
                                    isActive
                                    ? 'bg-white/10 border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/5'
                                }`}
                            >
                                {/* Active Indicator Bar */}
                                {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_#00F0FF]"></div>}

                                <div className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-200'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`relative z-10 ${isActive ? 'translate-x-1' : ''} transition-transform duration-300`}>{item.label}</span>
                                
                                {isHighlight && !isActive && <span className="ml-auto w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_5px_#a855f7]"></span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="pt-4 mt-auto border-t border-white/5">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 text-slate-500 transition-all text-sm group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>断开连接</span>
                    </button>
                </div>
            </div>
        </div>
    </>
  );
};

export default Sidebar;
