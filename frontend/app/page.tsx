'use client';

import React, { useState } from 'react';
import LandingBoxes from './components/landingPage/boxesLanding';
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
  Cpu
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
          <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase">Version 1.0 Launch</span>
          <ArrowRight size={12} className="text-purple-400" />
        </div>
      </div>

      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-[#202124] leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700">
        Development <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">supercharged.</span>
      </h1>

      <p className="text-xl md:text-2xl text-[#5f6368] max-w-3xl mx-auto leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance">
        The all-in-one suite that scales your engineering. <br className="hidden md:block" />
        Built for teams that move fast and build for the future.
      </p>

      {/* Primary Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
        <button className="group relative w-full sm:w-auto h-14 px-8 bg-[#1a1a1a] text-white rounded-full font-medium text-[15px] hover:bg-black transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95">
          <Play size={18} fill="currentColor" className="transition-transform group-hover:scale-110" /> 
          Live Demo
        </button>
        
        <a href="#architecture" className="w-full sm:w-auto">
          <button className="w-full h-14 px-8 bg-white border border-zinc-200 text-[#3c4043] rounded-full font-medium text-[15px] hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95">
            View Architecture
          </button>
        </a>
      </div>

      {/* Gemini Attribution Badge (Safe Version) */}
      <div className="pt-8 animate-in fade-in duration-1000 delay-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#9aa0a6]">Utilizing Google Gemini AI</span>
        </div>
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

// --- 2. Refined Feature Card ---
const FeatureCard = ({ icon: Icon, title, text }: { icon: any, title: string, text: string }) => (
  <div className="group relative p-8 rounded-3xl bg-zinc-50 border border-zinc-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-2">
    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 text-purple-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 relative z-10">
      <Icon size={24} strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold text-[#202124] mb-3 relative z-10">{title}</h3>
    <p className="text-[#5f6368] leading-relaxed text-sm relative z-10">{text}</p>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/30 to-transparent rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  </div>
);

const Features = () => (
  <section className="py-24 px-6 bg-white relative z-10">
    <div className="max-w-[1200px] mx-auto w-full">
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard icon={GitBranch} title="AI Repo Review" text="Connect GitHub. Let AI analyze commits, suggest refactors, and spot security issues instantly." />
        <FeatureCard icon={Database} title="AI SQL Helper" text="Write complex queries in plain English. Our assistant optimizes logic for maximum performance." />
        <FeatureCard icon={KanbanSquare} title="Boards & Tasks" text="Full project management suite. Drag-and-drop Kanban boards and sprint planning built-in." />
        <FeatureCard icon={Activity} title="Activity Overview" text="Real-time visibility into team velocity. Track events and repo logs in one unified view." />
        <FeatureCard icon={LayoutList} title="AI Roadmap" text="Visualize your product journey. AI helps you plan milestones and track progress automatically." />
        <FeatureCard icon={UserCog} title="Granular Roles" text="Monitor collaborator activity and choose exactly what they can see and do within your repo." />
      </div>
    </div>
  </section>
);

// --- 3. Pricing Section (Condensed/Styled) ---
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

<h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#202124] mb-4">

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
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />
      <Hero />
      <div id='architecture' className="relative z-20 ">
        <div className="text-center mb-16 pt-32 max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#202124] mb-4">
            Your entire workflow. <br /> In one dashboard.
          </h2>
          <p className="text-[#5f6368] text-lg">Centralize your code, tasks, and AI assistance in a single high-performance view.</p>
        </div>
        <LandingBoxes />
        <BuiltWith />
      </div>
      
      <div className="text-center mt-32 max-w-3xl mx-auto px-6">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#202124] mb-4">Every detail covered.</h2>
        <p className="text-[#5f6368] text-lg">Powerful tools built for precision and speed.</p>
      </div>
      
      <Features />
      <PricingSection />
      <Footer />
    </main>
  );
}