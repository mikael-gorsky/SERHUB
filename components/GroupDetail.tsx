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
  ChevronRight
} from 'lucide-react';
import { Group, Task, Section, Profile } from '../types';
import { GroupService } from '../services/GroupService';
import { TaskService } from '../services/TaskService';
import { SectionService } from '../services/SectionService';
import { UserService } from '../services/UserService';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import TaskListCard from './TaskListCard';
import { canEditTasks } from '../lib/permissions';

interface GroupDetailProps {
  group: Group;
  onRefresh: () => void;
  onSelectGroup?: (group: Group) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onRefresh, onSelectGroup }) => {
  const { currentUser, currentProfile } = useAuth();
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);

  // Filters for link panel
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<'All' | 'NotStarted' | 'InProgress' | 'Completed'>('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');

  const isAdmin = currentUser?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, sectionsData, profilesData, groupTasks] = await Promise.all([
        TaskService.getAll(),
        SectionService.getAll(),
        UserService.getAll(),
        GroupService.getTasks(group.id)
      ]);
      setAllTasks(tasksData);
      setSections(sectionsData);
      setProfiles(profilesData);
      setLinkedTasks(groupTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [group.id]);

  const linkedTaskIds = useMemo(() => new Set(linkedTasks.map(t => t.id)), [linkedTasks]);

  const availableTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Exclude already linked tasks
      if (linkedTaskIds.has(task.id)) return false;

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
  }, [allTasks, linkedTaskIds, searchTerm, progressFilter, sectionFilter, ownerFilter]);

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

  // Calculate stats
  const stats = useMemo(() => {
    const total = linkedTasks.length;
    const completed = linkedTasks.filter(t => t.status === 100).length;
    const blocked = linkedTasks.filter(t => t.blocked).length;
    const inProgress = linkedTasks.filter(t => t.status > 0 && t.status < 100).length;
    const notStarted = linkedTasks.filter(t => t.status === 0 && !t.blocked).length;
    const progress = total > 0 ? Math.round(linkedTasks.reduce((sum, t) => sum + t.status, 0) / total) : 0;
    return { total, completed, blocked, inProgress, notStarted, progress };
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

  const hasActiveFilters = searchTerm || progressFilter !== 'All' || sectionFilter !== 'All' || ownerFilter !== 'All';

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100/50">
      {/* Colorful Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-6 py-5 shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <FolderTree size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-white/70 font-bold text-lg">{group.number}</span>
                <h1 className="text-2xl font-black text-white tracking-tight">{group.title}</h1>
                {group.is_fixed && (
                  <span className="text-xs px-2 py-1 bg-white/20 text-white rounded-lg font-medium">Fixed</span>
                )}
              </div>
              {group.description && (
                <p className="text-white/80 text-sm mt-1">{group.description}</p>
              )}
              {group.owner && (
                <div className="flex items-center gap-2 mt-2">
                  <UserAvatar name={group.owner.name} role={group.owner.role} size="xs" />
                  <span className="text-white/70 text-sm">{group.owner.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur rounded-2xl px-5 py-3 text-center">
              <div className="text-3xl font-black text-white">{stats.progress}%</div>
              <div className="text-xs text-white/70 font-medium uppercase tracking-wider">Progress</div>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-lg">
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-600">{stats.completed}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Done</div>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-xl font-black text-blue-600">{stats.inProgress}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Active</div>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-xl font-black text-gray-400">{stats.notStarted}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Pending</div>
                </div>
                {stats.blocked > 0 && (
                  <>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <div className="text-xl font-black text-red-600">{stats.blocked}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Blocked</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                stats.progress === 100 ? 'bg-emerald-300' :
                stats.blocked > 0 ? 'bg-amber-300' : 'bg-white'
              }`}
              style={{ width: `${stats.progress}%` }}
            />
          </div>
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
            <div className="space-y-3 mb-6">
              {linkedTasks.map(task => (
                <div key={task.id} className="group relative">
                  <TaskListCard
                    task={task}
                    section={sections.find(s => s.id === task.section_id)}
                    onClick={() => {}}
                    canEdit={canEditTasks(currentProfile)}
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
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Link size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-1">No Tasks Linked Yet</h3>
              <p className="text-sm text-gray-400">
                Use the selector below to link tasks to this group
              </p>
            </div>
          )}
        </div>

        {/* Link Tasks Panel - SECOND (always visible for admin) */}
        {isAdmin && (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div
              onClick={() => setShowLinkPanel(!showLinkPanel)}
              className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <Plus size={18} className="text-teal-600" />
                  Link More Tasks
                </h4>
                <div className={`text-xs font-bold text-gray-400 transition-transform ${showLinkPanel ? 'rotate-180' : ''}`}>
                  {showLinkPanel ? 'Hide' : 'Show'} ({availableTasks.length} available)
                </div>
              </div>
            </div>

            {/* Expandable Content */}
            {showLinkPanel && (
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
                      <button
                        onClick={() => setProgressFilter('Completed')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                          progressFilter === 'Completed' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <CheckCircle2 size={10} />
                        100%
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

                    {/* Owner Filter */}
                    <select
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 shadow-sm"
                    >
                      <option value="All">All Owners</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
