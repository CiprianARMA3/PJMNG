"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Menu from "../../components/menu"; 
import { generateAiResponse, createChatGroup, deleteChatGroup, updateChatGroup, deleteChat } from "./actions"; 
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Zap,
  Cpu,
  MessageSquare,
  Plus,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
  Check
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Data Types
type Profile = { id: string; full_name: string; avatar_url: string | null };
type ChatGroup = { id: string; name: string; user_id: string; }
type ChatSession = { id: string; title: string; group_id: string | null; total_tokens_used: number; updated_at: string; user_id: string; };
type Message = { role: 'user' | 'ai'; content: string; cost?: number; };

const MODELS = [
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", icon: Sparkles },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", icon: Zap },
];

// --- REUSABLE CREATOR PFP COMPONENT ---
interface CreatorPfpProps {
    userId: string;
    currentUserId: string;
    currentUserPfp: string;
    currentUserName: string;
    profiles: Record<string, Profile>;
    size?: string;
}

const CreatorPfp: React.FC<CreatorPfpProps> = ({ 
    userId, 
    currentUserId, 
    currentUserPfp, 
    currentUserName, 
    profiles, 
    size = 'w-5 h-5'
}) => {
    const isCurrentUser = userId === currentUserId;
    const profile = isCurrentUser ? { full_name: currentUserName, avatar_url: currentUserPfp } : profiles[userId];
    const defaultPfp = "/default-avatar.png";
    const pfpUrl = profile?.avatar_url || defaultPfp;
    const name = profile?.full_name || "Unknown User";

    return (
        <div className="relative group/pfp inline-block cursor-pointer flex-shrink-0 pr-2">
            <img 
                src={pfpUrl} 
                alt={name} 
                className={`${size} rounded-full object-cover border border-white/10`} 
            />
            {/* Hover tooltip for name */}
            <span className="absolute left-1/2 bottom-full mb-2 px-2 py-1 bg-[#1a1a1a] text-xs text-white rounded-md shadow-lg opacity-0 group-hover/pfp:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap -translate-x-1/2">
                {name}
            </span>
        </div>
    );
};
// ----------------------------------------


