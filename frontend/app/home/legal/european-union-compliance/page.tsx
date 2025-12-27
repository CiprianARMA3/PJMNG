'use client';

import React from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Globe, 
  Server, 
  ArrowLeft, 
  Lock,
  FileCheck
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

// --- DOCUMENT DATA ---
const euDocuments = [
  {
    id: 'dpa',
    title: 'Data Processing Agreement (DPA)',
    version: 'v2.4 (2025)',
    description: 'Our standard DPA outlining the terms for processing personal data on behalf of EU data subjects, compliant with GDPR Art. 28.',
    fileUrl: 'https://vdxwsiiwvtlomxcjspbw.supabase.co/storage/v1/object/public/Legal%20Documents/KapryDEV-DPA-Signed.pdf', // Replace with actual link
    type: 'Core'
  },
  {
    id: 'scc',
    title: 'Standard Contractual Clauses (SCCs)',
    version: 'Module 2 & 3',
    description: 'Pre-signed SCCs for data transfers between EU/EEA controllers and non-EU processors (if applicable to your cluster).',
    fileUrl: '#',
    type: 'Transfer'
  },
  {
    id: 'subprocessors',
    title: 'List of Sub-processors',
    version: 'Q1 2025',
    description: 'A comprehensive transparency report listing all third-party entities involved in data processing (AWS, OpenAI, Stripe).',
    fileUrl: '#',
    type: 'Transparency'
  },
  {
    id: 'security',
    title: 'Security Measures (TOMs)',
    version: 'Rev. 9',
    description: 'Technical and Organizational Measures description detailing encryption, access control, and redundancy protocols.',
    fileUrl: '#',
    type: 'Technical'
  }
];

export default function EUComplianceHub() {
  return (
    <div className="bg-[#F2F4F7] min-h-screen font-sans text-[#1a1a1a]">
      <Navbar />

      <main className="pt-28 pb-24 px-4 sm:px-6">
        
        {/* --- HEADER --- */}
        <div className="max-w-5xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-6">
            <ArrowLeft size={16} />
            Back to Legal Overview
          </a>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#003399]/10 border border-[#003399]/20 rounded-full mb-4">
                <Globe size={12} className="text-[#003399]" />
                <span className="text-[10px] font-black text-[#003399] tracking-widest uppercase">European Union Zone</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4">
                EU Compliance Hub<span className="text-[#003399]">.</span>
              </h1>
              <p className="text-zinc-500 font-bold text-sm max-w-xl leading-relaxed">
                Access critical regulatory documentation, audit artifacts, and data residency proofs required for GDPR compliance.
              </p>
            </div>
            
            {/* Status Badge */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
               <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <ShieldCheck size={20} strokeWidth={2.5} />
               </div>
               <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Compliance Status</span>
                  <span className="block text-sm font-black text-zinc-900">GDPR Ready</span>
               </div>
            </div>
          </div>
        </div>

        {/* --- DOCUMENT GRID --- */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {euDocuments.map((doc) => (
            <div key={doc.id} className="group relative bg-white rounded-2xl p-8 border border-zinc-200 shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-900 group-hover:bg-[#003399] group-hover:text-white transition-colors duration-300">
                  <FileText size={24} strokeWidth={2} />
                </div>
                <span className="px-2 py-1 bg-zinc-50 border border-zinc-100 rounded text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {doc.type}
                </span>
              </div>

              <h3 className="text-lg font-black text-zinc-900 mb-2">{doc.title}</h3>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-8 h-10 line-clamp-2">
                {doc.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                <span className="text-xs font-bold font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded">
                  {doc.version}
                </span>
                
                <a 
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-900 group-hover:text-[#003399] transition-colors"
                >
                  <Download size={14} strokeWidth={3} />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
}