"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Github, Settings, Link2, Crown, Upload, X, Globe, CheckCircle2, LayoutTemplate, MoreHorizontal } from "lucide-react"; 
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

// Helper: Internal Card Component to create the "Menu on top" look
const PageWidget = ({ title, icon: Icon, iconColor, children }: any) => (
  <div className="bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-2xl w-full h-full hover:border-white/20 transition-colors">
    {/* The Menu / Header Bar */}
    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
      <div className="flex items-center gap-2.5">
        <Icon size={16} className={iconColor} />
        <h3 className="text-sm font-semibold text-white/90 tracking-tight">{title}</h3>
      </div>
      {/* Menu dots */}
      <MoreHorizontal size={16} className="text-white/20" />
    </div>
    
    {/* Content */}
    <div className="flex-1 p-5 bg-[#0a0a0a] min-h-0 relative flex flex-col">
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
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-[#121212] border border-white/5 rounded-lg text-center">
            <Crown className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">Subscription Required</h2>
            <p className="text-neutral-400 mb-6 text-sm">You need an active plan to create projects.</p>
            <div className="flex gap-3 justify-center">
                <button onClick={() => router.back()} className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-md transition-colors">Cancel</button>
                <Link href="/dashboard/subscriptions" className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors">View Plans</Link>
            </div>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
        
        {/* Scrollbar Styles */}
        <style global jsx>{`
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #444; }
        `}</style>


        {/* Top Navigation Bar - Replicating Dashboard Header Look */}
        <nav className="border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <span className="font-semibold tracking-tight text-lg text-white/90">Create Project</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                        {selectedPlan?.name} Plan Active
                    </span>
                    {/* <Link href="/dashboard/subscriptions" className="text-xs text-purple-400 hover:text-purple-300 font-medium">Manage Plan</Link> */}
                </div>
            </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-10">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* *** LEFT COLUMN: FORM INPUTS (8/12 WIDTH, CONTENT CENTERED) *** - lg:col-span-8 sets the column width.
                  - The inner <div className="max-w-xl mx-auto"> ensures the form fields 
                    are centered horizontally within this 8-column space.
                */}
                <div className="lg:col-span-8">
                    <div className="max-w-xl mx-auto space-y-10">
                        
                        {/* Section 1: Project Identity (Visuals) */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-white/90">
                                <LayoutTemplate className="text-purple-500" size={20} />
                                <h2 className="text-lg font-medium">Project Identity</h2>
                            </div>
                            
                            {/* Visual Preview Area */}
                            <div className="bg-[#121212] border border-white/5 rounded-lg overflow-hidden relative group">
                                
                                {/* Banner Area */}
                                <div 
                                    className="h-40 w-full bg-[#1A1A1A] relative cursor-pointer hover:bg-[#222] transition-colors"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    {projectMedia.bannerPreview ? (
                                        <img src={projectMedia.bannerPreview} alt="Banner" className="w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-2">
                                            {uploadingBanner ? <div className="animate-spin h-6 w-6 border-2 border-neutral-600 border-t-white rounded-full"></div> : <Upload size={20} />}
                                            <span className="text-xs font-medium">{uploadingBanner ? "Uploading..." : "Upload Banner Image"}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">Change Banner</span>
                                    </div>
                                </div>

                                {/* Logo Area (Overlapping) */}
                                <div className="px-6 pb-6 -mt-10 flex items-end justify-between relative z-10">
                                    <div 
                                        className="w-24 h-24 rounded-xl bg-[#121212] border-4 border-[#121212] relative cursor-pointer overflow-hidden group/logo"
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        {projectMedia.logoPreview ? (
                                            <img src={projectMedia.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-neutral-500 hover:bg-[#222] transition-colors">
                                                {uploadingLogo ? <div className="animate-spin h-4 w-4 border-2 border-neutral-600 border-t-white rounded-full"></div> : <Upload size={18} />}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[10px] font-medium text-white">Edit</span>
                                        </div>
                                    </div>
                                    <div className="mb-2 text-right">
                                        <p className="text-xs text-neutral-500">1200x400px (Banner) • 500x500px (Logo)</p>
                                    </div>
                                </div>

                                {/* Hidden Inputs */}
                                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </div>
                        </section>

                        <div className="h-[1px] bg-white/5 w-full"></div>

                        {/* Section 2: General Information */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-white/90">
                                <Settings className="text-purple-500" size={20} />
                                <h2 className="text-lg font-medium">General Information</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Project Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Game Dev Studio"
                                            required
                                            className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-neutral-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Website URL</label>
                                        <div className="relative">
                                            <Globe size={16} className="absolute left-3 top-3 text-neutral-500" />
                                            <input
                                                type="url"
                                                name="website_url"
                                                value={formData.website_url}
                                                onChange={handleInputChange}
                                                placeholder="https://game-dev-studio.com"
                                                className="w-full bg-[#121212] border border-white/10 rounded-md pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-neutral-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="What is this project about?"
                                        className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-neutral-600 resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="h-[1px] bg-white/5 w-full"></div>

                        {/* Section 3: Integrations & Links */}
                        <section>
                            <div className="flex items-center gap-2 mb-6 text-white/90">
                                <Link2 className="text-purple-500" size={20} />
                                <h2 className="text-lg font-medium">Connections</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* GitHub - Prominent */}
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">GitHub Repository</label>
                                    <div className="relative">
                                        <Github size={16} className="absolute left-3 top-3 text-neutral-500" />
                                        <input
                                            type="url"
                                            name="github_repo_url"
                                            value={formData.github_repo_url}
                                            onChange={handleInputChange}
                                            placeholder="https://github.com/org/repo (Required for analytics)"
                                            className="w-full bg-[#121212] border border-white/10 rounded-md pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-neutral-600"
                                        />
                                    </div>
                                </div>

                                {/* Other Socials */}
                                {['discord', 'twitter', 'linkedin', 'youtube'].map((platform) => (
                                    <div key={platform} className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{platform}</label>
                                        <input
                                            type="url"
                                            value={(socialLinks as any)[platform]}
                                            onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                                            placeholder={`https://${platform}.com/...`}
                                            className="w-full bg-[#121212] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-neutral-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div> {/* End of max-w-xl mx-auto (Centered Form Content) */}
                </div> {/* End of lg:col-span-8 (Left Column) */}

                {/* *** RIGHT COLUMN: CONTEXT / SUMMARY (4/12 WIDTH) *** - lg:col-span-4 sets the column width.
                  - Uses sticky positioning to stay next to the scrolling form.
                */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Plan Summary Card - Fixed width and placed on the right */}
                    <div className="sticky top-24">
                        <PageWidget 
                            title="Plan & Limitations" 
                            icon={Crown} 
                            iconColor="text-yellow-500"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <h3 className="font-medium text-sm text-white/90">{selectedPlan?.name} Plan</h3>
                                    <Link href="/dashboard" className="text-xs text-purple-400 hover:text-purple-300 font-medium">Upgrade</Link>
                                </div>

                                {/* Collaborator Slider */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-neutral-400">Max Team Size (Users)</span>
                                        <span className="text-white font-medium">{formData.max_collaborators} / {selectedPlan?.max_users}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max={selectedPlan?.max_users || 1}
                                        value={formData.max_collaborators}
                                        onChange={(e) => setFormData(prev => ({ ...prev, max_collaborators: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <p className="text-[10px] text-neutral-500 mt-1">
                                        You can invite up to {selectedPlan?.max_users} collaborators on this plan.
                                    </p>
                                </div>

                                {/* Feature List */}
                                <div className="bg-[#1A1A1A] rounded p-3 text-xs space-y-2 border border-white/5">
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        <span>Projects allowed: {selectedPlan?.max_projects}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        <span>Full Analytics Dashboard Access</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        <span>GitHub Integration</span>
                                    </div>
                                </div>
                                
                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !formData.name.trim()}
                                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors shadow-lg shadow-purple-900/20"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        "Create Project"
                                    )}
                                </button>
                                
                                <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
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