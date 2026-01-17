import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  Mail,
  User as UserIcon,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { UserService } from '../services/UserService';
import { RoleService, Role } from '../services/RoleService';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import UserAvatar from './UserAvatar';

// Color mappings for role badges
const roleColors: Record<string, string> = {
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200'
};

const statColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', icon: 'text-red-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', icon: 'text-purple-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', icon: 'text-green-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', icon: 'text-amber-600' }
};

const TeamManager = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        UserService.getAllAsUsers(),
        RoleService.getAll()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      // Set default role to last role (lowest privilege)
      if (rolesData.length > 0) {
        setFormData(prev => ({ ...prev, role: rolesData[rolesData.length - 1].id }));
      }
    } catch (error) {
      console.error("TeamManager: Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to get role info
  const getRole = (roleId: string): Role | undefined => roles.find(r => r.id === roleId);
  const canManage = roles.find(r => r.id === currentUser?.role)?.can_manage || false;

  const handleEditClick = (user: User) => {
    setFormMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setFormMode('create');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      role: roles.length > 0 ? roles[roles.length - 1].id : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      alert("System Error: Could not locate user record.");
      return;
    }

    if (!window.confirm(`Action Required: Are you sure you want to deactivate ${userToDelete.name}? This will revoke all project access.`)) return;

    try {
      await UserService.deactivateUser(userId);
      // Immediately update UI state for responsive feel
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      console.log(`Successfully deactivated user: ${userId}`);
    } catch (error: any) {
      console.error("Deactivate operation failed:", error);
      const errorMessage = error.message?.includes('permission-denied')
        ? "Access Denied: Your account does not have permission to modify this record."
        : "System Error: Failed to process deactivation. Please refresh and try again.";
      alert(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formMode === 'create') {
        // User creation requires authentication signup
        alert("New users must register through the login page. You can then adjust their role here.");
        setIsModalOpen(false);
        return;
      } else if (formMode === 'edit' && selectedUser) {
        // Update user's system role
        await UserService.updateSystemRole(selectedUser.id, formData.role);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading User Directory...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 relative">
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-hit-blue" /> User Directory
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage institutional access and project roles.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                type="text" 
                placeholder="Search team members..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hit-blue"
                />
            </div>
            {canManage && (
                <button 
                  onClick={handleAddClick}
                  className="flex items-center gap-2 px-4 py-2 bg-hit-blue text-white rounded-lg text-sm font-medium hover:bg-hit-dark transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add Member
                </button>
            )}
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">User Identity</th>
                <th className="px-6 py-4">Institutional Role</th>
                <th className="px-6 py-4">Access Status</th>
                <th className="px-6 py-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} size="md" />
                      <div>
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Mail size={10} /> {user.email || 'No email provided'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const role = getRole(user.role);
                      const colorClass = roleColors[role?.color || 'blue'] || roleColors.blue;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${colorClass}`}>
                          {role?.can_manage && <Shield size={10} />}
                          {role?.label || user.role}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Verified
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManage && user.id !== currentUser?.id ? (
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => handleEditClick(user)}
                                className="p-2 text-gray-400 hover:text-hit-blue hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Role"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(user.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:scale-110 active:scale-90"
                                title="Remove from Team"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : user.id === currentUser?.id ? (
                       <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest px-4">Active Session</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <UserIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">No team members match your search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Stats */}
      <div className="w-80 shrink-0 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-black text-gray-800 mb-6 uppercase tracking-tight">Team Structure</h3>
          
          <div className="space-y-4">
            {roles.map(role => {
              const colors = statColors[role.color] || statColors.blue;
              const count = users.filter(u => u.role === role.id).length;
              return (
                <div key={role.id} className={`flex items-center justify-between p-4 ${colors.bg} rounded-2xl border ${colors.border}`}>
                  <div className="flex items-center gap-3">
                    <div className={`bg-white p-2.5 rounded-xl ${colors.icon} shadow-sm`}>
                      {role.can_manage ? <Shield size={18} /> : <Users size={18} />}
                    </div>
                    <div>
                      <p className={`text-[10px] ${colors.text} font-black uppercase tracking-widest`}>{role.label}s</p>
                      <p className={`text-xl font-black ${colors.text.replace('600', '900')}`}>{count}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
             <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Access Policy</h4>
             <p className="text-xs text-gray-500 leading-relaxed font-medium">
               Institutional coordinators retain management privileges. Team member accounts must be managed through standard authentication protocols.
             </p>
          </div>
        </div>
      </div>

      {/* --- USER FORM MODAL --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-xl font-black text-gray-800 tracking-tight">
                          {formMode === 'create' ? 'Onboard New Member' : 'Refine User Access'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Legal Name</label>
                          <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hit-blue transition-all"
                              placeholder="e.g. Dr. Jane Smith"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Institutional Email</label>
                          <input 
                              type="email" 
                              required
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hit-blue transition-all"
                              placeholder="jane.s@hit.ac.il"
                          />
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Project Role</label>
                          <select
                              value={formData.role}
                              onChange={e => setFormData({...formData, role: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hit-blue transition-all cursor-pointer"
                          >
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.label}</option>
                              ))}
                          </select>
                      </div>

                      <div className="pt-4 flex gap-4">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50"
                          >
                              Discard
                          </button>
                          <button 
                              type="submit" 
                              disabled={isSaving}
                              className="flex-1 py-3 bg-hit-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-hit-dark flex items-center justify-center gap-2 shadow-lg shadow-hit-blue/20"
                          >
                              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                              {formMode === 'create' ? 'Invite Member' : 'Update User'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeamManager;