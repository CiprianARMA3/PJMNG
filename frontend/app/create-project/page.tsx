"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
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
  MoreHorizontal,
  Code // Keeping Code icon for the Widget as in the target style
} from "lucide-react"; 
import Image from 'next/image';
import Link from 'next/link';

const supabase = createClient();

// --- Types remain the same ---
interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  max_projects: number;
  max_users: number;
}

interface UserWithPlan {
  id: string;
  email: string;
  name: string;
  surname: string;
  plan_id: string | null;
  active: boolean;
  plan?: Plan;
}

// --- 1. MATTE BACKGROUND COMPONENT (From Target) ---
const NoiseBackground = () => (
  <div className="fixed inset-0 z-0 w-full h-full bg-[#0a0a0a]">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] to-[#111111]" />
    
    {/* Noise Overlay */}
    <div 
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  </div>
);

// --- 2. Page Widget (Matte Style - Adapted from Target) ---
const PageWidget = ({ title, icon: Icon, children }: any) => (
  <div className="relative z-10 w-full bg-[#111111] border border-[#222] rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] hover:border-[#333] transition-colors">
    {/* Header */}
    <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between bg-[#141414] rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
           <Icon size={14} className="text-neutral-400" /> {/* Icon is smaller and neutral-colored */}
        </div>
        <h3 className="text-sm font-medium text-neutral-300 tracking-wide">{title}</h3>
      </div>
      <MoreHorizontal size={16} className="text-neutral-600" />
    </div>
    
    {/* Content */}
    <div className="flex-1 p-6 bg-[#111111] min-h-0 relative flex flex-col rounded-b-xl">
      {children}
    </div>
  </div>
);


export default function CreateProjectPage() {
  const router = useRouter();
  
  // --- State ---
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [user, setUser] = useState<UserWithPlan | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  
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
    fetchUserAndPlans();
  }, []);

  const fetchUserAndPlans = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/auth/login'); return; }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, name, surname, plan_id, active")
        .eq("id", authUser.id)
        .single();

      if (userError) throw userError;
      if (!userData.active) { alert("Account not active."); return; }

      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select("id, name, monthly_price, features");

      if (plansError) throw plansError;

      const parsedPlans: Plan[] = (plansData || []).map(plan => {
        let features: any = {};
        if (typeof plan.features === "string") {
            try { features = JSON.parse(plan.features); } catch { features = {}; }
        } else { features = plan.features || {}; }
        const pm = features.features?.project_management || {};
        const collab = features.features?.collaboration || {};
        return {
          id: plan.id,
          name: plan.name,
          monthly_price: plan.monthly_price,
          max_projects: pm.max_projects || 1,
          max_users: typeof collab.max_users === 'number' ? collab.max_users : 1,
        };
      });

      setPlans(parsedPlans);

      if (userData.plan_id) {
        const userPlan = parsedPlans.find(plan => plan.id === userData.plan_id);
        setSelectedPlan(userPlan || null);
        setUser({ ...userData, plan: userPlan || undefined });
        if(userPlan) {
            setFormData(prev => ({...prev, max_collaborators: userPlan.max_users}))
        }
      } else {
        setUser(userData);
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

  // --- Upload Logic ---
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

      // Check project limit
      const { data: existingProjects } = await supabase.from("projects").select("id").eq("created_by", authUser.id);
      if (existingProjects && existingProjects.length >= selectedPlan.max_projects) {
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

      // 2. Upload Images and Prepare Metadata Update
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

      // 3. Update Project with Metadata (URLs)
      await supabase.from("projects").update({ metadata: newMetadata }).eq("id", project.id);
      
      // 4. Add Creator as Admin
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

  // --- Loading State ---
 if (userLoading) {
    return (
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // --- No Plan State ---
  if (!user?.plan_id) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <NoiseBackground />
        <div className="relative z-10 max-w-md w-full p-8 bg-[#111111] border border-[#222] rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] text-center">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2 text-white/90">Subscription Required</h2>
            <p className="text-neutral-500 mb-6 text-sm">You need an active plan to create projects.</p>
            <div className="flex gap-3 justify-center">
                <button onClick={() => router.back()} className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-lg transition-colors bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a]">Cancel</button>
                <Link href="/dashboard/subscriptions" className="px-4 py-2 text-sm bg-neutral-200 hover:bg-white text-black rounded-lg font-medium transition-colors shadow-sm">View Plans</Link>
            </div>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen relative font-sans">
        
        {/* Background */}
        <NoiseBackground />
        
        {/* Scrollbar Styles */}
        <style global jsx>{`
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #444; }
        `}</style>


        {/* Top Navigation Bar - Matte Style */}
        <nav className="border-b border-[#222] bg-[#111111] sticky top-0 z-50 shadow-md">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-400 hover:text-white hover:bg-[#1a1a1a] rounded-full transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-4 w-[1px] bg-[#222]"></div>
                    <span className="font-semibold tracking-tight text-lg text-white/90">Create Project</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600 uppercase tracking-wider font-medium">
                        {selectedPlan?.name} Plan Active
                    </span>
                    {/* <Link href="/dashboard/subscriptions" className="text-xs text-neutral-400 hover:text-white font-medium">Manage Plan</Link> */}
                </div>
            </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* *** LEFT COLUMN: FORM INPUTS *** */}
                <div className="lg:col-span-8">
                    <div className="max-w-xl mx-auto space-y-10">
                        
                        {/* Section 1: Project Identity (Visuals) */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-white/90">
                                <LayoutTemplate className="text-neutral-400" size={20} />
                                <h2 className="text-lg font-medium text-neutral-300">Project Identity</h2>
                            </div>
                            
                            {/* Visual Preview Area */}
                            <div className="bg-[#111111] border border-[#222] rounded-xl overflow-hidden relative group shadow-lg">
                                
                                {/* Banner Area */}
                                <div 
                                    className="h-40 w-full bg-[#1A1A1A] relative cursor-pointer hover:bg-[#1f1f1f] transition-colors"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    {projectMedia.bannerPreview ? (
                                        <img src={projectMedia.bannerPreview} alt="Banner" className="w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 gap-2">
                                            {uploadingBanner ? <div className="animate-spin h-6 w-6 border-2 border-neutral-700 border-t-white rounded-full"></div> : <Upload size={20} />}
                                            <span className="text-xs font-medium">{uploadingBanner ? "Uploading..." : "Upload Banner Image"}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 text-white/80">Change Banner</span>
                                    </div>
                                </div>

                                {/* Logo Area (Overlapping) */}
                                <div className="px-6 pb-6 -mt-10 flex items-end justify-between relative z-10">
                                    <div 
                                        className="w-24 h-24 rounded-xl bg-[#111111] border-4 border-[#111111] relative cursor-pointer overflow-hidden group/logo shadow-xl"
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        {projectMedia.logoPreview ? (
                                            <img src={projectMedia.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-neutral-600 hover:bg-[#222] transition-colors">
                                                {uploadingLogo ? <div className="animate-spin h-4 w-4 border-2 border-neutral-700 border-t-white rounded-full"></div> : <Upload size={18} />}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[10px] font-medium text-white/80">Edit</span>
                                        </div>
                                    </div>
                                    <div className="mb-2 text-right">
                                        <p className="text-xs text-neutral-600">1200x400px (Banner) • 500x500px (Logo)</p>
                                    </div>
                                </div>

                                {/* Hidden Inputs */}
                                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </div>
                        </section>

                        <div className="h-[1px] bg-[#222] w-full"></div>

                        {/* Section 2: General Information */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-neutral-300">
                                <Settings className="text-neutral-400" size={20} />
                                <h2 className="text-lg font-medium">General Information</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Project Name <span className="text-red-900">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Game Dev Studio"
                                            required
                                            className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-all placeholder:text-neutral-700 h-12"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Website URL</label>
                                        <div className="relative">
                                            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                                            <input
                                                type="url"
                                                name="website_url"
                                                value={formData.website_url}
                                                onChange={handleInputChange}
                                                placeholder="https://game-dev-studio.com"
                                                className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-all placeholder:text-neutral-700 h-12"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="What is this project about?"
                                        className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-all placeholder:text-neutral-700 resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="h-[1px] bg-[#222] w-full"></div>

                        {/* Section 3: Integrations & Links */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-neutral-300">
                                <Link2 className="text-neutral-400" size={20} />
                                <h2 className="text-lg font-medium">Connections</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* GitHub - Prominent */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">GitHub Repository</label>
                                    <div className="relative">
                                        <Github size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                                        <input
                                            type="url"
                                            name="github_repo_url"
                                            value={formData.github_repo_url}
                                            onChange={handleInputChange}
                                            placeholder="https://github.com/org/repo (Required for analytics)"
                                            className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-all placeholder:text-neutral-700 h-12"
                                        />
                                    </div>
                                </div>

                                {/* Other Socials */}
                                {['discord', 'twitter', 'linkedin', 'youtube'].map((platform) => (
                                    <div key={platform} className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{platform}</label>
                                        <input
                                            type="url"
                                            value={(socialLinks as any)[platform]}
                                            onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                                            placeholder={`https://${platform}.com/...`}
                                            className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 transition-all placeholder:text-neutral-700 h-12"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div> {/* End of max-w-xl mx-auto (Centered Form Content) */}
                </div> {/* End of lg:col-span-8 (Left Column) */}

                {/* *** RIGHT COLUMN: CONTEXT / SUMMARY *** */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Plan Summary Card - Fixed width and placed on the right */}
                    <div className="sticky top-24">
                        <PageWidget 
                            title="Plan & Limitations" 
                            icon={Crown} 
                        >
                            <div className="space-y-5">
                                <div className="flex items-center justify-between pb-5 border-b border-[#222]">
                                    <h3 className="font-medium text-sm text-neutral-300">{selectedPlan?.name} Plan</h3>
                                    <Link href="/dashboard" className="text-xs text-neutral-400 hover:text-white font-medium">Upgrade</Link>
                                </div>

                                {/* Collaborator Slider */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-neutral-500">Max Team Size (Users)</span>
                                        <span className="text-neutral-300 font-medium">{formData.max_collaborators} / {selectedPlan?.max_users}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max={selectedPlan?.max_users || 1}
                                        value={formData.max_collaborators}
                                        onChange={(e) => setFormData(prev => ({ ...prev, max_collaborators: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-400 focus:accent-white"
                                    />
                                    <p className="text-[10px] text-neutral-600 mt-2">
                                        You can invite up to {selectedPlan?.max_users} collaborators on this plan.
                                    </p>
                                </div>

                                {/* Feature List */}
                                <div className="bg-[#161616] rounded-lg p-4 text-xs space-y-3 border border-[#222]">
                                    <div className="flex items-center gap-2 text-neutral-400">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        <span>Projects allowed: {selectedPlan?.max_projects}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-400">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        <span>Full Analytics Dashboard Access</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-400">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        <span>GitHub Integration</span>
                                    </div>
                                </div>
                                
                                {/* Submit Button - Matte Style */}
                                <button
                                    type="submit"
                                    disabled={loading || !formData.name.trim()}
                                    className="w-full py-3 bg-neutral-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-black/30"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        "Create Project"
                                    )}
                                </button>
                                
                                <p className="text-[10px] text-neutral-700 text-center leading-relaxed">
                                    By creating a project, you agree to our Terms of Service.
                                </p>
                            </div>
                        </PageWidget>
                    </div>
                </div>
            </form>
        </main>
    </div>
  );
}