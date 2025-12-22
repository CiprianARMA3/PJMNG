'use client';

import React from 'react';
import {
  Github,
  Key,
  ShieldAlert,
  Zap,
  Code2,
  GitCommit,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Lock,
  Search,
  Cpu,
  Activity,
  Bot
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';
import { motion } from 'framer-motion';

// --- Reusable Feature Card ---
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
            {isPrimary && <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-md">Power Feature</span>}
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

const RepoReviewPage = () => {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-white">
        <AuroraBackground />
        <div className="relative z-20 max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Bot size={14} className="text-purple-600" />
            <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase">Autonomous Review</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#202124] mb-6 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
            AI Repository <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Deep Review.</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-bold animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Connect your GitHub infrastructure via secure private keys. Let our specialized models audit your codebase, refactor logic, and harden security in real-time.
          </p>
        </div>
      </section>

      {/* Main Feature Section */}
      <section className="py-12 pb-24 px-6 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Primary Connection Card */}
            <FeatureCard 
              isPrimary={true}
              icon={Github}
              title="Secure GitHub Deep-Link"
              label="Private Key Authentication"
              description="Seamlessly link your private repositories using encrypted private keys and repo URLs. We don't just read code; we understand your environment's context while maintaining bank-grade security protocols."
            />

            {/* Commit Analysis */}
            <FeatureCard 
              icon={Activity}
              title="Commit Auditing"
              label="Real-time Tracking"
              description="Our AI monitors every push. It analyzes the delta between commits to ensure architectural consistency and prevent logic regressions before they reach production."
            />

            {/* Refactoring */}
            <FeatureCard 
              icon={Zap}
              title="Auto-Refactor"
              label="Suggested Optimizations"
              description="Receive instant pull request comments with suggested refactors. Improve readability, reduce complexity, and squash technical debt automatically."
            />

            {/* Security */}
            <FeatureCard 
              icon={ShieldAlert}
              title="Vulnerability Spotting"
              label="Security Hardening"
              description="Instantly detect leaked secrets, SQL injection patterns, and outdated dependencies. Our AI acts as a 24/7 security researcher for your codebase."
            />

            {/* Terminal/Logic */}
            <FeatureCard 
              icon={Terminal}
              title="Logic Validation"
              label="Semantic Analysis"
              description="Verify that your code actually does what the documentation claims. Our AI spots edge cases that standard unit tests might miss."
            />
          </div>

{/* Integration Bar - Supercharged Version */}
<motion.div 
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10 p-12 rounded-[40px] bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20"
>
    {/* Enhanced Visual Accents */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-15 mix-blend-overlay pointer-events-none" />
    <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-400 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
    <div className="absolute -left-20 -top-20 w-72 h-72 bg-indigo-400 rounded-full blur-[100px] opacity-20" />
    
    {/* Step 1: Paste Repo URL */}
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="relative z-10 flex items-start gap-5"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
            <Key size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-70">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Step 01</span>
            </div>
            <h4 className="font-black text-xl tracking-tight">Paste Repo URL</h4>
            <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                Point us to your <span className="text-white font-black">public or private</span> GitHub repository.
            </p>
        </div>
    </motion.div>

    {/* Step 2: Link Private Key */}
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative z-10 flex items-start gap-5"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
            <Lock size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-70">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Step 02</span>
            </div>
            <h4 className="font-black text-xl tracking-tight">Link Private Key</h4>
            <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                Provide an <span className="text-white font-black">SSH key</span> for secure read-only access to private logic.
            </p>
        </div>
    </motion.div>

    {/* Step 3: Instant Audit */}
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="relative z-10 flex items-start gap-5"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
            <Activity size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-70">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Step 03</span>
            </div>
            <h4 className="font-black text-xl tracking-tight">Instant Audit</h4>
            <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                Review <span className="text-white font-black">AI suggestions</span> directly in your Kapry dashboard.
            </p>
        </div>
    </motion.div>
</motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t-2 border-zinc-100 bg-zinc-50/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-10 mix-blend-multiply pointer-events-none" />
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-[#202124] mb-4 tracking-tighter">
            Stop guessing. <br /> Start reviewing.
          </h2>
          <p className="text-[#5f6368] mb-12 font-bold text-lg max-w-xl mx-auto">
            Bring autonomous intelligence to your git workflow. Deploy safer code, faster.
          </p>
          
          <div className="flex justify-center gap-6">
            <a href="/dashboard">
            <button className="flex items-center gap-3 px-10 py-5 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 cursor-pointer">
              Create a project <ArrowRight size={20} strokeWidth={3} />
            </button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default RepoReviewPage;