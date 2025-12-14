'use client';

import React from 'react';
import {
  Search, Plus, RefreshCw, Filter, ChevronDown, ChevronUp, Minus,
  Disc, XCircle, Bug, Zap, Hammer, AlertTriangle, CheckCircle2, Clock, LucideProps,
} from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

// Simplified type structure for static display purposes
type DisplayIssue = {
    id: string;
    title: string;
    type: 'Bug' | 'Feature' | 'Improvement' | 'Task';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    priority: 'Urgent' | 'High' | 'Normal' | 'Low';
    tags: string[];
    collaborators: number; // Count of collaborators
    creatorId: number; // Used for unique avatar URL
    isSolved: boolean;
};

// Static data structure mimicking the desired light-mode rows
const staticIssues: DisplayIssue[] = [
    { id: '1', title: 'Authentication token expiry loop on Safari', type: 'Bug', status: 'Open', priority: 'Urgent', tags: ['Frontend', 'Security'], collaborators: 3, creatorId: 10, isSolved: false },
    { id: '2', title: 'Implement AI Code Review feature gate', type: 'Feature', status: 'In Progress', priority: 'High', tags: ['Backend', 'AI'], collaborators: 2, creatorId: 20, isSolved: false },
    { id: '3', title: 'Database connection pool optimization', type: 'Improvement', status: 'Resolved', priority: 'Normal', tags: ['Performance', 'Database'], collaborators: 2, creatorId: 30, isSolved: true },
    { id: '4', title: 'Update documentation for new API endpoint', type: 'Task', status: 'Closed', priority: 'Low', tags: ['Docs'], collaborators: 1, creatorId: 40, isSolved: true },
];

// -----------------------------------------------------------------
// Helper Function for Formatting Dates (Kept but unused in JSX)
// -----------------------------------------------------------------
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    } catch {
        return 'N/A';
    }
};

// Define the expected return type for getStatusStyles
type StatusStyle = {
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    color: string;
    bg: string;
    label: string;
};

// --- Mock Helper Functions (using static colors for visual effect) ---

