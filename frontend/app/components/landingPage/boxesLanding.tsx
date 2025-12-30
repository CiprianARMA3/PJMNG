import React from 'react';
import TASK from './components/tasks';
import CALENDAR from './components/calendar';
import TABLECALENDAR from './components/tablecalendar';
import REPOSITORYLOGS from './components/repositorylogs';
import { 
  ArrowRight, 
  GitMerge, 
  UserPlus, 
  Zap, 
  LineChart, 
  ShieldCheck, 
  Brain,
  Github,
  Database,
  Map
} from 'lucide-react';

const FeatureCard = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string 
}) => (
  // CHANGED: rounded-3xl -> rounded-[40px], border-gray-200 -> border-zinc-100 border-2, added shadow-zinc
  <div className={`bg-white rounded-[40px] border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden relative group ${className}` }>
    {/* ADDED: Grainy Texture (Absolute so it doesn't break the grid) */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
    {children}
  </div>
);

const TemplateImage = ({ label = "Template Image", className = "" }: { label?: string, className?: string }) => (
  <div className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-medium tracking-wide rounded-xl ${className}`}>
    {label}
  </div>
);

const Pill = ({ icon: Icon, text }: { icon: any, text: string }) => (
  // CHANGED: gray-50 -> zinc-50, border-gray-100 -> border-zinc-100 border-2
  <div className="flex items-center gap-3 bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 w-fit mb-3 shadow-sm group/pill hover:border-purple-200 transition-colors">
    <Icon className="w-5 h-5 text-zinc-500 group-hover/pill:text-purple-600 transition-colors" strokeWidth={3} />
    {/* CHANGED: Text styling to font-black uppercase */}
    <span className="text-zinc-900 font-black uppercase tracking-widest text-[10px]">{text}</span>
  </div>
);

const FeaturesSection = () => {
  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-zinc-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- Row 1: Hero Feature --- */}
        <FeatureCard className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
          <div className="p-8 md:p-12 flex flex-col justify-center z-10">
            {/* CHANGED: Font styling */}
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-[#202124] leading-[0.95]">
            Organize Tasks Efficiently
            </h2>
            {/* CHANGED: Font styling */}
            <p className="text-zinc-500 font-bold text-lg mb-8 leading-relaxed">
                Keep your <span className="text-zinc-900 font-black">entire development lifecycle</span> organized in one centralized hub, providing instant clarity and full transparency for all your collaborators. Never miss a deadline or lose track of an assignment again.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              {/* CHANGED: Button styling */}
              <a href="/dashboard">
              <button className="bg-[#202124] text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-colors shadow-xl shadow-zinc-900/20 active:scale-95 cursor-pointer">
                Start building now
              </button>
              </a>
              <a href="#architecture-explaining" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                Read more about our service.
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </a>
            </div>
          </div>
          {/* Image positioning wrapper */}
          <div className="relative h-64 md:h-auto bg-gradient-to-br ">
            <TASK  />  
            {/* className="absolute top-12 left-12 right-[-50px] bottom-[-50px] shadow-xl" */}
          </div>
        </FeatureCard>

        {/* --- Row 2: Split Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Review Experience */}
<FeatureCard className="p-8 md:p-10 flex flex-col justify-between min-h-[400px]">
    <div>
        {/* CHANGED: Font styling */}
        <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-3 text-[#202124] leading-[0.95]">
            Events and Workflow
        </h3>
        {/* CHANGED: Font styling */}
        <p className="text-zinc-500 font-bold mb-6 leading-relaxed">
            Seamlessly manage your team's calendar and schedule with dual-view visualization for maximum clarity. Enhanced by a <span className="text-zinc-900 font-black">multi-role permission system</span> which let's you decide who can use what.
        </p>
        <a href="#" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600 transition-colors mb-8">
            Explore calendar features
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
        </a>
    </div>
    
    {/* Professional Overlapping Calendar Layout */}
    <div className="relative flex-1 w-full -mx-10 -mb-10"> 
        
        {/* 1. TABLECALENDAR (Left, sticks to left border) */}
        <div className="absolute top-0 left-0 bottom-0 w-[80%] z-10">
            <div className="h-full rounded-l-none rounded-r-lg overflow-hidden shadow-lg border-r border-t border-b border-zinc-200 bg-white">
                <TABLECALENDAR />
            </div>
        </div>
        
        {/* 2. CALENDAR (Right, sticks to right border, overlaps table) */}
        <div className="absolute  left-[200] bottom-[-5] w-[80%] z-20">
            <div className="h-full rounded-l-lg rounded-r-none overflow-hidden shadow-xl border-l-2 border-t-2 border-b-2 border-purple-300 bg-white">
                <CALENDAR /> 
            </div>
        </div>
        
    </div>

</FeatureCard>

          {/* Card: Notifications */}
<FeatureCard 
            className="
              p-8 md:p-10 
              flex flex-col 
              min-h-[400px] 
              w-full  {/* STRETCH: Ensure the card takes full width */}
              !m-0 !p-0 {/* ADJUSTMENT: Optionally remove outer padding/margin if FeatureCard adds default spacing */}
            "
          >
            {/* Top Content (Unchanged) */}
            <div className=" p-8 md:p-10 pb-0"> {/* PADDING ADJUSTMENT: Added padding back to internal div */}
              {/* CHANGED: Font styling */}
              <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-3 text-[#202124] leading-[0.95]">
                Repository Monitoring
              </h3>
              {/* CHANGED: Font styling */}
              <p className="text-zinc-500 font-bold mb-6 leading-relaxed">
                Both in a calendar and graph UI, you will be able to keep track of any changes made by your collaborators.
              </p>
              <a href="#" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600 transition-colors">
                See more
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </a>
            </div>

            {/* Bottom Content (REPOSITORYLOGS) */}
            <div className="
              flex-1 
              flex 
              items-end {/* BOTTOM: Aligns children (REPOSITORYLOGS) to the bottom of this flex-1 container */}
              justify-center 
              w-full 
              overflow-hidden {/* CLIPPING FIX: Ensures widget doesn't spill out */}
               pt-0 {/* WIDGET FIT: Minimal padding if the widget has its own border/shadow */}
            ">
              <REPOSITORYLOGS />
            </div>
          </FeatureCard>
        </div>

        {/* --- Row 3: Split Grid (CI & Features) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Smarter CI */}
<FeatureCard className="p-8 md:p-10 flex flex-col min-h-[400px]">
            <div>
              {/* CHANGED: Font styling */}
              <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-3 text-[#202124] leading-[0.95]">
                Adapted for every time of day
              </h3>
              {/* CHANGED: Font styling */}
              <p className="text-zinc-500 font-bold mb-6 leading-relaxed">
                Comes built with an automatic switch between light mode and dark mode using your browser's settings.
              </p>
            </div>
            
            {/* Added 'group' here to handle hover state for the child button */}
            <div className="flex-1 relative mt-4 group">
              <img 
                className="absolute left-0 right-0 bottom-[-60px] top-0 shadow-lg rounded-xl transition-transform duration-500 group-hover:scale-[1.02]" 
                src={"/p1.png"}
              />
              
              {/* Zoom Button: Absolute Top-Middle */}
              <a 
                href="/p1.png" 
                target="_blank"
                className="absolute top-10 left-1/2 -translate-x-1/2 
                           flex items-center justify-center
                           w-12 h-12 bg-white/90 backdrop-blur-sm text-zinc-900 rounded-full shadow-2xl 
                           opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 
                           transition-all duration-300 ease-out hover:scale-110 z-20 cursor-pointer"
              >
                <ArrowRight className="w-5 h-5 -rotate-45" strokeWidth={3} />
              </a>
            </div>
          </FeatureCard>

          {/* Card: One Platform List */}
          <FeatureCard className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[400px]">
            <div>
              {/* CHANGED: Font styling */}
              <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-4 text-[#202124] leading-[0.95]">
                Unified AI Stack
              </h3>
              {/* CHANGED: Font styling */}
              <p className="text-zinc-500 font-bold mb-6 leading-relaxed">
                You won't need any 5 AI platforms for your project, with <span className="text-zinc-900 font-black">KAPRY DEV</span> you'll have everything in one.
              </p>
              <a href="#" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600 transition-colors">
                Read more about AI
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </a>
            </div>
            <div className="flex flex-col items-end md:pl-4">
              <Pill icon={Brain} text="Basic AI Assistant" />
              <Pill icon={Github} text="Repo Reviewer" />
              <Pill icon={Database} text="SQL Helper" />
              <Pill icon={Map} text="Roadmap Tool" />
            </div>
          </FeatureCard>
        </div>

        {/* --- Row 4: AI Reviewer --- */}
<FeatureCard className="grid grid-cols-1 md:grid-cols-2 min-h-[450px] overflow-hidden ">
  <div className="p-8 md:p-12 flex flex-col justify-center z-10">
    {/* CHANGED: Font styling */}
    <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 ml-[-25px] text-[#202124] leading-[0.9]">
      Everything ,<br /> everytime, <br />everywhere.
    </h2>
    {/* CHANGED: Font styling */}
    <p className="text-zinc-500 font-bold text-lg mb-8 ml-[-25px] leading-relaxed">
      With easy to use tools <br />which grant an easier organization <br /> not only for you,<br />
       but also for your collaborators.
    </p>
    <div className="flex items-center gap-6">
      {/* CHANGED: Button styling */}
      <a href="/dashboard">
      <button className="bg-[#202124] text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all shadow-xl shadow-zinc-900/20 active:scale-95 ml-[-25px] cursor-pointer">
        Start Building Now
      </button>
      </a>
    </div>
  </div>
  
  {/* Image positioning wrapper */}
  {/* Added 'h-full' to ensure it fills the column height */}
  <div className="relative h-full min-h-[300px] ">
    {/* Changes made:
       1. Reduced 'top-12 left-12' -> 'top-4 left-4' (brings image closer to center/top)
       2. Changed width to 'w-[150%]' or 'max-w-none' to ensure it feels big but keeps aspect ratio better
       3. Added 'rounded-tl-lg' for a polished corner
    */}
    <img 
      className="absolute top-4 right-[-125px] shadow-2xl w-[160%] max-w-none rounded-tl-[40px] border border-zinc-100" 
      src={"/p3.png"} 
      alt="AI Reviewer Interface"
    />
  </div>
</FeatureCard>

      </div>
    </div>
  );
};

export default FeaturesSection;