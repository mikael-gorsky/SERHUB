import React from 'react';
import { Calendar } from 'lucide-react';
import { Task, Profile } from '../types';
import UserAvatar from './UserAvatar';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  // Determine task status label
  const getStatusInfo = () => {
    if (task.blocked) {
      return { label: 'Blocked', color: 'text-red-500', dotColor: 'bg-red-500', borderColor: 'border-l-red-400', progressColor: 'bg-red-400' };
    }
    if (task.status === 100) {
      return { label: 'Complete', color: 'text-blue-500', dotColor: 'bg-blue-500', borderColor: 'border-l-blue-400', progressColor: 'bg-blue-400' };
    }

    const today = new Date();
    const dueDate = new Date(task.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (dueDate < today) {
      return { label: 'Overdue', color: 'text-red-600', dotColor: 'bg-red-600', borderColor: 'border-l-red-400', progressColor: 'bg-red-400' };
    }
    if (daysUntilDue <= 14) {
      return { label: 'Approaching Deadline', color: 'text-orange-500', dotColor: 'bg-orange-400', borderColor: 'border-l-orange-300', progressColor: 'bg-orange-300' };
    }
    return { label: 'On Track', color: 'text-green-600', dotColor: 'bg-green-500', borderColor: 'border-l-green-400', progressColor: 'bg-green-400' };
  };

  const statusInfo = getStatusInfo();

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Get owner name
  const getOwnerName = () => {
    if (task.owner) {
      const owner = task.owner as Profile;
      return owner.name;
    }
    return null;
  };

  const ownerName = getOwnerName();

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${statusInfo.borderColor}`}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 mb-1">
              {task.title}
            </h4>

            {task.description && (
              <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm">
              {/* Due date */}
              <div className="flex items-center gap-1.5 text-gray-400">
                <Calendar size={14} />
                <span>{formatDate(task.due_date)}</span>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Owner/Collaborators */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {ownerName && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {ownerName}
              </span>
            )}
            <UserAvatar
              name={ownerName || 'User'}
              size="md"
              className="border-2 border-white shadow"
            />
            {task.collaborators && task.collaborators.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
                +{task.collaborators.length}
              </span>
            )}
          </div>
        </div>

        {/* Blocked reason */}
        {task.blocked && task.blocked_reason && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-500">
              <span className="font-medium">Issue:</span> {task.blocked_reason}
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Completion
            </span>
            <span className="text-sm font-semibold text-gray-500">
              {task.status}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusInfo.progressColor}`}
              style={{ width: `${task.status}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
