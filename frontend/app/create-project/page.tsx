"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Github, Users, Settings, Link2, Crown, Upload, X } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

const supabase = createClient();

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

  useEffect(() => {
    fetchUserAndPlans();
  }, []);

  const fetchUserAndPlans = async () => {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      // Fetch user with plan info
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, name, surname, plan_id, active")
        .eq("id", authUser.id)
        .single();

      if (userError) throw userError;

      if (!userData.active) {
        alert("Your account is not active. Please contact support.");
        return;
      }

      // Fetch all available plans
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select("id, name, monthly_price, features");

      if (plansError) throw plansError;

      const parsedPlans: Plan[] = (plansData || []).map(plan => {
        let features: any = {};
        if (typeof plan.features === "string") {
          try {
            features = JSON.parse(plan.features);
          } catch {
            features = {};
          }
        } else {
          features = plan.features || {};
        }

        const projectManagement = features.features?.project_management || {};
        const collaboration = features.features?.collaboration || {};

        return {
          id: plan.id,
          name: plan.name,
          monthly_price: plan.monthly_price,
          max_projects: projectManagement.max_projects || 1,
          max_users: typeof collaboration.max_users === 'number' ? collaboration.max_users : 1,
        };
      });

      setPlans(parsedPlans);

      // Set user's current plan
      if (userData.plan_id) {
        const userPlan = parsedPlans.find(plan => plan.id === userData.plan_id);
        setSelectedPlan(userPlan || null);
        
        // Set user with plan info
        setUser({
          ...userData,
          plan: userPlan || undefined
        });
      } else {
        setUser(userData);
      }

    } catch (error) {
      console.error("Error fetching user and plans:", error);
      alert("Error loading your account information.");
    } finally {
      setUserLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo must be smaller than 5MB');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setProjectMedia(prev => ({ 
        ...prev, 
        logoFile: file,
        logoPreview: previewUrl
      }));

    } catch (error) {
      console.error('Error handling logo:', error);
      alert('Error processing logo. Please try again.');
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Banner must be smaller than 10MB');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setProjectMedia(prev => ({ 
        ...prev, 
        bannerFile: file,
        bannerPreview: previewUrl
      }));

    } catch (error) {
      console.error('Error handling banner:', error);
      alert('Error processing banner. Please try again.');
    } finally {
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const removeLogo = () => {
    if (projectMedia.logoPreview) {
      URL.revokeObjectURL(projectMedia.logoPreview);
    }
    setProjectMedia(prev => ({ 
      ...prev, 
      logoFile: null,
      logoPreview: null 
    }));
  };

  const removeBanner = () => {
    if (projectMedia.bannerPreview) {
      URL.revokeObjectURL(projectMedia.bannerPreview);
    }
    setProjectMedia(prev => ({ 
      ...prev, 
      bannerFile: null,
      bannerPreview: null 
    }));
  };

  const uploadProjectImage = async (file: File, projectId: string, type: 'logo' | 'banner') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `projects/${projectId}/${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('projects-metadata')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('projects-metadata')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has a plan
    if (!user?.plan_id || !selectedPlan) {
      alert("You need an active plan to create projects. Please subscribe to a plan first.");
      router.push('/dashboard/subscriptions');
      return;
    }

    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      // Check if user has reached project limit for their plan
      const { data: existingProjects, error: countError } = await supabase
        .from("projects")
        .select("id")
        .eq("created_by", authUser.id);

      if (countError) throw countError;

      if (existingProjects && existingProjects.length >= selectedPlan.max_projects) {
        alert(`You have reached the maximum number of projects (${selectedPlan.max_projects}) for your ${selectedPlan.name} plan. Please upgrade to create more projects.`);
        router.push('/dashboard/subscriptions');
        return;
      }

      // STEP 1: Create project first (without images)
const { data: project, error: projectError } = await supabase
  .from("projects")
  .insert([
    {
      name: formData.name,
      description: formData.description,
      website_url: formData.website_url, // ← ADD THIS
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
    }
  ])
  .select()
  .single();

      if (projectError) throw projectError;

      let logoUrl = null;
      let bannerUrl = null;

      // STEP 2: Upload images to project-specific folders
      if (projectMedia.logoFile) {
        setUploadingLogo(true);
        logoUrl = await uploadProjectImage(projectMedia.logoFile, project.id, 'logo');
      }

      if (projectMedia.bannerFile) {
        setUploadingBanner(true);
        bannerUrl = await uploadProjectImage(projectMedia.bannerFile, project.id, 'banner');
      }

      // STEP 3: Update project with image URLs
      if (logoUrl || bannerUrl) {
        const { error: updateError } = await supabase
          .from("projects")
          .update({
            metadata: {
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
          })
          .eq("id", project.id);

        if (updateError) throw updateError;
      }

      // Add creator as project user with admin role
      const { error: userError } = await supabase
        .from("project_users")
        .insert([
          {
            project_id: project.id,
            user_id: authUser.id,
            role_info: { role: "admin", permissions: ["all"] }
          }
        ]);

      if (userError) throw userError;

      // Clean up preview URLs
      if (projectMedia.logoPreview) URL.revokeObjectURL(projectMedia.logoPreview);
      if (projectMedia.bannerPreview) URL.revokeObjectURL(projectMedia.bannerPreview);

      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
      setUploadingLogo(false);
      setUploadingBanner(false);
    }
  };

  // Show loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show plan requirement message if user has no plan
  if (!user?.plan_id) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          <div className="absolute inset-0 opacity-1 backdrop-blur-[0.5px]"></div>
          <div className="absolute inset-0 opacity-1 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 opacity-1 backdrop-blur-[8px]"></div>
        </div>

        <main className="pt-16 min-h-screen z-10 bg-[#0a0a0a]">
          <div className="max-w-2xl mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h1 className="text-2xl font-bold text-white">Create New Project</h1>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-4">Plan Required</h2>
              <p className="text-white/70 mb-6">
                You need an active subscription plan to create projects. Choose a plan that fits your needs to get started.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/dashboard/subscriptions"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  View Plans
                </Link>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Simplified blur overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <div className="absolute inset-0 opacity-1 backdrop-blur-[0.5px]"></div>
        <div className="absolute inset-0 opacity-1 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 opacity-1 backdrop-blur-[8px]"></div>
      </div>

      {/* Main Content */}
      <main className="pt-16 min-h-screen z-10 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-2xl font-bold text-white">Create New Project</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Plan Info Banner */}
                {selectedPlan && (
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-semibold">
                          {selectedPlan.name} Plan
                        </p>
                        <p className="text-white/70 text-sm">
                          {selectedPlan.max_projects} projects • {selectedPlan.max_users} collaborators
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Media */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Project Media</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-3">
                        Project Logo
                      </label>
                      <div className="space-y-3">
                        {projectMedia.logoPreview ? (
                          <div className="relative">
                            {/* Use regular img tag for local previews */}
                            <img
                              src={projectMedia.logoPreview}
                              alt="Project logo preview"
                              width={120}
                              height={120}
                              className="rounded-lg object-cover border border-white/10"
                            />
                            <button
                              type="button"
                              onClick={removeLogo}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 transition-colors"
                            onClick={() => logoInputRef.current?.click()}
                          >
                            <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                            <p className="text-white/60 text-sm">Click to upload logo</p>
                            <p className="text-white/40 text-xs mt-1">PNG, JPG • Max 5MB</p>
                          </div>
                        )}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        {uploadingLogo && (
                          <p className="text-purple-400 text-sm">Uploading logo...</p>
                        )}
                      </div>
                    </div>

                    {/* Banner Upload */}
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-3">
                        Project Banner
                      </label>
                      <div className="space-y-3">
                        {projectMedia.bannerPreview ? (
                          <div className="relative">
                            {/* Use regular img tag for local previews */}
                            <img
                              src={projectMedia.bannerPreview}
                              alt="Project banner preview"
                              width={200}
                              height={100}
                              className="rounded-lg object-cover border border-white/10 w-full h-24"
                            />
                            <button
                              type="button"
                              onClick={removeBanner}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 transition-colors"
                            onClick={() => bannerInputRef.current?.click()}
                          >
                            <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                            <p className="text-white/60 text-sm">Click to upload banner</p>
                            <p className="text-white/40 text-xs mt-1">PNG, JPG • Max 10MB</p>
                          </div>
                        )}
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                        {uploadingBanner && (
                          <p className="text-purple-400 text-sm">Uploading banner...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest of the form remains the same */}
                {/* Project Basics */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings size={20} />
                    Project Basics
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Enter project name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        placeholder="Describe your project..."
                      />
                    </div>
                  </div>
                </div>

                {/* GitHub Integration */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Github size={20} />
                    GitHub Integration
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      name="github_repo_url"
                      value={formData.github_repo_url}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="https://github.com/username/repository"
                    />
                  </div>
                </div>

                {/* Team Settings */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users size={20} />
                    Team Settings
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Maximum Collaborators
                    </label>
                    <input
                      type="number"
                      name="max_collaborators"
                      value={formData.max_collaborators}
                      onChange={handleInputChange}
                      min="1"
                      max={selectedPlan?.max_users || 1}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-sm text-white/60 mt-2">
                      Your {selectedPlan?.name} plan supports up to {selectedPlan?.max_users} collaborators
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Link2 size={20} />
                    Social Links
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(socialLinks).map(([platform, value]) => (
                      <div key={platform}>
                        <label className="block text-sm font-medium text-white/80 mb-2 capitalize">
                          {platform}
                        </label>
                        <input
                          type="url"
                          value={value}
                          onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                          placeholder={`https://${platform}.com/your-profile`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  {loading ? "Creating Project..." : "Create Project"}
                </button>
              </form>
            </div>

            {/* Plan Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-white mb-4">Your Plan</h3>
                
                {selectedPlan && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold text-white">{selectedPlan.name}</h4>
                      <p className="text-2xl font-bold text-white mt-2">
                        €{selectedPlan.monthly_price}
                        <span className="text-sm text-white/60 font-normal">/month</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Max Projects</span>
                        <span className="text-white font-semibold">{selectedPlan.max_projects}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Max Collaborators</span>
                        <span className="text-white font-semibold">{selectedPlan.max_users}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <Link
                        href="/dashboard/subscriptions"
                        className="block w-full py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-center transition-colors"
                      >
                        Upgrade Plan
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}