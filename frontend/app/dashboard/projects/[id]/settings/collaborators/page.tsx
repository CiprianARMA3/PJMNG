"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu";
import React from "react"; 
import { PhoneNumberDisplay } from "./components/identifyPhoneNumberProvenience";

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
  Phone // Added Phone icon
} from "lucide-react";

// --- TYPES (Member Specific) ---
type MemberData = {
    user_id: string;
    email: string;
    full_name: string;
    phone_number: string | null; // Added phone_number
    avatar_url: string | null; 
    role: string;
    permissions: string[];
    joined_at: string;
};
type RoleFilter = { name: string; isSelected: boolean };

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


// --- MAIN COMPONENT: ProjectMembersPage ---
export default function ProjectMembersPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  // --- MEMBER SPECIFIC STATE ---
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberData[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilters, setRoleFilters] = useState<RoleFilter[]>([]);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // --- DATA FETCHING ---
  const parseRoleInfo = (rawRole: any): { role: string; permissions: string[] } => {
    let info = rawRole;
    if (typeof info === 'string') {
        try { info = JSON.parse(info); } catch (e) { info = null; }
    }
    return {
        role: info?.role || 'No Role Assigned',
        permissions: info?.permissions || ['none']
    };
  };

  async function fetchAllMemberData(id: string): Promise<MemberData[]> {
    setRefreshing(true);
    const { data: projectUsersData, error: puError } = await supabase
        .from("project_users")
        .select(`user_id, role_info, joined_at`)
        .eq("project_id", id);

    if (puError || !projectUsersData) {
        setRefreshing(false);
        return [];
    }

    const userIds = projectUsersData.map(pu => pu.user_id);
    if (userIds.length === 0) {
        setRefreshing(false);
        return [];
    }

    // Updated select to include phone_number
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
            phone_number: u.phone_number || null, // Capture phone number
            avatar_url: avatar_url,
            user_created_at: u.created_at,
        };
        return acc;
    }, {} as Record<string, { id: string, email: string, full_name: string, phone_number: string | null, avatar_url: string | null, user_created_at: string }>);

    const combinedMembers: MemberData[] = projectUsersData.map(pu => {
        const userData = userMap[pu.user_id] || { 
            id: pu.user_id, 
            email: 'Unavailable', 
            full_name: 'User Deleted', 
            phone_number: null,
            avatar_url: null,
            user_created_at: pu.joined_at
        };
        const roleInfo = parseRoleInfo(pu.role_info);

        return {
            user_id: pu.user_id,
            email: userData.email,
            full_name: userData.full_name,
            phone_number: userData.phone_number,
            avatar_url: userData.avatar_url,
            role: roleInfo.role,
            permissions: roleInfo.permissions,
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
    
        // 4. Fetch Project Data
        const { data: projectData } = await supabase
            .from("projects")
            .select("id, name, metadata")
            .eq("id", id)
            .single();

        if (projectData) {
             const iconUrl = projectData.metadata?.project_icon_url || projectData.metadata?.logo_url || null; 
             setProject({ ...projectData, icon_url: iconUrl });
        } else {
             setProject(null);
        }

        // 5. Fetch Members
        const members = await fetchAllMemberData(id);
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

  // --- FILTERING ---
  useEffect(() => {
    if (loading) return;
    const isSearchEmpty = !searchQuery.trim();
    const activeRoles = roleFilters.filter(f => f.isSelected).map(f => (f.name || "").toLowerCase());
    const searchLower = searchQuery.toLowerCase();

    const filtered = allMembers.filter(member => {
      const matchesSearch = isSearchEmpty ||
                            member.full_name.toLowerCase().includes(searchLower) ||
                            member.email.toLowerCase().includes(searchLower) ||
                            member.user_id.includes(searchLower);
      const matchesRole = activeRoles.includes(member.role.toLowerCase());
      return matchesSearch && matchesRole;
    });

    setFilteredMembers(filtered.sort((a, b) => a.full_name.localeCompare(b.full_name)));
  }, [allMembers, searchQuery, roleFilters, loading]);

  // --- HANDLERS ---
  const toggleRoleFilter = (roleName: string) => {
    setRoleFilters(prev => prev.map(filter =>
      filter.name === roleName ? { ...filter, isSelected: !filter.isSelected } : filter
    ));
  };
  const handleMemberClick = (userId: string) => setExpandedUserId(userId === expandedUserId ? null : userId);
  const handleRefresh = async () => {
    if (!projectId) return;
    const members = await fetchAllMemberData(projectId);
    setAllMembers(members);
  }

  const handleCopyId = async (id: string) => {
    try {
        await navigator.clipboard.writeText(id);
        setCopyStatus(id); // Set status to the ID that was copied
        
        // Clear status after a short delay (e.g., 2 seconds)
        setTimeout(() => {
            setCopyStatus(null);
        }, 2000);

    } catch (err) {
        console.error('Failed to copy ID: ', err);
        // Optional: Show an error message to the user
    }
};


  // --- UI CONSTANTS ---
  const currentUserId = user?.id || "";
  const currentUserPfp = user?.user_metadata?.avatar_url || "";
  const currentUserName = user?.user_metadata?.full_name || "You";

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
        {/* #262626  #09090b] */}
        
        {/* HEADER */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Collaborators <span className="text-white/30 text-lg font-light">Panel</span></h1>
          </div>
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3 w-full max-w-3xl">
                {/* Search Bar */}
                <div className="relative flex-1 group">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                   <input 
                      type="text" 
                      placeholder="Search by name, email, or user ID..." 
                      className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 transition-all shadow-sm" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                   />
                </div>
                
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
                        <span>Filter Roles</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${showRoleMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showRoleMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0C0C0E] border border-zinc-800 rounded-lg shadow-2xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                             <div className="space-y-0.5">
                                <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Roles</div>
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

                {/* Refresh Button */}
                <button 
                    onClick={handleRefresh} 
                    className="p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 transition-all active:scale-95"
                    title="Refresh Data"
                >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>
        </div>

        {/* TABLE HEADER */}
        <div className="flex-none grid grid-cols-12 gap-4 px-6 py-2 border-b border-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none bg-zinc-900/20">
            <div className="col-span-4 pl-2">Member</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-4">Access Level</div>
            <div className="col-span-2 text-right pr-2">Actions</div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredMembers.map(member => {
                const isExpanded = expandedUserId === member.user_id;
                
                return (
                <React.Fragment key={member.user_id}>
                    <div 
                        onClick={() => handleMemberClick(member.user_id)}
                        className={`grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-zinc-800/30 items-center transition-all cursor-pointer group
                            ${isExpanded ? 'bg-zinc-900/30 border-zinc-800' : 'hover:bg-zinc-900/20'}`}
                    >
                        {/* 1. Member Identity */}
                        <div className="col-span-4 flex items-center gap-3">
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
                                    {member.full_name}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono tracking-tight truncate max-w-[180px]">
                                    {member.email}
                                </span>
                            </div>
                        </div>

                        {/* 2. Role Badge */}
                        <div className="col-span-2">
                            <div className="inline-flex items-center px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50">
                                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                    member.role.toLowerCase().includes('admin') ? 'bg-rose-500' : 
                                    member.role.toLowerCase().includes('editor') ? 'bg-indigo-500' : 'bg-emerald-500'
                                }`}></div>
                                <span className="text-[11px] font-medium text-zinc-300 capitalize">{member.role}</span>
                            </div>
                        </div>

                        {/* 3. Permissions Preview */}
                        <div className="col-span-4 flex items-center gap-1.5 overflow-hidden">
                           {member.permissions.slice(0, 2).map((perm, i) => (
                               <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800/40 text-[10px] text-zinc-400 font-mono border border-zinc-800/50">
                                   {perm}
                               </span>
                           ))}
                           {member.permissions.length > 2 && (
                               <span className="text-[10px] text-zinc-600 font-medium">+{member.permissions.length - 2}</span>
                           )}
                        </div>

                        {/* 4. Actions / Date */}
                        <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                             <span className="text-xs text-zinc-600 font-mono hidden sm:inline-block">
                                {new Date(member.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                             </span>
                             <button className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                                {isExpanded ? <ChevronUp size={14} /> : <MoreHorizontal size={14} />}
                             </button>
                        </div>
                    </div>

                    {/* EXPANDED DETAILS PANEL */}
                    {isExpanded && (
                        <div className="border-b border-zinc-800 bg-[#0C0C0E] px-6 py-6 animate-in slide-in-from-top-2 duration-200">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Col 1: Identity Card */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User Profile</h3>
                                    <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                                         <CreatorPfp
                                            userId={member.user_id}
                                            currentUserId={currentUserId}
                                            currentUserPfp={currentUserPfp}
                                            currentUserName={currentUserName}
                                            pfpUrl={member.avatar_url} 
                                            name={member.full_name}
                                            size="w-12 h-12"
                                            showNameOnHover={false}
                                        />
                                        <div className="space-y-1">
                                            <div className="font-medium text-zinc-200">{member.full_name}</div>
                                            <div className="text-sm text-zinc-500 flex items-center gap-2 font-mono">
                                                <Mail size={10} /> {member.email}
                                            </div>
                                            
                                            {/* PHONE NUMBER SECTION */}
                                            <div className="text-sm text-zinc-500 flex items-center gap-2 font-mono" title="Phone Number">
                                                <Phone size={10} /> <PhoneNumberDisplay phoneNumber={member.phone_number} />
                                            </div>

                                            <div
                                                className="text-xs flex items-center gap-2 font-mono cursor-pointer transition-colors"
                                                title="Click to copy User ID"
                                                onClick={() => handleCopyId(member.user_id)} // 👈 Attach the handler
                                            >
                                                {/* Icon changes based on copy status */}
                                                {copyStatus === member.user_id ? (
                                                    <Check size={10} className="text-emerald-400" /> // Show checkmark on success
                                                ) : (
                                                    <UserIcon size={10} className="text-zinc-500" /> // Default icon
                                                )}

                                                {/* Text changes based on copy status */}
                                                <span className={`truncate max-w-[120px] ${copyStatus === member.user_id ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                                    {copyStatus === member.user_id ? 'Copied!' : member.user_id}
                                                </span>

                                                {/* Copy Icon changes based on status */}
                                                <Copy size={10} className={copyStatus === member.user_id ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Role Configuration */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role & Permissions</h3>
                                    <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={14} className="text-indigo-400"/>
                                                <span className="text-sm font-medium text-zinc-300 capitalize">{member.role}</span>
                                            </div>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">
                                                Active
                                            </span>
                                        </div>
                                        <div className="border-t border-zinc-800/50 pt-3">
                                            <div className="text-[10px] text-zinc-500 mb-2">Effective Permissions</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {member.permissions.map((perm, i) => (
                                                    <span key={i} className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                                                        {perm}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 3: Metadata / Danger Zone */}
                                <div className="space-y-4">
                                     <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Metadata</h3>
                                     <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 flex flex-col justify-between h-auto gap-3">
                                         <div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                                                <Calendar size={12} className="text-zinc-600" />
                                                <span>Member since <span className="text-zinc-200">{new Date(member.joined_at).toLocaleDateString()}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                <ShieldAlert size={12} className="text-zinc-600" />
                                                <span>Last active: <span className="text-zinc-200">Recently</span></span>
                                            </div>
                                         </div>
                                     </div>
                                </div>
                             </div>
                        </div>
                    )}
                </React.Fragment>
            )})}
            
            {filteredMembers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-96 text-zinc-600">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 ring-1 ring-zinc-800">
                        <UsersIcon size={24} className="opacity-50"/>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">No members found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                    <button onClick={() => {setSearchQuery(""); setRoleFilters(roleFilters.map(r => ({...r, isSelected: true})))}} className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 hover:underline">
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
      </main>
      
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