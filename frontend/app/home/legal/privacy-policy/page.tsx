'use client';

import React from 'react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { redirect } from 'next/navigation';

export default function PrivacyPolicy() {
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
            <a href="https://vdxwsiiwvtlomxcjspbw.supabase.co/storage/v1/object/public/Legal%20Documents/KapryDEV-Privacy%20Policy.pdf"
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
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4">Privacy Policy</h1>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 text-sm font-medium text-zinc-500">
              <p>Effective Date: <span className="text-zinc-900 font-bold">27 December 2025</span></p>
              <p>Status: <span className="text-emerald-600 font-bold uppercase text-xs tracking-wider bg-emerald-50 px-2 py-1 rounded">Active</span></p>
            </div>
          </header>

          {/* Document Body */}
          <article className="prose prose-zinc max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-zinc-600 prose-p:font-medium prose-p:leading-relaxed prose-li:text-zinc-600 prose-li:font-medium prose-strong:text-zinc-900 prose-strong:font-bold text-sm md:text-[15px]">
            
            <p>
              KapryDEV ("we," "our," or "us") operates the website <strong>https://kaprydev.com</strong> (the "Service"). This privacy policy explains how our organization uses the personal data we collect from you when you use our website.
            </p>

            <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-100 my-8 not-prose">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-4">Topics Covered</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-bold text-zinc-500">
                <li className="flex items-center gap-2">1. What data do we collect?</li>
                <li className="flex items-center gap-2">2. How do we collect your data?</li>
                <li className="flex items-center gap-2">3. How will we use your data?</li>
                <li className="flex items-center gap-2">4. How do we store your data?</li>
                <li className="flex items-center gap-2">5. Marketing & Preferences</li>
                <li className="flex items-center gap-2">6. Data Protection Rights</li>
                <li className="flex items-center gap-2">7. Cookie Policy</li>
                <li className="flex items-center gap-2">8. Contact Information</li>
              </ul>
            </div>

            <hr className="my-8 border-zinc-100" />

            <h3 id="section-1">1. What data do we collect?</h3>
            <p>KapryDEV collects the following data:</p>
            <ul>
              <li><strong>Personal identification information:</strong> Name, email address, and profile picture (avatar).</li>
              <li><strong>Account and Authentication data:</strong> Encrypted passwords and login session tokens (managed via Supabase).</li>
              <li><strong>Financial Data:</strong> Payment history, subscription status, and billing address. Note: We do not store full credit card numbers. All payment processing is handled securely by our third-party processor, Stripe.</li>
              <li><strong>User-Generated Content:</strong> Project names, descriptions, task lists, roadmaps, code snippets, and repository logs that you upload to the platform for management or AI analysis.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, and operating system.</li>
            </ul>

            <h3 id="section-2">2. How do we collect your data?</h3>
            <p>You directly provide KapryDEV with most of the data we collect. We collect data and process data when you:</p>
            <ul>
              <li>Register online for an account or purchase a subscription plan.</li>
              <li>Create a project, add team members, or upload tasks and code repositories.</li>
              <li>Voluntarily complete a customer survey or provide feedback via email.</li>
              <li>Use or view our website via your browser’s cookies.</li>
            </ul>
            <p>KapryDEV may also receive your data indirectly from the following sources:</p>
            <ul>
              <li><strong>Stripe:</strong> We receive payment confirmation and subscription status updates.</li>
              <li><strong>GitHub/Git Providers:</strong> If you connect a repository, we fetch commit logs and code snippets to provide the Repository Review features.</li>
            </ul>

            <h3 id="section-3">3. How will we use your data?</h3>
            <p>KapryDEV collects your data so that we can:</p>
            <ul>
              <li>Process your registration and manage your account authentication.</li>
              <li>Process your subscription payments via Stripe.</li>
              <li>Provide the core functionality of the Service, including project tracking, roadmap visualization, and Kanban boards.</li>
              <li><strong>AI Processing:</strong> We send specific text inputs (such as code snippets or SQL queries) to third-party AI providers (e.g., Gemini) to generate code reviews, roadmaps, and SQL suggestions. This data is not used by our AI providers to train their models.</li>
              <li>Email you with critical service updates, security alerts, and invoices.</li>
            </ul>

            <h3 id="section-4">4. How do we store your data?</h3>
            <p>KapryDEV securely stores your data using Supabase, a cloud-hosted database provider. The data is encrypted at rest and in transit.</p>
            <p><strong>Location:</strong> Servers located in the EU (Frankfurt) .</p>
            <p>KapryDEV will keep your personal account data for the duration of your active subscription. If you delete your account, we will delete your personal data immediately from our active database. Backups may retain residual data for up to 30 days before being permanently overwritten.</p>

            <h3 id="section-5">5. Marketing</h3>
            <p>KapryDEV would like to send you information about products and services of ours that we think you might like. If you have agreed to receive marketing, you may always opt out at a later date.</p>
            <p>You have the right at any time to stop KapryDEV from contacting you for marketing purposes. If you no longer wish to be contacted for marketing purposes, please click the "Unsubscribe" link at the bottom of our emails.</p>

            <h3 id="section-6">6. What are your data protection rights?</h3>
            <p>KapryDEV would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>The right to access</strong> – You have the right to request KapryDEV for copies of your personal data. We may charge you a small fee for this service.</li>
              <li><strong>The right to rectification</strong> – You have the right to request that KapryDEV correct any information you believe is inaccurate. You also have the right to request KapryDEV to complete the information you believe is incomplete.</li>
              <li><strong>The right to erasure</strong> – You have the right to request that KapryDEV erase your personal data, under certain conditions.</li>
              <li><strong>The right to restrict processing</strong> – You have the right to request that KapryDEV restrict the processing of your personal data, under certain conditions.</li>
              <li><strong>The right to object to processing</strong> – You have the right to object to KapryDEV’s processing of your personal data, under certain conditions.</li>
              <li><strong>The right to data portability</strong> – You have the right to request that KapryDEV transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>
            <p>If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us at our email: <a href="mailto:support@kaprydev.com" className="text-purple-600 underline">support@kaprydev.com</a></p>

            <h3 id="section-7">7. Cookie Policy</h3>
            <p>Cookies are text files placed on your computer to collect standard Internet log information and visitor behavior information. When you visit our websites, we may collect information from you automatically through cookies or similar technology.</p>
            <p><strong>Types of cookies we use:</strong></p>
            <ul>
              <li><strong>Functionality:</strong> KapryDEV uses these cookies so that we recognize you on our website and remember your previously selected preferences.</li>
              <li><strong>Strictly Necessary:</strong> These cookies are essential for you to browse the website and use its features, such as accessing secure areas (e.g., Supabase Auth tokens).</li>
              <li><strong>Analytics:</strong> We use these cookies to collect information about your visit to our website, the content you viewed, the links you followed and information about your browser, device, and your IP address.</li>
            </ul>

            <h3 id="section-8">8. Changes to our privacy policy</h3>
            <p>KapryDEV keeps its privacy policy under regular review and places any updates on this web page. This privacy policy was last updated on 27 December 2025.</p>

            <hr className="my-10 border-zinc-100" />

            <div className="bg-zinc-50 p-8 rounded-xl border border-zinc-200">
                <h3 className="text-lg font-black text-zinc-900 mt-0 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                        <p className="font-bold text-zinc-900 mb-1">KapryDEV Headquarters</p>
                        <p className="text-zinc-600">Via Dante<br/>Cremona, CR 26100<br/>Italy</p>
                    </div>
                    <div>
                        <p className="font-bold text-zinc-900 mb-1">Data Protection Officer</p>
                        <p className="text-zinc-600 mb-2">Email: <a href="mailto:support@kaprydev.com" className="text-purple-600 hover:underline">support@kaprydev.com</a></p>
                        <p className="font-bold text-zinc-900 mb-1 mt-4">Appropriate Authority</p>
                        <p className="text-zinc-600">Information Commissioner’s Office</p>
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