import React from 'react';

// Custom user silhouette icon (filled style)
const UserIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <circle cx="12" cy="7" r="5" />
    <path d="M12 14c-5 0-9 2.5-9 6v1c0 .5.5 1 1 1h16c.5 0 1-.5 1-1v-1c0-3.5-4-6-9-6z" />
  </svg>
);

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500', 'bg-slate-500'
];

interface UserAvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isCurrentUser?: boolean;
}

const UserAvatar = ({ name = 'User', size = 'md', className = '', isCurrentUser = false }: UserAvatarProps) => {
  // Simple hash function to pick a color based on the name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLORS.length;
  const bgColor = COLORS[colorIndex];

  let sizeClasses = 'w-10 h-10';
  let iconSize = 20;
  let ringSize = 'ring-2 ring-offset-1';

  if (size === 'xs') {
    sizeClasses = 'w-6 h-6';
    iconSize = 12;
    ringSize = 'ring-1 ring-offset-1';
  } else if (size === 'sm') {
    sizeClasses = 'w-8 h-8';
    iconSize = 16;
    ringSize = 'ring-2 ring-offset-1';
  } else if (size === 'lg') {
    sizeClasses = 'w-12 h-12';
    iconSize = 24;
    ringSize = 'ring-2 ring-offset-2';
  } else if (size === 'xl') {
    sizeClasses = 'w-16 h-16';
    iconSize = 32;
    ringSize = 'ring-[3px] ring-offset-2';
  }

  const ringClass = isCurrentUser ? `${ringSize} ring-red-500` : '';

  return (
    <div className={`${sizeClasses} ${bgColor} rounded-full flex items-center justify-center text-white shrink-0 ${ringClass} ${className}`}>
      <UserIcon size={iconSize} />
    </div>
  );
};

export default UserAvatar;
