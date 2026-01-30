import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderTree,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Loader2
} from 'lucide-react';
import { Group } from '../types';
import { GroupService } from '../services/GroupService';
import { useAuth } from '../contexts/AuthContext';

interface GroupTreeProps {
  selectedGroupId: string | null;
  onSelectGroup: (group: Group) => void;
  onAddGroup: (parent: Group) => void;
  onEditGroup: (group: Group) => void;
  refreshTrigger?: number;
}

const GroupTree: React.FC<GroupTreeProps> = ({
  selectedGroupId,
  onSelectGroup,
  onAddGroup,
  onEditGroup,
  refreshTrigger
}) => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isAdmin = currentUser?.role === 'admin';

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await GroupService.getHierarchy();
      setGroups(data);

      // Auto-expand all groups initially
      const allIds = new Set<string>();
      const collectIds = (items: Group[]) => {
        items.forEach(g => {
          allIds.add(g.id);
          if (g.children) collectIds(g.children);
        });
      };
      collectIds(data);
      setExpandedIds(allIds);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [refreshTrigger]);

  const toggleExpand = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedIds(newExpanded);
  };

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalTasks = groups.reduce((sum, g) => sum + (g.task_count || 0), 0);
    const completedTasks = groups.reduce((sum, g) => sum + (g.completed_count || 0), 0);
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, progress };
  }, [groups]);

  const getIcon = (group: Group, isSelected: boolean, isExpanded: boolean) => {
    const hasChildren = group.children && group.children.length > 0;
    const iconClass = 'text-teal-600';

    if (hasChildren) {
      return isExpanded
        ? <FolderOpen size={18} className={iconClass} />
        : <Folder size={18} className={iconClass} />;
    }
    return <FolderTree size={18} className="text-gray-400" />;
  };

  // Get background color based on completion percentage (exported for GroupDetail to use)
  const getCompletionBgClass = (taskCount: number, progressPct: number) => {
    if (taskCount === 0) return 'bg-gray-50';
    if (progressPct >= 75) return 'bg-green-100';
    if (progressPct >= 50) return 'bg-yellow-100';
    if (progressPct >= 25) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const renderGroup = (group: Group, depth: number = 0) => {
    const isExpanded = expandedIds.has(group.id);
    const isSelected = selectedGroupId === group.id;
    const hasChildren = group.children && group.children.length > 0;

    // Style based on level
    const isLevel1 = group.level === 1;

    // Progress and stats
    const progress = group.progress || 0;
    const doneCount = group.completed_count || 0;
    const activeCount = group.active_count || 0;
    const overdueCount = group.overdue_count || 0;

    // Text style matching SectionTree: Level 1 = all-caps green, Level 2 = teal
    const getTextStyle = () => {
      if (isLevel1) return 'font-bold text-green-800 text-base uppercase tracking-wide';
      return 'font-bold text-teal-600 text-sm';
    };

    // Background color based on completion percentage (same for selected and unselected)
    const getCompletionBgStyle = () => {
      const baseBg = getCompletionBgClass(group.task_count || 0, progress);
      if ((group.task_count || 0) === 0) return 'bg-gray-50 hover:bg-gray-100';
      if (progress >= 75) return 'bg-green-100 hover:bg-green-200';
      if (progress >= 50) return 'bg-yellow-100 hover:bg-yellow-200';
      if (progress >= 25) return 'bg-orange-100 hover:bg-orange-200';
      return 'bg-red-100 hover:bg-red-200';
    };

    const getCompletionTextStyle = () => {
      if ((group.task_count || 0) === 0) return 'text-gray-500';
      if (progress >= 75) return 'text-green-800';
      if (progress >= 50) return 'text-yellow-800';
      if (progress >= 25) return 'text-orange-800';
      return 'text-red-800';
    };

    // Selection uses red border instead of background change
    const selectionBorderClass = isSelected ? 'border-4 border-red-500' : 'border-4 border-transparent';

    return (
      <div key={group.id}>
        <div
          className={`group flex flex-col gap-1 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${getCompletionBgStyle()} ${selectionBorderClass}`}
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => onSelectGroup(group)}
        >
          {/* Top row: Expand, Icon, Number & Title */}
          <div className="flex items-center gap-2">
            {/* Expand/Collapse */}
            {hasChildren ? (
              <button
                onClick={(e) => toggleExpand(group.id, e)}
                className="p-0.5 rounded transition-colors text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-5" />
            )}

            {/* Icon */}
            {getIcon(group, false, isExpanded)}

            {/* Number & Title - Level 1 is all-caps */}
            <div className="flex-1 min-w-0">
              <span className={getTextStyle()}>
                <span className="text-gray-400">{group.number}</span>
                {' '}
                {isLevel1 ? group.title.toUpperCase() : group.title}
              </span>
            </div>

            {/* Progress percentage */}
            {(group.task_count || 0) > 0 && (
              <span className={`text-sm font-bold ${getCompletionTextStyle()}`}>
                {progress}%
              </span>
            )}

            {/* Actions (admin only, on hover) */}
            {isAdmin && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditGroup(group);
                  }}
                  className="p-1 rounded transition-colors text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                  title="Edit group"
                >
                  <Edit2 size={14} />
                </button>
                {group.level < 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddGroup(group);
                    }}
                    className="p-1 rounded transition-colors text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                    title="Add sub-group"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom row: Graphical stats */}
          {(group.task_count || 0) > 0 && (
            <div className="flex items-center gap-2 ml-7">
              {/* "for all subgroups" text for Level 1 with children */}
              {isLevel1 && hasChildren && (
                <span className="text-[10px] text-gray-400 italic mr-1">all subgroups:</span>
              )}
              {/* Mini progress bar */}
              <div className="flex-1 max-w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Colored dots for stats */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-0.5" title="Completed">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-gray-600">{doneCount}</span>
                </span>
                <span className="flex items-center gap-0.5" title="Active">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-gray-600">{activeCount}</span>
                </span>
                {overdueCount > 0 && (
                  <span className="flex items-center gap-0.5" title="Overdue">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-red-600 font-bold">{overdueCount}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {group.children!.map(child => renderGroup(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-1/2 min-w-[300px] bg-gray-50 border-r border-gray-200 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="w-1/2 min-w-[300px] bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <FolderTree size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Task Groups</h2>
            <p className="text-xs text-gray-500">
              for Gantt chart and for reports
            </p>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {groups.map(group => renderGroup(group))}
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-3 border-t border-gray-200">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-teal-600 tracking-wider mb-3">
            OVERALL PROGRESS
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${overallStats.progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700">{overallStats.progress}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {overallStats.completedTasks} of {overallStats.totalTasks} tasks completed
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupTree;
