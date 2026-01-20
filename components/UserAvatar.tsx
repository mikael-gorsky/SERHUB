import React from 'react';
import { SystemRole } from '../types';

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

// Role-based colors
const getRoleColor = (role?: SystemRole): string => {
  switch (role) {
    case 'admin':
      return 'text-blue-500';      // bright blue
    case 'supervisor':
      return 'text-orange-500';    // orange
    case 'contributor':
    default:
      return 'text-gray-600';      // dark grey
  }
};

interface UserAvatarProps {
  name?: string;
  role?: SystemRole;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isCurrentUser?: boolean;
}

const UserAvatar = ({ name = 'User', role, size = 'md', className = '', isCurrentUser = false }: UserAvatarProps) => {
  const iconColor = getRoleColor(role);

  // Icon sizes (2x larger)
  let iconSize = 48;

  if (size === 'xs') {
    iconSize = 32;
  } else if (size === 'sm') {
    iconSize = 40;
  } else if (size === 'md') {
    iconSize = 48;
  } else if (size === 'lg') {
    iconSize = 64;
  } else if (size === 'xl') {
    iconSize = 80;
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
