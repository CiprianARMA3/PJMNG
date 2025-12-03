'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  LayoutList,     // Roadmap
  GitBranch,      // GitHub
  Database,       // SQL
  Bot,            // AI
  ArrowRight,
  Play,
  KanbanSquare,   // Board
  Activity,       // Activity Overview
  TerminalSquare,
  Sparkles,
  Code2,          // Code Icon
  Cpu,            // AI/Cpu Icon
  Globe,
  Server,
  ShieldCheck,
  Blocks,
  Zap,
  Layers
} from 'lucide-react';

// --- 1. Floating Icons (FINAL FRAMING & DISPERSION) ---
const FloatingIcons = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // Icons
    const iconTypes = [
      Database, GitBranch, Code2, Bot, Cpu, TerminalSquare, 
      LayoutList, Server, ShieldCheck, Blocks, Zap, Layers
    ];
    
    // Google Brand Colors (Blue, Red, Yellow, Green)
    const googleColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

    // Increased to 18 icons for better density (9 Left, 9 Right)
    const newItems = Array.from({ length: 18 }).map((_, i) => {
      const isLeft = i % 2 === 0;
      
      // VERTICAL DISPERSION (Full 100% random spread)
      const topPosition = Math.random() * 100; // 0% to 100%
      const topNormalized = topPosition / 100;

      // HORIZONTAL FRAMING LOGIC (Using Sine Wave for > < shape)
      const curveFactor = Math.sin(topNormalized * Math.PI); 
      const maxCenterOffset = 18; // Icons travel up to 18% from the edge (Wider flare)
      const minEdgeOffset = 2;    // Minimum space from screen edge

      let leftPosition;
      
      if (isLeft) {
        // Left Icon: Closest to center (far from 0) in the middle of the screen
        leftPosition = minEdgeOffset + curveFactor * maxCenterOffset; 
      } else {
        // Right Icon: Closest to center (far from 100) in the middle of the screen
        leftPosition = 100 - minEdgeOffset - curveFactor * maxCenterOffset;
      }
      
      return {
        Icon: iconTypes[i % iconTypes.length],
        id: i,
        left: leftPosition,
        top: topPosition,
        delay: Math.random() * 5,
        duration: 12 + Math.random() * 8, 
        size: 24 + Math.random() * 8,     
        color: googleColors[i % googleColors.length], 
      };
    });
    
    setItems(newItems);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <style jsx>{`
        @keyframes floatVertical {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>

      {items.map((item) => (
        <div
          key={item.id}
          className="absolute bg-white border border-gray-100 shadow-[0_4px_12px_rgb(0,0,0,0.08)] rounded-xl p-3 flex items-center justify-center hover:scale-110 transition-transform duration-500"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            animation: `floatVertical ${item.duration}s ease-in-out infinite`,
            animationDelay: `-${item.delay}s`,
            zIndex: 10
          }}
        >
          <item.Icon size={item.size} color={item.color} strokeWidth={2.5} />
        </div>
      ))}
    </div>
  );
};

// --- 2. Particle Background (The "Antigravity" Effect) ---
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const colors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#5f6368', '#dadce0'];

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      originalX: number;
      originalY: number;

      constructor(w: number, h: number) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (Math.min(w, h) * 0.5) + 320; 
        
        this.x = w / 2 + Math.cos(angle) * radius;
        this.y = h / 2 + Math.sin(angle) * radius * 0.8; 
        this.x += (Math.random() - 0.5) * 100;
        this.y += (Math.random() - 0.5) * 100;

        this.originalX = this.x;
        this.originalY = this.y;
        this.size = Math.random() * 2.5; 
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        const dx = this.x - this.originalX;
        const dy = this.y - this.originalY;
        if (Math.abs(dx) > 40) this.speedX *= -1;
        if (Math.abs(dy) > 40) this.speedY *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const particleCount = window.innerWidth < 768 ? 100 : 350; 
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-50"
    />
  );
};

// --- 3. Abstract Dot Shape ---
const DotShape = ({ type }: { type: 'left' | 'right' }) => {
  const [dots, setDots] = useState<any[]>([]);

  useEffect(() => {
    const newDots = Array.from({ length: 120 }).map((_, i) => {
      const y = Math.random() * 400; 
      const centerOffset = Math.abs(y - 200); 
      let x;
      if (type === 'left') {
        x = (centerOffset * 0.6) + (Math.random() * 40); 
      } else {
        x = 200 - (centerOffset * 0.6) + (Math.random() * 40);
      }
      return {
        cx: x + (type === 'left' ? 50 : 50),
        cy: y,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.2
      };
    });
    setDots(newDots);
  }, [type]);

  return (
    <svg viewBox="0 0 300 400" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 pointer-events-none text-blue-500">
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx} 
          cy={dot.cy}
          r={dot.r}
          fill="currentColor"
          opacity={dot.opacity}
        />
      ))}
    </svg>
  );
};

// --- 4. Navbar ---
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const productLinks = [
    { icon: Bot, name: 'AI Assistant', desc: 'Context-aware coding help' },
    { icon: GitBranch, name: 'Repo Review', desc: 'Automated PR analysis' },
    { icon: Database, name: 'SQL Helper', desc: 'Natural language to SQL' },
    { icon: LayoutList, name: 'Roadmap', desc: 'AI-generated milestones' },
    { icon: KanbanSquare, name: 'Kanban Board', desc: 'Drag-and-drop tasks' },
    { icon: Activity, name: 'Activity Logs', desc: 'Team velocity tracking' },
  ];

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 h-[72px] px-6 bg-white/80 backdrop-blur-xl border-b border-white/20 transition-all duration-300"
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-1 cursor-pointer z-50">
          <span className="text-2xl font-normal tracking-tight">
          KAPR
          <span className="text-purple-600 font-normal">Y</span>
          </span>
          <span className="text-2xl font-black tracking-tight text-[#202124]">
          .DEV
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 h-full">
          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('product')}
          >
            <button className="flex items-center gap-1 text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors group">
              Product <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'product' ? 'rotate-180' : ''}`}/>
            </button>

            {/* Mega Menu */}
            {activeDropdown === 'product' && (
              <div className="absolute top-[60px] -left-10 w-[600px] p-6 bg-white rounded-2xl shadow-2xl border border-gray-100 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 z-40">
                {productLinks.map((item) => (
                  <a key={item.name} href="#" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1a73e8] flex items-center justify-center shrink-0 group-hover/item:bg-blue-100 transition-colors">
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

          <a href="#" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Solutions</a>
          <a href="#" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Enterprise</a>
          <a href="#" className="text-[15px] font-medium text-[#5f6368] hover:text-[#202124] transition-colors">Pricing</a>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="text-sm font-medium text-[#5f6368] hover:text-[#202124]">Sign In</a>
          <button className="bg-[#0a0a0a] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#414040] transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 cursor-pointer">
            Get Started <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#5f6368]">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-[72px] left-0 w-full h-[calc(100vh-72px)] bg-white overflow-y-auto p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top-2">
          <div className="space-y-4">
            <div className="text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-2">Platform</div>
            {productLinks.map((item) => (
              <a key={item.name} href="#" className="flex items-center gap-3 py-2">
                 <item.icon size={20} className="text-[#1a73e8]" />
                 <span className="text-lg font-medium text-[#202124]">{item.name}</span>
              </a>
            ))}
          </div>
          <div className="h-px bg-gray-100 w-full my-2"></div>
          <div className="mt-auto flex flex-col gap-3">
             <button className="w-full bg-[#1a73e8] text-white px-5 py-4 rounded-xl font-medium text-lg">Get Started</button>
          </div>
        </div>
      )}
    </nav>
  );
};

