"use client";

import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  Minus, 
  ArrowRight, 
  Play, 
  ChevronDown, 
  Terminal,
  Zap,
  ShieldCheck,
  Cpu,
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
        <div className="bg-purple-50 p-1 rounded-full"><Check size={14} className="text-purple-600" strokeWidth={3} /></div>
      ) : (
        <Minus size={14} className="text-zinc-200" />
      );
    }
    return <span className="text-sm font-medium text-zinc-700">{val}</span>;
  };

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-2xl shadow-zinc-200/50">
      {/* Table Header */}
      <div className="grid grid-cols-4 bg-[#fcfcfc] border-b border-zinc-200">
        <div className="p-8 flex flex-col justify-end">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Comparison</span>
        </div>
        {['Individual', 'Developers', 'Enterprise'].map((tier, i) => (
          <div key={tier} className={`p-8 text-center border-l border-zinc-100 ${i === 1 ? 'bg-purple-50/30' : ''}`}>
            <h4 className="text-lg font-bold text-[#202124] mb-1">{tier}</h4>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold">€{tier === 'Individual' ? (isAnnual ? 150 : 15) : tier === 'Developers' ? (isAnnual ? 300 : 30) : (isAnnual ? 2000 : 200)}</span>
              <span className="text-zinc-400 text-xs font-medium">{isAnnual ? '/yr' : '/mo'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-zinc-100">
        {categories.map((cat) => (
          <React.Fragment key={cat.name}>
            <div className="bg-zinc-50/50 px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-y border-zinc-100">
              {cat.name}
            </div>
            {cat.features.map((feat) => (
              <div key={feat.label} className="grid grid-cols-4 hover:bg-zinc-50/30 transition-colors">
                <div className="p-5 px-8 text-sm font-medium text-zinc-600 flex items-center">
                  {feat.label}
                </div>
                {feat.values.map((v, i) => (
                  <div key={i} className={`p-5 border-l border-zinc-100 flex items-center justify-center ${i === 1 ? 'bg-purple-50/10' : ''}`}>
                    <FeatureIcon val={v} />
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {/* Footer Info */}
      <div className="p-6 bg-zinc-50/80 text-center border-t border-zinc-200">
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
          <Info size={12} /> Detailed informations about AI and Token System. 
          <a href="/home/contact" className="text-purple-600 font-bold hover:underline ml-1">Learn more</a>
        </p>
      </div>
    </div>
  );
};

// --- FAQ Component ---
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
        <div className="px-4 pb-6 text-zinc-500 leading-relaxed text-base font-light">
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
    <section className="py-24 bg-white border-t border-zinc-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-24">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-600 uppercase tracking-widest mb-4">
                <Terminal size={16} /> Support
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-[#202124] mb-4">Frequently asked questions</h2>
              <p className="text-zinc-500 text-lg mb-8 font-light leading-relaxed">Can't find the answer you're looking for? Chat with our sales team.</p>
              <a href="/home/contact" className="inline-flex items-center text-sm font-bold text-[#202124] border-b-2 border-[#202124] hover:text-purple-600 hover:border-purple-600 transition-colors pb-0.5">
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
          <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm">
              <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase text-center">Flexible Plans</span>
              <ArrowRight size={12} className="text-purple-400" />
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-[#202124] leading-[0.95] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Pricing <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">supercharged.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#5f6368] max-w-3xl mx-auto leading-relaxed font-light mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance">
            Choose the plan that fits your development scale. <br className="hidden md:block" />
            Simple, transparent, and built to scale with your team.
          </p>

          {/* Toggle */}
          <div className="inline-grid grid-cols-2 bg-white p-1 rounded-full border border-gray-200 shadow-sm relative animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#202124] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isAnnual ? 'translate-x-full' : 'translate-x-0'}`}
            />
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-10 py-3 text-sm font-medium rounded-full transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-[#5f6368] hover:text-[#202124]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 px-10 py-3 text-sm font-medium rounded-full transition-colors duration-300 flex items-center justify-center gap-1.5 ${isAnnual ? 'text-white' : 'text-[#5f6368] hover:text-[#202124]'}`}
            >
              Yearly
              <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${isAnnual ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
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
                className={`relative p-8 rounded-[2rem] bg-white border transition-all duration-500
                  ${plan.highlight
                    ? 'border-purple-600 shadow-2xl shadow-purple-900/10 scale-105 z-10'
                    : 'border-gray-100 shadow-xl shadow-gray-200/50 hover:border-gray-300 hover:shadow-2xl z-0'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-[#202124] mb-2">{plan.name}</h3>
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

                <a href="/auth/register" className="w-full">
                  <button className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all duration-300 cursor-pointer
                    ${plan.highlight
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/30'
                      : 'bg-gray-50 text-[#202124] hover:bg-gray-100 border border-transparent hover:border-gray-200'
                    }`}>
                    Get Started
                  </button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Feature Comparison Table --- */}
      <section className="py-32 px-6 bg-[#fcfcfc] border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#202124] mb-4">Detailed Comparison</h2>
            <p className="text-[#5f6368] text-lg font-light">Every feature, analyzed for your needs.</p>
          </div>
          <div className="overflow-x-auto rounded-3xl shadow-sm p-4">
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