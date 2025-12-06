"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu";
import ProjectCodeGeneration from "./components/projectCodeGeneration"; 
import React from "react"; 
import { PhoneNumberDisplay } from "../../settings/collaborators/components/identifyPhoneNumberProvenience";
import RoleManagementModal from "./components/manageRoles"; 
import { 
  Search, 
  RefreshCw, Filter, ChevronDown, 
  ChevronUp, 
  Users as UsersIcon,
  Mail, GitBranch, User as UserIcon, Calendar,
  Check,
  ShieldAlert,
  MoreHorizontal,
  Copy,
  Phone,
  Plus,
  Trash2,
  X,
  Settings
} from "lucide-react";

// --- TYPES ---
type MemberData = {
    user_id: string;
    email: string;
    full_name: string;
    phone_number: string | null;
    avatar_url: string | null; 
    role: string;
    permissions: string[];
    joined_at: string;
};

type RoleFilter = { name: string; isSelected: boolean };

// Fallback roles in case metadata is empty (prevents crashes)
const DEFAULT_ROLES: Record<string, string[]> = {
    "admin": ["all"],
    "member": ["view", "edit"],
    "viewer": ["view"]
};

// --- REUSABLE CREATOR PFP COMPONENT ---
interface CreatorPfpProps {
    userId: string;
    currentUserId: string;
    currentUserPfp: string;
    currentUserName: string;
    pfpUrl: string | null;
    name: string;
    size?: string;
    showNameOnHover?: boolean;
}

