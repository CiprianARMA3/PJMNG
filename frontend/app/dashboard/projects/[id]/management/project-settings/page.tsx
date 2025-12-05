'use client';

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import React from "react";
import Menu from "../../components/menu";
import {
    ArrowLeft,
    Save,
    Trash2,
    Globe,
    Key,
    Settings,
    LayoutGrid,
    Upload,
    AlertTriangle,
    Copy,
    Check,
    Users,
    Link as LinkIcon,
    User as UserIcon,
    Image as ImageIcon,
    Shield,
    ExternalLink,
    Loader2,
    Eye,
    EyeOff,
    X,
    Github,
    Cpu,
    Code,
    Map,
    Database,
    Zap,
    Calendar,
    Clock,
} from "lucide-react";

// --- TYPES ---
interface LinkData {
    [key: string]: string;
}

interface ProjectData {
    id: string;
    name: string;
    description: string;
    created_by: string;
    max_collaborators: number;
    github_repo_url?: string;
    github_personalaccesstoken?: string;
    metadata: {
        "project-icon"?: string;
        "project-banner"?: string;
        [key: string]: any;
    };
}

// --- MAIN COMPONENT ---
export default function ProjectSettingsPage() {
    const supabase = createClient();
    const router = useRouter();
    const params = useParams();
    const projectId = (Array.isArray(params.id) ? params.id[0] : params.id) || "";
    
    // Refs
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [project, setProject] = useState<ProjectData | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isCreator, setIsCreator] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [maxCollaborators, setMaxCollaborators] = useState<number>(0);
    const [links, setLinks] = useState<LinkData>({});

    // GitHub Specific State
    const [githubToken, setGithubToken] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [showToken, setShowToken] = useState(false);
    const [githubUrlError, setGithubUrlError] = useState("");

    // Media
    const [projectIcon, setProjectIcon] = useState("");
    const [projectBanner, setProjectBanner] = useState("");
    const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
    const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Danger zone
    const [newOwner, setNewOwner] = useState("");
    const [confirmOwnerId, setConfirmOwnerId] = useState("");
    const [transferring, setTransferring] = useState(false);
    const [transferError, setTransferError] = useState("");

    // UI
    const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'links' | 'github' | 'danger'>('general');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Effects
    useEffect(() => {
        loadProjectData();
    }, [projectId]);

    const loadProjectData = async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            
            // Get user
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push("/auth/login");
                return;
            }

            // Get project
            const { data: projectData } = await supabase
                .from("projects")
                .select("*")
                .eq("id", projectId)
                .single();

            if (!projectData) {
                router.push("/dashboard");
                return;
            }

            // Check permissions
            const isCreatorCheck = projectData.created_by === authUser.id;
            setIsCreator(isCreatorCheck);
            
            const { data: collaborator } = await supabase
                .from("project_users")
                .select("user_id, role")
                .eq("project_id", projectId)
                .eq("user_id", authUser.id)
                .maybeSingle();

            if (!isCreatorCheck && !collaborator) {
                router.push("/dashboard");
                return;
            }

            // Check if read-only (collaborator but not admin)
            const isReadOnlyCheck = !isCreatorCheck && collaborator?.role !== 'admin';
            setIsReadOnly(isReadOnlyCheck);

            // Set state
            setUser(authUser);
            setProject(projectData);
            setName(projectData.name);
            setDescription(projectData.description || "");
            setMaxCollaborators(projectData.max_collaborators);
            setProjectIcon(projectData.metadata?.["project-icon"] || "");
            setProjectBanner(projectData.metadata?.["project-banner"] || "");
            setLogoPreview(projectData.metadata?.["project-icon"] || null);
            setBannerPreview(projectData.metadata?.["project-banner"] || null);

            // GitHub data
            setGithubToken(projectData.github_personalaccesstoken || "");
            setGithubUrl(projectData.github_repo_url || "");

            // Parse generic links
            const filteredLinks: LinkData = {};
            for (const [key, value] of Object.entries(projectData.metadata || {})) {
                if (key.endsWith("-link") && typeof value === 'string') {
                    filteredLinks[key] = value;
                }
            }
            setLinks(filteredLinks);

        } catch (error) {
            console.error("Error loading project:", error);
            alert("Failed to load project data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isReadOnly) return;
        
        // Validation for GitHub URL
        if (githubUrl && !githubUrl.includes("github.com")) {
            setGithubUrlError("URL must be a valid GitHub repository link");
            setActiveTab('github'); 
            return;
        }
        setGithubUrlError("");

        setSaving(true);
        
        try {
            let finalIconUrl = projectIcon;
            let finalBannerUrl = projectBanner;

            // Upload logo
            if (newLogoFile) {
                setUploadingLogo(true);
                finalIconUrl = await uploadImage(newLogoFile, 'logo');
                setUploadingLogo(false);
            }

            // Upload banner
            if (newBannerFile) {
                setUploadingBanner(true);
                finalBannerUrl = await uploadImage(newBannerFile, 'banner');
                setUploadingBanner(false);
            }

            // Update project
            const { error } = await supabase
                .from("projects")
                .update({
                    name,
                    description,
                    max_collaborators: maxCollaborators,
                    github_repo_url: githubUrl,
                    github_personalaccesstoken: githubToken,
                    metadata: {
                        ...project?.metadata,
                        "project-icon": finalIconUrl,
                        "project-banner": finalBannerUrl,
                        ...links,
                    },
                })
                .eq("id", projectId);

            if (error) throw error;

            // Update state
            setNewLogoFile(null);
            setNewBannerFile(null);
            setProjectIcon(finalIconUrl);
            setProjectBanner(finalBannerUrl);

            alert("Project updated successfully!");
            router.refresh();

        } catch (error) {
            console.error("Error saving project:", error);
            alert("Failed to save project changes");
        } finally {
            setSaving(false);
        }
    };

    const uploadImage = async (file: File, type: 'logo' | 'banner'): Promise<string> => {
        const BUCKET_NAME = 'projects-metadata';
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${projectId}_${Date.now()}.${fileExt}`;
        const filePath = `projects/${projectId}/${fileName}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, { upsert: true });

        if (error) throw error;

        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('Logo must be less than 5MB'); return; }
        setNewLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('Banner must be less than 10MB'); return; }
        setNewBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const clearLogo = () => {
        if (isReadOnly) return;
        setNewLogoFile(null);
        setLogoPreview(null);
        setProjectIcon("");
    };

    const clearBanner = () => {
        if (isReadOnly) return;
        setNewBannerFile(null);
        setBannerPreview(null);
        setProjectBanner("");
    };

    const handleDeleteProject = async () => {
        if (!confirm("Are you sure? This will permanently delete the project and all associated data. This action cannot be undone.")) {
            return;
        }

        try {
            const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", projectId);

            if (error) throw error;

            alert("Project deleted successfully");
            router.push("/dashboard");
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete project");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
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

    if (!project) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-zinc-100 mb-2">Project Not Found</h2>
                    <p className="text-zinc-400 mb-6">The requested project could not be loaded.</p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-100 hover:text-white rounded-md transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0a0a0a] text-zinc-100 flex overflow-hidden font-sans selection:bg-white/20">
            {/* SIDEBAR */}
            <Menu project={project} user={user} />

            <main className="flex-1 flex flex-col h-full ml-64 relative bg-[#0a0a0a]">
                {/* HEADER */}
                <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight">Project's Settings <span className="text-white/30 text-lg font-light">Panel</span></h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {isReadOnly && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                Read Only
                            </span>
                        )}
                        <Link
                            href={`/dashboard/projects/${projectId}`}
                            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Back to Project
                        </Link>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-scroll custom-scrollbar-hidden">
                    <div className="w-full px-6 py-10">
                        <div className="flex flex-col lg:flex-row min-h-[600px]">
                            {/* LEFT NAV */}
                            <nav className="w-full lg:w-72 flex-shrink-0 space-y-1 lg:border-r border-white/5 lg:pr-8 mb-10 lg:mb-0">
                                <div className="pb-4 mb-4 border-b border-white/5 lg:border-none">
                                    <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Project Settings</p>
                                </div>
                                
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                        ${activeTab === 'general' 
                                            ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' 
                                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                        }`}
                                >
                                    <Settings size={16} />
                                    General
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('branding')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                        ${activeTab === 'branding' 
                                            ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' 
                                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                        }`}
                                >
                                    <LayoutGrid size={16} />
                                    Branding
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('links')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                        ${activeTab === 'links' 
                                            ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' 
                                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                        }`}
                                >
                                    <LinkIcon size={16} />
                                    Links
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('github')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                        ${activeTab === 'github' 
                                            ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' 
                                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                        }`}
                                >
                                    <Github size={16} />
                                    GitHub
                                </button>
                                
                                {isCreator && (
                                    <button
                                        onClick={() => setActiveTab('danger')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                                            ${activeTab === 'danger' 
                                                ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' 
                                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                            }`}
                                    >
                                        <Shield size={16} />
                                        Advanced
                                    </button>
                                )}
                            </nav>

                            {/* RIGHT CONTENT */}
                            <div className="flex-1 lg:pl-12">
                                <div className="max-w-4xl mx-auto space-y-10">
                                    {/* GENERAL TAB */}
                                    {activeTab === 'general' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                            <div>
                                                <h2 className="text-lg font-semibold text-white">General Settings</h2>
                                                <p className="text-sm text-zinc-500 mt-1">Basic project information and identification.</p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                {/* Project Name */}
                                                <div className="group">
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Project Name</label>
                                                    <div className="flex items-center bg-[#0e0e10] border border-white/10 rounded-lg px-3 py-2.5 group-hover:border-white/20 transition-colors">
                                                        <UserIcon size={16} className="text-zinc-500 mr-2 flex-shrink-0" />
                                                        <input 
                                                            type="text" 
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="w-full bg-transparent text-sm text-zinc-300 disabled:cursor-not-allowed focus:outline-none"
                                                            placeholder="Enter project name"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div className="group">
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Project Description</label>
                                                    <div className="bg-[#0e0e10] border border-white/10 rounded-lg px-3 py-2.5 group-hover:border-white/20 transition-colors">
                                                        <textarea 
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="w-full h-32 bg-transparent text-sm text-zinc-300 disabled:cursor-not-allowed focus:outline-none resize-none"
                                                            placeholder="Brief overview of your project's purpose and scope"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Max Collaborators */}
                                                <div className="group">
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Maximum Collaborators</label>
                                                    <div className="flex items-center bg-[#0e0e10] border border-white/10 rounded-lg px-3 py-2.5 group-hover:border-white/20 transition-colors">
                                                        <Users size={16} className="text-zinc-500 mr-2 flex-shrink-0" />
                                                        <input 
                                                            type="number" 
                                                            value={maxCollaborators}
                                                            onChange={(e) => setMaxCollaborators(Math.max(0, Number(e.target.value)))}
                                                            disabled={isReadOnly}
                                                            className="w-full bg-transparent text-sm text-zinc-300 disabled:cursor-not-allowed focus:outline-none"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Project ID */}
                                                <div className="group">
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Project UUID</label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 flex items-center bg-[#0e0e10] border border-white/10 rounded-lg px-3 py-2.5 font-mono text-xs text-zinc-500 select-all group-hover:border-white/20 transition-colors">
                                                            {projectId}
                                                        </div>
                                                        <button 
                                                            onClick={() => copyToClipboard(projectId)}
                                                            className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
                                                        >
                                                            {copiedId === projectId ? <Check size={16} /> : <Copy size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

{/* BRANDING TAB */}
{activeTab === 'branding' && (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div>
            <h2 className="text-lg font-semibold text-white">Branding</h2>
            <p className="text-sm text-zinc-500 mt-1">Upload and manage your project's visual assets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
{/* Logo Upload */}
<div className="space-y-4">
    <div className="flex justify-between items-center">
        <div>
            <h3 className="text-sm font-semibold text-white">Project Logo</h3>
            <p className="text-xs text-zinc-500">Displayed in project cards and headers</p>
        </div>
        <span className="text-xs text-zinc-500 px-2 py-1 bg-white/5 border border-white/10 rounded">
            5MB max • 1:1
        </span>
    </div>
    
    <div
        onClick={() => !isReadOnly && logoInputRef.current?.click()}
        className={`
            relative group cursor-pointer overflow-hidden rounded-full border border-dashed 
            ${logoPreview ? 'border-white/10' : 'border-white/10 hover:border-zinc-400'}
            transition-all duration-200 bg-[#0e0e10]
            ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}
            aspect-square w-48 h-48 mx-auto
        `}
    >
        {uploadingLogo ? (
            <div className="flex flex-col items-center justify-center p-4 w-full h-full">
                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin mb-2" />
                <p className="text-xs text-zinc-500">Uploading...</p>
            </div>
        ) : logoPreview ? (
            <>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-zinc-900 rounded-md border border-white/10">
                            <Upload className="w-3 h-3 text-zinc-100" />
                        </div>
                        {!isReadOnly && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearLogo();
                                }}
                                className="p-2 bg-red-500/80 rounded-md hover:bg-red-500 text-white"
                            >
                                <X className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </div>
                <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-cover rounded-full"
                />
            </>
        ) : (
            <div className="flex flex-col items-center justify-center p-4 w-full h-full">
                <div className="p-2 rounded-full bg-zinc-900 border border-white/10 mb-2">
                    <ImageIcon className="w-4 h-4 text-zinc-500" />
                </div>
                <p className="text-xs font-medium text-zinc-300">Click to upload</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">or drag and drop</p>
            </div>
        )}
    </div>
    <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
        disabled={isReadOnly}
    />
</div>

            {/* Banner Upload */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Project Banner</h3>
                        <p className="text-xs text-zinc-500">Displayed on your project's main page</p>
                    </div>
                    <span className="text-xs text-zinc-500 px-2 py-1 bg-white/5 border border-white/10 rounded">
                        10MB max • 3:1
                    </span>
                </div>
                
                <div
                    onClick={() => !isReadOnly && bannerInputRef.current?.click()}
                    className={`
                        relative group cursor-pointer overflow-hidden rounded-lg border border-dashed 
                        ${bannerPreview ? 'border-white/10' : 'border-white/10 hover:border-zinc-400'}
                        transition-all duration-200 bg-[#0e0e10]
                        ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}
                        aspect-[3/1] w-full
                    `}
                >
                    {uploadingBanner ? (
                        <div className="flex flex-col items-center justify-center p-10 w-full h-full">
                            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin mb-3" />
                            <p className="text-sm text-zinc-500">Uploading...</p>
                        </div>
                    ) : bannerPreview ? (
                        <>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-zinc-900 rounded-md border border-white/10">
                                        <Upload className="w-4 h-4 text-zinc-100" />
                                    </div>
                                    {!isReadOnly && (
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearBanner();
                                            }}
                                            className="p-2 bg-red-500/80 rounded-md hover:bg-red-500 text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <img
                                src={bannerPreview}
                                alt="Banner Preview"
                                className="w-full h-full object-cover"
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-10 w-full h-full">
                            <div className="p-3 rounded-full bg-zinc-900 border border-white/10 mb-3">
                                <ImageIcon className="w-6 h-6 text-zinc-500" />
                            </div>
                            <p className="text-sm font-medium text-zinc-300">Click to upload</p>
                            <p className="text-xs text-zinc-500 mt-1">or drag and drop</p>
                        </div>
                    )}
                </div>
                <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    disabled={isReadOnly}
                />
            </div>
        </div>
    </div>
)}

                                    {/* LINKS TAB */}
                                    {activeTab === 'links' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                            <div>
                                                <h2 className="text-lg font-semibold text-white">External Links</h2>
                                                <p className="text-sm text-zinc-500 mt-1">Connect your project with external resources.</p>
                                            </div>

                                            <div className="space-y-4">
                                                {Object.entries(links).length > 0 ? (
                                                    Object.entries(links).map(([key, value]) => (
                                                        <div key={key} className="group">
                                                            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">
                                                                {key.replace('-link', '').replace(/_/g, ' ').toUpperCase()}
                                                            </label>
                                                            <div className="flex items-center bg-[#0e0e10] border border-white/10 rounded-lg px-3 py-2.5 group-hover:border-white/20 transition-colors">
                                                                <ExternalLink size={16} className="text-zinc-500 mr-2 flex-shrink-0" />
                                                                <input 
                                                                    type="text" 
                                                                    value={value}
                                                                    onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                                                                    disabled={isReadOnly}
                                                                    className="w-full bg-transparent text-sm text-zinc-300 disabled:cursor-not-allowed focus:outline-none"
                                                                    placeholder="https://"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-lg bg-[#0e0e10]">
                                                        <Globe className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                                                        <p className="text-zinc-400">No external links configured</p>
                                                        <p className="text-sm text-zinc-500 mt-2">
                                                            Add links to your documentation or website
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* GITHUB TAB */}
                                    {activeTab === 'github' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                            <div>
                                                <h2 className="text-lg font-semibold text-white">GitHub Integration</h2>
                                                <p className="text-sm text-zinc-500 mt-1">Configure repository access and automation tokens.</p>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Repository URL */}
                                                <div className="group">
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Repository URL</label>
                                                    <div className="flex items-center bg-[#0e0e10] border border-white/10 rounded-lg px-3 py-2.5 group-hover:border-white/20 transition-colors">
                                                        <Github size={16} className="text-zinc-500 mr-2 flex-shrink-0" />
                                                        <input 
                                                            type="text" 
                                                            value={githubUrl}
                                                            onChange={(e) => {
                                                                setGithubUrl(e.target.value);
                                                                if (githubUrlError) setGithubUrlError("");
                                                            }}
                                                            disabled={isReadOnly}
                                                            className="w-full bg-transparent text-sm text-zinc-300 disabled:cursor-not-allowed focus:outline-none"
                                                            placeholder="https://github.com/username/repository"
                                                        />
                                                    </div>
                                                    {githubUrlError && (
                                                        <p className="text-xs text-red-400 mt-2">{githubUrlError}</p>
                                                    )}
                                                    <p className="text-xs text-zinc-500 mt-2">The public or private URL of your GitHub repository.</p>
                                                </div>

                                                {/* Personal Access Token */}
                                                <div className="group">
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">GitHub Personal Access Token</label>
                                                    <div className="flex items-center bg-[#0e0e10] border border-white/10 rounded-lg px-3 py-2.5 group-hover:border-white/20 transition-colors">
                                                        <Key size={16} className="text-zinc-500 mr-2 flex-shrink-0" />
                                                        <input 
                                                            type={showToken ? "text" : "password"}
                                                            value={githubToken}
                                                            onChange={(e) => setGithubToken(e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="w-full bg-transparent text-sm text-zinc-300 disabled:cursor-not-allowed focus:outline-none"
                                                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowToken(!showToken)}
                                                            className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                                                        >
                                                            {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-2">Token with repository scopes. It is stored securely.</p>
                                                </div>

                                                {!isReadOnly && (
                                                    <div className="p-4 bg-[rgba(88,166,255,0.1)] border border-[rgba(88,166,255,0.3)] rounded-lg">
                                                        <div className="flex items-start gap-3">
                                                            <Shield className="w-5 h-5 text-[#58a6ff] flex-shrink-0" />
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-[#58a6ff] mb-1">Security Note</h4>
                                                                <p className="text-xs text-zinc-300 leading-relaxed">
                                                                    Ensure your Personal Access Token (PAT) has the correct scopes. 
                                                                    Since this token allows access to your repository, treat it like a password.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* DANGER TAB */}
                                    {activeTab === 'danger' && isCreator && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                            <div>
                                                <h2 className="text-lg font-semibold text-white">Advanced Settings</h2>
                                                <p className="text-sm text-zinc-500 mt-1">Irreversible actions for project management.</p>
                                            </div>

                                            <div className="border border-red-500/20 rounded-lg bg-red-500/[0.03] overflow-hidden">
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <h4 className="font-semibold text-red-500 mb-1">Irreversible Action</h4>
                                                            <p className="text-sm text-zinc-300">
                                                                Once deleted, all project data, files, and configurations will be permanently removed.
                                                                This includes all team collaborations and associated metadata.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between p-4 bg-[#0e0e10] rounded-lg border border-white/5">
                                                        <div>
                                                            <h4 className="font-medium text-zinc-100 mb-1">Project: {project?.name}</h4>
                                                            <p className="text-xs text-zinc-500">ID: {projectId}</p>
                                                        </div>
                                                        
                                                        <button
                                                            onClick={handleDeleteProject}
                                                            className="flex-shrink-0 bg-transparent hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 hover:border-red-500 px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete Project
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SAVE BUTTON */}
                                    {!isReadOnly && (
                                        <div className="pt-10 mt-10 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-zinc-500">
                                                    {saving ? (
                                                        <span className="flex items-center gap-2 text-[#58a6ff]">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving changes...
                                                        </span>
                                                    ) : (
                                                        'Unsaved changes will be lost.'
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving || uploadingLogo || uploadingBanner}
                                                    className="flex-shrink-0 bg-white hover:bg-zinc-100 text-black px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={16} />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Updated global CSS to hide the scrollbar */}
            <style jsx global>{`
                .custom-scrollbar-hidden::-webkit-scrollbar {
                    width: 0 !important;
                    height: 0 !important;
                }
                .custom-scrollbar-hidden {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                body {
                    background: #0a0a0a;
                    overflow-y: auto;
                    overflow-x: hidden;
                }
            `}</style>
        </div>
    );
}