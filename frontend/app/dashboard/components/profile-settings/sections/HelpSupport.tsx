"use client";

import { 
    Zap, 
    Terminal, 
    FileText, 
    Globe, 
    ShieldCheck, 
    ArrowRight,
    Clock,
    Video,
    MapPin,
    ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

// --- COMPONENT: COMPACT ROW (Clickable Mailto) ---
const ContactRow = ({ 
  icon: Icon, 
  title, 
  detail, 
  description, 
  linkText, 
  className = "", 
  isPrimary = false,
  delay = 0
}: any) => (
  <motion.a
    href={`mailto:${detail}`}
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.01 }}
    className={`
      group relative p-6 rounded-[24px] bg-white border-2 transition-all duration-300 overflow-hidden flex items-center justify-between gap-6 cursor-pointer
      ${isPrimary 
        ? "border-purple-600 shadow-xl shadow-purple-900/10" 
        : "border-zinc-100 shadow-lg shadow-zinc-200/50 hover:border-purple-200"
      }
      ${className}
    `}
  >
    {/* Texture */}
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none" />
    
    <div className="relative z-10 flex items-center gap-6 flex-1">
      {/* Icon */}
      <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500
          ${isPrimary 
            ? "bg-purple-600 text-white shadow-md" 
            : "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
          }
      `}>
        <Icon size={20} strokeWidth={2.5} />
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-black tracking-tight text-[#202124]">{title}</h3>
            {isPrimary && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-black uppercase rounded-md tracking-wider">Priority</span>}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
             <span className="text-purple-600 font-black text-[10px] uppercase tracking-widest group-hover:underline decoration-purple-300 underline-offset-4 decoration-2 transition-all">
                {detail}
             </span>
             <span className="hidden md:block w-1 h-1 rounded-full bg-zinc-300"></span>
             <p className="text-zinc-500 text-xs font-bold line-clamp-1 md:line-clamp-none">
                {description}
             </p>
        </div>
      </div>
    </div>

    {/* Action Arrow (Right Side) */}
    <div className="relative z-10 shrink-0 pl-4 border-l-2 border-zinc-50 hidden sm:flex">
        <div className="w-10 h-10 rounded-full bg-white border-2 border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:border-purple-600 group-hover:text-purple-600 transition-all">
            <ChevronRight size={18} strokeWidth={3} />
        </div>
    </div>
  </motion.a>
);

export default function SupportPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 font-sans pb-20">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Terminal size={14} className="text-purple-600" strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                            Assistance / Developer Support Relay
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 uppercase leading-none">
                        Help Center<span className="text-purple-600">.</span>
                    </h1>
                    <p className="text-zinc-500 font-bold text-sm leading-relaxed max-w-md mt-4">
                        Direct lines to our departments.
                    </p>
                </div>
            </div>

            {/* --- COMPACT ROWS STACK --- */}
            <div className="space-y-4">
                
                {/* Sales (Primary) */}
                <ContactRow 
                    isPrimary={true}
                    icon={Zap}
                    title="Sales & Enterprise"
                    detail="sales@kaprydev.com"
                    description="Enterprise features, volume pricing, and custom demos."
                    linkText="Talk to Sales"
                    delay={0}
                />

                {/* Support */}
                <ContactRow 
                    icon={Terminal}
                    title="Technical Support"
                    detail="support@kaprydev.com"
                    description="Implementation help and troubleshooting. 24/7 availability."
                    linkText="Contact Us"
                    delay={0.1}
                />

                {/* Billing */}
                <ContactRow 
                    icon={FileText}
                    title="Billing & Accounts"
                    detail="billing@kaprydev.com"
                    description="Invoices, subscription plans, and token analytics."
                    linkText="View Billing Docs"
                    delay={0.2}
                />

                {/* Press */}
                <ContactRow 
                    icon={Globe}
                    title="Press & Media"
                    detail="press@kaprydev.com"
                    description="Media inquiries, brand assets, and interview requests."
                    linkText="Media Kit"
                    delay={0.3}
                />

                {/* Partnerships */}
                <ContactRow 
                    icon={ShieldCheck}
                    title="Partnerships"
                    detail="partners@kaprydev.com"
                    description="Integrations and developer ecosystem program."
                    linkText="Partner Program"
                    delay={0.4}
                />
            </div>

            {/* --- SECONDARY INFO BAR --- */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10 p-10 rounded-[32px] bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/20"
            >
                {/* Visual Accents */}
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
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                        <Clock size={20} className="text-white drop-shadow-md" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 opacity-70">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">SLA Priority</span>
                        </div>
                        <h4 className="font-black text-lg tracking-tight">Response Time</h4>
                        <p className="text-purple-50 text-xs leading-relaxed font-bold">
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
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                        <Video size={20} className="text-white drop-shadow-md" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 opacity-70">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Availability</span>
                        </div>
                        <h4 className="font-black text-lg tracking-tight">Office Hours</h4>
                        <p className="text-purple-50 text-xs leading-relaxed font-bold">
                            Monday — Friday<br />
                            <span className="font-black text-white">10:00 — 18:00</span> <span className="text-[10px] opacity-70">(UTC+1)</span>
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
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xl group-hover:bg-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl">
                        <MapPin size={20} className="text-white drop-shadow-md" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 opacity-70">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Headquarters</span>
                        </div>
                        <h4 className="font-black text-lg tracking-tight">HQ Location</h4>
                        <p className="text-purple-50 text-xs leading-relaxed font-bold">
                            Via Dante<br />
                            <span className="font-black text-white">Cremona, CR</span> 26100
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}