// --- 5. Hero Section ---
const Hero = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 overflow-hidden bg-white">
    
    {/* Backgrounds */}
    <ParticleBackground />

    <div className="relative z-10 max-w-4xl mx-auto space-y-10 animate-fade-in-up">
      {/* Pill Badge */}
<div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
          
          {/* Green Pulsing Dot (Active Symbol) */}
          <div className="relative flex items-center justify-center">
            {/* Inner solid green dot */}
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {/* Outer pulsing ring (requires 'animate-pulse-slow' custom CSS/Tailwind animation) */}
            <span 
              className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse-slow" 
              aria-hidden="true" 
            ></span>
          </div>
          
          <span className="text-sm font-medium text-[#5f6368]">KAPRY.DEV version 1.0</span>
          <ArrowRight size={14} className="text-[#5f6368]" />
        </div>
      </div>

      {/* Main Headline */}
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#202124] leading-[1.05]">
        Development, <br />
        <span className="text-[#636363] font-normal">supercharged by AI.</span>
      </h1>

 <p className="text-xl text-[#5f6368] max-w-4xl mx-auto leading-relaxed">
        The solution that scales your development, your all in one tool . <br />
        Built for businesses of every size—from growing teams to global corporations.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button className="h-14 px-8 rounded-full bg-[#202124] text-white font-medium text-[15px] hover:bg-gray-800 transition-all hover:-translate-y-1 shadow-lg shadow-gray-200/50 flex items-center gap-3">
          <Play size={18} fill="currentColor" />
          Live Demo
        </button>
        
        <button className="h-14 px-8 rounded-full bg-white text-[#202124] font-medium text-[15px] hover:bg-gray-50 transition-all hover:-translate-y-1 border border-gray-200 flex items-center gap-2">
          View Architecture
        </button>
      </div>
      
      {/* Gemini Credit */}
      <div className="pt-8 animate-fade-in -mt-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 ">
          <span className="text-sm font-semibold text-[#5f6368]">
            Powered by
            <img src="https://freepnglogo.com/images/all_img/1728457808_Google_Gemini_logo_PNG.png" className=' w-30 mt-2' />
          </span>
        </div>
      </div>

    </div>
  </section>
);

