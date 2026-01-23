import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  Plus,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { TaskService } from '../services/TaskService';
import { SectionService } from '../services/SectionService';
import { UserService } from '../services/UserService';
import { Task, Section, User } from '../types';
import DashboardTaskCard from './DashboardTaskCard';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { canCreateTasks, canEditTasks } from '../lib/permissions';

const TasksView = () => {
  const { currentProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');

  // Collapsible sections
  const [tasksExpanded, setTasksExpanded] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksResult, sectionsResult, usersResult] = await Promise.allSettled([
        TaskService.getAll(),
        SectionService.getAll(),
        UserService.getAllAsUsers()
      ]);

      const tasksData = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
      const sectionsData = sectionsResult.status === 'fulfilled' ? sectionsResult.value : [];
      const usersData = usersResult.status === 'fulfilled' ? usersResult.value : [];

      setTasks(tasksData);
      setSections(sectionsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOwner = ownerFilter === 'All' || task.owner_id === ownerFilter;
      return matchesSearch && matchesOwner;
    });
  }, [tasks, searchTerm, ownerFilter]);

  // Group tasks by section
  const tasksBySection = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      const sectionId = task.section_id;
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }
      grouped[sectionId].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-teal-600">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Tasks...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Sidebar Filters */}
      <div className="w-72 shrink-0 flex flex-col gap-6 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Filter by Owner</h3>
          <div className="space-y-2">
            <button
              onClick={() => setOwnerFilter('All')}
              className={`w-full text-left p-3 rounded-xl text-sm font-semibold transition-all ${
                ownerFilter === 'All'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Owners
            </button>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setOwnerFilter(u.id)}
                className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                  ownerFilter === u.id
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserAvatar name={u.name} role={u.role} isUser={u.is_user} size="sm" />
                <span className="truncate">{u.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Tasks</span>
              <span className="text-sm font-bold text-teal-600">{filteredTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          {canCreateTasks(currentProfile) && (
            <button
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-all"
              title="Create New Task"
            >
              <Plus size={20} />
            </button>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {/* Tasks Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setTasksExpanded(!tasksExpanded)}
              className="w-full p-4 flex items-center justify-between bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal-600" />
                <span className="font-semibold text-teal-900">Tasks</span>
                <span className="text-xs bg-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                  {filteredTasks.length}
                </span>
              </div>
              {tasksExpanded ? <ChevronDown size={20} className="text-teal-600" /> : <ChevronRight size={20} className="text-teal-600" />}
            </button>

            {tasksExpanded && (
              <div className="p-4 space-y-6">
                {Object.keys(tasksBySection).length > 0 ? (
                  sections
                    .filter(s => tasksBySection[s.id])
                    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
                    .map(section => (
                      <div key={section.id}>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{section.number}</span>
                          {section.title}
                        </h4>
                        <div className="space-y-3">
                          {tasksBySection[section.id].map(task => (
                            <DashboardTaskCard
                              key={task.id}
                              task={task}
                              onClick={canEditTasks(currentProfile) ? () => console.log('Edit task:', task.id) : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No tasks found</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksView;
