"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getUserSubscriptionData } from "@/app/actions/getUserSubscriptionData";
import {
  ArrowLeft,
  Github,
  Settings,
  Link2,
  Crown,
  Upload,
  Globe,
  CheckCircle2,
  LayoutTemplate,
  Terminal,
  Cpu,
  Zap,
  PieChart,
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from 'next/link';
import { motion, Variants } from "framer-motion";

const supabase = createClient();

// --- MOTION PROTOCOL ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 260, damping: 20 } 
  }
};

// --- INDUSTRIAL COMPONENT: DEPLOYMENT NODE ---
const DeploymentNode = ({ title, icon: Icon, children }: any) => (
  <div className="relative w-full bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] flex flex-col overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 mb-8">
    <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none z-0" />
    <div className="relative z-10 px-8 py-6 border-b-2 border-zinc-50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 text-purple-600 shadow-sm">
          <Icon size={18} strokeWidth={3} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 dark:text-white uppercase">{title}</h3>
      </div>
    </div>
    <div className="relative z-10 p-8 bg-white dark:bg-transparent flex flex-col">
      {children}
    </div>
  </div>
);

// --- Types ---
interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  max_projects: number;
  max_users: number; // -1 or 9999 for unlimited
}

interface UserWithPlan {
  id: string;
  email: string;
  plan_id: string | null;
  active: boolean;
  plan?: Plan;
}

// --- Helper: Hardcoded Limits per Plan Name ---
const getPlanLimits = (planName: string) => {
  const lower = planName.toLowerCase();

  if (lower.includes('enterprise')) {
    return { max_users: 9999, max_projects: 9999, label: 'Enterprise' }; // "Unlimited"
  }
  if (lower.includes('developer')) {
    // Developer: 50 Users, 10 Projects
    return { max_users: 50, max_projects: 10, label: 'Developer' };
  }
  // Default to Individual/Standard: 1 User, 5 Projects
  return { max_users: 1, max_projects: 5, label: 'Individual' };
};

