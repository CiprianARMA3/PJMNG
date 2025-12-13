// frontend/app/dashboard/components/dashboard-sections/MailSection.tsx
"use client";

import { Bell, Inbox, Filter } from "lucide-react";

const PageWidget = ({ title, icon: Icon, children, action }: any) => (
  <div className="relative z-10 w-full bg-[#111111] border border-[#222] rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] hover:border-[#333] transition-colors">
    <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between bg-[#141414] rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
           <Icon size={14} className="text-neutral-400" />
        </div>
        <h3 className="text-sm font-medium text-neutral-300 tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className="flex-1 p-6 bg-[#111111] min-h-0 relative flex flex-col rounded-b-xl text-neutral-300">
      {children}
    </div>
  </div>
);

export default function MailSection() {
  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-xl font-medium text-white/90 mb-1">Updates & Messages</h1>
        <p className="text-sm text-neutral-500">System notifications and project updates.</p>
      </div>

      <PageWidget 
        title="Inbox" 
        icon={Inbox}
        action={<Filter size={14} className="text-neutral-600 hover:text-neutral-400 cursor-pointer" />}
      >
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-[#161616] rounded-full flex items-center justify-center mb-4 border border-[#222]">
                <Bell className="w-6 h-6 text-neutral-600" />
            </div>
            <h3 className="text-neutral-300 font-medium text-sm mb-1">All caught up</h3>
            <p className="text-neutral-500 text-xs max-w-xs mx-auto">
                You have no new notifications or messages at this time.
            </p>
        </div>
      </PageWidget>
    </div>
  );
}