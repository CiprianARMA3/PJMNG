'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LandingBoxes from './components/landingPage/boxesLanding';
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  GitBranch,
  Database,
  Bot,
  ArrowRight,
  Play,
  KanbanSquare,
  Activity,
  LayoutList,
  Check,
  Minus,
  UserCog,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  X,
  CheckCircle2
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuroraBackground from './components/AuroraBackground';
import BuiltWith from './components/BuiltWith';

// --- 1. Refined Hero Section ---
const Hero = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-32 pb-0 overflow-hidden bg-white">
    <AuroraBackground />

    <div className="relative z-20 max-w-5xl mx-auto space-y-8 ">
      {/* Version Badge */}
      <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
            <span className="absolute w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
          </div>
          <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase">
            <a href="/home/blog/4">
              KapryDEV Official Launch          
            </a>
          </span>
          <ArrowRight size={12} className="text-purple-400" />
        </div>
      </div>

      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-[#202124] leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
        Development <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">supercharged.</span>
      </h1>

      <p className="text-xl md:text-2xl text-[#5f6368] max-w-3xl mx-auto leading-relaxed font-normal animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance">
        The all-in-one suite that scales your engineering. <br className="hidden md:block" />
        Built for teams that move fast and build for the future.
      </p>

      {/* Primary Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
        {/* PRIMARY: LIVE DEMO */}
        <button className="group relative w-full sm:w-auto px-10 py-5 bg-[#202124] text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-black transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-zinc-900/20 active:scale-95 cursor-pointer overflow-hidden">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <Play size={14} fill="currentColor" className="transition-transform group-hover:scale-110 group-hover:text-purple-400" />
          <span>Initialize Demo</span>
        </button>

        {/* SECONDARY: ARCHITECTURE */}
        <a href="#architecture" className="w-full sm:w-auto">
          <button className="w-full px-10 py-5 bg-white border-2 border-zinc-100 text-zinc-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:border-purple-200 hover:bg-zinc-50 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-zinc-200/50 group">
            <Layers size={14} strokeWidth={3} className="text-zinc-400 group-hover:text-purple-600 transition-colors" />
            <span>System Core</span>
          </button>
        </a>
      </div>

      {/* Gemini Attribution Badge (Safe Version) */}
      <div className="pt-8 animate-in fade-in duration-1000 delay-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
          <Sparkles size={12} className="text-purple-600" strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">
            Utilizing Gemini AI
          </span>        </div>
      </div>
    </div>

    {/* 3D Dashboard Preview */}
    <div className="relative z-10 w-full max-w-[1500px] perspective-[2500px] px-6 flex justify-center translate-y-8">
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
            src="/mainpagepic.png"
            alt="Dashboard Preview"
            className="w-full h-auto object-cover block opacity-95"
          />
        </div>
      </div>
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, text, delay }: { icon: any, title: string, text: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8 }}
    className="group relative p-10 rounded-[40px] bg-white border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200 transition-all duration-500 overflow-hidden"
  >
    {/* Subtle Grainy Texture Overlay */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

    {/* Dynamic Accent Glow */}
    {/* <div className="absolute -right-16 -top-16 w-44 h-44 bg-purple-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" /> */}

    {/* Supercharged Icon Container */}
    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 relative z-10">
      <Icon size={28} strokeWidth={2.5} />
    </div>

    {/* Text Content */}
    <h3 className="text-2xl font-black tracking-tighter text-[#202124] mb-3 relative z-10">
      {title}
    </h3>
    <p className="text-zinc-500 leading-relaxed text-base font-bold relative z-10">
      {text}
    </p>
  </motion.div>
);

