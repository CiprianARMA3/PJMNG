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
  TrendingDown
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

// --- Components ---

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
    `}</style>
    <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vh] bg-gradient-to-r from-blue-50/50 to-indigo-100/50 rounded-[100%] blur-[180px] mix-blend-multiply" style={{ animation: 'sine-flow-1 25s infinite ease-in-out' }} />
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

// --- Enterprise Hero (Static 3D Image attached to border) ---
const EnterpriseHero = () => (
  <section className="relative flex flex-col items-center justify-center text-center px-4 pt-32 pb-0 overflow-hidden bg-white border-b border-zinc-100">
    <AuroraBackground />
    <div className="relative z-20 max-w-5xl mx-auto space-y-8 mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm">
        <ShieldCheck size={14} className="text-purple-600" />
        <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase">Organization Plan</span>
      </div>
      <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#202124] leading-[0.95]">
        Engineering Intelligence <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">at any scale.</span>
      </h1>
      <p className="text-xl text-[#5f6368] max-w-3xl mx-auto leading-relaxed">
        Custom AI infrastructure, unlimited collaboration, and volume-optimized pricing for the world's most demanding engineering organizations.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button className="w-full sm:w-auto px-8 py-4 bg-[#202124] text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-zinc-200">
          Talk to Sales
        </button>
        <button className="w-full sm:w-auto px-8 py-4 bg-white border border-zinc-200 text-[#202124] rounded-xl font-bold text-lg hover:border-zinc-400 transition-all">
          Request a Demo
        </button>
      </div>
    </div>

    {/* Static Inclined Image - Attached to bottom and cropped */}
    <div className="relative z-10 w-full max-w-[1200px] perspective-[2000px] px-6 flex justify-center translate-y-8">
      <div 
        className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,0,0,0.2)] rounded-t-2xl border-x border-t border-zinc-200 bg-white p-2"
        style={{ 
          transform: 'rotateX(15deg) rotateY(-5deg) rotateZ(2deg)', 
          transformStyle: 'preserve-3d',
          marginBottom: '-2px' // Ensures it attaches perfectly to the border
        }}
      >
        <img 
          src="/pic4.png" 
          alt="Enterprise Dashboard" 
          className="rounded-t-xl w-full h-auto object-cover border border-zinc-100 block"
        />
      </div>
    </div>
  </section>
);

const TrustedBy = () => (
  <section className="py-16 border-b border-zinc-100 bg-zinc-50/30">
    <div className="max-w-7xl mx-auto px-6">
      <p className="text-center text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10">Empowering high-growth engineering teams</p>
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale opacity-40">
        <span className="text-2xl font-bold">Pro TV RO</span>
        <span className="text-2xl font-bold">DATAFLOW</span>
        <span className="text-2xl font-bold">SYNAPSE</span>
        <span className="text-2xl font-bold">NEXUS</span>
        <span className="text-2xl font-bold">QUANTUM</span>
      </div>
    </div>
  </section>
);

// --- Features Section (Enterprise JSON Mapped) ---
const FeatureCard = ({ icon: Icon, title, text }: { icon: any, title: string, text: string }) => (
  <div className="group relative p-10 rounded-[2rem] bg-zinc-50/50 border border-transparent 
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
  <section className="py-32 px-6 bg-white relative z-10 flex items-center border-t border-zinc-100">
    <div className="max-w-[1200px] mx-auto w-full">
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={Bot}
          title="Productivity Suite"
          text="Enterprise-grade productivity featuring premium AI support and fully integrated calendars for seamless scheduling."
        />
        <FeatureCard 
          icon={Users}
          title="Unlimited Workspace"
          text="Unlimited collaborators and teams. A limitless multi-user workspace designed for large-scale organizational synergy."
        />
        <FeatureCard 
          icon={TrendingDown}
          title="Cost Optimization"
          text="Significant discount rates on AI tokens, specifically optimized for high-volume enterprise usage and reduced overhead."
        />
        <FeatureCard 
          icon={Cpu}
          title="Development Ecosystem"
          text="Comprehensive dev tools including code linking, AI project helpers, and a centralized code review dashboard."
        />
        <FeatureCard 
          icon={LayoutList}
          title="Advanced Organization"
          text="Strategic project management with issue tracking, concept workspaces, and unlimited projects with deep analytics."
        />
         <FeatureCard 
          icon={Activity}
          title="Intelligent AI Analytics"
          text="Custom AI model fine-tuning and enterprise-scale analytics for task prioritization and team velocity optimization."
        />
      </div>
    </div>
  </section>
);

// --- FAQ Section (Grid Structure) ---
const FAQItem = ({ q, a, index, openIndex, setOpenIndex }: any) => {
  const isOpen = openIndex === index;
  return (
    <div className="last:border-b-0 border-zinc-200 font-medium border-b">
      <h3 className="flex">
        <button 
          onClick={() => setOpenIndex(isOpen ? null : index)}
          className="flex flex-1 items-start justify-between gap-4 text-left font-medium transition-all outline-none text-lg p-8 hover:bg-zinc-50 text-pretty data-[state=open]:text-purple-600 rounded-none cursor-pointer"
          data-state={isOpen ? 'open' : 'closed'}
        >
          {q}
          <ChevronDown className={`text-zinc-400 size-4 shrink-0 translate-y-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
        </button>
      </h3>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-8 pt-0 text-zinc-500 leading-relaxed text-base">
          {a}
        </div>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = [
    { q: "What's the difference between Team and Enterprise plans?", a: "Enterprise includes unlimited collaborators, custom AI model fine-tuning, VPC deployment options, and significant volume-based token discounts that aren't available on the Team tier." },
    { q: "How does billing work for AI features like PR reviews?", a: "Enterprise billing is centralized and usage-based. You get an optimized token rate for your whole organization, with deep analytics to track ROI across teams." },
    { q: "Can we integrate Kapry with our internal SSO/SAML?", a: "Yes. Enterprise customers get full SAML/SSO support (Okta, Azure, Google) and advanced Role-Based Access Controls (RBAC) to manage large engineering orgs." },
    { q: "What kind of support is provided to Enterprise accounts?", a: "You get a dedicated Success Manager, 24/7 priority support via Slack, and customized onboarding sessions for your engineering departments." },
    { q: "Are there discounts for annual commitments?", a: "Yes, we offer significant annual and multi-year contract discounts tailored to your organization's projected growth and AI usage requirements." }
  ];

  return (
    <section className="py-24 bg-white border-t border-zinc-100">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="col-span-full md:col-start-2 md:col-span-10 grid grid-cols-1 md:grid-cols-3">
            <div className="border border-b-0 md:border-b md:border-r-0 border-zinc-200 p-8 pr-16 col-span-full md:col-span-1 relative bg-zinc-50/30 overflow-hidden">
              <div 
                className="dots absolute inset-0 w-full h-full pointer-events-none opacity-25" 
                style={{ backgroundImage: 'radial-gradient(black 1px, transparent 1px)', backgroundSize: '16px 16px' }}
              />
              <div className="relative z-10 pb-8 text-left gap-2 flex flex-col">
                <div className="flex items-center gap-2 text-sm font-bold text-purple-600 uppercase tracking-widest">
                  <Terminal size={18} /> FAQ
                </div>
                <h2 className="text-balance text-3xl font-bold tracking-tight text-[#202124]">Frequently asked questions</h2>
              </div>
            </div>
            <div className="w-full border-zinc-200 border col-span-full md:col-span-2">
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

const ComplianceBanner = () => (
  <section className="py-24 bg-[#09090b] text-white overflow-hidden relative">
    <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-500/10 blur-[120px]" />
    <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-16 items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-md border border-zinc-700">
          <Lock size={12} className="text-zinc-400" />
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Trust & Safety</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Your code stays <br/> in your perimeter.</h2>
        <p className="text-zinc-400 text-lg leading-relaxed">
          We architected Kapry to ensure your IP is protected. We never train public models on your private data, and we offer physical isolation options.
        </p>
        <div className="grid grid-cols-2 gap-4 pt-4">
          {['SOC2 Type II', 'GDPR Ready', 'SAML SSO', 'Audit Logs'].map((cert) => (
            <div key={cert} className="flex items-center gap-2 text-sm font-mono text-zinc-300">
              <CheckCircle2 size={16} className="text-emerald-500" /> {cert}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md">
        <div className="flex flex-col gap-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center"><Cpu className="text-purple-400" /></div>
              <div>
                <p className="text-sm font-bold">VPC Deployment</p>
                <p className="text-xs text-zinc-500">Host your isolated instance on AWS, Azure, or GCP.</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center"><Globe className="text-blue-400" /></div>
              <div>
                <p className="text-sm font-bold">Enterprise Analytics</p>
                <p className="text-xs text-zinc-500">Real-time velocity and ROI insights across all departments.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-20 px-6 bg-white border-t border-zinc-100">
    <div className='flex justify-center text-[10vw] md:text-[150px] font-black text-[#202124] opacity-5 select-none'>KAPRY.DEV</div>
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mt-12 text-sm text-zinc-500 font-medium">
        <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">KAPRY.DEV</span>
            <span>© 2024</span>
        </div>
        <div className="flex gap-8">
            <a href="#" className="hover:text-black transition-colors">Documentation</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
            <a href="#" className="hover:text-black transition-colors">Legal</a>
        </div>
    </div>
  </footer>
);

export default function EnterprisePage() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />
      <EnterpriseHero />
      <TrustedBy />
      <Features /> 
      <FAQSection />
      <ComplianceBanner />
      <Footer />
    </main>
  );
}