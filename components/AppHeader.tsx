import React from 'react';
import AppLogo from './AppLogo';
import { useTheme } from '../contexts/ThemeContext';

const AppHeader: React.FC = () => {
  const { theme } = useTheme();

  return (
    <header className={`bg-${theme.primary} text-white px-6 py-4 shadow-lg`}>
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="shrink-0">
          <AppLogo size={56} />
        </div>

        {/* Institution Info */}
        <div className="flex-1 min-w-0">
          {/* Line 1: Institution hierarchy */}
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <span className="font-bold">HIT</span>
            <span className="text-white/50">Holon Institute of Technology</span>
            <span className="text-white/40">/</span>
            <span>Faculty of Science</span>
            <span className="text-white/40">/</span>
            <span>Department of Computer Science</span>
          </div>

          {/* Line 2: Report Title */}
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Self Evaluation Report
          </h1>

          {/* Line 3: Academic Year */}
          <div className="text-white/70 text-sm mt-0.5">
            Academic Year 2024/2025
          </div>
        </div>

        {/* Optional: Status badge */}
        <div className={`px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20`}>
          <div className="text-xs text-white/60 uppercase tracking-wider font-medium">Status</div>
          <div className="text-sm font-bold">In Progress</div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
