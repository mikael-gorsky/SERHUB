import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Briefcase,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { OrgTaskService } from '../services/OrgTaskService';
import { TaskService } from '../services/TaskService';
import { SectionService } from '../services/SectionService';
import { UserService } from '../services/UserService';
import { OrgTask, Task, Section, User } from '../types';
import OrgTaskCard from './OrgTaskCard';
import TaskCard from './TaskCard';
import UserAvatar from './UserAvatar';

const TasksView = () => {
  const [orgTasks, setOrgTasks] = useState<OrgTask[]>([]);
  const [reportTasks, setReportTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedTaskCounts, setLinkedTaskCounts] = useState<Record<string, number>>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');

  // Collapsible sections
  const [orgTasksExpanded, setOrgTasksExpanded] = useState(true);
  const [reportTasksExpanded, setReportTasksExpanded] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orgData, reportData, sectionsData, usersData] = await Promise.all([
        OrgTaskService.getAll(),
        TaskService.getAll(),
        SectionService.getAll(),
        UserService.getAll()
      ]);
      setOrgTasks(orgData);
      setReportTasks(reportData);
      setSections(sectionsData);
      setUsers(usersData);

      // Fetch linked task counts for each org task
      const counts: Record<string, number> = {};
      for (const task of orgData) {
        try {
          const linkedTasks = await OrgTaskService.getLinkedTasks(task.id);
          counts[task.id] = linkedTasks.length;
        } catch {
          counts[task.id] = 0;
        }
      }
      setLinkedTaskCounts(counts);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgTasks = useMemo(() => {
    return orgTasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOwner = ownerFilter === 'All' || task.owner_id === ownerFilter;
      return matchesSearch && matchesOwner;
    });
  }, [orgTasks, searchTerm, ownerFilter]);

  const filteredReportTasks = useMemo(() => {
    return reportTasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOwner = ownerFilter === 'All' || task.owner_id === ownerFilter;
      return matchesSearch && matchesOwner;
    });
  }, [reportTasks, searchTerm, ownerFilter]);

  // Group report tasks by section
  const tasksBySection = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    filteredReportTasks.forEach(task => {
      const sectionId = task.section_id;
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }
      grouped[sectionId].push(task);
    });
    return grouped;
  }, [filteredReportTasks]);

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
                <UserAvatar name={u.name} size="sm" />
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
              <span className="text-sm text-gray-600">Org Tasks</span>
              <span className="text-sm font-bold text-gray-800">{filteredOrgTasks.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Report Tasks</span>
              <span className="text-sm font-bold text-gray-800">{filteredReportTasks.length}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-sm font-bold text-teal-600">{filteredOrgTasks.length + filteredReportTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <button
            className="w-10 h-10 shrink-0 flex items-center justify-center bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-all"
            title="Create New Task"
          >
            <Plus size={20} />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search all tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {/* Organizational Tasks Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOrgTasksExpanded(!orgTasksExpanded)}
              className="w-full p-4 flex items-center justify-between bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Briefcase size={20} className="text-purple-600" />
                <span className="font-semibold text-purple-900">Organizational Tasks</span>
                <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {filteredOrgTasks.length}
                </span>
              </div>
              {orgTasksExpanded ? <ChevronDown size={20} className="text-purple-600" /> : <ChevronRight size={20} className="text-purple-600" />}
            </button>

            {orgTasksExpanded && (
              <div className="p-4 space-y-4">
                {filteredOrgTasks.length > 0 ? (
                  filteredOrgTasks.map(task => (
                    <OrgTaskCard
                      key={task.id}
                      task={task}
                      linkedTaskCount={linkedTaskCounts[task.id] || 0}
                      onClick={() => console.log('Edit org task:', task.id)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No organizational tasks found</p>
                )}
              </div>
            )}
          </div>

          {/* Report Tasks Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setReportTasksExpanded(!reportTasksExpanded)}
              className="w-full p-4 flex items-center justify-between bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal-600" />
                <span className="font-semibold text-teal-900">Report Tasks</span>
                <span className="text-xs bg-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                  {filteredReportTasks.length}
                </span>
              </div>
              {reportTasksExpanded ? <ChevronDown size={20} className="text-teal-600" /> : <ChevronRight size={20} className="text-teal-600" />}
            </button>

            {reportTasksExpanded && (
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
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => console.log('Edit task:', task.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No report tasks found</p>
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
