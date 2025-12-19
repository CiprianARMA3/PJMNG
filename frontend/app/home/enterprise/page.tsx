'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  Bot,
  GitBranch,
  Database,
  LayoutList,
  KanbanSquare,
  UserCog,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  CheckCircle2,
  Mail,
  Lock,
  MessageSquare,
  Cpu,
  Activity,
  Terminal,
  TrendingDown,
  Fingerprint
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';
import BuiltWith from '@/app/components/BuiltWith';


// --- IMPROVED COMPONENTS ---

const EnterpriseHero = () => (
  <section className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-0 overflow-hidden bg-white border-b border-zinc-100">
    <AuroraBackground />
    <div className="relative z-20 max-w-5xl mx-auto space-y-8 mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ShieldCheck size={14} className="text-purple-600" />
        <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase">Enterprise Plan</span>
      </div>

      <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#202124] leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
        Development <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">at any scale.</span>
      </h1>

      <p className="text-xl text-[#5f6368] max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance">
        Custom AI infrastructure, unlimited collaboration, and volume-optimized pricing for the world's most demanding engineering organizations.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
        <button className="group relative w-full sm:w-auto px-8 py-4 bg-[#1a1a1a] text-white rounded-lg font-medium text-[15px] hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden shadow-lg hover:shadow-xl active:scale-[0.98]">
          <span>Talk to Sales</span>
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <button className="w-full sm:w-auto px-8 py-4 bg-white border border-zinc-200 text-[#3c4043] rounded-lg font-medium text-[15px] hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          View Demo
        </button>
      </div>
    </div>

    {/* 3D Container */}
    <div className="relative z-10 w-full max-w-[1200px] perspective-[2500px] px-6 flex justify-center translate-y-8">
      <div
        className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,0,0,0.2)] rounded-t-2xl bg-zinc-900 border-[6px] border-zinc-900 border-b-0"
        style={{
          transform: 'rotateX(20deg)',
          transformStyle: 'preserve-3d',
          marginBottom: '-2px'
        }}
      >
        <div className="relative overflow-hidden rounded-t-lg bg-white border-b border-zinc-200/50">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent z-10 pointer-events-none mix-blend-overlay" />
          <img
            src="/pic4.png"
            alt="Enterprise Dashboard"
            className="w-full h-auto object-cover block opacity-95"
          />
        </div>
      </div>
    </div>
  </section>
);


