import React from 'react';
import { Calendar } from 'lucide-react';
import { Task, Profile } from '../types';
import UserAvatar from './UserAvatar';
import { getProgressStatus } from '../lib/progressUtils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  // Get progress-based status for the progress bar
  const progressStatus = getProgressStatus(task.status, task.blocked);

  // Determine deadline-based status for the card border and label
  const getDeadlineStatus = () => {
    if (task.blocked) {
      return { label: 'Blocked', color: 'text-red-500', dotColor: 'bg-red-500', borderColor: 'border-l-red-400', show: true };
    }
    if (task.status === 100) {
      return { label: 'Done', color: 'text-green-600', dotColor: 'bg-green-500', borderColor: 'border-l-green-400', show: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // No label for tasks not yet started
    if (task.status === 0) {
      return { label: '', color: '', dotColor: 'bg-gray-300', borderColor: 'border-l-gray-300', show: false };
    }

    if (dueDate < today) {
      return { label: 'Overdue', color: 'text-red-600', dotColor: 'bg-red-600', borderColor: 'border-l-red-400', show: true };
    }
    if (daysUntilDue <= 7) {
      return { label: 'Deadline very soon', color: 'text-pink-700', dotColor: 'bg-pink-600', borderColor: 'border-l-pink-500', show: true };
    }
    if (daysUntilDue > 14) {
      return { label: 'In progress', color: 'text-blue-600', dotColor: 'bg-blue-500', borderColor: 'border-l-blue-400', show: true };
    }
    // 8-14 days away
    return { label: 'Approaching deadline', color: 'text-orange-500', dotColor: 'bg-orange-400', borderColor: 'border-l-orange-300', show: true };
  };

  const deadlineStatus = getDeadlineStatus();

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Get owner info
  const getOwnerInfo = () => {
    if (task.owner) {
      const owner = task.owner as Profile;
      return { name: owner.name, role: owner.role, is_user: owner.is_user };
    }
    return null;
  };

  const ownerInfo = getOwnerInfo();

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${deadlineStatus.borderColor}`}
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

              {/* Deadline status badge */}
              {deadlineStatus.show && (
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${deadlineStatus.dotColor}`} />
                  <span className={`text-sm font-medium ${deadlineStatus.color}`}>
                    {deadlineStatus.label}
                  </span>
                </div>
              )}

              {/* Progress stage badge */}
              <div className={`text-xs font-semibold px-2 py-0.5 rounded border ${progressStatus.color}`}>
                {progressStatus.label}
              </div>
            </div>
          </div>

          {/* Owner/Collaborators */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {ownerInfo && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {ownerInfo.name}
              </span>
            )}
            <UserAvatar
              name={ownerInfo?.name || 'User'}
              role={ownerInfo?.role}
              isUser={ownerInfo?.is_user}
              size="md"
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
              {progressStatus.label}
            </span>
            <span className="text-sm font-semibold text-gray-500">
              {task.status}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${task.status}%`,
                background: progressStatus.gradient
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
