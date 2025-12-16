// frontend/app/dashboard/components/profile-settings/sections/Agreements.tsx

"use client";

import { useState } from "react";
import {
    FileText,
    Download,
    Shield,
    CheckCircle2,
    ExternalLink,
    AlertCircle,
    Clock,
    Globe,
    FileCheck,
    Lock,
    Server,
    History
} from "lucide-react";

// --- Shared Component: Page Widget ---
const PageWidget = ({ title, icon: Icon, children, action }: any) => (
    <div className="relative z-10 w-full bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl flex flex-col overflow-visible shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] light:shadow-lg hover:border-[#333] light:hover:border-gray-300 transition-colors mb-6">
        <div className="px-5 py-4 border-b border-[#222] light:border-gray-200 flex items-center justify-between bg-[#141414] light:bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-md border border-[#2a2a2a] light:border-gray-200">
                    <Icon size={14} className="text-neutral-400 light:text-neutral-500" />
                </div>
                <h3 className="text-sm font-medium text-neutral-300 light:text-neutral-700 tracking-wide">{title}</h3>
            </div>
            {action}
        </div>
        <div className="flex-1 p-6 bg-[#111111] light:bg-white min-h-0 relative flex flex-col rounded-b-xl text-neutral-300 light:text-neutral-600">
            {children}
        </div>
    </div>
);

// --- Mock Data: User's Signed Agreements ---
const signedAgreements = [
    {
        id: "tos_v2_1",
        name: "Terms of Service",
        description: "General usage terms for the Kapry.DEV platform.",
        version: "2.1",
        signedDate: "Oct 24, 2024",
        region: "Global",
        status: "active",
        type: "Standard"
    },
    {
        id: "pp_v3_0",
        name: "Privacy Policy",
        description: "How we collect, store, and process your data.",
        version: "3.0",
        signedDate: "Oct 24, 2024",
        region: "Global",
        status: "active",
        type: "Standard"
    },
    {
        id: "dpa_eu_1_4",
        name: "Data Processing Agreement (DPA)",
        description: "Required for entities processing EU citizen data.",
        version: "1.4",
        signedDate: "Nov 02, 2024",
        region: "EU Only",
        status: "active",
        type: "Compliance"
    }
];

