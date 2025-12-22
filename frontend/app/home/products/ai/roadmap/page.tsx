'use client';

import React from 'react';
import {
  SignpostBig,
  LayoutTemplate,
  Server,
  Sparkles,
  Zap,
  ArrowRight,
  Maximize2,
  Cpu,
  Milestone,
  GitPullRequest,
  Layers,
  CheckCircle2,
  Activity,
  Fingerprint,
  Terminal,
  Bot
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';
import { motion } from 'framer-motion';

// --- Improved Feature Card with RepoReview Animations ---
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
            {isPrimary && <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-md">Advanced Logic</span>}
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

// --- The 3D Tilted Box Visual ---
const Roadmap3DVisual = () => {
  return (
    <div className="relative z-10 w-full max-w-[1300px] perspective-[2500px] px-6 flex justify-center translate-y-8 mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
      <div
        className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,0,0,0.2)] rounded-t-[32px] bg-[#202124] border-[6px] border-[#202124] border-b-0 w-full"
        style={{
          transform: 'rotateX(20deg)',
          transformStyle: 'preserve-3d',
          marginBottom: '-2px'
        }}
      >
        <div className="relative overflow-hidden rounded-t-[26px] bg-white border-b border-zinc-200/50">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent z-10 pointer-events-none mix-blend-overlay" />
          <img
            src="/pic4.png"
            alt="AI Roadmap Dashboard"
            className="w-full h-auto object-cover block opacity-95"
          />
        </div>
      </div>
    </div>
  );
};

const RoadmapPage = () => {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />

      {/* Hero Section with Tailwind Animations */}
      <section className="relative pt-32 pb-0 overflow-hidden bg-white border-b-2 border-zinc-100">
        <AuroraBackground />
        <div className="relative z-20 max-w-[1200px] mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SignpostBig size={14} className="text-purple-600" strokeWidth={3} />
            <span className="text-[10px] font-black text-purple-700 tracking-widest uppercase">Visual Strategy Engine</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#202124] mb-8 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
            AI Roadmap. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Supercharged.</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-3xl mx-auto leading-relaxed font-bold animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Plan models, architectures, and deployment paths with clarity. Connect your vision to an autonomous engine that maps dependencies for you.
          </p>
        </div>

        <Roadmap3DVisual />
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 relative z-10 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <FeatureCard 
              isPrimary={true}
              icon={Milestone}
              title="Automated Milestone Generation"
              label="Intelligent Planning"
              description="Describe your product vision and let Gemini 3.0 generate a full hierarchical roadmap. It identifies critical paths and creates achievable milestones automatically based on your specific stack."
            />

            <FeatureCard 
              icon={GitPullRequest}
              title="Dependency Graph"
              label="Logic Mapping"
              description="Never lose track of blockers. Our AI maps the complex relationships between tasks, showing exactly how one delay impacts your entire project timeline."
            />

            <FeatureCard 
              icon={Activity}
              title="Velocity Prediction"
              label="Data Science"
              description="AI forecasts your shipping dates by analyzing historical sprint data and the current complexity of your roadmap nodes."
            />

            <FeatureCard 
              icon={CheckCircle2}
              title="Professionality based on needs"
              label="Real-time Tracking"
              description="Connected directly to your repository. Watch nodes turn from Zinc to Emerald as commits are pushed and requirements are met."
            />

            <FeatureCard 
              icon={Fingerprint}
              title="Architectural Integrity"
              label="Security Alignment"
              description="Every roadmap node is cross-referenced with your security protocols, ensuring that speed never compromises your system's hardening."
            />
          </div>

          {/* Staggered Integration Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10 p-12 rounded-[40px] bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20"
          >
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-15 mix-blend-overlay pointer-events-none" />
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-400 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="absolute -left-20 -top-20 w-72 h-72 bg-indigo-400 rounded-full blur-[100px] opacity-20" />
              
              {/* Step 01 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                      <Terminal size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 01</span>
                      <h4 className="font-black text-xl tracking-tight text-white">Define Goal</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Input your vision into the AI.</p>
                  </div>
              </motion.div>

              {/* Step 02 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                      <Layers size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 02</span>
                      <h4 className="font-black text-xl tracking-tight text-white">Generate Nodes</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">AI maps all dependencies.</p>
                  </div>
              </motion.div>

              {/* Step 03 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                      <Zap size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 03</span>
                      <h4 className="font-black text-xl tracking-tight text-white">Iterate Live</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Track real progress instantly.</p>
                  </div>
              </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t-2 border-zinc-100 bg-zinc-50/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-10 mix-blend-multiply pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-[#202124] mb-4 tracking-tighter">Plan with precision.</h2>
          <p className="text-[#5f6368] mb-12 font-bold text-lg max-w-xl mx-auto">Stop guessing your next move. Guide your product from inception to deployment.</p>
          <div className="flex justify-center gap-6">
            <a href="/dashboard">
              <button className="flex items-center gap-3 px-10 py-5 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2">
                Launch Roadmap <ArrowRight size={18} strokeWidth={3} />
              </button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default RoadmapPage;