import React from 'react';
import { User } from 'lucide-react';

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
}

const UserAvatar = ({ name = 'User', size = 'md', className = '' }: UserAvatarProps) => {
  // Simple hash function to pick a color based on the name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLORS.length;
  const bgColor = COLORS[colorIndex];

  let sizeClasses = 'w-10 h-10';
  let iconSize = 20;

  if (size === 'xs') {
    sizeClasses = 'w-6 h-6';
    iconSize = 12;
  } else if (size === 'sm') {
    sizeClasses = 'w-8 h-8';
    iconSize = 16;
  } else if (size === 'lg') {
    sizeClasses = 'w-12 h-12';
    iconSize = 24;
  } else if (size === 'xl') {
    sizeClasses = 'w-16 h-16';
    iconSize = 32;
  }

  return (
    <div className={`${sizeClasses} ${bgColor} rounded-full flex items-center justify-center text-white shrink-0 ${className}`}>
      <User size={iconSize} />
    </div>
  );
};

export default UserAvatar;