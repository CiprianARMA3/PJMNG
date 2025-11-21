"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Menu from "../components/menu";
import { Filter } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Tag = { name: string; color: string; textColor?: string };

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
  metadata?: { tags?: Tag[] } | null;
  created_at?: string;
  updated_at?: string;
};

export default function Board({ params }: PageProps) {
  const supabase = createClient();

  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals and state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupTags, setGroupTags] = useState<Tag[]>([]);
  const [newGroupTagName, setNewGroupTagName] = useState("");
  const [newGroupTagColor, setNewGroupTagColor] = useState("#888888");
  const [newGroupTagTextColor, setNewGroupTagTextColor] = useState("#ffffff");

  const [showConceptModal, setShowConceptModal] = useState(false);
  const [currentConcept, setCurrentConcept] = useState<Concept | null>(null);
  const [conceptGroup, setConceptGroup] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#888888");
  const [newTagTextColor, setNewTagTextColor] = useState("#ffffff");

  const [collapsedGroups, setCollapsedGroups] = useState<{ [group: string]: boolean }>({});

  // INITIAL LOAD
  useEffect(() => {
    async function load() {
      const { id } = await params;
      setProjectId(id);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { window.location.href = "/auth/login"; return; }
      setUser(user);

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (projectError || !projectData) { window.location.href = "/dashboard"; return; }
      setProject(projectData);

      const { data: groupsData } = await supabase
        .from("groups")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
      setGroups(groupsData ?? []);

      const { data: conceptsData } = await supabase
        .from("concepts")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
      setConcepts(conceptsData ?? []);

      setLoading(false);
    }

    load();
  }, []);

  // CREATE/UPDATE GROUP
  async function saveGroup() {
    if (!groupName.trim()) return;

    const metadata = { tags: groupTags };

    if (editingGroup) {
      const { error } = await supabase
        .from("groups")
        .update({ name: groupName, metadata })
        .eq("id", editingGroup.id);
      if (error) { alert("Error updating group"); return; }
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, name: groupName, metadata } : g));
    } else {
      const { data, error } = await supabase
        .from("groups")
        .insert([{ project_id: projectId, name: groupName, metadata }])
        .select()
        .limit(1);
      if (error || !data || data.length === 0) { alert("Error creating group"); return; }
      setGroups(prev => [...prev, data[0]]);
    }

    setEditingGroup(null);
    setGroupName("");
    setGroupTags([]);
    setShowGroupModal(false);
  }

  // CREATE/UPDATE CONCEPT
  async function saveConcept() {
    if (!newTitle.trim() || !conceptGroup) return;
    const metadata = { tags: newTags };

    if (currentConcept) {
      const { error } = await supabase
        .from("concepts")
        .update({ title: newTitle, description: newDescription, metadata, group_name: conceptGroup, updated_at: new Date().toISOString() })
        .eq("id", currentConcept.id);
      if (error) { alert("Error updating concept"); return; }
      setConcepts(prev => prev.map(c => c.id === currentConcept.id ? { ...c, title: newTitle, description: newDescription, metadata } : c));
    } else {
      const { data, error } = await supabase
        .from("concepts")
        .insert([{ project_id: projectId, title: newTitle, description: newDescription, group_name: conceptGroup, metadata, created_by: user?.id ?? null }])
        .select()
        .limit(1);
      if (error || !data || data.length === 0) { alert("Error creating concept"); return; }
      setConcepts(prev => [...prev, data[0]]);
    }

    setCurrentConcept(null);
    setNewTitle("");
    setNewDescription("");
    setNewTags([]);
    setShowConceptModal(false);
  }

  // DRAG & DROP
  async function handleDrop(conceptId: string, groupName: string) {
    const { error } = await supabase
      .from("concepts")
      .update({ group_name: groupName, updated_at: new Date().toISOString() })
      .eq("id", conceptId);
    if (error) { alert("Error moving concept"); return; }
    setConcepts(prev => prev.map(c => c.id === conceptId ? { ...c, group_name: groupName } : c));
  }

  function groupConcepts(group: Group) {
    return concepts.filter(c => c.group_name === group.name);
  }

  if (loading) return <div className="text-white p-8">Loading board...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex relative">
      <Menu project={project} user={user} />

      <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#0a0a0a] p-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Board</h1>
          <button onClick={() => setShowGroupModal(true)} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
            + New Group
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-[#111] rounded-xl border border-white/10 flex flex-col p-4"
                 onDragOver={e => e.preventDefault()}
                 onDrop={e => { const id = e.dataTransfer.getData("text/plain"); if (id) handleDrop(id, group.name); }}>

              {/* Group header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{group.name}</h2>
                  {group.metadata?.tags?.map((t, i) => (
                    <span key={i} style={{ backgroundColor: t.color, color: t.textColor ?? "#fff" }} className="text-xs px-2 py-0.5 rounded-full">{t.name}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Filter size={18} className={`cursor-pointer hover:text-white/80 ${collapsedGroups[group.name] ? "rotate-90 transition-transform" : "transition-transform"}`}
                          onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.name]: !prev[group.name] }))} />
                  <button onClick={() => { setEditingGroup(group); setGroupName(group.name); setGroupTags(group.metadata?.tags ?? []); setShowGroupModal(true); }}
                          className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 text-sm">Edit</button>
                </div>
              </div>

              {/* Concept cards */}
              {!collapsedGroups[group.name] && (
                <div className="flex-1 flex flex-col space-y-4 overflow-auto pr-1">
                  {groupConcepts(group).map(c => (
                    <div key={c.id} draggable onDragStart={e => e.dataTransfer.setData("text/plain", c.id)}
                         onClick={() => { setCurrentConcept(c); setConceptGroup(group.name); setNewTitle(c.title); setNewDescription(c.description ?? ""); setNewTags(c.metadata?.tags ?? []); setShowConceptModal(true); }}
                         className="p-4 bg-[#1a1a1a] rounded-xl border border-white/10 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{c.title}</h3>
                        <div className="flex gap-1">
                          {c.metadata?.tags?.map((t, idx) => (
                            <span key={idx} style={{ backgroundColor: t.color, color: t.textColor ?? "#fff" }} className="text-xs px-2 py-0.5 rounded-full">{t.name}</span>
                          ))}
                        </div>
                      </div>
                      {c.description && <p className="text-sm text-white/60 mt-2 line-clamp-3 break-words">{c.description}</p>}
                    </div>
                  ))}

                  <button onClick={() => { setCurrentConcept(null); setConceptGroup(group.name); setNewTitle(""); setNewDescription(""); setNewTags([]); setShowConceptModal(true); }}
                          className="mt-auto w-full py-2 text-white/70 hover:text-white bg-white/10 rounded-lg border border-white/20">+ Add Card</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] p-6 rounded-xl border border-white/10 w-[420px]">
            <h2 className="text-xl font-semibold mb-4">{editingGroup ? "Edit Group" : "New Group"}</h2>
            <input className="w-full mb-2 bg-[#222] p-3 rounded-lg border border-white/10" placeholder="Group Name" value={groupName} onChange={e => setGroupName(e.target.value)} />
            <div className="flex gap-2 mb-2 flex-wrap">
              {groupTags.map((t, idx) => (
                <span key={idx} style={{ backgroundColor: t.color, color: t.textColor ?? "#fff" }} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1">{t.name}<button onClick={() => setGroupTags(prev => prev.filter((_, i) => i !== idx))}>×</button></span>
              ))}
            </div>
            <div className="flex gap-1 mb-4">
              <input type="text" className="bg-[#222] p-2 rounded-lg border border-white/10 flex-1" placeholder="Tag Name" value={newGroupTagName} onChange={e => setNewGroupTagName(e.target.value)} />
              <input type="color" className="w-10 h-10 p-0 border-none" value={newGroupTagColor} onChange={e => setNewGroupTagColor(e.target.value)} />
              <input type="color" className="w-10 h-10 p-0 border-none" value={newGroupTagTextColor} onChange={e => setNewGroupTagTextColor(e.target.value)} />
              <button onClick={() => { if(newGroupTagName){setGroupTags([...groupTags,{name:newGroupTagName,color:newGroupTagColor,textColor:newGroupTagTextColor}]); setNewGroupTagName("");} }} className="px-3 py-1 bg-white/10 rounded-lg">Add Tag</button>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 bg-white/10 rounded-lg">Cancel</button>
              <button onClick={saveGroup} className="px-4 py-2 bg-white text-black font-semibold rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Concept Modal */}
      {showConceptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] p-6 rounded-xl border border-white/10 w-[420px]">
            <h2 className="text-xl font-semibold mb-4">{currentConcept ? "Edit Card" : "New Card"}</h2>
            <input className="w-full mb-2 bg-[#222] p-3 rounded-lg border border-white/10" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <textarea className="w-full mb-2 bg-[#222] p-3 rounded-lg border border-white/10" placeholder="Description" rows={3} value={newDescription} onChange={e => setNewDescription(e.target.value)} />
            <div className="flex gap-2 mb-2 flex-wrap">
              {newTags.map((t, idx) => (
                <span key={idx} style={{ backgroundColor: t.color, color: t.textColor ?? "#fff" }} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1">{t.name}<button onClick={() => setNewTags(prev => prev.filter((_, i) => i !== idx))}>×</button></span>
              ))}
            </div>
            <div className="flex gap-1 mb-4">
              <input type="text" className="bg-[#222] p-2 rounded-lg border border-white/10 flex-1" placeholder="Tag Name" value={newTagName} onChange={e => setNewTagName(e.target.value)} />
              <input type="color" className="w-10 h-10 p-0 border-none" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} />
              <input type="color" className="w-10 h-10 p-0 border-none" value={newTagTextColor} onChange={e => setNewTagTextColor(e.target.value)} />
              <button onClick={() => { if(newTagName){setNewTags([...newTags,{name:newTagName,color:newTagColor,textColor:newTagTextColor}]); setNewTagName("");} }} className="px-3 py-1 bg-white/10 rounded-lg">Add Tag</button>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConceptModal(false)} className="px-4 py-2 bg-white/10 rounded-lg">Cancel</button>
              <button onClick={saveConcept} className="px-4 py-2 bg-white text-black font-semibold rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