const getStatusStyles = (status: DisplayIssue['status']): StatusStyle => {
    switch (status) {
        case 'Open': return { icon: Disc, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Open' };
        case 'In Progress': return { icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', label: 'In Progress' };
        case 'Resolved': return { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'Resolved' };
        case 'Closed': return { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'Closed' };
    }
};

const getPriorityStyles = (p: DisplayIssue['priority']) => {
    if (p === 'Urgent') return { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100 border-red-300', iconClass: 'text-red-500 fill-red-500/30' };
    if (p === 'High') return { icon: ChevronUp, color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300', iconClass: 'text-orange-500' };
    if (p === 'Normal') return { icon: Minus, color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', iconClass: 'text-blue-500' };
    return { icon: ChevronDown, color: 'text-cyan-700', bg: 'bg-cyan-100 border-cyan-300', iconClass: 'text-cyan-500' };
};

const getTypeIcon = (t: DisplayIssue['type']) => {
    if (t === 'Bug') return { icon: Bug, color: 'text-red-500' };
    if (t === 'Feature') return { icon: Zap, color: 'text-purple-600' };
    return { icon: Hammer, color: 'text-blue-500' };
};

const getTagColor = (tag: string) => {
    if (tag.includes('Frontend')) return { text: '#3B82F6', bg: '#EFF6FF' }; // Blue
    if (tag.includes('Backend')) return { text: '#10B981', bg: '#ECFDF5' }; // Green
    if (tag.includes('Security')) return { text: '#EF4444', bg: '#FEF2F2' }; // Red
    if (tag.includes('AI')) return { text: '#8B5CF6', bg: '#F5F3FF' }; // Purple
    if (tag.includes('Critical')) return { text: '#F97316', bg: '#FFF7ED' }; // Orange
    if (tag.includes('Payments')) return { text: '#6366F1', bg: '#EEF2FF' }; // Indigo
    if (tag.includes('UI/UX')) return { text: '#A855F7', bg: '#FAF5FF' }; // Violet
    return { text: '#6B7280', bg: '#F9FAFB' }; // Gray
}


// --- TEMPLATE COMPONENT ---
export default function IssuesPageTemplate() {

    return (
        // OUTER WRAPPER with absolute positioning.
        // Added select-none and pointer-events-none to disable all interaction and selection for this template view.
        <div 
            className="absolute top-12 left-12 right-0 bottom-0 w-auto h-auto shadow-xl select-none pointer-events-none"
        >
            {/* Main content container, now flex-1 to fill the absolute wrapper */}
            <div className="flex flex-col h-full w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-gray-900">

                {/* HEADER: Title and New Task Button - REDUCED HEIGHT */}
                <div className="flex-none h-12 px-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h1 className="text-base font-bold tracking-tight text-gray-800">Tasks <span className="text-gray-400 text-sm font-normal">Panel</span></h1>
                    <button
                        className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold rounded-md transition-colors shadow-sm active:scale-95"
                    >
                        <Plus size={12} /> New Task
                    </button>
                </div>

                {/* TOOLBAR & FILTERS - REDUCED VERTICAL PADDING */}
                <div className="flex-none px-5 py-2.5 flex items-center justify-between border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search issues..."
                                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-800 outline-none focus:border-purple-400 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            className="p-1.5 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-purple-600 hover:border-purple-400 transition-all active:scale-95 shadow-sm"
                            title="Refresh Issues"
                        >
                            <RefreshCw size={12} />
                        </button>
                        <button
                            className="flex items-center gap-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-all shadow-sm bg-white border-gray-300 text-gray-600 hover:border-purple-400"
                        >
                            <Filter size={12} /> Filters <ChevronDown size={10} />
                        </button>
                    </div>
                </div>

                {/* --- ISSUE TABLE HEADER (6 Columns) - REDUCED VERTICAL PADDING AND FONT SIZE --- */}
                <div className="flex-none grid grid-cols-8 gap-4 px-5 py-2 border-b border-gray-200 text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50">
                    <div className="col-span-4">Issue Details</div>
                    <div className="col-span-1">Team</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Urgency</div>
                    <div className="col-span-1 text-right">Creator/Solver</div>
                </div>

                {/* ISSUE LIST TABLE (Scrollable Content) */}
                <div className="flex-1 overflow-y-auto">
                    {staticIssues.map((issue, index) => {
                        const statusStyles = getStatusStyles(issue.status);
                        const priorityStyles = getPriorityStyles(issue.priority);
                        const typeStyles = getTypeIcon(issue.type);
                        const isResolvedOrClosed = issue.status === 'Resolved' || issue.status === 'Closed';

                        // Mock dates for display (removed from JSX)
                        const createdDate = `2025-12-${15 - index}T10:00:00Z`;
                        const updatedDate = `2025-12-${15 - index}T14:30:00Z`;

                        return (
                            <div
                                key={issue.id}
                                // TIGHTER: Reduced vertical padding (py-2)
                                className={`grid grid-cols-8 gap-4 px-5 py-2 border-b border-gray-100 items-center transition-all cursor-pointer group relative 
                                    ${isResolvedOrClosed ? 'opacity-85 bg-green-50/50 hover:bg-green-100/70' : 'bg-white hover:bg-gray-100'}
                                `}
                            >

                                {/* 1. Issue Details (Type, Title, Tags) - Adjusted text and padding */}
                                <div className="col-span-4 pr-3">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="flex items-center gap-1 px-1 py-0.5 text-[9px] font-bold uppercase rounded border border-gray-300 bg-white text-gray-600">
                                            <typeStyles.icon size={9} className={typeStyles.color} /> {issue.type}
                                        </div>
                                        <span className={`font-medium text-xs truncate transition-colors ${isResolvedOrClosed ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-800'}`}>
                                            {issue.title}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {issue.tags.map((tag, i) => {
                                            const { text, bg } = getTagColor(tag);
                                            return (
                                                <span
                                                    key={i}
                                                    className="text-[8px] px-1 py-0.5 rounded font-bold border leading-none"
                                                    style={{ backgroundColor: bg, color: text, borderColor: `${text}40` }}
                                                >
                                                    {tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Team (Collaborators) */}
                                <div className="col-span-1">
                                    <div className="flex -space-x-1 overflow-hidden items-center">
                                        {/* Mock Avatars - REDUCED SIZE */}
                                        {Array.from({ length: Math.min(issue.collaborators, 3) }).map((_, i) => (
                                            <img 
                                                key={i} 
                                                src={`https://i.pravatar.cc/32?img=${issue.creatorId + i}`} 
                                                className="w-5 h-5 rounded-full border border-white bg-gray-300 shadow-sm relative hover:z-10" 
                                                alt={`U${i + 1}`} 
                                            />
                                        ))}
                                        {issue.collaborators > 3 && (
                                            <div className="w-5 h-5 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[6px] font-bold text-gray-600 shadow-sm">
                                                +{issue.collaborators - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Status - REDUCED SIZE */}
                                <div className="col-span-1">
                                    <div className={`flex items-center gap-1 text-[9px] font-bold px-1 py-0.5 rounded border bg-white ${statusStyles.color} ${statusStyles.bg}`}>
                                        <statusStyles.icon size={10} />
                                        <span>{statusStyles.label}</span>
                                    </div>
                                </div>

                                {/* 4. Priority - REDUCED SIZE */}
                                <div className="col-span-1">
                                    <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold border uppercase ${priorityStyles.bg} ${priorityStyles.color}`}>
                                        <priorityStyles.icon size={8} className={`mr-0.5 ${priorityStyles.iconClass}`} /> {issue.priority}
                                    </span>
                                </div>

                                {/* 5. Creator/Solver (Combined column span 1) - REDUCED AVATAR SIZE */}
                                <div className="col-span-1 flex items-center justify-end pl-2">
                                    {issue.isSolved ? (
                                        // Solver Avatar
                                        <div className="relative" title="Solved">
                                            <img src={`https://i.pravatar.cc/32?img=${issue.creatorId + 1}`} className="w-5 h-5 rounded-full border-2 border-green-500 shadow-sm" alt='Solver' />
                                            <CheckCircle2 size={9} className="absolute -bottom-1 -right-1 text-white bg-green-500 rounded-full"/>
                                        </div>
                                    ) : (
                                        // Creator Avatar
                                        <div className="relative" title="Creator">
                                            <img src={`https://i.pravatar.cc/32?img=${issue.creatorId}`} className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" alt='Creator' />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}