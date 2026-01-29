import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Link,
  Unlink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Users,
  Edit2
} from 'lucide-react';
import { Group, Task, Section } from '../types';
import { GroupService } from '../services/GroupService';
import { TaskService } from '../services/TaskService';
import { SectionService } from '../services/SectionService';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import TaskListCard from './TaskListCard';
import { canEditTasks } from '../lib/permissions';

interface GroupDetailProps {
  group: Group;
  onRefresh: () => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onRefresh }) => {
  const { currentUser, currentProfile } = useAuth();
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, sectionsData, groupTasks] = await Promise.all([
        TaskService.getAll(),
        SectionService.getAll(),
        GroupService.getTasks(group.id)
      ]);
      setAllTasks(tasksData);
      setSections(sectionsData);
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
      if (linkedTaskIds.has(task.id)) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(search) ||
        task.section?.title?.toLowerCase().includes(search) ||
        task.section?.number?.toLowerCase().includes(search)
      );
    });
  }, [allTasks, linkedTaskIds, searchTerm]);

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              group.level === 1 ? 'bg-teal-100' : group.level === 2 ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <FolderTree size={24} className={
                group.level === 1 ? 'text-teal-600' : group.level === 2 ? 'text-blue-600' : 'text-gray-600'
              } />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">{group.number}</span>
                <h1 className="text-xl font-bold text-gray-800">{group.title}</h1>
                {group.is_fixed && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">Fixed</span>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>
              )}
              {group.owner && (
                <div className="flex items-center gap-2 mt-1">
                  <UserAvatar name={group.owner.name} role={group.owner.role} size="xs" />
                  <span className="text-xs text-gray-500">{group.owner.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.progress}%</div>
              <div className="text-xs text-gray-500">Progress</div>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-emerald-600">{stats.completed}</div>
                <div className="text-xs text-gray-400">Done</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-500">{stats.notStarted}</div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
              {stats.blocked > 0 && (
                <div className="text-center">
                  <div className="font-semibold text-red-600">{stats.blocked}</div>
                  <div className="text-xs text-gray-400">Blocked</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              stats.progress === 100 ? 'bg-emerald-500' :
              stats.blocked > 0 ? 'bg-amber-500' : 'bg-teal-500'
            }`}
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Sub-groups section */}
        {hasChildren && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FolderTree size={14} />
              Sub-groups ({group.children!.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {group.children!.map(child => (
                <div
                  key={child.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FolderTree size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        <span className="text-gray-400">{child.number}</span> {child.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {child.task_count || 0} tasks
                      </div>
                    </div>
                    {(child.progress || 0) > 0 && (
                      <div className="text-sm font-medium text-gray-500">
                        {child.progress}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Tasks Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Link size={14} />
            Linked Tasks ({linkedTasks.length})
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowLinkPanel(!showLinkPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showLinkPanel
                  ? 'bg-teal-600 text-white'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
            >
              <Plus size={16} />
              Link Tasks
            </button>
          )}
        </div>

        {/* Link Tasks Panel */}
        {showLinkPanel && isAdmin && (
          <div className="bg-white rounded-xl border border-teal-200 shadow-sm mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search available tasks..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-auto divide-y divide-gray-50">
              {availableTasks.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {searchTerm ? 'No matching tasks found' : 'All tasks are already linked'}
                </div>
              ) : (
                availableTasks.slice(0, 20).map(task => (
                  <div
                    key={task.id}
                    className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => handleLinkTask(task.id)}
                      disabled={linkingTaskId === task.id}
                      className="p-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
                    >
                      {linkingTaskId === task.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Link size={16} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{task.title}</div>
                      <div className="text-xs text-gray-400">
                        {task.section?.number} {task.section?.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.blocked && (
                        <AlertTriangle size={14} className="text-red-500" />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 100 ? 'bg-emerald-100 text-emerald-700' :
                        task.status > 0 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {task.status}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {availableTasks.length > 20 && (
              <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-100">
                Showing 20 of {availableTasks.length} tasks. Use search to find more.
              </div>
            )}
          </div>
        )}

        {/* Linked Tasks List */}
        {linkedTasks.length > 0 ? (
          <div className="space-y-3">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all disabled:opacity-50"
                    title="Unlink task"
                  >
                    {linkingTaskId === task.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Unlink size={16} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Link size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Tasks Linked</h3>
            <p className="text-sm text-gray-500 mb-4">
              Link existing tasks to this group to track progress
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowLinkPanel(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus size={18} />
                Link Tasks
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
