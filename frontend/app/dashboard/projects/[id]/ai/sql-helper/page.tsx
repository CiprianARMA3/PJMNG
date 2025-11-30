"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import Menu from "../../components/menu";
import { generateAiResponse, createChatGroup, deleteChatGroup, updateChatGroup, deleteChat, renameChat, updateGroupTags } from "./actions-sql";
import {
  Sparkles,
  Bot,
  Zap,
  Plus,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
  CornerDownLeft,
  CreditCard,
  Cpu,
  Lock,
  Tag,
  X,
  Copy,
  RefreshCw,
  Check,
  Info
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PageProps {
  params: Promise<{ id: string }>;
}

// --- DATA TYPES ---
type Profile = { id: string; full_name: string; avatar_url: string | null };
type GroupTag = { id: string; label: string; color: string; };
type ChatGroup = { id: string; name: string; user_id: string; metadata?: { tags: GroupTag[] } };
type ChatSession = { id: string; title: string; group_id: string | null; total_tokens_used: number; updated_at: string; user_id: string; };
type Message = { role: 'user' | 'ai'; content: string; cost?: number; ai_model?: string; };

interface CreatorPfpProps {
  userId: string;
  currentUserId: string;
  currentUserPfp: string;
  currentUserName: string;
  profiles: Record<string, Profile>;
  size?: string;
  showNameOnHover?: boolean;
}

// --- CONSTANTS ---
const MODELS = [
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", icon: Sparkles, description: "Reasoning & Coding" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", icon: Cpu, description: "Complex Tasks" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", icon: Zap, description: "Fast & Efficient" },
];

const TAG_COLORS = [
    { name: "Red", hex: "#EF4444" },
    { name: "Orange", hex: "#F97316" },
    { name: "Amber", hex: "#F59E0B" },
    { name: "Green", hex: "#10B981" },
    { name: "Blue", hex: "#3B82F6" },
    { name: "Purple", hex: "#8B5CF6" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Gray", hex: "#71717A" },
];

// --- HELPER COMPONENTS ---

// 1. CodeBlock (Used in Markdown)
const CodeBlock = ({ language, children }: { language: string, children: React.ReactNode }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const text = String(children).replace(/\n$/, '');
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="rounded-md overflow-hidden border border-[#27272A] my-4 shadow-xl group/code">
            <div className="flex items-center justify-between px-3 py-1 bg-[#18181B] border-b border-[#27272A]">
                <span className="text-xs text-zinc-500 font-mono">{language}</span>
                <button 
                    onClick={handleCopy} 
                    className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover/code:opacity-100"
                    title="Copy code"
                >
                    {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{ margin: 0, padding: '1rem', background: '#0E0E10', fontSize: '0.875rem' }}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

// 2. Markdown Configuration
const MARKDOWN_COMPONENTS = {
    code({node, inline, className, children, ...props}: any) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
            <CodeBlock language={match[1]}>{children}</CodeBlock>
        ) : (
            <code className={`${className} bg-[#27272A] text-zinc-200 px-1 py-0.5 rounded text-[13px]`} {...props}>{children}</code>
        )
    },
    table({children}: any) {
        return (
            <div className="my-6 w-full overflow-hidden rounded-lg border border-[#27272A] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">{children}</table>
                </div>
            </div>
        );
    },
    thead({children}: any) {
        return <thead className="bg-[#18181B] text-xs uppercase font-semibold text-zinc-500 border-b border-[#27272A]">{children}</thead>;
    },
    tbody({children}: any) {
        return <tbody className="divide-y divide-[#27272A] bg-transparent">{children}</tbody>;
    },
    tr({children}: any) {
        return <tr className="transition-colors hover:bg-white/5 group/row">{children}</tr>;
    },
    th({children}: any) {
        return <th className="px-4 py-3 whitespace-nowrap tracking-wider">{children}</th>;
    },
    td({children}: any) {
        return <td className="px-4 py-3 align-top leading-relaxed text-zinc-300">{children}</td>;
    }
};

// 3. Creator Profile Picture
const CreatorPfp: React.FC<CreatorPfpProps> = ({ userId, currentUserId, currentUserPfp, currentUserName, profiles, size = 'w-5 h-5', showNameOnHover = true }) => {
    const isCurrentUser = userId === currentUserId;
    const profile = isCurrentUser ? { full_name: currentUserName, avatar_url: currentUserPfp } : profiles[userId];
    const defaultPfp = "https://avatar.vercel.sh/" + userId;
    const pfpUrl = profile?.avatar_url || defaultPfp;
    const name = profile?.full_name || "Unknown User";

    return (
        <div className="relative group/pfp inline-flex items-center justify-center flex-shrink-0 z-10">
            <img src={pfpUrl} alt={name} className={`${size} rounded-full object-cover ring-1 ring-[#27272A] bg-[#18181B]`} />
            {showNameOnHover && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#09090B] border border-[#27272A] text-[11px] font-medium text-white rounded-md shadow-2xl opacity-0 translate-y-2 group-hover/pfp:translate-y-0 group-hover/pfp:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                    {name}
                </div>
            )}
        </div>
    );
};

