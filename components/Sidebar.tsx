
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Settings, LogOut, Hexagon, BrainCircuit, Wallet, Map, CalendarDays, Megaphone, X, PieChart, PackageCheck, Layers, Link2, Container, Factory, Calculator } from 'lucide-react';
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
    { id: 'dashboard', label: '总览仪表盘', subLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'intelligence', label: '智脑实验室', subLabel: 'AI Intelligence', icon: BrainCircuit, highlight: true },
    { id: 'inventory', label: '智能备货', subLabel: 'Inventory', icon: PackageCheck },
    { id: 'calculator', label: '智能计算中心', subLabel: 'Tools & Calc', icon: Calculator }, 
    { id: 'finance', label: '财务资金', subLabel: 'Finance', icon: Wallet },
    { id: 'analytics', label: '数据分析', subLabel: 'Analytics', icon: PieChart }, 
    { id: 'tracking', label: '物流追踪', subLabel: 'Tracking', icon: Map },
    { id: 'calendar', label: '运营日历', subLabel: 'Calendar', icon: CalendarDays },
    { id: 'orders', label: '订单履约', subLabel: 'Orders', icon: ShoppingCart },
    { id: 'marketing', label: '营销投放', subLabel: 'Marketing', icon: Megaphone },
    { id: 'customers', label: '客户管理', subLabel: 'CRM', icon: Users },
    { id: 'suppliers', label: '供应商管理', subLabel: 'Suppliers', icon: Factory },
    { id: 'integrations', label: '店铺集成', subLabel: 'Integrations', icon: Link2 },
    { id: 'settings', label: '系统设置', subLabel: 'Settings', icon: Settings },
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
                className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-md"
                onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: false })}
            />
        )}

        {/* Sidebar Container */}
        <div className={`fixed lg:static inset-y-6 left-6 w-[280px] flex flex-col z-50 transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
            <div className="ios-glass-panel h-full flex flex-col p-5 rounded-3xl relative overflow-hidden">
                
                {/* Brand Header */}
                <div className="flex items-center gap-4 mb-6 px-2 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                        <Hexagon className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <div className="font-display font-bold text-2xl text-white tracking-wide leading-none">TANXING</div>
                        <div className="text-[10px] text-blue-400 font-mono tracking-[0.3em] mt-1.5 uppercase opacity-80">Quantum OS</div>
                    </div>
                    <button 
                        onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: false })}
                        className="lg:hidden ml-auto text-white/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none px-1 relative z-10">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        // @ts-ignore
                        const isHighlight = item.highlight;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id as Page)}
                                className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                                    isActive 
                                    ? 'text-white' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                            >
                                {/* Active State Background */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent border-l-2 border-blue-500 opacity-100"></div>
                                )}

                                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                
                                <div className="flex flex-col items-start relative z-10">
                                    <span className={`text-sm font-medium leading-none ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                                    <span className={`text-[9px] mt-1 font-mono tracking-wide uppercase ${isActive ? 'text-blue-300/70' : 'text-slate-600 group-hover:text-slate-500'}`}>{item.subLabel}</span>
                                </div>
                                
                                {isHighlight && !isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="pt-4 mt-auto border-t border-white/5 relative z-10">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-all text-xs font-bold border border-transparent hover:border-red-500/20 active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>断开连接 (Disconnect)</span>
                    </button>
                </div>
            </div>
        </div>
    </>
  );
};

export default Sidebar;
