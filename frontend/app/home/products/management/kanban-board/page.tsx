'use client';

import React from 'react';
import {
  LayoutList,
  Users,
  MousePointer2,
  Zap,
  ArrowRight,
  Maximize2,
  GitCommit,
  Layers,
  CheckCircle2,
  Activity,
  Terminal,
  MousePointerClick,
  Plus
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';
import { motion } from 'framer-motion';

// --- Reusable Feature Card (High-Performance Styling) ---
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  label, 
  description, 
  className = "", 
  isPrimary = false 
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -8 }}
    className={`
      group relative p-10 rounded-[40px] bg-white border-2 transition-all duration-500 overflow-hidden
      ${isPrimary 
        ? "border-purple-600 shadow-2xl shadow-purple-900/10 lg:col-span-2" 
        : "border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200"
      }
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
    
    <div className="relative z-10 h-full flex flex-col">
      <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
        <Icon size={28} strokeWidth={2.5} />
      </div>

      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-2">
            {isPrimary && <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-md">Team Engine</span>}
            <h3 className="text-2xl font-black tracking-tighter text-[#202124]">{title}</h3>
        </div>
        
        <p className="text-purple-600 font-black text-sm mb-6 uppercase tracking-widest">{label}</p>
        
        <p className="text-zinc-500 leading-relaxed text-base font-bold">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

// --- 3D Dashboard Preview ---
const Kanban3DVisual = () => {
  return (
    <div className="relative z-10 w-full max-w-[1250px] perspective-[2500px] px-6 flex justify-center translate-y-8 mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
      <div
        className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,0,0,0.2)] rounded-t-[32px] bg-[#202124] border-[6px] border-[#202124] border-b-0 w-full"
        style={{ transform: 'rotateX(20deg)', transformStyle: 'preserve-3d', marginBottom: '-2px' }}
      >
        <div className="relative overflow-hidden rounded-t-[26px] bg-white border-b border-zinc-200/50">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent z-10 pointer-events-none mix-blend-overlay" />
          <img
            src="/picture-kanban.png"
            alt="Collaborative Kanban Board"
            className="w-full h-auto object-cover block opacity-95"
          />
        </div>
      </div>
    </div>
  );
};

const KanbanPage = () => {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-0 overflow-hidden bg-white border-b-2 border-zinc-100">
        <AuroraBackground />
        <div className="relative z-20 max-w-[1200px] mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Users size={14} className="text-purple-600" strokeWidth={3} />
            <span className="text-[10px] font-black text-purple-700 tracking-widest uppercase">Team-First Workflow</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#202124] mb-8 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
            Unified Kanban. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Built for Teams.</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-3xl mx-auto leading-relaxed font-bold animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Engineered for high-velocity engineering organizations. Track tasks, coordinate with collaborators, and maintain architectural clarity in a high-performance visual environment.
          </p>
        </div>

        <Kanban3DVisual />
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 relative z-10 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <FeatureCard 
              isPrimary={true}
              icon={Users}
              title="Real-time Collaboration"
              label="Sync-First Architecture"
              description="Invite your engineering team and coordinate in real-time. Experience zero-latency updates when collaborators move cards, add comments, or re-prioritize the backlog."
            />

            <FeatureCard 
              icon={MousePointer2}
              title="Drag-and-Drop Precision"
              label="Tactile Management"
              description="Smooth, hardware-accelerated card movements. Organize your board exactly how you think—without fighting the interface."
            />

            <FeatureCard 
              icon={CheckCircle2}
              title="Manual Work-in-Progress Limits"
              label="Discipline Engine"
              description="Set custom WIP limits for every column. Prevent multitasking bloat and ensure your team stays focused on closing tasks before starting new ones."
            />

   <FeatureCard 
  icon={Layers} // or Tag / Link icons
  title="Contextual Metadata"
  label="Resource Integration"
  description="Incorporate custom tags and integrated resource links to provide comprehensive project context, ensuring absolute organizational clarity and alignment for your entire team."
/>
            <FeatureCard 
              icon={Activity}
              title="Team Velocity Metrics"
              label="Performance Analytics"
              description="Track cycle times and throughput. Gain a clear visual understanding of how your team is moving through the roadmap week-over-week."
            />
          </div>

          {/* Integration Bar (Steps) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10 p-12 rounded-[40px] bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20"
          >
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-15 mix-blend-overlay pointer-events-none" />
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-400 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:scale-110 transition-all shadow-xl">
                      <Plus size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 01</span>
                      <h4 className="font-black text-xl tracking-tight text-white">Invite Team</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Add collaborators via <span className="text-white font-black">email or secure link</span>.</p>
                  </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:scale-110 transition-all shadow-xl">
                      <MousePointerClick size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 02</span>
                      <h4 className="font-black text-xl tracking-tight text-white">Set Workflow</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Customize <span className="text-white font-black">columns and tags</span> to fit your stack.</p>
                  </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:scale-110 transition-all shadow-xl">
                      <Zap size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 03</span>
                      <h4 className="font-black text-xl tracking-tight text-white">Start Shipping</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Move cards and <span className="text-white font-black">hit milestones</span> together.</p>
                  </div>
              </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t-2 border-zinc-100 bg-zinc-50/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-10 mix-blend-multiply pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-[#202124] mb-4 tracking-tighter">Ship better, together.</h2>
          <p className="text-[#5f6368] mb-12 font-bold text-lg max-w-xl mx-auto">Stop managing emails and start managing tasks. The ultimate Kanban for engineering synergy.</p>
          <div className="flex justify-center gap-6">
            <a href="/dashboard">
              <button className="flex items-center gap-3 px-10 py-5 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2">
                Launch Kanban <ArrowRight size={18} strokeWidth={3} />
              </button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default KanbanPage;