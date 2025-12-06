"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Menu from "../../components/menu";
import Image from 'next/image';
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useRouter, useParams } from "next/navigation";
import { 
  Check, 
  MoreHorizontal, 
  Plus, 
  X, 
  Settings, 
  Tag as TagIcon, 
  Trash2, 
  Layout, 
  FileText 
} from "lucide-react";
import router from "next/router";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Tag = { name: string; color: string; textColor?: string };

type Creator = {
  id: string;
  name: string | null;
  surname: string | null;
  metadata: {
    avatar_url?: string;
    [key: string]: any;
  };
}

type Group = {
  id: string;
  project_id: string;
  name: string;
  metadata?: { tags?: Tag[] } | null;
  created_at?: string;
};

type Concept = {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  group_name?: string | null;
  created_by?: string | null;
  metadata?: { tags?: Tag[]; completed?: boolean } | null;
  created_at?: string;
  updated_at?: string;
  creator: Creator | null;
};

export default function Board({ params }: PageProps) {
  const supabase = createClient();

  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  const { checkAccess, loading: authLoading } = useProjectPermissions(projectId);

  if (!authLoading && !checkAccess('board')) {
    router.push(`/dashboard/projects/${projectId}`);
    return null;
  }
  if (authLoading) return null;

  // --- MODALS STATE ---
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showConceptModal, setShowConceptModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Group Form State
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupTags, setGroupTags] = useState<Tag[]>([]);
  const [newGroupTagName, setNewGroupTagName] = useState("");
  const [newGroupTagColor, setNewGroupTagColor] = useState("#6B7280");

  // Concept Form State
  const [currentConcept, setCurrentConcept] = useState<Concept | null>(null);
  const [conceptGroup, setConceptGroup] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");

  // Global Tags State (Settings)
  const [globalTagName, setGlobalTagName] = useState("");
  const [globalTagColor, setGlobalTagColor] = useState("#8b5cf6"); // Default purple

  const [draggingId, setDraggingId] = useState<string | null>(null);

  // INITIAL LOAD
