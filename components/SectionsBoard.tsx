
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  FileText,
  Loader2,
  Clock
} from 'lucide-react';
import { SectionService } from '../services/SectionService';
import { TaskService } from '../services/TaskService';
import { Section, Task } from '../types';

const SectionsBoard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsData, tasksData] = await Promise.all([
          SectionService.getAll(),
          TaskService.getAll()
        ]);
        setSections(sectionsData);
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching board data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStepStyles = (stepNumber: string) => {
    const num = parseInt(stepNumber.replace(/[^0-9]/g, ''));
    switch(num) {
      case 1: return "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50";
      case 2: return "bg-gradient-to-br from-emerald-50 to-amber-50 text-hit-blue border-emerald-100 shadow-emerald-100/30";
      case 3: return "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50";
      case 4: return "bg-gradient-to-br from-amber-50 to-rose-50 text-hit-blue border-amber-100 shadow-amber-100/30";
      case 5: return "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50";
      default: return "bg-gray-50 text-gray-700 border-gray-100 shadow-gray-100/50";
    }
  };

  const getStepIconColor = (stepNumber: string) => {
    const num = parseInt(stepNumber.replace(/[^0-9]/g, ''));
    switch(num) {
      case 1: return "bg-emerald-500 shadow-emerald-500/20";
      case 2: return "bg-emerald-400 shadow-emerald-400/20";
      case 3: return "bg-amber-400 shadow-amber-400/20";
      case 4: return "bg-amber-500 shadow-amber-500/20";
      case 5: return "bg-rose-500 shadow-rose-500/20";
      default: return "bg-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" size={32} />
        <span className="font-bold">Loading Project Roadmap...</span>
      </div>
    );
  }

  const getSectionMinProgress = (sectionId: string) => {
    const sectionTasks = tasks.filter(t => t.sectionId === sectionId);
    if (sectionTasks.length === 0) return 0;
    return Math.min(...sectionTasks.map(t => t.progress));
  };

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear()).slice(-2);
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Institutional Roadmap</h2>
          <p className="text-gray-500 font-medium mt-1">Global progress tracking based on specific phase readiness.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search steps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-hit-blue text-sm font-medium transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => {
            const minProgress = getSectionMinProgress(section.id);
            const stepStyles = getStepStyles(section.number);
            const iconStyles = getStepIconColor(section.number);
            
            return (
              <div
                key={section.id}
                onClick={() => navigate(`/edit-step/${section.id}`)}
                className={`group rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center gap-6 shadow-sm border ${stepStyles} hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-4 lg:w-[28%] shrink-0">
                  <div className={`w-14 h-14 rounded-2xl text-white flex flex-col items-center justify-center shrink-0 shadow-lg ${iconStyles} transition-transform group-hover:scale-105`}>
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 leading-none mb-1">Step</span>
                    <span className="text-xl font-black leading-none">{section.number.split(' ')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-gray-900 group-hover:text-hit-blue transition-colors truncate">
                      {section.title}
                    </h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Institutional Phase</p>
                  </div>
                </div>

                <div className="lg:flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium line-clamp-1 leading-relaxed opacity-80">
                    {section.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 lg:w-[35%] shrink-0">
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Readiness
                      </span>
                      <span className="text-xs font-black text-gray-900">
                        {minProgress}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-white/50 rounded-full overflow-hidden border border-black/5">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out shadow-sm ${iconStyles.split(' ')[0]}`}
                        style={{ width: `${minProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="hidden lg:block h-10 w-px bg-black/5"></div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center min-w-[65px]">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Due</span>
                      <div className="flex items-center gap-1 text-xs font-black text-gray-700">
                        <Clock size={12} className="text-hit-accent" />
                        {formatShortDate(section.nextDeadline)}
                      </div>
                    </div>

                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Docs</span>
                      <div className="flex items-center gap-1 text-xs font-black text-hit-blue">
                        <FileText size={12} />
                        {section.documentsUploaded}/{section.documentsExpected}
                      </div>
                    </div>

                    <div className="ml-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-400 group-hover:bg-hit-blue group-hover:text-white transition-all shadow-sm">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-20 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">No matching steps found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search keywords.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 text-hit-blue font-bold text-sm hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionsBoard;