const CreatorPfp: React.FC<CreatorPfpProps> = ({
    userId,
    currentUserId,
    currentUserPfp,
    currentUserName,
    pfpUrl: externalPfpUrl,
    name,
    size = 'w-9 h-9',
    showNameOnHover = true
}) => {
    const isCurrentUser = userId === currentUserId;
    const defaultPfp = "https://avatar.vercel.sh/" + userId;
    const finalPfpUrl = isCurrentUser ? currentUserPfp : externalPfpUrl || defaultPfp;
    const finalName = isCurrentUser ? currentUserName : name || "Unknown User";

    return (
        <div className="relative group/pfp inline-flex items-center justify-center flex-shrink-0 z-10">
            <img
                src={finalPfpUrl}
                alt={finalName}
                className={`${size} rounded-full object-cover border border-white/10 shadow-sm bg-zinc-900`}
            />
            {showNameOnHover && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-[10px] font-medium text-zinc-200 rounded shadow-xl opacity-0 translate-y-2 group-hover/pfp:translate-y-0 group-hover/pfp:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                    {finalName}
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT: ProjectManagementPage ---
export default function ProjectManagementPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [availableRoles, setAvailableRoles] = useState<Record<string, string[]>>(DEFAULT_ROLES);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberData[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilters, setRoleFilters] = useState<RoleFilter[]>([]);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(""); // Will default to first available role

  // Role Management Modal State
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);

  // --- DATA FETCHING HELPERS ---

  /**
   * Helper to extract the Role Name from the user's stored role_info.
   */
  const resolveMemberRole = (roleInfoRaw: any, roleDefinitions: Record<string, string[]>) => {
    let assignedRoleName = 'viewer'; // default fallback

    // 1. Try to parse the stored info
    if (typeof roleInfoRaw === 'string') {
        try {
            const parsed = JSON.parse(roleInfoRaw);
            assignedRoleName = parsed.role || assignedRoleName;
        } catch {
            if (typeof roleInfoRaw === 'string' && roleInfoRaw.length > 0) {
                assignedRoleName = roleInfoRaw;
            }
        }
    } else if (typeof roleInfoRaw === 'object' && roleInfoRaw !== null) {
        assignedRoleName = roleInfoRaw.role || assignedRoleName;
    }

    // 2. Look up permissions
    const permissions = roleDefinitions[assignedRoleName] || ["no_permission_defined"];

    return { role: assignedRoleName, permissions };
  };

  /**
   * Fetch Members and merge with User Details
   * FIX: Added default value for roleDefinitions to fix TS Error
   */
  async function fetchAllMemberData(id: string, roleDefinitions: Record<string, string[]> = DEFAULT_ROLES): Promise<MemberData[]> {
    setRefreshing(true);
    
    // 1. Get Project Links
    const { data: projectUsersData, error: puError } = await supabase
        .from("project_users")
        .select(`user_id, role_info, joined_at`)
        .eq("project_id", id);

    if (puError || !projectUsersData) {
        console.error("Error fetching members", puError);
        setRefreshing(false);
        return [];
    }

    const userIds = projectUsersData.map(pu => pu.user_id);
    if (userIds.length === 0) {
        setRefreshing(false);
        return [];
    }

    // 2. Get User Profiles
    const { data: usersData } = await supabase
        .from("users")
        .select(`id, email, name, surname, metadata, created_at, phone_number`)
        .in("id", userIds);
    
    const userMap = (usersData || []).reduce((acc, u) => {
        const full_name = (u.name || '') + (u.surname ? ` ${u.surname}` : '');
        const avatar_url = (u.metadata as any)?.avatar_url || null;

        acc[u.id] = {
            id: u.id,
            email: u.email || 'N/A',
            full_name: full_name || 'Name Unavailable',
            phone_number: u.phone_number || null,
            avatar_url: avatar_url,
            user_created_at: u.created_at,
        };
        return acc;
    }, {} as Record<string, any>);

    // 3. Merge and Resolve Permissions
    const combinedMembers: MemberData[] = projectUsersData.map(pu => {
        const userData = userMap[pu.user_id] || { 
            id: pu.user_id, email: 'Unavailable', full_name: 'User Deleted', phone_number: null, avatar_url: null, user_created_at: pu.joined_at
        };
        
        const { role, permissions } = resolveMemberRole(pu.role_info, roleDefinitions);

        return {
            user_id: pu.user_id,
            email: userData.email,
            full_name: userData.full_name,
            phone_number: userData.phone_number,
            avatar_url: userData.avatar_url,
            role: role,
            permissions: permissions,
            joined_at: userData.user_created_at, 
        };
    });
    setRefreshing(false);
    return combinedMembers;
  }

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
        const id = projectId;
        if (!id) return;

        // 1. Auth Check
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) { 
            router.push("/auth/login"); 
            return; 
        }

        // 2. Fetch User Profile (To fix Menu Name/Avatar)
        const { data: userProfile } = await supabase
            .from("users")
            .select("name, surname, metadata")
            .eq("id", authUser.id)
            .single();

        // 3. Create merged user object
        const finalUser = {
            ...authUser,
            user_metadata: {
                ...authUser.user_metadata,
                full_name: userProfile?.name 
                    ? `${userProfile.name} ${userProfile.surname || ""}`.trim() 
                    : authUser.user_metadata?.full_name || "User",
                avatar_url: userProfile?.metadata?.avatar_url || authUser.user_metadata?.avatar_url
            }
        };
        
        setUser(finalUser);
    
        // 4. Fetch Project Data & Roles
        const { data: projectData } = await supabase
            .from("projects")
            .select("id, name, metadata")
            .eq("id", id)
            .single();

        let currentRoles = DEFAULT_ROLES;

        if (projectData) {
             const iconUrl = projectData.metadata?.project_icon_url || projectData.metadata?.logo_url || null; 
             setProject({ ...projectData, icon_url: iconUrl });

             // Extract roles
             if (projectData.metadata?.roles) {
                 currentRoles = projectData.metadata.roles;
             }
        } else {
             setProject(null);
        }
        setAvailableRoles(currentRoles);

        // 5. Fetch Members (Pass the roles we just found)
        const members = await fetchAllMemberData(id, currentRoles);
        setAllMembers(members);

        // 6. Setup Filters
        const uniqueRoles = [...new Set(members
            .filter(m => m.role && m.role !== 'No Role Assigned')
            .map(m => m.role)
        )];

        const initialFilters: RoleFilter[] = uniqueRoles.map(role => ({ name: role, isSelected: true }));
        setRoleFilters(initialFilters);
        setLoading(false);
    };
    init();
  }, [projectId]);

  // --- UI FILTERING LOGIC ---
  useEffect(() => {
    if (loading) return;
    const isSearchEmpty = !searchQuery.trim();
    const activeRoles = roleFilters.filter(f => f.isSelected).map(f => (f.name || "").toLowerCase());
    const searchLower = searchQuery.toLowerCase();

    const filtered = allMembers.filter(member => {
      const matchesSearch = isSearchEmpty ||
                            member.full_name.toLowerCase().includes(searchLower) ||
                            member.email.toLowerCase().includes(searchLower);
      const matchesRole = activeRoles.includes(member.role.toLowerCase());
      return matchesSearch && matchesRole;
    });

    setFilteredMembers(filtered.sort((a, b) => a.full_name.localeCompare(b.full_name)));
  }, [allMembers, searchQuery, roleFilters, loading]);

  // --- ACTIONS ---

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
      if(!projectId) return;
      setActionLoading(targetUserId);

      // We only store the role name and derived perms in the JSON for caching purposes, 
      // but logic relies on metadata.
      const perms = availableRoles[newRole] || [];
      const newRoleInfo = { role: newRole, permissions: perms };

      const { error } = await supabase
        .from('project_users')
        .update({ role_info: JSON.stringify(newRoleInfo) })
        .eq('project_id', projectId)
        .eq('user_id', targetUserId);

      if (error) {
          alert("Failed to update role: " + error.message);
      } else {
          // Optimistic Update
          setAllMembers(prev => prev.map(m => 
              m.user_id === targetUserId 
              ? { ...m, role: newRole, permissions: perms } 
              : m
          ));
      }
      setActionLoading(null);
  };

  const handleRemoveMember = async (targetUserId: string) => {
      if(!confirm("Are you sure you want to remove this user from the project?")) return;
      if(!projectId) return;
      setActionLoading(targetUserId);

      const { error } = await supabase
        .from('project_users')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', targetUserId);

      if (error) {
          alert("Failed to remove user: " + error.message);
      } else {
          setAllMembers(prev => prev.filter(m => m.user_id !== targetUserId));
          setExpandedUserId(null);
      }
      setActionLoading(null);
  };

  const handleInviteMember = async () => {
      if(!inviteEmail) return;
      setActionLoading("invite");

      // 1. Resolve Permissions based on Project Metadata
      const perms = availableRoles[inviteRole] || [];

      // 2. Find User
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', inviteEmail)
        .single();

      if (!existingUser) {
          alert("User email not found in the system.");
          setActionLoading(null);
          return;
      }

      // 3. Insert into project_users
      const { error } = await supabase
        .from('project_users')
        .insert({
            project_id: projectId,
            user_id: existingUser.id,
            role_info: JSON.stringify({ role: inviteRole, permissions: perms })
        });

      if (error) {
          if (error.code === '23505') alert("User is already in this project.");
          else alert("Error adding user: " + error.message);
      } else {
          setInviteEmail("");
          setIsInviteOpen(false);
          // Refresh list from DB to get joined_at etc correctly
          const members = await fetchAllMemberData(projectId, availableRoles);
          setAllMembers(members);
      }
      setActionLoading(null);
  };

  const handleRolesUpdated = async (updatedRoles: Record<string, string[]>) => {
    // Update the project's metadata with new roles
    const { error } = await supabase
      .from('projects')
      .update({
        metadata: {
          ...project?.metadata,
          roles: updatedRoles
        }
      })
      .eq('id', projectId);

    if (error) {
      console.error('Failed to update project roles:', error);
      alert('Failed to update project roles');
    } else {
      // Update local state
      setAvailableRoles(updatedRoles);
      
      // Update the project object with new metadata
      if (project) {
        setProject({
          ...project,
          metadata: {
            ...project.metadata,
            roles: updatedRoles
          }
        });
      }
      
      // Refresh members to reflect role changes
      const members = await fetchAllMemberData(projectId, updatedRoles);
      setAllMembers(members);
      
      // Update role filters based on new roles
      const uniqueRoles = [...new Set(members
        .filter(m => m.role && m.role !== 'No Role Assigned')
        .map(m => m.role)
      )];
      const updatedFilters: RoleFilter[] = uniqueRoles.map(role => ({ name: role, isSelected: true }));
      setRoleFilters(updatedFilters);
    }
  };

  // --- UI CONSTANTS ---
  const currentUserId = user?.id || "";
  const currentUserPfp = user?.user_metadata?.avatar_url || "";
  const currentUserName = user?.user_metadata?.full_name || "You";

  const handleMemberClick = (userId: string) => setExpandedUserId(userId === expandedUserId ? null : userId);
  const toggleRoleFilter = (roleName: string) => {
    setRoleFilters(prev => prev.map(filter =>
      filter.name === roleName ? { ...filter, isSelected: !filter.isSelected } : filter
    ));
  };
  const handleRefresh = async () => {
    const members = await fetchAllMemberData(projectId, availableRoles);
    setAllMembers(members);
    location.reload();
  }

  if (loading) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-[#0a0a0a] text-zinc-100 flex overflow-hidden selection:bg-indigo-500/30">
      
      {/* SIDEBAR */}
      <Menu project={project} user={user} />
      
      <main className="flex-1 ml-64 flex flex-col h-full bg-[#09090b] relative">
        
        {/* HEADER */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Team <span className="text-white/30 text-lg font-light">Management</span></h1>
          </div>
          <div className="flex items-center gap-3">
             {/* CHANGED: Show FILTERED count instead of TOTAL count */}
             <div className="h-6 px-2 bg-zinc-900 border border-zinc-800 rounded text-[12px] font-mono text-zinc-500 flex items-center gap-2">
                <span>SHOWING:</span>
                <span className="text-zinc-300">{filteredMembers.length}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-500">{allMembers.length}</span>
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
                      placeholder="Find member..." 
                      className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all shadow-sm" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                   />
                </div>
                
                {/* Invite Button */}
                <button 
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-indigo-900/20 active:scale-95"
                >
                    <Plus size={14} />
                    <span>Invite Collaborator</span>
                </button>
                
                {/* Manage Roles Button */}
                <button 
                    onClick={() => setIsRoleManagementOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-300 text-[#0a0a0a] text-xs font-semibold rounded-lg transition-all shadow-sm shadow-indigo-900/20 active:scale-95"
                >
                    <Settings size={14} />
                    <span>Manage Roles</span>
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
                        <span>Roles</span>
                        <ChevronDown size={12} />
                    </button>
                    
                    {showRoleMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0C0C0E] border border-zinc-800 rounded-lg shadow-2xl z-30 p-1.5">
                             <div className="space-y-0.5">
                                <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Show Roles</div>
                                {roleFilters.map(filter => (
                                    <button
                                        key={filter.name}
                                        onClick={() => toggleRoleFilter(filter.name)}
                                        className="w-full text-left flex items-center justify-between px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-colors"
                                    >
                                        <span className="capitalize">{filter.name}</span>
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
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""}  />
                </button>
            </div>
        </div>

        {/* TABLE HEADER */}
        <div className="flex-none grid grid-cols-12 gap-4 px-6 py-2 border-b border-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none bg-zinc-900/20">
            <div className="col-span-5 pl-2">User</div>
            <div className="col-span-2">Current Role</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right pr-2">Manage</div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                    <div className="p-4 bg-zinc-900/30 rounded-full border border-zinc-800 mb-4">
                        <UsersIcon size={24} className="text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">No members found</h3>
                    <p className="text-xs text-zinc-500 max-w-sm">
                        {searchQuery ? `No members match "${searchQuery}"` : "No members match the selected filters"}
                    </p>
                    {(searchQuery || roleFilters.some(f => !f.isSelected)) && (
                        <button 
                            onClick={() => {
                                setSearchQuery("");
                                setRoleFilters(prev => prev.map(f => ({ ...f, isSelected: true })));
                            }}
                            className="mt-4 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                filteredMembers.map(member => {
                    const isExpanded = expandedUserId === member.user_id;
                    const isMe = member.user_id === currentUserId;
                    
                    return (
                    <React.Fragment key={member.user_id}>
                        <div 
                            onClick={() => handleMemberClick(member.user_id)}
                            className={`grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-zinc-800/30 items-center transition-all cursor-pointer group
                                ${isExpanded ? 'bg-zinc-900/30 border-zinc-800' : 'hover:bg-zinc-900/20'}`}
                        >
                            {/* 1. Identity */}
                            <div className="col-span-5 flex items-center gap-3">
                                <CreatorPfp
                                    userId={member.user_id}
                                    currentUserId={currentUserId}
                                    currentUserPfp={currentUserPfp}
                                    currentUserName={currentUserName}
                                    pfpUrl={member.avatar_url} 
                                    name={member.full_name}
                                    size="w-8 h-8"
                                    showNameOnHover={false}
                                />
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium transition-colors ${isExpanded ? 'text-indigo-400' : 'text-zinc-200 group-hover:text-white'}`}>
                                        {member.full_name} {isMe && <span className="text-zinc-600 text-[10px] ml-2">(You)</span>}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-mono tracking-tight truncate max-w-[200px]">
                                        {member.email}
                                    </span>
                                </div>
                            </div>

                            {/* 2. Role */}
                            <div className="col-span-2">
                                <span className="text-xs font-medium text-zinc-300 capitalize bg-zinc-800/50 px-2 py-1 rounded border border-zinc-800">
                                    {member.role}
                                </span>
                            </div>

                            {/* 3. Status/Date */}
                            <div className="col-span-3 text-xs text-zinc-500 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                <span>Active since {new Date(member.joined_at).toLocaleDateString()}</span>
                            </div>

                            {/* 4. Action Trigger */}
                            <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                                <button className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}>
                                    {isExpanded ? <ChevronUp size={14} /> : <MoreHorizontal size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* EXPANDED MANAGEMENT PANEL */}
                        {isExpanded && (
                            <div className="border-b border-zinc-800 bg-[#0C0C0E] px-6 py-6 animate-in slide-in-from-top-2 duration-200 cursor-default">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    
                                    {/* Col 1: Read Only Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contact Info</h3>
                                        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Mail size={14} className="text-zinc-500" />
                                                <span className="text-xs text-zinc-400 font-mono">{member.email}</span>
                                            </div>
                                            <div className="text-sm text-zinc-400 flex items-center gap-2 font-mono" title="Phone Number">
                                                <Phone size={10} /> <PhoneNumberDisplay phoneNumber={member.phone_number}/>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <UserIcon size={14} className="text-zinc-400" />
                                                <span className="text-xs text-zinc-400 font-mono truncate w-full" title={member.user_id}>
                                                    ID: {member.user_id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Col 2: Role Management */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Access Control</h3>
                                        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 flex flex-col gap-4">
                                            
                                            <div>
                                                <label className="text-xs text-zinc-400 block mb-2">Assigned Role</label>
                                                <div className="relative">
                                                    <select 
                                                        value={member.role} 
                                                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                        disabled={isMe || actionLoading === member.user_id}
                                                        className="w-full appearance-none bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50 capitalize"
                                                    >
                                                        {Object.keys(availableRoles).map(r => (
                                                            <option key={r} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"/>
                                                </div>
                                                {actionLoading === member.user_id && <span className="text-[10px] text-indigo-400 mt-1 block">Updating...</span>}
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider">Capabilities</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {member.permissions.map((perm, i) => (
                                                        <span key={i} className="px-2 py-1 rounded bg-zinc-800/40 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                                                            {perm}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Col 3: Danger Zone */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-bold text-rose-900/50 uppercase tracking-widest">Danger Zone</h3>
                                        <div className="p-4 rounded-xl border border-rose-900/20 bg-rose-950/5 flex flex-col justify-between h-auto gap-3">
                                            <div className="text-xs text-zinc-500">
                                                Removing this user will revoke all access to the project immediately.
                                            </div>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.user_id); }}
                                                disabled={isMe || actionLoading === member.user_id}
                                                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={12} />
                                                {actionLoading === member.user_id ? "Processing..." : "Remove from Project"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                )})
            )}
            
        </div>
      </main>

      {/* INVITE MODAL OVERLAY */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setIsInviteOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X size={16} />
                </button>
                
                <h2 className="text-lg font-bold text-white mb-4">Invite Team Member</h2>

                {/* 1. INVITE CODE COMPONENT */}
                <ProjectCodeGeneration projectId={projectId} />
            </div>
        </div>
      )}

      {/* ROLE MANAGEMENT MODAL OVERLAY */}
      <RoleManagementModal
        projectId={projectId}
        availableRoles={availableRoles}
        isOpen={isRoleManagementOpen}
        onClose={() => setIsRoleManagementOpen(false)}
        onRolesUpdated={handleRolesUpdated}
      />

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