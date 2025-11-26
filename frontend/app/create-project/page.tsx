"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Github, Settings, Link2, Crown, Upload, X, Globe, CheckCircle2, LayoutTemplate } from "lucide-react";
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
    github: "",
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

  // --- Effects & Logic (Identical to previous, just cleaned up) ---

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
    
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      const { data: existingProjects } = await supabase.from("projects").select("id").eq("created_by", authUser.id);
      if (existingProjects && existingProjects.length >= selectedPlan.max_projects) {
        alert("Project limit reached.");
        return router.push('/dashboard');
      }

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
            "github-link": socialLinks.github,
            "discord-link": socialLinks.discord,
            "project-icon": null,
            "twitter-link": socialLinks.twitter,
            "website-link": socialLinks.website,
            "youtube-link": socialLinks.youtube,
            "facebook-link": socialLinks.facebook,
            "linkedin-link": socialLinks.linkedin,
            "instagram-link": socialLinks.instagram,
            "project-banner": null
          },
          settings: {}
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      let logoUrl = null, bannerUrl = null;
      if (projectMedia.logoFile) {
        setUploadingLogo(true);
        logoUrl = await uploadProjectImage(projectMedia.logoFile, project.id, 'logo');
      }
      if (projectMedia.bannerFile) {
        setUploadingBanner(true);
        bannerUrl = await uploadProjectImage(projectMedia.bannerFile, project.id, 'banner');
      }

      if (logoUrl || bannerUrl) {
        await supabase.from("projects").update({
          metadata: {
             // Re-spread existing metadata logic here, focusing on the updates
            "github-link": socialLinks.github,
            "discord-link": socialLinks.discord,
            "project-icon": logoUrl,
            "twitter-link": socialLinks.twitter,
            "website-link": socialLinks.website,
            "youtube-link": socialLinks.youtube,
            "facebook-link": socialLinks.facebook,
            "linkedin-link": socialLinks.linkedin,
            "instagram-link": socialLinks.instagram,
            "project-banner": bannerUrl
          }
        }).eq("id", project.id);
      }

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
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-neutral-600 border-t-white rounded-full"></div></div>;
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
                <button onClick={() => router.back()} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">Cancel</button>
                <Link href="/dashboard/subscriptions" className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium">View Plans</Link>
            </div>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
        {/* Top Navigation Bar */}
        <nav className="border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <span className="font-medium text-sm">Create Project</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                        {selectedPlan?.name} Plan Active
                    </span>
                </div>
            </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-10">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Left Column: Form Inputs */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* Section 1: Project Identity (Visuals) */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
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
                                        <Upload size={20} />
                                        <span className="text-xs font-medium">Upload Banner Image</span>
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
                                            <Upload size={18} />
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
                        <div className="flex items-center gap-2 mb-6">
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
                         <div className="flex items-center gap-2 mb-6">
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
                                        placeholder="https://github.com/org/repo"
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
                </div>

                {/* Right Column: Context / Summary */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Plan Summary Card */}
                    <div className="bg-[#121212] border border-white/10 rounded-lg p-5 sticky top-24">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                            <h3 className="font-medium text-sm">Plan Usage</h3>
                            <Link href="/dashboard/subscriptions" className="text-xs text-purple-400 hover:text-purple-300 font-medium">Upgrade</Link>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-neutral-400">Team Size</span>
                                    <span className="text-white">{formData.max_collaborators} / {selectedPlan?.max_users}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max={selectedPlan?.max_users || 1}
                                    value={formData.max_collaborators}
                                    onChange={(e) => setFormData(prev => ({ ...prev, max_collaborators: parseInt(e.target.value) }))}
                                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            <div className="bg-[#1A1A1A] rounded p-3 text-xs space-y-2">
                                <div className="flex items-center gap-2 text-neutral-300">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <span>Projects allowed: {selectedPlan?.max_projects}</span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-300">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <span>Analytics Dashboard</span>
                                </div>
                            </div>

                            <button
                                onClick={(e) => handleSubmit(e)}
                                disabled={loading || !formData.name}
                                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors shadow-lg shadow-purple-900/20"
                            >
                                {loading ? "Creating..." : "Create Project"}
                            </button>
                            
                            <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                                By creating a project, you agree to our Terms of Service. Admins have full access to project settings.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    </div>
  );
}