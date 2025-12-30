"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    FileText,
    Download,
    Shield,
    CheckCircle2,
    AlertCircle,
    FileCheck,
    Lock,
    Server,
    History,
    Calendar,
    Loader2,
    PenTool
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { exportUserData } from "@/app/actions/exportUserData";
import { getLegalAgreements, signLegalAgreement, AgreementStatus } from "@/app/actions/importLegalAgreements";

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

// --- INDUSTRIAL WIDGET: GOVERNANCE NODE ---
const GovernanceNode = ({ title, icon: Icon, children, action }: any) => (
    <div className="relative w-full bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[30px] flex flex-col overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 mb-8">
        {/* Grainy Texture */}
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none z-0" />

        {/* Header Protocol */}
        <div className="relative z-10 px-6 py-4 border-b-2 border-zinc-50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 text-purple-600 shadow-sm">
                    <Icon size={16} strokeWidth={3} />
                </div>
                <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 block mb-0.5">
                        System Registry
                    </span>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                        {title}
                    </h3>
                </div>
            </div>
            {action}
        </div>

        {/* Core Content */}
        <div className="relative z-10 flex-1 bg-white dark:bg-transparent min-h-0 flex flex-col">
            {children}
        </div>
    </div>
);

// --- MODAL: FORCED SIGNATURE ---
const SignatureModal = ({ 
    isOpen, 
    agreement, 
    onSign, 
    isSigning 
}: { 
    isOpen: boolean; 
    agreement: AgreementStatus | null; 
    onSign: () => void;
    isSigning: boolean;
}) => {
    if (!isOpen || !agreement) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute" 
            />
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0A0A0A] border-2 border-red-500/30 rounded-[30px] shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] pointer-events-none z-0" />
                
                <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-2">
                        Action Required
                    </h2>
                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
                        You must review and sign the <span className="text-zinc-900 dark:text-white underline">{agreement.document}</span> to continue using the Kapry DEV platform.
                    </p>

                    <div className="w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 p-4 mb-8">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Document ID</span>
                            <span className="text-[10px] font-mono font-bold">{agreement.id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Region</span>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                {agreement.region}
                            </span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
                            <a 
                                href={agreement.data.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600 hover:underline"
                            >
                                <FileText size={12} /> View PDF Document
                            </a>
                        </div>
                    </div>

                    <button
                        onClick={onSign}
                        disabled={isSigning}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSigning ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Cryptographic Signing...</span>
                            </>
                        ) : (
                            <>
                                <PenTool className="w-3 h-3" />
                                <span>I Accept & Sign Agreement</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function AgreementsPage() {
    const supabase = createClient();
    const [downloading, setDownloading] = useState<number | null>(null);
    const [requestingExport, setRequestingExport] = useState(false);
    const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [countdown, setCountdown] = useState<string | null>(null);
    
    // Data States
    const [agreements, setAgreements] = useState<AgreementStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Signature Logic
    const [unsignedMandatoryDoc, setUnsignedMandatoryDoc] = useState<AgreementStatus | null>(null);
    const [isSigning, setIsSigning] = useState<number | null>(null);

    // --- Derived State for EU Box ---
    // Finds the latest "Data Processing Agreement" by sorting descending IDs (assuming higher ID is newer)
    const latestDPA = useMemo(() => {
        return agreements
            .filter(doc => doc.document === "Data Processing Agreement")
            .sort((a, b) => b.id - a.id)[0] || null;
    }, [agreements]);

    const loadAgreements = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getLegalAgreements();
            setAgreements(data);

            // Re-calculate local check for mandatory doc immediately after fetch
            // We use the same logic: Find latest DPA
            const dpaDocs = data.filter(doc => doc.document === "Data Processing Agreement");
            const latest = dpaDocs.sort((a, b) => b.id - a.id)[0];
            
            if (latest && !latest.isSigned) {
                setUnsignedMandatoryDoc(latest);
            } else {
                setUnsignedMandatoryDoc(null);
            }
        } catch (error) {
            console.error("Failed to load agreements", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSignAgreement = async (docId: number) => {
        setIsSigning(docId);
        try {
            const result = await signLegalAgreement(docId);
            if (result.success) {
                await loadAgreements(); 
            }
        } catch (error) {
            console.error("Sign Error:", error);
            alert("Failed to sign agreement. Please try again.");
        } finally {
            setIsSigning(null);
        }
    };

    const fetchMetadata = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from("users")
                .select("metadata")
                .eq("id", user.id)
                .single();
            if (data?.metadata) {
                checkCooldown(data.metadata.last_data_export);
            }
        }
    }, [supabase]);

    useEffect(() => {
        fetchMetadata();
        loadAgreements();
    }, [fetchMetadata, loadAgreements]);

    const checkCooldown = (lastExport: string | undefined) => {
        if (!lastExport) {
            setCountdown(null);
            return;
        }

        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const nextAvailableDate = new Date(lastExport).getTime() + thirtyDaysInMs;
        const now = new Date().getTime();

        if (now < nextAvailableDate) {
            const diffInMs = nextAvailableDate - now;
            const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            setCountdown(`${days}d ${hours}h remaining`);
        } else {
            setCountdown(null);
        }
    };

    const handleDownload = (docId: number, url: string) => {
        setDownloading(docId);
        window.open(url, '_blank');
        setTimeout(() => setDownloading(null), 1500);
    };

    const handleDataExport = async () => {
        if (countdown) return;
        if (!confirm("Request a full export of your personal data payload? This protocol generates a PDF of all system registry entries associated with your UID.")) return;
        
        setRequestingExport(true);
        setExportStatus(null);

        try {
            const pdfDataUri = await exportUserData();
            const link = document.createElement("a");
            link.href = pdfDataUri;
            link.download = `KAPRY_DATA_EXPORT_${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportStatus({ type: 'success', text: "Payload extracted successfully. 30-day cooldown initiated." });
            await fetchMetadata();
        } catch (error: any) {
            setExportStatus({ type: 'error', text: error.message || "Protocol Failure: Extraction Interrupted" });
        } finally {
            setRequestingExport(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
            <SignatureModal 
                isOpen={!!unsignedMandatoryDoc}
                agreement={unsignedMandatoryDoc}
                onSign={() => unsignedMandatoryDoc && handleSignAgreement(unsignedMandatoryDoc.id)}
                isSigning={isSigning === unsignedMandatoryDoc?.id}
            />

            {/* --- PAGE HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                            Governance / Regulatory Nodes
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">
                        Legal & Compliance<span className="text-purple-600">.</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xs leading-relaxed max-w-md mt-3">
                        Audit your signed cryptographic agreements and execute your global data rights protocols.
                    </p>
                </div>
            </div>

            {/* --- COMPLIANCE NODES GRID --- */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {/* EU NODE */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900/30 border-2 border-zinc-100 dark:border-zinc-800 rounded-[30px] p-8 min-h-[360px] flex flex-col relative overflow-hidden group hover:border-blue-600/50 transition-all shadow-2xl shadow-zinc-200/50 dark:shadow-black/50">
                    {/* EU Flag SVG Background */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="absolute -top-8 -right-8 w-56 h-56 grayscale opacity-10 dark:opacity-20 group-hover:grayscale-0 group-hover:opacity-30 transition-all duration-500 pointer-events-none rounded-bl-3xl">
                        <path fill="#003399" d="M0 0h512v512H0z" />
                        <path fill="#FFCC00" d="M256 77l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM132.6 110.1l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM44.3 198.4l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM10.2 314l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM44.3 429.6l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM132.6 517.9l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM256 551l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM379.4 517.9l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM467.7 429.6l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM501.8 314l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM467.7 198.4l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18zM379.4 110.1l-6 18h-18l15 11-6 18 15-11 15 11-6-18 15-11h-18z" />
                    </svg>

                    <div className="relative z-10 flex flex-col flex-1 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={3} />
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">EU Protection</h3>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                GDPR
                            </span>
                        </div>

                        <p className="text-sm font-black text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 h-12">
                            Processed via GDPR protocols. Execute rights to rectify or erase personal telemetry from our Frankfurt nodes.
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between text-xs py-2 border-b-2 border-zinc-50 dark:border-zinc-800/50">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                    <Server size={12} strokeWidth={3} /> Residency
                                </span>
                                <span className="font-bold text-zinc-900 dark:text-zinc-200">Frankfurt (eu-central-1)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-2 border-b-2 border-zinc-50 dark:border-zinc-800/50">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                    <FileCheck size={12} strokeWidth={3} /> DPA Status
                                </span>
                                {latestDPA?.isSigned ? (
                                    <span className="text-emerald-500 font-black flex items-center gap-1 uppercase tracking-tight">
                                        <CheckCircle2 size={12} strokeWidth={3} /> Signed
                                    </span>
                                ) : (
                                    <span className="text-red-500 font-black flex items-center gap-1 uppercase tracking-tight">
                                        <AlertCircle size={12} strokeWidth={3} /> Pending
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            <button
                                onClick={handleDataExport}
                                disabled={requestingExport || !!countdown}
                                className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                                    countdown 
                                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border-2 border-zinc-300 dark:border-zinc-700 shadow-none" 
                                    : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                                }`}
                            >
                                {requestingExport ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>Extracting Payload...</span>
                                    </>
                                ) : countdown ? (
                                    <>
                                        <Lock size={12} strokeWidth={3} />
                                        <span>Cooldown: {countdown}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={12} strokeWidth={3} />
                                        <span>Export Data Payload</span>
                                    </>
                                )}
                            </button>

                            {exportStatus && (
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-tight border ${
                                    exportStatus.type === 'success' 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30' 
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30'
                                }`}>
                                    {exportStatus.type === 'success' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                    {exportStatus.text}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* US NODE */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900/30 border-2 border-zinc-100 dark:border-zinc-800 rounded-[30px] p-8 min-h-[360px] flex flex-col relative overflow-hidden group hover:border-emerald-600/50 transition-all shadow-2xl shadow-zinc-200/50 dark:shadow-black/50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="absolute -top-8 -right-8 w-56 h-56 grayscale opacity-10 dark:opacity-20 group-hover:grayscale-0 group-hover:opacity-30 transition-all duration-500 pointer-events-none rounded-bl-3xl">
                        <path fill="#BD3D44" d="M0 0h512v512H0z" />
                        <path stroke="#FFF" strokeWidth="37" d="M0 55.5h512M0 129.5h512M0 203.5h512M0 277.5h512M0 351.5h512M0 425.5h512M0 499.5h512" />
                        <path fill="#192F5D" d="M0 0h246v259H0z" />
                        <g fill="#FFF">
                            <path d="M42 35l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM89 35l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM136 35l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM183 35l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM230 35l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM42 82l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM89 82l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM136 82l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM183 82l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM230 82l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM42 129l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM89 129l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM136 129l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM183 129l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM230 129l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM42 176l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM89 176l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM136 176l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM183 176l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM230 176l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM42 223l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM89 223l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM136 223l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM183 223l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8zM230 223l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8z" />
                        </g>
                    </svg>

                    <div className="relative z-10 flex flex-col flex-1 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                                </div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">US General Privacy</h3>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                CPA
                            </span>
                        </div>

                        <p className="text-sm font-black text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 h-12">
                            Multi-state CPA adherence (CA, VA, CO) & AES-256 encryption. Stored safely in US-East regions.
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between text-xs py-2 border-b-2 border-zinc-50 dark:border-zinc-800/50">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                    <Lock size={12} strokeWidth={3} /> Encryption
                                </span>
                                <span className="font-bold text-zinc-900 dark:text-zinc-200">AES-256 (At Rest)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-2 border-b-2 border-zinc-50 dark:border-zinc-800/50">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                                    <FileText size={12} strokeWidth={3} /> Processors
                                </span>
                                <a href="#" className="font-bold text-zinc-900 dark:text-zinc-200 hover:text-purple-600 dark:hover:text-purple-400 underline decoration-zinc-300 dark:decoration-zinc-700">View List</a>
                            </div>
                        </div>

                        <button className="mt-auto w-full py-4 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 text-zinc-900 dark:text-white hover:border-zinc-900 dark:hover:border-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm active:scale-95 transition-all">
                            Configure Privacy
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {/* --- GOVERNANCE LEDGER --- */}
            <GovernanceNode title="Signed Agreement Ledger" icon={FileText}>
                <div className="overflow-x-auto">
                    {isLoading ? (
                         <div className="w-full h-40 flex flex-col items-center justify-center gap-3 text-zinc-400">
                             <Loader2 className="w-6 h-6 animate-spin" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Auditing Registry...</span>
                         </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-zinc-50 dark:border-zinc-800">
                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Protocol Name</th>
                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Timestamp</th>
                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Region</th>
                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Adhered</th>
                                    <th className="px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400">Reference Copy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-zinc-50 dark:divide-zinc-900">
                                {agreements.map((doc) => (
                                    <tr key={doc.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight group-hover:text-purple-600 transition-colors">
                                                        {doc.document}
                                                    </span>
                                                    {doc.region === 'European Union' && (
                                                        <span className="px-1 py-0.5 rounded text-[7px] font-black uppercase border bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30">
                                                            EU Legal
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-400 line-clamp-1">{doc.region} Compliance</span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-tight">
                                                <History size={12} />
                                                <span>{doc.signedDate ? new Date(doc.signedDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="text-[9px] font-black font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                                                {doc.region}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${doc.isSigned ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-400/50'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${doc.isSigned ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-400'}`}>
                                                    {doc.isSigned ? 'Active' : 'Missing'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 group/date">
                                                <Calendar size={12} className={`stroke-[2.5px] ${doc.isSigned ? 'text-zinc-400' : 'text-orange-400/50'}`} />
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-widest ${!doc.isSigned ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0 rounded border border-orange-100 dark:border-orange-900/30' : 'text-zinc-600 dark:text-zinc-400'}`}
                                                >
                                                    {doc.isSigned ? 'Adhered' : <span>NAT<sup className="ml-0.5">1</sup></span>}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!doc.isSigned && (
                                                    <button
                                                        onClick={() => handleSignAgreement(doc.id)}
                                                        disabled={isSigning === doc.id}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                                                    >
                                                        {isSigning === doc.id ? (
                                                            <Loader2 size={10} className="animate-spin" />
                                                        ) : (
                                                            <PenTool size={10} strokeWidth={3} />
                                                        )}
                                                        <span>Sign Now</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownload(doc.id, doc.data.url)}
                                                    disabled={downloading === doc.id}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-900 dark:text-white transition-all active:scale-95"
                                                >
                                                    {downloading === doc.id ? (
                                                        <div className="w-3 h-3 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                                                    ) : (
                                                        <Download size={10} strokeWidth={3} />
                                                    )}
                                                    <span>Download</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="px-6 py-4 border-t-2 border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                        <CheckCircle2 size={12} className="text-emerald-600" strokeWidth={2.5} />
                        <span>All active agreements synced to ledger.</span>
                    </div>
                    <div className="text-[8px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-900/30">
                        <sup className="mr-1">1</sup>Not Adhered To
                    </div>
                </div>
            </GovernanceNode>

            {/* --- LEGAL DISCLAIMER NODE --- */}
            <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/30 border-2 border-zinc-100 dark:border-zinc-800 rounded-[30px]">
                <AlertCircle className="w-5 h-5 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="space-y-1">
                    <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Legal Disclaimer</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed max-w-4xl uppercase tracking-tight">
                        The protocols provided above represent the legal logic binding the User and the Kapry DEV Orchestration service. If you are using Kapry DEV on behalf of a business entity, these agreements bind that entity. For Enterprise-grade custom agreements (MSAs), please contact your dedicated account manager.
                    </p>
                </div>
            </div>
        </div>
    );
}