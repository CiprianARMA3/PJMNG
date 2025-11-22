"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "./../components/menu";
import { 
  Search, Plus, X, 
  CheckCircle2, Clock, AlertTriangle, 
  FileCode, Terminal, 
  Send, Trash2, Edit, Save, 
  Bug, Zap, Hammer, Github, 
  GitBranch, Users, UserPlus, UserMinus, ExternalLink,
  RefreshCw, Filter, ChevronDown, // Existing imports
  ChevronUp, Minus // Added imports for visual urgency
} from "lucide-react";

// --- TYPES ---
type UserProfile = {
  id: string;
  name: string | null;
  surname: string | null;
  metadata: { avatar_url?: string; role?: string; [key: string]: any };
};

type Tag = {
  name: string;
  color: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user: UserProfile;
};

type Issue = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string | null;
  type: string; 
  status: string; 
  priority: string; 
  metadata: {
    tags?: Tag[];
    github_repo?: string;
    github_path?: string;
    collaborators?: string[]; 
    resolved_by?: string; 
    code_snippet?: string;
    terminal_output?: string;
    attachments?: string[]; 
  } | null;
  created_at: string;
  updated_at: string;
  creator: UserProfile | null;
};

const BUCKET_NAME = "projects-metadata";

// --- VS CODE STYLE COMPONENTS ---
const VSCodeHeader = ({ title }: { title: string }) => (
  <div className="bg-[#252526] px-4 py-2 border-b border-[#1e1e1e] flex justify-between items-center rounded-t-lg select-none">
    <span className="text-[10px] font-bold text-[#969696] uppercase tracking-wider font-mono flex items-center gap-2">
      <FileCode size={10} className="text-[#007acc]"/> {title}
    </span>
    <div className="flex gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors"></div>
      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors"></div>
    </div>
  </div>
);

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return <span className="text-white/20 italic">No description provided.</span>;
  const parts = content.split(/(`{3}[\s\S]*?`{3})/g); 

  return (
    <div className="text-sm text-[#d4d4d4] leading-relaxed space-y-2 font-light">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3).replace(/^([a-z]*)\n/, ''); 
          return (
            <div key={index} className="my-4 rounded-lg bg-[#1e1e1e] border border-[#333] overflow-hidden shadow-lg">
              <VSCodeHeader title="CODE_BLOCK" />
              <div className="relative overflow-x-auto">
                 <pre className="p-4 font-mono text-sm text-[#9cdcfe] leading-6 whitespace-pre tab-4">
                    {code}
                 </pre>
              </div>
            </div>
          );
        }
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.split('\n').map((line, i) => {
               if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2">{line.replace(/^# /, '')}</h1>;
               if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-4 mb-2">{line.replace(/^## /, '')}</h2>;
               if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-white/80 my-1">{line.replace(/^- /, '')}</li>;
               return <p key={i} className="mb-1.5 min-h-[10px]">{line}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

// --- NEW UI HELPER: PRIORITY ICON ---
const getPriorityIcon = (p: string) => {
    const size = 10;
    const baseClass = "mr-1"; // Small margin right
    if (p === 'Urgent') return <AlertTriangle size={size} className={`${baseClass} text-red-500 fill-red-500/30`} />;
    if (p === 'High') return <ChevronUp size={size} className={`${baseClass} text-orange-500`} />;
    if (p === 'Normal') return <Minus size={size} className={`${baseClass} text-blue-500`} />;
    if (p === 'Low') return <ChevronDown size={size} className={`${baseClass} text-cyan-500`} />;
    return null;
};


export default function IssuesPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // View State
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null); 
  const [isNewIssue, setIsNewIssue] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details");
  
  // Form State (rest of form state remains unchanged for brevity)
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState("Bug");
  const [formPriority, setFormPriority] = useState("Normal");
  const [formStatus, setFormStatus] = useState("Open");
  const [formTags, setFormTags] = useState<Tag[]>([]);
  const [formCode, setFormCode] = useState("");
  const [formTerminal, setFormTerminal] = useState("");
  const [formGithubRepo, setFormGithubRepo] = useState("");
  const [formGithubPath, setFormGithubPath] = useState("");
  
  const [tagNameInput, setTagNameInput] = useState("");
  const [tagColorInput, setTagColorInput] = useState("#6366f1");

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});

  // --- INITIAL FETCH ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
      setProject(proj);
      fetchIssues();
    };
    init();
  }, [projectId]);

  const fetchIssues = async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from("issues")
      .select(`*, creator:users!issues_user_id_fkey ( id, name, surname, metadata )`)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });

    if (data) {
       setIssues(data as any);
       
       // Gather IDs for Avatar Map (Creator, Solver, Collaborators)
       const userIds = new Set<string>();
       data.forEach((i: any) => {
           if(i.user_id) userIds.add(i.user_id);
           if(i.metadata?.resolved_by) userIds.add(i.metadata.resolved_by);
           if(i.metadata?.collaborators) i.metadata.collaborators.forEach((c: string) => userIds.add(c));
       });

       if(userIds.size > 0) {
         const { data: users } = await supabase.from("users").select("id, name, surname, metadata").in("id", Array.from(userIds));
         if(users) {
            const map: any = {};
            users.forEach(u => map[u.id] = u);
            setUserMap(map);
         }
       }
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchComments = async () => {
    if (!selectedIssue) return;
    const { data } = await supabase
      .from("issue_comments")
      .select(`*, user:users ( id, name, surname, metadata )`)
      .eq("issue_id", selectedIssue.id)
      .order("created_at", { ascending: true });
    
    if (data) setComments(data as any);
  };

  useEffect(() => {
    if (selectedIssue && activeTab === "comments") fetchComments();
  }, [selectedIssue, activeTab]);

  // --- FILTER LOGIC ---
  const filteredIssues = issues.filter(issue => {
      const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "All" || issue.type === filterType;
      const matchesPriority = filterPriority === "All" || issue.priority === filterPriority;
      const matchesStatus = filterStatus === "All" || issue.status === filterStatus;
      return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  // --- ACTIONS (omitted for brevity) ---
  const openModal = (issue?: Issue) => {
    // ... logic remains unchanged
    if (issue) {
      setSelectedIssue(issue);
      setIsNewIssue(false);
      setIsEditing(false);
      
      setFormTitle(issue.title);
      setFormContent(issue.content || "");
      setFormType(issue.type);
      setFormPriority(issue.priority);
      setFormStatus(issue.status);
      const rawTags = issue.metadata?.tags || [];
      setFormTags(rawTags.map((t: any) => typeof t === 'string' ? { name: t, color: '#6366f1' } : t));
      setFormCode(issue.metadata?.code_snippet || "");
      setFormTerminal(issue.metadata?.terminal_output || "");
      setAttachments(issue.metadata?.attachments || []);
      setFormGithubRepo(issue.metadata?.github_repo || "");
      setFormGithubPath(issue.metadata?.github_path || "");
      setActiveTab("details");
    } else {
      setSelectedIssue({ id: "new" } as Issue);
      setIsNewIssue(true);
      setIsEditing(true);
      
      setFormTitle("");
      setFormContent("");
      setFormType("Bug");
      setFormPriority("Normal");
      setFormStatus("Open");
      setFormTags([]);
      setFormCode("");
      setFormTerminal("");
      setFormGithubRepo("");
      setFormGithubPath("");
      setAttachments([]);
      setActiveTab("details");
    }
  };

  const closeModal = () => { setSelectedIssue(null); setIsEditing(false); };

  const handleAddTag = async (saveToGlobal: boolean) => {
    if (!tagNameInput) return;
    const newTag = { name: tagNameInput, color: tagColorInput };
    
    setFormTags([...formTags, newTag]);

    if (saveToGlobal && project) {
       const currentGlobals = project.metadata?.global_issue_tags || [];
       if (!currentGlobals.find((t: Tag) => t.name === newTag.name)) {
          const updatedGlobals = [...currentGlobals, newTag];
          const updatedMetadata = { ...project.metadata, global_issue_tags: updatedGlobals };
          
          await supabase.from("projects").update({ metadata: updatedMetadata }).eq("id", projectId);
          setProject({ ...project, metadata: updatedMetadata });
       }
    }
    setTagNameInput("");
  };

  const handleSaveIssue = async () => {
    if (!formTitle.trim()) return;
    const metadata = {
      tags: formTags,
      code_snippet: formCode,
      terminal_output: formTerminal,
      attachments: attachments,
      github_repo: formGithubRepo,
      github_path: formGithubPath,
      collaborators: selectedIssue?.metadata?.collaborators || [], 
      resolved_by: formStatus === "Resolved" ? user.id : (selectedIssue?.metadata?.resolved_by || null)
    };

    if (isNewIssue) {
      const { error } = await supabase.from("issues").insert({
        project_id: projectId,
        user_id: user.id,
        title: formTitle,
        content: formContent,
        type: formType,
        priority: formPriority,
        status: formStatus,
        metadata
      });
      if (!error) { fetchIssues(); closeModal(); }
    } else if (selectedIssue) {
      const { error } = await supabase.from("issues").update({
        title: formTitle,
        content: formContent,
        type: formType,
        priority: formPriority,
        status: formStatus,
        updated_at: new Date().toISOString(),
        metadata
      }).eq("id", selectedIssue.id);
      if (!error) { fetchIssues(); closeModal(); }
    }
  };

  const handleDeleteIssue = async () => {
    if(!selectedIssue) return;
    if(!confirm("Delete this issue?")) return;
    await supabase.from("issues").delete().eq("id", selectedIssue.id);
    fetchIssues();
    closeModal();
  };

  const handleJoinIssue = async () => {
    if (!selectedIssue) return;
    const currentCollaborators = selectedIssue.metadata?.collaborators || [];
    const isJoined = currentCollaborators.includes(user.id);
    
    let newCollaborators;
    if (isJoined) {
      newCollaborators = currentCollaborators.filter((id: string) => id !== user.id);
    } else {
      newCollaborators = [...currentCollaborators, user.id];
    }

    const updatedMetadata = { ...selectedIssue.metadata, collaborators: newCollaborators };
    setSelectedIssue({ ...selectedIssue, metadata: updatedMetadata });
    await supabase.from("issues").update({ metadata: updatedMetadata }).eq("id", selectedIssue.id);
    fetchIssues(); 
  };

  const handleQuickUpdate = async (field: 'status' | 'priority', value: string) => {
      if (!selectedIssue) return;
      let updates: any = { [field]: value };
      if (field === 'status' && value === 'Resolved') {
          updates.metadata = { ...selectedIssue.metadata, resolved_by: user.id };
      } else if (field === 'status' && value !== 'Resolved') {
          updates.metadata = { ...selectedIssue.metadata, resolved_by: null };
      }
      setSelectedIssue({ ...selectedIssue, ...updates });
      await supabase.from("issues").update(updates).eq("id", selectedIssue.id);
      fetchIssues();
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedIssue) return;
    await supabase.from("issue_comments").insert({ issue_id: selectedIssue.id, user_id: user.id, content: newComment });
    setNewComment("");
    fetchComments();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${projectId}/issues/img/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
    if (uploadError) {
        const { error: retryError } = await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: 10485760 });
        if (!retryError || retryError.message.includes("exists")) {
           await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
        }
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    setAttachments(prev => [...prev, publicUrl]);
    setUploading(false);
  };

  // --- UI HELPERS ---
  const getPriorityColor = (p: string) => {
    if (p === 'Urgent') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (p === 'High') return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };
  const getTypeIcon = (t: string) => {
      if (t === 'Bug') return <Bug size={12} className="text-red-400" />;
      if (t === 'Feature') return <Zap size={12} className="text-yellow-400" />;
      return <Hammer size={12} className="text-blue-400" />;
  }
  const hasWriteAccess = selectedIssue && (selectedIssue.user_id === user.id || selectedIssue.metadata?.collaborators?.includes(user.id));

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-white/20">Loading...</div>;

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; border-left: 1px solid #222; }
        ::-webkit-scrollbar-thumb { background: #333; border: 2px solid #0a0a0a; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      <Menu project={project} user={user} />
      
      <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a]">
        {/* HEADER */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold tracking-tight">{project?.name || "Project"}</h1>
             <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] uppercase font-bold tracking-wider rounded border border-white/5">Issues Board</span>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded transition-colors">
            <Plus size={16} /> New Issue
          </button>
        </div>

        {/* TOOLBAR & FILTERS */}
        <div className="flex-none px-6 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3 w-full">
                <div className="relative flex-1 max-w-md">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                   <input 
                      type="text" 
                      placeholder="Search issues..." 
                      className="w-full bg-[#161616] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-white/20 transition-all" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                   />
                </div>
                
                <button 
                    onClick={fetchIssues} 
                    className="p-2 bg-[#161616] border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all active:scale-95" 
                    title="Refresh Issues"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                </button>

                <div className="relative">
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${showFilters ? 'bg-white/10 border-white/20 text-white' : 'bg-[#161616] border-white/10 text-white/60 hover:text-white'}`}
                    >
                        <Filter size={16} /> Filters <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showFilters && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-20 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                             <div>
                                 <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">Type</label>
                                 <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-[#252526] border border-[#333] text-xs text-white rounded-md p-2 outline-none hover:border-[#555]">
                                     <option value="All">All Types</option>
                                     <option value="Bug">Bug</option>
                                     <option value="Feature">Feature</option>
                                     <option value="Improvement">Improvement</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">Priority</label>
                                 <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="w-full bg-[#252526] border border-[#333] text-xs text-white rounded-md p-2 outline-none hover:border-[#555]">
                                     <option value="All">All Priorities</option>
                                     <option value="Urgent">Urgent</option>
                                     <option value="High">High</option>
                                     <option value="Normal">Normal</option>
                                     <option value="Low">Low</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">Status</label>
                                 <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-[#252526] border border-[#333] text-xs text-white rounded-md p-2 outline-none hover:border-[#555]">
                                     <option value="All">All Statuses</option>
                                     <option value="Open">Open</option>
                                     <option value="In Progress">In Progress</option>
                                     <option value="Resolved">Resolved</option>
                                     <option value="Closed">Closed</option>
                                 </select>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- ISSUE TABLE HEADER (8 Columns) --- */}
        <div className="flex-none grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/30 bg-[#0a0a0a]">
            <div className="col-span-3">Issue Details</div>
            <div className="col-span-1">Team</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Urgency</div>
            <div className="col-span-2">Created At</div>
            <div className="col-span-2">Updated At</div>
            <div className="col-span-1">Creator</div>
            <div className="col-span-1 text-right">Solver</div>
        </div>

        {/* ISSUE LIST TABLE */}
        <div className="flex-1 overflow-y-auto">
            {filteredIssues.map(issue => (
                <div key={issue.id} onClick={() => openModal(issue)} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center hover:bg-[#111] transition-colors cursor-pointer group">
                    
                    {/* 1. Issue Details */}
                    <div className="col-span-3 pr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                           <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border border-white/10 bg-white/5 text-white/60">
                               {getTypeIcon(issue.type)} {issue.type}
                           </div>
                           <span className="font-medium text-sm text-gray-200 truncate">{issue.title}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                           {issue.metadata?.tags?.map((t: any, i) => (
                               <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white/80" style={{ backgroundColor: `${t.color}20`, color: t.color }}>{t.name}</span>
                           ))}
                        </div>
                    </div>

                    {/* 2. Team (Collaborators) */}
                    <div className="col-span-1">
                        <div className="flex -space-x-2 overflow-hidden items-center">
                            {issue.metadata?.collaborators?.slice(0, 3).map(uid => (
                                <div key={uid} title={userMap[uid]?.name || "User"} className="relative group/avatar">
                                    {userMap[uid]?.metadata?.avatar_url ? (
                                        <img 
                                            src={userMap[uid].metadata.avatar_url} 
                                            className="w-6 h-6 rounded-full border border-[#161616] hover:z-10 hover:scale-110 transition-transform "
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-[#333] border border-[#161616] flex items-center justify-center text-[10px] font-bold cursor-help hover:z-10">
                                            {userMap[uid]?.name?.[0] || "?"}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {issue.metadata?.collaborators && issue.metadata.collaborators.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-[#222] border border-[#161616] flex items-center justify-center text-[8px] font-bold text-white/60">
                                    +{issue.metadata.collaborators.length - 3}
                                </div>
                            )}
                            {(!issue.metadata?.collaborators || issue.metadata.collaborators.length === 0) && <span className="text-white/20 text-xs">-</span>}
                        </div>
                    </div>

                    {/* 3. Status */}
                    <div className="col-span-1">
                       <div className={`text-xs font-medium ${issue.status === 'Resolved' ? 'text-green-400' : 'text-white/70'}`}>
                          {issue.status}
                       </div>
                    </div>

                    {/* 4. Priority (Urgency - Full Text + Icon) */}
                    <div className="col-span-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${getPriorityColor(issue.priority)}`}>
                           {getPriorityIcon(issue.priority)} {issue.priority}
                        </span>
                    </div>

                    {/* 5. Created At */}
                    <div className="col-span-2 text-xs text-white/40">
                         {new Date(issue.created_at).toLocaleDateString()}
                    </div>

                    {/* 6. Updated At */}
                    <div className="col-span-2 text-xs text-white/40">
                         {new Date(issue.updated_at).toLocaleDateString()}
                    </div>

                    {/* 7. Creator */}
                    <div className="col-span-1 flex items-center justify-start">
                        {issue.creator?.metadata?.avatar_url ? (
                           <img src={issue.creator.metadata.avatar_url} className="w-6 h-6 rounded-full border border-white/10" title={issue.creator.name || 'Creator'} />
                        ) : (
                           <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold" title={issue.creator?.name || 'Creator'}>{issue.creator?.name?.[0]}</div>
                        )}
                    </div>

                    {/* 8. Solver */}
                    <div className="col-span-1 flex items-center justify-end">
                        {issue.status === 'Resolved' && issue.metadata?.resolved_by ? (
                            <>
                                <p className="text-green-700 text-xs mr-[10px] font-bold">SOLVER</p>
                                {userMap[issue.metadata.resolved_by]?.metadata?.avatar_url ? (
                                    <img src={userMap[issue.metadata.resolved_by].metadata.avatar_url} className="w-6 h-6 rounded-full border border-green-500/50" title={userMap[issue.metadata.resolved_by].name || 'Solver'} />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-green-900/20 border border-green-500/50 flex items-center justify-center text-green-500 text-xs font-bold" title={userMap[issue.metadata.resolved_by]?.name || 'Solver'}>
                                        <CheckCircle2 size={12} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <span className="text-white/30 text-xs">-</span>
                        )}
                    </div>
                </div>
            ))}
            {filteredIssues.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <Search size={32} className="mb-2 opacity-50"/>
                    <p>No issues found matching filters.</p>
                </div>
            )}
        </div>
      </main>

      {/* --- MODAL (Remaining sections omitted for brevity) --- */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#161616] w-full max-w-5xl h-[90vh] rounded-xl border border-[#333] shadow-2xl overflow-hidden flex flex-col">
                
                <div className="p-5 border-b border-[#222] flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono">
                        {isEditing ? (isNewIssue ? "new_issue.md" : "edit_mode") : `issue_${selectedIssue.id.slice(0,6)}.md`}
                    </h2>
                    <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                <div className="px-8 border-b border-[#222] flex items-center gap-8 bg-[#161616]">
                    <button onClick={() => setActiveTab('details')} className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#007acc] text-white' : 'border-transparent text-white/40 hover:text-white'}`}>Details</button>
                    {!isNewIssue && <button onClick={() => setActiveTab('comments')} className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'comments' ? 'border-[#007acc] text-white' : 'border-transparent text-white/40 hover:text-white'}`}>Discussion</button>}
                </div>

                <div className="flex-1 overflow-y-auto bg-[#1e1e1e] custom-scrollbar relative">
                    
                    {isEditing && activeTab === 'details' ? (
                         <div className="p-8 space-y-6 max-w-4xl mx-auto">
                             <div className="space-y-4">
                                 <input className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/20 pb-2 border-b border-[#333] font-sans" placeholder="Issue Title" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
                                 <div className="flex gap-3 flex-wrap">
                                     <select value={formType} onChange={e => setFormType(e.target.value)} className="bg-[#252526] border border-[#333] text-xs text-white rounded px-3 py-2 outline-none"><option value="Bug">Bug</option><option value="Feature">Feature</option><option value="Improvement">Improvement</option></select>
                                     <select value={formPriority} onChange={e => setFormPriority(e.target.value)} className="bg-[#252526] border border-[#333] text-xs text-white rounded px-3 py-2 outline-none"><option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option><option value="Urgent">Urgent</option></select>
                                     <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="bg-[#252526] border border-[#333] text-xs text-white rounded px-3 py-2 outline-none"><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-white/30 uppercase mb-1 block flex items-center gap-2"><Github size={12}/> Repo URL</label><input className="w-full bg-[#252526] border border-[#333] rounded p-2 text-xs text-white font-mono outline-none focus:border-[#007acc]" value={formGithubRepo} onChange={e => setFormGithubRepo(e.target.value)} /></div>
                                <div><label className="text-[10px] font-bold text-white/30 uppercase mb-1 block flex items-center gap-2"><GitBranch size={12}/> File Path</label><input className="w-full bg-[#252526] border border-[#333] rounded p-2 text-xs text-white font-mono outline-none focus:border-[#007acc]" value={formGithubPath} onChange={e => setFormGithubPath(e.target.value)} /></div>
                             </div>

                             <div><label className="text-xs font-bold text-white/40 uppercase mb-2 block">Description</label><textarea className="w-full bg-[#252526] border border-[#333] rounded-lg p-4 text-sm text-[#d4d4d4] min-h-[150px] outline-none focus:border-[#007acc] resize-y font-sans whitespace-pre-wrap" value={formContent} onChange={e => setFormContent(e.target.value)} /></div>
                             
                             <div className="rounded-lg border border-[#333] overflow-hidden">
                                 <VSCodeHeader title="CODE_SNIPPET" />
                                 <textarea className="w-full bg-[#1e1e1e] p-4 text-sm font-mono text-[#9cdcfe] min-h-[120px] outline-none resize-y border-none whitespace-pre" value={formCode} onChange={e => setFormCode(e.target.value)} />
                             </div>
                             
                             <div className="rounded-lg border border-[#333] overflow-hidden">
                                 <VSCodeHeader title="TERMINAL_OUTPUT" />
                                 <textarea className="w-full bg-[#1e1e1e] p-4 text-sm font-mono text-[#27c93f] min-h-[100px] outline-none resize-y border-none whitespace-pre" value={formTerminal} onChange={e => setFormTerminal(e.target.value)} />
                             </div>
                             
                             <div className="p-6 bg-[#252526] rounded-xl border border-[#333] space-y-4">
                                 <h3 className="text-xs font-bold text-white/40 uppercase">Tags</h3>
                                 <div>
                                    <div className="flex flex-wrap gap-2 mb-3">{formTags.map((tag, i) => (<span key={i} className="text-xs px-2 py-1 rounded font-medium text-white flex items-center gap-1" style={{ backgroundColor: tag.color }}>{tag.name} <button onClick={() => setFormTags(prev => prev.filter((_, idx) => idx !== i))}><X size={10}/></button></span>))}</div>
                                    
                                    {project?.metadata?.global_issue_tags && project.metadata.global_issue_tags.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Global Tags:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {project.metadata.global_issue_tags.map((gt: Tag, i: number) => (
                                                    <button key={i} onClick={() => setFormTags([...formTags, gt])} className="text-[10px] px-2 py-0.5 rounded border border-white/10 hover:opacity-80" style={{ backgroundColor: gt.color }}>{gt.name}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <input className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-xs text-white flex-1 outline-none" placeholder="New tag..." value={tagNameInput} onChange={e => setTagNameInput(e.target.value)} />
                                        <input type="color" className="w-8 h-8 rounded bg-transparent border-none" value={tagColorInput} onChange={e => setTagColorInput(e.target.value)} />
                                        <button onClick={() => handleAddTag(false)} className="px-3 bg-white/10 rounded text-xs">Add</button>
                                        <button onClick={() => handleAddTag(true)} className="px-3 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">Save Global</button>
                                    </div>
                                 </div>
                                 <div>
                                     <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-white/40 uppercase">Images</label><button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus size={10}/> Upload</button><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" /></div>
                                     <div className="grid grid-cols-3 gap-2">{attachments.map((url, i) => (<div key={i} className="relative group rounded overflow-hidden border border-white/10"><img src={url} className="w-full h-20 object-cover" /><button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 p-1 rounded text-white opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button></div>))}</div>
                                 </div>
                             </div>

                             <div className="flex gap-4 pt-4 pb-10">
                                 <button onClick={handleSaveIssue} className="flex-1 py-3 bg-[#007acc] hover:bg-[#0063a5] text-white font-bold rounded-lg flex items-center justify-center gap-2"><Save size={16} /> Save</button>
                                 {!isNewIssue && <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-[#333] hover:bg-[#444] text-white font-bold rounded-lg">Cancel</button>}
                             </div>
                         </div>
                    ) : !isEditing && activeTab === 'details' && selectedIssue ? (
                        // --- READ MODE ---
                        <div className="grid grid-cols-3 h-full">
                             <div className="col-span-2 p-8 space-y-8 overflow-y-auto pb-20">
                                 <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#333]">
                                     {selectedIssue.creator?.metadata?.avatar_url ? <img src={selectedIssue.creator.metadata.avatar_url} className="w-12 h-12 rounded-full border border-[#333]" /> : <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-bold text-lg">{selectedIssue.creator?.name?.[0]}</div>}
                                     <div>
                                         <div className="flex items-center gap-2">
                                            <span className="text-white font-bold text-lg">{selectedIssue.creator?.name} {selectedIssue.creator?.surname}</span>
                                            {selectedIssue.creator?.metadata?.role && (<span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] uppercase font-bold tracking-wide">{selectedIssue.creator.metadata.role}</span>)}
                                            <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-white/5 border border-white/10 text-white/80">{getTypeIcon(selectedIssue.type)} {selectedIssue.type}</div>
                                         </div>
                                         <div className="text-white/40 text-xs mt-1">{new Date(selectedIssue.created_at).toLocaleString()}</div>
                                     </div>
                                 </div>

                                 <h1 className="text-3xl font-bold text-white leading-tight font-sans">{selectedIssue.title}</h1>
                                 <MarkdownRenderer content={selectedIssue.content || ""} />
                                 
                                 {selectedIssue.metadata?.code_snippet && (<div className="mt-8"><VSCodeHeader title="CODE_SNIPPET" /><div className="bg-[#1e1e1e] border border-t-0 border-[#333] rounded-b-lg overflow-hidden"><pre className="p-4 overflow-x-auto font-mono text-sm text-[#9cdcfe] leading-relaxed whitespace-pre">{selectedIssue.metadata.code_snippet}</pre></div></div>)}
                                 {selectedIssue.metadata?.terminal_output && (<div className="mt-6"><VSCodeHeader title="TERMINAL" /><div className="bg-[#1e1e1e] border border-t-0 border-[#333] rounded-b-lg overflow-hidden"><pre className="p-4 overflow-x-auto font-mono text-sm text-[#27c93f] leading-relaxed whitespace-pre">{selectedIssue.metadata.terminal_output}</pre></div></div>)}
                                 {selectedIssue.metadata?.attachments && selectedIssue.metadata.attachments.length > 0 && (<div className="mt-6 grid grid-cols-2 gap-4">{selectedIssue.metadata.attachments.map((url, i) => (<a key={i} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-[#333] hover:border-white/30"><img src={url} className="w-full h-auto object-cover" /></a>))}</div>)}

                                 <div className="h-px bg-[#333] w-full my-8"></div>
                                 <div className="flex gap-3"><button onClick={() => { setIsEditing(true); setFormTitle(selectedIssue.title); }} className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white font-bold rounded flex items-center gap-2 text-xs uppercase"><Edit size={14} /> Modify</button><button onClick={handleDeleteIssue} className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold rounded flex items-center gap-2 text-xs uppercase"><Trash2 size={14} /> Delete</button></div>
                             </div>

                             {/* Right Sidebar */}
                             <div className="col-span-1 border-l border-[#333] bg-[#1a1a1a] p-6 space-y-6 overflow-y-auto">
                                 {selectedIssue.metadata?.github_repo && (<div className="bg-[#252526] p-4 rounded-lg border border-[#333]"><div className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase mb-3"><Github size={14} /> Linked Code</div><a href={`${selectedIssue.metadata.github_repo}/blob/main/${selectedIssue.metadata.github_path || ''}`} target="_blank" className="w-full py-2 bg-[#333] hover:bg-[#444] text-white text-xs font-bold rounded flex items-center justify-center gap-2">View on GitHub <ExternalLink size={12}/></a></div>)}
                                 
                                 <div className="space-y-4">
                                     <div><label className="text-[10px] font-bold text-white/30 uppercase mb-1 block">Status</label>{hasWriteAccess ? (<select value={selectedIssue.status} onChange={(e) => handleQuickUpdate('status', e.target.value)} className="w-full bg-[#252526] border border-[#333] text-xs text-white rounded p-2 outline-none"><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select>) : (<div className="px-3 py-2 bg-[#252526] border border-[#333] rounded text-xs text-white/70">{selectedIssue.status}</div>)}</div>
                                     <div><label className="text-[10px] font-bold text-white/30 uppercase mb-1 block">Priority</label>{hasWriteAccess ? (<select value={selectedIssue.priority} onChange={(e) => handleQuickUpdate('priority', e.target.value)} className="w-full bg-[#252526] border border-[#333] text-xs text-white rounded p-2 outline-none"><option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option><option value="Urgent">Urgent</option></select>) : (<div className={`px-3 py-2 rounded border text-xs font-bold ${getPriorityColor(selectedIssue.priority)}`}>{selectedIssue.priority}</div>)}</div>
                                 </div>
                                 
                                 <div>
                                     <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-bold text-white/30 uppercase flex items-center gap-2"><Users size={12}/> Collaborators</label><button onClick={handleJoinIssue} className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${selectedIssue.metadata?.collaborators?.includes(user.id) ? 'bg-red-900/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>{selectedIssue.metadata?.collaborators?.includes(user.id) ? <><UserMinus size={10}/> Leave</> : <><UserPlus size={10}/> Join</>}</button></div>
                                     <div className="flex flex-wrap gap-2">
                                         {selectedIssue.metadata?.collaborators?.map(uid => (
                                             <div key={uid} className="relative group" title={userMap[uid]?.name || "User"}>
                                                 {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-8 h-8 rounded-full border border-[#333]" /> : <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs font-bold border border-[#444]">{userMap[uid]?.name?.[0] || "?"}</div>}
                                             </div>
                                         ))}
                                         {(!selectedIssue.metadata?.collaborators || selectedIssue.metadata.collaborators.length === 0) && (<span className="text-xs text-white/20 italic">No collaborators joined yet.</span>)}
                                     </div>
                                 </div>
                                 <div className="flex flex-wrap gap-2 pt-4 border-t border-[#333]">{(selectedIssue.metadata?.tags || []).map((t: any, i) => (<span key={i} className="text-[10px] px-2 py-0.5 rounded font-bold text-white/80" style={{ backgroundColor: typeof t === 'string' ? '#6366f1' : t.color }}>{typeof t === 'string' ? t : t.name}</span>))}</div>
                             </div>
                        </div>
                    ) : (
                        // --- COMMENTS TAB ---
                        <div className="flex flex-col h-full">
                            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                {comments.map(c => (<div key={c.id} className="flex gap-4 group">{c.user.metadata?.avatar_url ? <img src={c.user.metadata.avatar_url} className="w-8 h-8 rounded-full border border-[#333]" /> : <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center font-bold">{c.user.name?.[0]}</div>}<div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-bold text-white text-xs">{c.user.name}</span><span className="text-[10px] text-white/30">{new Date(c.created_at).toLocaleString()}</span></div><div className="text-sm text-[#cccccc] whitespace-pre-wrap leading-relaxed">{c.content}</div></div></div>))}
                            </div>
                            <div className="p-6 border-t border-[#333] bg-[#1a1a1a]"><div className="flex gap-4"><textarea className="flex-1 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 text-sm text-white outline-none focus:border-[#007acc] resize-none" rows={2} placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} /><button onClick={handlePostComment} className="h-12 w-12 bg-[#007acc] hover:bg-[#0063a5] text-white rounded-lg flex items-center justify-center"><Send size={18}/></button></div></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}