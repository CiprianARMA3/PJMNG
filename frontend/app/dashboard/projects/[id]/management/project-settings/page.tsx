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
    Plus,
    Eye,
    EyeOff,
    Download,
    X,
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
    metadata: {
        "project-icon"?: string;
        "project-banner"?: string;
        [key: string]: any;
    };
}

// --- REUSABLE COMPONENTS ---
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label: string;
    isTextArea?: boolean;
    helperText?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

const CustomInput: React.FC<CustomInputProps> = ({ 
    label, 
    isTextArea = false, 
    helperText, 
    error,
    leftIcon,
    ...props 
}) => {
    const InputComponent = isTextArea ? 'textarea' : 'input';
    
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80 tracking-wide">
                {label}
            </label>
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                        {leftIcon}
                    </div>
                )}
                <InputComponent
                    {...props}
                    className={`
                        w-full bg-white/2 border rounded-lg px-3 py-3 text-sm text-white 
                        placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 
                        transition-all font-sans
                        ${error ? 'border-red-500/50' : 'border-white/10'}
                        ${props.disabled ? 'bg-[#0a0a0a]/20 text-white/40 cursor-not-allowed' : ''}
                        ${leftIcon ? 'pl-10' : ''}
                        ${isTextArea ? 'h-32 resize-none' : ''}
                    `}
                />
            </div>
            {helperText && !error && (
                <p className="text-xs text-white/40 mt-1">{helperText}</p>
            )}
            {error && (
                <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
        </div>
    );
};

interface SettingsCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    children: React.ReactNode;
    variant?: 'default' | 'warning' | 'danger';
}

const SettingsCard: React.FC<SettingsCardProps> = ({
    title,
    description,
    icon: Icon,
    children,
    variant = 'default',
}) => {
    const variants = {
        default: {
            icon: 'text-white',
            border: 'border-white/5',
            bg: 'bg-[#0a0a0a]/20',
            header: 'border-white/10',
            iconBg: 'bg-white/5',
            iconColor: 'text-white/90',
        },
        warning: {
            icon: 'text-yellow-500',
            border: 'border-yellow-500/20',
            bg: 'bg-yellow-500/10',
            header: 'border-yellow-500/20',
            iconBg: 'bg-yellow-500/20',
            iconColor: 'text-yellow-500',
        },
        danger: {
            icon: 'text-red-500',
            border: 'border-red-500/20',
            bg: 'bg-red-500/10',
            header: 'border-red-500/20',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-500',
        },
    };

    const currentVariant = variants[variant];

    return (
        <div className={`
            p-6 rounded-lg border ${currentVariant.border} ${currentVariant.bg}
            space-y-5 backdrop-blur-sm
        `}>
            <div className={`flex items-center gap-3 pb-3 mb-2 border-b ${currentVariant.header}`}>
                <div className={`p-2 rounded-lg ${currentVariant.iconBg}`}>
                    <Icon size={18} className={currentVariant.iconColor} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="text-sm text-white/60 mt-1">{description}</p>
                </div>
            </div>
            <div className="pt-2 space-y-6">
                {children}
            </div>
        </div>
    );
};

interface UploadAreaProps {
    title: string;
    description: string;
    preview?: string | null;
    uploading: boolean;
    onUpload: () => void;
    onClear?: () => void;
    accept?: string;
    maxSize: string;
    aspectRatio: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({
    title,
    description,
    preview,
    uploading,
    onUpload,
    onClear,
    accept = "image/*",
    maxSize,
    aspectRatio,
}) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-sm font-medium text-white/90">{title}</h3>
                <p className="text-xs text-white/60">{description}</p>
            </div>
            <span className="text-xs text-white/40 px-2 py-1 bg-[#0a0a0a]/30 rounded">
                {maxSize} • {aspectRatio}
            </span>
        </div>
        
        <div
            onClick={onUpload}
            className={`
                relative group cursor-pointer overflow-hidden rounded-lg border border-dashed 
                ${preview ? 'border-white/20' : 'border-white/10 hover:border-white/30'}
                transition-all duration-200 bg-[#0a0a0a]/30
            `}
        >
            {uploading ? (
                <div className="flex flex-col items-center justify-center p-10">
                    <Loader2 className="w-8 h-8 text-white/60 animate-spin mb-3" />
                    <p className="text-sm text-white/60">Uploading...</p>
                </div>
            ) : preview ? (
                <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <div className="p-3 bg-[#0a0a0a]/60 rounded-full backdrop-blur-sm">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            {onClear && (
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClear();
                                    }}
                                    className="p-3 bg-red-500/60 rounded-full backdrop-blur-sm hover:bg-red-500/80"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center p-10">
                    <div className="p-3 rounded-lg bg-white/5 mb-3">
                        <ImageIcon className="w-6 h-6 text-white/60" />
                    </div>
                    <p className="text-sm font-medium text-white/70">Click to upload</p>
                    <p className="text-xs text-white/40 mt-1">or drag and drop</p>
                </div>
            )}
        </div>
    </div>
);

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
    const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'links' | 'danger'>('general');
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

            // Parse links
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

            // Show success
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
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Logo must be less than 5MB');
            return;
        }

        setNewLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            alert('Banner must be less than 10MB');
            return;
        }

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

