import React, { useState, useEffect } from 'react';
import { FolderTree, Box } from 'lucide-react';
import { Group } from '../types';
import { GroupService } from '../services/GroupService';
import { useAuth } from '../contexts/AuthContext';
import GroupTree from './GroupTree';
import GroupDetail from './GroupDetail';
import GroupModal from './GroupModal';

const GanttView: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [parentGroup, setParentGroup] = useState<Group | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Auto-select first group when loaded
  useEffect(() => {
    const loadFirstGroup = async () => {
      if (!selectedGroup) {
        const groups = await GroupService.getHierarchy();
        if (groups.length > 0) {
          setSelectedGroup(groups[0]);
        }
      }
    };
    loadFirstGroup();
  }, []);

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleAddGroup = (parent: Group) => {
    setParentGroup(parent);
    setEditingGroup(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setParentGroup(null);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setParentGroup(null);
  };

  const handleModalSave = async () => {
    setRefreshTrigger(prev => prev + 1);
    handleModalClose();

    // Refresh selected group data
    if (selectedGroup) {
      const groups = await GroupService.getHierarchy();
      const findGroup = (items: Group[], id: string): Group | null => {
        for (const g of items) {
          if (g.id === id) return g;
          if (g.children) {
            const found = findGroup(g.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const updated = findGroup(groups, selectedGroup.id);
      if (updated) {
        setSelectedGroup(updated);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Group Tree */}
      <GroupTree
        selectedGroupId={selectedGroup?.id || null}
        onSelectGroup={handleSelectGroup}
        onAddGroup={handleAddGroup}
        onEditGroup={handleEditGroup}
        refreshTrigger={refreshTrigger}
      />

      {/* Right Panel: Group Detail */}
      {selectedGroup ? (
        <GroupDetail
          group={selectedGroup}
          onRefresh={handleRefresh}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Box size={32} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a Group</h3>
            <p className="text-sm text-gray-500">
              Choose a project phase from the tree to view its tasks
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <GroupModal
          isOpen={isModalOpen}
          mode={modalMode}
          group={editingGroup}
          parentGroup={parentGroup}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default GanttView;
