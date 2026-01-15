
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  CheckSquare, 
  Calendar, 
  Database, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Loader2,
  ChevronDown
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import EditStep from './components/EditStep';
import TasksManager from './components/TasksManager';
import KnowledgeVault from './components/KnowledgeVault';
import SectionsBoard from './components/SectionsBoard';
import ProjectCalendar from './components/ProjectCalendar';
import SettingsPanel from './components/SettingsPanel';
import TeamManager from './components/TeamManager';
import Login from './components/Login';
import UserAvatar from './components/UserAvatar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- Sidebar Component ---
const Sidebar = () => {
  const location = useLocation();
  const { currentUser, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Layers, label: 'Steps', path: '/sections' }, 
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Database, label: 'Repository', path: '/repository' },
    { icon: BookOpen, label: 'Knowledge Vault', path: '/knowledge' },
    { icon: Users, label: 'Team', path: '/team' },
  ];

  if (!currentUser) return null;

  return (
    <div className="w-64 bg-hit-dark text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl border-r border-white/5">
      <div className="p-8 border-b border-white/10 flex items-center gap-4">
        <div className="w-10 h-10 bg-hit-accent rounded-xl flex items-center justify-center font-black text-hit-dark shadow-lg rotate-3">S</div>
        <div>
          <h1 className="font-black text-xl tracking-tighter leading-none">SER HUB</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mt-1 opacity-70">HIT Platform</p>
        </div>
      </div>
      
      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
              isActive(item.path) 
                ? 'bg-hit-blue text-white shadow-xl shadow-hit-blue/30 scale-[1.02]' 
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon size={20} className={isActive(item.path) ? 'text-hit-accent' : 'text-blue-300 group-hover:text-white'} />
            <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10 bg-black/10">
        <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-6 ${isActive('/settings') ? 'bg-hit-blue text-white shadow-lg' : 'text-blue-200 hover:text-white hover:bg-white/5'}`}>
          <Settings size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Settings</span>
        </Link>
        
        <div className="pt-6 border-t border-white/10 flex items-center gap-4 px-2 group cursor-pointer">
          <UserAvatar name={currentUser.name} size="md" className="border-2 border-hit-accent shadow-lg shadow-hit-accent/20" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate uppercase tracking-tight">{currentUser.name}</p>
            <p className="text-[9px] font-black text-blue-300 truncate uppercase tracking-widest mt-0.5">{currentUser.role}</p>
          </div>
          <button 
            onClick={signOut}
            className="text-blue-400 hover:text-hit-accent transition-colors p-1"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Header Component ---
const Header = ({ title }: { title?: string }) => {
  const { currentUser } = useAuth();
  
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 fixed left-64 right-0 top-0 z-40 shadow-sm">
      <div className="flex flex-col">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title || 'Dashboard'}</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Institutional Command Center</p>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="pl-12 pr-6 py-2.5 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-hit-blue focus:outline-none w-72 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-6">
          <button className="relative p-2.5 text-gray-400 hover:bg-gray-50 hover:text-hit-blue rounded-xl transition-all">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-hit-accent rounded-full border-2 border-white"></span>
          </button>
          
          <div className="h-10 w-px bg-gray-100"></div>
          
          <div className="flex items-center gap-3 group cursor-default">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-900 leading-none">{currentUser?.name}</p>
                <p className="text-[9px] font-black text-hit-blue uppercase tracking-widest mt-1">{currentUser?.role}</p>
             </div>
             <UserAvatar name={currentUser?.name} size="md" className="border-2 border-gray-50 shadow-sm" />
             <ChevronDown size={14} className="text-gray-300 group-hover:text-hit-blue transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
};

// --- Private Route Wrapper ---
const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-hit-blue">
        <Loader2 className="animate-spin mb-4" size={48} />
        <span className="text-sm font-black uppercase tracking-[0.3em] opacity-60">Syncing Institutional Core...</span>
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
    <AuthProvider>
      <HashRouter>
        <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
          <Sidebar />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/*" element={
              <PrivateRoute>
                <div className="flex-1 flex flex-col ml-64">
                  <Routes>
                    <Route path="/" element={<><Header title="Executive Dashboard" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><Dashboard /></main></>} />
                    <Route path="/sections" element={<><Header title="Project Roadmap" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><SectionsBoard /></main></>} />
                    <Route path="/edit-step/:id" element={<EditStep />} />
                    <Route path="/tasks" element={<><Header title="Task Authority" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><TasksManager /></main></>} />
                    <Route path="/calendar" element={<><Header title="Institutional Calendar" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><ProjectCalendar /></main></>} />
                    <Route path="/repository" element={<><Header title="Evidence Repository" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><ComingSoon title="Repository" /></main></>} />
                    <Route path="/knowledge" element={<><Header title="Knowledge Vault" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><KnowledgeVault /></main></>} />
                    <Route path="/team" element={<><Header title="Team & Access" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><TeamManager /></main></>} />
                    <Route path="/settings" element={<><Header title="System Settings" /><main className="flex-1 mt-20 p-10 overflow-y-auto bg-gray-50/50"><SettingsPanel /></main></>} />
                  </Routes>
                </div>
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

const ComingSoon = ({ title }: { title: string }) => (
  <div className="p-12 flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-[3rem] shadow-sm border border-gray-100">
    <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-gray-200">
      <Database size={48} />
    </div>
    <h3 className="text-2xl font-black text-gray-700 uppercase tracking-tight">{title} Module</h3>
    <p className="text-sm font-medium mt-2">Institutional data synchronization in progress.</p>
  </div>
);

export default App;
