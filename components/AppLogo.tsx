import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Yellow background with rounded corners */}
      <rect width="40" height="40" rx="8" fill="#FDB913" />

      {/* Superman-style S in dark teal */}
      <path
        d="M27 12C27 12 24.5 11 20 11C14 11 12 14 12 16.5C12 19 14 20.5 17 21.5L23 23.5C25 24.2 26 25 26 26.5C26 28.5 24 29.5 20 29.5C16 29.5 13.5 28 13.5 28"
        stroke="#007279"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default AppLogo;
