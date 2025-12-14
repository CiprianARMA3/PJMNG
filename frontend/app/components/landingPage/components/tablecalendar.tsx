// tablecalendar.tsx (ProjectCalendarTable)

'use client';

import { useMemo, useState } from "react";
import { Table as TableIcon } from "lucide-react";

// --- TYPES (Copied from original for consistency) ---
type Tag = { name: string; color: string; textColor?: string };
type UserProfile = { id: string; name: string | null; metadata: { avatar_url?: string; [key: string]: any }; };
type LinkedIssue = { id: string; title: string; type: string; metadata: { tags?: Tag[]; [key: string]: any }; };
type Task = {
  id: string; project_id: string; title: string; description?: string | null;
  status: string; task_date: string; start_time: string; end_time: string;
  issue_id?: string | null; issue?: LinkedIssue | null; creator_id: string | null;
  creator?: UserProfile | null; 
  metadata: { meeting_link?: string; attendees?: string[]; tags?: Tag[]; [key: string]: any; };
};

// --- MOCK SETUP ---
const mockProjectId = 'mock-project-id';

export default function ProjectCalendarTable() {
    // --- STATE ---
    // We initialize this to null and ensure it cannot be set to a task.
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    
    // Using the same mock data and helpers
    const userMap: Record<string, UserProfile> = {
        'mock_user_1': { id: 'mock_user_1', name: 'Alice', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=1' } },
        'mock_user_2': { id: 'mock_user_2', name: 'Bob', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=2' } },
        'mock_user_3': { id: 'mock_user_3', name: 'Charlie', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=3' } },
        'mock_user_4': { id: 'mock_user_4', name: 'Dana', metadata: { avatar_url: 'https://i.pravatar.cc/32?img=4' } },
    };

    const getTaskTags = (task: Task) => {
        const issueTags = task.issue?.metadata?.tags || [];
        const taskTags = task.metadata?.tags || [];
        return [...issueTags, ...taskTags];
    };

    // --- SAMPLE EVENTS (Unchanged) ---
    const mockTasks: Task[] = useMemo(() => {
        const today = new Date();
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);

        const dateStringToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const dateStringNext = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
        const dateStringAfter = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, '0')}-${String(dayAfter.getDate()).padStart(2, '0')}`;
            
        const taskTemplate = (id: string, time: string, duration: number, title: string, type: string, taskDate: string, attendees: string[] = ['mock_user_1', 'mock_user_2']): Task => {
            const [startH, startM] = time.split(':').map(Number);
            const endMins = startH * 60 + startM + duration;
            const endH = Math.floor(endMins / 60) % 24;
            const endM = endMins % 60;

            return {
                id, project_id: mockProjectId, title,
                description: `Discussing the linked issue: ${title}.`, status: 'active', task_date: taskDate,
                start_time: time, end_time: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
                creator_id: 'mock_user_1', creator: userMap['mock_user_1'],
                metadata: { meeting_link: 'https://meet.google.com/abc-xyz', attendees: attendees, tags: [{ name: 'High Priority', color: '#F97316' }] },
                issue: { id: 'issue_' + id, title: 'Linked Issue: ' + title, type: type, metadata: { tags: [{ name: 'Type: ' + type, color: type === 'Bug' ? '#EF4444' : (type === 'Improvement' ? '#3B82F6' : '#A855F7') }] } }
            };
        };

        return [
            taskTemplate('t1', '09:00', 60, 'UI/UX Review', 'Feature', dateStringToday, ['mock_user_1', 'mock_user_2', 'mock_user_3']),
            taskTemplate('t2', '09:45', 60, 'API Bug Fix', 'Bug', dateStringToday, ['mock_user_1', 'mock_user_3']),
            taskTemplate('t3', '11:30', 30, 'Metrics Dashboard Setup', 'Improvement', dateStringToday, ['mock_user_4', 'mock_user_2']),
            taskTemplate('t4', '09:30', 60, 'Deployment Preparation', 'Task', dateStringNext, ['mock_user_1']),
            taskTemplate('t7', '10:30', 60, 'Security Follow-up', 'Task', dateStringNext, ['mock_user_3', 'mock_user_4']),
            taskTemplate('t5', '10:00', 60, 'Client Demo Setup', 'Feature', dateStringAfter, ['mock_user_2', 'mock_user_4']),
        ];
    }, [userMap]);

    const tasksToDisplay = mockTasks;

    return (
        // The outer div is where the parent component adds the enhanced shadow/border
        <div className="shadow-lg rounded-xl bg-white flex flex-col overflow-hidden font-sans relative"> 
            <style jsx global>{`
                /* LIGHT MODE SCROLLBAR */
                .widget-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .widget-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .widget-scrollbar::-webkit-scrollbar-thumb { background: #bbb; border-radius: 2px; }
                .widget-scrollbar::-webkit-scrollbar-thumb:hover { background: #999; }
    
                /* LIGHT MODE STRIPES */
                .past-event-striped {
                    background-image: repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 5px,
                        rgba(0,0,0,0.05) 5px,
                        rgba(0,0,0,0.05) 10px
                    );
                }
            `}</style>
            
            {/* --- WIDGET HEADER --- */}
            <div className="flex-none h-12 px-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                 <h2 className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    <TableIcon size={12} className="text-purple-600"/> Event List View
                 </h2>
                 <div className="flex bg-white rounded-md border border-gray-300 p-0.5 shadow-sm">
                    {/* Unselectable table mode indicator */}
                    <button 
                         className={`p-1.5 rounded-md text-gray-600 transition-all bg-purple-100 text-purple-700 cursor-default`}><TableIcon size={12}/>
                    </button>
                 </div>
            </div>

            {/* --- TABLE VIEW --- */}
            <div className="flex-1 overflow-auto widget-scrollbar p-2 bg-gray-50">
                <table className="w-full text-left text-xs text-gray-700 border-collapse">
                    <thead className="text-[9px] uppercase font-bold text-gray-500 bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                        <tr>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Event</th>
                            <th className="px-3 py-2">Tags</th>
                            <th className="px-3 py-2">Attendees</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasksToDisplay.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-300 italic">No events found</td></tr>
                        ) : tasksToDisplay.sort((a,b) => a.task_date.localeCompare(b.task_date) || a.start_time.localeCompare(b.start_time)).map(task => {
                            const taskEnd = new Date(`${task.task_date}T${task.end_time}`);
                            const isPast = taskEnd < new Date();
                            const tags = getTaskTags(task);
                            return (
                                <tr 
                                    key={task.id} 
                                    // MODIFICATION: Removed onClick handler
                                    // onClick={() => setSelectedTask(task)} 
                                    className={`transition-colors cursor-default ${isPast ? 'opacity-70 past-event-striped' : 'hover:bg-gray-50'}`} // Removed hover:bg-gray-100 for a less interactive feel
                                >
                                    <td className="px-3 py-2 font-mono text-[10px] text-gray-500">
                                        <div className="text-gray-800">{new Date(task.task_date).toLocaleDateString()}</div>
                                        <div className="opacity-70">{task.start_time.slice(0,5)}</div>
                                    </td>
                                    <td className="px-3 py-2 font-medium text-gray-900">{task.title}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-1 flex-wrap">
                                            {tags.map((tag, i) => (
                                                <span key={i} className="text-[9px] px-1 rounded border" style={{ borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}20` }}>{tag.name}</span>
                                            ))}
                                            {tags.length === 0 && <span className="text-[9px] text-gray-300">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex -space-x-1.5">
                                            {(task.metadata?.attendees || []).map((uid, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-gray-200 border border-white overflow-hidden" title={userMap[uid]?.name || ""}>
                                                    {userMap[uid]?.metadata?.avatar_url ? <img src={userMap[uid].metadata.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">{userMap[uid]?.name?.[0] || 'U'}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {/* Modal is not included in this component */}
        </div>
    );
}

// Re-export the new component for use in the parent file
// export { ProjectCalendarTable }; // This line is not needed in the final JSX but helpful for module structure