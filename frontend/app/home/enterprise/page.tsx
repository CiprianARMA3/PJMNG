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

const AuroraBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-white">
    <style jsx>{`
      @keyframes sine-flow-1 {
        0%   { transform: translate(-20%, 10%) scale(1); opacity: 0.8; }
        25%  { transform: translate(10%, -10%) scale(1.1); opacity: 1; }
        50%  { transform: translate(40%, 10%) scale(0.8); opacity: 0.6; }
        75%  { transform: translate(10%, 30%) scale(0.9); opacity: 0.9; }
        100% { transform: translate(-20%, 10%) scale(1); opacity: 0.8; }
      }
      @keyframes sine-flow-2 {
        0%   { transform: translate(20%, -20%) scale(0.9); opacity: 0.7; }
        33%  { transform: translate(-10%, 0%) scale(1.1); opacity: 0.9; }
        66%  { transform: translate(30%, 20%) scale(1); opacity: 0.8; }
        100% { transform: translate(20%, -20%) scale(0.9); opacity: 0.7; }
      }
    `}</style>
    <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vh] bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-[100%] blur-[180px] mix-blend-multiply" style={{ animation: 'sine-flow-1 25s infinite ease-in-out' }} />
    <div className="absolute bottom-[-30%] right-[-10%] w-[70vw] h-[70vh] bg-gradient-to-l from-cyan-50/50 to-purple-200/50 rounded-[100%] blur-[150px] mix-blend-multiply" style={{ animation: 'sine-flow-2 30s infinite ease-in-out reverse' }} />
    <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: "url('/grainy.png')", backgroundRepeat: 'repeat', backgroundSize: '120px 120px' }} />
    <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-white via-white/90 to-transparent" />
  </div>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const { data: profile } = await supabase.from('users').select('metadata').eq('id', user.id).single();
          setAvatarUrl(profile?.metadata?.avatar_url || user.user_metadata?.avatar_url);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [supabase]);

  const productLinks = [
    { icon: Bot, name: 'AI Assistant', desc: 'Context-aware coding help' },
    { icon: GitBranch, name: 'Repo Review', desc: 'Automated PR analysis' },
    { icon: Database, name: 'SQL Helper', desc: 'Natural language to SQL' },
    { icon: LayoutList, name: 'Roadmap', desc: 'AI-generated milestones' },
    { icon: KanbanSquare, name: 'Kanban Board', desc: 'Drag-and-drop tasks' },
    { icon: UserCog, name: 'Team', desc: 'Management made easier' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] px-6 bg-white/50 backdrop-blur-xl border-b border-zinc-200 transition-all duration-300 shadow-sm" onMouseLeave={() => setActiveDropdown(null)}>
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-1 cursor-pointer z-50">
          <a href="/" className="flex items-center gap-1">
            <span className="text-2xl font-normal tracking-tight">KAPR<span className="text-purple-600 font-normal">Y</span></span>
            <span className="text-2xl font-black tracking-tight text-[#202124]">.DEV</span>
          </a>
        </div>
        <div className="hidden md:flex items-center gap-8 h-full">
          <div className="relative h-full flex items-center" onMouseEnter={() => setActiveDropdown('product')}>
            <button className="flex items-center gap-1 text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors group">
              Product <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'product' ? 'rotate-180' : ''}`}/>
            </button>
            {activeDropdown === 'product' && (
              <div className="absolute top-[60px] -left-10 w-[600px] p-6 bg-white rounded-2xl shadow-2xl shadow-purple-900/5 border border-gray-100 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 z-40">
                {productLinks.map((item) => (
                  <a key={item.name} href="#" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover/item:bg-purple-100 transition-colors">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#202124]">{item.name}</div>
                      <div className="text-xs text-[#5f6368] mt-0.5">{item.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
          <a href="#" className="text-[15px] font-medium text-[#202124] hover:text-[#202124] transition-colors">Blog</a>
          <a href="/enterprise" className="text-[15px] font-medium text-black transition-colors">Enterprise</a>
          <a href="/#pricing" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Pricing</a>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                <a href='/dashboard' className="bg-[#202124] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 cursor-pointer" >
                  Dashboard <ArrowRight size={14} />
                </a>
                <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-200">
                  <img src={avatarUrl || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <>
                <a href="/auth/login" className="text-sm font-medium text-[#5f6368] hover:text-[#202124]">Sign In</a>
                <a href='/auth/register' className="bg-[#202124] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 cursor-pointer" >
                  Get Started <ArrowRight size={14} />
                </a>
              </>
            )
          )}
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#5f6368]">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="py-12 px-6 bg-white relative z-10">
    <div className='flex justify-center align-center text-[10vw] md:text-[175px] font-extrabold leading-none select-none text-[#202124]'> 
      <p>KAPRY.DEV</p>
    </div>
    <div className='flex justify-center align-center mb-25 text-xl md:text-5xl font-bold text-center mt-4 leading-none select-none text-[#202124]'> 
      <p>BY DEVELOPERS FOR DEVELOPERS</p>
    </div>
    <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm mt-20 border-t border-gray-100 pt-8">
      <div className="flex items-center gap-2 opacity-80">
        <span className="font-bold text-lg text-[#5f6368]">KAPRY</span>
        <span className="text-[#9aa0a6] text-lg">.DEV</span>
      </div>
      <div className="flex gap-8 text-[#5f6368] font-medium">
        <a href="#" className="hover:text-purple-600 transition-colors">Documentation</a>
        <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
        <a href="#" className="hover:text-purple-600 transition-colors">Legal</a>
      </div>
    </div>
  </footer>
);

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
          Request a Demo
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

// --- RESTORED: BUILT WITH ---
const BuiltWith = () => (
  <section className="py-14 border-b border-zinc-100 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <p className="text-center text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10">BUILT WITH</p>
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 hover:opacity-100">
        <div className="h-10 md:h-12 w-auto flex items-center justify-center">
            <img src="/react.png" alt="react" className='h-full w-auto object-contain'/>
        </div>
        <div className="h-8 md:h-9 w-auto flex items-center justify-center">
            <img src="/tailwind.png" alt="tailwind" className='h-full w-auto object-contain'/>
        </div>
        <div className="h-10 md:h-12 w-auto flex items-center justify-center">
            <img src="/supabase.png" alt="supabase" className='h-full w-auto object-contain'/>
        </div>
        <div className="h-8 md:h-9 w-auto flex items-center justify-center">
            <img src="/nextjs.svg" alt="nextjs" className='h-full w-auto object-contain'/>
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
          text={<span className="text-zinc-400">Comprehensive tools including code linking, AI project helpers, and a centralized code review dashboard. <br/><br/></span>}
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
    { q: "What's the difference between Developer and Enterprise plans?", a: "Enterprise includes unlimited collaborators, significant volume-based token discounts, SAML SSO, and priority support that aren't available on the Team tier." },
    { q: "How does billing work for AI features?", a: "Enterprise billing is centralized and usage-based. You get an optimized token rate for your whole organization, with deep analytics to track ROI across teams." },
    { q: "Can we integrate Kapry with our internal SSO/SAML?", a: "Yes. Enterprise customers get full tech support and advanced Role-Based Access Controls (RBAC) to manage large engineering orgs." },
    { q: "Do you offer on-premise deployment?", a: "We offer VPC (Virtual Private Cloud) deployments for Enterprise clients, ensuring your code never leaves your controlled AWS/GCP/Azure environment." },
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
const ComplianceBanner = () => (
  <section className="py-24 bg-zinc-700 text-white overflow-hidden relative border-y border-zinc-800">
    <div className="absolute top-0 right-0 w-1/2 h-full bg-white/10 blur-[120px]" />
    <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-16 items-center">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-md border border-zinc-700">
          <Lock size={12} className="text-zinc-400" />
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Trust & Safety</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Your data remains <br/> in your perimeter.</h2>
        <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
          Your data is safe with us everything is encrypted and safe to use. We are fully complying with EU Regulations:
        </p>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-4">
          {[ 'GDPR Compliant', 'Fully encrypted personal data', 'US CALIFORNIA regulations Compliant'].map((cert) => (
            <div key={cert} className="flex items-center gap-3 text-sm font-medium text-zinc-300">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> {cert}
            </div>
          ))}
        </div>
      </div>
      {/* <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 p-8 rounded-[2rem] backdrop-blur-sm relative overflow-hidden">
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
         
         <div className="flex flex-col gap-6 relative z-10">
           <div className="flex items-start gap-5 p-4 rounded-xl bg-zinc-900/50 border border-zinc-700/50">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0"><Cpu size={20} className="text-purple-400" /></div>
              <div>
                <p className="text-base font-bold mb-1">VPC Deployment</p>
                <p className="text-sm text-zinc-400">Host your isolated instance on your own AWS, Azure, or GCP private cloud.</p>
              </div>
           </div>
           <div className="flex items-start gap-5 p-4 rounded-xl bg-zinc-900/50 border border-zinc-700/50">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0"><Globe size={20} className="text-blue-400" /></div>
              <div>
                <p className="text-base font-bold mb-1">Data Residency</p>
                <p className="text-sm text-zinc-400">Choose where your data is stored to comply with local regulations (EU, US, APAC).</p>
              </div>
           </div>
         </div>
      </div> */}
    </div>
  </section>
);

// --- CTA Section ---
const ReadyToScale = () => (
  <section className="py-24 bg-white">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-[#202124] mb-6 tracking-tight">Ready to transform your <br/> engineering culture?</h2>
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
      <ComplianceBanner /> 
      <FAQSection />
      <ReadyToScale />
      <Footer />
    </main>
  );
}