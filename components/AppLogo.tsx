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
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Superman shield shape - yellow background */}
      <path
        d="M2 8L8 2H32L38 8L20 42L2 8Z"
        fill="#FDB913"
        stroke="#007279"
        strokeWidth="2"
      />

      {/* Superman-style S in dark teal */}
      <path
        d="M26 11C26 11 24 10 20 10C15 10 13 12.5 13 14.5C13 16.5 14.5 17.5 17 18.5L23 20.5C25 21.2 26 22 26 23.5C26 25.5 24 27 20 27C16.5 27 14 25.5 14 25.5"
        stroke="#007279"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default AppLogo;
