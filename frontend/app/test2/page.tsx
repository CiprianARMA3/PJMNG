"use client";

import { useState } from "react";
import { 
  Settings,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  Save,
  Users,
  Eye,
  FileText,
  UserPlus,
  Database,
  Copy,
  Lock,
  ChevronDown,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  User as UserIcon,
  GitBranch,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";

// --- TYPES ---
type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  member_count: number;
  created_at: string;
  isSystem?: boolean;
};

type Permission = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
};

// --- MAIN COMPONENT ---
export default function RoleManagementPage() {
  // --- STATE ---
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Administrator",
      description: "Full system access with all permissions",
      permissions: ["read", "write", "delete", "manage_users", "manage_roles", "view_analytics", "system_config", "api_access"],
      member_count: 3,
      created_at: "2024-01-15T10:30:00Z",
      isSystem: true
    },
    {
      id: "2",
      name: "Moderator",
      description: "Can moderate content and manage basic users",
      permissions: ["read", "write", "manage_users", "view_analytics"],
      member_count: 12,
      created_at: "2024-02-20T14:45:00Z"
    },
    {
      id: "3",
      name: "Editor",
      description: "Create and edit content but cannot publish",
      permissions: ["read", "write", "view_analytics"],
      member_count: 24,
      created_at: "2024-03-05T09:15:00Z"
    },
    {
      id: "4",
      name: "Viewer",
      description: "Read-only access to content",
      permissions: ["read", "view_analytics"],
      member_count: 156,
      created_at: "2024-01-10T11:20:00Z"
    },
    {
      id: "5",
      name: "Content Manager",
      description: "Manage all content including publishing",
      permissions: ["read", "write", "delete", "view_analytics"],
      member_count: 8,
      created_at: "2024-02-28T16:30:00Z"
    }
  ]);

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Mock permissions data
  const allPermissions: Permission[] = [
    { id: "read", name: "View Content", category: "General", description: "Can view all content", icon: <Eye size={14} /> },
    { id: "write", name: "Create/Edit", category: "General", description: "Can create and edit content", icon: <FileText size={14} /> },
    { id: "delete", name: "Delete Content", category: "General", description: "Can delete content", icon: <Trash2 size={14} /> },
    { id: "manage_users", name: "Manage Users", category: "Users", description: "Can add/remove users", icon: <UserPlus size={14} /> },
    { id: "manage_roles", name: "Manage Roles", category: "Users", description: "Can create and edit roles", icon: <Settings size={14} /> },
    { id: "view_analytics", name: "View Analytics", category: "System", description: "Can view analytics dashboard", icon: <Database size={14} /> },
    { id: "system_config", name: "System Config", category: "System", description: "Can modify system settings", icon: <Settings size={14} /> },
    { id: "api_access", name: "API Access", category: "System", description: "Can access API endpoints", icon: <Copy size={14} /> }
  ];

  // Filtered roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Role filter options
  const roleFilters = [
    { name: "All Roles", isSelected: true },
    { name: "System", isSelected: false },
    { name: "Custom", isSelected: false }
  ];

  // --- HANDLERS ---
  const handleCreateRole = () => {
    setIsCreating(true);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setEditingRole(null);
    setExpandedRoleId(null);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setSelectedPermissions([...role.permissions]);
    setIsCreating(false);
    setExpandedRoleId(null);
  };

  const handleCancel = () => {
    setEditingRole(null);
    setIsCreating(false);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
  };

  const handleSaveRole = () => {
    if (!roleName.trim()) {
      setError("Role name is required");
      return;
    }

    setActionLoading("saving");
    
    setTimeout(() => {
      if (editingRole) {
        // Update existing role
        setRoles(prev => prev.map(role =>
          role.id === editingRole.id
            ? {
                ...role,
                name: roleName,
                description: roleDescription || null,
                permissions: selectedPermissions
              }
            : role
        ));
      } else {
        // Create new role
        const newRole: Role = {
          id: Date.now().toString(),
          name: roleName,
          description: roleDescription || null,
          permissions: selectedPermissions,
          member_count: 0,
          created_at: new Date().toISOString()
        };
        setRoles(prev => [...prev, newRole]);
      }
      
      setActionLoading(null);
      handleCancel();
    }, 500);
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(roleId);
    
    setTimeout(() => {
      setRoles(prev => prev.filter(role => role.id !== roleId));
      setActionLoading(null);
      if (expandedRoleId === roleId) setExpandedRoleId(null);
    }, 500);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleRoleExpand = (roleId: string) => {
    setExpandedRoleId(prev => prev === roleId ? null : roleId);
  };

  const handleRefresh = () => {
    setActionLoading("refresh");
    setTimeout(() => {
      setActionLoading(null);
    }, 1000);
  };

  // --- UI ---
  return (
    <div className="h-screen bg-[#0a0a0a] text-zinc-100 flex overflow-hidden selection:bg-indigo-500/30">
      
      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full bg-[#09090b] relative">
        
        {/* HEADER */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight">Role <span className="text-white/30 text-lg font-light">Management</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 px-2 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-500 flex items-center">
              TOTAL: {roles.length}
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex-none px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full max-w-4xl">
            {/* Search */}
            <div className="relative flex-1 group max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              <input 
                type="text" 
                placeholder="Search roles..." 
                className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all shadow-sm" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Create Role Button */}
            <button 
              onClick={handleCreateRole}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-indigo-900/20 active:scale-95"
            >
              <Plus size={14} />
              <span>Create Role</span>
            </button>

            {/* Role Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowRoleMenu(!showRoleMenu)} 
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium transition-all shadow-sm
                  ${showRoleMenu 
                    ? 'bg-zinc-800 border-zinc-700 text-white' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
              >
                <Filter size={14} /> 
                <span>Filter</span>
                <ChevronDown size={12} />
              </button>
              
              {showRoleMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0C0C0E] border border-zinc-800 rounded-lg shadow-2xl z-30 p-1.5">
                  <div className="space-y-0.5">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Show Roles</div>
                    {roleFilters.map(filter => (
                      <button
                        key={filter.name}
                        onClick={() => {}}
                        className="w-full text-left flex items-center justify-between px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-colors"
                      >
                        <span>{filter.name}</span>
                        {filter.isSelected && <Check size={12} className="text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Refresh */}
            <button 
              onClick={handleRefresh} 
              className="p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
            >
              <RefreshCw size={14} className={actionLoading === "refresh" ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="flex-none grid grid-cols-12 gap-4 px-6 py-2 border-b border-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none bg-zinc-900/20">
          <div className="col-span-5 pl-2">Role Details</div>
          <div className="col-span-2">Permissions</div>
          <div className="col-span-2">Members</div>
          <div className="col-span-3 text-right pr-2">Actions</div>
        </div>

        {/* ROLES LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredRoles.map(role => {
            const isExpanded = expandedRoleId === role.id;
            const isSystem = role.isSystem;
            
            return (
              <div key={role.id}>
                {/* ROLE ROW */}
                <div 
                  onClick={() => toggleRoleExpand(role.id)}
                  className={`grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-zinc-800/30 items-center transition-all cursor-pointer group
                    ${isExpanded ? 'bg-zinc-900/30 border-zinc-800' : 'hover:bg-zinc-900/20'}`}
                >
                  {/* 1. Role Details */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-800/30 flex items-center justify-center">
                      <Shield size={14} className="text-purple-400" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium transition-colors ${isExpanded ? 'text-indigo-400' : 'text-zinc-200 group-hover:text-white'}`}>
                          {role.name}
                        </span>
                        {isSystem && (
                          <span className="text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/30">
                            System
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                        {role.description || "No description"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Permissions Count */}
                  <div className="col-span-2">
                    <span className="text-xs font-medium text-zinc-300 bg-zinc-800/50 px-2 py-1 rounded border border-zinc-800">
                      {role.permissions.length} permissions
                    </span>
                  </div>

                  {/* 3. Member Count */}
                  <div className="col-span-2 flex items-center gap-2 text-xs text-zinc-500">
                    <Users size={12} />
                    <span>{role.member_count} members</span>
                  </div>

                  {/* 4. Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-2 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                      className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Edit role"
                    >
                      <Edit2 size={14} />
                    </button>
                    {!isSystem && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id, role.name); }}
                        disabled={actionLoading === role.id}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete role"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}>
                      {isExpanded ? <ChevronDown size={14} className="rotate-180" /> : <MoreHorizontal size={14} />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED PERMISSIONS PANEL */}
                {isExpanded && (
                  <div className="border-b border-zinc-800 bg-[#0C0C0E] px-6 py-6 animate-in slide-in-from-top-2 duration-200 cursor-default">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Col 1: Role Info */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role Information</h3>
                        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-400">
                              Created: {new Date(role.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Shield size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-400">
                              Type: {isSystem ? "System Role" : "Custom Role"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Database size={14} className="text-zinc-500" />
                            <span className="text-xs text-zinc-400">
                              ID: <span className="font-mono text-zinc-300">{role.id}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Permissions List */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Assigned Permissions</h3>
                        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 space-y-2">
                          {role.permissions.map(permId => {
                            const perm = allPermissions.find(p => p.id === permId);
                            return perm ? (
                              <div key={perm.id} className="flex items-center gap-2 text-xs text-zinc-400 p-2 hover:bg-zinc-800/30 rounded-md">
                                <div className="text-purple-400">{perm.icon}</div>
                                <span className="font-medium">{perm.name}</span>
                                <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded ml-auto">
                                  {perm.category}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>

                      {/* Col 3: Danger Zone */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-rose-900/50 uppercase tracking-widest">Danger Zone</h3>
                        <div className="p-4 rounded-xl border border-rose-900/20 bg-rose-950/5 flex flex-col justify-between h-auto gap-3">
                          <div className="text-xs text-zinc-500">
                            {isSystem 
                              ? "System roles cannot be deleted as they are essential for platform functionality."
                              : "Deleting this role will unassign it from all users immediately."}
                          </div>
                          
                          {!isSystem && (
                            <button 
                              onClick={() => handleDeleteRole(role.id, role.name)}
                              disabled={actionLoading === role.id}
                              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={12} />
                              {actionLoading === role.id ? "Processing..." : "Delete Role"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* ROLE CREATION/EDIT MODAL */}
      {(isCreating || editingRole) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={handleCancel} 
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-800/30">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingRole ? "Edit Role" : "Create New Role"}
                </h2>
                <p className="text-sm text-zinc-400">
                  Define role permissions and access levels
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-rose-900/20 border border-rose-800 rounded-lg flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-400" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Role Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Moderator, Editor, Viewer"
                  className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe what this role can do..."
                  className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all resize-none"
                />
              </div>

              {/* Permissions Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Permissions
                  </label>
                  <span className="text-xs text-zinc-500">
                    {selectedPermissions.length} selected
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {allPermissions.map(permission => {
                    const isSelected = selectedPermissions.includes(permission.id);
                    return (
                      <div
                        key={permission.id}
                        onClick={() => togglePermission(permission.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-900/10"
                            : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center ${
                            isSelected
                              ? "border-purple-600 bg-purple-600"
                              : "border-zinc-600"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-purple-400">{permission.icon}</div>
                              <span className="font-medium text-sm">
                                {permission.name}
                              </span>
                              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                                {permission.category}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={handleSaveRole}
                  disabled={actionLoading === "saving"}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "saving" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{editingRole ? "Update Role" : "Create Role"}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles for Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
}