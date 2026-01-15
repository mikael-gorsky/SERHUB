
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Loader2, 
  X, 
  Save, 
  ChevronRight,
  CheckCircle2,
  Plus,
  Fingerprint
} from 'lucide-react';
import { TaskService } from '../services/TaskService';
import { SectionService } from '../services/SectionService';
import { UserService } from '../services/UserService';
import { Task, User, Section } from '../types';
import UserAvatar from './UserAvatar';

const TasksManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  
  // Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksData, usersData, sectionsData] = await Promise.all([
        TaskService.getAll(),
        UserService.getAll(),
        SectionService.getAll()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
      setSections(sectionsData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (progress: number) => {
    if (progress === 100) return { label: 'Done', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' };
    if (progress < 25) return { label: 'Launching', color: 'text-slate-500 bg-slate-50 border-slate-100', bar: 'bg-slate-400' };
    if (progress < 50) return { label: 'Progressing', color: 'text-hit-blue bg-blue-50 border-blue-100', bar: 'bg-hit-blue' };
    if (progress < 75) return { label: 'Polishing', color: 'text-[#d97706] bg-amber-50 border-amber-100', bar: 'bg-hit-accent' };
    return { label: 'Delivering', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' };
  };

  const getStepStyles = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return "bg-white border-transparent";
    const num = parseInt(section.number.replace(/[^0-9]/g, ''));
    switch(num) {
      case 1: return "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50";
      case 2: return "bg-gradient-to-br from-emerald-50 to-amber-50 text-hit-blue border-emerald-100 shadow-emerald-100/30";
      case 3: return "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50";
      case 4: return "bg-gradient-to-br from-amber-50 to-rose-50 text-hit-blue border-amber-100 shadow-amber-100/30";
      case 5: return "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50";
      default: return "bg-gray-50 text-gray-700 border-gray-100 shadow-gray-100/50";
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSection = sectionFilter === 'All' || task.sectionId === sectionFilter;
      const matchesOwner = ownerFilter === 'All' || task.assignedTo === ownerFilter;
      return matchesSearch && matchesSection && matchesOwner;
    });
  }, [tasks, searchTerm, sectionFilter, ownerFilter]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setIsSaving(true);
    try {
      await TaskService.updateTask(editingTask);
      setEditingTask(null);
      setIsCreating(false);
      await fetchData();
    } catch (error) {
      alert("Failed to save task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      sectionId: sections[0]?.id || '',
      assignedTo: users[0]?.id || 'u-mg', 
      author: 'Manual',
      dueDate: new Date().toISOString().split('T')[0],
      duration: 7,
      progress: 0
    };
    setEditingTask(newTask);
    setIsCreating(true);
  };

  const formatMMDD = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}-${d}`;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" />
        <span>Syncing Institutional Tasks...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-8 bg-transparent">
      <div className="w-80 shrink-0 flex flex-col gap-6 overflow-y-auto pb-10">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 shrink-0">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Filter by Step</h3>
          <div className="space-y-2">
            <button onClick={() => setSectionFilter('All')} className={`w-full text-left p-4 rounded-2xl text-sm font-black transition-all ${sectionFilter === 'All' ? 'bg-hit-dark text-white shadow-xl shadow-hit-dark/10' : 'text-gray-500 hover:bg-gray-50'}`}>All Project Steps</button>
            <div className="h-px bg-gray-100 my-2"></div>
            {sections.map(s => (
              <button key={s.id} onClick={() => setSectionFilter(s.id)} className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex flex-col gap-1 border border-transparent ${sectionFilter === s.id ? 'bg-blue-50 text-hit-blue border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">{s.number}</span>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 shrink-0">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Filter by Assigned</h3>
          <div className="space-y-2">
            <button onClick={() => setOwnerFilter('All')} className={`w-full text-left p-4 rounded-2xl text-sm font-black transition-all ${ownerFilter === 'All' ? 'bg-hit-blue text-white shadow-xl shadow-hit-blue/10' : 'text-gray-500 hover:bg-gray-50'}`}>All Task Owners</button>
            <div className="h-px bg-gray-100 my-2"></div>
            {users.map(u => (
              <button key={u.id} onClick={() => setOwnerFilter(u.id)} className={`w-full text-left p-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 border border-transparent ${ownerFilter === u.id ? 'bg-teal-50 text-hit-dark border-teal-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <UserAvatar name={u.name} size="sm" />
                <span className="truncate">{u.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center gap-6">
          <button 
            onClick={handleCreateTask} 
            className="w-12 h-12 shrink-0 flex items-center justify-center bg-hit-blue text-white rounded-2xl shadow-lg shadow-hit-blue/20 hover:bg-hit-dark transition-all active:scale-95"
            title="Create New Task"
          >
            <Plus size={24} />
          </button>
          
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-hit-blue transition-all" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-10">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => {
              // Resolve assignedTo ID to actual User Name
              const assignee = users.find(u => u.id === task.assignedTo);
              const nameToDisplay = assignee?.name || (task.assignedTo === 'u-mg' ? 'Mikael Gorsky' : 'Institutional User');
              
              const status = getStatusLabel(task.progress);
              const isDone = task.progress === 100;
              const stepStyles = getStepStyles(task.sectionId);

              return (
                <div key={task.id} onClick={() => { setEditingTask({...task}); setIsCreating(false); }} className={`p-6 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer flex items-center gap-6 ${stepStyles} ${isDone ? 'opacity-70' : ''}`}>
                  <div className="w-16 shrink-0 text-center">
                    <span className="bg-hit-dark text-white text-[10px] font-black px-2 py-1 rounded-md uppercase group-hover:bg-hit-blue transition-colors">
                      {sections.find(s => s.id === task.sectionId)?.number.split(' ')[1] || '??'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-lg font-black group-hover:text-hit-blue transition-colors truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</h4>
                    <p className={`text-sm font-medium truncate ${isDone ? 'text-gray-400' : 'text-gray-500'}`}>{task.description}</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">
                      <Fingerprint size={12} className="text-gray-300" /> Author: {task.author}
                    </div>
                  </div>
                  <div className="flex items-center gap-12 shrink-0">
                    <div className="w-16 flex flex-col items-center">
                       <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Due</span>
                       <span className="text-sm font-black text-gray-800">{formatMMDD(task.dueDate)}</span>
                    </div>
                    <div className="w-56 flex items-center gap-4">
                      <UserAvatar name={nameToDisplay} size="md" className="border-2 border-white/50 shadow-sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate tracking-tight">{nameToDisplay}</p>
                        <p className="text-[9px] font-black text-hit-blue uppercase tracking-widest opacity-60">Task Owner</p>
                      </div>
                    </div>
                    <div className="w-36">
                       <div className={`text-center py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white shadow-sm ${status.color}`}>
                          {status.label}
                       </div>
                    </div>
                    <div className="w-10 flex justify-end">
                       <ChevronRight className="text-gray-200 group-hover:text-hit-blue transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center text-gray-400 bg-white rounded-[2rem] shadow-sm">
               <CheckCircle2 size={64} className="text-gray-100 mb-6" />
               <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight">Empty Workspace</h3>
               <p className="text-sm max-w-xs mt-2 font-medium">No tasks found matching current filters.</p>
            </div>
          )}
        </div>
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-hit-dark/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-50 h-screen w-full max-w-4xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="bg-white px-10 py-6 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                 <button onClick={() => setEditingTask(null)} className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-hit-blue transition-all"><X size={24} /></button>
                 <div className="h-10 w-px bg-gray-100"></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{isCreating ? 'Create Task' : 'Edit Task'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">ID: {editingTask.id}</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button type="button" onClick={() => setEditingTask(null)} className="py-3 px-8 bg-white border border-gray-200 rounded-2xl text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Discard</button>
                 <button onClick={handleUpdateTask} disabled={isSaving} className="py-3 px-8 bg-hit-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-hit-dark transition-all flex items-center gap-2 shadow-xl shadow-hit-blue/20">
                   {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                   {isCreating ? 'Save Task' : 'Update Task'}
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
               <div className="max-w-2xl mx-auto space-y-8">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Title</label>
                    <input type="text" required placeholder="Institutional Task Title" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-lg font-black text-gray-900 focus:ring-2 focus:ring-hit-blue transition-all" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                    <textarea rows={4} required placeholder="Detailed task objectives..." value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-hit-blue transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Step</label>
                      <select value={editingTask.sectionId} onChange={e => setEditingTask({...editingTask, sectionId: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue">
                        {sections.map(s => <option key={s.id} value={s.id}>{s.number}: {s.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Owner (Identity)</label>
                      <select value={editingTask.assignedTo} onChange={e => setEditingTask({...editingTask, assignedTo: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Author</label>
                      <input type="text" value={editingTask.author} onChange={e => setEditingTask({...editingTask, author: e.target.value})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 focus:ring-2 focus:ring-hit-blue" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Deadline</label>
                      <input type="date" required value={editingTask.dueDate} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Duration (Days)</label>
                      <input type="number" required value={editingTask.duration} onChange={e => setEditingTask({...editingTask, duration: parseInt(e.target.value)})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue" />
                    </div>
                 </div>
                 <div className="bg-white rounded-[2rem] p-10 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress: {editingTask.progress}%</label>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getStatusLabel(editingTask.progress).color}`}>{getStatusLabel(editingTask.progress).label}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                        <div className={`h-full transition-all duration-500 ${getStatusLabel(editingTask.progress).bar}`} style={{width: `${editingTask.progress}%`}}></div>
                    </div>
                    <input type="range" min="0" max="100" value={editingTask.progress} onChange={e => setEditingTask({...editingTask, progress: parseInt(e.target.value)})} className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-hit-blue" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksManager;
