'use client';

import React, { useState, useEffect } from 'react';
import LandingBoxes from './components/landingPage/boxesLanding';
import {
  ChevronDown,
  Menu,
  X,
  LayoutList,
  GitBranch,
  Database,
  Bot,
  ArrowRight,
  Play,
  KanbanSquare,
  Activity,
  TerminalSquare,
  Check,
  Minus,
  UserCog
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuroraBackground from './components/AuroraBackground';
import BuiltWith from './components/BuiltWith';

// --- 3. Hero Section ---
const Hero = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 overflow-hidden">
    <AuroraBackground />

    <div className="relative z-20 max-w-4xl mx-auto space-y-10 animate-fade-in-up">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-md border border-white/40 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true"></span>
          </div>
          <span className="text-sm font-medium text-[#5f6368]">KAPRY.DEV VERSION 1.0</span>
          <ArrowRight size={14} className="text-[#5f6368]" />
        </div>
      </div>
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#202124] leading-[1.05]">
        Development, <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-normal pb-2">supercharged by AI.</span>
      </h1>
      <p className="text-xl text-[#5f6368] max-w-4xl mx-auto leading-relaxed font-light">
        The solution that scales your development, your all in one tool. <br />
        Built for businesses of every size—from growing teams to global corporations.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button className="h-14 px-8 rounded-full bg-[#202124] text-white font-medium text-[15px] hover:bg-black transition-all hover:-translate-y-0.5 shadow-lg shadow-purple-900/10 flex items-center gap-3">
          <Play size={18} fill="currentColor" /> Live Demo
        </button>
        <button className="h-14 px-8 rounded-full bg-white/50 backdrop-blur-md text-[#202124] font-medium text-[15px] hover:bg-white/80 transition-all hover:-translate-y-0.5 border border-white/60 flex items-center gap-2 shadow-sm">
          View Architecture
        </button>
      </div>
      <div className="pt-8 animate-fade-in -mt-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 mix-blend-multiply">
          <img src="https://freepnglogo.com/images/all_img/1728457808_Google_Gemini_logo_PNG.png" className='w-30 mt-2 inline-block ml-2 opacity-80 mix-blend-multiply hover:grayscale-0 transition-all' alt="Gemini" />
        </div>
      </div>
    </div>
  </section>
);

// --- 4. Features Grid ---
const FeatureCard = ({ icon: Icon, title, text }: { icon: any, title: string, text: string }) => (

  <div className="group relative p-10 rounded-[2rem] bg-gray-50/50 border border-transparent 
    hover:border-purple-100/50 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/20 
    hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-2">

    <div className="w-14 h-14 rounded-2xl bg-white text-purple-600 flex items-center justify-center mb-8 shadow-sm 
      group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-purple-200 transition-all duration-500">
      <Icon size={28} strokeWidth={1.5} />
    </div>

    <h3 className="text-2xl font-medium text-[#202124] mb-4 group-hover:text-purple-600 transition-colors duration-300">{title}</h3>
    <p className="text-[#5f6368] leading-relaxed text-lg group-hover:text-[#4b4d52] transition-colors duration-300">{text}</p>

    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
  </div>
);

const Features = () => (

  <section className="py-32 px-6 bg-white relative z-10 flex items-center">

    <div className="max-w-[1200px] mx-auto w-full">
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={GitBranch}
          title="AI Repo Review"
          text="Connect GitHub. Let AI analyze commits, suggest refactors, and spot security issues."
        />
        <FeatureCard
          icon={Database}
          title="AI SQL Helper"
          text="Write complex queries in plain English. The built-in SQL Assistant optimized logic for you."
        />
        <FeatureCard
          icon={KanbanSquare}
          title="Boards & Tasks"
          text="Full project management suite. Drag-and-drop Kanban boards and sprint planning built-in."
        />
        <FeatureCard
          icon={Activity}
          title="Activity Overview"
          text="Real-time visibility into team velocity. Track events and repo logs in one view."
        />
        <FeatureCard
          icon={LayoutList}
          title="AI Roadmap"
          text="Visualize your product journey. AI helps you plan milestones and track progress."
        />
        <FeatureCard
          icon={UserCog}
          title="Collaborators Roles & Permissions"
          text="Monitor your collaborator's activity and choose what they can and can't do."
        />
      </div>
    </div>
  </section>
);

