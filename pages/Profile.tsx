
import React, { useState } from 'react';
import { User, Mail, Shield, Key, Bell, Globe, Camera, Save, LogOut } from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';

const Profile: React.FC = () => {
  const { state, showToast } = useTanxing();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '管理员',
    email: 'admin@tanxing.com',
    role: '系统管理员',
    language: '简体中文',
    timezone: 'UTC+8 (Beijing)',
    notifications: true
  });

  const handleSave = () => {
    setIsEditing(false);
    showToast('个人资料已更新', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">个人中心 (Account Profile)</h2>
          <p className="text-sm text-slate-500 mt-1">管理您的账号设置与个性化偏好</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          {isEditing ? '保存修改' : '编辑资料'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Avatar & Identity */}
        <div className="md:col-span-1 space-y-6">
          <div className="ios-glass-card p-8 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-4 ring-white/10 group-hover:ring-indigo-500/50 transition-all">
                AD
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mt-4">{profile.name}</h3>
            <p className="text-sm text-slate-500 font-mono mt-1 uppercase tracking-widest">{profile.role}</p>
            <div className="mt-6 w-full pt-6 border-t border-white/5 space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <Mail className="w-4 h-4" />
                {profile.email}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <Globe className="w-4 h-4" />
                {profile.timezone}
              </div>
            </div>
          </div>

          <div className="ios-glass-card p-4">
            <button className="w-full py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20">
              <LogOut className="w-4 h-4" /> 退出当前登录
            </button>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="ios-glass-card p-6">
            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> 基本信息
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">真实姓名</label>
                <input 
                  disabled={!isEditing}
                  type="text" 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none disabled:opacity-50" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">电子邮箱</label>
                <input 
                  disabled={!isEditing}
                  type="email" 
                  value={profile.email} 
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none disabled:opacity-50" 
                />
              </div>
            </div>
          </div>

          <div className="ios-glass-card p-6">
            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" /> 安全设置
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <div className="text-sm font-bold text-white">两步验证 (2FA)</div>
                  <div className="text-xs text-slate-500 mt-0.5">增加账号安全等级</div>
                </div>
                <button className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/30">已开启</button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <div className="text-sm font-bold text-white">修改登录密码</div>
                  <div className="text-xs text-slate-500 mt-0.5">建议定期更换复杂密码</div>
                </div>
                <button className="px-3 py-1.5 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/10 hover:bg-white/10">修改</button>
              </div>
            </div>
          </div>

          <div className="ios-glass-card p-6">
            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" /> 消息偏好
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">系统库存报警通知</span>
                <input 
                  type="checkbox" 
                  checked={profile.notifications} 
                  onChange={e => setProfile({...profile, notifications: e.target.checked})}
                  className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 relative transition-all cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
