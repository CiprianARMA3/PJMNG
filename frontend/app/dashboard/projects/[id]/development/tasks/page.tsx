"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

import { 
  Search, Plus, X, 
  CheckCircle2, Clock, AlertTriangle, 
  FileCode, Terminal, 
  Send, Trash2, Edit, Save, 
  Bug, Zap, Hammer, Github, 
  GitBranch, Users, UserPlus, UserMinus, ExternalLink,
  RefreshCw, Filter, ChevronDown, // Existing imports
  ChevronUp, Minus,
  Disc, XCircle // Added imports for visual urgency
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
      <FileCode size={10} className="text-[#9200cc]"/> {title}
    </span>
  </div>
);

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return <span className="text-white/20 italic">No description provided.</span>;
  
  const parts = content.split(/(`{3}[\s\S]*?`{3})/g); 

  return (
    <div className="text-sm text-[#d4d4d4] leading-relaxed space-y-2 font-light">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // Extract language (e.g. ```javascript) and code
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const language = match ? match[1] || 'text' : 'text';
          const code = match ? match[2] : part.slice(3, -3);

          return <CodeBlock key={index} language={language} code={code.trim()} />;
        }
        
        // Render regular text (headings, lists, paragraphs)
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

// --- NEW UI HELPER: STATUS CONFIG ---
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Open':
      return { 
        icon: <Disc size={14} />, 
        color: 'text-red-400', 
        bg: 'bg-red-500/10 border-red-500/20',
        label: 'Open'
      };
    case 'In Progress':
      return { 
        icon: <Clock size={14} />, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/10 border-yellow-500/20',
        label: 'In Progress'
      };
    case 'Resolved':
      return { 
        icon: <CheckCircle2 size={14} />, 
        color: 'text-green-400', 
        bg: 'bg-green-500/10 border-green-500/20',
        label: 'Resolved'
      };
    case 'Closed':
      return { 
        icon: <XCircle size={14} />, 
        color: 'text-gray-400', 
        bg: 'bg-white/5 border-white/10',
        label: 'Closed'
      };
    default:
      return { 
        icon: <Disc size={14} />, 
        color: 'text-white/40', 
        bg: 'bg-white/5 border-white/10',
        label: status
      };
  }
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
          background: '#1e1e1e', // Matches your modal bg
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



export default function IssuesPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { checkAccess, loading: authLoading } = useProjectPermissions(projectId);

  if (!authLoading && !checkAccess('tasks')) {
    router.push(`/dashboard/projects/${projectId}`);
    return null;
  }
  if (authLoading) return null;

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
      // 1. Get Auth User
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { 
        router.push("/auth/login"); 
        return; 
      }

      // 2. Fetch User Profile (To get correct Name/Avatar)
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
      const { data: proj } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
        
      setProject(proj);
      
      // 5. Fetch Tasks/Issues (Keep your existing function)
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

