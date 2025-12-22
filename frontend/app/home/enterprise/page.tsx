'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Bot,
  LayoutList,
  ArrowRight,
  ShieldCheck,
  Users,
  TrendingDown,
  Cpu,
  Activity,
  Terminal,
  Fingerprint
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';
import BuiltWith from '@/app/components/BuiltWith';

// --- IMPROVED COMPONENTS ---

const EnterpriseHero = () => (
  <section className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-0 overflow-hidden bg-white border-b-2 border-zinc-100">
    <AuroraBackground />
    <div className="relative z-20 max-w-5xl mx-auto space-y-8 mb-16">
      <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-50 border-2 border-purple-100 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ShieldCheck size={14} className="text-purple-600" strokeWidth={3} />
        <span className="text-[10px] font-black text-purple-700 tracking-[0.2em] uppercase">Enterprise Plan</span>
      </div>

      <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#202124] leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
        Development <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">at any scale.</span>
      </h1>

      <p className="text-xl text-zinc-500 font-bold max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance">
        Custom AI infrastructure, unlimited collaboration, and volume-optimized pricing for the world's most demanding engineering organizations.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
        <a href="/home/contact">
          <button className="group relative w-full sm:w-auto px-10 py-5 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden shadow-xl shadow-zinc-900/20 hover:shadow-2xl active:scale-[0.98] cursor-pointer">
            <span>Talk to Sales</span>
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" strokeWidth={3} />
          </button>
        </a>
        <button className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-zinc-200 text-[#202124] rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]">
          Watch Demo
        </button>
      </div>
    </div>

    {/* 3D Container */}
    <div className="relative z-10 w-full max-w-[1200px] perspective-[2500px] px-6 flex justify-center translate-y-8">
      <div
        className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,0,0,0.2)] rounded-t-[32px] bg-[#202124] border-[6px] border-[#202124] border-b-0"
        style={{
          transform: 'rotateX(20deg)',
          transformStyle: 'preserve-3d',
          marginBottom: '-2px'
        }}
      >
        <div className="relative overflow-hidden rounded-t-[26px] bg-white border-b border-zinc-200/50">
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
  // SUPERCHARGED: rounded-[40px], border-2, grainy texture
  <div className={`group relative p-10 rounded-[40px] bg-white border-2 border-zinc-100 overflow-hidden hover:border-purple-200 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 ease-out hover:-translate-y-1 ${className}`}>
    {/* SIGNATURE GRAIN OVERLAY */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none z-0" />
    

    <div className="w-14 h-14 rounded-2xl bg-zinc-50 border-2 border-zinc-100 text-purple-600 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:border-purple-200 transition-all duration-500 relative z-10">
      <Icon size={24} strokeWidth={2} />
    </div>

    {/* TYPOGRAPHY: font-black tracking-tighter */}
    <h3 className="text-xl font-black tracking-tighter text-[#202124] mb-4 relative z-10">{title}</h3>
    <div className="text-zinc-500 font-bold leading-relaxed text-sm relative z-10">{text}</div>
  </div>
);

const BentoFeatures = () => (
  <section className="py-24 px-6 bg-white relative z-10">
    <div className="max-w-[1200px] mx-auto w-full">
      <div className="mb-16 md:text-center max-w-2xl mx-auto">
        {/* TYPOGRAPHY: font-black, tracking-tighter, leading-[0.95] */}
        <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[#202124] mb-6 leading-[0.95]">
          Everything your organization needs.
        </h2>
        <p className="text-zinc-500 text-lg font-bold">
          Powerful features designed to help large engineering teams ship faster, safer, and with higher quality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(250px,auto)]">
        <BentoCard
          className="md:col-span-2 lg:col-span-2 md:row-span-1"
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

        {/* DARK THEME CARD */}
        <BentoCard
          className="md:col-span-1 md:row-span-2 !bg-[#202124] !border-[#202124]"
          icon={Cpu}
          title={<span className='text-white font-black tracking-tighter'>Dev Ecosystem</span>}
          text={<span className="text-zinc-400 font-bold">Comprehensive tools including code linking, AI project helpers, and a centralized code review dashboard. <br /><br /></span>}
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
        
        {/* SUPPORT CTA CARD */}
        <div className="md:col-span-3 lg:col-span-3 p-10 rounded-[40px] bg-purple-600 border-2 border-purple-600 text-white relative overflow-hidden group">
          {/* GRAIN OVERLAY */}
          <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-20 mix-blend-multiply pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-purple-500 rounded-full blur-[100px] opacity-50 translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4 opacity-90">
                <Fingerprint size={16} strokeWidth={3} /> 
                {/* SUPERCHARGED LABEL: uppercase tracking-widest */}
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enterprise Support</span>
              </div>
              <h3 className="text-3xl font-black tracking-tighter leading-[0.95] mb-4">Fully 24/7 online support.</h3>
              <p className="text-purple-100 font-bold max-w-lg leading-relaxed">We provide help at every hour of the day for no additional costs, for you or your collaborators.</p>
            </div>
            
            {/* SUPERCHARGED BUTTON */}
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-50 transition-all whitespace-nowrap shadow-xl shadow-purple-900/20 active:scale-95">
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
    <div className="last:border-b-0 border-zinc-100 border-b-2">
      <h3>
        <button
          onClick={() => setOpenIndex(isOpen ? null : index)}
          className="flex w-full items-start justify-between gap-4 text-left transition-all outline-none py-8 px-4 hover:bg-zinc-50 rounded-2xl group"
        >
          <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-purple-600' : 'text-[#202124]'}`}>{q}</span>
          <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-purple-100 text-purple-600 rotate-180' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
             <ChevronDown size={18} strokeWidth={3} />
          </div>
        </button>
      </h3>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-8 text-zinc-500 font-bold leading-relaxed text-base">
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
    <section className="py-24 bg-white border-t-2 border-zinc-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-6">
                <Terminal size={14} strokeWidth={3} /> Support
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-[#202124] mb-6">Frequently asked questions</h2>
              <p className="text-zinc-500 text-lg font-bold mb-10">Can't find the answer you're looking for? Chat with our sales team.</p>
              <a href="#" className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-[#202124] border-b-2 border-[#202124] hover:text-purple-600 hover:border-purple-600 transition-colors pb-1">
                Contact Support <ArrowRight size={14} className="ml-2" strokeWidth={3} />
              </a>
            </div>
          </div>
          <div className="md:col-span-8">
            <div className="divide-y-2 divide-zinc-100">
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

// --- CTA Section ---
const ReadyToScale = () => (
  <section className="py-32 bg-white">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-6xl font-black text-[#202124] mb-8 tracking-tighter leading-[0.95]">Ready to ease out your <br /> development ?</h2>
      <p className="text-xl text-zinc-500 font-bold mb-12 max-w-2xl mx-auto">Join the forward-thinking companies building the future with Kapry Enterprise.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/home/contact">
          <button className="px-10 py-5 bg-[#202124] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 cursor-pointer">
            Contact Sales <ArrowRight size={16} strokeWidth={3} />
          </button>
        </a>
        <button className="px-10 py-5 bg-zinc-50 border-2 border-zinc-100 text-[#202124] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 hover:border-zinc-200 transition-all active:scale-95">
          View Documentation
        </button>
      </div>
    </div>
  </section>
);

export default function EnterprisePage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased text-zinc-900">
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