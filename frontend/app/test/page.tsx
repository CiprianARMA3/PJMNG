import React from 'react';
import { 
  Play, 
  BarChart3, 
  Users, 
  Calendar as CalendarIcon, 
  Shield, 
  Bell, 
  Twitter,
  Youtube,
  Instagram,
  Menu,
  X
} from 'lucide-react';

// --- Utility Components ---

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'text'; 
  className?: string;
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium transition-all duration-300 text-sm";
  const variants = {
    // Purple 600 base, hover to 500, with a purple glow shadow
    primary: "bg-purple-600 text-white hover:bg-purple-500 hover:scale-[1.02] shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] border border-purple-500/20",
    secondary: "bg-[#222] text-white hover:bg-[#333] border border-white/10",
    outline: "border border-white/20 text-white hover:bg-white/10 hover:border-white/30",
    text: "text-gray-400 hover:text-white"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- The "Sine Chart" Aurora Effect ---
const AuroraHero = () => (
  <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
    {/* Black base */}
    <div className="absolute inset-0 bg-[#050505]" />

    {/* SVG Sine Waves */}
    <div className="absolute top-[-10%] left-0 w-full h-[120%] opacity-80 mix-blend-screen">
      <svg
        viewBox="0 0 1440 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <g filter="url(#blur-effect)">
            {/* Wave 1: Deep Purple 900 Background Wave */}
            <path
              d="M0 0V400C240 650 480 150 720 400C960 650 1200 150 1440 400V0H0Z"
              fill="url(#grad-deep)"
              opacity="0.6"
            />
            
            {/* Wave 2: Main Purple 800 Wave (Offset Sine) */}
            <path
              d="M0 0V300C240 100 480 600 720 300C960 0 1200 600 1440 300V0H0Z"
              fill="url(#grad-main)"
              opacity="0.8"
            />
            
            {/* Wave 3: Bright "Sin Chart" Line Glow */}
            <path
              d="M-100 450 C 200 650, 500 150, 800 450 C 1100 750, 1400 250, 1700 450"
              stroke="url(#grad-glow)"
              strokeWidth="60"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
        </g>
        
        <defs>
          <filter id="blur-effect" x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="70" result="blurred"/>
          </filter>
          
          {/* Deep Purple Gradient */}
          <linearGradient id="grad-deep" x1="720" y1="0" x2="720" y2="800" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4c1d95" /> {/* Purple 900 */}
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </linearGradient>

          {/* Main Purple Gradient */}
          <linearGradient id="grad-main" x1="720" y1="0" x2="720" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6b21a8" /> {/* Purple 800 */}
            <stop offset="80%" stopColor="#6b21a8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6b21a8" stopOpacity="0" />
          </linearGradient>

          {/* Glowing Line Gradient */}
          <linearGradient id="grad-glow" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7e22ce" stopOpacity="0" />
            <stop offset="50%" stopColor="#d8b4fe" stopOpacity="1" /> {/* Lighter lavender center */}
            <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    {/* Vignette/Fade to blend the bottom smoothly */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/20 to-[#050505]" style={{top: '40%'}} />
  </div>
);

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 h-20 px-6 bg-transparent backdrop-blur-[2px]">
    <div className="max-w-7xl mx-auto h-full relative flex items-center justify-between">
      
      {/* Logo */}
      <div className="flex items-center gap-2 group cursor-pointer relative z-50">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md group-hover:bg-purple-500/40 transition-colors"></div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-bold text-xl tracking-tight text-white">Cassis</span>
      </div>

      {/* Center Menu - Absolutely Positioned */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center px-8 py-2.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl gap-8 text-sm font-medium text-gray-300">
        <a href="#" className="hover:text-purple-300 transition-colors">Features</a>
        <a href="#" className="hover:text-purple-300 transition-colors">Pricing</a>
        <a href="#" className="hover:text-purple-300 transition-colors">About</a>
        <a href="#" className="hover:text-purple-300 transition-colors">Blog</a>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 relative z-50">
        <a href="#" className="hidden md:block text-sm font-medium hover:text-white text-gray-400 transition-colors">Log in</a>
        <Button className="h-9 px-5 bg-white text-black hover:bg-gray-100 shadow-none border-none">
          Get started
        </Button>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative pt-48 pb-24 px-6 max-w-7xl mx-auto text-center z-10">
    {/* Animated Badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/20 mb-8 backdrop-blur-sm animate-fade-in hover:bg-purple-900/40 transition-colors cursor-pointer group">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
      </span>
      <span className="text-xs font-medium text-purple-200 group-hover:text-white transition-colors">New Release v2.0</span>
      <span className="text-xs text-purple-400 group-hover:text-purple-300 transition-colors">→</span>
    </div>
    
    {/* Main Headline */}
    <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter mb-8 text-white max-w-5xl mx-auto leading-[0.95] drop-shadow-2xl">
      Turn ordinary content into <br/>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-400">polished results.</span>
    </h1>
    
    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
      That capture attention, express creativity, and inspire real-world action. Start building your legacy today with the new standard.
    </p>
    
    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <Button className="h-14 px-10 text-base font-semibold bg-purple-600 text-white hover:bg-purple-500 border-none shadow-[0_0_40px_-10px_rgba(147,51,234,0.6)]">
        Get started free
      </Button>
      <button className="h-14 px-8 text-base font-medium flex items-center gap-3 text-white hover:text-purple-300 transition-colors group">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/5">
          <Play size={16} className="ml-1 fill-current" />
        </div>
        Watch demo
      </button>
    </div>

    {/* Hero Visual - Glass Card Effect */}
    <div className="mt-24 relative mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-2xl shadow-purple-900/20 perspective-1000 group">
       
       {/* Glow behind the visual */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-purple-600/10 blur-[100px] -z-10 group-hover:bg-purple-600/20 transition-all duration-700"></div>

       {/* The "Dashboard" mock */}
       <div className="relative bg-[#111] aspect-[16/10] md:aspect-[21/9] rounded-[1.8rem] m-2 overflow-hidden border border-white/5">
          {/* Header */}
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-[#161616]">
             <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
             </div>
             <div className="h-6 w-64 bg-white/5 rounded-md"></div>
          </div>

          {/* Grid Content */}
          <div className="p-8 grid grid-cols-12 gap-6 h-full">
             {/* Sidebar */}
             <div className="hidden md:block col-span-2 space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-8 w-full bg-white/5 rounded-md animate-pulse" style={{animationDelay: `${i * 100}ms`}}></div>
                ))}
             </div>
             
             {/* Main Chart Area */}
             <div className="col-span-12 md:col-span-7 bg-[#0a0a0a] rounded-xl border border-white/5 p-6 relative overflow-hidden">
                <div className="flex justify-between mb-8">
                   <div className="h-4 w-32 bg-white/10 rounded"></div>
                   <div className="h-4 w-16 bg-purple-500/20 rounded text-purple-400 text-[10px] flex items-center justify-center">+24.5%</div>
                </div>
                {/* Abstract Chart Lines */}
                <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end gap-2 px-6 pb-6 opacity-60">
                   {[30, 50, 45, 70, 60, 85, 90, 65, 55, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-purple-500/10 to-purple-600" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
             </div>

             {/* Right Widgets */}
             <div className="col-span-12 md:col-span-3 space-y-6">
                <div className="h-32 bg-[#0a0a0a] rounded-xl border border-white/5 p-4">
                   <div className="h-8 w-8 rounded-full bg-indigo-500/20 mb-4"></div>
                   <div className="h-2 w-16 bg-white/10 rounded mb-2"></div>
                   <div className="h-2 w-full bg-white/5 rounded"></div>
                </div>
                <div className="h-32 bg-[#0a0a0a] rounded-xl border border-white/5 p-4">
                    <div className="h-8 w-8 rounded-full bg-fuchsia-500/20 mb-4"></div>
                   <div className="h-2 w-16 bg-white/10 rounded mb-2"></div>
                   <div className="h-2 w-full bg-white/5 rounded"></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, desc, children }: any) => (
  <div 
    className="p-8 rounded-3xl bg-[#0f0f0f] border border-white/5 hover:border-purple-500/30 transition-all duration-500 group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
        <Icon size={22} />
      </div>
      <h3 className="text-xl font-medium mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-6">
        {desc}
      </p>
      {children}
    </div>
  </div>
);

const Features = () => (
  <section className="py-24 px-6 max-w-7xl mx-auto z-10 relative">
    <div className="mb-16">
      <h2 className="text-3xl md:text-4xl font-semibold mb-4">Everything you need</h2>
      <p className="text-gray-400 max-w-lg">Powerful features wrapped in a simple interface. Built for modern teams who move fast.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <FeatureCard 
        icon={BarChart3} 
        title="Real-time Analytics" 
        desc="Monitor your performance with precision. Our analytics engine updates in real-time."
      >
        <div className="h-24 w-full bg-[#0a0a0a] rounded-lg border border-white/5 p-4 flex items-end justify-between gap-1">
           {[40, 60, 45, 80, 55, 90, 70].map((h,i) => (
              <div key={i} className="w-full rounded-sm bg-purple-600" style={{height: `${h}%`, opacity: 0.3 + (i * 0.1)}}></div>
           ))}
        </div>
      </FeatureCard>

      <FeatureCard 
        icon={Users} 
        title="Team Collaboration" 
        desc="Work together seamlessly. Comments, assignments, and live updates keep everyone aligned."
      >
        <div className="flex items-center -space-x-4 mt-2">
           {[1,2,3].map(i => (
             <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0f0f0f] bg-gray-800 flex items-center justify-center text-xs text-white">
                {String.fromCharCode(64 + i)}
             </div>
           ))}
           <div className="w-10 h-10 rounded-full border-2 border-[#0f0f0f] bg-purple-600 text-white flex items-center justify-center font-bold text-xs">+5</div>
        </div>
      </FeatureCard>

      <FeatureCard 
        icon={Shield} 
        title="Enterprise Security" 
        desc="Bank-grade encryption for your data. We take security seriously so you don't have to."
      >
        <div className="mt-4 flex items-center gap-3 text-green-400 text-sm bg-green-400/10 p-2 rounded border border-green-400/20">
           <Shield size={14} className="fill-current" /> 
           <span>End-to-end Encrypted</span>
        </div>
      </FeatureCard>
    </div>
  </section>
);

const Testimonial = () => (
  <section className="py-32 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111] to-transparent -z-10"></div>
    <div className="max-w-4xl mx-auto px-6 text-center">
      <div className="inline-flex gap-1 mb-8">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="text-purple-500 fill-current">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
             </div>
           ))}
      </div>
      <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-10 leading-[1.2]">
        "Cassis transformed how we handle our daily operations. It's the most intuitive tool we've ever used."
      </h2>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-white/10">
          <img src="https://framerusercontent.com/images/53lXhEkDZpLDwcYL7KjiGRmvdY.png?scale-down-to=512" alt="User" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-white font-medium">Sarah Jenkins</div>
          <div className="text-gray-500 text-sm">Product Director @ TechFlow</div>
        </div>
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="py-32 px-6 text-center relative z-10">
    <div className="max-w-3xl mx-auto border border-white/10 rounded-[2rem] p-12 bg-[#111] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 to-transparent"></div>
      
      <div className="relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">Ready to streamline?</h2>
        <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
          Join thousands of teams who have already switched to a better way of working.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button className="h-12 px-8 bg-white text-black hover:bg-gray-100 border-none shadow-none">
            Start 14-day free trial
          </Button>
          <Button variant="outline" className="h-12 px-8">
            Contact Sales
          </Button>
        </div>
        <p className="mt-8 text-xs text-gray-600">No credit card required • Cancel anytime</p>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 px-6 border-t border-white/5 bg-[#0a0a0a] z-10 relative text-sm">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
         <span className="font-bold text-lg text-white">Cassis</span>
      </div>
      
      <div className="flex gap-8 text-gray-500 font-medium">
         <a href="#" className="hover:text-white transition-colors">Features</a>
         <a href="#" className="hover:text-white transition-colors">Pricing</a>
         <a href="#" className="hover:text-white transition-colors">Legal</a>
         <a href="#" className="hover:text-white transition-colors">Privacy</a>
      </div>

      <div className="flex gap-4 text-gray-400">
         <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"><Twitter size={18} /></a>
         <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"><Instagram size={18} /></a>
      </div>
    </div>
    <div className="text-center mt-12 text-xs text-gray-700">
       © 2025 Cassis Inc. All rights reserved.
    </div>
  </footer>
);

export default function Page() {
  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">
      <AuroraHero />
      <Navbar />
      <Hero />
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12"></div>
      <Features />
      <Testimonial />
      <CTA />
      <Footer />
    </main>
  );
}