// ... inside IssuesPage component

  // --- UPDATED FETCH COMMENTS LOGIC ---
  const fetchComments = async () => {
    // Don't fetch if it's a new issue or no issue is selected
    if (!selectedIssue || selectedIssue.id === 'new') {
        setComments([]);
        return;
    }

    const { data } = await supabase
      .from("issue_comments")
      .select(`*, user:users ( id, name, surname, metadata )`)
      .eq("issue_id", selectedIssue.id) // Strictly match current issue ID
      .order("created_at", { ascending: true });
    
    if (data) {
        setComments(data as any);
    } else {
        setComments([]);
    }
  };

  // --- UPDATED USE EFFECT ---
  // Run this whenever the selectedIssue ID changes. 
  // We removed 'activeTab' dependency because the new UI shows comments by default.
  useEffect(() => {
    if (selectedIssue && !isNewIssue) {
        fetchComments();
    } else {
        setComments([]);
    }
  }, [selectedIssue?.id]); // Only re-run if the ID changes

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
    setComments([]);
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
             {/* <h1 className="text-lg font-bold tracking-tight">{project?.name || "Project"}</h1>
             <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] uppercase font-bold tracking-wider rounded border border-white/5">Issues Board</span> */}
            <h1 className="text-xl font-bold tracking-tight">Tasks <span className="text-white/30 text-lg font-light">Panel</span></h1>

          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded transition-colors">
            <Plus size={16} /> New Post
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
            {filteredIssues.map(issue => {
                const statusConfig = getStatusConfig(issue.status);
                const isResolved = issue.status === 'Resolved';

                return (
                    <div 
                        key={issue.id} 
                        onClick={() => openModal(issue)} 
                        // CONDITIONAL CLASSES:
                        // If resolved: lower opacity, grayscale, and slightly different hover behavior
                        className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center transition-all cursor-pointer group relative
                            ${isResolved 
                                ? 'opacity-60 hover:opacity-80 grayscale-[0.3] bg-black/40' 
                                : 'hover:bg-[#111]'
                            }
                        `}
                        // CONDITIONAL STYLE:
                        // Adds the diagonal stripes only if resolved
                        style={isResolved ? {
                            backgroundImage: `repeating-linear-gradient(
                                45deg,
                                rgba(255, 255, 255, 0.03) 0px,
                                rgba(255, 255, 255, 0.03) 10px,
                                transparent 10px,
                                transparent 20px
                            )`
                        } : {}}
                    >
                        
                        {/* 1. Issue Details */}
                        <div className="col-span-3 pr-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border border-white/10 bg-white/5 text-white/60">
                                  {getTypeIcon(issue.type)} {issue.type}
                              </div>
                              {/* Strikethrough title if resolved */}
                              <span className={`font-medium text-sm truncate transition-colors ${isResolved ? 'text-white/40 line-through decoration-white/20' : 'text-gray-200'}`}>
                                  {issue.title}
                              </span>
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

                        {/* 3. Status (UPDATED) */}
                        <div className="col-span-1">
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${statusConfig.color}`}>
                              {statusConfig.icon}
                              <span>{statusConfig.label}</span>
                          </div>
                        </div>

                        {/* 4. Priority */}
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
                );
            })}
            {filteredIssues.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <Search size={32} className="mb-2 opacity-50"/>
                    <p>No issues found matching filters.</p>
                </div>
            )}
        </div>
      </main>

      {/* --- MODAL (Remaining sections omitted for brevity) --- */}
{/* --- MODAL --- */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            {/* Main Modal Container */}
            <div 
                className="bg-[#1e1e1e] w-full max-w-6xl h-[90vh] rounded-xl border border-[#333] shadow-2xl flex flex-col overflow-hidden text-[#e1e1e1]"
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* 1. TOP BAR (Breadcrumbs & Actions) */}
                <div className="flex-none h-14 px-6 border-b border-[#333] flex items-center justify-between bg-[#1e1e1e]">
                    <div className="flex items-center gap-2 text-sm text-white/40">
                        <span className="hover:text-white cursor-pointer transition-colors">{project?.name || "Project"}</span>
                        <span>/</span>
                        <span className="font-mono text-white/60">
                            {isNewIssue ? "New Issue" : `ISS-${selectedIssue.id.substring(0,4).toUpperCase()}`}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {!isNewIssue && !isEditing && (
                            <button onClick={() => { setIsEditing(true); setFormTitle(selectedIssue.title); }} className="p-2 hover:bg-[#333] rounded text-white/60 hover:text-white transition-colors" title="Edit">
                                <Edit size={16}/>
                            </button>
                        )}
                         {!isNewIssue && (
                            <button onClick={handleDeleteIssue} className="p-2 hover:bg-red-500/20 rounded text-white/60 hover:text-red-400 transition-colors" title="Delete">
                                <Trash2 size={16}/>
                            </button>
                        )}
                        <div className="h-4 w-px bg-[#333] mx-1"></div>
                        <button onClick={closeModal} className="p-2 hover:bg-[#333] rounded text-white/60 hover:text-white transition-colors">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* 2. MODAL BODY (Scrollable Grid) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-12 min-h-full">
                        
                        {/* --- LEFT COLUMN: CONTENT (8/12) --- */}
                        <div className="col-span-12 lg:col-span-8 p-8 lg:p-10 border-r border-[#333]/50">
                            
                            {/* Title Input/Display */}
                            <div className="mb-8">
                                {isEditing ? (
                                    <textarea
                                        className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/20 resize-none overflow-hidden leading-tight"
                                        placeholder="Give this issue a concise title..."
                                        rows={Math.max(1, Math.ceil(formTitle.length / 40))}
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                        style={{ minHeight: '3rem' }}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold text-white leading-tight">{selectedIssue.title}</h1>
                                )}
                            </div>

                            {/* Description Section */}
                            <div className="mb-8 group">
                                <h3 className="text-xs font-bold text-white/40 uppercase mb-3 flex items-center gap-2">
                                    <FileCode size={14}/> Description
                                </h3>
                                
