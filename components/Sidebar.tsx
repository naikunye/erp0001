
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Settings, LogOut, Hexagon, BrainCircuit, Wallet, Map, CalendarDays, Megaphone, X, PieChart, PackageCheck, Layers } from 'lucide-react';
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
    { id: 'dashboard', label: 'Dashboard', subLabel: '总览仪表盘', icon: LayoutDashboard },
    { id: 'intelligence', label: 'AI Intelligence', subLabel: '智脑实验室', icon: BrainCircuit, highlight: true },
    { id: 'inventory', label: 'Inventory', subLabel: '智能备货', icon: PackageCheck },
    { id: 'finance', label: 'Finance', subLabel: '财务资金', icon: Wallet },
    { id: 'analytics', label: 'Analytics', subLabel: '数据分析', icon: PieChart }, 
    { id: 'tracking', label: 'Logistics', subLabel: '物流追踪', icon: Map },
    { id: 'calendar', label: 'Calendar', subLabel: '运营日历', icon: CalendarDays },
    { id: 'orders', label: 'Fulfillment', subLabel: '订单履约', icon: ShoppingCart },
    { id: 'marketing', label: 'Marketing', subLabel: '营销与投放', icon: Megaphone },
    { id: 'customers', label: 'CRM', subLabel: '客户管理', icon: Users },
    { id: 'settings', label: 'Settings', subLabel: '系统设置', icon: Settings },
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
                className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: false })}
            />
        )}

        {/* Sidebar Container */}
        <div className={`fixed lg:static inset-y-6 left-6 w-[280px] flex flex-col z-50 transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
            <div className="ios-glass-panel h-full flex flex-col p-6 rounded-3xl">
                
                {/* Brand Header */}
                <div className="flex items-center gap-4 mb-8 px-2">
                    <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md"
                        style={{ backgroundColor: 'var(--sidebar-active-bg)', color: 'var(--accent-color)' }}
                    >
                        <Hexagon className="w-6 h-6 fill-current opacity-80" />
                    </div>
                    <div>
                        <div className="font-display font-bold text-xl text-white tracking-wider leading-none">TANXING</div>
                        <div className="text-[10px] text-white/40 font-mono tracking-[0.2em] mt-1 uppercase">OS v5.0</div>
                    </div>
                    <button 
                        onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: false })}
                        className="lg:hidden ml-auto text-white/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none -mx-2 px-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        // @ts-ignore
                        const isHighlight = item.highlight;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id as Page)}
                                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative"
                                style={isActive ? { 
                                    backgroundColor: 'var(--sidebar-active-bg)', 
                                    color: 'var(--sidebar-active-text)',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                } : {}}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? '' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                
                                <div className="flex flex-col items-start">
                                    <span className={`text-sm font-medium leading-none ${isActive ? 'font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.label}</span>
                                </div>
                                
                                {isHighlight && !isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="pt-6 mt-auto border-t" style={{ borderColor: 'var(--glass-border)' }}>
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-all text-xs font-bold border border-transparent hover:border-red-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                    </button>
                </div>
            </div>
        </div>
    </>
  );
};

export default Sidebar;