useEffect(() => {
    async function load() {
      // 1. Get ID
      const { id } = await params;
      setProjectId(id);

      // 2. Get Auth User
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) { 
        window.location.href = "/auth/login"; 
        return; 
      }

      // 3. Fetch User Profile (Fix for Menu Name/Avatar)
      const { data: userProfile } = await supabase
        .from("users")
        .select("name, surname, metadata")
        .eq("id", authUser.id)
        .single();

      // 4. Create merged user object
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

      // 5. Fetch Project Data
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
        
      if (projectData) setProject(projectData);

      // 6. Fetch Groups
      const { data: groupsData } = await supabase
        .from("groups")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
        
      setGroups(groupsData ?? []);

      // 7. Fetch Concepts (Your existing logic)
      const { data: conceptsRaw, error: conceptsError } = await supabase
        .from("concepts")
        .select(`
          *,
          creator:users (
            id,
            name,
            surname,
            metadata
          )
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: true });

      // Safe fallback if Supabase returns null
      const safeData = Array.isArray(conceptsRaw) ? conceptsRaw : [];

      // Normalize creator structure safely
      const normalized = safeData.map((c: any) => ({
        ...c,
        creator: c?.creator ? {
          id: c.creator.id,
          name: c.creator.name,
          surname: c.creator.surname,
          metadata: c.creator.metadata || {}
        } : null
      }));

      // Fallback to original query ONLY IF supabase errored
      if (conceptsError) {
        const { data: fallbackData } = await supabase
          .from("concepts")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true });

        setConcepts(fallbackData ?? []);
      } else {
        setConcepts(normalized);
      }

      setLoading(false);
    }
    load();
  }, []);

  // --- PROJECT SETTINGS ACTIONS ---

  async function addGlobalTag() {
    if (!globalTagName.trim() || !project) return;
    
    const newTag: Tag = { name: globalTagName, color: globalTagColor, textColor: "#ffffff" };
    const currentGlobalTags = project.metadata?.global_tags || [];
    const updatedTags = [...currentGlobalTags, newTag];
    
    // Update local state immediately
    const updatedProject = { ...project, metadata: { ...project.metadata, global_tags: updatedTags } };
    setProject(updatedProject);
    setGlobalTagName("");

    // Update DB
    const { error } = await supabase
      .from("projects")
      .update({ metadata: updatedProject.metadata })
      .eq("id", projectId);
      
    if (error) alert("Error saving global tag");
  }

  async function removeGlobalTag(tagNameToRemove: string) {
    if (!project) return;
    const currentGlobalTags = project.metadata?.global_tags || [];
    const updatedTags = currentGlobalTags.filter((t: Tag) => t.name !== tagNameToRemove);

    const updatedProject = { ...project, metadata: { ...project.metadata, global_tags: updatedTags } };
    setProject(updatedProject);

    await supabase
      .from("projects")
      .update({ metadata: updatedProject.metadata })
      .eq("id", projectId);
  }

  // --- GROUP ACTIONS ---

  async function saveGroup() {
    if (!groupName.trim()) return;
    const metadata = { tags: groupTags };

    if (editingGroup) {
      const { error } = await supabase.from("groups").update({ name: groupName, metadata }).eq("id", editingGroup.id);
      if (!error) setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, name: groupName, metadata } : g));
    } else {
      const { data, error } = await supabase.from("groups").insert([{ project_id: projectId, name: groupName, metadata }]).select().limit(1);
      if (!error && data) setGroups(prev => [...prev, data[0]]);
    }
    closeGroupModal();
  }

  // NEW: Delete Group
  async function deleteGroup() {
    if (!editingGroup) return;
    if (!confirm("Are you sure you want to delete this list? All cards inside will be deleted.")) return;

    const groupId = editingGroup.id;
    const groupName = editingGroup.name;

    // Optimistic UI Update
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setConcepts(prev => prev.filter(c => c.group_name !== groupName));
    closeGroupModal();

    // DB Update
    await supabase.from("groups").delete().eq("id", groupId);
    // We also ensure cards are gone (if your DB doesn't cascade delete)
    await supabase.from("concepts").delete().eq("group_name", groupName);
  }

  // --- CONCEPT ACTIONS ---

  async function saveConcept() {
    if (!newTitle.trim() || !conceptGroup) return;
    const metadata = { tags: newTags, completed: currentConcept?.metadata?.completed ?? false };

    if (currentConcept) {
      const { error } = await supabase.from("concepts").update({ title: newTitle, description: newDescription, metadata, group_name: conceptGroup, updated_at: new Date().toISOString() }).eq("id", currentConcept.id);
      if (!error) setConcepts(prev => prev.map(c => c.id === currentConcept.id ? { ...c, title: newTitle, description: newDescription, metadata, group_name: conceptGroup } : c));
    } else {
      const { data, error } = await supabase.from("concepts").insert([{ project_id: projectId, title: newTitle, description: newDescription, group_name: conceptGroup, metadata, created_by: user?.id ?? null }]).select().limit(1);
      if (!error && data) setConcepts(prev => [...prev, data[0]]);
    }
    closeConceptModal();
  }

  // NEW: Delete Concept
  async function deleteConcept() {
    if (!currentConcept) return;
    if (!confirm("Are you sure you want to delete this card?")) return;

    const conceptId = currentConcept.id;

    // Optimistic UI Update
    setConcepts(prev => prev.filter(c => c.id !== conceptId));
    closeConceptModal();

    // DB Update
    await supabase.from("concepts").delete().eq("id", conceptId);
  }

  async function handleDrop(conceptId: string, groupId: string) {
    setDraggingId(null);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    setConcepts(prev => prev.map(c => c.id === conceptId ? { ...c, group_name: group.name } : c));
    await supabase.from("concepts").update({ group_name: group.name, updated_at: new Date().toISOString() }).eq("id", conceptId);
  }

  async function toggleCompleted(concept: Concept) {
    const newCompleted = !concept.metadata?.completed;
    const updatedMetadata = { ...concept.metadata, completed: newCompleted };
    setConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, metadata: updatedMetadata } : c));
    await supabase.from("concepts").update({ metadata: updatedMetadata, updated_at: new Date().toISOString() }).eq("id", concept.id);
  }

  // --- HELPERS ---
  const closeGroupModal = () => { setEditingGroup(null); setGroupName(""); setGroupTags([]); setShowGroupModal(false); };
  const closeConceptModal = () => { setCurrentConcept(null); setNewTitle(""); setNewDescription(""); setNewTags([]); setShowConceptModal(false); };

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
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      <Menu project={project} user={user} />

      <main className="flex-1 flex flex-col h-full ml-64 relative bg-gradient-to-br from-[#0a0a0a] to-[#111]">
        
        {/* Header */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
             {/* <h1 className="text-lg font-bold tracking-tight">{project?.name || "Project Board"}</h1>
             <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] uppercase font-bold tracking-wider rounded border border-white/5">Board View</span> */}
            <h1 className="text-xl font-bold tracking-tight">Board <span className="text-white/30 text-lg font-light">Overview</span></h1>

            {/* <h1 className="text-xl font-bold tracking-tight">{project.name} <span className="text-white/30 text-lg font-light ml-2">Board</span></h1> */}

          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGroupModal(true)} 
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded shadow-sm shadow-purple-900/20 transition-colors"
            >
              <Plus size={16} /> Add List
            </button>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/60 hover:text-white transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Board Canvas */}
        <div className="flex-1 relative w-full">
          <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
            <div className="h-full flex items-start px-6 py-6 gap-6 min-w-max">
              
              {groups.map(group => (
                <div 
                  key={group.id} 
                  className="w-80 flex-shrink-0 max-h-full flex flex-col bg-[#161616] rounded-xl border border-white/5 shadow-xl"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { const id = e.dataTransfer.getData("text/plain"); if (id) handleDrop(id, group.id); }}
                >
                   <div className="p-3 pl-4 flex justify-between items-start group cursor-grab active:cursor-grabbing">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{group.name}</h2>
                        {/* NEW CODE: Full pill tags with text */}
                        <div className="flex flex-wrap gap-1.5">
                          {group.metadata?.tags?.map((t, i) => (
                            <span 
                              key={i} 
                              style={{ backgroundColor: `${t.color}20`, color: t.color }} 
                              className="text-[10px] font-bold px-2 py-0.5 rounded border border-transparent"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => { setEditingGroup(group); setGroupName(group.name); setGroupTags(group.metadata?.tags ?? []); setShowGroupModal(true); }} className="text-white/20 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
                        <Settings size={14} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 custom-scrollbar">
                      {concepts.filter(c => c.group_name === group.name).map(c => (
                        <div 
                          key={c.id} 
                          draggable 
                          onDragStart={e => { setDraggingId(c.id); e.dataTransfer.setData("text/plain", c.id); }}
                          onDragEnd={() => setDraggingId(null)}
                          onClick={() => { setCurrentConcept(c); setConceptGroup(group.name); setNewTitle(c.title); setNewDescription(c.description ?? ""); setNewTags(c.metadata?.tags ?? []); setShowConceptModal(true); }}
                          className={`group relative p-3 bg-[#222] hover:bg-[#2a2a2a] rounded-lg shadow-sm border border-transparent hover:border-white/10 cursor-pointer transition-all duration-200 ${draggingId === c.id ? "opacity-50" : "opacity-100"}`}
                        >
                          <h3 className={`text-sm font-medium leading-snug ${c.metadata?.completed ? "text-white/40 line-through" : "text-gray-100"}`}>{c.title}</h3>
                          {c.metadata?.tags && c.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {c.metadata.tags.map((t, idx) => (
                                <span key={idx} style={{ backgroundColor: `${t.color}20`, color: t.color }} className="text-[10px] font-bold px-2 py-0.5 rounded border border-transparent">
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {c.description && <div className="mt-2 text-xs text-white/50 line-clamp-2">{c.description}</div>}
                          {/* pfp_ */}
                            {/* Top-right: conditional row if no description and no tags */}
<div className="absolute top-2 right-2 z-20 flex items-center gap-2">
  {(!c.metadata?.tags || c.metadata.tags.length === 0) ? (
    // Top row inline: button left, avatar right (description can exist)
    <>
      <button
        onClick={(e) => { e.stopPropagation(); toggleCompleted(c); }}
        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
          c.metadata?.completed
            ? "bg-green-900/50 text-green-500"
            : "bg-black/40 text-white/20 opacity-0 group-hover:opacity-100 hover:bg-green-900/30 hover:text-green-400"
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      <div className="relative group/avatar">
        <img
          src={c.creator?.metadata?.avatar_url}
          className="w-7 h-7 rounded-full border border-white/10 shadow-sm"
        />
        {(c.creator?.name || c.creator?.surname) && (
          <div className="absolute top-8 right-0 whitespace-nowrap px-3 py-2 rounded-md bg-[#111] text-white text-xs opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none">
            {c.creator.name} {c.creator.surname}
          </div>
        )}
      </div>
    </>
  ) : (
    // Default: avatar top-right, button bottom-right
    <>
      {c.creator?.metadata?.avatar_url && (
        <div className="relative group/avatar">
          <img
            src={c.creator.metadata.avatar_url}
            className="w-7 h-7 rounded-full border border-white/10 shadow-sm"
          />
          {(c.creator.name || c.creator.surname) && (
            <div className="absolute top-[-2] right-10 whitespace-nowrap px-3 py-2 rounded-md bg-[#111] text-white text-xs opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none">
              {c.creator.name} {c.creator.surname}
            </div>
          )}
        </div>
      )}
    </>
  )}
</div>

{/* Bottom-right check button for normal cards (only if there are tags) */}
{(c.metadata?.tags && c.metadata.tags.length > 0) && (
  <button
    onClick={(e) => { e.stopPropagation(); toggleCompleted(c); }}
    className={`absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 z-10 ${
      c.metadata?.completed
        ? "bg-green-900/50 text-green-500 opacity-100"
        : "bg-black/40 text-white/20 opacity-0 group-hover:opacity-100 hover:bg-green-900/30 hover:text-green-400"
    }`}
  >
    <Check size={12} strokeWidth={3} />
  </button>
)}
                        </div>
                      ))}
                    </div>
                    <div className="p-2 pt-0">
                      <button onClick={() => { setCurrentConcept(null); setConceptGroup(group.name); setNewTitle(""); setNewDescription(""); setNewTags([]); setShowConceptModal(true); }} className="w-full py-2 px-2 text-left text-white/50 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors text-sm">
                        <Plus size={16} /> Add a card
                      </button>
                    </div>
                </div>
              ))}

              {/* "Add List" Placeholder */}
              <div className="w-80 flex-shrink-0">
                 <button onClick={() => setShowGroupModal(true)} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 hover:border-white/20 rounded-xl text-white/50 hover:text-white transition-all flex items-center justify-center gap-2">
                   <Plus size={18} /> Add another list
                 </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* --- MODAL: SETTINGS --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
           <div className="bg-[#161616] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#161616]">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                   <Settings size={18} className="text-purple-500" /> Board Settings
                </h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
             </div>

             <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                {/* STATS */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Layout size={20} /></div>
                      <div>
                         <div className="text-2xl font-bold text-white">{groups.length}</div>
                         <div className="text-xs text-white/40 font-medium uppercase">Lists</div>
                      </div>
                   </div>
                   <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><FileText size={20} /></div>
                      <div>
                         <div className="text-2xl font-bold text-white">{concepts.length}</div>
                         <div className="text-xs text-white/40 font-medium uppercase">Cards</div>
                      </div>
                   </div>
                </div>

                {/* GLOBAL TAGS MANAGER */}
                <div>
                   <h3 className="text-xs font-bold text-white/40 uppercase mb-3 flex items-center gap-2">
                      <TagIcon size={12} /> Global Tags Library
                   </h3>
                   
                   <div className="space-y-2 mb-4">
                      {project?.metadata?.global_tags?.length > 0 ? (
                        project.metadata.global_tags.map((tag: Tag, idx: number) => (
                           <div key={idx} className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg border border-white/5 group">
                              <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                 <span className="text-sm text-white font-medium">{tag.name}</span>
                              </div>
                              <button onClick={() => removeGlobalTag(tag.name)} className="text-white/20 hover:text-red-500 transition-colors">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        ))
                      ) : (
                        <div className="text-center py-6 border border-dashed border-white/10 rounded-lg text-white/30 text-sm">
                           No global tags created yet.
                        </div>
                      )}
                   </div>

                   <div className="flex gap-2 p-2 bg-[#0a0a0a] rounded-lg border border-white/10">
                      <input 
                        type="text" 
                        className="bg-transparent text-sm p-1 flex-1 outline-none" 
                        placeholder="New global tag name..." 
                        value={globalTagName} 
                        onChange={e => setGlobalTagName(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') addGlobalTag(); }}
                      />
                      <input 
                        type="color" 
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-none self-center" 
                        value={globalTagColor} 
                        onChange={e => setGlobalTagColor(e.target.value)} 
                      />
                      <button 
                        onClick={addGlobalTag}
                        disabled={!globalTagName}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium transition-colors"
                      >
                        Create
                      </button>
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* --- MODAL: ADD/EDIT LIST (Group) --- */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#161616] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">{editingGroup ? "Edit List" : "Add List"}</h2>
              <button onClick={closeGroupModal} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">List Name</label>
                <input autoFocus className="w-full bg-[#0a0a0a] text-white p-3 rounded-lg border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all" placeholder="e.g. To Do, In Progress" value={groupName} onChange={e => setGroupName(e.target.value)} />
              </div>
              <div>
                 <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">List Tags</label>
                 <div className="flex gap-2 mb-3 flex-wrap min-h-[30px]">
                  {groupTags.map((t, idx) => (
                    <span key={idx} style={{ backgroundColor: t.color, color: t.textColor ?? "#fff" }} className="text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-2">
                      {t.name}<button onClick={() => setGroupTags(prev => prev.filter((_, i) => i !== idx))}><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 p-2 bg-[#0a0a0a] rounded-lg border border-white/10">
                  <input type="text" className="bg-transparent text-sm p-1 flex-1 outline-none" placeholder="New tag name..." value={newGroupTagName} onChange={e => setNewGroupTagName(e.target.value)} />
                  <input type="color" className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" value={newGroupTagColor} onChange={e => setNewGroupTagColor(e.target.value)} />
                  <button onClick={() => { if(newGroupTagName){ setGroupTags([...groupTags,{name:newGroupTagName,color:newGroupTagColor,textColor:"#fff"}]); setNewGroupTagName(""); } }} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium">Add</button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#0a0a0a]/50 border-t border-white/5 flex justify-between items-center gap-3">
              {editingGroup && (
                 <button onClick={deleteGroup} className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors">
                    <Trash2 size={16} /> Delete
                 </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={closeGroupModal} className="px-4 py-2 text-white/60 hover:text-white text-sm font-medium">Cancel</button>
                <button onClick={saveGroup} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-900/20 transition-all">Save List</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD/EDIT CARD (Concept) --- */}
 {showConceptModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
    <div className="bg-[#161616] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      
      {/* --- Modal Header --- */}
      <div className="p-6 border-b border-white/5 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-white">{currentConcept ? "Edit Card" : "New Card"}</h2>
          <p className="text-xs text-white/40 mt-0.5">
            In list <span className="text-white/70 font-medium">{conceptGroup}</span>
          </p>

          {/* --- Creator + Timestamps --- */}
          {currentConcept?.creator && (
            <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
              {currentConcept.creator.metadata?.avatar_url && (
                <img
                  src={currentConcept.creator.metadata.avatar_url}
                  className="w-5 h-5 rounded-full border border-white/10 shadow-sm "
                />
              )}
              <span>
                Created by{" "}
                <strong>
                  {currentConcept.creator.name || currentConcept.creator.id}{" "}
                  {currentConcept.creator.surname || ""}
                </strong>
                , {currentConcept.created_at ? new Date(currentConcept.created_at).toLocaleString() : "unknown"}
              </span>
              {currentConcept.updated_at && (
                <span className="ml-2">
                  • Updated: {new Date(currentConcept.updated_at).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        <button onClick={closeConceptModal} className="text-white/40 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* --- Modal Body --- */}
      <div className="p-6 space-y-5">
        <input
          autoFocus
          className="w-full bg-transparent text-xl font-semibold placeholder:text-white/20 outline-none border-none p-0 focus:ring-0"
          placeholder="Card Title"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Description</label>
          <textarea
            className="w-full bg-[#0a0a0a] text-white/90 text-sm p-4 rounded-lg border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-none min-h-[120px]"
            placeholder="Add a more detailed description..."
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Tags</label>

          {/* Active Tags */}
          <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
            {newTags.map((t, idx) => (
              <span
                key={idx}
                style={{ backgroundColor: t.color, color: t.textColor ?? "#fff" }}
                className="text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-2"
              >
                {t.name}
                <button onClick={() => setNewTags(prev => prev.filter((_, i) => i !== idx))}><X size={12} /></button>
              </span>
            ))}
          </div>

          {/* Quick Add Global Tags */}
          {project?.metadata?.global_tags && project.metadata.global_tags.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-white/30 uppercase font-bold mb-2">Quick Add Global Tags</p>
              <div className="flex flex-wrap gap-2">
                {project.metadata.global_tags.map((gt: Tag, idx: number) => {
                  const isAlreadyAdded = newTags.some(t => t.name === gt.name);
                  if (isAlreadyAdded) return null;
                  return (
                    <button
                      key={idx}
                      onClick={() => setNewTags([...newTags, gt])}
                      className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 opacity-70 hover:opacity-100"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gt.color }}></div>
                      {gt.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual Tag Creation */}
          <div className="flex gap-2 items-center">
            <div className="flex-1 flex gap-2 bg-[#0a0a0a] p-1.5 rounded-lg border border-white/10">
              <input
                type="text"
                className="bg-transparent text-sm p-1 flex-1 outline-none ml-1"
                placeholder="Or create new tag..."
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && newTagName) { setNewTags([...newTags,{name:newTagName,color:newTagColor,textColor:"#fff"}]); setNewTagName(""); } }}
              />
              <input
                type="color"
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none self-center"
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
              />
            </div>
            <button
              onClick={() => { if(newTagName){ setNewTags([...newTags,{name:newTagName,color:newTagColor,textColor:"#fff"}]); setNewTagName(""); } }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* --- Modal Footer --- */}
      <div className="p-4 bg-[#0a0a0a]/50 border-t border-white/5 flex justify-between items-center gap-3">
        {currentConcept && (
          <button
            onClick={deleteConcept}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            onClick={closeConceptModal}
            className="px-4 py-2 text-white/60 hover:text-white text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveConcept}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-900/20 transition-all"
          >
            Save Card
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}