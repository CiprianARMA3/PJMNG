"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Menu from "../../components/menu";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

import {
    Calendar as CalendarIcon, Table as TableIcon,
    Plus, X, ChevronLeft, ChevronRight,
    Link as LinkIcon, Clock, Trash2,
    Video, UserPlus, UserMinus, ExternalLink,
    Minimize2, Maximize2, Tag as TagIcon,
    Loader2, Check, Filter, Search, Settings
} from "lucide-react";

// --- HELPERS ---
const getContrastColor = (hexcolor: string) => {
    if (!hexcolor) return '#000000';
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

const getRoleBadgeStyle = (role: string = 'Viewer') => {
    switch (role.toLowerCase()) {
        case 'owner': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'admin': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'editor': return 'bg-green-500/10 text-green-400 border-green-500/20';
        default: return 'bg-white/5 text-white/40 border-white/10';
    }
};

// --- TYPES ---
type Tag = { name: string; color: string; textColor?: string };

type UserProfile = {
    id: string;
    name: string | null;
    email?: string;
    metadata: { avatar_url?: string;[key: string]: any };
};

type ProjectMember = UserProfile & {
    role: string;
};

type LinkedIssue = {
    id: string;
    title: string;
    type: string;
    metadata: { tags?: Tag[];[key: string]: any };
};

type Task = {
    id: string;
    project_id: string;
    title: string;
    description?: string | null;
    status: string;
    task_date: string;
    start_time: string;
    end_time: string;
    issue_id?: string | null;
    issue?: LinkedIssue | null;
    creator_id: string | null;
    creator?: UserProfile | null;
    metadata: {
        meeting_link?: string;
        attendees?: string[];
        tags?: Tag[];
        [key: string]: any;
    };
};

export default function CalendarPage() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { checkAccess, loading: authLoading } = useProjectPermissions(projectId);

    // --- STATE ---
    const [user, setUser] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [availableIssues, setAvailableIssues] = useState<LinkedIssue[]>([]);

    // Member & Assignment State
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});

    const [loading, setLoading] = useState(true);

    // View State
    const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [numDaysInView, setNumDaysInView] = useState(7);
    const [hourHeight, setHourHeight] = useState(80);

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false); // Global Tags Modal
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Form Fields
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formDate, setFormDate] = useState("");
    const [formStartTime, setFormStartTime] = useState("09:00");
    const [formEndTime, setFormEndTime] = useState("10:00");
    const [formIssueId, setFormIssueId] = useState("");
    const [formMeetingLink, setFormMeetingLink] = useState("");
    const [formAttendees, setFormAttendees] = useState<string[]>([]);
    const [formTags, setFormTags] = useState<Tag[]>([]);

    // Tag Form Inputs
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#6B7280");
    const [globalTagName, setGlobalTagName] = useState("");
    const [globalTagColor, setGlobalTagColor] = useState("#8b5cf6");

    // Assignment Filter State
    const [assigneeFilterRole, setAssigneeFilterRole] = useState<string>("All");

    // --- CONFIG ---
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const GRID_TOTAL_HEIGHT = 24 * hourHeight;

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        const init = async () => {
            // 1. Get Auth User
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser) {
                router.push("/auth/login");
                return;
            }

            // 2. Fetch User Profile
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
            const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
            setProject(proj);

            await fetchData(authUser.id);
        };
        init();
    }, [projectId]);

    // --- SCROLL LOCKING ---
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; }
    }, [showModal]);

    const fetchData = async (currentUserId?: string) => {
        setLoading(true);
        if (!authLoading && !checkAccess('manager-workflow-events')) {
            router.push(`/dashboard/projects/${projectId}`);
            return null;
        }

        // Refresh Project Metadata (Global Tags)
        const { data: proj } = await supabase.from("projects").select("*").eq("id", projectId).single();
        if (proj) setProject(proj);

        // Fetch Tasks
        const { data: tasksData } = await supabase
            .from("tasks")
            .select(`*, issue:issue_id(id, title, type, metadata), creator:creator_id(id, name, metadata)`)
            .eq("project_id", projectId);
        if (tasksData) setTasks(tasksData as any);

        // Fetch Issues for Dropdown
        const { data: issuesData } = await supabase
            .from("issues")
            .select("id, title, type")
            .eq("project_id", projectId)
            .neq("status", "Closed");
        if (issuesData) setAvailableIssues(issuesData as any);

        // Fetch Users & Roles
        const { data: projectUsersData } = await supabase
            .from("project_users")
            .select(`role_info, user:users(id, name, surname, metadata, email)`)
            .eq("project_id", projectId);

        if (projectUsersData) {
            const map: Record<string, UserProfile> = {};
            const memberList: ProjectMember[] = [];

            projectUsersData.forEach((u: any) => {
                if (u.user) {
                    // Resolve Role
                    let role = 'Viewer';
                    try {
                        if (typeof u.role_info === 'string') {
                            const parsed = JSON.parse(u.role_info);
                            role = parsed.role || role;
                        } else if (typeof u.role_info === 'object' && u.role_info) {
                            role = u.role_info.role || role;
                        }
                    } catch (e) { }

                    const profile = {
                        id: u.user.id,
                        name: u.user.name ? `${u.user.name} ${u.user.surname || ''}`.trim() : "Unknown",
                        email: u.user.email,
                        metadata: u.user.metadata || {}
                    };

                    map[u.user.id] = profile;
                    memberList.push({ ...profile, role });
                }
            });

            // Ensure current user is in map if not found in project_users (e.g. superadmin/owner edge case)
            const uid = currentUserId || user?.id;
            if (uid && !map[uid]) {
                const { data: currentUser } = await supabase.from("users").select("id, name, surname, metadata, email").eq("id", uid).single();
                if (currentUser) {
                    const profile = {
                        id: currentUser.id,
                        name: currentUser.name ? `${currentUser.name} ${currentUser.surname || ''}`.trim() : "Me",
                        email: currentUser.email,
                        metadata: currentUser.metadata || {}
                    };
                    map[currentUser.id] = profile;
                    memberList.push({ ...profile, role: 'Owner' });
                }
            }

            setUserMap(map);
            setMembers(memberList.sort((a, b) => a.name!.localeCompare(b.name!)));
        }
        setLoading(false);
    };

    // --- HELPER LOGIC ---
    const getStartOfWeek = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const newDate = new Date(d.setDate(diff));
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    };

    const navigateDate = (direction: number) => {
        const newDate = new Date(startDate);
        if (numDaysInView > 1) {
            newDate.setDate(startDate.getDate() + (direction * numDaysInView));
        } else {
            newDate.setDate(startDate.getDate() + direction);
        }
        setStartDate(newDate);
    };

    const isSameDay = (d1: Date, dateStr: string) => {
        const d2 = new Date(dateStr);
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    };

    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

    // --- TAG LOGIC ---
    const globalTags: Tag[] = useMemo(() => project?.metadata?.global_tags || [], [project]);

    const addGlobalTag = async () => {
        if (!globalTagName.trim() || !project) return;
        const newTag: Tag = { name: globalTagName, color: globalTagColor, textColor: getContrastColor(globalTagColor) };
        if (globalTags.some(t => t.name.toLowerCase() === globalTagName.toLowerCase())) { alert("Tag exists."); return; }
        const updatedTags = [...globalTags, newTag];
        const updatedProject = { ...project, metadata: { ...project.metadata, global_tags: updatedTags } };
        setProject(updatedProject);
        setGlobalTagName("");
        await supabase.from("projects").update({ metadata: updatedProject.metadata }).eq("id", projectId);
    };

    const removeGlobalTag = async (tagName: string) => {
        if (!project) return;
        const updatedTags = globalTags.filter(t => t.name !== tagName);
        const updatedProject = { ...project, metadata: { ...project.metadata, global_tags: updatedTags } };
        setProject(updatedProject);
        await supabase.from("projects").update({ metadata: updatedProject.metadata }).eq("id", projectId);
    };

    const handleAddLocalTag = () => {
        if (!newTagName.trim()) return;
        const newTag: Tag = { name: newTagName.trim(), color: newTagColor, textColor: getContrastColor(newTagColor) };
        if (formTags.some(t => t.name.toLowerCase() === newTag.name.toLowerCase())) return;
        setFormTags(prev => [...prev, newTag]);
        setNewTagName("");
    };

    const handleAddGlobalTagToEvent = (tag: Tag) => {
        if (formTags.some(t => t.name === tag.name)) return;
        setFormTags(prev => [...prev, tag]);
    };

    // --- VISUALIZATION LOGIC ---
    const getEventStyle = (task: Task, dayTasks: Task[]) => {
        const startMins = toMins(task.start_time);
        const endMins = toMins(task.end_time);

        const overlaps = dayTasks.filter(t => {
            const tStart = toMins(t.start_time);
            const tEnd = toMins(t.end_time);
            return startMins < tEnd && endMins > tStart;
        });
        overlaps.sort((a, b) => toMins(a.start_time) - toMins(b.start_time) || a.id.localeCompare(b.id));

        const index = overlaps.findIndex(t => t.id === task.id);
        const total = overlaps.length;

        const top = (startMins / 60) * hourHeight;
        const height = ((endMins - startMins) / 60) * hourHeight;
        const widthPercent = 100 / total;
        const leftPercent = index * widthPercent;

        const taskEndDateTime = new Date(`${task.task_date}T${task.end_time}`);
        const isPast = taskEndDateTime < new Date();

        const colorMap = {
            default: { bg: 'bg-blue-600/10', border: 'border-blue-500/50', bar: 'border-l-blue-500', text: 'text-blue-100' },
            bug: { bg: 'bg-red-600/10', border: 'border-red-500/50', bar: 'border-l-red-500', text: 'text-red-100' },
            feature: { bg: 'bg-purple-600/10', border: 'border-purple-500/50', bar: 'border-l-purple-500', text: 'text-purple-100' },
        };

        let theme = colorMap.default;
        if (task.issue?.type === 'Bug') theme = colorMap.bug;
        if (task.issue?.type === 'Feature') theme = colorMap.feature;

        return {
            style: {
                top: `${top}px`,
                height: `${Math.max(height, 32)}px`,
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                zIndex: 10 + index
            },
            theme,
            isPast
        };
    };

    const dateStrip = useMemo(() => {
        const days = [];
        const msPerDay = 24 * 60 * 60 * 1000;
        for (let i = 0; i < numDaysInView; i++) {
            days.push(new Date(startDate.getTime() + i * msPerDay));
        }
        return days;
    }, [startDate, numDaysInView]);

    const currentTimeMarker = useMemo(() => {
        const now = new Date();
        const isInView = dateStrip.some(d => isSameDay(d, now.toISOString()));
        if (!isInView) return null;
        const mins = now.getHours() * 60 + now.getMinutes();
        return (mins / 60) * hourHeight;
    }, [dateStrip, hourHeight]);

    const getTaskTags = (task: Task) => {
        const issueTags = task.issue?.metadata?.tags || [];
        const taskTags = task.metadata?.tags || [];
        return [...issueTags, ...taskTags];
    };

    // --- CRUD ACTIONS ---
    const openNewTaskModal = (prefillDate?: Date, prefillHour?: number) => {
        setEditingTask(null);
        setFormTitle(""); setFormDesc("");
        const d = prefillDate || new Date();
        setFormDate(d.toISOString().split('T')[0]);
        const startH = prefillHour !== undefined ? prefillHour : 9;
        setFormStartTime(`${startH.toString().padStart(2, '0')}:00`);
        setFormEndTime(`${((startH + 1) % 24).toString().padStart(2, '0')}:00`);
        setFormIssueId(""); setFormMeetingLink("");

        // Default current user as attendee
        setFormAttendees(user ? [user.id] : []);
        setFormTags([]);
        setAssigneeFilterRole("All");

        setShowModal(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setFormTitle(task.title);
        setFormDesc(task.description || "");
        setFormDate(task.task_date);
        setFormStartTime(task.start_time.slice(0, 5));
        setFormEndTime(task.end_time.slice(0, 5));
        setFormIssueId(task.issue_id || "");
        setFormMeetingLink(task.metadata?.meeting_link || "");

        // Load attendees
        setFormAttendees(task.metadata?.attendees || []);
        setFormTags(task.metadata?.tags || []);
        setAssigneeFilterRole("All");

        setShowModal(true);
    };

    const toggleFormAttendee = (userId: string) => {
        setFormAttendees(prev => {
            if (prev.includes(userId)) return prev.filter(id => id !== userId);
            return [...prev, userId];
        });
    };

    const handleSaveTask = async () => {
        if (!formTitle.trim()) return;
        const existingMeta = editingTask?.metadata || {};
        const newMetadata = {
            ...existingMeta,
            meeting_link: formMeetingLink,
            attendees: formAttendees,
            tags: formTags
        };

        const payload = {
            project_id: projectId,
            title: formTitle,
            description: formDesc,
            task_date: formDate,
            start_time: formStartTime,
            end_time: formEndTime,
            issue_id: formIssueId || null,
            status: editingTask ? editingTask.status : 'Todo',
            metadata: newMetadata,
            ...(editingTask ? {} : { creator_id: user.id })
        };

        if (editingTask) await supabase.from("tasks").update(payload).eq("id", editingTask.id);
        else await supabase.from("tasks").insert(payload);

        setShowModal(false);
        fetchData();
    };

    const handleDeleteTask = async () => {
        if (!editingTask) return;
        if (confirm("Delete this event?")) {
            await supabase.from("tasks").delete().eq("id", editingTask.id);
            setShowModal(false);
            fetchData();
        }
    };

    const toggleJoinTask = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        if (!user) return;

        const taskEndDateTime = new Date(`${task.task_date}T${task.end_time}:00`);
        if (taskEndDateTime.getTime() < Date.now()) return;

        const currentAttendees = task.metadata?.attendees || [];
        const isJoined = currentAttendees.includes(user.id);
        const newAttendees = isJoined ? currentAttendees.filter(id => id !== user.id) : [...currentAttendees, user.id];
        const updatedMetadata = { ...task.metadata, attendees: newAttendees };
        const updatedTask = { ...task, metadata: updatedMetadata };
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        if (editingTask && editingTask.id === task.id) {
            setEditingTask(updatedTask);
            setFormAttendees(newAttendees);
        }
        await supabase.from("tasks").update({ metadata: updatedMetadata }).eq("id", task.id);
    };

    // Filter Members for Modal
    const uniqueRoles = useMemo(() => {
        const roles = new Set(members.map(m => m.role).filter(Boolean));
        return Array.from(roles);
    }, [members]);

    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            if (assigneeFilterRole !== "All" && m.role !== assigneeFilterRole) return false;
            return true;
        });
    }, [members, assigneeFilterRole]);

    if (loading) {
        return (
            <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a] light:bg-gray-50">
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
        <div className="flex h-screen bg-[#0a0a0a] light:bg-gray-50 text-white light:text-gray-900 overflow-hidden font-sans">
            <style jsx global>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
        @media (prefers-color-scheme: light) {
            ::-webkit-scrollbar-track { background: #f9fafb; }
            ::-webkit-scrollbar-thumb { background: #d1d5db; }
            ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        }
        
        .past-event-striped {
            background-image: repeating-linear-gradient(
                45deg, transparent, transparent 5px, rgba(0,0,0,0.3) 5px, rgba(0,0,0,0.3) 10px
            );
        }
      `}</style>

            {/* --- SIDEBAR --- */}
            <Menu project={project} user={user} />

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 ml-64 flex flex-col h-full bg-[#0a0a0a] light:bg-gray-50">

                {/* --- HEADER --- */}
                <div className="flex-none h-16 mt-[60px] px-6 border-b border-white/5 light:border-gray-200 flex items-center justify-between bg-[#0a0a0a] light:bg-white z-20">
                    <div className="flex items-center gap-6">
                        <h1 className="text-xl font-bold tracking-tight text-white light:text-gray-900">Workflow and Events <span className="text-white/30 light:text-gray-400 text-lg font-light">Management Board</span></h1>
                        <div className="h-6 w-px bg-white/10 light:bg-gray-200"></div>

                        {/* Date Navigation */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                                <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-white/10 light:hover:bg-gray-200 rounded text-white/60 light:text-gray-500 hover:text-white light:hover:text-gray-900"><ChevronLeft size={16} /></button>
                                <button onClick={() => setStartDate(getStartOfWeek(new Date()))} className="px-3 text-[11px] font-bold uppercase text-white/60 light:text-gray-500 hover:text-white light:hover:text-gray-900">Today</button>
                                <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-white/10 light:hover:bg-gray-200 rounded text-white/60 light:text-gray-500 hover:text-white light:hover:text-gray-900"><ChevronRight size={16} /></button>
                            </div>
                            <h2 className="text-sm font-semibold text-white/90 light:text-gray-900 min-w-[140px]">
                                {startDate.toLocaleString('default', { month: 'long', day: 'numeric' })}
                                <span className="text-white/30 light:text-gray-400 ml-1.5 font-normal">{startDate.getFullYear()}</span>
                            </h2>
                        </div>
                    </div>

                    {/* View Controls & Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => openNewTaskModal()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white light:bg-gray-900 text-black light:text-white hover:bg-gray-200 light:hover:bg-gray-800 text-[10px] uppercase font-bold rounded transition-colors"
                        >
                            <Plus size={14} /> Add Event
                        </button>

                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="p-2 bg-white/5 light:bg-gray-100 hover:bg-white/10 light:hover:bg-gray-200 text-white/60 light:text-gray-500 hover:text-white light:hover:text-gray-900 rounded transition-colors"
                            title="Global Tags Settings"
                        >
                            <Settings size={16} />
                        </button>

                        <div className="h-6 w-px bg-white/10 light:bg-gray-200"></div>

                        {viewMode === 'calendar' && (
                            <>
                                <div className="flex bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                                    <button onClick={() => setHourHeight(60)} className={`p-2 rounded text-white/60 light:text-gray-500 hover:text-white light:hover:text-gray-900 ${hourHeight === 60 ? 'bg-white/10 light:bg-white light:shadow-sm' : ''}`} title="Compact View"><Minimize2 size={16} /></button>
                                    <button onClick={() => setHourHeight(120)} className={`p-2 rounded text-white/60 light:text-gray-500 hover:text-white light:hover:text-gray-900 ${hourHeight === 120 ? 'bg-white/10 light:bg-white light:shadow-sm' : ''}`} title="Expanded View"><Maximize2 size={16} /></button>
                                </div>
                                <div className="hidden sm:flex bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                                    {[1, 3, 5, 7].map(n => (
                                        <button key={n} onClick={() => setNumDaysInView(n)} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${numDaysInView === n ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-gray-900' : 'text-white/40 light:text-gray-500 hover:text-white light:hover:text-gray-900'}`}>{n} Days</button>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="flex bg-[#161616] light:bg-gray-100 rounded-md border border-white/5 light:border-gray-200 p-0.5">
                            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'calendar' ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-gray-900' : 'text-white/40 light:text-gray-500 hover:text-white light:hover:text-gray-900'}`}>
                                <CalendarIcon size={14} /> Calendar
                            </button>
                            <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'table' ? 'bg-white/10 light:bg-white light:shadow-sm text-white light:text-gray-900' : 'text-white/40 light:text-gray-500 hover:text-white light:hover:text-gray-900'}`}>
                                <TableIcon size={14} /> Table
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-[#0a0a0a] light:bg-gray-50 relative flex flex-col">

                    {/* CALENDAR VIEW */}
                    {viewMode === 'calendar' && (
                        <div className="flex-1 overflow-y-auto relative flex flex-col">

                            {/* Sticky Day Headers */}
                            <div className="sticky top-0 z-40 bg-[#0a0a0a] light:bg-white border-b border-white/5 light:border-gray-200 flex flex-none h-12">
                                <div className="w-14 flex-none border-r border-white/5 light:border-gray-200 bg-[#0a0a0a] light:bg-gray-50" />
                                <div className="flex-1 flex">
                                    {dateStrip.map((day, i) => {
                                        const isToday = isSameDay(day, new Date().toISOString());
                                        return (
                                            <div key={i} className="flex-1 border-r border-white/5 light:border-gray-200 flex items-center justify-center gap-2 last:border-r-0">
                                                <span className={`text-xs uppercase font-bold tracking-wider ${isToday ? 'text-purple-400 light:text-purple-600' : 'text-white/40 light:text-gray-400'}`}>{day.toLocaleString('default', { weekday: 'short' })}</span>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-purple-600 text-white' : 'text-white/80 light:text-gray-700'}`}>{day.getDate()}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Scrollable Grid Area */}
                            <div className="flex flex-1 relative min-h-0">
                                {/* 1. Time Column */}
                                <div className="w-14 flex-none border-r border-white/5 light:border-gray-200 bg-[#0a0a0a] light:bg-gray-50 relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                    {HOURS.map(h => (
                                        <div key={h} className="absolute w-full text-right pr-2 text-xs font-medium text-white/20 light:text-gray-400" style={{ top: h * hourHeight, transform: 'translateY(-50%)' }}>
                                            {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
                                        </div>
                                    ))}
                                    {/* Spacer for the last tick */}
                                    <div style={{ top: 24 * hourHeight, height: 1 }} className="absolute w-full"></div>
                                </div>

                                {/* 2. Main Grid */}
                                <div className="flex-1 relative" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                                    {/* Render rows for all 24 hours */}
                                    {HOURS.map(h => (
                                        <div key={h} className="absolute w-full border-b border-white/5 light:border-gray-200" style={{ top: h * hourHeight, height: hourHeight }}>
                                            <div className="absolute top-1/2 w-full border-t border-white/[0.02] light:border-gray-200/50 border-dashed"></div>
                                        </div>
                                    ))}
                                    {/* Bottom border for the last hour */}
                                    <div className="absolute w-full border-b border-white/5 light:border-gray-200" style={{ top: 24 * hourHeight, height: 1 }}></div>

                                    {/* Current Time Marker */}
                                    {currentTimeMarker !== null && (
                                        <div className="absolute w-full z-10 pointer-events-none border-t border-red-500/50" style={{ top: currentTimeMarker }}>
                                            <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-500 -mt-1.5"></div>
                                        </div>
                                    )}

                                    {/* Columns & Events */}
                                    <div className="absolute inset-0 flex h-full">
                                        {dateStrip.map((day, colIndex) => {
                                            const dayTasks = tasks.filter(t => isSameDay(day, t.task_date));
                                            return (
                                                <div key={colIndex} className="flex-1 border-r border-white/5 light:border-gray-200 last:border-r-0 relative h-full group/col">

                                                    {/* Clickable Background Grid for Adding Events */}
                                                    {HOURS.map(h => (
                                                        <div
                                                            key={h}
                                                            className="absolute w-full hover:bg-white/[0.02] light:hover:bg-gray-100 cursor-pointer transition-colors z-0"
                                                            style={{ top: h * hourHeight, height: hourHeight }}
                                                            onClick={() => openNewTaskModal(day, h)}
                                                        ></div>
                                                    ))}

                                                    {dayTasks.map(task => {
                                                        const { style, theme, isPast } = getEventStyle(task, dayTasks);
                                                        const tags = getTaskTags(task);
                                                        const attendees = task.metadata?.attendees || [];
                                                        const hasMeeting = !!task.metadata?.meeting_link;

                                                        return (
                                                            <div
                                                                key={task.id}
                                                                onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                                style={style}
                                                                className={`
                                                            absolute rounded-md px-2 py-1.5 cursor-pointer transition-all border-l-[3px] overflow-hidden flex flex-col justify-start
                                                            hover:brightness-110 hover:z-50 hover:shadow-lg shadow-sm group/card
                                                            ${theme.bg} ${theme.border} ${theme.bar} ${theme.text}
                                                            ${isPast ? 'past-event-striped opacity-60 saturate-50' : ''}
                                                        `}
                                                            >
                                                                {/* HEADER & MEETING ICON */}
                                                                <div className="flex items-center justify-between mb-0.5 relative">
                                                                    <div className="flex items-center gap-1.5 min-w-0 pr-4">
                                                                        {task.issue && (<div className={`flex-none w-2 h-2 rounded-full ${task.issue.type === 'Bug' ? 'bg-red-400' : 'bg-purple-400'}`}></div>)}
                                                                        <span className="text-xs font-bold truncate leading-tight">{task.title}</span>
                                                                    </div>
                                                                    {/* Mini Join Button on Hover */}
                                                                    <button
                                                                        onClick={(e) => toggleJoinTask(e, task)}
                                                                        disabled={isPast}
                                                                        className={`absolute top-0 right-0 p-0.5 rounded opacity-0 group-hover/card:opacity-100 transition-opacity z-10
                                                                    ${task.metadata?.attendees?.includes(user?.id) ? 'text-red-400 hover:bg-red-400/20' : 'text-blue-400 hover:bg-blue-400/20'}
                                                                `}
                                                                    >
                                                                        {task.metadata?.attendees?.includes(user?.id) ? <UserMinus size={12} /> : <UserPlus size={12} />}
                                                                    </button>
                                                                    {/* Meeting Icon (If not hovering) */}
                                                                    {hasMeeting && (
                                                                        <div className="absolute top-0 right-0 p-0.5 rounded-full bg-black/20 text-white/90 group-hover/card:opacity-0 transition-opacity" title="Meeting Required">
                                                                            <Video size={10} strokeWidth={3} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {parseInt(style.height) > 40 && (
                                                                    <div className="text-[10px] opacity-70 truncate mb-1">
                                                                        {task.start_time.slice(0, 5)} - {task.end_time.slice(0, 5)}
                                                                    </div>
                                                                )}

                                                                {/* DESCRIPTION SNIPPET */}
                                                                {parseInt(style.height) > 80 && task.description && (
                                                                    <p className="text-[9px] text-white/50 line-clamp-2 leading-3 mb-1 break-words">
                                                                        {task.description}
                                                                    </p>
                                                                )}

                                                                {/* FOOTER: TAGS + BIGGER AVATARS */}
                                                                <div className="mt-auto flex items-end justify-between gap-1">
                                                                    {parseInt(style.height) > 60 && tags.length > 0 ? (
                                                                        <div className="flex gap-1 flex-wrap overflow-hidden max-h-[20px] max-w-[60%]">
                                                                            {tags.slice(0, 3).map((tag, i) => (
                                                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[3px] border font-medium whitespace-nowrap" style={{ borderColor: `${tag.color}40`, color: tag.color, backgroundColor: `${tag.color}20` }}>
                                                                                    {tag.name}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : <div />}

                                                                    {/* Attendees with Rich Tooltip */}
                                                                    {attendees.length > 0 && (
                                                                        <div className="flex -space-x-2 self-end relative">
                                                                            {attendees.slice(0, 3).map(uid => (
                                                                                <div key={uid} className="group/avatar relative">
                                                                                    <div className="w-5 h-5 rounded-full border border-[#161616] bg-[#222] overflow-hidden hover:z-20 hover:scale-110 transition-transform relative z-10 cursor-help">
                                                                                        {userMap[uid]?.metadata?.avatar_url ? (
                                                                                            <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-white/50 font-bold">{userMap[uid]?.name?.[0] || "?"}</div>
                                                                                        )}
                                                                                    </div>
                                                                                    {/* HOVER TOOLTIP */}
                                                                                    <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/avatar:flex flex-col items-end gap-1 bg-[#161616] border border-white/10 p-2 rounded shadow-2xl z-50 whitespace-nowrap min-w-[100px] pointer-events-none">
                                                                                        <span className="text-xs font-bold text-white">{userMap[uid]?.name || "Unknown"}</span>

                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                            {attendees.length > 3 && (
                                                                                <div className="w-5 h-5 rounded-full border border-[#161616] bg-[#333] flex items-center justify-center text-[8px] text-white font-bold z-0">
                                                                                    +{attendees.length - 3}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            {/* Bottom Spacer */}
                            <div className="h-10 flex-none bg-[#0a0a0a] light:bg-gray-50"></div>
                        </div>
                    )}

                    {/* TABLE VIEW */}
                    {viewMode === 'table' && (
                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full text-left text-sm text-white/70 light:text-gray-600 border-collapse">
                                <thead className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500 bg-[#0a0a0a] light:bg-gray-100 sticky top-0 border-b border-white/5 light:border-gray-200 z-10">
                                    <tr>
                                        <th className="px-4 py-3">Date & Time</th>
                                        <th className="px-4 py-3">Event</th>
                                        <th className="px-4 py-3">Linked Task</th>
                                        <th className="px-4 py-3">Tags</th>
                                        <th className="px-4 py-3">Attendees</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 light:divide-gray-200">
                                    {tasks.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-white/20 light:text-gray-400 italic">No events found for this project.</td></tr>
                                    ) : tasks.sort((a, b) => a.task_date.localeCompare(b.task_date)).map(task => {
                                        const attendees = task.metadata?.attendees || [];
                                        const taskEnd = new Date(`${task.task_date}T${task.end_time}`);
                                        const isPast = taskEnd < new Date();
                                        const tags = getTaskTags(task);
                                        return (
                                            <tr key={task.id} onClick={() => openEditModal(task)} className={`cursor-pointer transition-colors ${isPast ? 'opacity-50 hover:opacity-100 past-event-striped' : 'hover:bg-[#111] light:hover:bg-white'}`}>
                                                <td className="px-4 py-3 font-mono text-xs text-white/50 light:text-gray-500">
                                                    <div className="text-white/80 light:text-gray-900 font-bold">{new Date(task.task_date).toLocaleDateString()}</div>
                                                    <div className="opacity-50 mt-0.5">{task.start_time.slice(0, 5)} - {task.end_time.slice(0, 5)}</div>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-white light:text-gray-900 text-base">
                                                    <div className="flex items-center gap-2">
                                                        {task.title}
                                                        {task.metadata?.meeting_link && <Video size={14} className="text-green-500/80" />}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {task.issue ? (
                                                        <span className={`text-[10px] px-2 py-1 rounded border font-medium ${task.issue.type === 'Bug' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                            {task.issue.type}: {task.issue.title}
                                                        </span>
                                                    ) : <span className="text-white/10 light:text-gray-300">-</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {tags.map((tag, i) => (
                                                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}10` }}>{tag.name}</span>
                                                        ))}
                                                        {tags.length === 0 && <span className="text-xs text-white/10 light:text-gray-300">-</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex -space-x-2">
                                                        {(task.metadata?.attendees || []).map((uid, i) => (
                                                            <div key={i} className="w-8 h-8 rounded-full bg-[#222] light:bg-gray-200 border-2 border-[#1a1a1a] light:border-white overflow-hidden hover:z-10 relative transition-transform hover:scale-110" title={userMap[uid]?.name || ""}>
                                                                {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] light:text-gray-600">{userMap[uid]?.name?.[0]}</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={(e) => toggleJoinTask(e, task)}
                                                        disabled={isPast}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold border
                                                    ${isPast ? 'bg-gray-700/20 border-gray-500/30 text-gray-500 cursor-not-allowed' : (attendees.includes(user.id) ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400')}
                                                `}
                                                    >
                                                        {isPast ? "Finished" : (attendees.includes(user.id) ? "Leave" : "Join")}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* --- CRUD MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 light:bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#161616] light:bg-white border border-white/10 light:border-gray-200 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-white/10 light:border-gray-200 flex justify-between items-center bg-[#1a1a1a] light:bg-gray-50">
                            <h3 className="font-bold text-lg text-white light:text-gray-900">{editingTask ? "Edit Event" : "New Event"}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 light:bg-gray-200 hover:bg-white/10 light:hover:bg-gray-300 rounded text-white/60 light:text-gray-500 hover:text-white light:hover:text-gray-900 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                            {/* Form Fields */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500 block mb-1.5">Title</label>
                                <input autoFocus className="w-full bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-3 text-sm text-white light:text-gray-900 outline-none focus:border-blue-500 transition-colors" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Daily Standup" />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500 block mb-1.5">Description</label>
                                <textarea className="w-full bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-3 text-sm text-white light:text-gray-900 outline-none focus:border-blue-500 transition-colors min-h-[80px] resize-y" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Details..." />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-3">
                                    <label className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500 block mb-1.5">Date</label>
                                    <input type="date" className="w-full bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-2.5 text-sm text-white light:text-gray-900 outline-none focus:border-blue-500" value={formDate} onChange={e => setFormDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500 block mb-1.5">Start</label>
                                    <input type="time" className="w-full bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-2.5 text-sm text-white light:text-gray-900 outline-none focus:border-blue-500" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500 block mb-1.5">End</label>
                                    <input type="time" className="w-full bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-2.5 text-sm text-white light:text-gray-900 outline-none focus:border-blue-500" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} />
                                </div>
                            </div>

                            {/* --- TAGS INPUT --- */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500 block mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white/5 light:bg-gray-100 rounded border border-white/5 light:border-gray-200 min-h-[38px]">
                                    {formTags.map(tag => (
                                        <div key={tag.name} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: tag.color, color: tag.textColor }}>
                                            {tag.name}
                                            <button onClick={() => setFormTags(prev => prev.filter(t => t.name !== tag.name))} className="hover:opacity-70"><X size={10} /></button>
                                        </div>
                                    ))}
                                    {formTags.length === 0 && <span className="text-white/30 light:text-gray-400 text-xs self-center">No tags selected.</span>}
                                </div>
                                <div className="flex gap-2">
                                    <input className="flex-1 bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-2 text-xs text-white light:text-gray-900" placeholder="Add custom tag..." value={newTagName} onChange={e => setNewTagName(e.target.value)} />
                                    <input type="color" className="h-8 w-8 rounded cursor-pointer p-0 border-0 bg-transparent" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} />
                                    <button onClick={handleAddLocalTag} className="px-3 bg-white/10 light:bg-gray-200 hover:bg-white/20 light:hover:bg-gray-300 rounded text-[10px] font-bold text-white light:text-gray-900">ADD</button>
                                </div>
                                {globalTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/10 light:border-gray-200">
                                        <span className="text-[10px] text-white/30 light:text-gray-400 self-center uppercase font-bold">Global:</span>
                                        {globalTags.filter(gt => !formTags.some(ft => ft.name === gt.name)).map(tag => (
                                            <button key={tag.name} onClick={() => handleAddGlobalTagToEvent(tag)} className="text-[10px] px-2 py-0.5 rounded border border-white/10 light:border-gray-200 hover:bg-white/5 light:hover:bg-gray-100 transition-colors font-bold" style={{ color: tag.color }}>+ {tag.name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ASSIGN MEMBERS SECTION */}
                            <div className="border border-white/5 light:border-gray-200 rounded-lg p-3 bg-[#0a0a0a] light:bg-white">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] uppercase font-bold text-white/40 light:text-gray-500">Assign To</label>
                                    <div className="flex gap-2">
                                        {["All", ...uniqueRoles].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setAssigneeFilterRole(role)}
                                                className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border transition-colors ${assigneeFilterRole === role ? 'bg-white light:bg-gray-900 text-black light:text-white border-white light:border-gray-900' : 'border-white/10 light:border-gray-200 text-white/40 light:text-gray-500 hover:text-white light:hover:text-gray-900'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {filteredMembers.map(member => {
                                        const isSelected = formAttendees.includes(member.id);
                                        return (
                                            <div
                                                key={member.id}
                                                onClick={() => toggleFormAttendee(member.id)}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-blue-500/10 border-blue-500/40' : 'bg-[#111] light:bg-gray-50 border-white/5 light:border-gray-200 hover:bg-[#161616] light:hover:bg-gray-100'}`}
                                            >
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-[#222] overflow-hidden">
                                                        {member.metadata.avatar_url ? <img src={member.metadata.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50">{member.name?.[0]}</div>}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-[#0a0a0a]">
                                                            <Check size={8} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-blue-200 light:text-blue-600' : 'text-white/80 light:text-gray-900'}`}>{member.name}</div>
                                                    <div className="flex mt-0.5">
                                                        {/* --- ROLE BADGE --- */}
                                                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(member.role)}`}>
                                                            {member.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredMembers.length === 0 && (
                                        <div className="col-span-full py-4 text-center text-xs text-white/20 light:text-gray-400 italic">No members found for this filter.</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-green-400 block mb-1.5 flex items-center gap-1"><Video size={10} /> Meeting Link</label>
                                <div className="flex gap-2">
                                    <input className="flex-1 bg-[#0a0a0a] light:bg-white border border-green-500/30 rounded-lg p-2.5 text-sm text-white light:text-gray-900 outline-none focus:border-green-500" value={formMeetingLink} onChange={e => setFormMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
                                    {formMeetingLink && <a href={formMeetingLink} target="_blank" className="p-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20"><ExternalLink size={16} /></a>}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-purple-400 block mb-1.5 flex items-center gap-1"><LinkIcon size={10} /> Link Task</label>
                                <select className="w-full bg-[#0a0a0a] light:bg-white border border-purple-500/30 rounded-lg p-2.5 text-sm text-white light:text-gray-900 outline-none focus:border-purple-500 appearance-none cursor-pointer" value={formIssueId} onChange={e => setFormIssueId(e.target.value)}>
                                    <option value="">None</option>
                                    {availableIssues.map(issue => <option key={issue.id} value={issue.id}>[{issue.type}] {issue.title}</option>)}
                                </select>
                            </div>

                            {/* Created By Info in Edit Mode */}
                            {editingTask && editingTask.creator && (
                                <div className="flex items-center gap-2 p-2 rounded bg-white/5 light:bg-gray-100 text-xs text-white/50 light:text-gray-500">
                                    <span>Created by:</span>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0a0a0a] light:bg-white rounded-full border border-white/5 light:border-gray-200">
                                        <div className="w-4 h-4 rounded-full bg-[#222] overflow-hidden">
                                            {(userMap[editingTask.creator_id || '']?.metadata?.avatar_url || editingTask.creator?.metadata?.avatar_url) ?
                                                <img src={userMap[editingTask.creator_id || '']?.metadata?.avatar_url || editingTask.creator?.metadata?.avatar_url} className="w-full h-full object-cover" /> :
                                                <div className="w-full h-full flex items-center justify-center text-[8px]">{(userMap[editingTask.creator_id || '']?.name?.[0] || editingTask.creator?.name?.[0])}</div>
                                            }
                                        </div>
                                        <span className="text-xs font-medium text-white/80 light:text-gray-900">{userMap[editingTask.creator_id || '']?.name || editingTask.creator?.name || "Unknown"}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="p-5 border-t border-white/10 light:border-gray-200 bg-[#1a1a1a] light:bg-gray-50 flex gap-3">
                            <button onClick={handleSaveTask} className="flex-1 py-2.5 bg-white light:bg-gray-900 text-black light:text-white text-sm font-bold rounded-lg hover:bg-gray-200 light:hover:bg-gray-800 transition-colors">{editingTask ? "Save Changes" : "Create Event"}</button>
                            {editingTask && (<button onClick={handleDeleteTask} className="px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 size={16} /></button>)}
                        </div>
                    </div>
                </div>
            )}

            {/* --- GLOBAL SETTINGS MODAL --- */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 light:bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#161616] light:bg-white border border-white/10 light:border-gray-200 rounded-xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white light:text-gray-900 flex items-center gap-2"><Settings size={18} /> Global Tags</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-white/50 light:text-gray-400 hover:text-white light:hover:text-gray-900"><X size={18} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-white/5 light:bg-gray-100 rounded-lg min-h-[60px] flex flex-wrap gap-2 content-start border border-white/5 light:border-gray-200">
                                {globalTags.map(tag => (
                                    <div key={tag.name} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-bold uppercase" style={{ backgroundColor: tag.color, color: tag.textColor }}>
                                        {tag.name}
                                        <button onClick={() => removeGlobalTag(tag.name)} className="hover:opacity-70 ml-1"><X size={12} /></button>
                                    </div>
                                ))}
                                {globalTags.length === 0 && <span className="text-white/30 light:text-gray-400 text-xs italic">No global tags defined.</span>}
                            </div>

                            <div className="flex gap-2">
                                <input className="flex-1 bg-[#0a0a0a] light:bg-white border border-white/10 light:border-gray-200 rounded-lg p-2.5 text-sm text-white light:text-gray-900" placeholder="New global tag..." value={globalTagName} onChange={e => setGlobalTagName(e.target.value)} />
                                <input type="color" className="h-10 w-10 rounded-lg border-0 bg-transparent cursor-pointer" value={globalTagColor} onChange={e => setGlobalTagColor(e.target.value)} />
                            </div>
                            <button onClick={addGlobalTag} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm">Add Global Tag</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}