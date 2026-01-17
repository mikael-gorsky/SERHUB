import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Briefcase
} from 'lucide-react';
import { OrgTaskService } from '../services/OrgTaskService';
import { UserService } from '../services/UserService';
import { OrgTask, User } from '../types';
import OrgTaskCard from './OrgTaskCard';
import UserAvatar from './UserAvatar';

const OrgTasksManager = () => {
  const [tasks, setTasks] = useState<OrgTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedTaskCounts, setLinkedTaskCounts] = useState<Record<string, number>>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksData, usersData] = await Promise.all([
        OrgTaskService.getAll(),
        UserService.getAll()
      ]);
      setTasks(tasksData);
      setUsers(usersData);

      // Fetch linked task counts for each org task
      const counts: Record<string, number> = {};
      for (const task of tasksData) {
        try {
          const linkedTasks = await OrgTaskService.getLinkedTasks(task.id);
          counts[task.id] = linkedTasks.length;
        } catch {
          counts[task.id] = 0;
        }
      }
      setLinkedTaskCounts(counts);
    } catch (error) {
      console.error("Error fetching org tasks:", error);
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-teal-600">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Organizational Tasks...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Sidebar Filters */}
      <div className="w-72 shrink-0 flex flex-col gap-6">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <button
            className="w-10 h-10 shrink-0 flex items-center justify-center bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-all"
            title="Create New Org Task"
          >
            <Plus size={20} />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search organizational tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <OrgTaskCard
                key={task.id}
                task={task}
                linkedTaskCount={linkedTaskCounts[task.id] || 0}
                onClick={() => console.log('Edit org task:', task.id)}
              />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center text-gray-400 bg-white rounded-2xl shadow-sm">
              <Briefcase size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No Organizational Tasks</h3>
              <p className="text-sm max-w-xs mt-2">
                {searchTerm || ownerFilter !== 'All'
                  ? 'No tasks match current filters.'
                  : 'Create your first organizational task to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgTasksManager;
