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
import { motion } from 'framer-motion';


const Discord = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const XIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293L17.607 20.65z"/>
  </svg>
);

// --- Reusable Info Card (Bento Style) ---
const ContactInfoCard = ({ 
  icon: Icon, 
  title, 
  detail, 
  description, 
  linkText, 
  className = "", 
  isPrimary = false 
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -8 }}
    className={`
      group relative p-10 rounded-[40px] bg-white border-2 transition-all duration-500 overflow-hidden
      ${isPrimary 
        ? "border-purple-600 shadow-2xl shadow-purple-900/10 lg:col-span-2" 
        : "border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200"
      }
      ${className}
    `}
  >
    {/* Subtle Grainy Texture on White */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
    
    {/* Accent Glow */}

    <div className="relative z-10 h-full flex flex-col">
      {/* Supercharged Icon Box */}
      <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
        <Icon size={28} strokeWidth={2.5} />
      </div>

      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-2">
            {isPrimary && <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-md">Priority</span>}
            <h3 className="text-2xl font-black tracking-tighter text-[#202124]">{title}</h3>
        </div>
        
        <p className="text-purple-600 font-black text-sm mb-6 uppercase tracking-widest">{detail}</p>
        
        <p className="text-zinc-500 leading-relaxed text-base font-bold mb-8">
          {description}
        </p>
      </div>

      <div className="mt-auto">
        <a href="#" className="inline-flex items-center gap-2 text-sm font-black text-[#202124] uppercase tracking-widest border-b-4 border-purple-600 pb-1 transition-all hover:gap-4">
          {linkText} <ArrowRight size={16} strokeWidth={3} />
        </a>
      </div>
    </div>
  </motion.div>
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
              description="Looking to integrate with our system or join our developer ecosystem as a service provider?"
              linkText="Partner Program"
            />
          </div>

          {/* Secondary Info Bar */}
<motion.div 
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10 p-12 rounded-[40px] bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20"
>
    {/* Enhanced Visual Accents */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-15 mix-blend-overlay pointer-events-none" />
    <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-400 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
    <div className="absolute -left-20 -top-20 w-72 h-72 bg-indigo-400 rounded-full blur-[100px] opacity-20" />
    
    {/* Item 1: Response Time */}
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="relative z-10 flex items-start gap-5"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
            <Clock size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-70">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">SLA Priority</span>
            </div>
            <h4 className="font-black text-xl tracking-tight">Response Time</h4>
            <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                Enterprise: <span className="font-black text-white decoration-purple-300 underline underline-offset-4 decoration-2">{"< 15 mins"}</span><br />
                Developer: <span className="opacity-70 font-black">{"< 4 hours"}</span>
            </p>
        </div>
    </motion.div>

    {/* Item 2: Office Hours */}
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative z-10 flex items-start gap-5"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
            <Video size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-70">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Availability</span>
            </div>
            <h4 className="font-black text-xl tracking-tight">Office Hours</h4>
            <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                Monday — Friday<br />
                <span className="font-black text-white">10:00 — 18:00</span> <span className="text-xs opacity-70">(UTC+1)</span>
            </p>
        </div>
    </motion.div>

    {/* Item 3: HQ Location */}
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="relative z-10 flex items-start gap-5"
    >
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
            <MapPin size={26} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-70">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Headquarters</span>
            </div>
            <h4 className="font-black text-xl tracking-tight">HQ Location</h4>
            <p className="text-purple-50 text-[15px] leading-relaxed font-bold">
                Via Dante<br />
                <span className="font-black text-white">Cremona, CR</span> 26100, Italy
            </p>
        </div>
    </motion.div>
</motion.div>
        </div>
      </section>

      {/* Socials & Community */}
<section className="relative py-24 border-t-2 border-zinc-100 bg-zinc-50/50 overflow-hidden">
  {/* Grainy Texture Overlay */}
  <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-10 mix-blend-multiply pointer-events-none" />
  
  <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
    {/* Header Section */}
    <h2 className="text-4xl font-black text-[#202124] mb-4 tracking-tighter">
      Join our community
    </h2>
    <p className="text-[#5f6368] mb-12 font-bold text-lg">
      Get real-time updates and connect with other developers.
    </p>
    
    <div className="flex flex-wrap justify-center gap-6">
      {[
        { 
          name: 'X', 
          icon: XIcon, 
          handle: '@kaprydev', 
          href: 'https://x.com/KapryDEV' 
        },
        { 
          name: 'Discord', 
          icon: Discord, 
          handle: 'KapryDEV', 
          href: 'https://discord.gg/' 
        },
        { 
          name: 'LinkedIn', 
          icon: Linkedin, 
          handle: 'kaprydev', 
          href: 'https://linkedin.com/company/kaprydev' 
        }
      ].map((social) => (
        <a 
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-zinc-200 rounded-2xl hover:border-purple-600 hover:shadow-2xl hover:-translate-y-1 transition-all group shadow-sm active:scale-95"
        >
          {/* Supercharged Icon Container */}
          <div className="p-2.5 bg-zinc-50 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
            <social.icon 
              size={22} 
              strokeWidth={social.name === 'LinkedIn' ? 3 : 0} 
              className={social.name === 'LinkedIn' ? "" : "fill-current"}
            />
          </div>

          {/* Handle Details */}
          <div className="text-left">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1.5">
              {social.name}
            </p>
            <p className="text-sm font-black text-zinc-900 tracking-tight">
              {social.handle}
            </p>
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