import React from 'react';

// Custom user silhouette icon (filled style) - matches user.png
const UserIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="currentColor"
  >
    {/* Head - large circle */}
    <circle cx="256" cy="120" r="100" />
    {/* Body - rounded shoulders with neck indent */}
    <path d="M256 250c-90 0-170 40-200 100c-15 30-20 60-20 90c0 30 25 50 55 50h330c30 0 55-20 55-50c0-30-5-60-20-90c-30-60-110-100-200-100z" />
  </svg>
);

const COLORS = [
  'text-red-500', 'text-orange-500', 'text-amber-500', 'text-yellow-600',
  'text-lime-500', 'text-green-500', 'text-emerald-500', 'text-teal-500',
  'text-cyan-500', 'text-sky-500', 'text-blue-500', 'text-indigo-500',
  'text-violet-500', 'text-purple-500', 'text-fuchsia-500', 'text-pink-500',
  'text-rose-500', 'text-slate-500'
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
  const iconColor = COLORS[colorIndex];

  let iconSize = 24;

  if (size === 'xs') {
    iconSize = 16;
  } else if (size === 'sm') {
    iconSize = 20;
  } else if (size === 'md') {
    iconSize = 24;
  } else if (size === 'lg') {
    iconSize = 32;
  } else if (size === 'xl') {
    iconSize = 40;
  }

  // Current user gets a red ring around the icon
  const ringClass = isCurrentUser ? 'ring-2 ring-red-500 ring-offset-1 rounded-full p-0.5' : '';

  return (
    <div className={`${iconColor} shrink-0 ${ringClass} ${className}`}>
      <UserIcon size={iconSize} />
    </div>
  );
};

export default UserAvatar;