{isEditing ? (
                                    <div className="space-y-4">
                                        <textarea 
                                            className="w-full bg-[#161616] border border-[#333] rounded-lg p-4 text-sm text-[#d4d4d4] min-h-[200px] outline-none focus:border-[#9200cc] resize-y font-sans leading-relaxed" 
                                            placeholder="Add a detailed description..."
                                            value={formContent} 
                                            onChange={e => setFormContent(e.target.value)} 
                                        />
                                        
                                        {/* Code Snippet Input */}
                                        <div className="rounded-lg border border-[#333] overflow-hidden bg-[#161616]">
                                            <div className="bg-[#252526] px-3 py-1.5 border-b border-[#333] text-[10px] font-bold text-white/40">CODE SNIPPET</div>
                                            <textarea 
                                                className="w-full bg-transparent p-4 text-sm font-mono text-[#9cdcfe] min-h-[100px] outline-none resize-y border-none" 
                                                placeholder="Paste relevant code here..."
                                                value={formCode} 
                                                onChange={e => setFormCode(e.target.value)} 
                                            />
                                        </div>

                                        {/* Terminal Output Input */}
                                        <div className="rounded-lg border border-[#333] overflow-hidden bg-[#161616]">
                                            <div className="bg-[#252526] px-3 py-1.5 border-b border-[#333] text-[10px] font-bold text-white/40">TERMINAL OUTPUT</div>
                                            <textarea 
                                                className="w-full bg-transparent p-4 text-sm font-mono text-[#27c93f] min-h-[80px] outline-none resize-y border-none" 
                                                placeholder="Paste error logs or terminal output..."
                                                value={formTerminal} 
                                                onChange={e => setFormTerminal(e.target.value)} 
                                            />
                                        </div>

                                        {/* Attachment Input */}
                                        <div>
                                             <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-white/40 uppercase">Attachments</label>
                                                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-[#333] px-2 py-1 rounded text-white hover:bg-[#444] transition-colors flex items-center gap-1">
                                                    <Plus size={10}/> Add
                                                </button>
                                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
                                             </div>
                                             {attachments.length > 0 && (
                                                <div className="flex gap-3 overflow-x-auto pb-2">
                                                    {attachments.map((url, i) => (
                                                        <div key={i} className="relative group/img flex-none w-24 h-24 rounded overflow-hidden border border-[#333]">
                                                            <img src={url} className="w-full h-full object-cover" />
                                                            <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 p-1 rounded text-white opacity-0 group-hover/img:opacity-100 hover:bg-red-500"><Trash2 size={10} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                             )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm">
                                        <MarkdownRenderer content={selectedIssue.content || ""} />
                                        
                                        {/* Syntax Highlighted Code Snippet */}
                                        {selectedIssue.metadata?.code_snippet && (
                                            <CodeBlock language="javascript" code={selectedIssue.metadata.code_snippet} />
                                        )}

                                        {/* Terminal Output (Custom Green Style) */}
                                        {selectedIssue.metadata?.terminal_output && (
                                            <div className="mt-4 border border-[#333] rounded-lg overflow-hidden shadow-xl">
                                                <VSCodeHeader title="TERMINAL" />
                                                <div className="bg-[#1e1e1e] p-4 overflow-x-auto font-mono text-sm text-[#27c93f]">
                                                    <pre className="whitespace-pre">{selectedIssue.metadata.terminal_output}</pre>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Read-Only Attachments */}
                                        {selectedIssue.metadata?.attachments && selectedIssue.metadata.attachments.length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="text-[10px] font-bold text-white/40 uppercase mb-2">Attachments</h4>
                                                <div className="flex flex-wrap gap-4">
                                                    {selectedIssue.metadata.attachments.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-48 h-32 rounded-lg overflow-hidden border border-[#333] hover:border-white/30 transition-colors bg-black">
                                                            <img src={url} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer (Edit Mode) */}
                            {isEditing && (
                                <div className="flex gap-3 pt-6 border-t border-[#333]">
                                    <button onClick={handleSaveIssue} className="px-6 py-2 bg-[#9200cc] hover:bg-[#7a00ac] text-white text-sm font-bold rounded-md shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2">
                                        <Save size={14} /> Save Changes
                                    </button>
                                    <button onClick={() => { setIsEditing(false); if(isNewIssue) closeModal(); }} className="px-4 py-2 hover:bg-[#333] text-white/70 text-sm font-medium rounded-md transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {/* ACTIVITY / COMMENTS (Only in View Mode) */}
{/* ACTIVITY / COMMENTS STREAM */}
{!isEditing && !isNewIssue && (
    <div className="mt-12 pt-10 border-t border-[#333]">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            Activity
            <span className="px-2 py-0.5 bg-[#333] text-xs rounded-full text-white/60">{comments.length}</span>
        </h3>
        
        {/* Comment Input Area */}
        <div className="flex gap-4 mb-8">
            {/* CURRENT USER AVATAR */}
            <div className="w-8 h-8 rounded-full flex-none flex items-center justify-center overflow-hidden bg-[#9200cc] border border-[#333] text-xs font-bold text-white relative">
                {(user?.user_metadata?.avatar_url || user?.metadata?.avatar_url) ? (
                    <img 
                        src={user.user_metadata?.avatar_url || user.metadata?.avatar_url} 
                        alt="Me" 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    <span>{user?.email?.[0].toUpperCase()}</span>
                )}
            </div>

            <div className="flex-1">
                <textarea 
                    className="w-full bg-[#161616] border border-[#333] rounded-md p-3 text-sm text-white outline-none focus:border-[#9200cc] resize-none transition-all placeholder:text-white/20" 
                    rows={2} 
                    placeholder="Add a comment..." 
                    value={newComment} 
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostComment();
                        }
                    }}
                />
                <div className="flex justify-end mt-2">
                        <button onClick={handlePostComment} disabled={!newComment.trim()} className="px-3 py-1.5 bg-[#333] hover:bg-[#444] disabled:opacity-50 text-white text-xs font-bold rounded transition-colors">
                        Comment
                        </button>
                </div>
            </div>
        </div>

        {/* Comment Timeline */}
        <div className="space-y-6">
            {comments.map(c => (
                <div key={c.id} className="flex gap-4 group animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-none">
                        {/* COMMENTER AVATAR */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-[#252526] border border-[#333] relative">
                            {c.user.metadata?.avatar_url ? (
                                <img 
                                    src={c.user.metadata.avatar_url} 
                                    className="w-full h-full object-cover" 
                                    alt={c.user.name || "User"}
                                />
                            ) : (
                                <span className="text-xs font-bold text-white/40">
                                    {c.user.name?.[0] || "?"}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-white/90">
                                {c.user.name || "Unknown User"} {c.user.surname}
                            </span>
                            <span className="text-[10px] text-white/30">
                                {new Date(c.created_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="text-sm text-[#cccccc] leading-relaxed whitespace-pre-wrap">
                            {c.content}
                        </div>
                    </div>
                </div>
            ))}
            
            {comments.length === 0 && (
                <div className="text-center py-8 text-white/20 italic text-sm">
                    No activity yet. Be the first to comment.
                </div>
            )}
        </div>
    </div>
)}

                        </div>

                        {/* --- RIGHT COLUMN: SIDEBAR METADATA (4/12) --- */}
                        <div className="col-span-12 lg:col-span-4 bg-[#181818] p-8 space-y-8 border-l border-[#333]/50 h-full overflow-y-auto">
                            
                            {/* Status Section */}
                            <div>
                                <label className="text-[10px] font-bold text-white/30 uppercase mb-2 block">Status</label>
                                {isEditing || hasWriteAccess ? (
                                    <div className="relative">
                                        <select 
                                            value={isEditing ? formStatus : selectedIssue.status} 
                                            onChange={(e) => isEditing ? setFormStatus(e.target.value) : handleQuickUpdate('status', e.target.value)} 
                                            className="w-full appearance-none bg-[#252526] border border-[#333] hover:border-[#555] text-xs text-white font-bold rounded px-3 py-2.5 outline-none transition-colors cursor-pointer"
                                        >
                                            <option value="Open">Open</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className={`px-3 py-2 bg-[#252526] border border-[#333] rounded text-xs text-white font-bold flex items-center gap-2`}>
                                         {getStatusConfig(selectedIssue.status).icon} {selectedIssue.status}
                                    </div>
                                )}
                            </div>

                            {/* Details Group */}
                            <div className="space-y-4 p-4 rounded-lg border border-[#333] bg-[#1e1e1e]">
                                
                                {/* Assignees */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase mb-2 flex items-center gap-2"><Users size={12}/> Assignees</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                         {/* Existing Collaborators */}
                                         {(isEditing ? (selectedIssue?.metadata?.collaborators || []) : (selectedIssue.metadata?.collaborators || [])).map(uid => (
                                             <div key={uid} className="flex items-center gap-2 bg-[#252526] pr-2 rounded-full border border-[#333]">
                                                 {userMap[uid]?.metadata?.avatar_url ? 
                                                    <img src={userMap[uid].metadata.avatar_url} className="w-6 h-6 rounded-full" /> : 
                                                    <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-[10px] font-bold">{userMap[uid]?.name?.[0]}</div>
                                                 }
                                                 <span className="text-xs">{userMap[uid]?.name}</span>
                                             </div>
                                         ))}
                                         
                                         {/* Add Self Button */}
                                         {!isNewIssue && !isEditing && (
                                            <button 
                                                onClick={handleJoinIssue} 
                                                className={`h-6 px-2 rounded-full border text-[10px] font-bold flex items-center gap-1 transition-all
                                                ${(selectedIssue.metadata?.collaborators?.includes(user.id)) 
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                                                    : 'bg-[#333] border-[#444] text-white/60 hover:text-white hover:bg-[#444]'}`}
                                            >
                                                {(selectedIssue.metadata?.collaborators?.includes(user.id)) ? "Leave" : "+ Assign me"}
                                            </button>
                                         )}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase mb-2 block">Priority</label>
                                    {isEditing || hasWriteAccess ? (
                                        <div className="relative">
                                            <select 
                                                value={isEditing ? formPriority : selectedIssue.priority} 
                                                onChange={(e) => isEditing ? setFormPriority(e.target.value) : handleQuickUpdate('priority', e.target.value)}
                                                className="w-full appearance-none bg-[#252526] border border-[#333] hover:border-[#555] text-xs text-white font-bold rounded px-3 py-2 outline-none transition-colors cursor-pointer"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Normal">Normal</option>
                                                <option value="High">High</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className={`px-3 py-2 rounded border text-xs font-bold inline-flex items-center gap-2 ${getPriorityColor(selectedIssue.priority)}`}>
                                            {getPriorityIcon(selectedIssue.priority)} {selectedIssue.priority}
                                        </div>
                                    )}
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase mb-2 block">Type</label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <select 
                                                value={formType} 
                                                onChange={(e) => setFormType(e.target.value)}
                                                className="w-full appearance-none bg-[#252526] border border-[#333] hover:border-[#555] text-xs text-white font-bold rounded px-3 py-2 outline-none transition-colors cursor-pointer"
                                            >
                                                <option value="Bug">Bug</option>
                                                <option value="Feature">Feature</option>
                                                <option value="Improvement">Improvement</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                                            {getTypeIcon(selectedIssue.type)} {selectedIssue.type}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="p-4 rounded-lg border border-[#333] bg-[#1e1e1e]">
                                <label className="text-[10px] font-bold text-white/30 uppercase mb-3 flex justify-between">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(isEditing ? formTags : (selectedIssue.metadata?.tags || [])).map((tag, i) => (
                                        <span key={i} className="text-[10px] px-2 py-1 rounded font-bold text-white flex items-center gap-1 border border-white/5 shadow-sm" style={{ backgroundColor: typeof tag === 'string' ? '#6366f1' : tag.color }}>
                                            {typeof tag === 'string' ? tag : tag.name} 
                                            {isEditing && <button onClick={() => setFormTags(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-black/50"><X size={10}/></button>}
                                        </span>
                                    ))}
                                    {(isEditing ? formTags : (selectedIssue.metadata?.tags || [])).length === 0 && <span className="text-white/20 text-xs italic">None</span>}
                                </div>
                                
                                {isEditing && (
                                    <div className="flex gap-2 mt-2">
                                        <input className="bg-[#161616] border border-[#333] rounded px-2 py-1 text-xs text-white flex-1 outline-none focus:border-[#555]" placeholder="Add tag..." value={tagNameInput} onChange={e => setTagNameInput(e.target.value)} />
                                        <input type="color" className="w-6 h-6 rounded bg-transparent border-none cursor-pointer" value={tagColorInput} onChange={e => setTagColorInput(e.target.value)} />
                                        <button onClick={() => handleAddTag(false)} className="px-2 bg-[#333] hover:bg-[#444] rounded text-xs text-white"><Plus size={12}/></button>
                                    </div>
                                )}
                            </div>

                            {/* Development / Meta */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase mb-2 block">Development</label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <input className="w-full bg-[#1e1e1e] border border-[#333] rounded px-3 py-2 text-xs text-white font-mono placeholder:text-white/20 outline-none focus:border-[#9200cc]" placeholder="github_repo_url" value={formGithubRepo} onChange={e => setFormGithubRepo(e.target.value)} />
                                            <input className="w-full bg-[#1e1e1e] border border-[#333] rounded px-3 py-2 text-xs text-white font-mono placeholder:text-white/20 outline-none focus:border-[#9200cc]" placeholder="file/path/to/code.js" value={formGithubPath} onChange={e => setFormGithubPath(e.target.value)} />
                                        </div>
                                    ) : (
                                        selectedIssue.metadata?.github_repo ? (
                                            <a href={`${selectedIssue.metadata.github_repo}/blob/main/${selectedIssue.metadata.github_path || ''}`} target="_blank" className="flex items-center gap-2 text-xs text-[#9200cc] hover:underline cursor-pointer">
                                                <Github size={12}/> Open in GitHub <ExternalLink size={10}/>
                                            </a>
                                        ) : <span className="text-xs text-white/20 italic">No repo linked.</span>
                                    )}
                                </div>

                                {!isNewIssue && (
                                    <div className="pt-4 border-t border-[#333] text-[10px] text-white/30 space-y-1">
                                        <p>Created {new Date(selectedIssue.created_at).toLocaleString()}</p>
                                        <p>Updated {new Date(selectedIssue.updated_at).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}