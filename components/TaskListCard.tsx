import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { Task, Profile, Section } from '../types';
import { getProgressStatus } from '../lib/progressUtils';

interface TaskListCardProps {
  task: Task;
  section?: Section;
  onClick?: () => void;
  canEdit?: boolean;
}

const TaskListCard: React.FC<TaskListCardProps> = ({ task, section, onClick, canEdit = true }) => {
  const status = getProgressStatus(task.status, task.blocked);
  const isDone = task.status === 100;

  // Get section-based background color
  // Section 0 = light red, Sections 1-5 = light beige
  const getSectionBackground = () => {
    const sectionNumber = section?.number || task.section?.number || '';
    const num = parseInt(sectionNumber.replace(/[^0-9]/g, ''));
    if (num === 0 || sectionNumber === '0') {
      return 'bg-red-50 border-red-200';
    }
    return 'bg-amber-50/70 border-amber-100';
  };

  const sectionBackground = getSectionBackground();

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get first line of description
  const getFirstLine = (text: string | null | undefined) => {
    if (!text) return '';
    const firstLine = text.split(/[.\n]/)[0];
    return firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
  };

  const descriptionLine = getFirstLine(task.description);
  const displaySection = section || task.section;

  // Get all contributors: collaborators first, owner last
  const getAllContributors = (): Profile[] => {
    const contributors: Profile[] = [];
    if (task.collaborators && task.collaborators.length > 0) {
      contributors.push(...task.collaborators);
    }
    if (task.owner) {
      contributors.push(task.owner);
    }
    return contributors;
  };

  const allContributors = getAllContributors();

  return (
    <div
      onClick={canEdit ? onClick : undefined}
      className={`p-5 rounded-2xl border shadow-sm transition-all group ${sectionBackground} ${isDone ? 'opacity-70' : ''} ${canEdit ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'cursor-default'}`}
    >
      {/* Top Row: Section badge, Title, Due date */}
      <div className="flex items-center gap-5">
        <div className="w-14 shrink-0 text-center">
          <span className="bg-hit-dark text-white text-[9px] font-black px-2 py-1 rounded-md uppercase group-hover:bg-hit-blue transition-colors">
            {displaySection?.number || '??'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-base font-black group-hover:text-hit-blue transition-colors truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="w-16 text-center">
            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Due</span>
            <span className="text-sm font-black text-gray-800">{formatDate(task.due_date)}</span>
          </div>
          <ChevronRight size={18} className="text-gray-200 group-hover:text-hit-blue transition-colors" />
        </div>
      </div>

      {/* Description Line */}
      {descriptionLine && (
        <p className={`text-sm font-medium mt-2 ml-[76px] ${isDone ? 'text-gray-400' : 'text-gray-500'}`}>
          {descriptionLine}
        </p>
      )}

      {/* Blocked Warning */}
      {task.blocked && (
        <div className="flex items-center gap-2 text-xs text-red-600 mt-2 ml-[76px]">
          <AlertTriangle size={12} />
          <span className="font-bold">Blocked: {task.blocked_reason}</span>
        </div>
      )}

      {/* Progress Bar Row */}
      <div className="flex items-center gap-4 mt-3 ml-[76px] flex-wrap">
        <div className="flex-1 max-w-xs">
          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden border border-black/5">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${task.status}%`,
                background: status.gradient
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-600">{task.status}%</span>
          <div className={`text-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border bg-white shadow-sm ${status.color}`}>
            {status.label}
          </div>
        </div>
        {/* All contributors (collaborators + owner last) */}
        {allContributors.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            {allContributors.map((person) => (
              <span
                key={person.id}
                className={`text-sm font-bold px-2 py-0.5 rounded-full text-gray-700 ${
                  person.role === 'admin'
                    ? 'bg-blue-100'
                    : person.is_user
                    ? 'bg-green-100'
                    : 'bg-gray-200'
                }`}
              >
                {person.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskListCard;
