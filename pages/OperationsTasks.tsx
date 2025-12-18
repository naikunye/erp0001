
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, Plus, Search, Filter, 
  User, MoreHorizontal, Calendar, ClipboardList, Zap, Sparkles, 
  Loader2, X, Save, Trash2, ArrowRight, ArrowLeft, Tag, Briefcase
} from 'lucide-react';
import { useTanxing } from '../context/TanxingContext';
import { Task } from '../types';

const OperationsTasks: React.FC = () => {
  const { state, dispatch, showToast } = useTanxing();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = state.tasks.filter(t => 
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

  const getProgressSpecs = (status: Task['status']) => {
      switch(status) {
          case 'todo': return { width: '15%', color: 'bg-slate-500', shadow: '' };
          case 'in_progress': return { width: '45%', color: 'bg-blue-500', shadow: 'shadow-[0_0_10px_#3b82f6]' };
          case 'review': return { width: '85%', color: 'bg-amber-500', shadow: 'shadow-[0_0_10px_#f59e0b]' };
          case 'done': return { width: '100%', color: 'bg-emerald-500', shadow: 'shadow-[0_0_10px_#10b981]' };
          default: return { width: '0%', color: 'bg-slate-700', shadow: '' };
      }
  };

  const handleMoveTask = (task: Task, direction: 'forward' | 'backward') => {
    const statusFlow: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];
    const currentIndex = statusFlow.indexOf(task.status);
    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < statusFlow.length) {
        const updatedTask = { ...task, status: statusFlow[nextIndex] };
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
        showToast(`任务已移至 ${statusFlow[nextIndex]}`, 'info');
    }
  };

  const handleAddNew = () => {
    const newTask: Task = {
        id: `T-${Date.now()}`,
        title: '',
        priority: 'medium',
        status: 'todo',
        assignee: '未分配',
        dueDate: new Date().toISOString().split('T')[0],
        category: 'procurement'
    };
    setEditingTask(newTask);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingTask || !editingTask.title) return;
    const exists = state.tasks.find(t => t.id === editingTask.id);
    if (exists) {
        dispatch({ type: 'UPDATE_TASK', payload: editingTask });
        showToast('任务更新成功', 'success');
    } else {
        dispatch({ type: 'ADD_TASK', payload: editingTask });
        showToast('新任务已创建', 'success');
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = (id: string) => {
      if (confirm('确定要删除此协作任务吗？')) {
          dispatch({ type: 'DELETE_TASK', payload: id });
          showToast('任务已撤销', 'info');
          setIsModalOpen(false);
      }
  };

  const renderColumn = (status: Task['status'], label: string) => (
    <div className="flex-1 min-w-[320px] flex flex-col gap-4">
      <div className="flex items-center justify-between px-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'todo' ? 'bg-slate-500' : status === 'in_progress' ? 'bg-blue-500' : status === 'review' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
          {label}
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            {filteredTasks.filter(t => t.status === status).length}
        </span>
      </div>
      
      <div className="flex flex-col gap-3 min-h-[600px] bg-white/2 rounded-2xl p-2 border border-white/5">
        {filteredTasks.filter(t => t.status === status).map(task => {
          const progress = getProgressSpecs(task.status);
          return (
            <div key={task.id} className="ios-glass-card p-4 hover:border-indigo-500/40 group relative animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)} uppercase tracking-tighter`}>
                    {task.priority}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {status !== 'todo' && <button onClick={() => handleMoveTask(task, 'backward')} className="p-1 hover:bg-white/10 rounded"><ArrowLeft className="w-3 h-3 text-slate-500"/></button>}
                    {status !== 'done' && <button onClick={() => handleMoveTask(task, 'forward')} className="p-1 hover:bg-white/10 rounded"><ArrowRight className="w-3 h-3 text-slate-500"/></button>}
                </div>
                </div>
                
                <h4 
                    onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
                    className="text-sm font-bold text-white mb-3 leading-snug cursor-pointer hover:text-indigo-400 transition-colors"
                >
                    {task.title}
                </h4>

                {/* Quantum Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Completion Profile</span>
                        <span className="text-[8px] font-mono font-bold text-indigo-400">{progress.width}</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                            className={`h-full transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${progress.color} ${progress.shadow}`}
                            style={{ width: progress.width }}
                        ></div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                    {task.assignee.charAt(0)}
                    </div>
                    <span className="text-[10px] text-slate-400">{task.assignee}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Calendar className="w-3 h-3"/> {task.dueDate}
                </div>
                </div>
            </div>
          );
        })}
        <button 
            onClick={handleAddNew}
            className="w-full py-3 border-2 border-dashed border-white/5 rounded-xl text-slate-600 hover:text-slate-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-xs flex items-center justify-center gap-1.5 group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform"/> 投递新任务
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-indigo-500" />
            运营协作中心 (Operations)
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-500"/> 双机实时协同已开启 • 变更即刻广播至全端
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
             <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
             <span className="text-[10px] font-bold text-indigo-300 uppercase">AI Task Optimizer Active</span>
        </div>
      </div>

      <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="在协作网格中搜索任务..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 w-80 transition-all"
          />
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
             <Filter className="w-3.5 h-3.5"/> 视图配置
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="flex gap-6 h-full min-w-[1300px] pb-6">
          {renderColumn('todo', '待处理队列 (Backlog)')}
          {renderColumn('in_progress', '正在执行 (Sprint)')}
          {renderColumn('review', '质量审核 (UAT)')}
          {renderColumn('done', '已归档 (Resolved)')}
        </div>
      </div>

      {/* Task Edit Modal */}
      {isModalOpen && editingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
              <div className="ios-glass-panel w-full max-w-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getPriorityColor(editingTask.priority)}`}>
                              <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-white">任务详细信息</h3>
                              <p className="text-[10px] text-slate-500 uppercase font-mono">{editingTask.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-slate-500"/></button>
                  </div>

                  <div className="p-6 space-y-5">
                      <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">任务标题</label>
                          <input 
                            value={editingTask.title} 
                            onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none" 
                            placeholder="描述需要协作的事项..."
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">优先级</label>
                              <select 
                                value={editingTask.priority} 
                                onChange={e => setEditingTask({...editingTask, priority: e.target.value as any})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                              >
                                  <option value="urgent">🔥 紧急 (Urgent)</option>
                                  <option value="high">🟠 重要 (High)</option>
                                  <option value="medium">🔵 普通 (Medium)</option>
                                  <option value="low">⚪ 低级 (Low)</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">业务领域</label>
                              <select 
                                value={editingTask.category} 
                                onChange={e => setEditingTask({...editingTask, category: e.target.value as any})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                              >
                                  <option value="procurement">📦 采购供应链</option>
                                  <option value="logistics">🚢 物流仓储</option>
                                  <option value="marketing">📣 营销增长</option>
                                  <option value="finance">💰 财务对账</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">负责人</label>
                              <div className="relative">
                                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                                  <input 
                                    value={editingTask.assignee} 
                                    onChange={e => setEditingTask({...editingTask, assignee: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 pl-10 text-sm text-white focus:border-indigo-500 outline-none" 
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 block">截止日期</label>
                              <input 
                                type="date" 
                                value={editingTask.dueDate} 
                                onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                              />
                          </div>
                      </div>
                  </div>

                  <div className="px-6 py-5 border-t border-white/10 bg-white/5 flex justify-between gap-3">
                      <button 
                        onClick={() => handleDelete(editingTask.id)}
                        className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/10 transition-all flex items-center gap-2"
                      >
                          <Trash2 className="w-4 h-4" /> 撤销任务
                      </button>
                      <div className="flex gap-3">
                          <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white text-xs font-bold transition-colors">取消</button>
                          <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/50 flex items-center gap-2 transition-all">
                              <Save className="w-4 h-4" /> 保存并广播
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OperationsTasks;
