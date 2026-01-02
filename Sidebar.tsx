
import React from 'react';
import { 
    LayoutDashboard, Package, Wallet, BarChart3, 
    Truck, LogOut, Command, Settings,
    Sparkles, Users
} from 'lucide-react';
import { Page } from './types';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const menuGroups = [
    {
      title: '概览',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘' },
        { id: 'product_ai', icon: Sparkles, label: '视觉实验室', isNew: true },
      ]
    },
    {
      title: '业务执行',
      items: [
        { id: 'inventory', icon: Package, label: '智能备货' },
        { id: 'logistics', icon: Truck, label: '全球物流' },
        { id: 'customers', icon: Users, label: '客户关系' },
      ]
    },
    {
      title: '智能审计',
      items: [
        { id: 'finance', icon: Wallet, label: '财务矩阵' },
        { id: 'analytics', icon: BarChart3, label: '数据洞察' },
      ]
    }
  ];

  return (
    <div className="w-[280px] h-full flex flex-col p-6 shrink-0 z-50">
        <div className="flex flex-col h-full ios-glass squircle-lg p-5">
            {/* Header */}
            <div className="px-3 py-4 flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <Command className="w-5 h-5 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="font-bold text-[17px] tracking-tight text-white leading-none">探行 OS</h1>
                  <span className="text-[10px] font-mono text-white/30 font-bold tracking-widest uppercase">Intelligent ERP</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto no-scrollbar space-y-9">
                {menuGroups.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-4 mb-3">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{group.title}</span>
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activePage === item.id;
                          return (
                              <button 
                                  key={item.id}
                                  onClick={() => onNavigate(item.id as Page)}
                                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 apple-tap ${
                                    isActive 
                                      ? 'bg-ios-blue text-white shadow-xl shadow-blue-500/20' 
                                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                                  }`}
                              >
                                  <div className="flex items-center gap-4">
                                      <Icon size={19} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-white/40'} />
                                      <span className="text-[14px] font-medium tracking-tight">{item.label}</span>
                                  </div>
                                  {(item as any).isNew && !isActive && (
                                    <span className="w-2 h-2 rounded-full bg-ios-purple shadow-[0_0_10px_rgba(175,82,222,0.8)]"></span>
                                  )}
                              </button>
                          );
                      })}
                    </div>
                  </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                 <button 
                    onClick={() => onNavigate('settings')}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-white/50 hover:bg-white/5 hover:text-white apple-tap ${activePage === 'settings' ? 'bg-white/10 text-white' : ''}`}
                  >
                    <Settings size={19} strokeWidth={2} className="text-white/30" />
                    <span className="text-[14px] font-medium">系统设置</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default Sidebar;
