"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, FolderOpen, LayoutGrid } from "lucide-react";
import ProjectTemplate, { ProjectData } from "../projects/Project";
import AddProjectButton from "../projects/component/addMore";
import { motion, Variants } from "framer-motion";

interface HomeSectionProps {
  user: any;
  userName: string;
}

/**
 * MOTION PROTOCOL: 
 * Explicitly typed Variants to prevent TypeScript "String Widening" errors.
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.1, 
      delayChildren: 0.2 
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20 
    } 
  }
};

export default function HomeSection({ user, userName }: HomeSectionProps) {
  const supabase = createClient();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user?.id, supabase]);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="flex h-96 flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[40px] border-2 border-dashed border-zinc-100 dark:border-zinc-800"
      >
        <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
          Initializing Workspace Node...
        </span>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      
      {/* --- HEADER BLOCK --- */}
      <motion.header 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
              Session secured by KAPRYDEV
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">
            Welcome back, {userName}<span className="text-purple-600">.</span>
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm leading-relaxed max-w-md mt-6">
            Audit your active workspace projects and monitor real-time status across the development ecosystem.
          </p>
        </div>
      </motion.header>

      {/* --- INFRASTRUCTURE GRID --- */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Matrix Header Label */}
        <div className="flex items-center gap-2 px-4">
            <LayoutGrid size={14} className="text-purple-600" strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                Projects
            </span>
        </div>

        {/* The Staggered Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <motion.div 
              key={project.id} 
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="relative"
            >
              <ProjectTemplate project={project} creatorName={userName} />
            </motion.div>
          ))}

          {/* Add Project Action Node */}
          <motion.div variants={itemVariants} whileHover={{ y: -8 }}>
            <AddProjectButton />
          </motion.div>
{/* --- EMPTY STATE NODE (Spanning 2 columns) --- */}
{!loading && projects.length === 0 && (
  <motion.div 
    variants={itemVariants}
    className="md:col-span-2 flex flex-col items-center justify-center p-12 bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[40px] text-center"
  >
      <FolderOpen size={32} className="text-zinc-300 dark:text-zinc-700 mb-4" strokeWidth={2} />
      <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
        No Projects Detected
      </h3>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-1">
        Initialize your first deployment node to begin.
      </p>
  </motion.div>
)}

{/* This will now sit next to the Empty State on the same line */}
<motion.div variants={itemVariants} whileHover={{ y: -8 }}>
</motion.div>
        </div>
        
      </motion.section>

      {/* --- EMPTY STATE PROTOCOL --- */}

    </div>
  );
}