
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileText, 
  Plus,
  Loader2,
  Calendar, Edit2,
  LayoutDashboard, CheckSquare, 
  User as UserIcon,
  ChevronRight, X, Save,
  Fingerprint
} from 'lucide-react';
import { SectionService } from '../services/SectionService';
import { TaskService } from '../services/TaskService';
import { DocumentService } from '../services/DocumentService';
import { UserService } from '../services/UserService';
import { Section, Task, Document, User } from '../types';
import UserAvatar from './UserAvatar';
import { getProgressStatus, getProgressChartColor } from '../lib/progressUtils';

const EditStep = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'docs'>('summary');
  
  const [section, setSection] = useState<Section | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Task Editing/Creation
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  useEffect(() => {
    const fetchSectionData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [sectionData, allSections, allUsers] = await Promise.all([
          SectionService.getById(id),
          SectionService.getAll(),
          UserService.getAll()
        ]);
        
        setSection(sectionData || null);
        setSections(allSections);
        setUsers(allUsers);

        if (sectionData) {
          const [tasksData, docsData] = await Promise.all([
            TaskService.getBySectionId(id),
            DocumentService.getBySectionId(id)
          ]);
          setTasks(tasksData);
          setDocs(docsData);
        }
      } catch (error) {
        console.error("Error fetching section details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSectionData();
  }, [id]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setIsSavingTask(true);
    try {
      await TaskService.updateTask(editingTask);
      setEditingTask(null);
      setIsCreating(false);
      if (id) {
        const updatedTasks = await TaskService.getBySectionId(id);
        setTasks(updatedTasks);
      }
    } catch (error) {
      alert("Failed to save task.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      sectionId: id || 'step1',
      assignedTo: users[0]?.id || 'u-mg', 
      author: 'Manual',
      dueDate: section?.nextDeadline || new Date().toISOString().split('T')[0],
      duration: 7,
      progress: 0
    };
    setEditingTask(newTask);
    setIsCreating(true);
  };

  // Use centralized progress status utility
  const getStatusLabel = (progress: number) => {
    const status = getProgressStatus(progress, false);
    return {
      label: status.label,
      color: status.color,
      gradient: status.gradient,
      hex: getProgressChartColor(progress)
    };
  };

  const stepMinProgress = tasks.length > 0 ? Math.min(...tasks.map(t => t.progress)) : 0;
  const currentStepStatus = getStatusLabel(stepMinProgress);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 text-hit-blue">
      <Loader2 className="animate-spin mr-3" size={32} /> 
      <span className="font-black uppercase tracking-widest text-sm">Syncing Step Workspace...</span>
    </div>
  );

  if (!section) return <div className="p-8 text-center font-bold">Step not found</div>;

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear()).slice(-2);
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-6">
            <Link to="/sections" className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all hover:text-hit-blue">
              <ArrowLeft size={24} />
            </Link>
            <div className="h-10 w-px bg-gray-100"></div>
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-hit-dark text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
                  {section.number}
                </span>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{section.title}</h1>
              </div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${currentStepStatus.color.split(' ')[0]}`}>Status: {currentStepStatus.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl">
            {[
              { id: 'summary', icon: LayoutDashboard, label: 'Summary' },
              { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
              { id: 'docs', icon: FileText, label: 'Evidence' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === tab.id 
                  ? 'bg-hit-blue text-white shadow-lg shadow-hit-blue/20' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-[44px]"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'summary' && (
            <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-500">
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Executive Readiness Gauge</h3>
                  <div className="flex flex-col md:flex-row items-center gap-12">
                     <div className="relative w-48 h-48 shrink-0">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                           <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                           <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * stepMinProgress) / 100} className={`transition-all duration-1000 ${currentStepStatus.color.split(' ')[0].replace('text-', 'text-opacity-100 text-')}`} style={{color: currentStepStatus.hex}} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl font-black text-gray-900">{stepMinProgress}%</span>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bottleneck</span>
                        </div>
                     </div>
                     <div className="flex-1">
                        <p className="text-gray-500 leading-relaxed font-medium mb-8 text-lg">{section.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Assigned Tasks</span>
                              <span className="text-xl font-black text-gray-800">{section.tasksOpen} Remaining</span>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Target Completion</span>
                              <span className="text-xl font-black text-hit-blue">{formatShortDate(section.nextDeadline)}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Step Checklist</h2>
                  <p className="text-gray-500 font-medium">Task list for {section.number}.</p>
                </div>
                <button onClick={handleAddTask} className="flex items-center gap-2 bg-hit-blue text-white w-12 h-12 justify-center rounded-2xl hover:bg-hit-dark transition-all shadow-xl shadow-hit-blue/20">
                  <Plus size={24} />
                </button>
              </div>

              <div className="grid gap-4">
                {tasks.length > 0 ? tasks.map(task => {
                  const status = getStatusLabel(task.progress);
                  const isDone = task.progress === 100;
                  
                  // Identity resolution using 'assignedTo' field
                  const assignee = users.find(u => u.id === task.assignedTo);
                  const ownerName = assignee?.name || (task.assignedTo === 'u-mg' ? 'Mikael Gorsky' : 'Institutional User');

                  return (
                    <div key={task.id} onClick={() => { setEditingTask({...task}); setIsCreating(false); }} className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer flex items-center gap-6 ${isDone ? 'opacity-70' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className={`text-lg font-black group-hover:text-hit-blue transition-colors ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</h4>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${status.color}`}>
                             {status.label} ({task.progress}%)
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed font-medium mb-4 line-clamp-2 ${isDone ? 'text-gray-400' : 'text-gray-500'}`}>{task.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <Calendar size={14} className="text-gray-300" /> Deadline: {formatShortDate(task.dueDate)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <UserIcon size={14} className="text-gray-300" /> {ownerName}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-hit-blue/60 uppercase tracking-widest">
                              <Fingerprint size={12} /> Author: {task.author}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-hit-blue rounded-xl transition-all"><Edit2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-gray-200 group-hover:text-hit-blue transition-colors">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="bg-white rounded-3xl p-20 text-center border-3 border-dashed border-gray-100">
                    <CheckSquare size={64} className="mx-auto text-gray-100 mb-6" />
                    <p className="text-xl font-bold text-gray-300">No active tasks</p>
                  </div>
                )}
              </div>
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
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{isCreating ? 'Add Task' : 'Edit Task'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">ID: {editingTask.id}</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button type="button" onClick={() => setEditingTask(null)} className="py-3 px-8 bg-white border border-gray-200 rounded-2xl text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Discard</button>
                 <button onClick={handleUpdateTask} disabled={isSavingTask} className="py-3 px-8 bg-hit-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-hit-dark transition-all flex items-center gap-2 shadow-xl shadow-hit-blue/20">
                   {isSavingTask ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                   {isCreating ? 'Create Task' : 'Update Task'}
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
               <div className="max-w-2xl mx-auto space-y-8">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Title</label>
                    <input type="text" required value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-lg font-black text-gray-900 focus:ring-2 focus:ring-hit-blue transition-all" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                    <textarea rows={4} required value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-hit-blue transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Step</label>
                      <select value={editingTask.sectionId} onChange={e => setEditingTask({...editingTask, sectionId: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4">
                        {sections.map(s => <option key={s.id} value={s.id}>{s.number}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Owner</label>
                      <select value={editingTask.assignedTo} onChange={e => setEditingTask({...editingTask, assignedTo: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Author</label>
                      <input type="text" value={editingTask.author} onChange={e => setEditingTask({...editingTask, author: e.target.value})} className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Deadline</label>
                      <input type="date" required value={editingTask.dueDate} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Duration (Days)</label>
                      <input type="number" required value={editingTask.duration} onChange={e => setEditingTask({...editingTask, duration: parseInt(e.target.value)})} className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4" />
                    </div>
                 </div>
                 <div className="bg-white rounded-[2rem] p-10 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress: {editingTask.progress}%</label>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusLabel(editingTask.progress).color}`}>{getStatusLabel(editingTask.progress).label}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                        <div className="h-full transition-all duration-500 rounded-full" style={{width: `${editingTask.progress}%`, background: getStatusLabel(editingTask.progress).gradient}}></div>
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

export default EditStep;
