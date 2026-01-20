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
  X,
  Check,
  Phone,
  UserCheck,
  UserX
} from 'lucide-react';
import { UserService } from '../services/UserService';
import { useAuth } from '../contexts/AuthContext';
import { Profile, SystemRole } from '../types';
import UserAvatar from './UserAvatar';

// Color scheme based on role and is_user status
const getRoleBadgeStyle = (role: SystemRole, isUser: boolean): string => {
  switch (role) {
    case 'admin':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'supervisor':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'contributor':
      return isUser
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-gray-600 text-gray-100 border-gray-700';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getRoleLabel = (role: SystemRole): string => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'supervisor': return 'Supervisor';
    case 'contributor': return 'Contributor';
    default: return role;
  }
};

const TeamManager = () => {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    other_contact: '',
    role: 'contributor' as SystemRole,
    is_user: false
  });

  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const profilesData = await UserService.getAll();
      setProfiles(profilesData);
    } catch (error) {
      console.error("TeamManager: Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if current user can manage (admin or supervisor)
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const handleRowClick = (profile: Profile) => {
    setFormMode('edit');
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      email: profile.email || '',
      description: profile.description || '',
      other_contact: profile.other_contact || '',
      role: profile.role,
      is_user: profile.is_user
    });
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setFormMode('create');
    setSelectedProfile(null);
    setFormData({
      name: '',
      email: '',
      description: '',
      other_contact: '',
      role: 'contributor',
      is_user: false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation(); // Prevent row click
    const profileToDelete = profiles.find(p => p.id === profileId);
    if (!profileToDelete) {
      alert("System Error: Could not locate profile record.");
      return;
    }

    if (profileToDelete.is_user) {
      alert("Cannot delete a user account. Only non-user collaborators can be deleted.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${profileToDelete.name}"? This action cannot be undone.`)) return;

    try {
      await UserService.deleteCollaborator(profileId);
      setProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
    } catch (error: any) {
      console.error("Delete operation failed:", error);
      alert(error.message || "Failed to delete collaborator.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formMode === 'create') {
        // Create a new collaborator
        const newProfile = await UserService.createCollaborator({
          name: formData.name,
          email: formData.email,
          description: formData.description || undefined,
          other_contact: formData.other_contact || undefined,
          role: formData.role
        });
        if (newProfile) {
          setProfiles(prev => [...prev, newProfile]);
        }
      } else if (formMode === 'edit' && selectedProfile) {
        // Update existing profile
        const updated = await UserService.updateProfile(selectedProfile.id, {
          name: formData.name,
          email: formData.email,
          description: formData.description || null,
          other_contact: formData.other_contact || null,
          role: formData.role,
          is_user: formData.is_user
        });
        if (updated) {
          setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
        }
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Save failed", error);
      alert(error.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Separate users and non-users
  const users = filteredProfiles.filter(p => p.is_user);
  const collaborators = filteredProfiles.filter(p => !p.is_user);

  // Stats
  const adminCount = profiles.filter(p => p.role === 'admin').length;
  const supervisorCount = profiles.filter(p => p.role === 'supervisor').length;
  const contributorUserCount = profiles.filter(p => p.role === 'contributor' && p.is_user).length;
  const contributorNonUserCount = profiles.filter(p => p.role === 'contributor' && !p.is_user).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Directory...</span>
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
              <Users className="text-hit-blue" /> Directory
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage contributors and collaborators.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search contributors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hit-blue"
              />
            </div>
            <button
              onClick={handleAddClick}
              className="w-10 h-10 flex items-center justify-center bg-hit-blue text-white rounded-xl hover:bg-hit-dark transition-colors shadow-lg shadow-hit-blue/20"
              title="Add Contributor"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Users Section */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <UserIcon size={12} /> Login Users ({users.length})
            </h3>
            <div className="space-y-2">
              {users.map(profile => {
                const isMe = profile.id === currentUser?.id;
                return (
                  <div
                    key={profile.id}
                    onClick={() => handleRowClick(profile)}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <UserAvatar name={profile.name} size="md" isCurrentUser={isMe} />
                      <div>
                        <p className="font-bold text-gray-800">{profile.name}</p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Mail size={10} /> {profile.email || 'No email'}
                        </p>
                        {profile.description && (
                          <p className="text-xs text-gray-500 mt-1">{profile.description}</p>
                        )}
                        {profile.other_contact && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Phone size={10} /> {profile.other_contact}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${getRoleBadgeStyle(profile.role, profile.is_user)}`}>
                        {(profile.role === 'admin' || profile.role === 'supervisor') && <Shield size={10} />}
                        {getRoleLabel(profile.role)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        User
                      </span>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No users found.</p>
              )}
            </div>
          </div>

          {/* External Collaborators Section */}
          <div className="p-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={12} /> External Collaborators ({collaborators.length})
            </h3>
            <div className="space-y-2">
              {collaborators.map(profile => (
                <div
                  key={profile.id}
                  onClick={() => handleRowClick(profile)}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 group transition-colors border border-gray-100 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar name={profile.name} size="md" />
                    <div>
                      <p className="font-bold text-gray-800">{profile.name}</p>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Mail size={10} /> {profile.email || 'No email'}
                      </p>
                      {profile.description && (
                        <p className="text-xs text-gray-500 mt-1">{profile.description}</p>
                      )}
                      {profile.other_contact && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Phone size={10} /> {profile.other_contact}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${getRoleBadgeStyle(profile.role, profile.is_user)}`}>
                      {getRoleLabel(profile.role)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      External
                    </span>
                    {canManage && (
                      <button
                        onClick={(e) => handleDelete(e, profile.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {collaborators.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No external collaborators yet.</p>
                  <p className="text-xs mt-1">Click + to add someone.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Stats */}
      <div className="w-80 shrink-0 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-black text-gray-800 mb-6 uppercase tracking-tight">Contributors</h3>

          <div className="space-y-3">
            {/* Admin */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-xl text-blue-600 shadow-sm">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Admins</p>
                  <p className="text-xl font-black text-blue-900">{adminCount}</p>
                </div>
              </div>
            </div>

            {/* Supervisor */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-xl text-red-600 shadow-sm">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Supervisors</p>
                  <p className="text-xl font-black text-red-900">{supervisorCount}</p>
                </div>
              </div>
            </div>

            {/* Contributor Users */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-xl text-green-600 shadow-sm">
                  <UserIcon size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Contributors (Users)</p>
                  <p className="text-xl font-black text-green-900">{contributorUserCount}</p>
                </div>
              </div>
            </div>

            {/* Contributor Non-Users */}
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-gray-600 p-2.5 rounded-xl text-white shadow-sm">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">External</p>
                  <p className="text-xl font-black text-gray-900">{contributorNonUserCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">About Contributors</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              External collaborators can be assigned to tasks and meetings but cannot log in. Click any row to view or edit details.
            </p>
          </div>
        </div>
      </div>

      {/* --- FORM MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">
                {formMode === 'create' ? 'Add Contributor' : 'Edit Contributor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name *</label>
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hit-blue transition-all"
                  placeholder="jane.s@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hit-blue transition-all"
                  placeholder="e.g. External consultant, Advisory board member"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  <span className="flex items-center gap-1"><Phone size={10} /> Other Contact</span>
                </label>
                <input
                  type="text"
                  value={formData.other_contact}
                  onChange={e => setFormData({...formData, other_contact: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hit-blue transition-all"
                  placeholder="e.g. +972-54-1234567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as SystemRole})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hit-blue transition-all cursor-pointer"
                  >
                    <option value="contributor">Contributor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Login Access</label>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, is_user: !formData.is_user})}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.is_user
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {formData.is_user ? (
                      <>
                        <UserCheck size={16} />
                        Can Login
                      </>
                    ) : (
                      <>
                        <UserX size={16} />
                        No Login
                      </>
                    )}
                  </button>
                </div>
              </div>

              {formMode === 'edit' && selectedProfile?.id === currentUser?.id && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700 font-medium">
                    This is your account. Be careful when changing your own role or login access.
                  </p>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-hit-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-hit-dark flex items-center justify-center gap-2 shadow-lg shadow-hit-blue/20"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  {formMode === 'create' ? 'Add' : 'Save'}
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
