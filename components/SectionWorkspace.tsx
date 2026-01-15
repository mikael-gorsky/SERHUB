
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileText, ExternalLink, 
  Circle, MoreHorizontal, Plus,
  UploadCloud, Loader2,
  Sparkles,
  Calendar,
  Edit2,
  CheckCircle2
} from 'lucide-react';
import { SectionService } from '../services/SectionService';
import { TaskService } from '../services/TaskService';
import { DocumentService } from '../services/DocumentService';
import { UserService } from '../services/UserService';
import { Section, Task, Document, User } from '../types';

const SectionWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'tasks' | 'files'>('tasks');
  
  const [section, setSection] = useState<Section | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectionData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const sectionData = await SectionService.getById(id);
        setSection(sectionData || null);

        if (sectionData) {
          const [tasksData, docsData] = await Promise.all([
            TaskService.getBySectionId(id),
            DocumentService.getBySectionId(id)
          ]);
          setTasks(tasksData);
          setDocs(docsData);
        }
      } catch (error) {
        console.error("Error fetching section details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSectionData();
  }, [id]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white text-hit-blue">
      <Loader2 className="animate-spin mr-2" /> 
      <span className="font-medium">Loading Step Details...</span>
    </div>
  );

  if (!section) return <div className="p-8">Step not found</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/sections" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors group">
            <ArrowLeft size={20} />
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Back to Steps</span>
          </Link>
          <div className="h-8 w-px bg-gray-100"></div>
          <div>
            <div className="flex items-center gap-3">
                <span className="text-xs font-black bg-hit-blue text-white px-2.5 py-1 rounded-md">
                    {section.number}
                </span>
                <h1 className="text-xl font-bold text-gray-900">{section.title}</h1>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-black uppercase tracking-widest">Managing Content & Evidence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'tasks' ? 'bg-white text-hit-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Task List
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'files' ? 'bg-white text-hit-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Evidence Repository
            </button>
          </div>
          
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          <button className="flex items-center gap-2 bg-blue-50 text-hit-blue px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">
            <FileText size={16} /> Edit Document
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-50/50">
        {/* Step Sidebar */}
        <div className="w-80 border-r border-gray-100 bg-white p-8 overflow-y-auto hidden xl:block shrink-0">
            <div className="mb-10">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Current Progress</h3>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="flex mb-3 items-center justify-between">
                        <span className="text-lg font-black text-hit-blue">{section.progress}%</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Complete</span>
                    </div>
                    <div className="overflow-hidden h-2.5 flex rounded-full bg-gray-200">
                        <div style={{ width: `${section.progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-hit-blue transition-all duration-1000"></div>
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <div className="bg-hit-dark rounded-2xl p-6 text-white shadow-lg shadow-hit-dark/20">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60 mb-4">Institutional Deadline</h4>
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 p-2.5 rounded-xl text-hit-accent shadow-inner"><Calendar size={20} /></div>
                      <div>
                        <p className="text-lg font-black">{section.nextDeadline}</p>
                        <p className="text-[10px] text-blue-100 font-bold uppercase mt-0.5 tracking-tight">Status: In Review</p>
                      </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10">
            
            {activeTab === 'tasks' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Step Checklist</h2>
                            <p className="text-sm text-gray-500">Action items required to complete this section.</p>
                        </div>
                        <button className="flex items-center gap-2 text-sm bg-hit-blue text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:bg-hit-dark shadow-lg shadow-hit-blue/20">
                            <Plus size={18} /> Add Task
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        {tasks.length > 0 ? tasks.map(task => {
                            const isDone = task.progress === 100;
                            return (
                                <div key={task.id} className={`p-5 hover:bg-blue-50/20 flex items-start justify-between group transition-colors ${isDone ? 'opacity-70' : ''}`}>
                                    <div className="flex items-start gap-5">
                                        <div className="mt-1 transition-colors">
                                          {isDone ? (
                                              <CheckCircle2 size={22} className="text-green-500" />
                                          ) : (
                                              <Circle size={22} className="text-gray-300" />
                                          )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                              <p className={`font-bold ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                {task.title}
                                              </p>
                                              {task.author === 'AI' && (
                                                <span className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100 font-black">
                                                  <Sparkles size={10} /> AI TASK
                                                </span>
                                              )}
                                            </div>
                                            <p className={`text-sm leading-relaxed ${isDone ? 'text-gray-400' : 'text-gray-500'}`}>{task.description}</p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{task.author}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                                                  <Calendar size={12} /> Due: {task.dueDate}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-gray-400 hover:text-hit-blue p-2.5 bg-gray-50 rounded-xl transition-colors"><Edit2 size={16} /></button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-16 text-center text-gray-400">
                                <Plus size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="text-lg">No tasks assigned to this step yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'files' && (
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex items-start gap-5 shadow-sm">
                        <div className="bg-orange-100 p-3.5 rounded-2xl text-orange-600">
                            <UploadCloud size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-orange-900">Evidence Compliance</h4>
                            <p className="text-sm text-orange-800/70 mt-1 leading-relaxed">
                              {section.documentsExpected} mandatory files are required for this step. {section.documentsUploaded} have been verified.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docs.map(doc => (
                             <div key={doc.id} className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-hit-blue group transition-all shadow-sm hover:shadow-xl">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="w-14 h-14 bg-hit-blue/5 rounded-2xl flex items-center justify-center text-hit-blue font-black text-sm">
                                        {doc.type}
                                    </div>
                                    <button className="text-gray-300 hover:text-gray-600 p-1"><MoreHorizontal size={20} /></button>
                                </div>
                                <h4 className="text-lg font-bold text-gray-800 truncate mb-1" title={doc.name}>{doc.name}</h4>
                                <p className="text-xs text-gray-400 mb-6 font-medium">Synced: {doc.lastUpdated}</p>
                                <div className="pt-5 border-t border-gray-50 flex justify-between items-center">
                                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${doc.status === 'Uploaded' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {doc.status}
                                    </span>
                                    <a href={doc.url} className="text-xs font-bold text-hit-blue hover:text-hit-dark flex items-center gap-1.5 transition-colors">
                                        View File <ExternalLink size={12} />
                                    </a>
                                </div>
                             </div>
                        ))}
                        <div className="border-3 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-10 text-gray-400 hover:border-hit-blue hover:text-hit-blue hover:bg-blue-50/50 transition-all cursor-pointer min-h-[220px]">
                            <Plus size={40} strokeWidth={3} />
                            <span className="text-sm font-black mt-4 uppercase tracking-widest">Add Evidence</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SectionWorkspace;
