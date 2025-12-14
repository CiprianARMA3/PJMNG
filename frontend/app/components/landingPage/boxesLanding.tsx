import React from 'react';
import TASK from './components/tasks';
import CALENDAR from './components/calendar';
import TABLECALENDAR from './components/tablecalendar';

import { 
  ArrowRight, 
  GitMerge, 
  UserPlus, 
  Zap, 
  LineChart, 
  ShieldCheck 
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
{/* Card: Review Experience */}
<FeatureCard className="p-8 md:p-10 flex flex-col justify-between min-h-[400px]">
    <div>
        <h3 className="text-2xl md:text-3xl font-bold mb-3">
            Keep track of Events and Workflow
        </h3>
        <p className="text-gray-600 mb-6">
            One unified inbox and review workflow for your team's PRs.
        </p>
        <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors mb-8">
            Learn more 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
    </div>
    
    {/* MODIFIED SECTION: Overlapping Container */}
    <div className="relative h-64 w-full flex justify-start -mb-8"> 
        
        {/* 1. CALENDAR (Left, lower z-index) */}
        {/* Set to position absolute to establish space for TABLECALENDAR, using 70% width. */}
        <div className="absolute top-0 left-0 h-full w-[70%] z-10">
            <CALENDAR /> 
        </div>
        
        {/* 2. TABLECALENDAR (Far Right, higher z-index, overlaps CALENDAR by 30%) */}
        <div className="absolute top-0 right-0 h-full w-[60%] z-20">
            {/* Inner wrapper for shadow/border on the table content */}
            <div className="absolute inset-0 shadow-2xl border-2 border-purple-300 rounded-xl overflow-hidden bg-white">
                <TABLECALENDAR />
            </div>
        </div>
        
    </div>
    {/* END OF MODIFIED SECTION */}

</FeatureCard>

          {/* Card: Notifications */}
          <FeatureCard className="p-8 md:p-10 flex flex-col min-h-[400px]">
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Don't miss a beat
              </h3>
              <p className="text-gray-600 mb-6">
                Actionable Slack notifications that meet you where you are.
              </p>
              <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors">
                Read the docs 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="flex-1 flex items-end justify-center">
              <TemplateImage className="w-full h-32 shadow-lg" label="Notification Preview" />
            </div>
          </FeatureCard>
        </div>

        {/* --- Row 3: Split Grid (CI & Features) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Smarter CI */}
          <FeatureCard className="p-8 md:p-10 flex flex-col min-h-[400px]">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Smarter CI
              </h3>
              <p className="text-gray-600 mb-6">
                Stacking-integrated CI that only runs when you need it.
              </p>
              <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors mb-8">
                Read about CI Optimizations 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="flex-1 relative mt-4">
              <TemplateImage className="absolute left-0 right-0 bottom-[-60px] top-0 shadow-lg" label="CI Console" />
            </div>
          </FeatureCard>

          {/* Card: One Platform List */}
          <FeatureCard className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[400px]">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                One platform. All of your review essentials.
              </h3>
              <p className="text-gray-600 mb-6">
                Your CLI, PR page, inbox, and merge queue, unified in one seamless workflow.
              </p>
              <a href="#" className="group flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors">
                Read about merge queues 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="flex flex-col items-end md:pl-4">
              <Pill icon={GitMerge} text="Merge Queue" />
              <Pill icon={UserPlus} text="Reviewer Assignment" />
              <Pill icon={Zap} text="Automations" />
              <Pill icon={LineChart} text="Insights" />
              <Pill icon={ShieldCheck} text="Protections" />
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