const Features = () => (
  <section className="relative py-32 px-6 bg-white overflow-hidden">
    {/* Background Grain for the entire section */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] pointer-events-none" />

    <div className="max-w-[1200px] mx-auto w-full relative z-10">
      {/* Section Header - Now fully centered */}
      <div className="mb-20 text-center">
        {/* The badge row */}
        <div className="flex items-center justify-center gap-2 text-sm font-black text-purple-600 uppercase tracking-[0.2em] mb-4">
          <Activity size={16} strokeWidth={3} /> Core Capabilities
        </div>
        <p id='architecture-explaining'></p>

        {/* The Heading - Added mx-auto to center the max-width block */}
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#202124] max-w-3xl mx-auto leading-[0.95]">
          Everything you need to <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            build faster.
          </span>
        </h2>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={GitBranch}
          title="AI Repo Review"
          text="Connect GitHub. Let AI analyze commits, suggest refactors, and spot security issues instantly."
          delay={0.1}
        />
        <FeatureCard
          icon={Database}
          title="AI SQL Helper"
          text="Write complex queries in plain English. Our assistant optimizes logic for maximum performance."
          delay={0.2}
        />
        <FeatureCard
          icon={KanbanSquare}
          title="Boards & Tasks"
          text="Full project management suite. Drag-and-drop Kanban boards and sprint planning built-in."
          delay={0.3}
        />
        <FeatureCard
          icon={Activity}
          title="Activity Overview"
          text="Real-time visibility into team velocity. Track events and repo logs in one unified view."
          delay={0.4}
        />
        <FeatureCard
          icon={LayoutList}
          title="AI Roadmap"
          text="Visualize your product journey. AI helps you plan milestones and track progress automatically."
          delay={0.5}
        />
        <FeatureCard
          icon={UserCog}
          title="Granular Roles"
          text="Monitor collaborator activity and choose exactly what they can see and do within your repo."
          delay={0.6}
        />
      </div>
    </div>
  </section>
);

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      id: "individual",
      name: "Individual",
      price: isAnnual ? 150 : 15,
      period: isAnnual ? "/year" : "/mo",
      desc: "Perfect for solo developers and side projects.",
      highlight: false,
      features: [
        "Single user workspace",
        "Up to 5 Projects",
        "AI Assistant (Standard)",
        "Code Linking & Analysis",
        "Project Planning Help"
      ],
      limitations: ["No team collaboration", "No shared workspaces"]
    },
    {
      id: "developers",
      name: "Developers",
      price: isAnnual ? 300 : 30,
      period: isAnnual ? "/year" : "/mo",
      desc: "For growing teams and scaling startups.",
      highlight: true,
      features: [
        "Up to 50 Collaborators",
        "Up to 10 Projects",
        "Team Velocity Tracking",
        "Automated Code Reviews",
        "Integrated Calendar",
        "Issue Tracking"
      ],
      limitations: ["Max 50 users total"]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: isAnnual ? 2000 : 200,
      period: isAnnual ? "/year" : "/mo",
      desc: "Advanced security and custom AI tuning.",
      highlight: false,
      features: [
        "Unlimited Collaborators",
        "Unlimited Projects",
        "Custom AI Model Tuning",
        "Enterprise-grade Security",
        "Priority 24/7 Support",
        "Advanced Analytics"
      ],
      limitations: []
    }
  ];

  return (
    <section className="py-32 px-6 relative z-10 bg-transparent" id="pricing">
      <div className="max-w-[1200px] mx-auto w-full relative">

        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-4">
            <Zap size={14} fill="currentColor" className="animate-pulse" />
            Flexible Options
          </div>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-[#202124] mb-6">
            Simple, transparent <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              pricing.
            </span>
          </h2>
          <p className="text-xl text-[#5f6368] font-bold max-w-2xl mx-auto mb-12">
            Choose the plan that fits your development scale. No hidden fees.
          </p>

          {/* Supercharged Switch */}
          <div className="inline-flex items-center bg-white p-1.5 rounded-2xl border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 relative">
            <motion.div
              animate={{ x: isAnnual ? "100%" : "0%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-[#202124] rounded-xl z-0"
            />
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-10 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300 w-40 ${!isAnnual ? 'text-white' : 'text-[#5f6368]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 px-10 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300 w-40 flex items-center justify-center gap-2 ${isAnnual ? 'text-white' : 'text-[#5f6368]'}`}
            >
              Yearly
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isAnnual ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className={`group relative p-10 rounded-[44px] bg-white border-2 flex flex-col transition-all duration-500 overflow-hidden
                ${plan.highlight
                  ? 'border-purple-600 shadow-2xl shadow-purple-900/10 lg:scale-105 z-10'
                  : 'border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200'
                }`}
            >
              {/* Premium Grain Texture */}
              <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.04] mix-blend-multiply pointer-events-none" />

              {plan.highlight && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/30 whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="mb-10 relative z-10">
                <h3 className="text-2xl font-black tracking-tighter text-[#202124] mb-2 uppercase tracking-tight">{plan.name}</h3>
                <p className="text-sm text-[#5f6368] font-bold mb-8 leading-relaxed">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-[#202124]">€{plan.price}</span>
                  <span className="text-[#5f6368] font-black uppercase tracking-widest text-xs">{plan.period}</span>
                </div>
              </div>

              {/* Feature List */}
              <div className="space-y-5 mb-12 flex-grow relative z-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center ${plan.highlight ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-600'}`}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                    <span className="text-[15px] text-zinc-600 font-bold leading-tight">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limit, i) => (
                  <div key={`limit-${i}`} className="flex items-start gap-4 opacity-40">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center">
                      <Minus size={12} strokeWidth={4} />
                    </div>
                    <span className="text-[15px] text-zinc-500 font-bold leading-tight line-through decoration-zinc-300">{limit}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <a href="/dashboard" className="block relative z-10">
                <button className={`w-full py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group
                  ${plan.highlight
                    ? 'bg-[#202124] text-white hover:bg-black shadow-xl shadow-zinc-900/20'
                    : 'bg-zinc-50 text-[#202124] border-2 border-transparent hover:border-zinc-200'
                  }`}>
                  Choose {plan.name}
                  <ArrowRight size={16} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
                </button>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Footer Support Note */}
        <div className="mt-20 text-center relative z-10">
          <p className="text-xs text-zinc-400 font-black uppercase tracking-[0.2em] flex flex-col md:flex-row items-center justify-center gap-2">
            <span>Questions about our volume pricing?</span>
            <a href="/home/contact" className="text-purple-600 hover:text-purple-700 transition-colors border-b-2 border-purple-100 hover:border-purple-600 pb-0.5">
              Talk to our engineering team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

// --- Main Page Component ---
function HomeContent() {
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Check for message in URL params (both query string and hash)
    const messageFromQuery = searchParams.get('message');
    const hashParams = typeof window !== 'undefined' ? window.location.hash : '';
    const hashMessage = hashParams.includes('message=')
      ? decodeURIComponent(hashParams.split('message=')[1]?.split('&')[0] || '')
      : null;

    const message = messageFromQuery || hashMessage;

    if (message) {
      setNotification(message);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 8000);

      // Clean up the URL
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      {/* Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-25 left-1/2 z-[100] max-w-lg w-[90%]"
          >
            <div className="bg-white border-2 border-green-200 rounded-2xl shadow-2xl shadow-green-500/10 p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-800 leading-relaxed">
                  {notification}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="flex-shrink-0 p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-zinc-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <Hero />
      <div id='architecture' className="relative z-20 ">
        <div className="text-center mb-16 pt-32 max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#202124] max-w-3xl mx-auto leading-[0.95]">
            Your entire workflow <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              in one Dashboard.
            </span>
          </h2>
          <p className="text-[#5f6368] text-lg mt-3 font-bold">Centralize your code, tasks, and AI assistance in a single high-performance view.</p>
        </div>
        <LandingBoxes />
        <BuiltWith />
      </div>


      <Features />
      <PricingSection />
      <Footer />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}