const handleTransferOwnership = async () => {
    // Clear any previous errors
    setTransferError("");
    
    // Validation
    if (!newOwner || !confirmOwnerId) {
        setTransferError("Both fields are required");
        return;
    }

    if (newOwner !== confirmOwnerId) {
        setTransferError("User IDs do not match");
        return;
    }

    if (newOwner === user?.id) {
        setTransferError("Cannot transfer ownership to yourself");
        return;
    }

    if (!confirm("⚠️ Are you sure you want to transfer ownership?\n\nThis action cannot be undone. The new owner will have full control over this project, and you will become a regular collaborator.")) {
        return;
    }

    setTransferring(true);

    try {
        console.log("Checking if user exists:", newOwner);
        
        // First, verify the new owner exists in the users table
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, name, surname")
            .eq("id", newOwner)
            .single();

        console.log("User check result:", { userData, userError });

        if (userError) {
            console.error("User check error:", userError);
            if (userError.code === 'PGRST116') { // No rows returned
                setTransferError("User not found. Please enter a valid user ID.");
            } else {
                setTransferError(`Error checking user: ${userError.message}`);
            }
            setTransferring(false);
            return;
        }

        if (!userData) {
            setTransferError("User not found. Please enter a valid user ID.");
            setTransferring(false);
            return;
        }

        // Get the user's full name for the confirmation message
        const newOwnerName = `${userData.name || ''} ${userData.surname || ''}`.trim() || "Unknown User";
        
        // Final confirmation with the user's name
        if (!confirm(`⚠️ Final Confirmation\n\nTransfer ownership to:\n${newOwnerName} (${newOwner})\n\nThis action is irreversible. Do you want to proceed?`)) {
            setTransferring(false);
            return;
        }

        console.log("Attempting ownership transfer:", {
            projectId,
            newOwner,
            currentOwner: user?.id
        });

        // Perform the ownership transfer
        const { error: updateError } = await supabase
            .from("projects")
            .update({ 
                created_by: newOwner,
                updated_at: new Date().toISOString()
            })
            .eq("id", projectId)
            .eq("created_by", user?.id); // Ensure current user is still the owner

        console.log("Update result:", { updateError });

        if (updateError) {
            console.error("Database update error details:", {
                message: updateError.message,
                code: updateError.code,
                details: updateError.details,
                hint: updateError.hint
            });
            
            // Provide specific error messages
            let errorMessage = "Failed to transfer ownership.";
            
            if (updateError.code === '42501') {
                errorMessage = "Permission denied. You don't have rights to transfer ownership.";
            } else if (updateError.code === '23503') {
                errorMessage = "Foreign key constraint error. The user might not exist.";
            } else if (updateError.code === 'PGRST116') {
                errorMessage = "Project not found or you are no longer the owner.";
            } else if (updateError.message) {
                errorMessage = `Database error: ${updateError.message}`;
            }
            
            setTransferError(errorMessage);
            setTransferring(false);
            return;
        }

        // Check if the update actually happened by fetching the project
        const { data: updatedProject } = await supabase
            .from("projects")
            .select("created_by")
            .eq("id", projectId)
            .single();

        console.log("Verification check:", updatedProject);

        if (updatedProject?.created_by === newOwner) {
            // Success - show alert and redirect
            alert(`✅ Ownership successfully transferred to ${newOwnerName}!`);
            router.push("/dashboard");
            router.refresh();
        } else {
            setTransferError("Transfer failed. Please try again or contact support.");
            setTransferring(false);
        }

    } catch (error) {
        console.error("Transfer catch block error:", error);
        
        // Handle different error types
        let errorMessage = "An unexpected error occurred. Please try again.";
        
        if (error instanceof Error) {
            errorMessage = `Error: ${error.message}`;
        } else if (typeof error === 'object' && error !== null) {
            // Try to extract message from object
            const errorObj = error as any;
            if (errorObj.message) {
                errorMessage = errorObj.message;
            } else {
                errorMessage = JSON.stringify(error);
            }
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        setTransferError(errorMessage);
        setTransferring(false);
    }
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

    const removeLink = (key: string) => {
        if (isReadOnly) return;
        
        const newLinks = { ...links };
        delete newLinks[key];
        setLinks(newLinks);
    };

 if (loading ) {
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
                    <AlertTriangle className="w-12 h-12 text-white/60 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Project Not Found</h2>
                    <p className="text-white/40 mb-6">The requested project could not be loaded.</p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex font-sans">
            {/* Sidebar */}
            <Menu user={user} project={project} />

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Header */}
                <div className="flex-none h-14 mt-[55px] px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight">Settings <span className="text-white/30 text-lg font-light">Panel</span></h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {isReadOnly && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5">
                                Read Only
                            </span>
                        )}
                        <Link
                            href={`/dashboard/projects/${projectId}`}
                            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Back to Project
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Tabs */}
                        <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-lg border border-white/5">
                            {[
                                { id: 'general', label: 'General', icon: Settings },
                                { id: 'branding', label: 'Branding', icon: LayoutGrid },
                                { id: 'links', label: 'Links', icon: LinkIcon },
                                ...(isCreator ? [{ id: 'danger', label: 'Advanced', icon: Shield }] : []),
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                                        ${activeTab === tab.id 
                                            ? 'bg-white/10 text-white shadow-sm' 
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }
                                        ${isReadOnly ? 'cursor-default hover:text-white/60 hover:bg-transparent' : ''}
                                    `}
                                    disabled={isReadOnly && tab.id === 'danger'}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-6">
                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <SettingsCard
                                        title="Basic Information"
                                        description="Core project details and identification"
                                        icon={Settings}
                                    >
                                        <div className="space-y-6">
                                            <CustomInput
                                                label="Project Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                disabled={isReadOnly}
                                                leftIcon={<UserIcon size={14} />}
                                            />
                                            
                                            <CustomInput
                                                label="Project Description"
                                                isTextArea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                disabled={isReadOnly}
                                                helperText="Brief overview of your project's purpose and scope"
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard
                                        title="Collaboration"
                                        description="Manage team access and permissions"
                                        icon={Users}
                                    >
                                        <div className="space-y-6">
                                            <CustomInput
                                                label="Maximum Collaborators"
                                                type="number"
                                                value={maxCollaborators}
                                                onChange={(e) => setMaxCollaborators(Math.max(0, Number(e.target.value)))}
                                                disabled={isReadOnly}
                                                helperText="Set to 0 for unlimited collaborators"
                                                leftIcon={<Users size={14} />}
                                            />
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-white/80 tracking-wide mb-2">
                                                    Project ID
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={projectId}
                                                        readOnly
                                                        className="flex-1 bg-white/2 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/40 font-mono"
                                                    />
                                                    <button
                                                        onClick={() => copyToClipboard(projectId)}
                                                        className="px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                                                    >
                                                        {copiedId === projectId ? <Check size={16} /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-white/40 mt-2">
                                                    Use this ID for API integration and external references
                                                </p>
                                            </div>
                                        </div>
                                    </SettingsCard>
                                </div>
                            )}

                            {/* Branding Settings */}
                            {activeTab === 'branding' && (
                                <div className="space-y-6">
                                    <SettingsCard
                                        title="Visual Identity"
                                        description="Upload and manage your project's visual assets"
                                        icon={LayoutGrid}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <UploadArea
                                                    title="Project Logo"
                                                    description="Displayed in project cards and headers"
                                                    preview={logoPreview || projectIcon}
                                                    uploading={uploadingLogo}
                                                    onUpload={() => !isReadOnly && logoInputRef.current?.click()}
                                                    onClear={!isReadOnly ? clearLogo : undefined}
                                                    maxSize="5MB max"
                                                    aspectRatio="1:1"
                                                />
                                                <input
                                                    ref={logoInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                            
                                            <div>
                                                <UploadArea
                                                    title="Project Banner"
                                                    description="Displayed on your project's main page"
                                                    preview={bannerPreview || projectBanner}
                                                    uploading={uploadingBanner}
                                                    onUpload={() => !isReadOnly && bannerInputRef.current?.click()}
                                                    onClear={!isReadOnly ? clearBanner : undefined}
                                                    maxSize="10MB max"
                                                    aspectRatio="3:1"
                                                />
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
                                    </SettingsCard>
                                </div>
                            )}

                            {/* Links Settings */}
                            {activeTab === 'links' && (
                                <SettingsCard
                                    title="External Links"
                                    description="Connect your project with external resources"
                                    icon={LinkIcon}
                                >
                                    <div className="space-y-4">
                                        {Object.entries(links).length > 0 ? (
                                            Object.entries(links).map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <CustomInput
                                                            label={key.replace('-link', '').replace(/_/g, ' ').toUpperCase()}
                                                            value={value}
                                                            onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                                                            disabled={isReadOnly}
                                                            leftIcon={<ExternalLink size={14} />}
                                                        />
                                                    </div>

                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                                <p className="text-white/40">No external links configured</p>
                                                <p className="text-sm text-white/30 mt-2">
                                                    Add links to your repository, documentation, or website
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                
                                </SettingsCard>
                            )}

                            {/* Danger Zone */}
{activeTab === 'danger' && isCreator && (
    <div className="space-y-6">
        {/* <SettingsCard
            title="Transfer Ownership"
            description="Transfer complete control of this project to another user"
            icon={Key}
            variant="warning"
        >
            <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-yellow-500 mb-1">⚠️ Critical Action</h4>
                            <p className="text-sm text-yellow-500/80">
                                This action cannot be undone. The new owner will have full administrative control 
                                over this project. You will become a regular collaborator.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomInput
                        label="New Owner User ID"
                        value={newOwner}
                        onChange={(e) => {
                            setNewOwner(e.target.value);
                            setTransferError('');
                        }}
                        error={transferError && (transferError.includes("User not found") || transferError.includes("Cannot transfer") || transferError.includes("Error checking user")) ? transferError : undefined}
                        leftIcon={<UserIcon size={14} />}
                        helperText="Enter the exact UUID of the user"
                    />
                    
                    <CustomInput
                        label="Confirm User ID"
                        value={confirmOwnerId}
                        onChange={(e) => {
                            setConfirmOwnerId(e.target.value);
                            setTransferError('');
                        }}
                        error={newOwner && confirmOwnerId && newOwner !== confirmOwnerId ? "User IDs do not match" : undefined}
                        leftIcon={<Check size={14} />}
                        helperText="Must match the New Owner User ID exactly"
                    />
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                    <div className="flex-1">
                        <div className="text-xs text-white/40 mb-1">Your User ID:</div>
                        <div className="flex items-center gap-2">
                            <code className="text-xs bg-[#0a0a0a]/40 px-2 py-1 rounded border border-white/5 font-mono text-white/60 truncate flex-1">
                                {user?.id || "Not available"}
                            </code>
                            <button
                                onClick={() => copyToClipboard(user?.id)}
                                className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors"
                                title="Copy your User ID"
                            >
                                {copiedId === user?.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleTransferOwnership}
                        disabled={!newOwner || newOwner !== confirmOwnerId || transferring}
                        className={`
                            inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-white/5 whitespace-nowrap
                            ${newOwner && newOwner === confirmOwnerId && !transferring
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                            }
                        `}
                    >
                        {transferring ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            <>
                                <Key size={16} />
                                Transfer Ownership
                            </>
                        )}
                    </button>
                </div>
                
                {transferError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{transferError}</p>
                        </div>
                    </div>
                )}
                
                <div className="text-xs text-white/30 pt-2">
                    <p>Note: The new owner must already be a collaborator in this project.</p>
                </div>
            </div>
        </SettingsCard> */}

        <SettingsCard
            title="Delete Project"
            description="Permanently remove this project and all associated data"
            icon={Trash2}
            variant="danger"
        >
            <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-400 mb-1">Irreversible Action</h4>
                            <p className="text-sm text-red-400/80">
                                Once deleted, all project data, files, and configurations will be permanently removed.
                                This includes all team collaborations and associated metadata.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                        <h4 className="font-medium text-white mb-1">Project: {project.name}</h4>
                        <p className="text-sm text-white/60">ID: {projectId}</p>
                    </div>
                    
                    <button
                        onClick={handleDeleteProject}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors border border-red-500/20"
                    >
                        <Trash2 size={16} />
                        Delete Project
                    </button>
                </div>
            </div>
        </SettingsCard>
    </div>
)}
                        </div>

                        {/* Save Button */}
                        {!isReadOnly && (
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-white/40">
                                        {saving ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving changes...
                                            </span>
                                        ) : (
                                            'Make sure to save your changes'
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || uploadingLogo || uploadingBanner}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-black font-medium rounded-lg transition-all disabled:bg-white/20 disabled:text-white/40"
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
            </main>

            {/* Global Styles */}
            <style jsx global>{`
                body {
                    background: #000000;
                    overflow: hidden;
                }
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}