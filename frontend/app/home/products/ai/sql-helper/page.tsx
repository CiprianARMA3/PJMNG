'use client';

import React from 'react';
import {
  Database,
  Terminal,
  Zap,
  Code2,
  ArrowRight,
  ShieldCheck,
  Search,
  Cpu,
  Layers,
  FileCode,
  Mail // Added Mail icon
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';
import { motion } from 'framer-motion';

// --- Specialized "Tech-Look" Database Table Component ---
const DatabaseVisual = () => {
  const tableData = [
    { id: 'usr_01', name: 'Auth_Logic', load: '********', email: 'admin@kapry.dev' },
    { id: 'usr_02', name: 'Vector_Search', load: '************', email: 'ai-node@internal.sys' },
    { id: 'usr_03', name: 'Schema_Audit', load: '******', email: 'db-master@kapry.dev' },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-12 rounded-[32px] border-2 border-zinc-100 bg-white shadow-2xl shadow-zinc-200/50 overflow-hidden font-mono text-[11px]">
      <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
      
      {/* Table Header / Window Controls */}
      <div className="bg-zinc-50 border-b-2 border-zinc-100 px-6 py-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
        </div>
        <div className="text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
          <Terminal size={12} strokeWidth={3} /> DB_INDEX_REGISTRY.CONFIG
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse relative z-10">
          <thead>
            <tr className="border-b border-zinc-50 text-zinc-400 font-black uppercase tracking-widest">
              <th className="px-6 py-4">Index_ID</th>
              <th className="px-6 py-4">Module</th>
              <th className="px-6 py-4">Password</th>
              <th className="px-6 py-4">Linked_Email</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                <td className="px-6 py-4 text-zinc-900 font-bold tracking-tighter">{row.id}</td>
                <td className="px-6 py-4 text-purple-600 font-black uppercase tracking-tighter">{row.name}</td>
                <td className="px-6 py-4 text-zinc-300 font-black tracking-[0.2em]">{row.load}</td>
                <td className="px-6 py-4">
                  {/* Email Styled with tech look */}
                  <div className="flex items-center gap-2 text-zinc-600 font-bold group-hover:text-purple-600 transition-colors">
                    <Mail size={12} className="opacity-40" strokeWidth={2.5} />
                    <span>{row.email}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Console Input Simulation */}
      <div className="p-4 bg-zinc-900 text-zinc-400 border-t-2 border-zinc-100 flex items-center gap-3">
        <span className="text-purple-400 font-black">{'>'}</span>
        <span className="animate-pulse w-1.5 h-4 bg-purple-400" />
        <span className="font-bold opacity-50 italic">SELECT * FROM users WHERE subscription = 'pro';</span>
      </div>
    </div>
  );
};

// --- Reusable Feature Card ---
const FeatureCard = ({ icon: Icon, title, label, description, className = "", isPrimary = false }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`
      group relative p-10 rounded-[40px] bg-white border-2 transition-all duration-500 overflow-hidden
      ${isPrimary ? "border-purple-600 shadow-2xl shadow-purple-900/10 lg:col-span-2" : "border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200"}
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
    <div className="relative z-10 h-full flex flex-col">
      <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-purple-600 flex items-center justify-center mb-8 border-2 border-zinc-100 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all duration-500">
        <Icon size={28} strokeWidth={2.5} />
      </div>
      <div className="flex-grow">
        <h3 className="text-2xl font-black tracking-tighter text-[#202124] mb-2">{title}</h3>
        <p className="text-purple-600 font-black text-sm mb-6 uppercase tracking-widest">{label}</p>
        <p className="text-zinc-500 leading-relaxed text-base font-bold">{description}</p>
      </div>
    </div>
  </motion.div>
);

const SQLHelperPage = () => {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-white">
        <AuroraBackground />
        <div className="relative z-20 max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm mb-8">
            <Database size={14} className="text-purple-600" strokeWidth={3} />
            <span className="text-[10px] font-black text-purple-700 tracking-widest uppercase text-center">Intelligent Query Engine</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#202124] mb-8 leading-[0.95]">
            SQL helper. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Supercharged.</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-bold">
            Write complex queries in your language. Our AI analyzes your schema to optimize logic for maximum production performance.
          </p>
          
          <DatabaseVisual />
        </div>
      </section>

      {/* Main Feature Section */}
      <section className="py-12 pb-24 px-6 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <FeatureCard 
              isPrimary={true}
              icon={Terminal}
              title="Natural Language to SQL"
              label="Human-Centric Data"
              description="Stop wrestling with syntax. Describe your data requirements in plain English, and Kapry translates them into perfectly indented, production-ready SQL statements across all major dialects (Postgres, MySQL, Snowflake)."
            />

            <FeatureCard 
              icon={Zap}
              title="Performance Tuning"
              label="Logic Optimization"
              description="The AI automatically suggests indexes, removes redundant joins, and optimizes subqueries to ensure your database operations are lightning-fast."
            />

            <FeatureCard 
              icon={ShieldCheck}
              title="Schema-Aware"
              label="Contextual Intelligence"
              description="Unlike generic AI, Kapry reads your actual table definitions and relationships, ensuring every generated query is valid and secure."
            />

            <FeatureCard 
              icon={Layers}
              title="Complexity Handling"
              label="Advanced Operations"
              description="From recursive CTEs to complex window functions, Kapry handles the heavy lifting of advanced database architecture."
            />

            <FeatureCard 
              icon={Search}
              title="Smart Auditing"
              label="Error Prevention"
              description="Detect logical flaws and performance bottlenecks before they reach your staging environment with real-time semantic auditing."
            />
          </div>

          {/* Integration Bar (Gradient Version) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10 p-12 rounded-[40px] bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20"
          >
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-15 mix-blend-overlay pointer-events-none" />
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-400 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
              
              <div className="relative z-10 flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:scale-110 transition-transform">
                      <Code2 size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 01</span>
                      <h4 className="font-black text-xl tracking-tight">Input Prompt</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Write your query goal in <span className="text-white">plain English</span>.</p>
                  </div>
              </div>

              <div className="relative z-10 flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:scale-110 transition-transform">
                      <Cpu size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 02</span>
                      <h4 className="font-black text-xl tracking-tight">AI Optimization</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Kapry tunes the logic for <span className="text-white">max performance</span>.</p>
                  </div>
              </div>

              <div className="relative z-10 flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:scale-110 transition-transform">
                      <FileCode size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Step 03</span>
                      <h4 className="font-black text-xl tracking-tight">Export SQL</h4>
                      <p className="text-purple-50 text-[15px] leading-relaxed font-bold">Copy valid code <span className="text-white">directly</span> to your IDE.</p>
                  </div>
              </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t-2 border-zinc-100 bg-zinc-50/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-10 mix-blend-multiply pointer-events-none" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-[#202124] mb-4 tracking-tighter">
            Data, decoded.
          </h2>
          <p className="text-zinc-500 mb-12 font-bold text-lg max-w-xl mx-auto leading-relaxed">
            Stop wasting time on syntax errors. Build complex data models with the power of generative SQL.
          </p>
          <div className="flex justify-center gap-6">
            <a href="/dashboard">
              <button className="flex items-center gap-3 px-10 py-5 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95 cursor-pointer">
                Launch SQL Helper <ArrowRight size={18} strokeWidth={3} />
              </button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default SQLHelperPage;