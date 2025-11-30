"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import React from "react"; 

import { 
  Search, Plus, X, 
  CheckCircle2, Clock, AlertTriangle, 
  FileCode, Terminal, 
  Save, Trash2, Edit, Bug, Zap, Hammer, Github, 
  ExternalLink,
  RefreshCw, Filter, ChevronDown, 
  ChevronUp, Minus,
  Disc, XCircle, Users as UsersIcon,
  Mail, GitBranch, User as UserIcon, Calendar,
  Check
} from "lucide-react";

// --- TYPES (Member Specific) ---
type MemberData = {
    user_id: string;
    email: string;
    full_name: string;
    avatar_url: string | null; 
    role: string;
    permissions: string[];
    joined_at: string; // This will now represent user's created_at for display
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
    size = 'w-5 h-5',
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
                className={`${size} rounded-full object-cover ring-1 ring-[#27272A] bg-[#18181B]`}
            />
            {showNameOnHover && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#09090B] border border-[#27272A] text-[11px] font-medium text-white rounded-md shadow-2xl opacity-0 translate-y-2 group-hover/pfp:translate-y-0 group-hover/pfp:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                    {finalName}
                </div>
            )}
        </div>
    );
};
// --- END PFP COMPONENT ---


// --- DUMMY COMPONENTS (Required by the IssuesPage template structure) ---
const VSCodeHeader = ({ title }: { title: string }) => (
  <div className="bg-[#252526] px-4 py-2 border-b border-[#1e1e1e] flex justify-between items-center rounded-t-lg select-none">
    <span className="text-[10px] font-bold text-[#969696] uppercase tracking-wider font-mono flex items-center gap-2">
      <FileCode size={10} className="text-[#9200cc]"/> {title}
    </span>
  </div>
);

