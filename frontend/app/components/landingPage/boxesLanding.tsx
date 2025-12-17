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
  <div className={`bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden relative ${className}`}>
    {children}
  </div>
);

const TemplateImage = ({ label = "Template Image", className = "" }: { label?: string, className?: string }) => (
  <div className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-medium tracking-wide rounded-xl ${className}`}>
    {label}
  </div>
);

const Pill = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-full px-4 py-3 w-fit mb-3 shadow-sm">
    <Icon className="w-5 h-5 text-gray-500" />
    <span className="text-gray-700 font-medium text-sm">{text}</span>
  </div>
);

const FeaturesSection = () => {
  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- Row 1: Hero Feature --- */}
        <FeatureCard className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
          <div className="p-8 md:p-12 flex flex-col justify-center z-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Organize Tasks Efficently
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Keep your <b>entire development lifecycle</b> organized in one centralized hub, providing instant clarity and full transparency for all your collaborators. Never miss a deadline or lose track of an assignment again.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <button className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                Start building now
              </button>
              <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors">
                Read more about our service.
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
          {/* Image positioning wrapper */}
          <div className="relative h-64 md:h-auto bg-gradient-to-br from-white to-white">
            <TASK  />  
            {/* className="absolute top-12 left-12 right-[-50px] bottom-[-50px] shadow-xl" */}
          </div>
        </FeatureCard>

        {/* --- Row 2: Split Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Review Experience */}
<FeatureCard className="p-8 md:p-10 flex flex-col justify-between min-h-[400px]">
    <div>
        <h3 className="text-2xl md:text-3xl font-bold mb-3">
            Keep track of Events and Workflow
        </h3>
        <p className="text-gray-600 mb-6">
            Seamlessly manage your team's calendar and schedule with dual-view visualization for maximum clarity.
        </p>
        <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors mb-8">
            Explore calendar features
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
    </div>
    
    {/* Professional Overlapping Calendar Layout */}
    <div className="relative flex-1 w-full -mx-10 -mb-10"> 
        
        {/* 1. TABLECALENDAR (Left, sticks to left border) */}
        <div className="absolute top-0 left-0 bottom-0 w-[80%] z-10">
            <div className="h-full rounded-l-none rounded-r-lg overflow-hidden shadow-lg border-r border-t border-b border-gray-200 bg-white">
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
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Keep track of your GitHub Repository
              </h3>
              <p className="text-gray-600 mb-6">
                Both in a calendar and graph UI, you will be able to keep track of any changes made by your collaborators.
              </p>
              <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors">
                See more
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Adapted for every time of the day
              </h3>
              <p className="text-gray-600 mb-6">
                Comes built with an automatic switch between light mode and dark mode using your browser's settings.
              </p>
              {/* <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors mb-8">
                Read about CI Optimizations 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a> */}
            </div>
            
            {/* Added 'group' here to handle hover state for the child button */}
            <div className="flex-1 relative mt-4 group">
              <img 
                className="absolute left-0 right-0 bottom-[-60px] top-0 shadow-lg rounded-md transition-transform duration-500 group-hover:scale-[1.02]" 
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </a>
            </div>
          </FeatureCard>

          {/* Card: One Platform List */}
          <FeatureCard className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[400px]">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                One Platform with every AI tool you need
              </h3>
              <p className="text-gray-600 mb-6">
                You won't need any 5 AI platforms for your project, with KAPRY.DEV you'll have everything in one.
              </p>
              <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors">
                Read more about AI
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="flex flex-col items-end md:pl-4">
              <Pill icon={Brain} text="Basic AI Assistant" />
              <Pill icon={Github} text="AI GitHub Code Reviewer" />
              <Pill icon={Database} text="AI SQL Helper" />
              <Pill icon={Map} text="AI Roadmap Visualizer" />
            </div>
          </FeatureCard>
        </div>

        {/* --- Row 4: AI Reviewer --- */}
        <FeatureCard className="grid grid-cols-1 md:grid-cols-2 min-h-[450px]">
          <div className="p-8 md:p-12 flex flex-col justify-center z-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              The collaborative AI reviewer built into your PR page
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Resolve CI failures, apply suggested fixes, and commit your changes — all in one conversation.
            </p>
            <div className="flex items-center gap-6">
              <button className="bg-white text-gray-900 border border-gray-300 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm">
                Start chatting
              </button>
            </div>
          </div>
          {/* Image positioning wrapper */}
          <div className="relative h-64 md:h-auto bg-gradient-to-bl from-gray-50 to-white">
            <TemplateImage className="absolute top-12 left-12 right-[-50px] bottom-[-50px] shadow-xl" label="Chat Interface" />
          </div>
        </FeatureCard>

      </div>
    </div>
  );
};

export default FeaturesSection;