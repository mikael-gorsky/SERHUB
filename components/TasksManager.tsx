
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  X,
  Save,
  ChevronRight,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Users,
  Circle,
  PlayCircle
} from 'lucide-react';
import { TaskService } from '../services/TaskService';
import { SectionService } from '../services/SectionService';
import { UserService, profileToUser } from '../services/UserService';
import { Task, Profile, Section } from '../types';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import { supabase, isConfigured } from '../lib/supabase';

interface TaskFormData {
  id?: string;
  title: string;
  description: string;
  section_id: string;
  owner_id: string;
  supervisor_id: string;
  status: number;
  blocked: boolean;
  blocked_reason: string;
  start_date: string;
  due_date: string;
  collaborator_ids: string[];
}

const TasksManager = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<'All' | 'NotStarted' | 'InProgress'>('InProgress');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<TaskFormData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksData, profilesData, sectionsData] = await Promise.all([
        TaskService.getAll(),
        UserService.getAll(),
        SectionService.getAll()
      ]);
      setTasks(tasksData);
      setProfiles(profilesData);
      setSections(sectionsData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (progress: number, blocked: boolean) => {
    if (blocked) return { label: 'Blocked', color: 'text-red-600 bg-red-50 border-red-100', bar: 'bg-red-500' };
    if (progress === 100) return { label: 'Done', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' };
    // Progress bar colors: yellow (0-25) -> yellow-green (25-50) -> bright green (50-75) -> red-green (75-100)
    if (progress < 25) return { label: 'Starting', color: 'text-yellow-600 bg-yellow-50 border-yellow-100', bar: 'bg-yellow-400' };
    if (progress < 50) return { label: 'In Progress', color: 'text-lime-600 bg-lime-50 border-lime-100', bar: 'bg-lime-500' };
    if (progress < 75) return { label: 'Advancing', color: 'text-green-600 bg-green-50 border-green-100', bar: 'bg-green-500' };
    return { label: 'Finishing', color: 'text-orange-600 bg-orange-50 border-orange-100', bar: 'bg-orange-500' };
  };

  const getStepStyles = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return "bg-white border-transparent";

    // Special styling for Organizational Tasks section
    if (section.number === 'Org' || section.title.toLowerCase().includes('organizational')) {
      return "bg-purple-50 text-purple-700 border-purple-100 shadow-purple-100/50";
    }

    const num = parseInt(section.number.replace(/[^0-9]/g, ''));
    switch(num) {
      case 0: return "bg-sky-50 text-sky-700 border-sky-100 shadow-sky-100/50"; // Executive Summary
      case 1: return "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50";
      case 2: return "bg-gradient-to-br from-emerald-50 to-amber-50 text-hit-blue border-emerald-100 shadow-emerald-100/30";
      case 3: return "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50";
      case 4: return "bg-gradient-to-br from-amber-50 to-rose-50 text-hit-blue border-amber-100 shadow-amber-100/30";
      case 5: return "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50";
      default: return "bg-gray-50 text-gray-700 border-gray-100 shadow-gray-100/50";
    }
  };

  const isOrgSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.number === 'Org' || section?.title.toLowerCase().includes('organizational');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgress = progressFilter === 'All' ||
                             (progressFilter === 'NotStarted' && task.status === 0) ||
                             (progressFilter === 'InProgress' && task.status > 0);
      const matchesSection = sectionFilter === 'All' || task.section_id === sectionFilter;
      const matchesOwner = ownerFilter === 'All' || task.owner_id === ownerFilter;
      return matchesSearch && matchesProgress && matchesSection && matchesOwner;
    });
  }, [tasks, searchTerm, progressFilter, sectionFilter, ownerFilter]);

  const orgTasks = useMemo(() => filteredTasks.filter(t => isOrgSection(t.section_id)), [filteredTasks, sections]);
  const reportTasks = useMemo(() => filteredTasks.filter(t => !isOrgSection(t.section_id)), [filteredTasks, sections]);

  const openCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setFormData({
      title: '',
      description: '',
      section_id: sections[0]?.id || '',
      owner_id: currentUser?.id || profiles[0]?.id || '',
      supervisor_id: '',
      status: 0,
      blocked: false,
      blocked_reason: '',
      start_date: today,
      due_date: nextWeek,
      collaborator_ids: []
    });
    setIsCreating(true);
    setShowModal(true);
  };

  const openEditModal = async (task: Task) => {
    // Fetch collaborators for this task
    let collaboratorIds: string[] = [];
    if (isConfigured && supabase) {
      const { data } = await supabase
        .from('serhub_task_collaborators')
        .select('profile_id')
        .eq('task_id', task.id);
      collaboratorIds = data?.map(c => c.profile_id) || [];
    }

    setFormData({
      id: task.id,
      title: task.title,
      description: task.description || '',
      section_id: task.section_id,
      owner_id: task.owner_id,
      supervisor_id: task.supervisor_id || '',
      status: task.status,
      blocked: task.blocked,
      blocked_reason: task.blocked_reason || '',
      start_date: task.start_date,
      due_date: task.due_date,
      collaborator_ids: collaboratorIds
    });
    setIsCreating(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        section_id: formData.section_id,
        owner_id: formData.owner_id,
        supervisor_id: formData.supervisor_id || null,
        status: formData.status,
        blocked: formData.blocked,
        blocked_reason: formData.blocked ? formData.blocked_reason : null,
        start_date: formData.start_date,
        due_date: formData.due_date
      };

      let taskId: string;

      if (isCreating) {
        const created = await TaskService.create(taskData);
        if (!created) throw new Error('Failed to create task');
        taskId = created.id;
      } else {
        await TaskService.update(formData.id!, taskData);
        taskId = formData.id!;
      }

      // Update collaborators
      if (isConfigured && supabase) {
        // Remove existing collaborators
        await supabase
          .from('serhub_task_collaborators')
          .delete()
          .eq('task_id', taskId);

        // Add new collaborators
        if (formData.collaborator_ids.length > 0) {
          const collaboratorInserts = formData.collaborator_ids.map(profileId => ({
            task_id: taskId,
            profile_id: profileId
          }));
          await supabase
            .from('serhub_task_collaborators')
            .insert(collaboratorInserts);
        }
      }

      setShowModal(false);
      setFormData(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert("Failed to save task.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProfileName = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
  };

  const toggleCollaborator = (profileId: string) => {
    if (!formData) return;
    const ids = formData.collaborator_ids;
    if (ids.includes(profileId)) {
      setFormData({ ...formData, collaborator_ids: ids.filter(id => id !== profileId) });
    } else {
      setFormData({ ...formData, collaborator_ids: [...ids, profileId] });
    }
  };

  // Get first line of description (up to first period or newline)
  const getFirstLine = (text: string | null | undefined) => {
    if (!text) return '';
    const firstLine = text.split(/[.\n]/)[0];
    return firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
  };

  const renderTaskCard = (task: Task) => {
    const ownerName = getProfileName(task.owner_id);
    const status = getStatusLabel(task.status, task.blocked);
    const isDone = task.status === 100;
    const stepStyles = getStepStyles(task.section_id);
    const section = sections.find(s => s.id === task.section_id);
    const descriptionLine = getFirstLine(task.description);

    return (
      <div
        key={task.id}
        onClick={() => openEditModal(task)}
        className={`p-5 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer ${stepStyles} ${isDone ? 'opacity-70' : ''}`}
      >
        {/* Top Row: Section badge, Title, Due date, Owner */}
        <div className="flex items-center gap-5">
          <div className="w-14 shrink-0 text-center">
            <span className="bg-hit-dark text-white text-[9px] font-black px-2 py-1 rounded-md uppercase group-hover:bg-hit-blue transition-colors">
              {section?.number || '??'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-base font-black group-hover:text-hit-blue transition-colors truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </h4>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="w-16 text-center">
              <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Due</span>
              <span className="text-sm font-black text-gray-800">{formatDate(task.due_date)}</span>
            </div>
            <div className="w-40 flex items-center gap-2">
              <UserAvatar name={ownerName} size="sm" className="border-2 border-white/50 shadow-sm" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{ownerName}</p>
                <p className="text-[8px] font-black text-hit-blue uppercase tracking-wider opacity-60">Owner</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-200 group-hover:text-hit-blue transition-colors" />
          </div>
        </div>

        {/* Description Line */}
        {descriptionLine && (
          <p className={`text-sm font-medium mt-2 ml-[76px] ${isDone ? 'text-gray-400' : 'text-gray-500'}`}>
            {descriptionLine}
          </p>
        )}

        {/* Blocked Warning */}
        {task.blocked && (
          <div className="flex items-center gap-2 text-xs text-red-600 mt-2 ml-[76px]">
            <AlertTriangle size={12} />
            <span className="font-bold">Blocked: {task.blocked_reason}</span>
          </div>
        )}

        {/* Progress Bar Row */}
        <div className="flex items-center gap-4 mt-3 ml-[76px]">
          <div className="flex-1 max-w-xs">
            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden border border-black/5">
              <div
                className={`h-full transition-all duration-500 ${status.bar}`}
                style={{ width: `${task.status}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-600">{task.status}%</span>
            <div className={`text-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border bg-white shadow-sm ${status.color}`}>
              {status.label}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Tasks...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-8 bg-transparent">
      {/* Sidebar Filters */}
      <div className="w-80 shrink-0 flex flex-col gap-6 overflow-y-auto pb-10">
        {/* Progress Filter */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 shrink-0">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Filter by Progress</h3>
          <div className="space-y-2">
            <button
              onClick={() => setProgressFilter('All')}
              className={`w-full text-left p-4 rounded-2xl text-sm font-black transition-all ${progressFilter === 'All' ? 'bg-gray-800 text-white shadow-xl shadow-gray-800/10' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setProgressFilter('NotStarted')}
              className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 border border-transparent ${progressFilter === 'NotStarted' ? 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Circle size={18} className={progressFilter === 'NotStarted' ? 'text-slate-500' : 'text-gray-300'} />
              <span>Not Started (0%)</span>
            </button>
            <button
              onClick={() => setProgressFilter('InProgress')}
              className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 border border-transparent ${progressFilter === 'InProgress' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <PlayCircle size={18} className={progressFilter === 'InProgress' ? 'text-emerald-500' : 'text-gray-300'} />
              <span>In Progress (&gt;0%)</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 shrink-0">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Filter by Section</h3>
          <div className="space-y-2">
            <button onClick={() => setSectionFilter('All')} className={`w-full text-left p-4 rounded-2xl text-sm font-black transition-all ${sectionFilter === 'All' ? 'bg-hit-dark text-white shadow-xl shadow-hit-dark/10' : 'text-gray-500 hover:bg-gray-50'}`}>All Sections</button>
            <div className="h-px bg-gray-100 my-2"></div>
            {sections.filter(s => s.level === 1).map(s => (
              <button key={s.id} onClick={() => setSectionFilter(s.id)} className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex flex-col gap-1 border border-transparent ${sectionFilter === s.id ? 'bg-blue-50 text-hit-blue border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">{s.number}</span>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 shrink-0">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Filter by Owner</h3>
          <div className="space-y-2">
            <button onClick={() => setOwnerFilter('All')} className={`w-full text-left p-4 rounded-2xl text-sm font-black transition-all ${ownerFilter === 'All' ? 'bg-hit-blue text-white shadow-xl shadow-hit-blue/10' : 'text-gray-500 hover:bg-gray-50'}`}>All Owners</button>
            <div className="h-px bg-gray-100 my-2"></div>
            {profiles.map(p => (
              <button key={p.id} onClick={() => setOwnerFilter(p.id)} className={`w-full text-left p-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 border border-transparent ${ownerFilter === p.id ? 'bg-teal-50 text-hit-dark border-teal-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <UserAvatar name={`${p.first_name} ${p.last_name}`} size="sm" />
                <span className="truncate">{p.first_name} {p.last_name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Search Bar */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center gap-6">
          <button
            onClick={openCreateModal}
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

        {/* Task List */}
        <div className="flex-1 overflow-y-auto pr-2 pb-10">
          {filteredTasks.length > 0 ? (
            <>
              {/* Organizational Tasks Group */}
              {orgTasks.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Organizational Tasks</h3>
                      <p className="text-xs text-gray-500">{orgTasks.length} task{orgTasks.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {orgTasks.map(task => renderTaskCard(task))}
                  </div>
                </div>
              )}

              {/* Report Tasks Group */}
              {reportTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Report Tasks</h3>
                      <p className="text-xs text-gray-500">{reportTasks.length} task{reportTasks.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {reportTasks.map(task => renderTaskCard(task))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center text-gray-400 bg-white rounded-[2rem] shadow-sm">
              <CheckCircle2 size={64} className="text-gray-100 mb-6" />
              <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight">No Tasks Found</h3>
              <p className="text-sm max-w-xs mt-2 font-medium">No tasks match your current filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showModal && formData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-hit-dark/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-50 h-screen w-full max-w-4xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            {/* Modal Header */}
            <div className="bg-white px-10 py-6 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-hit-blue transition-all">
                  <X size={24} />
                </button>
                <div className="h-10 w-px bg-gray-100"></div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {isCreating ? 'Create Task' : 'Edit Task'}
                  </h2>
                  {formData.id && (
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
                      ID: {formData.id.slice(0, 8)}...
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-8 bg-white border border-gray-200 rounded-2xl text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.title || !formData.section_id || !formData.owner_id}
                  className="py-3 px-8 bg-hit-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-hit-dark transition-all flex items-center gap-2 shadow-xl shadow-hit-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isCreating ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-12">
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Task title..."
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-lg font-black text-gray-900 focus:ring-2 focus:ring-hit-blue transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Task description..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-hit-blue transition-all"
                  />
                </div>

                {/* Section & Owner */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.section_id}
                      onChange={e => setFormData({...formData, section_id: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue"
                    >
                      <option value="">Select section...</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.number}: {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Owner <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.owner_id}
                      onChange={e => setFormData({...formData, owner_id: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue"
                    >
                      <option value="">Select owner...</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Supervisor */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Supervisor</label>
                  <select
                    value={formData.supervisor_id}
                    onChange={e => setFormData({...formData, supervisor_id: e.target.value})}
                    className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue"
                  >
                    <option value="">No supervisor</option>
                    {profiles.filter(p => p.system_role === 'admin' || p.system_role === 'supervisor').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date & Due Date */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={e => setFormData({...formData, due_date: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-hit-blue"
                    />
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Progress: {formData.status}%
                    </label>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getStatusLabel(formData.status, formData.blocked).color}`}>
                      {getStatusLabel(formData.status, formData.blocked).label}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full transition-all duration-500 ${getStatusLabel(formData.status, formData.blocked).bar}`}
                      style={{width: `${formData.status}%`}}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-hit-blue"
                  />
                </div>

                {/* Blocked */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="checkbox"
                      id="blocked"
                      checked={formData.blocked}
                      onChange={e => setFormData({...formData, blocked: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="blocked" className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      Task is Blocked
                    </label>
                  </div>
                  {formData.blocked && (
                    <input
                      type="text"
                      placeholder="Reason for blocking..."
                      value={formData.blocked_reason}
                      onChange={e => setFormData({...formData, blocked_reason: e.target.value})}
                      className="w-full px-6 py-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-medium text-red-800 focus:ring-2 focus:ring-red-500 transition-all"
                    />
                  )}
                </div>

                {/* Collaborators */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={14} />
                    Collaborators
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profiles.filter(p => p.id !== formData.owner_id).map(p => {
                      const isSelected = formData.collaborator_ids.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleCollaborator(p.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            isSelected
                              ? 'bg-teal-100 text-teal-800 border-2 border-teal-300'
                              : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <UserAvatar name={`${p.first_name} ${p.last_name}`} size="xs" />
                          {p.first_name} {p.last_name}
                          {isSelected && <CheckCircle2 size={14} className="text-teal-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {formData.collaborator_ids.length > 0 && (
                    <p className="text-xs text-gray-400 mt-3">
                      {formData.collaborator_ids.length} collaborator{formData.collaborator_ids.length > 1 ? 's' : ''} selected
                    </p>
                  )}
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
