import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Link,
  Unlink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Loader2,
  Circle,
  PlayCircle,
  Filter,
  X,
  ChevronRight,
  Save,
  Users
} from 'lucide-react';
import { Group, Task, Section, Profile } from '../types';
import { GroupService } from '../services/GroupService';
import { TaskService } from '../services/TaskService';
import { SectionService } from '../services/SectionService';
import { UserService } from '../services/UserService';
import { useAuth } from '../contexts/AuthContext';
import { useSections } from '../contexts/SectionsContext';
import UserAvatar from './UserAvatar';
import TaskListCard from './TaskListCard';
import { canEditTasks } from '../lib/permissions';
import { getProgressStatus } from '../lib/progressUtils';
import { supabase, isConfigured, updateTask } from '../lib/supabase';

// Helper to flatten section hierarchy for dropdowns
const flattenSections = (sections: Section[]): Section[] => {
  const result: Section[] = [];
  const flatten = (sects: Section[]) => {
    sects.forEach(s => {
      result.push(s);
      if (s.children && s.children.length > 0) {
        flatten(s.children);
      }
    });
  };
  flatten(sections);
  return result;
};

interface TaskFormData {
  id: string;
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

interface GroupDetailProps {
  group: Group;
  onRefresh: () => void;
  onSelectGroup?: (group: Group) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onRefresh, onSelectGroup }) => {
  const { currentUser, currentProfile } = useAuth();
  const { sections: contextSections } = useSections();
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allLinkedTaskIds, setAllLinkedTaskIds] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<Section[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);

  // Flatten context sections for dropdown (includes all levels)
  const allContextSections = useMemo(() => flattenSections(contextSections), [contextSections]);

  // Task edit modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Filters for link panel
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<'All' | 'NotStarted' | 'InProgress' | 'Completed'>('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = canEditTasks(currentProfile);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, sectionsData, profilesData, groupTasks, linkedIds] = await Promise.all([
        TaskService.getAll(),
        SectionService.getAll(),
        UserService.getAll(),
        GroupService.getTasks(group.id),
        GroupService.getAllLinkedTaskIds()
      ]);
      setAllTasks(tasksData);
      setSections(sectionsData);
      setProfiles(profilesData);
      setLinkedTasks(groupTasks);
      setAllLinkedTaskIds(linkedIds);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [group.id]);

  const availableTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Exclude tasks already linked to ANY group
      if (allLinkedTaskIds.has(task.id)) return false;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
          task.title.toLowerCase().includes(search) ||
          task.section?.title?.toLowerCase().includes(search) ||
          task.section?.number?.toLowerCase().includes(search)
        );
        if (!matchesSearch) return false;
      }

      // Progress filter
      if (progressFilter !== 'All') {
        if (progressFilter === 'NotStarted' && task.status !== 0) return false;
        if (progressFilter === 'InProgress' && (task.status === 0 || task.status === 100)) return false;
        if (progressFilter === 'Completed' && task.status !== 100) return false;
      }

      // Section filter
      if (sectionFilter !== 'All' && task.section_id !== sectionFilter) return false;

      // Owner filter
      if (ownerFilter !== 'All' && task.owner_id !== ownerFilter) return false;

      return true;
    });
  }, [allTasks, allLinkedTaskIds, searchTerm, progressFilter, sectionFilter, ownerFilter]);

  const handleLinkTask = async (taskId: string) => {
    setLinkingTaskId(taskId);
    try {
      await GroupService.linkTask(group.id, taskId);
      await fetchData();
      onRefresh();
    } catch (error) {
      console.error('Error linking task:', error);
    } finally {
      setLinkingTaskId(null);
    }
  };

  const handleUnlinkTask = async (taskId: string) => {
    setLinkingTaskId(taskId);
    try {
      await GroupService.unlinkTask(group.id, taskId);
      await fetchData();
      onRefresh();
    } catch (error) {
      console.error('Error unlinking task:', error);
    } finally {
      setLinkingTaskId(null);
    }
  };

  // Task edit modal handlers
  const openTaskEditModal = async (task: Task) => {
    // Fetch collaborators for this task
    let collaboratorIds: string[] = [];
    if (isConfigured && supabase) {
      const { data } = await supabase
        .from('serhub_task_collaborators')
        .select('user_id')
        .eq('task_id', task.id);
      collaboratorIds = data?.map(c => c.user_id) || [];
    }

    setTaskFormData({
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
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormData) return;

    setIsSavingTask(true);
    try {
      const taskData = {
        title: taskFormData.title,
        description: taskFormData.description || null,
        section_id: taskFormData.section_id,
        owner_id: taskFormData.owner_id,
        supervisor_id: taskFormData.supervisor_id || null,
        status: taskFormData.status,
        blocked: taskFormData.blocked,
        blocked_reason: taskFormData.blocked ? taskFormData.blocked_reason : null,
        start_date: taskFormData.start_date,
        due_date: taskFormData.due_date
      };

      await updateTask(taskFormData.id, taskData);

      // Update collaborators
      if (isConfigured && supabase) {
        await supabase
          .from('serhub_task_collaborators')
          .delete()
          .eq('task_id', taskFormData.id);

        if (taskFormData.collaborator_ids.length > 0) {
          const collaboratorInserts = taskFormData.collaborator_ids.map(userId => ({
            task_id: taskFormData.id,
            user_id: userId
          }));
          await supabase
            .from('serhub_task_collaborators')
            .insert(collaboratorInserts);
        }
      }

      setShowTaskModal(false);
      setTaskFormData(null);
      await fetchData();
      onRefresh();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert("Failed to save task.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const toggleCollaborator = (profileId: string) => {
    if (!taskFormData) return;
    const ids = taskFormData.collaborator_ids;
    if (ids.includes(profileId)) {
      setTaskFormData({ ...taskFormData, collaborator_ids: ids.filter(id => id !== profileId) });
    } else {
      setTaskFormData({ ...taskFormData, collaborator_ids: [...ids, profileId] });
    }
  };

  const getStatusLabel = (progress: number, blocked: boolean) => {
    const status = getProgressStatus(progress, blocked);
    return {
      label: status.label,
      color: status.color,
      gradient: status.gradient
    };
  };

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const total = linkedTasks.length;
    const completed = linkedTasks.filter(t => t.status === 100).length;
    const blocked = linkedTasks.filter(t => t.blocked).length;
    const inProgress = linkedTasks.filter(t => t.status > 0 && t.status < 100).length;
    const notStarted = linkedTasks.filter(t => t.status === 0 && !t.blocked).length;
    const overdue = linkedTasks.filter(t => {
      if (t.status === 100) return false;
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
    const progress = total > 0 ? Math.round(linkedTasks.reduce((sum, t) => sum + t.status, 0) / total) : 0;
    return { total, completed, blocked, inProgress, notStarted, overdue, progress };
  }, [linkedTasks]);

  // Group children if any
  const hasChildren = group.children && group.children.length > 0;

  // Get level 1 sections for filter
  const level1Sections = useMemo(() => sections.filter(s => s.level === 1), [sections]);

  const clearFilters = () => {
    setSearchTerm('');
    setProgressFilter('All');
    setSectionFilter('All');
    setOwnerFilter('All');
  };

  const hasActiveFilters = searchTerm || progressFilter !== 'All' || sectionFilter !== 'All';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-teal-600" size={48} />
          <p className="text-gray-500">Loading group data...</p>
        </div>
      </div>
    );
  }

  // Neutral header background for all task groups
  const getHeaderBgClass = () => 'bg-gray-50';

  const getHeaderTextClass = () => 'text-gray-700';

  const isLevel1 = group.level === 1;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100/50">
      {/* Header with same background as left panel */}
      <div className={`${getHeaderBgClass()} px-6 py-4 shrink-0 border-b border-gray-200`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center">
            <FolderTree size={24} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold">{group.number}</span>
              {/* Level 1: all-caps green, Level 2: teal - matching left panel */}
              <h1 className={isLevel1
                ? 'text-base font-bold text-green-800 uppercase tracking-wide'
                : 'text-sm font-bold text-teal-600'
              }>
                {isLevel1 ? group.title.toUpperCase() : group.title}
              </h1>
              {group.is_fixed && (
                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded font-medium">Fixed</span>
              )}
            </div>
            {group.owner && (
              <div className="flex items-center gap-2 mt-1">
                <UserAvatar name={group.owner.name} role={group.owner.role} size="xs" />
                <span className="text-gray-600 text-sm">{group.owner.name}</span>
              </div>
            )}
          </div>
          {/* Stats area on right */}
          {(linkedTasks.length > 0) && (
            <div className="flex items-center gap-4">
              {/* Text stats: Done | Active | Overdue */}
              <div className={`flex items-center gap-3 text-sm ${getHeaderTextClass()}`}>
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">Done:</span>
                  <span className="font-bold">{stats.completed}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">Active:</span>
                  <span className="font-bold">{stats.inProgress}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-500">Overdue:</span>
                  <span className={`font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</span>
                </span>
              </div>
              {/* Progress badge */}
              <div className={`bg-white/50 rounded-xl px-4 py-2 text-center`}>
                <div className={`text-2xl font-black ${getHeaderTextClass()}`}>{stats.progress}%</div>
                <div className="text-xs text-gray-500">{linkedTasks.length} tasks</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Sub-groups section */}
        {hasChildren && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <FolderTree size={14} />
              Sub-groups ({group.children!.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {group.children!.map(child => (
                <div
                  key={child.id}
                  onClick={() => onSelectGroup?.(child)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      child.level === 2 ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <FolderTree size={18} className={child.level === 2 ? 'text-blue-600' : 'text-purple-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 truncate">
                        <span className="text-gray-400 font-medium">{child.number}</span> {child.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${child.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{child.task_count || 0} tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(child.progress || 0) > 0 && (
                        <div className="text-lg font-black text-teal-600">
                          {child.progress}%
                        </div>
                      )}
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Tasks Section - FIRST */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Link size={14} />
            Linked Tasks ({linkedTasks.length})
          </h3>

          {linkedTasks.length > 0 ? (
            <div className="space-y-3">
              {linkedTasks.map(task => (
                <div key={task.id} className="group relative">
                  <TaskListCard
                    task={task}
                    section={sections.find(s => s.id === task.section_id)}
                    onClick={canEdit ? () => openTaskEditModal(task) : undefined}
                    canEdit={canEdit}
                  />
                  {isAdmin && (
                    <button
                      onClick={() => handleUnlinkTask(task.id)}
                      disabled={linkingTaskId === task.id}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-red-100 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 shadow-lg"
                      title="Unlink task"
                    >
                      {linkingTaskId === task.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Unlink size={18} />
                      )}
                    </button>
                  )}
                </div>
              ))}

              {/* Add Linked Tasks Button - Consistent size */}
              {isAdmin && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowLinkPanel(!showLinkPanel)}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-500/20 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Linked Tasks
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Link size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-1">No Tasks Linked Yet</h3>
              <p className="text-sm text-gray-400 mb-4">
                Link tasks to track progress for this group
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowLinkPanel(!showLinkPanel)}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-500/20 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Linked Tasks
                </button>
              )}
            </div>
          )}
        </div>

        {/* Link Tasks Panel - Shows when "Add Linked Tasks" is clicked */}
        {isAdmin && showLinkPanel && (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            {/* Panel Header - lighter to show it's secondary */}
            <div className="bg-gradient-to-r from-teal-100 to-emerald-100 p-4 border-b border-teal-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-teal-700 flex items-center gap-2">
                  <Search size={18} />
                  Select Tasks to Link
                </h4>
                <button
                  onClick={() => setShowLinkPanel(false)}
                  className="text-teal-500 hover:text-teal-700 transition-colors p-1 hover:bg-teal-200/50 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-teal-600/70 text-xs mt-1">{availableTasks.length} tasks available</p>
            </div>

            {/* Content */}
            <>
                {/* Filters */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-5 border-b border-teal-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <Filter size={14} />
                      Filters
                    </span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                      >
                        <X size={12} />
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Progress Filter */}
                    <div className="flex bg-white rounded-lg p-0.5 border border-gray-100 shadow-sm">
                      <button
                        onClick={() => setProgressFilter('All')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          progressFilter === 'All' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setProgressFilter('NotStarted')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                          progressFilter === 'NotStarted' ? 'bg-slate-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Circle size={10} />
                        0%
                      </button>
                      <button
                        onClick={() => setProgressFilter('InProgress')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                          progressFilter === 'InProgress' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <PlayCircle size={10} />
                        Active
                      </button>
                    </div>

                    {/* Section Filter */}
                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 shadow-sm"
                    >
                      <option value="All">All Sections</option>
                      {level1Sections.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.number}: {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Task List */}
                <div className="max-h-96 overflow-auto">
                  {availableTasks.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Search size={24} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {hasActiveFilters ? 'No tasks match your filters' : 'All tasks are already linked'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-sm font-bold text-teal-600 hover:text-teal-700"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {availableTasks.slice(0, 30).map(task => (
                        <div
                          key={task.id}
                          className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                        >
                          {/* Task Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 truncate">{task.title}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                              <span className="bg-gray-100 px-2 py-0.5 rounded">{task.section?.number}</span>
                              <span className="truncate">{task.section?.title}</span>
                            </div>
                          </div>

                          {/* Status indicators */}
                          <div className="flex items-center gap-2 shrink-0">
                            {task.owner && (
                              <UserAvatar name={task.owner.name} role={task.owner.role} size="xs" />
                            )}
                            {task.blocked && (
                              <AlertTriangle size={14} className="text-red-500" />
                            )}
                            <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                              task.status === 100 ? 'bg-emerald-100 text-emerald-700' :
                              task.status > 0 ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {task.status}%
                            </div>
                          </div>

                          {/* Link Button - Rose-Purple Gradient */}
                          <button
                            onClick={() => handleLinkTask(task.id)}
                            disabled={linkingTaskId === task.id}
                            className="shrink-0 px-4 py-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 transition-all shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {linkingTaskId === task.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              'Link this task'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {availableTasks.length > 30 && (
                  <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                    Showing 30 of {availableTasks.length} tasks. Use filters to narrow down.
                  </div>
                )}
            </>
          </div>
        )}
      </div>

      {/* Task Edit Modal */}
      {showTaskModal && taskFormData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-gray-900/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-50 h-screen w-full max-w-4xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            {/* Modal Header */}
            <div className="bg-white px-10 py-6 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowTaskModal(false)} className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-teal-600 transition-all">
                  <X size={24} />
                </button>
                <div className="h-10 w-px bg-gray-100"></div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Edit Task</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
                    ID: {taskFormData.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="py-3 px-8 bg-white border border-gray-200 rounded-2xl text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTask}
                  disabled={isSavingTask || !taskFormData.title || !taskFormData.section_id || !taskFormData.owner_id}
                  className="py-3 px-8 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 shadow-xl shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingTask ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
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
                    value={taskFormData.title}
                    onChange={e => setTaskFormData({...taskFormData, title: e.target.value})}
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-lg font-black text-gray-900 focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Task description..."
                    value={taskFormData.description}
                    onChange={e => setTaskFormData({...taskFormData, description: e.target.value})}
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
                      value={taskFormData.section_id}
                      onChange={e => setTaskFormData({...taskFormData, section_id: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select section...</option>
                      {allContextSections.map(s => (
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
                      value={taskFormData.owner_id}
                      onChange={e => setTaskFormData({...taskFormData, owner_id: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select owner...</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Supervisor */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Supervisor</label>
                  <select
                    value={taskFormData.supervisor_id}
                    onChange={e => setTaskFormData({...taskFormData, supervisor_id: e.target.value})}
                    className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">No supervisor</option>
                    {profiles.filter(p => p.role === 'admin' || p.role === 'supervisor').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
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
                      value={taskFormData.start_date}
                      onChange={e => setTaskFormData({...taskFormData, start_date: e.target.value})}
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
                      value={taskFormData.due_date}
                      onChange={e => setTaskFormData({...taskFormData, due_date: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-900 h-14 px-4 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Progress Slider */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Progress: {taskFormData.status}%
                    </label>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getStatusLabel(taskFormData.status, taskFormData.blocked).color}`}>
                      {getStatusLabel(taskFormData.status, taskFormData.blocked).label}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${taskFormData.status}%`,
                        background: getStatusLabel(taskFormData.status, taskFormData.blocked).gradient
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={taskFormData.status}
                    onChange={e => setTaskFormData({...taskFormData, status: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                {/* Blocked */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="checkbox"
                      id="blocked"
                      checked={taskFormData.blocked}
                      onChange={e => setTaskFormData({...taskFormData, blocked: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="blocked" className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      Task is Blocked
                    </label>
                  </div>
                  {taskFormData.blocked && (
                    <input
                      type="text"
                      placeholder="Reason for blocking..."
                      value={taskFormData.blocked_reason}
                      onChange={e => setTaskFormData({...taskFormData, blocked_reason: e.target.value})}
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
                    {profiles.filter(p => p.id !== taskFormData.owner_id).map(p => {
                      const isSelected = taskFormData.collaborator_ids.includes(p.id);
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
                          <UserAvatar name={p.name} role={p.role} isUser={p.is_user} size="xs" />
                          {p.name}
                          {isSelected && <CheckCircle2 size={14} className="text-teal-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {taskFormData.collaborator_ids.length > 0 && (
                    <p className="text-xs text-gray-400 mt-3">
                      {taskFormData.collaborator_ids.length} collaborator{taskFormData.collaborator_ids.length > 1 ? 's' : ''} selected
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

export default GroupDetail;
