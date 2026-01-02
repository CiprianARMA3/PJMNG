'use client';

import React from 'react';
import {
  Brain,
  Cpu,
  Sparkles,
  Database,
  Code2,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Zap,
  Activity,
  Bot,
  Search,
  Layers
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
            {isPrimary && <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-md">Enterprise Grade</span>}
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

const GeminiAIPage = () => {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-white">
        <AuroraBackground />
        <div className="relative z-20 max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles size={14} className="text-purple-600" />
            <span className="text-[10px] font-black text-purple-700 tracking-widest uppercase">Powered by Gemini Pro</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#202124] mb-6 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
            Professional AI. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Custom Tuned.</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-bold animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
Harness the power of Gemini's top notch AI models like 2.5 and 3.0. Our specialized implementation offers multi-million token context windows, fine-tuned specifically for your project's unique architecture.

          </p>
        </div>
      </section>

      {/* Main Feature Section */}
      <section className="py-12 pb-24 px-6 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Primary AI Card */}
            <FeatureCard 
              isPrimary={true}
              icon={Brain}
              title="Custom Project Tuning"
              label="Domain Specific Context"
              description="Generic AI doesn't understand your private APIs or internal patterns. We fine-tune Gemini's reasoning layers to align with your team's specific coding standards, style guides, and business logic."
            />

            {/* Multimodal Reasoning */}
            <FeatureCard 
              icon={Layers}
              title="Long-Context Reasoning"
              label="Up to 2M Tokens"
              description="Ingest your entire codebase, documentation, and history. Gemini's massive context window allows for holistic project analysis that other models simply can't handle."
            />

            {/* Compute Power */}
            <FeatureCard 
              icon={Cpu}
              title="High-Performance Compute"
              label="Low Latency Inference"
              description="Deployed on top-tier TPU infrastructure. Experience lightning-fast responses and code generation, optimized for professional developer workflows."
            />

            {/* Semantic Understanding */}
            <FeatureCard 
              icon={Bot}
              title="Architectural Insight"
              label="Deep Semantic Mapping"
              description="Gemini maps the relationships between your components. It doesn't just predict text; it understands how a change in your database schema affects your frontend components."
            />

            {/* Terminal/Logic */}
            <FeatureCard 
              icon={Terminal}
              title="Logic Verification"
              label="Precision Execution"
              description="Gemini validates complex logic chains. Use it to audit financial algorithms, security protocols, or complex state management with mathematical precision."
            />
          </div>

          {/* Tuning Protocol Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10 p-12 rounded-[40px] bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20"
          >
              {/* Enhanced Visual Accents */}
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-15 mix-blend-overlay pointer-events-none" />
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-400 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="absolute -left-20 -top-20 w-72 h-72 bg-indigo-400 rounded-full blur-[100px] opacity-20" />
              
              {/* Step 1: Codebase Ingestion */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                      <Database size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <div className="flex items-center gap-2 opacity-70">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Protocol 01</span>
                      </div>
                      <h4 className="font-black text-xl tracking-tight">Code Ingestion</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                          We index your <span className="text-white font-black">entire project</span> to establish a semantic baseline.
                      </p>
                  </div>
              </motion.div>

              {/* Step 2: Context Tuning */}
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
                      <div className="flex items-center gap-2 opacity-70">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Protocol 02</span>
                      </div>
                      <h4 className="font-black text-xl tracking-tight">Context Tuning</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                          Fine-tuning weights to prioritize <span className="text-white font-black">your internal patterns</span> and documentation.
                      </p>
                  </div>
              </motion.div>

              {/* Step 3: Intelligence Deployment */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative z-10 flex items-start gap-5"
              >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                      <Sparkles size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <div className="flex items-center gap-2 opacity-70">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Protocol 03</span>
                      </div>
                      <h4 className="font-black text-xl tracking-tight">Active Intelligence</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                          Deploy your <span className="text-white font-black">Project</span> and use Gemini's AI across your entire team workspace.
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
            Intelligence, <br /> tailored for your stack.
          </h2>
          <p className="text-[#5f6368] mb-12 font-bold text-lg max-w-xl mx-auto">
            Experience the difference of an AI that truly understands your environment. Tune your first model today.
          </p>
          
          <div className="flex justify-center gap-6">
            <a href="/dashboard">
              <button className="flex items-center gap-3 px-10 py-5 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 cursor-pointer">
                Tune your project <ArrowRight size={20} strokeWidth={3} />
              </button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default GeminiAIPage;