// --- Bento Grid Features ---
const BentoCard = ({ icon: Icon, title, text, className = "" }: any) => (
  <div className={`group relative p-8 rounded-3xl bg-zinc-50 border border-zinc-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-1 ${className}`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100" />

    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 text-purple-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:border-purple-200 transition-all duration-500 relative z-10">
      <Icon size={24} strokeWidth={1.5} />
    </div>

    <h3 className="text-xl font-bold text-[#202124] mb-3 relative z-10">{title}</h3>
    <p className="text-[#5f6368] leading-relaxed text-sm relative z-10">{text}</p>
  </div>
);

const BentoFeatures = () => (
  <section className="py-24 px-6 bg-white relative z-10">
    <div className="max-w-[1200px] mx-auto w-full">
      <div className="mb-16 md:text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#202124] mb-4">Everything your organization needs.</h2>
        <p className="text-[#5f6368] text-lg">Powerful features designed to help large engineering teams ship faster, safer, and with higher quality.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(250px,auto)]">
        {/* Large Card 1 */}
        <BentoCard
          className="md:col-span-2 lg:col-span-2 md:row-span-1 bg-gradient-to-br from-zinc-50 to-white"
          icon={Bot}
          title="Productivity Suite"
          text="Enterprise-grade productivity featuring premium AI support, context-aware autocompletion, and fully integrated calendars for seamless scheduling across timezones."
        />
        <BentoCard
          className="md:col-span-1"
          icon={Users}
          title="Unlimited Seats"
          text="A limitless multi-user workspace designed for large-scale organizational synergy and RBAC."
        />
        <BentoCard
          className="md:col-span-1"
          icon={TrendingDown}
          title="Cost Optimization"
          text="Volume-based discounts on AI tokens, optimized for high-throughput engineering teams."
        />

        {/* Tall Card */}
        <BentoCard
          className="md:col-span-1 md:row-span-2 bg-zinc-900 !border-zinc-800"
          icon={Cpu}
          title={<p className='text-white'>Dev Ecosystem</p>}
          text={<span className="text-zinc-400">Comprehensive tools including code linking, AI project helpers, and a centralized code review dashboard. <br /><br /></span>}
        />

        <BentoCard
          className="md:col-span-2"
          icon={Activity}
          title="Intelligent AI Analytics"
          text="Real-time velocity tracking, DORA metrics, and custom AI model fine-tuning based on your codebase history."
        />
        <BentoCard
          className="md:col-span-1"
          icon={LayoutList}
          title="Roadmaps"
          text="Strategic project management with issue tracking and concept workspaces."
        />
        <div className="md:col-span-3 lg:col-span-3 p-8 rounded-3xl bg-purple-600 text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-20 mix-blend-multiply" />
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-50 translate-x-1/2 translate-y-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Fingerprint size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Enterprise Support</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Fully 24/7 online support provided.</h3>
              <p className="text-purple-100 max-w-lg">Will provide help at every hour of the day for no additional costs, for you or your collaborators.</p>
            </div>
            <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors whitespace-nowrap">
              View Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// --- FAQ Section ---
const FAQItem = ({ q, a, index, openIndex, setOpenIndex }: any) => {
  const isOpen = openIndex === index;
  return (
    <div className="last:border-b-0 border-zinc-200 border-b">
      <h3>
        <button
          onClick={() => setOpenIndex(isOpen ? null : index)}
          className="flex w-full items-start justify-between gap-4 text-left font-medium transition-all outline-none text-lg py-6 px-4 hover:bg-zinc-50 rounded-lg group"
        >
          <span className={`group-hover:text-purple-600 transition-colors ${isOpen ? 'text-purple-600' : 'text-zinc-700'}`}>{q}</span>
          <ChevronDown className={`text-zinc-400 size-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
        </button>
      </h3>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-6 text-zinc-500 leading-relaxed text-base">
          {a}
        </div>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "What's the difference between Developer and Enterprise plans?", a: "Enterprise includes unlimited collaborators, significant volume-based token discounts, and priority support that aren't available on the Developer tier." },
    { q: "How does billing work for AI features?", a: "Enterprise billing is centralized and usage-based. You get an optimized token rate for your whole organization, with deep analytics to track ROI across teams." },
    { q: "Does KapryDEV offer a role based system for our collaborators?", a: "Yes. Enterprise customers get full tech support and advanced Role-Based Access Controls (RBAC) to manage large engineering orgs." },
    { q: "Do you offer support in case of issues?", a: "Yes, we provide full support for all the plans, but for the Enterprise plan we offer 24/7 support with response time in just minutes.." },
    { q: "Are there discounts for annual commitments?", a: "Yes, we offer significant annual and multi-year contract discounts tailored to your organization's projected growth." }
  ];

  return (
    <section className="py-24 bg-white border-t border-zinc-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-600 uppercase tracking-widest mb-4">
                <Terminal size={16} /> Support
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-[#202124] mb-4">Frequently asked questions</h2>
              <p className="text-zinc-500 text-lg mb-8">Can't find the answer you're looking for? Chat with our sales team.</p>
              <a href="#" className="inline-flex items-center text-sm font-bold text-[#202124] border-b-2 border-[#202124] hover:text-purple-600 hover:border-purple-600 transition-colors pb-0.5">
                Contact Support <ArrowRight size={14} className="ml-2" />
              </a>
            </div>
          </div>
          <div className="md:col-span-8">
            <div className="divide-y divide-zinc-100">
              {faqs.map((faq, i) => (
                <FAQItem key={i} index={i} q={faq.q} a={faq.a} openIndex={openIndex} setOpenIndex={setOpenIndex} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Compliance Banner ---


// --- CTA Section ---
const ReadyToScale = () => (
  <section className="py-24 bg-white">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-[#202124] mb-6 tracking-tight">Ready to ease out your <br /> development ?</h2>
      <p className="text-xl text-[#5f6368] mb-10 max-w-2xl mx-auto">Join the forward-thinking companies building the future with Kapry Enterprise.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button className="px-8 py-4 bg-[#202124] text-white rounded-full font-bold text-lg hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2">
          Contact Sales <ArrowRight size={18} />
        </button>
        <button className="px-8 py-4 bg-zinc-100 text-[#202124] rounded-full font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95">
          View Documentation
        </button>
      </div>
    </div>
  </section>
);

export default function EnterprisePage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />
      <EnterpriseHero />
      <BuiltWith />
      <BentoFeatures />
      <FAQSection />
      <ReadyToScale />
      <Footer />
    </main>
  );
}