import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Section, Task } from '../types';
import { getTasksBySection, getSectionProgress } from '../lib/supabase';
import TaskCard from './TaskCard';
import { useAuth } from '../contexts/AuthContext';

interface SectionDetailProps {
  section: Section;
  onAddTask?: () => void;
}

const SectionDetail: React.FC<SectionDetailProps> = ({ section, onAddTask }) => {
  const { currentProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSectionData();
  }, [section.id]);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      const tasksData = await getTasksBySection(section.id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading section data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAddTask = currentProfile?.system_role === 'admin' || currentProfile?.system_role === 'coordinator';

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-white">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Section {section.number}: {section.title}
            </h1>

            {/* Description */}
            <p className="text-gray-500 leading-relaxed max-w-2xl">
              {section.description || 'No description available for this section.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-6">
            {canAddTask && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus size={18} strokeWidth={2.5} />
                Add Task
              </button>
            )}
            <button className="p-2.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mt-8">
          <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-6">
            Tasks & Deliverables
          </h2>

          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 mb-4">No tasks yet for this section</p>
              {canAddTask && (
                <button
                  onClick={onAddTask}
                  className="inline-flex items-center gap-2 px-4 py-2 text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  <Plus size={16} />
                  Create First Task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => console.log('Task clicked:', task.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionDetail;
