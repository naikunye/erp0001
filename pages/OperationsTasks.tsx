
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, PlayCircle, Plus, 
  Search, Filter, User, MoreHorizontal, Calendar, 
  ClipboardList, ArrowRight, Zap, Target, Sparkles, Loader2
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Task } from '../types';

const OperationsTasks: React.FC = () => {
  const { state, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'board' | 'list'>('board');
  
  // Mock Data for the new feature
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'T-1', title: 'SKU-MA001 紧急补货申请', priority: 'urgent', status: 'in_progress', assignee: '张伟', dueDate: '2023-11-05', relatedSku: 'MA-001', category: 'procurement' },
    { id: 'T-2', title: '美西仓库入库异常申诉', priority: 'high', status: 'todo', assignee: '李芳', dueDate: '2023-11-04', category: 'logistics' },
    { id: 'T-3', title: 'TikTok 圣诞周红人样品质检', priority: 'medium', status: 'review', assignee: '王博', dueDate: '2023-11-10', category: 'marketing' },
    { id: 'T-4', title: '核对十月退税资料', priority: 'low', status: 'todo', assignee: '财务-小陈', dueDate: '2023-11-15', category: 'finance' },
  ]);

  const stats = useMemo(() => ({
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  }), [tasks]);

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.assignee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const renderColumn = (status: Task['status'], label: string) => (
    <div className="flex-1 min-w-[300px] flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'todo' ? 'bg-slate-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
          {label}
        </h3>
        <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">{filteredTasks.filter(t => t.status === status).length}</span>
      </div>
      <div className="flex flex-col gap-3 min-h-[500px]">
        {filteredTasks.filter(t => t.status === status).map(task => (
          <div key={task.id} className="ios-glass-card p-4 hover:border-indigo-500/40 transition-all cursor-grab active:cursor-grabbing group">
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)} uppercase`}>
                {task.priority}
              </span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-3.5 h-3.5 text-slate-500"/></button>
            </div>
            <h4 className="text-sm font-bold text-white mb-3 leading-snug">{task.title}</h4>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                  {task.assignee.charAt(0)}
                </div>
                <span className="text-[10px] text-slate-500">{task.assignee}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Calendar className="w-3 h-3"/> {task.dueDate}
              </div>
            </div>
          </div>
        ))}
        <button className="w-full py-2 border-2 border-dashed border-white/5 rounded-xl text-slate-600 hover:text-slate-400 hover:border-white/10 hover:bg-white/5 transition-all text-xs flex items-center justify-center gap-1">
          <Plus className="w-3.5 h-3.5"/> 新增任务
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-indigo-500" />
            运营协同中心 (Operations)
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-500"/> 多人实时在线 • 智能优先级分配
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-xl border border-white/10">
           <div className="px-3 border-r border-white/10">
              <div className="text-[10px] text-slate-500 uppercase font-bold">紧急处理</div>
              <div className="text-lg font-black text-red-500 font-mono">{stats.urgent}</div>
           </div>
           <div className="px-3">
              <div className="text-[10px] text-slate-500 uppercase font-bold">待办总数</div>
              <div className="text-lg font-black text-white font-mono">{stats.todo}</div>
           </div>
           <button onClick={() => showToast('AI 任务分配已就绪', 'info')} className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/50">
             <Sparkles className="w-3.5 h-3.5"/> AI 自动分单
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/10">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="搜索任务、负责人..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
             <button onClick={() => setActiveView('board')} className={`px-4 py-1 rounded text-[10px] font-bold transition-all ${activeView === 'board' ? 'bg-white/10 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>看板 (Board)</button>
             <button onClick={() => setActiveView('list')} className={`px-4 py-1 rounded text-[10px] font-bold transition-all ${activeView === 'list' ? 'bg-white/10 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>列表 (List)</button>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
             <Filter className="w-3.5 h-3.5"/> 筛选
           </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-[1200px]">
          {renderColumn('todo', '待处理 (To Do)')}
          {renderColumn('in_progress', '进行中 (In Progress)')}
          {renderColumn('review', '待审核 (Review)')}
          {renderColumn('done', '已结项 (Done)')}
        </div>
      </div>
    </div>
  );
};

export default OperationsTasks;
