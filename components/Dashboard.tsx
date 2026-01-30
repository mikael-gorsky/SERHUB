
import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, AlertTriangle, Clock, ArrowRight, Loader2, Flag, LayoutDashboard } from 'lucide-react';
import { SectionService } from '../services/SectionService';
import { TaskService } from '../services/TaskService';
import { EventService } from '../services/EventService';
import { Section, Task, CalendarEvent } from '../types';
import { getProgressChartColor } from '../lib/progressUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsData, tasksData, eventsData] = await Promise.all([
          SectionService.getAll(),
          TaskService.getAll(),
          EventService.getAll()
        ]);
        setSections(sectionsData);
        setTasks(tasksData);
        setEvents(eventsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Dashboard...</span>
      </div>
    );
  }

  const getSectionMinProgress = (sectionId: string) => {
    const sectionTasks = tasks.filter(t => t.sectionId === sectionId);
    if (sectionTasks.length === 0) return 0;
    return Math.min(...sectionTasks.map(t => t.progress));
  };

  // Derived Metrics
  const sectionsWithMinProgress = sections.map(s => ({
    ...s,
    calculatedProgress: getSectionMinProgress(s.id)
  }));

  const totalProgress = sectionsWithMinProgress.length > 0 
    ? Math.round(sectionsWithMinProgress.reduce((acc, curr) => acc + curr.calculatedProgress, 0) / sectionsWithMinProgress.length)
    : 0;

  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.progress < 100).length;
  const upcomingDeadlines = events.filter(e => e.type === 'Deadline').slice(0, 3);

  const chartData = sectionsWithMinProgress.map(s => ({
    name: s.number, 
    progress: s.calculatedProgress,
    docs: (s.documentsUploaded / s.documentsExpected) * 100
  }));

  // Use centralized progress chart colors
  const getStatusColor = (progress: number) => {
    return getProgressChartColor(progress);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Info Block Header */}
      <div className="p-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">SER Report</h2>
            <p className="text-xs text-gray-500">
              Progress tracking and statistics
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* --- Main Content Area (8 Cols) --- */}
          <div className="col-span-8 space-y-6 pb-8">

            {/* Project Status Banner */}
        <div className="bg-gradient-to-r from-hit-blue to-hit-dark p-8 rounded-2xl shadow-xl shadow-hit-blue/10 text-white flex items-center justify-between">
           <div>
             <h2 className="text-3xl font-black mb-1">Institutional SER Status</h2>
             <p className="text-blue-100 text-sm font-medium">Target Submission Cycle: 2026</p>
           </div>
           <div className="flex items-center gap-5 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
              <Flag size={24} className="text-hit-accent" />
              <div>
                <span className="text-[10px] uppercase text-blue-200 font-black block tracking-widest">Global Status</span>
                <span className="font-bold text-lg">{totalProgress < 25 ? 'Initialization' : totalProgress < 75 ? 'Implementation' : 'Finalization'}</span>
              </div>
           </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Global Readiness</p>
              <h3 className="text-3xl font-black text-gray-800 mt-2">{totalProgress}%</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-hit-blue flex items-center justify-center">
              <CheckCircle size={28} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Overdue Tasks</p>
              <h3 className="text-3xl font-black text-red-600 mt-2">{overdueTasks}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Sections</p>
              <h3 className="text-3xl font-black text-gray-800 mt-2">{sections.length}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText size={28} />
            </div>
          </div>
        </div>

        {/* Readiness Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight">Step Readiness Metrics (Min Task Progress)</h3>
            <button className="text-xs font-bold text-hit-blue hover:text-hit-dark uppercase tracking-widest transition-colors" onClick={() => navigate('/sections')}>View all steps</button>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  labelStyle={{fontWeight: 900, color: '#1e293b', marginBottom: '4px'}}
                />
                <Bar dataKey="progress" radius={[8, 8, 8, 8]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.progress)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionsWithMinProgress.map((section) => (
            <div 
              key={section.id} 
              onClick={() => navigate(`/edit-step/${section.id}`)}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl hover:border-hit-blue transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-hit-dark text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-hit-blue transition-colors">{section.number}</span>
                <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm`} style={{backgroundColor: getStatusColor(section.calculatedProgress)}}></span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2 truncate group-hover:text-hit-blue transition-colors">{section.title}</h4>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">
                <span>{section.tasksOpen} Tasks</span>
                <span>{section.calculatedProgress}% READINESS</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2.5 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 shadow-sm" 
                  style={{width: `${section.calculatedProgress}%`, backgroundColor: getStatusColor(section.calculatedProgress)}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Right Sidebar (4 Cols) --- */}
      <div className="col-span-4 space-y-6">
        
        {/* Deadlines Widget */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-black text-lg text-gray-900 mb-6 flex items-center gap-3">
            <Clock size={22} className="text-hit-accent" />
            Critical Deadlines
          </h3>
          <div className="space-y-6">
            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((event) => (
              <div key={event.id} className="flex gap-5 items-center pb-6 border-b border-gray-50 last:border-0 last:pb-0 group">
                <div className="flex flex-col items-center bg-blue-50 text-hit-blue px-4 py-2 rounded-2xl min-w-[70px] transition-colors group-hover:bg-hit-blue group-hover:text-white">
                  <span className="text-[10px] font-black uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-2xl font-black">{new Date(event.date).getDate()}</span>
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 text-sm leading-tight">{event.title}</h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{event.sectionId ? sections.find(s => s.id === event.sectionId)?.number : 'Platform'}</p>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-400 italic py-8 text-center font-medium">No upcoming institutional deadlines.</div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-gradient-to-br from-hit-dark to-hit-blue p-8 rounded-3xl shadow-2xl shadow-hit-dark/20 text-white">
          <h3 className="font-black text-lg mb-6 uppercase tracking-tight">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-white/10 hover:bg-white/20 text-left px-5 py-4 rounded-2xl text-sm font-bold flex items-center justify-between transition-all group">
              <span>Generate Status PDF</span>
              <FileText size={18} className="text-blue-200 group-hover:text-white transition-colors" />
            </button>
            <button className="w-full bg-white/10 hover:bg-white/20 text-left px-5 py-4 rounded-2xl text-sm font-bold flex items-center justify-between transition-all group">
              <span>Master Archive Drive</span>
              <ArrowRight size={18} className="text-blue-200 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