// 4. Chat Input Component (UPDATED & FIXED)
const ChatInput = ({ 
  onSend, 
  isGenerating, 
  isLocked, 
  selectedModel, 
  selectedModelBalance,
  tokenBalances, 
  models,
  onModelSelect 
}: any) => {
  const [input, setInput] = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSendClick = () => {
    if (!input.trim() || isGenerating || isLocked) return;
    onSend(input);
    setInput(""); 
  };

  const estimatedInputTokens = Math.ceil(input.length / 4);
  const isInputTooExpensive = estimatedInputTokens > selectedModelBalance;
  const effectiveLock = isLocked || isInputTooExpensive;

  return (
    <div className="absolute bottom-6 left-0 right-0 px-4 md:px-12 lg:px-24 pointer-events-none z-30">
        <div className="relative max-w-4xl mx-auto pointer-events-auto">
            <div className={`relative bg-[#18181B] rounded-xl border transition-all duration-200 shadow-2xl shadow-black/80 ${effectiveLock ? 'border-red-900/50 opacity-80' : 'border-[#27272A] focus-within:border-zinc-500'}`}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); }}}
                    placeholder={isInputTooExpensive ? `Input exceeds balance` : effectiveLock ? `Insufficient ${selectedModel.name} tokens.` : "Ask anything..."}
                    className={`w-full bg-transparent text-[#E4E4E7] placeholder-zinc-600 resize-none focus:outline-none text-[15px] px-4 py-4 pr-12 max-h-[200px] leading-relaxed rounded-xl ${effectiveLock ? 'cursor-not-allowed text-zinc-500' : ''}`}
                    rows={1}
                />
                
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div className="flex items-center gap-2">
                        {/* Model Selector */}
                        <div className="relative">
                            <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#27272A]/50 hover:bg-[#27272A] rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-transparent hover:border-zinc-700">
                                <selectedModel.icon size={12} className={selectedModel.id.includes('flash') ? 'text-amber-400' : 'text-indigo-400'} />
                                <span className="font-medium">{selectedModel.name}</span>
                                <ChevronDown size={10} className="opacity-50" />
                            </button>
                            {showModelMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Select Model</div>
                                        {models.map((model: any) => {
                                            // Calculate balance safely
                                            const bal = tokenBalances ? (tokenBalances[model.id] || 0) : 0;
                                            
                                            return (
                                                <button key={model.id} onClick={() => { onModelSelect(model); setShowModelMenu(false); }} className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-zinc-400 hover:bg-[#27272A] hover:text-zinc-100 transition-colors">
                                                    <span className="flex items-center gap-2">
                                                        <model.icon size={14} className={model.id.includes('flash') ? 'text-amber-400' : 'text-indigo-400'} />
                                                        {model.name}
                                                    </span>
                                                    {/* Balance Display */}
                                                    <span className={`text-[10px] font-mono ${bal > 0 ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                                        {bal.toLocaleString()}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                        {input.length > 0 && !effectiveLock && <span className={`text-[10px] font-mono ${isInputTooExpensive ? 'text-red-500' : 'text-zinc-500'}`}>~{estimatedInputTokens} tok</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        {effectiveLock && <div className="flex items-center gap-1 text-[10px] text-red-500 bg-red-950/20 px-2 py-1 rounded"><Lock size={10} /><span>{isInputTooExpensive ? 'Prompt too long' : 'No tokens'}</span></div>}
                        <button onClick={handleSendClick} disabled={!input.trim() || isGenerating || effectiveLock} className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${input.trim() && !isGenerating && !effectiveLock ? 'bg-zinc-100 text-black hover:bg-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-[#27272A] text-zinc-500 cursor-not-allowed'}`}>
                            {isGenerating ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"/> : <CornerDownLeft size={16} strokeWidth={2.5} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// 5. Sidebar Item Component
const SidebarItem = ({ chat, isActive, isDragging, onClick, onDelete, onDragStart, onDragEnd, profiles, currentUserId, currentUserPfp, currentUserName, isEditing, onEdit, onRename }: any) => {
    const isCurrentUser = chat.user_id === currentUserId;
    const profile = isCurrentUser ? { full_name: currentUserName, avatar_url: currentUserPfp } : profiles[chat.user_id];
    const name = profile?.full_name || "Unknown";
    const firstName = name.split(' ')[0];
    const pfpUrl = profile?.avatar_url || "https://avatar.vercel.sh/" + chat.user_id;
    
    const [editValue, setEditValue] = useState(chat.title);
    const handleBlur = () => onRename(editValue);
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onRename(editValue);
        if (e.key === 'Escape') { setEditValue(chat.title); onRename(chat.title); }
    };

    return (
        <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick} className={`group relative flex items-center justify-between w-full text-left py-2 px-2.5 rounded-md cursor-pointer transition-all duration-300 ease-in-out ${isActive ? 'bg-[#18181B] shadow-sm border border-[#27272A]' : 'hover:bg-[#18181B] border border-transparent'} ${isDragging ? 'opacity-40 dashed border-zinc-600' : ''}`}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={`w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-300 ${isActive ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-zinc-700'}`} />
                {isEditing ? (
                    <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className="bg-transparent text-xs text-white border-none outline-none w-full" />
                ) : (
                    <span onDoubleClick={(e) => { e.stopPropagation(); onEdit(chat.id); setEditValue(chat.title); }} className={`truncate text-xs transition-colors duration-300 ${isActive ? 'text-zinc-200 font-medium' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{chat.title || "Untitled Chat"}</span>
                )}
            </div>
            <div className="flex items-center gap-2 pl-2 ml-4 flex-shrink-0">
                <div className={`flex items-center gap-1.5 transition-all duration-300 ease-out transform ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                    <span className="text-[10px] text-zinc-600 hidden group-hover:block max-w-[50px] truncate">{firstName}</span>
                    <img src={pfpUrl} alt={name} className="w-4 h-4 rounded-full object-cover ring-1 ring-[#27272A]" title={name} />
                </div>
                <button onClick={onDelete} className={`p-1 hover:bg-[#27272A] rounded text-zinc-500 hover:text-red-400 transition-all duration-300 ease-out transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100`}>
                    <Trash2 size={11} />
                </button>
            </div>
        </div>
    )
}

// --- MAIN PAGE COMPONENT ---
export default function AiAssistantPage({ params }: PageProps) {
  const supabase = createClient();

  // Core
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  // UI
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showTokenInfo, setShowTokenInfo] = useState(false);

  // Groups UI & Tags
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeTagMenuId, setActiveTagMenuId] = useState<string | null>(null);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].hex);

  // Chat Renaming
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- HELPER FUNCTIONS ---
  async function fetchProfiles(userIds: string[]) {
      if (userIds.length === 0) return;
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      if (data) {
          const profileMap: Record<string, Profile> = {};
          data.forEach(p => { profileMap[p.id] = p as Profile; });
          setProfiles(prev => ({...prev, ...profileMap}));
      }
  }

  async function fetchBalance(pid: string) {
      const { data: tokenPack } = await supabase
        .from("token_packs").select("remaining_tokens").eq("project_id", pid)
        .gt("expires_at", new Date().toISOString()).order("purchased_at", { ascending: false }).limit(1).single();

      if (tokenPack?.remaining_tokens) {
        let rt = tokenPack.remaining_tokens as any;
        if (typeof rt === 'string') { try { rt = JSON.parse(rt); } catch(e) {} }
        setTokenBalances(rt || {});
      }
  }

  const getModelById = (id?: string) => MODELS.find(m => m.id === id) || MODELS[0];

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

            const { data: groupsData } = await supabase.from("ai_sql_chat_groups").select("*").eq("project_id", id).order("created_at", { ascending: true });
            const { data: chatsData } = await supabase.from("ai_sql_chats").select("*, user_id").eq("project_id", id).order("updated_at", { ascending: false });

      if (groupsData) {
          const parsedGroups = groupsData.map((g: any) => ({
             ...g,
             metadata: typeof g.metadata === 'string' ? JSON.parse(g.metadata) : g.metadata
          }));
          setGroups(parsedGroups as ChatGroup[]);
          const expandState: any = {};
          groupsData.forEach((g: any) => expandState[g.id] = true);
          setExpandedGroups(expandState);
      }
      if (chatsData) setChats(chatsData as ChatSession[]);

      const userIdsToFetch = [
          ...(groupsData || []).map((g: any) => g.user_id),
          ...(chatsData || []).map((c: any) => c.user_id)
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
        const { data: msgs } = await supabase.from("ai_sql_messages").select("*").eq("chat_id", activeChatId).order("created_at", { ascending: true });
        if (msgs) {
            setMessages(msgs.map(m => ({ 
                role: m.role as 'user' | 'ai', 
                content: m.content, 
                cost: m.tokens_used,
                ai_model: m.ai_model
            })));
        }
    }
    loadMessages();
  }, [activeChatId]);

  // --- SCROLLING ---
  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages, isGenerating]);

  // --- HANDLERS ---
  const handleDrop = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault();
    setDraggingId(null);
    const chatId = e.dataTransfer.getData("text/plain");
    if (!chatId) return;

    setChats(prev => {
        const updated = prev.map(c =>
            c.id === chatId ? { ...c, group_id: targetGroupId, updated_at: new Date().toISOString() } : c
        );
        return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    });
    updateChatGroup(chatId, targetGroupId);
  };

  const handleCreateGroup = async () => {
      if (!newGroupName.trim()) return;
      const res = await createChatGroup(projectId, newGroupName);
      if (res.success && res.group) {
          setGroups([...groups, { ...res.group, metadata: { tags: [] } } as ChatGroup]);
          setExpandedGroups({...expandedGroups, [res.group.id]: true});
          setNewGroupName("");
          setShowGroupInput(false);
      }
  };

  const handleAddTag = async (groupId: string) => {
    if (!newTagLabel.trim()) return;
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const newTag: GroupTag = { id: crypto.randomUUID(), label: newTagLabel.trim(), color: newTagColor };
    const updatedGroups = [...groups];
    const currentTags = updatedGroups[groupIndex].metadata?.tags || [];
    
    const updatedTags = [...currentTags, newTag];
    updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], metadata: { tags: updatedTags } };
    
    setGroups(updatedGroups);
    setNewTagLabel(""); 
    await updateGroupTags(groupId, updatedTags);
  };

  const handleRemoveTag = async (groupId: string, tagId: string) => {
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const updatedGroups = [...groups];
    const currentTags = updatedGroups[groupIndex].metadata?.tags || [];
    const updatedTags = currentTags.filter(t => t.id !== tagId);
    
    updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], metadata: { tags: updatedTags } };
    setGroups(updatedGroups);
    await updateGroupTags(groupId, updatedTags);
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
      if (!newTitle.trim() || newTitle === chats.find(c => c.id === chatId)?.title) {
          setEditingChatId(null);
          return;
      }
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
      setEditingChatId(null);
      await renameChat(chatId, newTitle);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Permanently delete this chat?")) return;
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
    }
    await deleteChat(chatId);
  };

  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this folder? Chats will move to Uncategorized.")) return;
    const res = await deleteChatGroup(groupId);
    if (res.success) {
        setGroups(groups.filter(g => g.id !== groupId));
        setChats(chats.map(c => c.group_id === groupId ? { ...c, group_id: null } : c));
    }
  };

  const handleNewChat = (groupId: string | null = null) => {
    setActiveChatId(null);
    setSelectedGroupId(groupId);
    setMessages([]);
  };

  const handleCopy = (content: string, idx: number) => {
      navigator.clipboard.writeText(content);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = async () => {
      if (isGenerating || messages.length === 0) return;
      
      const lastUserMsgIndex = messages.findLastIndex(m => m.role === 'user');
      if (lastUserMsgIndex === -1) return;
      const lastUserPrompt = messages[lastUserMsgIndex].content;

      const newMessages = messages.slice(0, lastUserMsgIndex + 1);
      setMessages(newMessages);

      setIsGenerating(true);
      
      const result = await generateAiResponse(
          projectId, 
          lastUserPrompt, 
          activeChatId || undefined, 
          selectedGroupId || undefined, 
          selectedModel.id, 
          true 
      );

      if (result.error) {
          setMessages([...newMessages, { role: 'ai', content: `**Error:** ${result.error}` }]);
          setIsGenerating(false);
          return;
      }

      if (result.success) {
          setMessages([...newMessages, { 
              role: 'ai', 
              content: result.message!, 
              cost: result.tokensUsed,
              ai_model: result.ai_model
          }]);
          if (result.newBalance) setTokenBalances(result.newBalance);
      }
      setIsGenerating(false);
  };

  const selectedModelBalance = tokenBalances[selectedModel.id] || 0;
  
  // Updated handleSend to receive text directly from ChatInput
  async function handleSend(text: string) {
    if (!text.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    const result = await generateAiResponse(projectId, text, activeChatId || undefined, selectedGroupId || undefined, selectedModel.id, false);

    if (result.error) {
        setMessages(prev => [...prev, { role: 'ai', content: `**Error:** ${result.error}` }]);
        setIsGenerating(false);
        return;
    }

    if (result.success) {
        setMessages(prev => [...prev, { 
            role: 'ai', 
            content: result.message!, 
            cost: result.tokensUsed,
            ai_model: result.ai_model
        }]);
        if (result.newBalance) setTokenBalances(result.newBalance);

        if (!activeChatId && result.chatId) {
            setActiveChatId(result.chatId);
            const { data: newChat } = await supabase.from("ai_sql_chats").select("*").eq("id", result.chatId).single();
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
  const currentUserId = user?.id || "";
  const currentUserPfp = user?.user_metadata?.avatar_url || "";
  const currentUserName = user?.user_metadata?.full_name || "You";

  return (
    <div className="h-screen bg-[#0E0E10] text-[#E1E1E3] flex overflow-hidden font-sans selection:bg-zinc-700 selection:text-white">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
        .prose { color: #A1A1AA; font-size: 0.95rem; line-height: 1.7; }
        .prose p { margin-bottom: 1.25em; margin-top: 0.25em; }
        .prose a { color: #60A5FA; text-decoration: none; border-bottom: 1px solid transparent; }
        .prose a:hover { border-bottom-color: #60A5FA; }
        .prose strong { color: #F4F4F5; font-weight: 600; }
        .prose ul, .prose ol { margin-left: 1.2rem; color: #A1A1AA; margin-bottom: 1em; }
        .prose li { margin-bottom: 0.25em; }
        .prose h1, .prose h2, .prose h3 { color: #FAFAFA; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
      `}</style>

      <Menu project={project} user={user} />

      <main className="flex-1 flex flex-col h-full ml-64 relative bg-[#0E0E10]">

        {/* HEADER */}
        <div className="flex-none h-14 px-6 border-b border-[#27272A] flex items-center justify-between bg-[#0E0E10] z-20">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-200">AI Assistant</span>
                <span className="text-zinc-600">/</span>
                <span className="text-sm text-zinc-400 truncate max-w-[200px]">
                    {chats.find(c => c.id === activeChatId)?.title || "New Session"}
                </span>
            </div>
             <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18181B] border border-[#27272A]`}>
                    <selectedModel.icon size={12} className={selectedModel.id.includes('flash') ? 'text-amber-400' : 'text-indigo-400'} />
                    <span className="text-xs text-zinc-300 hidden sm:inline">{selectedModel.name}</span>
                    <div className="w-px h-3 bg-[#27272A] mx-1"></div>
                    <span className={`text-xs font-mono ${selectedModelBalance > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {selectedModelBalance.toLocaleString()}
                    </span>
                </div>
             </div>
        </div>

        <div className="flex flex-1 h-full overflow-hidden">

            {/* SIDEBAR */}
            <div className="w-[300px] bg-[#09090B] border-r border-[#27272A] flex flex-col flex-shrink-0">
                <div className="p-3 border-b border-[#27272A] flex items-center gap-2">
                    <button onClick={() => handleNewChat(null)} className="flex-1 flex items-center justify-center gap-2 bg-[#FAFAFA] text-black hover:bg-white transition-colors py-1.5 rounded-md text-xs font-semibold shadow-sm tracking-wide">
                        <Plus size={14} /> NEW CHAT
                    </button>
                    <button onClick={() => setShowGroupInput(!showGroupInput)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272A] rounded-md transition-colors">
                        <Folder size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {showGroupInput && (
                        <div className="px-2 py-2 mb-2 bg-[#18181B] rounded-md border border-[#27272A]">
                            <input autoFocus className="bg-transparent text-sm w-full outline-none text-white placeholder-zinc-600" placeholder="Folder name..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateGroup()} />
                        </div>
                    )}

                    {groups.map(group => (
                        <div key={group.id} className="mb-1 relative">
                            {/* Group Header */}
                            <div className={`group/header flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer select-none transition-colors ${draggingId ? 'border border-dashed border-zinc-700 bg-[#18181B]' : 'hover:bg-[#18181B]'}`} onClick={() => toggleGroup(group.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, group.id)}>
                                <div className="flex items-center gap-2 overflow-hidden text-zinc-400 group-hover/header:text-zinc-200 min-w-0 flex-1">
                                    <div className="transition-transform duration-200">{expandedGroups[group.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</div>
                                    <span className="text-xs font-semibold uppercase tracking-wider truncate">{group.name}</span>
                                    <div className="flex items-center gap-1.5 ml-2 overflow-x-auto no-scrollbar mask-linear-fade">
                                        {group.metadata?.tags?.map(tag => (
                                            <span key={tag.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#27272A] border border-[#3F3F46] text-[9px] text-zinc-300 whitespace-nowrap">
                                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                                                {tag.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveTagMenuId(activeTagMenuId === group.id ? null : group.id); }} className="text-zinc-500 hover:text-white p-1 relative"><Tag size={12} /></button>
                                    <button onClick={(e) => handleDeleteGroup(group.id, e)} className="text-zinc-500 hover:text-red-400 p-1"><Trash2 size={12} /></button>
                                </div>
                            </div>

                            {/* Tag Menu */}
                            {activeTagMenuId === group.id && (
                                <div className="absolute left-4 top-8 z-50 bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl p-3 w-48">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase">Manage Tags</div>
                                        <button onClick={() => setActiveTagMenuId(null)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
                                    </div>
                                    <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                                        {group.metadata?.tags?.length === 0 && <div className="text-[10px] text-zinc-600 italic">No tags yet</div>}
                                        {group.metadata?.tags?.map(tag => (
                                            <div key={tag.id} className="flex items-center justify-between text-xs bg-[#27272A] px-2 py-1 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                    <span className="truncate max-w-[90px]">{tag.label}</span>
                                                </div>
                                                <button onClick={() => handleRemoveTag(group.id, tag.id)} className="text-zinc-500 hover:text-white"><X size={10} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-[#27272A] pt-2">
                                        <input className="w-full bg-[#0E0E10] border border-[#27272A] rounded px-2 py-1 text-xs text-white mb-2 focus:border-indigo-500 outline-none" placeholder="Tag name..." value={newTagLabel} onChange={e => setNewTagLabel(e.target.value)} />
                                        <div className="flex items-center justify-between mb-2">
                                            {TAG_COLORS.map(c => (
                                                <button key={c.hex} onClick={() => setNewTagColor(c.hex)} className={`w-3 h-3 rounded-full transition-transform hover:scale-125 ${newTagColor === c.hex ? 'ring-1 ring-white scale-110' : ''}`} style={{ backgroundColor: c.hex }} title={c.name} />
                                            ))}
                                        </div>
                                        <button onClick={() => handleAddTag(group.id)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 rounded">Add Tag</button>
                                    </div>
                                </div>
                            )}

                            {/* Group Content */}
                            {expandedGroups[group.id] && (
                                <div className="mt-0.5 space-y-0.5 relative z-0">
                                    {chats.filter(c => c.group_id === group.id).map(chat => (
                                        <SidebarItem 
                                            key={chat.id} chat={chat} isActive={activeChatId === chat.id} isDragging={draggingId === chat.id}
                                            isEditing={editingChatId === chat.id} onEdit={(id: string) => setEditingChatId(id)} onRename={(title: string) => handleRenameChat(chat.id, title)}
                                            onClick={() => setActiveChatId(chat.id)}
                                            onDelete={(e: React.MouseEvent) => handleDeleteChat(chat.id, e)}
                                            onDragStart={(e: React.DragEvent) => { e.dataTransfer.setData("text/plain", chat.id); setDraggingId(chat.id); }}
                                            onDragEnd={() => setDraggingId(null)}
                                            profiles={profiles} currentUserId={currentUserId} currentUserPfp={currentUserPfp} currentUserName={currentUserName}
                                        />
                                    ))}
                                    {chats.filter(c => c.group_id === group.id).length === 0 && <div className="pl-6 py-1 text-[10px] text-zinc-600 italic">No chats</div>}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <div className="pt-2 mt-2 border-t border-[#27272A]/50">
                        <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null)}>Uncategorized</div>
                        <div className="space-y-0.5">
                            {chats.filter(c => !c.group_id).map(chat => (
                                <SidebarItem 
                                    key={chat.id} chat={chat} isActive={activeChatId === chat.id} isDragging={draggingId === chat.id}
                                    isEditing={editingChatId === chat.id} onEdit={(id: string) => setEditingChatId(id)} onRename={(title: string) => handleRenameChat(chat.id, title)}
                                    onClick={() => setActiveChatId(chat.id)}
                                    onDelete={(e: React.MouseEvent) => handleDeleteChat(chat.id, e)}
                                    onDragStart={(e: React.DragEvent) => { e.dataTransfer.setData("text/plain", chat.id); setDraggingId(chat.id); }}
                                    onDragEnd={() => setDraggingId(null)}
                                    profiles={profiles} currentUserId={currentUserId} currentUserPfp={currentUserPfp} currentUserName={currentUserName}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#27272A] bg-[#0E0E10]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                            <CreditCard size={12} className="text-zinc-500" />
                            {selectedModel.name}
                            <button onClick={() => setShowTokenInfo(!showTokenInfo)} className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none">
                                <Info size={12} />
                            </button>
                        </div>
                        <span className={`text-xs font-mono ${selectedModelBalance > 0 ? 'text-zinc-400' : 'text-red-500'}`}>
                            {selectedModelBalance.toLocaleString()}
                            &nbsp;tokens
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#18181B] rounded-full overflow-hidden border border-[#27272A]">
                        <div className={`h-full rounded-full transition-all duration-500 ${selectedModelBalance > 100000 ? 'bg-indigo-500' : selectedModelBalance > 50000 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min((selectedModelBalance / 100000) * 100, 100)}%` }} />
                    </div>
                    
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showTokenInfo ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                        <p className="text-[12px] text-zinc-400 leading-tight">
                            For further information about token pricing and usage consult <a href="https://google.it" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline decoration-purple-400/30 underline-offset-2 transition-colors">&lt;Token Pricing and Usage /&gt;</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col relative min-w-0 bg-[#0E0E10]" onClick={() => setActiveTagMenuId(null)}>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 py-8 space-y-8 scroll-smooth pb-40">
                    {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 select-none pb-20">
                        <div className="group relative w-16 h-16 bg-[#18181B] rounded-2xl flex items-center justify-center mb-6 border border-[#27272A] shadow-lg shadow-black/20 overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer">
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-purple-500/40 to-transparent z-10" />
                            <Sparkles size={32} className="text-zinc-500 relative z-0 transition-colors duration-500 group-hover:text-white" />
                        </div>
                        <h2 className="text-xl font-medium text-zinc-200 mb-2">How can I help with your SQL?</h2>
                        <p className="text-sm text-zinc-500 max-w-md text-center mb-8 font-bold">
                            Professional-grade SQL generation focused strictly on logic and technical precision.
                        </p>
                        <div className="w-full max-w-xs bg-[#18181B] border border-[#27272A] rounded-xl p-5 text-left shadow-lg shadow-black/10 backdrop-blur-sm">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-[#27272A] pb-2 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                                For Best Results
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-zinc-500 font-medium mb-1.5 flex items-center gap-1.5">1. Target RDBMS</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['PostgreSQL', 'MySQL', 'ScyllaDB', 'SQLite', 'MariaDB', 'SQL Server', 'Oracle', 'etc...'].map(db => (
                                            <span key={db} className="px-1.5 py-0.5 rounded bg-[#27272A] border border-white/5 text-[10px] text-zinc-300 font-mono hover:bg-[#323238] transition-colors cursor-default">
                                                {db}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 font-medium mb-1">2. Business Context</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Describe your data logic, ranging from high-level concepts to granular details.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {messages.map((msg, idx) => {
                        const modelInfo = getModelById(msg.ai_model); 
                        const ModelIcon = modelInfo.icon;

                        return (
                            <div key={idx} className={`group flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-shrink-0 mt-1 flex flex-col items-center gap-1">
                                    {msg.role === 'ai' ? (
                                        <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center">
                                            <ModelIcon size={14} className={msg.ai_model?.includes('flash') ? 'text-amber-400' : 'text-indigo-400'} />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#27272A]">
                                                <CreatorPfp
                                                    userId={currentUserId}
                                                    currentUserId={currentUserId}
                                                    currentUserPfp={currentUserPfp}
                                                    currentUserName={currentUserName}
                                                    profiles={profiles}
                                                    size="w-full h-full"
                                                    showNameOnHover={true}
                                                />
                                            </div>
                                            <span className="text-[12px] text-zinc-500 font-medium leading-tight text-center whitespace-nowrap px-1">
                                                {currentUserName}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#27272A] text-zinc-100 rounded-tr-sm' : 'bg-transparent text-zinc-300 px-0 py-1'}`}>
                                        {msg.role === 'ai' ? (
                                            <div className="prose prose-invert max-w-none">
                                                {/* Using externalized components to prevent re-renders */}
                                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        )}
                                    </div>
                                    
                                    {msg.role === 'ai' && (
                                        <div className="mt-2 w-full flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-1">
                                            <div className="flex items-center gap-3">
                                                {msg.cost && (
                                                    <div className="text-[10px] font-mono text-zinc-600 flex items-center gap-1">
                                                        <Zap size={10} /> {msg.cost} tokens
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleCopy(msg.content, idx)} className="p-1 hover:bg-[#27272A] rounded text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy">
                                                        {copiedIndex === idx ? <Check size={12} className="text-emerald-500"/> : <Copy size={12} />}
                                                    </button>
                                                    {idx === messages.length - 1 && !isGenerating && (
                                                        <button onClick={handleRegenerate} className="p-1 hover:bg-[#27272A] rounded text-zinc-500 hover:text-zinc-300 transition-colors" title="Regenerate">
                                                            <RefreshCw size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-zinc-600 font-medium tracking-wide">
                                                {modelInfo.name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    
                    {isGenerating && (
                         <div className="flex gap-5">
                            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center animate-pulse"><Bot size={16} className="text-zinc-500" /></div>
                            <div className="flex items-center gap-1 mt-2"><span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></span></div>
                        </div>
                    )}
                </div>

                {/* ISOLATED CHAT INPUT COMPONENT */}
                <ChatInput 
                    onSend={handleSend}
                    isGenerating={isGenerating}
                    isLocked={selectedModelBalance <= 0}
                    selectedModel={selectedModel}
                    selectedModelBalance={selectedModelBalance}
                    tokenBalances={tokenBalances}
                    models={MODELS}
                    onModelSelect={setSelectedModel}
                />
            </div>
        </div>
      </main>
    </div>
  );
}