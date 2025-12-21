"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  Minus, 
  ArrowRight, 
  ChevronDown, 
  Terminal,
  Info
} from "lucide-react";

// Components
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import AuroraBackground from '@/app/components/AuroraBackground';
import BuiltWith from "@/app/components/BuiltWith";

// --- 1. Pricing Table Internal Component ---
const PricingTable = ({ isAnnual }: { isAnnual: boolean }) => {
  const categories = [
    {
      name: 'Productivity',
      features: [
        { label: 'Productivity suite', values: ['Standard', 'Enhanced', 'Enterprise'] },
        { label: 'AI Assistant level', values: ['Standard', 'Full', 'Priority'] },
        { label: 'Integrated calendar', values: [true, true, true] },
      ]
    },
    {
      name: 'Collaboration',
      features: [
        { label: 'Collaboration type', values: ['Single', 'Team', 'Unlimited'] },
        { label: 'Max collaborators', values: ['1', '50', 'Unlimited'] },
      ]
    },
    {
      name: 'Development',
      features: [
        { label: 'Code linking', values: [true, true, true] },
        { label: 'AI project helper', values: [true, true, true] },
        { label: 'Automated reviews', values: [false, true, true] },
        { label: 'Custom AI tuning', values: [false, false, true] },
      ]
    },
    {
      name: 'Security',
      features: [
        { label: 'Role-based access', values: [false, true, true] },
        { label: 'SSO / SAML', values: [false, false, true] },
        { label: 'Priority Support', values: [false, false, true] },
      ]
    }
  ];

  const FeatureIcon = ({ val }: { val: any }) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="bg-purple-600 p-1 rounded-lg shadow-sm"><Check size={12} className="text-white" strokeWidth={4} /></div>
      ) : (
        <Minus size={14} className="text-zinc-200" strokeWidth={3} />
      );
    }
    return <span className="text-xs font-black uppercase tracking-wider text-zinc-700">{val}</span>;
  };

  return (
    // SUPERCHARGED: Rounded-[40px], Border-2
    <div className="w-full bg-white border-2 border-zinc-100 rounded-[40px] overflow-hidden shadow-2xl shadow-zinc-200/50 relative">
      {/* Table Header */}
      <div className="grid grid-cols-4 bg-[#fcfcfc] border-b-2 border-zinc-100">
        <div className="p-8 flex flex-col justify-end">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Comparison</span>
        </div>
        {['Individual', 'Developers', 'Enterprise'].map((tier, i) => (
          <div key={tier} className={`p-8 text-center border-l-2 border-zinc-100 ${i === 1 ? 'bg-purple-50/30' : ''}`}>
            <h4 className="text-sm font-black uppercase tracking-widest text-[#202124] mb-2">{tier}</h4>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-[#202124]">€{tier === 'Individual' ? (isAnnual ? 150 : 15) : tier === 'Developers' ? (isAnnual ? 300 : 30) : (isAnnual ? 2000 : 200)}</span>
              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{isAnnual ? '/yr' : '/mo'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-zinc-100">
        {categories.map((cat) => (
          <React.Fragment key={cat.name}>
            <div className="bg-zinc-50/50 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-y-2 border-zinc-100">
              {cat.name}
            </div>
            {cat.features.map((feat) => (
              <div key={feat.label} className="grid grid-cols-4 hover:bg-zinc-50/30 transition-colors group">
                <div className="p-5 px-8 text-xs font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors flex items-center">
                  {feat.label}
                </div>
                {feat.values.map((v, i) => (
                  <div key={i} className={`p-5 border-l-2 border-zinc-100 flex items-center justify-center ${i === 1 ? 'bg-purple-50/10' : ''}`}>
                    <FeatureIcon val={v} />
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {/* Footer Info */}
      <div className="p-6 bg-zinc-50 text-center border-t-2 border-zinc-100">
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <Info size={14} strokeWidth={2.5} /> Detailed informations about AI and Token System. 
          <a href="/home/contact" className="text-purple-600 font-black hover:underline underline-offset-4 decoration-2">Learn more</a>
        </p>
      </div>
    </div>
  );
};

// --- FAQ Component ---
const FAQItem = ({ q, a, index, openIndex, setOpenIndex }: any) => {
  const isOpen = openIndex === index;
  return (
    <div className="last:border-b-0 border-zinc-100 border-b-2">
      <h3>
        <button
          onClick={() => setOpenIndex(isOpen ? null : index)}
          className="flex w-full items-start justify-between gap-4 text-left transition-all outline-none py-8 px-4 hover:bg-zinc-50 rounded-2xl group"
        >
          {/* SUPERCHARGED: Font-black / Bold */}
          <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-purple-600' : 'text-[#202124]'}`}>{q}</span>
          <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-purple-100 text-purple-600 rotate-180' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
             <ChevronDown size={18} strokeWidth={3} />
          </div>
        </button>
      </h3>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-8 text-zinc-500 font-medium leading-relaxed text-base max-w-3xl">
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
    { q: "Do you offer support in case of issues?", a: "Yes, we provide full support for all the plans, but for the Enterprise plan we offer 24/7 support with response time in just minutes." },
    { q: "Are there discounts for annual commitments?", a: "Yes, we offer significant annual and multi-year contract discounts tailored to your organization's projected growth." }
  ];

  return (
    <section className="py-24 bg-white border-t-2 border-zinc-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-24">
              <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-6">
                <Terminal size={14} strokeWidth={3} /> Support
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-[#202124] mb-6">Frequently asked questions</h2>
              <p className="text-zinc-500 text-lg mb-10 font-bold leading-relaxed">Can't find the answer you're looking for? Chat with our sales team.</p>
              <a href="/home/contact" className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-[#202124] border-b-2 border-[#202124] hover:text-purple-600 hover:border-purple-600 transition-colors pb-1">
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

// --- Main Page Component ---
export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      id: "individual",
      name: "Individual",
      price: isAnnual ? 150 : 15,
      period: isAnnual ? "/year" : "/mo",
      desc: "For individual developers",
      highlight: false,
      features: ["Single user workspace", "Up to 5 Projects", "AI Assistant (Full Support)", "Code Linking & Analysis", "Project Planning Assistance"],
      limitations: ["No team collaboration", "No shared workspaces"]
    },
    {
      id: "developers",
      name: "Developers",
      price: isAnnual ? 300 : 30,
      period: isAnnual ? "/year" : "/mo",
      desc: "For growing teams & startups",
      highlight: true,
      features: ["Up to 50 Collaborators", "Up to 10 Projects", "Team Velocity Tracking", "Automated Code Reviews", "Integrated Calendar", "Issue Tracking"],
      limitations: ["Max 50 users total", "Max 10 Projects"]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: isAnnual ? 2000 : 200,
      period: isAnnual ? "/year" : "/mo",
      desc: "For large organizations",
      highlight: false,
      features: ["Unlimited Collaborators", "Unlimited Projects", "Reduced AI Token Costs", "Custom AI Model Tuning", "Enterprise-grade Security", "Priority Support", "Advanced Analytics"],
      limitations: []
    }
  ];

  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-white">
        <AuroraBackground />
        <div className="relative z-20 max-w-5xl mx-auto text-center px-6">
          <div className="flex justify-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-50 border border-purple-100 rounded-full shadow-sm">
              <span className="text-[10px] font-black text-purple-700 tracking-[0.2em] uppercase text-center">Flexible Plans</span>
              <ArrowRight size={12} className="text-purple-400" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#202124] leading-[0.95] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Pricing <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">supercharged.</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-500 font-bold max-w-3xl mx-auto leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance">
            Choose the plan that fits your development scale. <br className="hidden md:block" />
            Simple, transparent, and built to scale with your team.
          </p>

          {/* Supercharged Toggle */}
          <div className="inline-grid grid-cols-2 bg-white p-1.5 rounded-full border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 relative animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
            <div
              className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-[#202124] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isAnnual ? 'translate-x-full' : 'translate-x-0'}`}
            />
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-10 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-zinc-500 hover:text-[#202124]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 px-10 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 ${isAnnual ? 'text-white' : 'text-zinc-500 hover:text-[#202124]'}`}
            >
              Yearly
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isAnnual ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                -17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* --- Pricing Cards Section --- */}
      <section className="py-12 px-6 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                // SUPERCHARGED: rounded-[40px], border-2, border-zinc-100
                className={`relative p-10 rounded-[40px] bg-white border-2 transition-all duration-500 overflow-hidden group
                  ${plan.highlight
                    ? 'border-purple-600 shadow-2xl shadow-purple-900/10 scale-105 z-10'
                    : 'border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200 hover:shadow-2xl z-0'
                  }`}
              >
                {/* GRAIN TEXTURE */}
                <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />

                {plan.highlight && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/30 whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div className="mb-10 relative z-10">
                  <h3 className="text-2xl font-black tracking-tight text-[#202124] mb-2">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 font-bold mb-8">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-[#202124] tracking-tighter">€{plan.price}</span>
                    <span className="text-zinc-400 font-black uppercase tracking-widest text-xs">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-5 mb-12 relative z-10">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center ${plan.highlight ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-600'}`}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                      <span className="text-[14px] font-bold text-zinc-600 leading-tight">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limit, i) => (
                    <div key={`limit-${i}`} className="flex items-start gap-4 opacity-40">
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center">
                        <Minus size={12} strokeWidth={4} />
                      </div>
                      <span className="text-[14px] font-bold text-zinc-500 leading-tight">{limit}</span>
                    </div>
                  ))}
                </div>

                <a href="/auth/register" className="w-full relative z-10 block">
                  <button className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center gap-2 group
                    ${plan.highlight
                      ? 'bg-[#202124] text-white hover:bg-black shadow-xl shadow-zinc-900/20'
                      : 'bg-zinc-50 text-[#202124] hover:bg-zinc-100 border-2 border-transparent hover:border-zinc-200'
                    }`}>
                    Get Started
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
{/* Information Footer below Pricing Boxes */}
<div className="mt-16 text-center max-w-3xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
  <p className="text-zinc-500 font-bold text-sm md:text-base leading-relaxed flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
    <span className="opacity-80">For further information about the</span>
    
    <a 
      href="/home/enterprise" 
      className="inline-flex items-center text-[#202124] font-black uppercase tracking-[0.2em] text-[10px] bg-zinc-50 px-4 py-2 rounded-xl border-2 border-zinc-100 hover:border-purple-600 hover:text-purple-600 transition-all shadow-sm active:scale-95"
    >
      Enterprise Plan
    </a>

    <span className="text-zinc-300 font-light mx-1">/</span>

    <span className="opacity-80">reach out via</span>

    <a 
      href="/home/contact" 
      className="inline-flex items-center text-[#202124] font-black uppercase tracking-[0.2em] text-[10px] bg-zinc-50 px-4 py-2 rounded-xl border-2 border-zinc-100 hover:border-purple-600 hover:text-purple-600 transition-all shadow-sm active:scale-95"
    >
      Contact Support
    </a>
  </p>
  
  {/* Subtle Decorative Line */}
  <div className="mt-8 w-12 h-1 bg-zinc-100 mx-auto rounded-full" />
</div>      </section>

      {/* --- Feature Comparison Table --- */}
      <section className="py-32 px-6 bg-[#fcfcfc] border-t-2 border-zinc-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#202124] mb-4">Detailed Comparison</h2>
            <p className="text-zinc-500 text-lg font-bold">Every feature, analyzed for your needs.</p>
          </div>
          <div className="overflow-x-auto rounded-[40px] shadow-sm p-2">
            <PricingTable isAnnual={isAnnual} />
          </div>
        </div>
      </section>

      <BuiltWith />

      {/* --- New FAQ Section --- */}
      <FAQSection />

      <Footer />
    </main>
  );
}