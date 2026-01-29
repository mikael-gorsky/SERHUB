import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Trash2,
  Link,
  Unlink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Group, Task, Profile } from '../types';
import { GroupService } from '../services/GroupService';
import { TaskService } from '../services/TaskService';
import { UserService } from '../services/UserService';

interface GroupModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  group: Group | null;
  parentGroup: Group | null;
  onClose: () => void;
  onSave: () => void;
}

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  mode,
  group,
  parentGroup,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    number: '',
    title: '',
    description: '',
    owner_id: ''
  });

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [linkedTaskIds, setLinkedTaskIds] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');

  // Compute the target level for creation
  const targetLevel = parentGroup ? (parentGroup.level + 1) as 1 | 2 | 3 : 2;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load profiles for owner selection
        const profilesData = await UserService.getAll();
        setProfiles(profilesData);

        // Load all tasks for linking
        const tasksData = await TaskService.getAll();
        setAllTasks(tasksData);

        // If editing, load the group's linked tasks
        if (mode === 'edit' && group) {
          const groupTasks = await GroupService.getTasks(group.id);
          setLinkedTaskIds(new Set(groupTasks.map(t => t.id)));

          setFormData({
            number: group.number,
            title: group.title,
            description: group.description || '',
            owner_id: group.owner_id || ''
          });
        } else if (mode === 'create' && parentGroup) {
          // Generate next number for new group
          const nextNumber = await GroupService.generateNextNumber(parentGroup.number, parentGroup.id);
          setFormData({
            number: nextNumber,
            title: '',
            description: '',
            owner_id: ''
          });
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, mode, group, parentGroup]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleTask = (taskId: string) => {
    setLinkedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (mode === 'create') {
        // Create new group
        const sortOrder = await GroupService.getNextSortOrder(parentGroup?.id, targetLevel);
        const newGroup = await GroupService.create({
          number: formData.number,
          title: formData.title,
          description: formData.description || undefined,
          owner_id: formData.owner_id || undefined,
          parent_id: parentGroup?.id,
          level: targetLevel,
          sort_order: sortOrder,
          is_fixed: false
        });

        // Link tasks
        if (newGroup) {
          for (const taskId of linkedTaskIds) {
            await GroupService.linkTask(newGroup.id, taskId);
          }
        }
      } else if (mode === 'edit' && group) {
        // Update group
        await GroupService.update(group.id, {
          number: formData.number,
          title: formData.title,
          description: formData.description || undefined,
          owner_id: formData.owner_id || undefined
        });

        // Update linked tasks
        const currentTasks = await GroupService.getTasks(group.id);
        const currentTaskIds = new Set(currentTasks.map(t => t.id));

        // Unlink tasks that were removed
        for (const taskId of currentTaskIds) {
          if (!linkedTaskIds.has(taskId)) {
            await GroupService.unlinkTask(group.id, taskId);
          }
        }

        // Link new tasks
        for (const taskId of linkedTaskIds) {
          if (!currentTaskIds.has(taskId)) {
            await GroupService.linkTask(group.id, taskId);
          }
        }
      }

      onSave();
    } catch (err) {
      console.error('Error saving group:', err);
      setError('Failed to save group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!group || group.is_fixed) return;

    if (!confirm(`Are you sure you want to delete "${group.title}"? This will also delete all sub-groups.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await GroupService.delete(group.id);
      onSave();
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter tasks by search
  const filteredTasks = allTasks.filter(task => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(search) ||
      task.section?.title?.toLowerCase().includes(search) ||
      task.section?.number?.toLowerCase().includes(search)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === 'create' ? 'Add Sub-Group' : 'Edit Group'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link size={16} />
            Linked Tasks
            {linkedTaskIds.size > 0 && (
              <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded text-xs">
                {linkedTaskIds.size}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-teal-600" size={32} />
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., 1.1"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Group title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  placeholder="Optional description"
                />
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <select
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">No owner</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Info */}
              {mode === 'create' && parentGroup && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  Creating sub-group under <strong>{parentGroup.number}. {parentGroup.title}</strong>
                </div>
              )}

              {mode === 'edit' && group?.is_fixed && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  This is a fixed group. It cannot be deleted, but you can edit its title and description.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Task list */}
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[400px] overflow-auto">
                {filteredTasks.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No tasks found
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                        linkedTaskIds.has(task.id)
                          ? 'bg-teal-50 hover:bg-teal-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        linkedTaskIds.has(task.id)
                          ? 'bg-teal-600 border-teal-600'
                          : 'border-gray-300'
                      }`}>
                        {linkedTaskIds.has(task.id) && (
                          <CheckCircle2 size={14} className="text-white" />
                        )}
                      </div>

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{task.title}</div>
                        <div className="text-xs text-gray-500">
                          {task.section?.number} {task.section?.title}
                        </div>
                      </div>

                      {/* Status indicators */}
                      <div className="flex items-center gap-2 shrink-0">
                        {task.blocked && (
                          <AlertTriangle size={16} className="text-red-500" title="Blocked" />
                        )}
                        {task.status === 100 ? (
                          <CheckCircle2 size={16} className="text-emerald-500" title="Completed" />
                        ) : (
                          <span className="text-xs text-gray-400">{task.status}%</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="text-sm text-gray-500">
                {linkedTaskIds.size} task{linkedTaskIds.size !== 1 ? 's' : ''} linked
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {mode === 'edit' && group && !group.is_fixed && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
