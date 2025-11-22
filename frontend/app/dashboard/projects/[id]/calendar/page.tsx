import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Menu from "./../components/menu";
import CALENDAR from "./components/calendar";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Board({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) redirect("/dashboard");

  return (
    // 1. LOCK WINDOW: h-screen + overflow-hidden prevents browser scrolling
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden">
      <Menu project={project} user={user} />
      
      {/* 2. MAIN COLUMN: flex column that takes full height */}
      <main className="flex-1 ml-64 h-full flex flex-col bg-[#0a0a0a]">
        
        {/* Header: Fixed height (flex-none) */}
        <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold tracking-tight">{project?.name || "Project Board"}</h1>
             <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] uppercase font-bold tracking-wider rounded border border-white/5">Calendar</span>
          </div>
        </div>

        {/* 3. CALENDAR WRAPPER: Fills remaining space, prevents overflow */}
        <div className="flex-1 h-full min-h-0 relative overflow-hidden">
            <CALENDAR/>
        </div>
      </main>
    </div>
  );
}