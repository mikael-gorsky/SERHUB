import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { Meeting, Profile } from '../types';
import UserAvatar from './UserAvatar';

interface MeetingCardProps {
  meeting: Meeting;
  onClick?: () => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onClick }) => {
  // Format date and time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const startDT = formatDateTime(meeting.start_time);
  const endDT = formatDateTime(meeting.end_time);

  // Check if meeting is in the past
  const isPast = new Date(meeting.end_time) < new Date();

  // Get creator name
  const getCreatorName = () => {
    if (meeting.creator) {
      const creator = meeting.creator as Profile;
      if (creator.title) {
        return `${creator.title} ${creator.first_name} ${creator.last_name}`;
      }
      return `${creator.first_name} ${creator.last_name}`;
    }
    return null;
  };

  const creatorName = getCreatorName();

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isPast ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 mb-1">
              {meeting.title}
            </h4>

            {meeting.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {meeting.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm flex-wrap">
              {/* Date */}
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar size={14} />
                <span>{startDT.date}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock size={14} />
                <span>{startDT.time} - {endDT.time}</span>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {creatorName && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {creatorName}
              </span>
            )}
            <UserAvatar
              name={creatorName || 'User'}
              size="md"
              className="border-2 border-white shadow"
            />
          </div>
        </div>

        {/* Participants count */}
        {meeting.participants && meeting.participants.length > 0 && (
          <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-500">
            <Users size={14} />
            <span>{meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;