// --- 6. Features Grid ---
const FeatureCard = ({ icon: Icon, title, text }: { icon: any, title: string, text: string }) => (
  <div className="group p-10 rounded-[2rem] bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500">
    <div className="w-14 h-14 rounded-2xl bg-white text-[#1a73e8] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500">
      <Icon size={28} strokeWidth={1.5} />
    </div>
    <h3 className="text-2xl font-medium text-[#202124] mb-4">{title}</h3>
    <p className="text-[#5f6368] leading-relaxed text-lg">{text}</p>
  </div>
);

const Features = () => (
  <section className="py-32 px-6 bg-white relative z-10 flex items-center">
    <div className="max-w-[1200px] mx-auto w-full">
      <div className="text-center mb-20 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-medium text-[#202124] mb-6 tracking-tight">
          Your entire workflow. <br /> In one dashboard.
        </h2>
      </div>

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
          icon={TerminalSquare}
          title="System Monitor"
          text="Integrated logging and performance monitoring for your applications."
        />
      </div>
    </div>
  </section>
);

// --- 7. Audience Split Section ---
const AudienceSection = () => (
  <section className="py-24 px-6 bg-white relative z-10 overflow-hidden flex items-center">
    <div className="max-w-[1300px] mx-auto grid md:grid-cols-2 gap-8 lg:gap-16 w-full">
      
      {/* Left Column */}
      <div className="relative group p-12 md:p-16 text-center rounded-[3rem] bg-gray-50 border border-transparent hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 overflow-hidden">
        <DotShape type="left" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-[#1a73e8] uppercase tracking-wider mb-8 shadow-sm">
            Save 300+ Hours
          </div>
          <h3 className="text-2xl font-medium text-[#202124] mb-3">For Developers</h3>
          <h2 className="text-4xl md:text-5xl font-normal text-[#5f6368] mb-10 tracking-tight">
            Skip the boilerplate
          </h2>
          <button className="h-12 px-8 rounded-full bg-[#1a73e8] text-white font-medium text-sm hover:bg-[#1557b0] transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
            Get the Source Code
          </button>
        </div>
      </div>

      {/* Right Column */}
      <div className="relative group p-12 md:p-16 text-center rounded-[3rem] bg-gray-50 border border-transparent hover:border-purple-100 hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500 overflow-hidden">
        <DotShape type="right" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-8 shadow-sm">
            Launch Today
          </div>
          <h3 className="text-2xl font-medium text-[#202124] mb-3">For Founders</h3>
          <h2 className="text-4xl md:text-5xl font-normal text-[#5f6368] mb-10 tracking-tight">
            Scale your product
          </h2>
          <button className="h-12 px-8 rounded-full bg-white text-[#202124] border border-gray-200 font-medium text-sm hover:bg-gray-50 transition-all hover:scale-105">
            View Pricing
          </button>
        </div>
      </div>

    </div>
  </section>
);

// --- 8. Footer ---
const Footer = () => (
  <footer className="py-12 px-6   bg-white relative z-10">
    <div className='flex justify-center align-center  text-[175px] font-extrabold'> <p>KAPRY.DEV</p>
    
    </div>
        <div className='flex justify-center align-center mb-25 text-5xl font-bold'> <p>BY DEVELOPERS FOR DEVELOPERS</p>
    
    </div>
   
    <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
      <div className="flex items-center gap-2 opacity-80">
        <span className="font-bold text-lg text-[#5f6368]">KAPRY</span>
        <span className="text-[#9aa0a6] text-lg">.DEV</span>
      </div>

      <div className="flex gap-8 text-[#5f6368] font-medium">
        <a href="#" className="hover:text-[#1a73e8] transition-colors">Documentation</a>
        <a href="#" className="hover:text-[1a73e8] transition-colors">Support</a>
      </div>
    </div>
  </footer>
);

// --- Main Page Component ---
export default function Page() {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900 scroll-smooth">
      <Navbar />
      <Hero />
      <Features />
      <AudienceSection />
      <Footer />
    </main>
  );
}