export default function AiAssistantPage({ params }: PageProps) {
  const supabase = createClient();

  // Core
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [balance, setBalance] = useState(0);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  
  // UI
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  // Groups UI
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- HELPER: CALCULATE GROUP TOTAL (Used for sidebar rendering) ---
  const getGroupTotal = (groupId: string | null): string => {
      const total = chats
          .filter(c => c.group_id === groupId)
          .reduce((sum, chat) => sum + (chat.total_tokens_used || 0), 0);
      return total.toLocaleString();
  };

  // --- HELPER: FETCH PROFILES (FIX 2: Defined before useEffect) ---
  async function fetchProfiles(userIds: string[]) {
      if (userIds.length === 0) return;
      // Assuming a 'profiles' table exists and links to auth.users
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      if (data) {
          const profileMap: Record<string, Profile> = {};
          data.forEach(p => { profileMap[p.id] = p as Profile; });
          setProfiles(prev => ({...prev, ...profileMap}));
      }
  }

  // --- HELPER: FETCH BALANCE (FIX 1: Defined before useEffect) ---
  async function fetchBalance(pid: string) {
      const { data: tokenPack } = await supabase
        .from("token_packs").select("remaining_tokens").eq("project_id", pid)
        .gt("expires_at", new Date().toISOString()).order("purchased_at", { ascending: false }).limit(1).single();
      
      if (tokenPack?.remaining_tokens) {
        let rt = tokenPack.remaining_tokens as any;
        if (typeof rt === 'string') { try { rt = JSON.parse(rt); } catch(e) {} }
        const total = (rt.gpt || 0) + (rt.claude || 0) + (rt.custom || 0);
        setBalance(total);
      }
  }

  // --- INITIAL LOAD ---
  useEffect(() => {
    async function load() {
      const { id } = await params;
      setProjectId(id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }
      setUser(user);
      const currentUserId = user.id;

      const { data: projectData } = await supabase.from("projects").select("*").eq("id", id).single();
      setProject(projectData);

      fetchBalance(id);

      // Fetch groups and chats
      const { data: groupsData } = await supabase.from("ai_chat_groups").select("*").eq("project_id", id).order("created_at", { ascending: true });
      const { data: chatsData } = await supabase.from("ai_chats").select("*, user_id").eq("project_id", id).order("updated_at", { ascending: false });
        
      if (groupsData) {
          setGroups(groupsData as ChatGroup[]);
          const expandState: any = {};
          groupsData.forEach(g => expandState[g.id] = true);
          setExpandedGroups(expandState);
      }
      if (chatsData) setChats(chatsData as ChatSession[]);
      
      // Collect unique user IDs to fetch profiles
      const userIdsToFetch = [
          ...(groupsData || []).map(g => g.user_id),
          ...(chatsData || []).map(c => c.user_id)
      ];
      const uniqueUserIds = [...new Set(userIdsToFetch)].filter(uid => uid !== currentUserId);
      await fetchProfiles(uniqueUserIds);

      setLoading(false);
    }
    load();
  }, []);

  // --- MESSAGES LOAD ---
  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    async function loadMessages() {
        const { data: msgs } = await supabase.from("ai_messages").select("*").eq("chat_id", activeChatId).order("created_at", { ascending: true });
        if (msgs) {
            setMessages(msgs.map(m => ({ role: m.role as 'user' | 'ai', content: m.content, cost: m.tokens_used })));
        }
    }
    loadMessages();
  }, [activeChatId]);

  // --- EFFECTS ---
  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);
  
  // --- DRAG AND DROP HANDLER ---
  const handleDrop = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault();
    setDraggingId(null);
    const chatId = e.dataTransfer.getData("text/plain");
    if (!chatId) return;

    setChats(prev => {
        const updated = prev.map(c => 
            c.id === chatId 
            ? { ...c, group_id: targetGroupId, updated_at: new Date().toISOString() } 
            : c
        );
        return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    });
    updateChatGroup(chatId, targetGroupId);
  };
  
  // --- ACTIONS ---
  const handleCreateGroup = async () => {
      if (!newGroupName.trim()) return;
      const res = await createChatGroup(projectId, newGroupName);
      if (res.success && res.group) {
          setGroups([...groups, res.group as ChatGroup]);
          setExpandedGroups({...expandedGroups, [res.group.id]: true});
          setNewGroupName("");
          setShowGroupInput(false);
      }
  };

  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Are you sure you want to delete this group? All chats will be moved to 'Uncategorized'.")) return;
      const res = await deleteChatGroup(groupId);
      if (res.success) {
          setGroups(groups.filter(g => g.id !== groupId));
          setChats(chats.map(c => c.group_id === groupId ? { ...c, group_id: null } : c));
      }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm("Are you sure you want to delete this chat session permanently?")) return;
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
    }
    await deleteChat(chatId);
  };

  const handleNewChat = (groupId: string | null = null) => {
    setActiveChatId(null);
    setSelectedGroupId(groupId);
    setMessages([]);
    setInput("");
  };

  async function handleSend() {
    if (!input.trim() || isGenerating || balance <= 0) return;
    const currentPrompt = input;
    setInput("");
    setIsGenerating(true);

    setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);

    const result = await generateAiResponse(projectId, currentPrompt, activeChatId || undefined, selectedGroupId || undefined, selectedModel.id);

    if (result.error) {
        alert(result.error);
        setIsGenerating(false);
        return;
    }

    if (result.success) {
        setMessages(prev => [...prev, { role: 'ai', content: result.message!, cost: result.tokensUsed }]);
        setBalance(result.newBalance!);

        if (!activeChatId && result.chatId) {
            setActiveChatId(result.chatId);
            const { data: newChat } = await supabase.from("ai_chats").select("*").eq("id", result.chatId).single();
            if (newChat) setChats(prev => [newChat as ChatSession, ...prev]);
        } else {
            setChats(prev => prev.map(c => 
                c.id === activeChatId 
                ? { ...c, total_tokens_used: (c.total_tokens_used || 0) + (result.tokensUsed || 0), updated_at: new Date().toISOString() } 
                : c
            ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
        }
    }
    setIsGenerating(false);
  }

  const toggleGroup = (gid: string) => setExpandedGroups(prev => ({...prev, [gid]: !prev[gid]}));

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
  const isLocked = balance <= 0;
  const currentUserId = user.id;
  const currentUserPfp = user.user_metadata?.avatar_url || "https://avatar.vercel.sh/user";
  const currentUserName = user.user_metadata?.full_name || "You";


  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
        /* Markdown */
        .prose p { margin-bottom: 0.5em; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.5em; }
        .prose pre { background: #000; padding: 1em; border-radius: 0.5em; border: 1px solid #333; overflow-x: auto; margin: 0.5em 0; }
        .prose code { background: #333; padding: 0.2em 0.4em; border-radius: 0.2em; font-size: 0.9em; }
        .prose pre code { background: transparent; padding: 0; }
        .prose strong { color: white; font-weight: 700; }
      `}</style>

      <Menu project={project} user={user} />

      <main className="flex-1 flex flex-col h-full ml-64 relative bg-[#0a0a0a]">
        
        {/* HEADER */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a] z-20">
            <h1 className="text-lg font-bold">AI Assistant</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => handleNewChat(null)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium flex items-center gap-2 transition-colors">
                   <Plus size={14} /> New Chat
                </button>
            </div>
        </div>

        <div className="flex flex-1 h-full overflow-hidden">
            
            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col relative bg-transparent min-w-0">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-white/20 select-none">
                            <Sparkles className="w-12 h-12 mb-4 opacity-50 text-purple-500" />
                            <h2 className="text-lg font-medium text-white/40">How can I help you?</h2>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {/* AI PFP (Bot Icon) */}
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot size={16} className="text-purple-400" />
                                </div>
                            )}
                            
                            <div className={`max-w-[85%] rounded-xl p-4 ${msg.role === 'user' ? 'bg-[#222] text-white' : 'bg-transparent text-gray-300'}`}>
                                {msg.role === 'ai' ? (
                                    <div className="prose prose-invert text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                                ) : (
                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                )}
                                {msg.cost && (
                                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 text-[10px] text-white font-bold opacity-100">
                                        <Zap size={10} className="text-yellow-400" /> {msg.cost} tokens
                                    </div>
                                )}
                            </div>
                            
                            {/* USER PFP (Added pfp logic here for completeness) */}
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/5 flex-shrink-0 mt-1">
                                    <CreatorPfp 
                                        userId={currentUserId}
                                        currentUserId={currentUserId}
                                        currentUserPfp={currentUserPfp}
                                        currentUserName={currentUserName}
                                        profiles={profiles}
                                        size="w-full h-full"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    {isGenerating && <div className="animate-pulse text-white/30 text-sm ml-12">Generating...</div>}
                </div>

                {/* COMPACT INPUT BAR + MODEL SELECTOR */}
                <div className="absolute bottom-0 w-full p-4 bg-[#0a0a0a] border-t border-white/5 z-10">
                    <div className="max-w-3xl mx-auto relative">
                        <div className={`relative bg-[#111] rounded-xl border border-white/10 ${isLocked ? 'opacity-50' : 'focus-within:border-white/20'}`}>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                                placeholder={isLocked ? "Balance exhausted." : "Message AI..."}
                                className="w-full bg-transparent text-white placeholder-white/30 resize-none focus:outline-none text-sm px-4 py-3 pb-10 max-h-[150px]"
                                rows={1}
                            />
                            
                            {/* Toolbar inside Input */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowModelMenu(!showModelMenu)}
                                        className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/70 font-medium transition-colors border border-white/5"
                                    >
                                        <selectedModel.icon size={10} className={selectedModel.id.includes('flash') ? 'text-yellow-400' : 'text-purple-400'} />
                                        {selectedModel.name}
                                        <ChevronDown size={10} className="opacity-50" />
                                    </button>

                                    {showModelMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                                            <div className="absolute bottom-full left-0 mb-2 w-40 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                                {MODELS.map((model) => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => { setSelectedModel(model); setShowModelMenu(false); }}
                                                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-left text-white/80 hover:bg-white/5 hover:text-white"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <model.icon size={12} className={model.id.includes('flash') ? 'text-yellow-400' : 'text-purple-400'} />
                                                            {model.name}
                                                        </span>
                                                        {selectedModel.id === model.id && <Check size={12} className="text-purple-500" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isGenerating}
                                className="absolute right-2 bottom-2 p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                        {isLocked && <p className="text-red-500 text-xs mt-2 text-center">Token limit reached.</p>}
                    </div>
                </div>
            </div>

            {/* SIDEBAR: GROUPS & HISTORY */}
            <div className="w-72 bg-[#0c0c0c] border-l border-white/5 hidden lg:flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <div className="p-4 rounded-xl bg-[#161616] border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Tokens Available</div>
                        <div className={`text-2xl font-bold ${balance > 0 ? 'text-white' : 'text-red-500'}`}>
                            {balance.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-bold text-white/30 uppercase">Folders</h3>
                        <button onClick={() => setShowGroupInput(!showGroupInput)} className="text-white/40 hover:text-white"><Plus size={14} /></button>
                    </div>

                    {showGroupInput && (
                        <div className="flex gap-2 mb-4">
                            <input 
                                autoFocus
                                className="bg-[#111] border border-white/10 rounded px-2 py-1 text-xs w-full outline-none text-white"
                                placeholder="Group Name"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                            />
                            <button onClick={handleCreateGroup} className="bg-purple-600 px-2 rounded text-xs">Add</button>
                        </div>
                    )}

                    {/* Uncategorized Chats - DROP TARGET */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, null)}
                        className={`transition-colors rounded ${draggingId && 'bg-white/5 border-dashed border border-white/20'}`}
                    >
                         <div className="flex items-center justify-between text-xs text-white/60 mb-2 px-1 py-1">
                            <div className="flex items-center gap-2"><Folder size={12} /> <span>Uncategorized</span></div>
                            <div className="text-[10px] text-white/70 font-mono flex items-center gap-1">
                                <Zap size={10} className="text-white/30" />
                                <span>{getGroupTotal(null)}</span>
                            </div>
                         </div>
                         <div className="space-y-1 pl-2 border-l border-white/5 ml-1.5">
                            {chats.filter(c => !c.group_id).map(chat => (
                                <button 
                                    key={chat.id} 
                                    onClick={() => setActiveChatId(chat.id)}
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", chat.id); setDraggingId(chat.id); }}
                                    onDragEnd={() => setDraggingId(null)}
                                    className={`relative flex items-center w-full text-left text-xs py-1.5 px-2 rounded group/chat transition-colors ${activeChatId === chat.id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'} ${draggingId === chat.id ? 'opacity-50' : ''}`}
                                >
                                    <span className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis pr-2">{chat.title}</span> 
                                    <span className="flex-shrink-0 text-[10px] font-mono text-white/30 mr-6">{chat.total_tokens_used.toLocaleString()}</span>
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 mr-10">
                                        <CreatorPfp 
                                            userId={chat.user_id}
                                            currentUserId={currentUserId}
                                            currentUserPfp={currentUserPfp}
                                            currentUserName={currentUserName}
                                            profiles={profiles}
                                        />
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover/chat:opacity-100 hover:text-red-400 hover:bg-white/5 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </button>
                            ))}
                         </div>
                    </div>

                    {/* Custom Groups - DROP TARGETS */}
                    {groups.map(group => (
                        <div key={group.id}>
                            <div 
                                className="flex items-center justify-between group/header cursor-pointer" 
                                onClick={() => toggleGroup(group.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, group.id)}
                            >
                                <div className={`flex items-center gap-2 text-xs font-medium px-1 py-1 rounded w-full hover:bg-white/5 transition-colors ${expandedGroups[group.id] ? 'text-white/80' : 'text-white/60'} ${draggingId && 'border-dashed border border-white/20'}`}>
                                    {expandedGroups[group.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    {group.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Group Author PFP */}
                                    <div className="ml-auto mr-2">
                                        <CreatorPfp 
                                            userId={group.user_id}
                                            currentUserId={currentUserId}
                                            currentUserPfp={currentUserPfp}
                                            currentUserName={currentUserName}
                                            profiles={profiles}
                                        />
                                    </div>
                                    {/* Display Total for Group */}
                                    <div className="text-[10px] text-white/70 font-mono flex items-center gap-1">
                                        <Zap size={10} className="text-white/30" />
                                        <span>{getGroupTotal(group.id)}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleNewChat(group.id); }} className="opacity-0 group-hover/header:opacity-100 text-white/40 hover:text-white"><Plus size={12} /></button>
                                    <button onClick={(e) => handleDeleteGroup(group.id, e)} className="opacity-0 group-hover/header:opacity-100 text-white/40 hover:text-red-400"><Trash2 size={12} /></button>
                                </div>
                            </div>
                            
                            {expandedGroups[group.id] && (
                                <div className="space-y-1 pl-2 border-l border-white/5 ml-1.5 mt-1">
                                    {chats.filter(c => c.group_id === group.id).length === 0 && (
                                        <div className="text-[10px] text-white/20 italic px-2 py-1">Empty</div>
                                    )}
                                    {chats.filter(c => c.group_id === group.id).map(chat => (
                                        <button 
                                            key={chat.id} 
                                            onClick={() => setActiveChatId(chat.id)} 
                                            draggable
                                            onDragStart={(e) => { e.dataTransfer.setData("text/plain", chat.id); setDraggingId(chat.id); }}
                                            onDragEnd={() => setDraggingId(null)}
                                            className={`relative flex items-center w-full text-left text-xs py-1.5 px-2 rounded group/chat ${activeChatId === chat.id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'} ${draggingId === chat.id ? 'opacity-50' : ''}`}
                                        >
                                            <span className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis pr-2">{chat.title}</span>
                                            <span className="flex-shrink-0 text-[10px] font-mono text-white/30 mr-6">{chat.total_tokens_used.toLocaleString()}</span>
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 mr-10">
                                                <CreatorPfp 
                                                    userId={chat.user_id}
                                                    currentUserId={currentUserId}
                                                    currentUserPfp={currentUserPfp}
                                                    currentUserName={currentUserName}
                                                    profiles={profiles}
                                                />
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteChat(chat.id, e)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover/chat:opacity-100 hover:text-red-400 hover:bg-white/5 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}