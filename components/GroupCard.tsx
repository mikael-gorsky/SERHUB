import React from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Link,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Group, GroupStatus } from '../types';

interface GroupCardProps {
  group: Group;
  level: 2 | 3;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onAddChild?: () => void;
}

const getStatusInfo = (group: Group): { status: GroupStatus; label: string; color: string; bg: string } => {
  if (!group.task_count || group.task_count === 0) {
    return { status: 'not_started', label: 'Not Started', color: 'text-gray-500', bg: 'bg-gray-100' };
  }

  if (group.blocked_count && group.blocked_count > 0) {
    return { status: 'blocked', label: 'Blocked', color: 'text-red-700', bg: 'bg-red-100' };
  }

  if (group.progress === 100) {
    return { status: 'completed', label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100' };
  }

  if (group.progress === 0) {
    return { status: 'not_started', label: 'Not Started', color: 'text-gray-500', bg: 'bg-gray-100' };
  }

  if (group.progress && group.progress >= 75) {
    return { status: 'on_track', label: 'On Track', color: 'text-green-700', bg: 'bg-green-100' };
  }

  if (group.progress && group.progress >= 25) {
    return { status: 'in_progress', label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-100' };
  }

  return { status: 'at_risk', label: 'At Risk', color: 'text-amber-700', bg: 'bg-amber-100' };
};

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  level,
  isExpanded,
  onToggle,
  onEdit,
  onAddChild
}) => {
  const statusInfo = getStatusInfo(group);
  const hasChildren = group.children && group.children.length > 0;
  const indent = level === 2 ? 'pl-8' : 'pl-16';

  return (
    <div
      className={`${indent} pr-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group cursor-pointer`}
      onClick={onToggle}
    >
      {/* Expand/Collapse toggle */}
      {hasChildren ? (
        <button className="text-gray-400 hover:text-gray-600 shrink-0">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      ) : (
        <div className="w-[18px] shrink-0" />
      )}

      {/* Number */}
      <span className="font-medium text-gray-500 text-sm shrink-0 w-12">{group.number}</span>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800 truncate">{group.title}</span>
          {group.owner && (
            <span className="text-xs text-gray-400 truncate">
              ({group.owner.name})
            </span>
          )}
        </div>
        {group.description && (
          <p className="text-xs text-gray-400 truncate">{group.description}</p>
        )}
      </div>

      {/* Status Badge */}
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.bg} ${statusInfo.color} shrink-0`}>
        {statusInfo.label}
      </span>

      {/* Task Stats */}
      <div className="flex items-center gap-3 text-sm shrink-0">
        {/* Progress bar */}
        {group.task_count && group.task_count > 0 ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  group.progress === 100 ? 'bg-emerald-500' :
                  group.blocked_count && group.blocked_count > 0 ? 'bg-amber-500' : 'bg-teal-500'
                }`}
                style={{ width: `${group.progress || 0}%` }}
              />
            </div>
            <span className="text-gray-500 text-xs w-8">{group.progress || 0}%</span>
          </div>
        ) : null}

        {/* Task count */}
        <div className="flex items-center gap-1 text-gray-400">
          <Link size={14} />
          <span className="text-xs">{group.task_count || 0}</span>
        </div>

        {/* Blocked indicator */}
        {group.blocked_count && group.blocked_count > 0 && (
          <div className="flex items-center gap-1 text-red-500" title={`${group.blocked_count} blocked tasks`}>
            <AlertTriangle size={14} />
            <span className="text-xs">{group.blocked_count}</span>
          </div>
        )}

        {/* Completed indicator */}
        {group.completed_count && group.completed_count > 0 && group.progress !== 100 && (
          <div className="flex items-center gap-1 text-emerald-500" title={`${group.completed_count} completed tasks`}>
            <CheckCircle2 size={14} />
            <span className="text-xs">{group.completed_count}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Edit group"
          >
            <Edit2 size={16} />
          </button>
        )}
        {onAddChild && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Add sub-group"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
