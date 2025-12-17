"use client";

import { useState, ReactNode } from "react";
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
  RefreshCw,
  Loader2,
  ListTodo,
  LayoutDashboard,
  Workflow,
  Activity,
  GitBranch,
  Bot,
  BookOpen,
  Map,
  Monitor,
  Briefcase
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
  icon: ReactNode;
};

interface RoleManagementModalProps {
  projectId: string;
  availableRoles: Record<string, string[]>;
  isOpen: boolean;
  onClose: () => void;
  onRolesUpdated: (updatedRoles: Record<string, string[]>) => void;
}

// --- MAIN COMPONENT ---
export default function RoleManagementModal({
  projectId,
  availableRoles,
  isOpen,
  onClose,
  onRolesUpdated
}: RoleManagementModalProps) {
  // --- STATE ---
  const [roles, setRoles] = useState<Role[]>(() => {
    // Convert availableRoles to Role objects
    return Object.entries(availableRoles).map(([name, permissions], index) => ({
      id: (index + 1).toString(),
      name,
      description: name === "admin" ? "Full system access with all permissions" :
        name === "member" ? "Can view and edit content" :
          name === "viewer" ? "Read-only access to content" :
            name === "manager" ? "Can manage team and oversee operations" :
              "Custom role",
      permissions,
      member_count: 0, // You would fetch this from your database
      created_at: new Date().toISOString(),
      isSystem: ["admin", "member", "viewer", "manager"].includes(name)
    }));
  });

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Permissions data with white icons
  const allPermissions: Permission[] = [
    // OVERVIEW section
    { id: "dashboard", name: "Dashboard", category: "Overview", description: "View project dashboard and overview", icon: <LayoutDashboard size={14} className="text-white light:text-zinc-900" /> },

    // DEVELOPMENT section
    { id: "tasks", name: "Tasks", category: "Development", description: "Create, edit, and manage project tasks", icon: <ListTodo size={14} className="text-white light:text-zinc-900" /> },
    { id: "board", name: "Board", category: "Development", description: "Access and manage project board", icon: <LayoutDashboard size={14} className="text-white light:text-zinc-900" /> },
    { id: "events-workflow", name: "Events & Workflow", category: "Development", description: "Manage events and workflow automation", icon: <Workflow size={14} className="text-white light:text-zinc-900" /> },
    { id: "activity-overview", name: "Activity Overview", category: "Development", description: "View project activity and overview", icon: <Activity size={14} className="text-white light:text-zinc-900" /> },
    { id: "repository-logs", name: "Repository Logs", category: "Development", description: "Access repository logs and history", icon: <GitBranch size={14} className="text-white light:text-zinc-900" /> },

    // ARTIFICIAL INTELLIGENCE section
    { id: "ai-assistant", name: "AI Assistant", category: "AI Tools", description: "Access AI assistant features", icon: <Bot size={14} className="text-white light:text-zinc-900" /> },
    { id: "ai-repo-review", name: "AI Repo Review", category: "AI Tools", description: "Use AI for repository code review", icon: <BookOpen size={14} className="text-white light:text-zinc-900" /> },
    { id: "ai-sql-helper", name: "AI SQL Helper", category: "AI Tools", description: "Get AI assistance with SQL queries", icon: <Database size={14} className="text-white light:text-zinc-900" /> },
    { id: "ai-roadmap-visualizer", name: "AI Roadmap Visualizer", category: "AI Tools", description: "Visualize project roadmap with AI", icon: <Map size={14} className="text-white light:text-zinc-900" /> },

    // SETTINGS section
    { id: "project-settings", name: "Project Settings", category: "Settings", description: "Configure project settings", icon: <Settings size={14} className="text-white light:text-zinc-900" /> },
    { id: "collaborators", name: "Collaborators", category: "Settings", description: "Manage project collaborators", icon: <UserPlus size={14} className="text-white light:text-zinc-900" /> },
    { id: "ai-monitor", name: "AI Monitor", category: "AI Tools", description: "Monitor project with AI insights", icon: <Monitor size={14} className="text-white light:text-zinc-900" /> },

    // MANAGER SETTINGS section
    { id: "manager-project-settings", name: "Project Settings (Manager)", category: "Manager Settings", description: "Manager-level project configuration", icon: <Settings size={14} className="text-white light:text-zinc-900" /> },
    { id: "manager-workflow-events", name: "Workflow and Events (Manager)", category: "Manager Settings", description: "Manager-level workflow and event management", icon: <Workflow size={14} className="text-white light:text-zinc-900" /> },
    { id: "management", name: "Management", category: "Manager Settings", description: "General management capabilities", icon: <Briefcase size={14} className="text-white light:text-zinc-900" /> },
    { id: "manage-team", name: "Manage Team", category: "Manager Settings", description: "Team management and assignments", icon: <UserPlus size={14} className="text-white light:text-zinc-900" /> },
    { id: "manage-ai-assistant", name: "Manage AI Assistant", category: "Manager Settings", description: "AI Assistant configuration and management", icon: <Bot size={14} className="text-white light:text-zinc-900" /> },


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

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      setError("Role name is required");
      return;
    }

    // Check if role name already exists (excluding current editing role)
    const existingRole = roles.find(role =>
      role.name.toLowerCase() === roleName.toLowerCase() &&
      role.id !== editingRole?.id
    );

    if (existingRole) {
      setError("A role with this name already exists");
      return;
    }

    setActionLoading("saving");
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedRoles;

      if (editingRole) {
        // Update existing role
        updatedRoles = roles.map(role =>
          role.id === editingRole.id
            ? {
              ...role,
              name: roleName,
              description: roleDescription || null,
              permissions: selectedPermissions
            }
            : role
        );
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
        updatedRoles = [...roles, newRole];
      }

      setRoles(updatedRoles);

      // Convert back to Record<string, string[]> format for parent
      const rolesMap: Record<string, string[]> = {};
      updatedRoles.forEach(role => {
        rolesMap[role.name] = role.permissions;
      });

      onRolesUpdated(rolesMap);
      handleCancel();
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(roleId);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const roleToDelete = roles.find(r => r.id === roleId);
      if (!roleToDelete) return;

      const updatedRoles = roles.filter(role => role.id !== roleId);
      setRoles(updatedRoles);

      // Convert back to Record<string, string[]> format for parent
      const rolesMap: Record<string, string[]> = {};
      updatedRoles.forEach(role => {
        rolesMap[role.name] = role.permissions;
      });

      onRolesUpdated(rolesMap);
      if (expandedRoleId === roleId) setExpandedRoleId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete role");
    } finally {
      setActionLoading(null);
    }
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

  const handleRefresh = async () => {
    setActionLoading("refresh");
    // Here you would fetch fresh data from your API
    setTimeout(() => {
      setActionLoading(null);
    }, 1000);
  };

  const handleSaveToProject = async () => {
    setSaving(true);
    setError(null);

    try {
      // Here you would save the roles to your project's metadata
      // This would update the project.metadata.roles field
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Convert roles to Record<string, string[]> format
      const rolesMap: Record<string, string[]> = {};
      roles.forEach(role => {
        rolesMap[role.name] = role.permissions;
      });

      onRolesUpdated(rolesMap);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save roles to project");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 light:bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] light:bg-white border border-zinc-800 light:border-zinc-200 rounded-xl shadow-2xl w-full max-w-6xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <style jsx global>{`
    .modal-body-scroll::-webkit-scrollbar { width: 6px; }
    .modal-body-scroll::-webkit-scrollbar-track { background: transparent; }
    .modal-body-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
    .modal-body-scroll::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
`}</style>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-800 light:hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-800/30">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white light:text-zinc-900">Manage Project Roles</h2>
            <p className="text-sm text-zinc-400 light:text-zinc-500">
              Create and manage roles with specific permissions for {projectId}
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Roles List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Bar */}
            <div className="bg-zinc-900/50 light:bg-zinc-50 border border-zinc-800/80 light:border-zinc-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search roles..."
                    className="w-full bg-zinc-900/50 light:bg-white border border-zinc-800/80 light:border-zinc-300 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 light:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateRole}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-indigo-900/20 active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Create Role</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowRoleMenu(!showRoleMenu)}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium transition-all
                        ${showRoleMenu
                          ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900'
                          : 'bg-zinc-900/50 light:bg-white border-zinc-800 light:border-zinc-300 text-zinc-400 light:text-zinc-600 hover:text-zinc-200 light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-50'}`}
                    >
                      <Filter size={14} />
                      <span>Filter</span>
                      <ChevronDown size={12} />
                    </button>

                    {showRoleMenu && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg shadow-2xl z-30 p-1.5">
                        <div className="space-y-0.5">
                          <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Show Roles</div>
                          {roleFilters.map(filter => (
                            <button
                              key={filter.name}
                              onClick={() => { }}
                              className="w-full text-left flex items-center justify-between px-2 py-1.5 text-xs text-zinc-400 light:text-zinc-600 hover:text-zinc-100 light:hover:text-zinc-900 hover:bg-zinc-800/50 light:hover:bg-zinc-100 rounded-md transition-colors"
                            >
                              <span>{filter.name}</span>
                              {filter.isSelected && <Check size={12} className="text-indigo-500" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleRefresh}
                    className="p-2 bg-zinc-900/50 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg text-zinc-500 hover:text-zinc-200 light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-50"
                  >
                    <RefreshCw size={14} className={actionLoading === "refresh" ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            </div>

            {/* Roles Grid */}
            <div className="space-y-2">
              {filteredRoles.map(role => {
                const isExpanded = expandedRoleId === role.id;
                const isSystem = role.isSystem;

                return (
                  <div key={role.id} className="bg-zinc-900/30 light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-lg overflow-hidden">
                    {/* Role Row */}
                    <div
                      onClick={() => toggleRoleExpand(role.id)}
                      className="grid grid-cols-12 gap-4 px-4 py-3 items-center transition-all cursor-pointer hover:bg-zinc-800/20 light:hover:bg-zinc-50"
                    >
                      {/* Role Details */}
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-800/30 flex items-center justify-center">
                          <Shield size={14} className="text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-200 light:text-zinc-900">
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

                      {/* Permissions Count */}
                      <div className="col-span-3">
                        <span className="text-xs font-medium text-zinc-300 light:text-zinc-700 bg-zinc-800/50 light:bg-zinc-100 px-2 py-1 rounded border border-zinc-800 light:border-zinc-200">
                          {role.permissions.length} permissions
                        </span>
                      </div>

                      {/* Member Count */}
                      <div className="col-span-2 flex items-center gap-2 text-xs text-zinc-500">
                        {/* <Users size={12} />
                        <span>{role.member_count} users</span> */}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-2 text-right">
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
                        <button className={`p-1.5 transition-colors ${isExpanded ? 'text-zinc-100 light:text-zinc-900' : 'text-zinc-600 light:text-zinc-400 hover:text-zinc-300 light:hover:text-zinc-600'}`}>
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Permissions */}
                    {isExpanded && (
                      <div className="border-t border-zinc-800 light:border-zinc-200 bg-zinc-900/20 light:bg-zinc-50 px-4 py-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions.map(permId => {
                            const perm = allPermissions.find(p => p.id === permId);
                            return perm ? (
                              <span
                                key={perm.id}
                                className="px-2 py-1 rounded bg-zinc-800/40 light:bg-white border border-zinc-800 light:border-zinc-200 text-[10px] text-zinc-400 light:text-zinc-600 font-mono flex items-center gap-1"
                              >
                                <span className="text-white light:text-zinc-900">{perm.icon}</span>
                                {perm.name}
                              </span>
                            ) : (
                              <span
                                key={permId}
                                className="px-2 py-1 rounded bg-zinc-800/40 light:bg-white border border-zinc-800 light:border-zinc-200 text-[10px] text-zinc-400 light:text-zinc-600 font-mono"
                              >
                                {permId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Permissions or Role Form */}
          <div className="lg:col-span-1">
            {(isCreating || editingRole) ? (
              <div className="bg-zinc-900/30 light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-lg p-5 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-white light:text-zinc-900">
                    {editingRole ? "Edit Role" : "Create New Role"}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-1 text-zinc-500 hover:text-white light:hover:text-zinc-900"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Role Name */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 light:text-zinc-500 mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g., Moderator, Editor, Viewer"
                      className="w-full bg-zinc-900/50 light:bg-white border border-zinc-800/80 light:border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-200 light:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 light:text-zinc-500 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      rows={2}
                      placeholder="Describe what this role can do..."
                      className="w-full bg-zinc-900/50 light:bg-white border border-zinc-800/80 light:border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-200 light:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all resize-none"
                    />
                  </div>

                  {/* Permissions Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-medium text-zinc-400 light:text-zinc-500">
                        Permissions
                      </label>
                      <span className="text-xs text-zinc-500">
                        {selectedPermissions.length} selected
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {allPermissions.map(permission => {
                        const isSelected = selectedPermissions.includes(permission.id);
                        return (
                          <div
                            key={permission.id}
                            onClick={() => togglePermission(permission.id)}
                            className={`p-2 border rounded-md cursor-pointer transition-all ${isSelected
                                ? "border-purple-600 bg-purple-900/10 light:bg-purple-50"
                                : "border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300"
                              }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center ${isSelected
                                  ? "border-purple-600 bg-purple-600"
                                  : "border-zinc-600 light:border-zinc-300"
                                }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <div className="flex items-center justify-center w-4 h-4">
                                    {permission.icon}
                                  </div>
                                  <span className="text-xs font-medium text-zinc-200 light:text-zinc-900">
                                    {permission.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 light:text-zinc-600 bg-zinc-800 light:bg-zinc-100 px-1.5 py-0.5 rounded-full ml-auto">
                                    {permission.category}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 light:text-zinc-500">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveRole}
                    disabled={actionLoading === "saving"}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "saving" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>{editingRole ? "Update Role" : "Create Role"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/30 light:bg-white border border-zinc-800/50 light:border-zinc-200 rounded-lg p-5 sticky top-6">
                <h3 className="text-sm font-semibold text-white light:text-zinc-900 mb-4">Available Permissions</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {allPermissions.map(permission => (
                    <div key={permission.id} className="p-2 border border-zinc-800 light:border-zinc-200 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center justify-center w-4 h-4">
                          {permission.icon}
                        </div>
                        <span className="text-xs font-medium text-zinc-200 light:text-zinc-900">{permission.name}</span>
                        <span className="text-[10px] text-zinc-500 light:text-zinc-600 bg-zinc-800 light:bg-zinc-100 px-1.5 py-0.5 rounded-full ml-auto">
                          {permission.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 light:text-zinc-500">{permission.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-6 border-t border-zinc-800 light:border-zinc-200 flex justify-between items-center">
          <div className="text-xs text-zinc-500">
            Changes will be saved to project metadata when you click "Save Changes"
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-zinc-700 light:border-zinc-300 hover:bg-zinc-800 light:hover:bg-zinc-100 text-zinc-300 light:text-zinc-600 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveToProject}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all shadow-sm shadow-indigo-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes to Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Global Styles for Scrollbar */}

    </div>

  );
}