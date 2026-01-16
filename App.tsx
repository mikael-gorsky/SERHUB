import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Loader2,
  LogOut,
  Box
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import TasksManager from './components/TasksManager';
import KnowledgeVault from './components/KnowledgeVault';
import ProjectCalendar from './components/ProjectCalendar';
import SettingsPanel from './components/SettingsPanel';
import TeamManager from './components/TeamManager';
import Login from './components/Login';
import UserAvatar from './components/UserAvatar';
import SectionTree from './components/SectionTree';
import SectionDetail from './components/SectionDetail';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Section } from './types';

// --- Top Header Component ---
const TopHeader = () => {
  const location = useLocation();
  const { currentUser, signOut } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Reports', path: '/reports' },
    { label: 'Compliance', path: '/compliance' },
    { label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed left-0 right-0 top-0 z-50">
      {/* Left: Logo and Search */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
            <Box size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">SERHUB</span>
        </Link>

        {/* Search */}
        <div className="relative ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search report content..."
            className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none w-64 transition-all"
          />
        </div>
      </div>

      {/* Center: Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'text-teal-700 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right: Actions and User */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <UserAvatar name={currentUser?.name} size="md" className="border-2 border-gray-100" />
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

// --- Reports View (Section Tree + Detail) - Full page without header ---
const ReportsView = () => {
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  return (
    <div className="flex h-screen">
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
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Box size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Section</h3>
            <p className="text-sm text-gray-500">Choose a section from the tree to view its details and tasks</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Private Route Wrapper ---
const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-teal-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <span className="text-sm font-semibold uppercase tracking-widest opacity-60">Loading...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// --- Page Wrapper ---
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-16 p-8 min-h-[calc(100vh-64px)] bg-gray-50">
    {children}
  </div>
);

// --- Layout with Header (for non-reports pages) ---
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    <TopHeader />
    <PageWrapper>{children}</PageWrapper>
  </div>
);

// --- Main App Component ---
const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Reports - Full page layout without header */}
          <Route path="/reports" element={
            <PrivateRoute>
              <ReportsView />
            </PrivateRoute>
          } />
          <Route path="/reports/:sectionId" element={
            <PrivateRoute>
              <ReportsView />
            </PrivateRoute>
          } />

          {/* Other pages - With header */}
          <Route path="/*" element={
            <PrivateRoute>
              <Routes>
                <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
                <Route path="/compliance" element={<MainLayout><TasksManager /></MainLayout>} />
                <Route path="/tasks" element={<MainLayout><TasksManager /></MainLayout>} />
                <Route path="/calendar" element={<MainLayout><ProjectCalendar /></MainLayout>} />
                <Route path="/knowledge" element={<MainLayout><KnowledgeVault /></MainLayout>} />
                <Route path="/team" element={<MainLayout><TeamManager /></MainLayout>} />
                <Route path="/settings" element={<MainLayout><SettingsPanel /></MainLayout>} />
              </Routes>
            </PrivateRoute>
          } />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
