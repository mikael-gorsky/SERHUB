import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, X, Save, Loader2, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { Section, Task, Profile } from '../types';
import { getTasksBySection, getProfiles, updateTask, supabase, isConfigured } from '../lib/supabase';
import TaskCard from './TaskCard';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useSections } from '../contexts/SectionsContext';

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

interface SectionDetailProps {
  section: Section;
  onAddTask?: () => void;
}

const SectionDetail: React.FC<SectionDetailProps> = ({ section, onAddTask }) => {
  const { currentProfile } = useAuth();
  const { sections } = useSections();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<TaskFormData | null>(null);

  useEffect(() => {
    loadSectionData();
  }, [section.id]);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      const [tasksData, profilesData] = await Promise.all([
        getTasksBySection(section.id),
        getProfiles()
      ]);
      setTasks(tasksData);
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error loading section data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAddTask = currentProfile?.system_role === 'admin' || currentProfile?.system_role === 'coordinator';

  const getStatusLabel = (progress: number, blocked: boolean) => {
    if (blocked) return { label: 'Blocked', color: 'text-red-600 bg-red-50 border-red-100', bar: 'bg-red-500' };
    if (progress === 100) return { label: 'Done', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' };
    if (progress < 25) return { label: 'Starting', color: 'text-slate-500 bg-slate-50 border-slate-100', bar: 'bg-slate-400' };
    if (progress < 50) return { label: 'In Progress', color: 'text-blue-600 bg-blue-50 border-blue-100', bar: 'bg-blue-500' };
    if (progress < 75) return { label: 'Advancing', color: 'text-amber-600 bg-amber-50 border-amber-100', bar: 'bg-amber-500' };
    return { label: 'Finishing', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' };
  };

  const getProfileName = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown';
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
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.id) return;

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

      await updateTask(formData.id, taskData);

      // Update collaborators
      if (isConfigured && supabase) {
        // Remove existing collaborators
        await supabase
          .from('serhub_task_collaborators')
          .delete()
          .eq('task_id', formData.id);

        // Add new collaborators
        if (formData.collaborator_ids.length > 0) {
          const collaboratorInserts = formData.collaborator_ids.map(profileId => ({
            task_id: formData.id,
            profile_id: profileId
          }));
          await supabase
            .from('serhub_task_collaborators')
            .insert(collaboratorInserts);
        }
      }

      setShowModal(false);
      setFormData(null);
      await loadSectionData();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert("Failed to save task.");
    } finally {
      setIsSaving(false);
    }
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

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-white">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="max-w-3xl p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Section {section.number}: {section.title}
            </h1>

            {/* Description */}
            <p className="text-gray-500 leading-relaxed max-w-2xl">
              {section.description || 'No description available for this section.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-6">
            {canAddTask && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus size={18} strokeWidth={2.5} />
                Add Task
              </button>
            )}
            <button className="p-2.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mt-8">
          <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-6">
            Tasks & Deliverables
          </h2>

          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 mb-4">No tasks yet for this section</p>
              {canAddTask && (
                <button
                  onClick={onAddTask}
                  className="inline-flex items-center gap-2 px-4 py-2 text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  <Plus size={16} />
                  Create First Task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => openEditModal(task)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Edit Modal */}
      {showModal && formData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-gray-900/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-50 h-screen w-full max-w-4xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            {/* Modal Header */}
            <div className="bg-white px-10 py-6 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-teal-600 transition-all">
                  <X size={24} />
                </button>
                <div className="h-10 w-px bg-gray-100"></div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Edit Task</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
                    ID: {formData.id?.slice(0, 8)}...
                  </p>
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
                  className="py-3 px-8 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 shadow-xl shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save Changes
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
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-lg font-black text-gray-900 focus:ring-2 focus:ring-teal-500 transition-all"
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
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-teal-500 transition-all"
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
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
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
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
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
                    className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
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
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
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
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
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
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-600"
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

export default SectionDetail;
