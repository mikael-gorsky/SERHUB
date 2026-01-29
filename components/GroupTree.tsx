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
    const iconClass = isSelected ? 'text-white' : 'text-teal-600';

    if (hasChildren) {
      return isExpanded
        ? <FolderOpen size={18} className={iconClass} />
        : <Folder size={18} className={iconClass} />;
    }
    return <FolderTree size={18} className={isSelected ? 'text-white' : 'text-gray-400'} />;
  };

  const renderGroup = (group: Group, depth: number = 0) => {
    const isExpanded = expandedIds.has(group.id);
    const isSelected = selectedGroupId === group.id;
    const hasChildren = group.children && group.children.length > 0;

    // Style based on level
    const isLevel1 = group.level === 1;
    const isLevel2 = group.level === 2;

    const getTextStyle = () => {
      if (isSelected) return 'font-bold text-white text-sm';
      if (isLevel1) return 'font-bold text-gray-800 text-sm';
      if (isLevel2) return 'font-semibold text-gray-700 text-sm';
      return 'font-medium text-gray-600 text-xs';
    };

    const getBgStyle = () => {
      if (isSelected) return 'bg-teal-600 text-white';
      if (isLevel1) return 'bg-gray-100/70 hover:bg-gray-200/70';
      return 'hover:bg-gray-100';
    };

    // Progress indicator
    const progress = group.progress || 0;
    const hasBlocked = (group.blocked_count || 0) > 0;

    return (
      <div key={group.id}>
        <div
          className={`group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ${getBgStyle()}`}
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => onSelectGroup(group)}
        >
          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(group.id, e)}
              className={`p-0.5 rounded transition-colors ${isSelected ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Icon */}
          {getIcon(group, isSelected, isExpanded)}

          {/* Number & Title */}
          <div className="flex-1 min-w-0">
            <span className={getTextStyle()}>
              <span className={isSelected ? 'text-white/70' : 'text-gray-400'}>{group.number}</span>
              {' '}
              {group.title}
            </span>
          </div>

          {/* Task count & Progress */}
          {(group.task_count || 0) > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-white/30' : 'bg-gray-200'}`}>
                <div
                  className={`h-full transition-all ${
                    progress === 100 ? 'bg-emerald-500' :
                    hasBlocked ? 'bg-amber-500' :
                    isSelected ? 'bg-white' : 'bg-teal-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                {group.task_count}
              </span>
            </div>
          )}

          {/* Actions (admin only, on hover) */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGroup(group);
                }}
                className={`p-1 rounded transition-colors ${
                  isSelected
                    ? 'text-white/70 hover:text-white hover:bg-white/20'
                    : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
                }`}
                title="Edit group"
              >
                <Edit2 size={14} />
              </button>
              {group.level < 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddGroup(group);
                  }}
                  className={`p-1 rounded transition-colors ${
                    isSelected
                      ? 'text-white/70 hover:text-white hover:bg-white/20'
                      : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                  title="Add sub-group"
                >
                  <Plus size={14} />
                </button>
              )}
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
      <div className="w-[33%] min-w-[300px] bg-gray-50 border-r border-gray-200 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="w-[33%] min-w-[300px] bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <FolderTree size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Project Phases</h2>
            <p className="text-xs text-gray-500">
              {groups.length} phases, {overallStats.totalTasks} tasks
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
