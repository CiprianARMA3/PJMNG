'use client';

import React from 'react';
import {
  Mail,
  MessageSquare,
  Globe,
  ArrowRight,
  ShieldCheck,
  Terminal,
  MapPin,
  Phone,
  Zap,
  Twitter,
  Github,
  Linkedin,
  Clock,
  Video,
  FileText
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import AuroraBackground from '@/app/components/AuroraBackground';

// --- Reusable Info Card (Bento Style) ---
const ContactInfoCard = ({ icon: Icon, title, detail, description, linkText, className = "" }: any) => (
  <div className={`group relative p-8 rounded-3xl bg-zinc-50 border border-zinc-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-1 ${className}`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100" />

    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 text-purple-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:border-purple-200 transition-all duration-500 relative z-10">
      <Icon size={24} strokeWidth={1.5} />
    </div>

    <h3 className="text-xl font-bold text-[#202124] mb-1 relative z-10">{title}</h3>
    <p className="text-purple-600 font-semibold text-sm mb-4 relative z-10">{detail}</p>
    <p className="text-[#5f6368] leading-relaxed text-sm mb-8 relative z-10">{description}</p>
    
    <a href="#" className="inline-flex items-center text-sm font-bold text-[#202124] group-hover:text-purple-600 transition-colors relative z-10">
      {linkText} <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
    </a>
  </div>
);

const ContactPage = () => {
  return (
    <main className="bg-white min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-white">
        <AuroraBackground />
        <div className="relative z-20 max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MessageSquare size={14} className="text-purple-600" />
            <span className="text-[10px] font-bold text-purple-700 tracking-widest uppercase">Contact Center</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#202124] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            We're here to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">help you scale.</span>
          </h1>
          <p className="text-xl text-[#5f6368] max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Choose the department you'd like to reach. Our global team is distributed across time zones to ensure 24/7 coverage.
          </p>
        </div>
      </section>

      {/* Info Grid Section */}
      <section className="py-12 pb-24 px-6 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Sales Card - Large */}
            <ContactInfoCard 
              className="lg:col-span-2"
              icon={Zap}
              title="Sales & Enterprise"
              detail="sales@kaprydev.com"
              description="Interested in our Enterprise features, volume-optimized pricing, or a custom demo for your engineering organization? Our sales consultants are ready to help."
              linkText="Talk to Sales"
            />

            {/* Support Card */}
            <ContactInfoCard 
              icon={Terminal}
              title="Technical Support"
              detail="support@kaprydev.com"
              description="Need help with your implementation or encountering a technical hurdle? Our engineers are available 24/7."
              linkText="Contact Us"
            />

            {/* Billing Card */}
            <ContactInfoCard 
              icon={FileText}
              title="Billing & Accounts"
              detail="billing@kaprydev.com"
              description="Questions regarding your invoice, subscription plans, or usage-based token analytics."
              linkText="View Billing Docs"
            />

            {/* Press Card */}
            <ContactInfoCard 
              icon={Globe}
              title="Press & Media"
              detail="press@kaprydev.com"
              description="For media inquiries, brand assets, or interview requests regarding KapryDEV's AI infrastructure."
              linkText="Media Kit"
            />

            {/* Partnerships Card */}
            <ContactInfoCard 
              icon={ShieldCheck}
              title="Partnerships"
              detail="partners@kaprydev.com"
              description="Looking to integrate with our API or join our developer ecosystem as a service provider?"
              linkText="Partner Program"
            />
          </div>

          {/* Secondary Info Bar */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 p-10 rounded-[32px] bg-zinc-900 text-white relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-10 mix-blend-overlay" />
             
             <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Response Time</h4>
                  <p className="text-zinc-400 text-sm">Enterprise: &lt; 15 mins<br />Developer: &lt; 4 hours</p>
                </div>
             </div>

             <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Video size={20} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Office Hours</h4>
                  <p className="text-zinc-400 text-sm">Monday — Friday<br />10:00 — 18:00  (UTC+1)</p>
                </div>
             </div>

             <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">HQ Location</h4>
                  <p className="text-zinc-400 text-sm">Via Dante<br />Cremona,CR 26100,Italy</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Socials & Community */}
      <section className="py-24 border-t border-zinc-100 bg-zinc-50/30">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#202124] mb-4">Join our community</h2>
          <p className="text-[#5f6368] mb-10">Get real-time updates and connect with other developers.</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Twitter', icon: Twitter, handle: '@kaprydev' },
              { name: 'GitHub', icon: Github, handle: 'kapry-labs' },
              { name: 'LinkedIn', icon: Linkedin, handle: 'kaprydev' }
            ].map((social) => (
              <a 
                key={social.name}
                href="#" 
                className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <social.icon size={20} className="text-zinc-400 group-hover:text-purple-600 transition-colors" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{social.name}</p>
                  <p className="text-sm font-bold text-zinc-700">{social.handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ContactPage;