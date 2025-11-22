"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Calendar as CalendarIcon, 
  Trash2,
  Maximize2,
  Tag as TagIcon
} from "lucide-react";
import { useParams } from "next/navigation";

// --- TYPES ---
type Tag = { name: string; color: string; textColor?: string };

type Creator = {
  id: string;
  name: string | null;
  surname: string | null;
  metadata: { avatar_url?: string; [key: string]: any };
}

type Concept = {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  group_name?: string | null;
  created_by?: string | null;
  metadata?: { tags?: Tag[]; completed?: boolean; due_date?: string } | null;
  created_at?: string;
  updated_at?: string;
  creator: Creator | null;
};

export default function Calendar() {
  const supabase = createClient();
  const params = useParams();
  const projectId = params.id as string;

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Card Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentConcept, setCurrentConcept] = useState<Concept | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  
  // Tag Editing State
  const [editTags, setEditTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1"); // Default Indigo

  // Day Zoom Modal State
  const [zoomedDay, setZoomedDay] = useState<Date | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchConcepts();
  }, [projectId]);

  async function fetchConcepts() {
    if (!projectId) return;
    
    const { data: conceptsRaw, error } = await supabase
      .from("concepts")
      .select(`*, creator:users ( id, name, surname, metadata )`)
      .eq("project_id", projectId);

    if (!error && conceptsRaw) {
      const normalized = conceptsRaw.map((c: any) => ({
        ...c,
        creator: c?.creator ? {
          id: c.creator.id,
          name: c.creator.name,
          surname: c.creator.surname,
          metadata: c.creator.metadata || {}
        } : null
      }));
      setConcepts(normalized);
    }
    setLoading(false);
  }

  // --- ACTIONS ---
  
  async function saveConcept() {
    if (!currentConcept || !newTitle.trim()) return;
    
    // Create updated metadata preserving other fields (like completed status)
    const updatedMetadata = { 
        ...currentConcept.metadata, 
        tags: editTags 
    };

    const updatedConcept = { 
        ...currentConcept, 
        title: newTitle, 
        description: newDescription,
        metadata: updatedMetadata
    };

    setConcepts(prev => prev.map(c => c.id === currentConcept.id ? updatedConcept : c));
    setShowEditModal(false);

    await supabase
      .from("concepts")
      .update({ 
          title: newTitle, 
          description: newDescription, 
          metadata: updatedMetadata,
          updated_at: new Date().toISOString() 
      })
      .eq("id", currentConcept.id);
  }

  async function deleteConcept() {
    if(!currentConcept) return;
    if(!confirm("Delete this card?")) return;
    setConcepts(prev => prev.filter(c => c.id !== currentConcept.id));
    setShowEditModal(false);
    await supabase.from("concepts").delete().eq("id", currentConcept.id);
  }

  // Tag Actions
  function addTag() {
    if (!newTagName.trim()) return;
    setEditTags([...editTags, { name: newTagName, color: newTagColor, textColor: "#fff" }]);
    setNewTagName("");
  }

  function removeTag(indexToRemove: number) {
    setEditTags(editTags.filter((_, idx) => idx !== indexToRemove));
  }

  // --- CALENDAR LOGIC ---

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDayOfWeek = firstDay.getDay() || 7; 
    startDayOfWeek -= 1; 
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) { days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) }); }
    for (let i = 1; i <= lastDay.getDate(); i++) { days.push({ day: i, currentMonth: true, date: new Date(year, month, i) }); }
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) { days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) }); }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  
  const openConcept = (c: Concept) => { 
    setCurrentConcept(c); 
    setNewTitle(c.title); 
    setNewDescription(c.description || ""); 
    setEditTags(c.metadata?.tags || []); // Load existing tags
    setNewTagName(""); // Reset input
    setShowEditModal(true); 
  };


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
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden relative">
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="flex-none px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {currentDate.toLocaleString('default', { month: 'long' })} 
            <span className="text-white/30 font-light">{currentDate.getFullYear()}</span>
          </h2>
          <div className="flex items-center bg-[#161616] rounded-lg border border-white/10 p-0.5">
             <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
             <button onClick={goToToday} className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors">Today</button>
             <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="flex-none grid grid-cols-7 border-b border-white/5 bg-[#0a0a0a]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-white/30">
            {day}
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-[#161616] gap-px border-b border-white/5 min-h-0">
        {calendarDays.map((cell, idx) => {
          const dayConcepts = concepts.filter(c => {
             const targetDate = c.created_at ? new Date(c.created_at) : new Date();
             return isSameDay(targetDate, cell.date);
          });
          const isToday = isSameDay(cell.date, new Date());
          
          const MAX_VISIBLE = 3;
          const visibleConcepts = dayConcepts.slice(0, MAX_VISIBLE);
          const hiddenCount = dayConcepts.length - MAX_VISIBLE;

          return (
            <div 
              key={idx} 
              className={`
                relative bg-[#0a0a0a] p-2 flex flex-col gap-1 group transition-colors hover:bg-[#0f0f0f] min-h-0 overflow-hidden
                ${!cell.currentMonth ? "bg-[#0a0a0a]/50 text-white/20" : "text-white"}
              `}
              onClick={(e) => { if(e.target === e.currentTarget) setZoomedDay(cell.date); }}
            >
              {/* Date Header */}
              <div className="flex-none flex justify-between items-start mb-1">
                 <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-white/40 group-hover:text-white"}
                 `}>
                    {cell.day}
                    {cell.day === 1 && cell.currentMonth && <span className="ml-1 text-[10px] opacity-50">{cell.date.toLocaleString('default', { month: 'short' })}</span>}
                 </span>
                 <button 
                    onClick={(e) => { e.stopPropagation(); setZoomedDay(cell.date); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"
                 >
                    <Maximize2 size={12} />
                 </button>
              </div>

              {/* Cards List */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                 {visibleConcepts.map(c => (
                    <div 
                      key={c.id}
                      onClick={(e) => { e.stopPropagation(); openConcept(c); }}
                      className={`
                        cursor-pointer p-2 rounded border border-white/5 hover:border-white/20 transition-all text-xs shadow-sm group/card flex-shrink-0
                        ${c.metadata?.completed ? "bg-[#111] opacity-60" : "bg-[#1a1a1a] hover:bg-[#222]"}
                      `}
                    >
                       {c.metadata?.tags && c.metadata.tags.length > 0 && (
                         <div className="flex flex-wrap gap-1 mb-1.5">
                           {c.metadata.tags.map((t, i) => (
                             <div key={i} className="h-0.5 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                           ))}
                         </div>
                       )}
                       <div className="font-medium truncate leading-tight text-gray-200">{c.title}</div>
                    </div>
                 ))}
                 
                 {hiddenCount > 0 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setZoomedDay(cell.date); }}
                        className="mt-auto text-[10px] font-bold text-white/40 hover:text-white text-left hover:bg-white/5 p-1 rounded transition-colors"
                    >
                        + {hiddenCount} more cards...
                    </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DAY ZOOM MODAL --- */}
      {zoomedDay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[40] p-4 animate-in fade-in duration-200">
            <div className="bg-[#161616] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#161616]">
                    <div>
                        <div className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">
                            {zoomedDay.getFullYear()}
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                           {zoomedDay.toLocaleString('default', { weekday: 'long' })}, {zoomedDay.getDate()} {zoomedDay.toLocaleString('default', { month: 'long' })}
                        </h2>
                    </div>
                    <button onClick={() => setZoomedDay(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto scrollbar-hide bg-[#0a0a0a]">
                     <div className="space-y-3">
                        {concepts
                            .filter(c => {
                                const targetDate = c.created_at ? new Date(c.created_at) : new Date();
                                return isSameDay(targetDate, zoomedDay);
                            })
                            .map(c => (
                                <div 
                                    key={c.id}
                                    onClick={() => openConcept(c)}
                                    className={`
                                        cursor-pointer p-3 rounded-xl border border-white/5 hover:border-white/20 transition-all group/card flex flex-col gap-2
                                        ${c.metadata?.completed ? "bg-[#111] opacity-60" : "bg-[#161616] hover:bg-[#222]"}
                                    `}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <h3 className={`font-medium text-sm flex-1 ${c.metadata?.completed ? "line-through text-white/30" : "text-gray-100"}`}>
                                            {c.title}
                                        </h3>
                                        {c.metadata?.tags && c.metadata.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                                                {c.metadata.tags.map((t, i) => (
                                                    <span key={i} style={{ backgroundColor: t.color, color: t.textColor || "#fff" }} className="text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                                                        {t.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {c.description && <p className="text-xs text-white/40 line-clamp-2">{c.description}</p>}
                                    <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-1">
                                        <div className="flex items-center gap-2 pt-2">
                                            {c.creator?.metadata?.avatar_url && (
                                                <img src={c.creator.metadata.avatar_url} className="w-5 h-5 rounded-full border border-white/10" alt="" />
                                            )}
                                            <span className="text-[10px] text-white/30">
                                                {c.creator?.name || "Unknown"}
                                            </span>
                                        </div>
                                        {c.group_name && <span className="text-[9px] uppercase tracking-wide border border-white/10 px-1.5 py-0.5 rounded text-white/30 mt-2">{c.group_name}</span>}
                                    </div>
                                </div>
                            ))
                        }
                        {concepts.filter(c => {
                             const targetDate = c.created_at ? new Date(c.created_at) : new Date();
                             return isSameDay(targetDate, zoomedDay);
                        }).length === 0 && (
                            <div className="text-center py-12 text-white/20 text-sm border-2 border-dashed border-white/5 rounded-xl">
                                No cards for this day.
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* --- EDIT CARD MODAL --- */}
      {showEditModal && currentConcept && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[50] p-4 animate-in fade-in duration-200">
            <div className="bg-[#161616] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-white/40 uppercase font-bold tracking-wider mb-1">
                            <CalendarIcon size={12} /> 
                            {currentConcept.created_at && new Date(currentConcept.created_at).toLocaleDateString()}
                        </div>
                        <h2 className="text-lg font-semibold text-white">Edit Card</h2>
                    </div>
                    <button onClick={() => setShowEditModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
                    {/* Title Input */}
                    <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Title</label>
                        <input 
                            className="w-full bg-[#0a0a0a] text-white p-3 rounded-lg border border-white/10 focus:border-purple-500 outline-none transition-all"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Description</label>
                        <textarea 
                            className="w-full bg-[#0a0a0a] text-white/80 p-3 rounded-lg border border-white/10 focus:border-purple-500 outline-none transition-all min-h-[100px] resize-none"
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                        />
                    </div>

                    {/* --- NEW: TAGS SECTION --- */}
                    <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block flex items-center gap-2">
                            <TagIcon size={12} /> Tags
                        </label>
                        
                        {/* Active Tags List */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {editTags.map((tag, idx) => (
                                <span 
                                    key={idx} 
                                    style={{ backgroundColor: tag.color, color: tag.textColor || "#fff" }} 
                                    className="text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-2 shadow-sm"
                                >
                                    {tag.name}
                                    <button 
                                        onClick={() => removeTag(idx)} 
                                        className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add New Tag Input */}
                        <div className="flex gap-2 items-center bg-[#0a0a0a] p-1.5 rounded-lg border border-white/10">
                            <input 
                                type="text" 
                                className="bg-transparent text-sm p-1 flex-1 outline-none placeholder:text-white/20" 
                                placeholder="Add a tag..." 
                                value={newTagName} 
                                onChange={e => setNewTagName(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') addTag(); }}
                            />
                            <input 
                                type="color" 
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" 
                                value={newTagColor} 
                                onChange={e => setNewTagColor(e.target.value)} 
                            />
                            <button 
                                onClick={addTag} 
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                    {/* --- END TAGS SECTION --- */}

                    {/* Info Footer inside Body */}
                    <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                                {currentConcept.creator?.name?.[0] || "U"}
                             </div>
                             <div>
                                <div className="text-xs text-white/40 uppercase">Created By</div>
                                <div className="text-sm font-medium">{currentConcept.creator?.name || "Unknown"}</div>
                             </div>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div>
                             <div className="text-xs text-white/40 uppercase">List</div>
                             <div className="text-sm font-medium">{currentConcept.group_name}</div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-[#0a0a0a]/50 border-t border-white/5 flex justify-between items-center">
                    <button onClick={deleteConcept} className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors">
                        <Trash2 size={16} /> Delete
                    </button>
                    <div className="flex gap-3">
                        <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-white/60 hover:text-white text-sm font-medium">Cancel</button>
                        <button onClick={saveConcept} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-900/20 transition-all">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}