const CodeBlock = ({ language, code }: { language: string, code: string }) => {
  return (
    <div className="my-4 rounded-lg bg-[#1e1e1e] border border-[#333] overflow-hidden shadow-xl">
      <VSCodeHeader title={language.toUpperCase() || 'TEXT'} />
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: '#1e1e1e', 
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
        showLineNumbers={true}
        lineNumberStyle={{ minWidth: "2.5em", paddingRight: "1em", color: "#6e7681", textAlign: "right" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};


// --- MAIN COMPONENT: ProjectMembersPage ---
export default function ProjectMembersPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
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

  // --- DUMMY STATE/HANDLERS REQUIRED BY ISSUESPAGE SHELL ---
  const selectedIssue: any = null; 
  const openModal = () => {};
  const closeModal = () => {};


  // --- DATA FETCHING AND PROCESSING ---

  /**
   * Safely parses the role_info JSONB column.
   */
  const parseRoleInfo = (rawRole: any): { role: string; permissions: string[] } => {
    let info = rawRole;
    if (typeof info === 'string') {
        try {
            info = JSON.parse(info);
        } catch (e) {
            info = null;
        }
    }
    return {
        role: info?.role || 'No Role Assigned',
        permissions: info?.permissions || ['none']
    };
  };

  /**
   * Main function to fetch all required member data.
   */
  async function fetchAllMemberData(id: string): Promise<MemberData[]> {
    setRefreshing(true);
    // 1. Fetch project_users to get IDs, roles, and joined date
    const { data: projectUsersData, error: puError } = await supabase
        .from("project_users")
        .select(`user_id, role_info, joined_at`)
        .eq("project_id", id);

    if (puError || !projectUsersData) {
        console.error("Error fetching project users:", puError?.message);
        setRefreshing(false);
        return [];
    }

    const userIds = projectUsersData.map(pu => pu.user_id);
    if (userIds.length === 0) {
        setRefreshing(false);
        return [];
    }

    // 2. Fetch public user details (email, name, surname, metadata, and user's global created_at) from 'users' table
    const { data: usersData, error: uError } = await supabase
        .from("users")
        .select(`id, email, name, surname, metadata, created_at`) // Added created_at
        .in("id", userIds);

    if (uError) console.error("Error fetching user details:", uError.message);
    
    // Map user data for easy lookup
    const userMap = (usersData || []).reduce((acc, u) => {
        const full_name = (u.name || '') + (u.surname ? ` ${u.surname}` : '');
        const avatar_url = (u.metadata as any)?.avatar_url || null;

        acc[u.id] = {
            id: u.id,
            email: u.email || 'N/A',
            full_name: full_name || 'Name Unavailable',
            avatar_url: avatar_url,
            user_created_at: u.created_at, // Store user's registration date
        };
        return acc;
    }, {} as Record<string, { id: string, email: string, full_name: string, avatar_url: string | null, user_created_at: string }>);

    // 3. Combine data
    const combinedMembers: MemberData[] = projectUsersData.map(pu => {
        const userData = userMap[pu.user_id] || { 
            id: pu.user_id, 
            email: 'Unavailable', 
            full_name: 'User Deleted', 
            avatar_url: null,
            user_created_at: pu.joined_at // Fallback to project join date
        };
        const roleInfo = parseRoleInfo(pu.role_info);

        return {
            user_id: pu.user_id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            role: roleInfo.role,
            permissions: roleInfo.permissions,
            // FIX: Use user's global registration date (created_at)
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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth/login"); return; }
        setUser(user);
    
        // FIX: Ensure project metadata is fetched to get the project icon/logo
        const { data: projectData } = await supabase.from("projects").select("id, name, metadata").eq("id", id).single();
        
        if (projectData) {
             // Extract logo URL from metadata and attach it directly to the project object
             // Assume the logo URL is under metadata.logo_url or metadata.icon_url
             const iconUrl = projectData.metadata?.project_icon_url || projectData.metadata?.logo_url || null; 
             
             // Create a new project object that includes the icon URL for the Menu component
             const projectWithIcon = {
                 ...projectData,
                 icon_url: iconUrl // This field is now definitely set if it exists in metadata
             };
             setProject(projectWithIcon);
        } else {
             setProject(null);
        }

        const members = await fetchAllMemberData(id);
        setAllMembers(members);

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

  // --- FILTERING LOGIC ---
  useEffect(() => {
    if (loading) return;

    const isSearchEmpty = !searchQuery.trim();
    const activeRoles = roleFilters
        .filter(f => f.isSelected)
        .map(f => (f.name || "").toLowerCase());

    const searchLower = searchQuery.toLowerCase();

    const filtered = allMembers.filter(member => {
      const matchesSearch = isSearchEmpty ||
                            member.full_name.toLowerCase().includes(searchLower) ||
                            member.email.toLowerCase().includes(searchLower) ||
                            member.user_id.includes(searchLower);

      const memberRoleLower = member.role.toLowerCase();
      const matchesRole = activeRoles.includes(memberRoleLower);

      return matchesSearch && matchesRole;
    });

    setFilteredMembers(filtered.sort((a, b) =>
        a.full_name.localeCompare(b.full_name)
    ));
  }, [allMembers, searchQuery, roleFilters, loading]);


  // --- HANDLERS ---
  const toggleRoleFilter = (roleName: string) => {
    setRoleFilters(prev => prev.map(filter =>
      filter.name === roleName ? { ...filter, isSelected: !filter.isSelected } : filter
    ));
  };

  const clearSearch = () => setSearchQuery("");
  const closeRoleMenu = () => setShowRoleMenu(false);

  const handleMemberClick = (userId: string) => {
    setExpandedUserId(userId === expandedUserId ? null : userId);
  };
  
  const handleRefresh = async () => {
    if (!projectId) return;
    const members = await fetchAllMemberData(projectId);
    setAllMembers(members);
  }

  // --- UI Variables ---
  const currentUserId = user?.id || "";
  const currentUserPfp = user?.user_metadata?.avatar_url || "";
  const currentUserName = user?.user_metadata?.full_name || "You";
  const selectedRolesCount = roleFilters.filter(f => f.isSelected).length;
  const allRolesCount = roleFilters.length;
  const isAllRolesSelected = selectedRolesCount === allRolesCount;
  
  // --- Render ---

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
            fill="currentColor"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; border-left: 1px solid #222; }
        ::-webkit-scrollbar-thumb { background: #333; border: 2px solid #0a0a0a; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      {/* Pass the project object (now containing icon_url) to Menu */}
      <Menu project={project} user={user} />
      
      <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a]">
        
        {/* HEADER */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Collaborators <span className="text-white/30 text-lg font-light">Interface</span></h1>
          </div>
          {/* Empty div to balance space if needed */}
          <div></div> 
        </div>

        {/* TOOLBAR & FILTERS */}
        <div className="flex-none px-6 py-4 flex items-center justify-between border-b border-white/5">
            {/* Title Column */}
            <h2 className="text-lg font-medium text-white/80">
                 All Members ({allMembers.length})
            </h2>

            {/* Filter/Search Column (Right side) */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                   <input 
                      type="text" 
                      placeholder="Search members by name, email, or ID..." 
                      className="w-[400px] bg-[#161616] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-white/20 transition-all" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                   />
                </div>
                
                <button 
                    onClick={handleRefresh} 
                    className="p-2 bg-[#161616] border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all active:scale-95" 
                    title="Refresh Members"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                </button>

                <div className="relative">
                    <button 
                        onClick={() => setShowRoleMenu(!showRoleMenu)} 
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${showRoleMenu ? 'bg-white/10 border-white/20 text-white' : 'bg-[#161616] border-white/10 text-white/60 hover:text-white'}`}
                    >
                        <Filter size={16} /> Roles <ChevronDown size={14} className={`transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showRoleMenu && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-20 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                            {/* Role Filter */}
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">Role</label>
                                 <div className="space-y-1">
                                    {roleFilters.map(filter => (
                                        <button
                                            key={filter.name}
                                            onClick={() => toggleRoleFilter(filter.name)}
                                            className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-[#252526] rounded-md transition-colors"
                                        >
                                            <span className="capitalize">{filter.name}</span>
                                            {filter.isSelected && <Check size={16} className="text-indigo-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-2 mt-2 border-t border-[#27272A]">
                                 <button
                                        onClick={closeRoleMenu}
                                        className="w-full text-center px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-white transition-colors rounded-md"
                                    >
                                        Close
                                    </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- MEMBER TABLE HEADER --- */}
        <div className="flex-none grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/30 bg-[#0a0a0a]">
            <div className="col-span-4">Member Details</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3 hidden sm:block">Permissions Preview</div>
            <div className="col-span-2 text-right">Joined / Toggle Details</div>
        </div>

        {/* MEMBER LIST TABLE */}
        <div className="flex-1 overflow-y-auto">
            {filteredMembers.map(member => (
                <React.Fragment key={member.user_id}>
                    <tr
                        onClick={() => handleMemberClick(member.user_id)}
                        className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center transition-all cursor-pointer hover:bg-[#111] 
                            ${expandedUserId === member.user_id ? 'bg-[#161616]' : ''}`}
                    >
                        {/* 1. Member Details */}
                        <div className="col-span-4 flex items-center">
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
                            <div className="ml-4">
                                <div className="text-sm font-medium text-zinc-200">{member.full_name}</div>
                                <div className="text-xs text-zinc-500 truncate max-w-[150px]" title={member.email}>{member.email}</div>
                            </div>
                        </div>

                        {/* 2. Role */}
                        <div className="col-span-3">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-900/40 text-indigo-400 capitalize">
                                {member.role}
                            </span>
                        </div>

                        {/* 3. Permissions Preview */}
                        <div className="col-span-3 text-xs text-white/60 truncate hidden sm:block" title={member.permissions.join(', ')}>
                            {member.permissions.slice(0, 3).join(', ')}
                            {member.permissions.length > 3 && `... (+${member.permissions.length - 3})`}
                        </div>

                        {/* 4. Joined / Toggle Details */}
                        <div className="col-span-2 text-xs text-white/40 text-right flex items-center justify-end">
                            {/* FIX: Display correct date label */}
                            <span className="text-white/60 hidden sm:inline" title="User Registration Date">{new Date(member.joined_at).toLocaleDateString()}</span>
                            {expandedUserId === member.user_id ? <ChevronUp size={16} className="text-zinc-400 inline ml-2" /> : <ChevronDown size={16} className="text-zinc-400 inline ml-2" />}
                        </div>
                    </tr>

                    {/* Expanded Row for ALL INFO */}
                    {expandedUserId === member.user_id && (
                        // Darker background for the expanded details container itself
                        <div className="grid grid-cols-12 bg-[#111] border-t border-[#333]/50">
                            <div className="col-span-12 py-3 px-6 text-sm">
                                {/* Darker background for the inner content box */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#0a0a0a] p-4 rounded-lg border border-[#333]"> 
                                    
                                    {/* Full Name */}
                                    <div className="flex items-center gap-2">
                                        <UserIcon size={16} className="text-white/60 flex-shrink-0" />
                                        <span className="font-medium text-zinc-400 w-20">Name:</span>
                                        <span className="text-zinc-200 font-medium flex-1 truncate">{member.full_name}</span>
                                    </div>

                                    {/* Role */}
                                    <div className="flex items-center gap-2">
                                        <GitBranch size={16} className="text-indigo-400 flex-shrink-0" />
                                        <span className="font-medium text-zinc-400 w-20">Role:</span>
                                        <span className="text-zinc-200 flex-1 truncate capitalize">{member.role}</span>
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-indigo-400 flex-shrink-0" />
                                        <span className="font-medium text-zinc-400 w-20">Email:</span>
                                        <span className="text-zinc-200 font-mono flex-1 truncate">{member.email}</span>
                                    </div>
                                    
                                    {/* Joined Date */}
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-green-500 flex-shrink-0" />
                                        <span className="font-medium text-zinc-400 w-20">Joined:</span>
                                        <span className="text-zinc-200 text-sm flex-1 truncate" title="User Registration Date">
                                            {new Date(member.joined_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* User ID (moved below for less prominence) */}
                                    <div className="flex items-center gap-2 lg:col-span-4 border-t border-[#333] pt-2">
                                        <UserIcon size={14} className="text-amber-400 flex-shrink-0" />
                                        <span className="font-medium text-zinc-400 w-20">User ID:</span>
                                        <span className="text-zinc-200 font-mono flex-1 truncate text-xs">{member.user_id}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}
                </React.Fragment>
            ))}
            {filteredMembers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <UsersIcon size={32} className="mb-2 opacity-50"/>
                    <p>No members found matching your criteria.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}