// --- 5. Pricing Section ---
const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      id: "individual",
      name: "Individual",
      price: isAnnual ? 150 : 15,
      period: isAnnual ? "/year" : "/mo",
      desc: "For individual developers",
      highlight: false,
      features: [
        "Single user workspace",
        "Up to 5 Projects",
        "AI Assistant (Full Support)",
        "Code Linking & Analysis",
        "Project Planning Assistance"
      ],
      limitations: [
        "No team collaboration",
        "No shared workspaces"
      ]
    },
    {
      id: "developers",
      name: "Developers",
      price: isAnnual ? 300 : 30,
      period: isAnnual ? "/year" : "/mo",
      desc: "For growing teams & startups",
      highlight: true,
      features: [
        "Up to 50 Collaborators",
        "Up to 10 Projects",
        "Team Velocity Tracking",
        "Automated Code Reviews",
        "Integrated Calendar",
        "Issue Tracking"
      ],
      limitations: [
        "Max 50 users total",
        "Max 10 Projects"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: isAnnual ? 2000 : 200,
      period: isAnnual ? "/year" : "/mo",
      desc: "For large organizations",
      highlight: false,
      features: [
        "Unlimited Collaborators",
        "Unlimited Projects",
        "Reduced AI Token Costs",
        "Custom AI Model Tuning",
        "Enterprise-grade Security",
        "Priority Support",
        "Advanced Analytics"
      ],
      limitations: []
    }
  ];

  return (
    <section className="py-24 px-6 relative z-10 overflow-hidden" id="pricing">
      <div className="max-w-[1200px] mx-auto w-full relative">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium text-[#202124] mb-6 tracking-tight">
            <a href="pricing"></a>
            Simple, transparent pricing.
          </h2>
          <p className="text-xl text-[#5f6368] max-w-2xl mx-auto mb-10">
            Choose the plan that fits your development scale.
          </p>

          {/* Toggle */}
          <div className="inline-grid grid-cols-2 bg-white p-1 rounded-full border border-gray-200 shadow-sm relative">
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#202124] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isAnnual ? 'translate-x-full' : 'translate-x-0'}`}
            />
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-8 py-2.5 text-sm font-medium rounded-full transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-[#5f6368] hover:text-[#202124]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 px-8 py-2.5 text-sm font-medium rounded-full transition-colors duration-300 flex items-center justify-center gap-1.5 ${isAnnual ? 'text-white' : 'text-[#5f6368] hover:text-[#202124]'}`}
            >
              Yearly
              <span className={`text-[13px] font-semibold px-1.5 py-0.5 rounded ${isAnnual ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 rounded-[2rem] bg-white border transition-all duration-500 
                ${plan.highlight
                  ? 'border-purple-600 shadow-2xl shadow-purple-900/10 scale-105 z-10'
                  : 'border-gray-100 shadow-xl shadow-gray-200/50 hover:border-gray-300 hover:shadow-2xl z-0'
                }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#202124] mb-2">{plan.name}</h3>
                <p className="text-sm text-[#5f6368] mb-6">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#202124]">€{plan.price}</span>
                  <span className="text-[#5f6368] font-medium">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[15px] text-[#4b4d52]">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limit, i) => (
                  <div key={`limit-${i}`} className="flex items-start gap-3 opacity-60">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                      <Minus size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[15px] text-[#5f6368]">{limit}</span>
                  </div>
                ))}
              </div>
              <a href="/dashboard" className='cursor-pointer'>
                <button className={`w-full py-3.5 rounded-xl font-medium transition-all duration-300 cursor-pointer 
                ${plan.highlight
                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/30'
                    : 'bg-gray-50 text-[#202124] hover:bg-gray-100 border border-transparent hover:border-gray-200'
                  }`}>
                  Get Started

                </button>
              </a>
            </div>
          ))}
        </div>

        {/* Note about Source Code */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#5f6368]">
            Need more info about how it works? <a href="#" className="text-purple-600 font-medium hover:underline">Contact us </a> for further informations.
          </p>
        </div>

      </div>
    </section>
  );
};


// --- Main Page Component ---
export default function Page() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth">
      <Navbar className="bg-white/20" />
      <Hero />
      {/* NEW: Wrapper for LandingBoxes. Placed between Hero and Features.
        We use relative positioning here and z-20 to ensure it's above the white background of the Features section 
        but likely behind the FeatureCards which are z-10 inside Features.
        The negative margin is an aesthetic guess to make the boxes visually flow up into the Hero section.
      */}
      <div className="relative z-20 -mt-24">
        <div className="text-center mb-10 mt-20 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-medium text-[#202124] mb-4  mt-30 tracking-tight">
            Your entire workflow. <br /> In one dashboard.
          </h2>
        </div>
        <LandingBoxes />
        <BuiltWith />
      </div>
      <div className="text-center mt-20  max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-medium text-[#202124] mb-2 tracking-tight">
          Every feature in detail <br /> For you and your collaborators.
        </h2>
      </div>
      <Features />
      <PricingSection />
      <Footer />
    </main>
  );
}