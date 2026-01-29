import React, { useState, useEffect } from 'react';
import {
  GanttChart,
  ChevronRight,
  ChevronDown,
  Plus,
  Loader2,
  FolderTree,
  AlertCircle
} from 'lucide-react';
import { Group, Task } from '../types';
import { GroupService } from '../services/GroupService';
import { useAuth } from '../contexts/AuthContext';
import GroupCard from './GroupCard';
import GroupModal from './GroupModal';

const GanttView: React.FC = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expand/collapse state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [parentGroup, setParentGroup] = useState<Group | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GroupService.getHierarchy();
      setGroups(data);

      // Auto-expand all level 1 groups by default
      const defaultExpanded = new Set<string>();
      data.forEach(g => defaultExpanded.add(g.id));
      setExpandedGroups(defaultExpanded);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleAddChild = (parent: Group) => {
    setParentGroup(parent);
    setSelectedGroup(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setParentGroup(null);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
    setParentGroup(null);
  };

  const handleModalSave = async () => {
    await fetchGroups();
    handleModalClose();
  };

  // Calculate overall stats
  const overallStats = {
    totalTasks: groups.reduce((sum, g) => sum + (g.task_count || 0), 0),
    completedTasks: groups.reduce((sum, g) => sum + (g.completed_count || 0), 0),
    blockedTasks: groups.reduce((sum, g) => sum + (g.blocked_count || 0), 0),
    progress: groups.length > 0
      ? Math.round(groups.reduce((sum, g) => sum + (g.progress || 0), 0) / groups.length)
      : 0
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-teal-600" size={48} />
          <p className="text-gray-500">Loading project phases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-gray-700 font-medium mb-2">Error Loading Groups</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchGroups}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderTree size={32} className="text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Project Phases Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Run the database migration to create the initial project phases.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <GanttChart size={24} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Project Phases</h1>
              <p className="text-sm text-gray-500">
                Manage project phases and link tasks
              </p>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{overallStats.progress}%</div>
              <div className="text-xs text-gray-500">Overall</div>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {overallStats.completedTasks}/{overallStats.totalTasks}
              </div>
              <div className="text-xs text-gray-500">Tasks Done</div>
            </div>
            {overallStats.blockedTasks > 0 && (
              <>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{overallStats.blockedTasks}</div>
                  <div className="text-xs text-gray-500">Blocked</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-3">
          {groups.map(level1 => (
            <div key={level1.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Level 1 Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleExpand(level1.id)}
              >
                <button className="text-gray-400 hover:text-gray-600">
                  {expandedGroups.has(level1.id)
                    ? <ChevronDown size={20} />
                    : <ChevronRight size={20} />
                  }
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-gray-800">{level1.number}.</span>
                    <h2 className="font-semibold text-gray-800">{level1.title}</h2>
                    {level1.is_fixed && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Fixed</span>
                    )}
                  </div>
                  {level1.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{level1.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          level1.progress === 100 ? 'bg-emerald-500' :
                          level1.blocked_count && level1.blocked_count > 0 ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${level1.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-gray-600 font-medium w-10">{level1.progress || 0}%</span>
                  </div>
                  <span className="text-gray-400">
                    {level1.completed_count || 0}/{level1.task_count || 0} tasks
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddChild(level1);
                    }}
                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Add sub-group"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>

              {/* Level 2 Children */}
              {expandedGroups.has(level1.id) && level1.children && level1.children.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {level1.children.map(level2 => (
                    <div key={level2.id}>
                      <GroupCard
                        group={level2}
                        level={2}
                        isExpanded={expandedGroups.has(level2.id)}
                        onToggle={() => toggleExpand(level2.id)}
                        onEdit={isAdmin ? () => handleEdit(level2) : undefined}
                        onAddChild={isAdmin && level2.level < 3 ? () => handleAddChild(level2) : undefined}
                      />

                      {/* Level 3 Children */}
                      {expandedGroups.has(level2.id) && level2.children && level2.children.length > 0 && (
                        <div className="bg-gray-50/50">
                          {level2.children.map(level3 => (
                            <GroupCard
                              key={level3.id}
                              group={level3}
                              level={3}
                              isExpanded={false}
                              onToggle={() => {}}
                              onEdit={isAdmin ? () => handleEdit(level3) : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state for level 1 with no children */}
              {expandedGroups.has(level1.id) && (!level1.children || level1.children.length === 0) && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No sub-groups yet.
                  {isAdmin && (
                    <button
                      onClick={() => handleAddChild(level1)}
                      className="ml-2 text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Add one
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <GroupModal
          isOpen={isModalOpen}
          mode={modalMode}
          group={selectedGroup}
          parentGroup={parentGroup}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default GanttView;
