import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, Box, LogOut, Bell, List, LayoutGrid } from 'lucide-react';
import Login from './components/Login';
import UserAvatar from './components/UserAvatar';
import SectionTree from './components/SectionTree';
import SectionDetail from './components/SectionDetail';
import TabNavigation, { TabType } from './components/TabNavigation';
import TasksManager from './components/TasksManager';
import GanttView from './components/GanttView';
import MeetingsView from './components/MeetingsView';
import ProjectCalendar from './components/ProjectCalendar';
import TeamManager from './components/TeamManager';
import SettingsPanel from './components/SettingsPanel';
import AppLogo from './components/AppLogo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SectionsProvider, useSections } from './contexts/SectionsContext';
import { Section } from './types';

// --- App Header with Institution Info ---
const AppHeader = () => {
  const { theme } = useTheme();
  const { currentUser, signOut } = useAuth();

  return (
    <header className={`bg-${theme.primary} text-white px-6 py-3 shadow-lg`}>
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="shrink-0">
          <AppLogo size={48} />
        </div>

        {/* Institution Info */}
        <div className="flex-1 min-w-0">
          {/* Line 1: Institution hierarchy */}
          <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
            <span className="font-bold text-white">HIT</span>
            <span>Holon Institute of Technology</span>
            <span className="text-white/40">/</span>
            <span>Faculty of Science</span>
            <span className="text-white/40">/</span>
            <span>Department of Computer Science</span>
          </div>

          {/* Line 2: Report Title */}
          <h1 className="text-lg font-bold tracking-tight">
            Self Evaluation Report
          </h1>

          {/* Line 3: Academic Year */}
          <div className="text-white/60 text-xs">
            Academic Year 2024/2025
          </div>
        </div>

        {/* Right side: notifications and user */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>

          <div className="h-8 w-px bg-white/20" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{currentUser?.name}</div>
              <div className="text-xs text-white/60">{currentUser?.role}</div>
            </div>
            <UserAvatar name={currentUser?.name} role={currentUser?.role} isUser={currentUser?.is_user} size="md" />
            <button
              onClick={signOut}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// --- Main View with Tabs ---
const MainView = () => {
  const { theme } = useTheme();
  const { sections } = useSections();
  const [activeTab, setActiveTab] = useState<TabType>('gantt');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<'list' | 'calendar'>('list');
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Auto-select Organizational Tasks section on first load
  React.useEffect(() => {
    if (!hasAutoSelected && sections.length > 0 && !selectedSection) {
      // Find the Org section
      const orgSection = sections.find(s =>
        s.number === 'Org' || s.title.toLowerCase().includes('organizational')
      );
      if (orgSection) {
        setSelectedSection(orgSection);
        setHasAutoSelected(true);
      }
    }
  }, [sections, hasAutoSelected, selectedSection]);

  return (
    <div className={`flex flex-col h-screen ${theme.bgPrimary}`}>
      {/* App Header */}
      <AppHeader />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <div className="flex h-full">
            {/* Section Tree Sidebar */}
            <SectionTree
              selectedSectionId={selectedSection?.id || null}
              onSelectSection={setSelectedSection}
            />

            {/* Main Content */}
            {selectedSection ? (
              <SectionDetail
                section={selectedSection}
                onAddTask={() => console.log('Add task to section:', selectedSection.id)}
              />
            ) : (
              <div className={`flex-1 flex items-center justify-center ${theme.bgSecondary} m-4 rounded-2xl shadow-sm border border-${theme.border}`}>
                <div className="text-center">
                  <div className={`w-16 h-16 bg-${theme.primaryLight} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Box size={32} className={`text-${theme.primary}`} />
                  </div>
                  <h3 className={`text-lg font-semibold text-${theme.textPrimary} mb-2`}>Select a Section</h3>
                  <p className={`text-sm text-${theme.textSecondary}`}>Choose a section from the tree to view its details and tasks</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="h-full overflow-auto p-6">
            <TasksManager />
          </div>
        )}

        {activeTab === 'gantt' && (
          <GanttView />
        )}

        {activeTab === 'meetings' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* View Mode Toggle */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {calendarViewMode === 'list' ? 'Meetings' : 'Calendar'}
              </h2>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setCalendarViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
                    calendarViewMode === 'list'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <List size={14} /> Meetings
                </button>
                <button
                  onClick={() => setCalendarViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
                    calendarViewMode === 'calendar'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid size={14} /> Calendar
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {calendarViewMode === 'list' ? (
                <MeetingsView />
              ) : (
                <div className="h-full p-6">
                  <ProjectCalendar />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6 h-full overflow-auto">
            <TeamManager />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 h-full overflow-auto">
            <SettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Private Route Wrapper ---
const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: sectionsLoading } = useSections();
  const { theme } = useTheme();

  // Wait for both auth AND sections to load
  const isLoading = authLoading || (currentUser && sectionsLoading);

  if (isLoading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center ${theme.bgPrimary} text-${theme.primary}`}>
        <Loader2 className="animate-spin mb-4" size={48} />
        <span className="text-sm font-semibold uppercase tracking-widest opacity-60">
          {authLoading ? 'Authenticating...' : 'Loading data...'}
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// --- Main App Component ---
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SectionsProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <PrivateRoute>
                  <MainView />
                </PrivateRoute>
              } />
            </Routes>
          </HashRouter>
        </SectionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
