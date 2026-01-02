
import React from 'react';
import { 
    LayoutDashboard, Package, Wallet, BarChart3, 
    Truck, LogOut, Command, Settings,
    Sparkles, Users
} from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘' },
        { id: 'product_ai', icon: Sparkles, label: '视觉实验室', isNew: true },
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'inventory', icon: Package, label: '智能备货' },
        { id: 'logistics', icon: Truck, label: '全球物流' },
        { id: 'customers', icon: Users, label: '客户关系' },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'finance', icon: Wallet, label: '财务审计' },
        { id: 'analytics', icon: BarChart3, label: '数据洞察' },
      ]
    }
  ];

  return (
    <div className="w-[280px] h-full flex flex-col p-4 shrink-0 z-50">
        <div className="flex flex-col h-full bg-[#1c1c1e]/40 backdrop-blur-xl border border-white/10 rounded-[24px] p-4 shadow-2xl transition-all duration-500 hover:bg-[#1c1c1e]/60">
            {/* Header */}
            <div className="px-4 py-4 flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-lg shadow-white/10">
                    <Command className="w-4 h-4" strokeWidth={3} />
                </div>
                <div>
                  <h1 className="font-semibold text-[15px] tracking-tight text-white leading-none">Tanxing OS</h1>
                  <span className="text-[10px] font-mono text-white/40 font-medium tracking-wide">PRO v2.0</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-6 px-1">
                {menuGroups.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-3 mb-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em]">{group.title}</span>
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activePage === item.id;
                          return (
                              <button 
                                  key={item.id}
                                  onClick={() => onNavigate(item.id as Page)}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] transition-all duration-200 apple-btn ${
                                    isActive 
                                      ? 'bg-ios-blue text-white shadow-lg shadow-blue-500/20 font-medium' 
                                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                                  }`}
                              >
                                  <div className="flex items-center gap-3">
                                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-white/50 group-hover:text-white'} />
                                      <span className="text-[13px] tracking-tight">{item.label}</span>
                                  </div>
                                  {(item as any).isNew && !isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-ios-purple shadow-[0_0_8px_rgba(175,82,222,0.6)]"></span>
                                  )}
                              </button>
                          );
                      })}
                    </div>
                  </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="mt-2 pt-4 border-t border-white/5 space-y-1">
                 <button 
                    onClick={() => onNavigate('settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-200 text-white/60 hover:bg-white/5 hover:text-white apple-btn ${activePage === 'settings' ? 'bg-white/10 text-white' : ''}`}
                  >
                    <Settings size={18} strokeWidth={2} className="text-white/50" />
                    <span className="text-[13px] font-medium">系统设置</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default Sidebar;