export default function AgreementsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [requestingExport, setRequestingExport] = useState(false);

    const handleDownload = (docId: string) => {
        setDownloading(docId);
        // Simulate download
        setTimeout(() => setDownloading(null), 1500);
    };

    const handleDataExport = () => {
        if (!confirm("Request a full export of your personal data? This may take up to 48 hours.")) return;
        setRequestingExport(true);
        setTimeout(() => setRequestingExport(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 font-sans">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-medium text-white/90 light:text-black/90 mb-1">Legal & Compliance</h1>
                    <p className="text-sm text-neutral-500 light:text-neutral-600">View your signed agreements and manage your data rights.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161616] light:bg-white border border-[#222] light:border-gray-200 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-neutral-400 light:text-neutral-600 font-medium">Account in Good Standing</span>
                </div>
            </div>

            {/* Regional Protections Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* EU / GDPR Card */}
                <div className="bg-gradient-to-b from-[#161616] to-[#111] light:from-gray-50 light:to-white border border-[#222] light:border-gray-200 rounded-xl p-6 relative overflow-hidden group hover:border-blue-900/30 light:hover:border-blue-200 transition-colors">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                        <Globe className="w-32 h-32 text-blue-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-900/10 rounded-lg border border-blue-900/20">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-white light:text-black">EU Data Protection</h3>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-900/10 px-2 py-1 rounded border border-blue-900/20">GDPR Compliant</span>
                        </div>

                        <p className="text-xs text-neutral-500 leading-relaxed mb-6 h-10">
                            Your data is processed in accordance with GDPR. You have the right to access, rectify, and erase your personal data.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs py-2 border-t border-[#222]">
                                <span className="text-neutral-400 flex items-center gap-2">
                                    <Server size={12} />
                                    Data Residency
                                </span>
                                <span className="text-neutral-200 light:text-neutral-800">Frankfurt (eu-central-1)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-2 border-t border-[#222]">
                                <span className="text-neutral-400 flex items-center gap-2">
                                    <FileCheck size={12} />
                                    DPA Status
                                </span>
                                <span className="text-green-400 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Signed
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#222] flex gap-3">
                            <button
                                onClick={handleDataExport}
                                disabled={requestingExport}
                                className="flex-1 py-2 text-xs font-medium bg-[#1a1a1a] light:bg-white hover:bg-[#222] light:hover:bg-gray-50 text-neutral-300 light:text-neutral-700 hover:text-white light:hover:text-black border border-[#2a2a2a] light:border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {requestingExport ? "Processing..." : "Export My Data"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* US / CCPA Card */}
                <div className="bg-gradient-to-b from-[#161616] to-[#111] light:from-gray-50 light:to-white border border-[#222] light:border-gray-200 rounded-xl p-6 relative overflow-hidden group hover:border-green-900/30 light:hover:border-green-200 transition-colors">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                        <Lock className="w-32 h-32 text-green-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-900/10 rounded-lg border border-green-900/20">
                                    <Shield className="w-5 h-5 text-green-400" />
                                </div>
                                <h3 className="text-sm font-medium text-white light:text-black">US Privacy Standards</h3>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-900/10 px-2 py-1 rounded border border-green-900/20">CCPA Ready</span>
                        </div>

                        <p className="text-xs text-neutral-500 leading-relaxed mb-6 h-10">
                            We adhere to CCPA standards for California residents and industry-standard encryption for all US-based data.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs py-2 border-t border-[#222]">
                                <span className="text-neutral-400 flex items-center gap-2">
                                    <Lock size={12} />
                                    Encryption
                                </span>
                                <span className="text-neutral-200 light:text-neutral-800">AES-256 (At Rest)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-2 border-t border-[#222]">
                                <span className="text-neutral-400 flex items-center gap-2">
                                    <FileText size={12} />
                                    Sub-processors
                                </span>
                                <a href="#" className="text-neutral-300 light:text-neutral-700 hover:text-white light:hover:text-black underline decoration-neutral-700 light:decoration-neutral-300">View List</a>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#222] light:border-gray-200 flex gap-3">
                            <button className="flex-1 py-2 text-xs font-medium bg-[#1a1a1a] light:bg-white hover:bg-[#222] light:hover:bg-gray-50 text-neutral-300 light:text-neutral-700 hover:text-white light:hover:text-black border border-[#2a2a2a] light:border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2">
                                Privacy Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signed Agreements Table */}
            <PageWidget title="Your Signed Agreements" icon={FileText}>
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#141414] light:bg-gray-50 text-neutral-500 light:text-neutral-600 font-medium uppercase text-[10px] tracking-wider border-y border-[#222] light:border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Document</th>
                                <th className="px-6 py-3 font-medium">Signed Date</th>
                                <th className="px-6 py-3 font-medium">Version</th>
                                <th className="px-6 py-3 font-medium text-right">Reference Copy</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222] light:divide-gray-200 text-sm">
                            {signedAgreements.map((doc) => (
                                <tr key={doc.id} className="group hover:bg-[#161616] light:hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-neutral-200 light:text-neutral-800 font-medium">{doc.name}</span>
                                                {doc.type === 'Compliance' && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase border bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                        Legal
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-neutral-500 mt-0.5">{doc.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-400 light:text-neutral-600">
                                        <div className="flex items-center gap-2">
                                            <History size={14} />
                                            <span className="text-xs">{doc.signedDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono text-neutral-500 light:text-neutral-600 bg-[#1a1a1a] light:bg-gray-100 px-2 py-1 rounded border border-[#2a2a2a] light:border-gray-200">
                                            v{doc.version}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDownload(doc.id)}
                                            disabled={downloading === doc.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-400 light:text-neutral-600 hover:text-white light:hover:text-black bg-transparent hover:bg-[#222] light:hover:bg-gray-100 border border-transparent hover:border-[#333] light:hover:border-gray-200 rounded-lg transition-all"
                                        >
                                            {downloading === doc.id ? (
                                                <div className="w-3 h-3 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Download size={14} />
                                            )}
                                            <span>Download PDF</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Audit Footer */}
                <div className="mt-6 pt-4 border-t border-[#222] light:border-gray-200 flex items-center justify-between text-[11px] text-neutral-600 light:text-neutral-500">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-green-800" />
                        <span>All active agreements are up to date. No action required.</span>
                    </div>
                    <div className="font-mono">ID: USR-{Math.floor(Math.random() * 100000)}</div>
                </div>
            </PageWidget>

            {/* Additional Info / Disclaimer */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#161616] light:bg-gray-50 border border-[#222] light:border-gray-200">
                <AlertCircle className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                <div>
                    <h4 className="text-sm font-medium text-neutral-300 light:text-neutral-700 mb-1">Legal Disclaimer</h4>
                    <p className="text-xs text-neutral-500 light:text-neutral-600 leading-relaxed max-w-3xl">
                        The agreements provided above represent the legal contract between you (the User) and Kapry.DEV (the Service).
                        If you are using Kapry.DEV on behalf of a business entity, these agreements bind that entity.
                        For Enterprise-grade custom agreements (MSAs), please contact your dedicated account manager.
                    </p>
                </div>
            </div>
        </div>
    );
}