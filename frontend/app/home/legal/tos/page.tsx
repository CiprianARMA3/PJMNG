'use client';

import React from 'react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function TermsOfService() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#F2F4F7] min-h-screen font-sans text-[#1a1a1a]">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="pt-28 pb-24 px-4 sm:px-6">
        {/* --- Toolbar (Hidden in Print) --- */}
        <div className="max-w-[800px] mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={16} />
            Back to Home
          </a>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-all shadow-sm"
            >
              <Printer size={14} />
              Print
            </button>
            
            {/* UPDATED: Using <a> tag for download */}
            <a 
              href="https://vdxwsiiwvtlomxcjspbw.supabase.co/storage/v1/object/public/Legal%20Documents/KapryDEV-TOS.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-900 rounded-lg text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Download size={14} />
              Save PDF
            </a>
          </div>
        </div>

        {/* --- DOCUMENT SHEET --- */}
        <div className="max-w-[800px] mx-auto bg-white shadow-2xl shadow-zinc-200/60 print:shadow-none print:border-none p-12 md:p-16 rounded-xl animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* Document Header */}
          <header className="border-b-2 border-zinc-100 pb-8 mb-10">
            <div className="flex justify-between items-start mb-6">
              <div className="text-2xl font-black tracking-tighter text-zinc-900">KapryDEV<span className="text-purple-600">.</span></div>
              <div className="text-right">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Document Ref</span>
                <span className="block text-xs font-bold font-mono text-zinc-600">LEG-TOS-2025-V1</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4">Terms of Service</h1>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 text-sm font-medium text-zinc-500">
              <p>Effective Date: <span className="text-zinc-900 font-bold">27 December 2025</span></p>
              <p>Status: <span className="text-emerald-600 font-bold uppercase text-xs tracking-wider bg-emerald-50 px-2 py-1 rounded">Enforced</span></p>
            </div>
          </header>

          {/* Document Body */}
          <article className="prose prose-zinc max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-zinc-600 prose-p:font-medium prose-p:leading-relaxed prose-li:text-zinc-600 prose-li:font-medium prose-strong:text-zinc-900 prose-strong:font-bold text-sm md:text-[15px]">
            
            <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-100 mb-8 not-prose">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-4">Contents</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-bold text-zinc-500">
                <li className="flex items-center gap-2">1. Acceptance of Terms</li>
                <li className="flex items-center gap-2">2. Service Description</li>
                <li className="flex items-center gap-2">3. User Data & Ownership</li>
                <li className="flex items-center gap-2">4. Termination & Suspension</li>
                <li className="flex items-center gap-2">5. Accounts & Security</li>
                <li className="flex items-center gap-2">6. Payment & Subscriptions</li>
                <li className="flex items-center gap-2">7. Intellectual Property</li>
                <li className="flex items-center gap-2">8-12. Liability & Governance</li>
              </ul>
            </div>

            <h3 id="section-1">1. Acceptance of Terms</h3>
            <p>
              By accessing or using the website and services provided by KapryDEV ("we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>

            <h3 id="section-2">2. Description of Service</h3>
            <p>
              KapryDEV provides a project management and AI-assisted development platform (the "Service"). The Service includes, but is not limited to, Kanban boards, roadmap visualization, code repository reviews, and AI-generated SQL and code suggestions.
            </p>

            <h3 id="section-3">3. User Data and Ownership</h3>
            <p>
              We respect your rights to your data. You retain full ownership of all data, text, code, files, and information that you upload, post, or store on KapryDEV ("User Content").
            </p>
            <ul>
              <li><strong>Ownership:</strong> KapryDEV claims no intellectual property rights over the User Content you provide to the Service. Your profile and materials uploaded remain yours.</li>
              <li><strong>License to Host:</strong> By uploading User Content, you grant KapryDEV a worldwide, non-exclusive, royalty-free license to use, reproduce, display, and distribute your User Content solely for the purpose of operating, and providing the Service to you. (e.g., we need the right to display your tasks on your dashboard).</li>
              <li><strong>Data Export:</strong> You have the right to export your data from our system at any time while your account is active.</li>
            </ul>

            <h3 id="section-4">4. Termination and Suspension</h3>
            <div className="p-4 border-l-4 border-purple-500 bg-purple-50 my-4">
                <p className="font-bold text-purple-900 m-0 text-xs uppercase tracking-wide">Important Notice</p>
                <p className="text-purple-800 m-0 text-sm">Please read this section carefully regarding your account rights.</p>
            </div>
            
            <p><strong>4.1 Termination by You</strong><br/>
            You may terminate your account at any time by discontinuing the use of the Service or canceling your subscription through your account dashboard.</p>
            
            <p><strong>4.2 Termination by KapryDEV</strong><br/>
            We reserve the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason, or no reason at all, at our sole discretion. This includes, but is not limited to:</p>
            <ul>
                <li>Violation of these Terms.</li>
                <li>Requests by law enforcement or other government agencies.</li>
                <li>Unexpected technical or security issues.</li>
            </ul>

            <p><strong>Termination for Convenience:</strong> We reserve the right to terminate our relationship with you and close your account at any time, without cause or warning.</p>
            
            <p>Upon termination, your right to use the Service will immediately cease. If we terminate your account for a reason other than a violation of these Terms (i.e., for our own convenience), we may, at our sole discretion, refund a prorated portion of any prepaid subscription fees.</p>

            <h3 id="section-5">5. Accounts and Security</h3>
            <ul>
                <li>You are responsible for maintaining the security of your account and password. KapryDEV cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</li>
                <li>You are responsible for all Content posted and activity that occurs under your account.</li>
                <li>You must be a human. Accounts registered by "bots" or other automated methods are not permitted.</li>
            </ul>

            <h3 id="section-6">6. Payment and Subscriptions</h3>
            <ul>
                <li><strong>Billing:</strong> The Service is billed in advance on a monthly or yearly basis and is non-refundable, except as explicitly provided in these Terms.</li>
                <li><strong>Payment Processor:</strong> We use Stripe to process payments. By using our paid services, you agree to Stripe’s Services Agreement.</li>
                <li><strong>Downgrading:</strong> Downgrading your Service may cause the loss of Content, features, or capacity of your Account. KapryDEV does not accept any liability for such loss.</li>
            </ul>

            <h3 id="section-7">7. Intellectual Property (Our Rights)</h3>
            <p>
                While you own your data, we own the Platform. The visual interfaces, graphics (including the "Aurora Background" and custom UI components), design, compilation, information, computer code (including source code and backend logic), products, software, and all other elements of the Service provided by KapryDEV are protected by copyright, trade dress, patent, and trademark laws.
            </p>
            <p>
                You may not copy, modify, distribute, sell, or lease any part of our Service or included software, nor may you reverse engineer or attempt to extract the source code of that software.
            </p>

            <h3 id="section-8">8. Acceptable Use</h3>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-4 space-y-1">
                <li>Upload or transmit any content that is unlawful, harmful, threatening, abusive, or discriminatory.</li>
                <li>Upload viruses or malicious code.</li>
                <li>Overload, flood, or spam our infrastructure or AI endpoints.</li>
                <li>Attempt to access any other user's data or account.</li>
            </ul>

            <h3 id="section-9">9. Limitation of Liability</h3>
            <p>
                In no event shall KapryDEV, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ol>
                <li>Your access to or use of or inability to access or use the Service;</li>
                <li>Any conduct or content of any third party on the Service;</li>
                <li>Any content obtained from the Service; and</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ol>

            <h3 id="section-10">10. Governing Law</h3>
            <p>These Terms shall be governed and construed in accordance with the laws of Italy, without regard to its conflict of law provisions.</p>

            <h3 id="section-11">11. Changes to Terms</h3>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

            <hr className="my-10 border-zinc-100" />

            <div className="bg-zinc-50 p-8 rounded-xl border border-zinc-200">
                <h3 className="text-lg font-black text-zinc-900 mt-0 mb-4">12. Contact Us</h3>
                <p className="mb-4">If you have any questions about these Terms, please contact us.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                        <p className="font-bold text-zinc-900 mb-1">KapryDEV Legal</p>
                        <p className="text-zinc-600">Via Dante<br/>Cremona, CR 26100<br/>Italy</p>
                    </div>
                    <div>
                        <p className="font-bold text-zinc-900 mb-1">Electronic Support</p>
                        <p className="text-zinc-600">Email: <a href="mailto:support@kaprydev.com" className="text-purple-600 hover:underline">support@kaprydev.com</a></p>
                    </div>
                </div>
            </div>

          </article>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}