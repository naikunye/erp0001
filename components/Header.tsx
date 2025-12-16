import React, { useState, useEffect } from 'react';
import { Bell, Search, X, Menu, ChevronDown, Command, CalendarDays, LogOut, Settings, User } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { dispatch, showToast } = useTanxing();

  const mockNotifications = [
      { id: 1, title: '库存紧急预警', desc: 'SKU: MA-001 库存不足 10 件', time: '10分钟前', type: 'alert' },
      { id: 2, title: '新订单提醒', desc: 'TikTok Shop 订单 #PO-8823', time: '1小时前', type: 'info' },
  ];

  useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
      if (confirm('确认退出系统？')) {
          window.location.reload();
      }
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 relative z-30">
      <div className="flex items-center gap-4">
        <button 
            className="lg:hidden p-2 text-white/60 hover:text-white"
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: true })}
        >
            <Menu className="w-6 h-6" />
        </button>

        <div>
            <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Clock Pill - Cross Border Context */}
        <div className="hidden xl:flex items-center gap-4 mr-2 text-xs font-mono text-white/50 bg-black/20 px-4 py-2 rounded-full border border-white/5">
            {/* US Date Format (Chinese) - Using US West as reference for date */}
            <div className="flex items-center gap-2 text-slate-300">
                <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentTime.toLocaleDateString('zh-CN', { timeZone: 'America/Los_Angeles', month: 'long', day: 'numeric', weekday: 'short' })}</span>
            </div>
            
            <div className="w-px h-3 bg-white/10"></div>

            {/* Beijing (Supply Chain) */}
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>北京 {currentTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div className="w-px h-3 bg-white/10"></div>

            {/* US West (LA) */}
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                <span>美西 {currentTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="w-px h-3 bg-white/10"></div>

            {/* US Central (Chicago) */}
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                <span>美中 {currentTime.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="w-px h-3 bg-white/10"></div>

            {/* US East (NY) */}
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>美东 {currentTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>

        {/* Search */}
        <div className="relative hidden lg:block group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/30 group-hover:text-white/70 transition-colors" />
          </div>
          <input
            type="text"
            readOnly
            placeholder="全局搜索 / AI 指令..."
            className="block w-64 pl-10 pr-12 py-2 rounded-xl bg-white/5 border border-white/5 text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all text-sm hover:bg-white/10 cursor-pointer"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
             <span className="text-[10px] font-bold text-white/30 font-mono border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex items-center space-x-4">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-all ${showNotifications ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#121217]"></span>
            </button>
            
            {showNotifications && (
                <div className="absolute top-16 right-20 w-80 ios-glass-card z-50 animate-in fade-in zoom-in-95 overflow-hidden shadow-2xl">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <span className="text-xs font-bold text-white/80">消息通知 (Notifications)</span>
                        <button onClick={() => setShowNotifications(false)}><X className="w-3.5 h-3.5 text-white/50 hover:text-white"/></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {mockNotifications.map(n => (
                            <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer last:border-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold ${n.type === 'alert' ? 'text-red-400' : 'text-blue-400'}`}>{n.title}</span>
                                    <span className="text-[9px] text-white/30">{n.time}</span>
                                </div>
                                <p className="text-[11px] text-white/60 leading-snug">{n.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* User Profile Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-white/5 transition-all border border-transparent ${showUserMenu ? 'bg-white/5 border-white/5' : 'hover:border-white/5'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                        AD
                    </div>
                    <div className="text-left hidden md:block">
                        <div className="text-xs font-bold text-white leading-none mb-0.5">管理员</div>
                        <div className="text-[9px] text-white/40 font-mono leading-none">ROOT</div>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                    <div className="absolute top-12 right-0 w-48 ios-glass-card z-50 animate-in fade-in zoom-in-95 overflow-hidden shadow-2xl">
                        <div className="p-2 space-y-1">
                            <button 
                                onClick={() => showToast('功能开发中', 'info')}
                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded flex items-center gap-2"
                            >
                                <User className="w-4 h-4" /> 个人资料
                            </button>
                            <button 
                                onClick={() => window.location.href = '/settings'}
                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" /> 系统设置
                            </button>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/10 rounded flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> 退出登录
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;