export default function CreateProjectPage() {
  const router = useRouter();

  // --- State ---
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [user, setUser] = useState<UserWithPlan | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0); // Track current usage

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website_url: "",
    github_repo_url: "",
    max_collaborators: 1,
  });

  const [socialLinks, setSocialLinks] = useState({
    discord: "",
    twitter: "",
    website: "",
    youtube: "",
    facebook: "",
    linkedin: "",
    instagram: "",
  });

  const [projectMedia, setProjectMedia] = useState({
    logoFile: null as File | null,
    bannerFile: null as File | null,
    logoPreview: null as string | null,
    bannerPreview: null as string | null,
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // --- Effects & Logic ---
  useEffect(() => {
    fetchUserAndSubscription();
  }, []);

  const fetchUserAndSubscription = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/auth/login'); return; }

      // 1. Get Project Count
      const { count, error } = await supabase
        .from("projects")
        .select("id", { count: 'exact', head: true })
        .eq("created_by", authUser.id);

      if (!error) setProjectCount(count || 0);

      // 2. Get Subscription
      const subData = await getUserSubscriptionData();
      const isActive = subData && subData.plan_id && ['active', 'trialing'].includes(subData.subscription_status || '');

      if (!isActive || !subData) {
        setUser({
          id: authUser.id,
          email: authUser.email || "",
          plan_id: null,
          active: false
        });
        setSelectedPlan(null);
      } else {
        // --- HARDCODED LIMITS LOGIC ---
        const planName = subData.planName || 'Individual';
        const limits = getPlanLimits(planName);

        const currentPlan: Plan = {
          id: subData.plan_id!,
          name: planName,
          monthly_price: 0,
          max_projects: limits.max_projects,
          max_users: limits.max_users
        };

        setSelectedPlan(currentPlan);

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          plan_id: subData.plan_id,
          active: true,
          plan: currentPlan
        });

        // Ensure default doesn't exceed new limit
        setFormData(prev => ({ ...prev, max_collaborators: Math.min(prev.max_collaborators, limits.max_users) }));
      }

    } catch (error) {
      console.error(error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('Max 5MB');
    setProjectMedia(prev => ({ ...prev, logoFile: file, logoPreview: URL.createObjectURL(file) }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert('Max 10MB');
    setProjectMedia(prev => ({ ...prev, bannerFile: file, bannerPreview: URL.createObjectURL(file) }));
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const uploadProjectImage = async (file: File, projectId: string, type: 'logo' | 'banner') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `projects/${projectId}/${type}s/${fileName}`;
    const { error } = await supabase.storage.from('projects-metadata').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('projects-metadata').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.plan_id || !selectedPlan) return router.push('/dashboard');
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      // Re-Check project limit on server-side before submitting
      const { count: currentCount } = await supabase
        .from("projects")
        .select("id", { count: 'exact', head: true })
        .eq("created_by", authUser.id);

      const safeCount = currentCount || 0;

      // Infinite check: 9000+ is our "unlimited" flag
      if (selectedPlan.max_projects < 9000 && safeCount >= selectedPlan.max_projects) {
        alert(`Project limit (${selectedPlan.max_projects}) reached. Please upgrade your plan.`);
        return router.push('/dashboard/subscriptions');
      }

      // 1. Create Project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert([{
          name: formData.name,
          description: formData.description,
          website_url: formData.website_url,
          created_by: authUser.id,
          github_repo_url: formData.github_repo_url,
          max_collaborators: Math.min(formData.max_collaborators, selectedPlan.max_users),
          collaborators: 1,
          metadata: {
            "github-link": formData.github_repo_url,
          },
          settings: {}
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Upload Images and Prepare Metadata
      let logoUrl = null, bannerUrl = null;
      if (projectMedia.logoFile) {
        setUploadingLogo(true);
        logoUrl = await uploadProjectImage(projectMedia.logoFile, project.id, 'logo');
        setUploadingLogo(false);
      }
      if (projectMedia.bannerFile) {
        setUploadingBanner(true);
        bannerUrl = await uploadProjectImage(projectMedia.bannerFile, project.id, 'banner');
        setUploadingBanner(false);
      }

      const newMetadata = {
        "github-link": formData.github_repo_url,
        "discord-link": socialLinks.discord,
        "project-icon": logoUrl,
        "twitter-link": socialLinks.twitter,
        "website-link": formData.website_url,
        "youtube-link": socialLinks.youtube,
        "facebook-link": socialLinks.facebook,
        "linkedin-link": socialLinks.linkedin,
        "instagram-link": socialLinks.instagram,
        "project-banner": bannerUrl
      };

      await supabase.from("projects").update({ metadata: newMetadata }).eq("id", project.id);

      await supabase.from("project_users").insert([{
        project_id: project.id,
        user_id: authUser.id,
        role_info: { role: "admin", permissions: ["all"] }
      }]);

      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers for Display ---
  const isUnlimitedProjects = selectedPlan?.max_projects && selectedPlan.max_projects >= 9000;
  const isUnlimitedUsers = selectedPlan?.max_users && selectedPlan.max_users >= 9000;

  const remainingProjects = isUnlimitedProjects
    ? "Unlimited"
    : Math.max(0, (selectedPlan?.max_projects || 0) - projectCount);

  const projectPercentage = isUnlimitedProjects
    ? 0
    : Math.min(100, (projectCount / (selectedPlan?.max_projects || 1)) * 100);

  // --- Loading State ---
  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0A0A0A]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" strokeWidth={3} />
      </div>
    );
  }

  // --- No Plan State ---
  if (!user?.active || !selectedPlan) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 bg-white dark:bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-md w-full p-10 bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] text-center shadow-2xl dark:shadow-none">
          <Crown className="w-12 h-12 text-purple-600 mx-auto mb-6" strokeWidth={2.5} />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">Protocol Halted</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-xs font-bold uppercase tracking-widest">Active subscription nodes required to initialize projects.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => router.back()} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800">Abort</button>
            <Link href="/dashboard/subscriptions" className="px-6 py-3 text-[10px] bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest">View Matrix</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-purple-100 pb-20 overflow-x-hidden">
      
      {/* --- NAVIGATION INTERFACE --- */}
      <nav className="border-b-2 border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-3 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-purple-600 transition-all active:scale-95 text-zinc-400">
              <ArrowLeft size={18} strokeWidth={3} />
            </button>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <h1 className="text-xl font-black uppercase tracking-tighter">Project Creation</h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="flex flex-col items-end leading-none">
                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">AUTH</span>
                <span className="text-[10px] font-black uppercase tracking-tight text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-100 dark:border-purple-900/30">
                  {selectedPlan?.name} Plan Active
                </span>
             </div>
          </div>
        </div>
      </nav>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-8 py-16"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* --- LEFT: CONFIGURATION MATRIX --- */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. Identity Module */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center gap-2 mb-8">
                <Terminal size={14} className="text-purple-600" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Section 01 / Identity Node</span>
              </div>

              <div className="bg-white dark:bg-zinc-900/30 border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] overflow-hidden relative group shadow-2xl shadow-zinc-200/50">
                <div 
                  className="h-52 w-full bg-zinc-100 dark:bg-zinc-800 relative cursor-pointer overflow-hidden group/banner"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {projectMedia.bannerPreview ? (
                    <img src={projectMedia.bannerPreview} alt="Banner" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2 uppercase tracking-widest font-black text-[10px]">
                      <Upload size={24} strokeWidth={3} className="group-hover/banner:scale-110 transition-transform" />
                      {uploadingBanner ? "Uploading Protocol..." : "Initialize Banner Relay"}
                    </div>
                  )}
                </div>
                <div className="px-10 pb-10 -mt-14 flex items-end relative z-10">
                  <div 
                    className="w-28 h-28 rounded-[32px] bg-white dark:bg-zinc-900 border-4 border-white dark:border-[#0A0A0A] relative cursor-pointer overflow-hidden shadow-2xl group/logo hover:border-purple-600 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {projectMedia.logoPreview ? (
                      <img src={projectMedia.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 text-zinc-300">
                        {uploadingLogo ? <Loader2 className="animate-spin" /> : <Plus size={32} strokeWidth={3} />}
                      </div>
                    )}
                  </div>
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </motion.section>

            {/* 2. Metadata Cluster */}
            <motion.section variants={itemVariants} className="space-y-10">
              <div className="flex items-center gap-2 mb-2">
                <Settings size={14} className="text-purple-600" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Section 02 / Metadata Logic</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Project Call-sign <span className="text-purple-600">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="E.G. PROJECT-AURORA" required className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-purple-600 transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Primary Domain</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="url" name="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="HTTPS://KAPRY.DEV" className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl pl-14 pr-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-purple-600 transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transmission Summary</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="ENTER DEPLOYMENT DESCRIPTION..." className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-purple-600 resize-none transition-all" />
              </div>
            </motion.section>

            {/* 3. Asset Relays */}
            <motion.section variants={itemVariants} className="space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <Link2 size={14} className="text-purple-600" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Section 03 / Asset Relays</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Source Control (GitHub)</label>
                  <div className="relative">
                    <Github size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="url" name="github_repo_url" value={formData.github_repo_url} onChange={handleInputChange} placeholder="HTTPS://GITHUB.COM/ORG/REPO" className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl pl-14 pr-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-purple-600 transition-all" />
                  </div>
                </div>
                {['discord', 'twitter', 'linkedin', 'youtube'].map((platform) => (
                  <div key={platform} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{platform} Relay</label>
                    <input type="url" value={(socialLinks as any)[platform]} onChange={(e) => handleSocialLinkChange(platform, e.target.value)} placeholder={`HTTPS://${platform.toUpperCase()}.COM/...`} className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-purple-600 transition-all" />
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* --- RIGHT: RESOURCE ALLOCATION --- */}
          <div className="lg:col-span-4">
            <motion.div variants={itemVariants} className="sticky top-32">
              <DeploymentNode title="Resource Allocation" icon={Crown}>
                <div className="space-y-10">
                  
                  {/* Usage Monitor */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <PieChart size={14} className="text-purple-600" strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Projects</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-900 dark:text-zinc-400">
                        {projectCount} / {isUnlimitedProjects ? "∞" : selectedPlan?.max_projects}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: isUnlimitedProjects ? '100%' : `${projectPercentage}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${projectPercentage >= 100 ? "bg-red-500" : "bg-purple-600"}`}
                      />
                    </div>

                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Utilized</span>
                        <span className="text-lg font-black">{projectCount}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Available</span>
                        <span className="text-lg font-black text-purple-600">{remainingProjects}</span>
                      </div>
                    </div>
                  </div>

                  {/* Node Scalability (Team Size) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Collaborators Limit</span>
                      <span className="text-xs font-black">{formData.max_collaborators} Collaborators</span>
                    </div>
                    {!isUnlimitedUsers ? (
                       <input
                         type="range"
                         min="1"
                         max={selectedPlan?.max_users || 1}
                         value={formData.max_collaborators}
                         onChange={(e) => setFormData(prev => ({ ...prev, max_collaborators: parseInt(e.target.value) }))}
                         className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-600 focus:accent-purple-500"
                       />
                    ) : (
                      <div className="py-2 px-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">
                        Unrestricted amount of collaborators
                      </div>
                    )}
                  </div>

                  {/* Final Execution */}
                  <button
                    type="submit"
                    disabled={loading || !formData.name.trim() || (!isUnlimitedProjects && projectCount >= (selectedPlan?.max_projects || 0))}
                    className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Zap size={16} strokeWidth={3} />}
                    {(!isUnlimitedProjects && projectCount >= (selectedPlan?.max_projects || 0)) ? "Quota Exhausted" : "Create Project"}
                  </button>
                </div>
              </DeploymentNode>
            </motion.div>
          </div>
        </form>
      </motion.main>
    </div>
  );
}