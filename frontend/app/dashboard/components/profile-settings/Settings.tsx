"use client";

import { JSX, useState } from "react";
import { User, CreditCard, Bell, Shield, HelpCircle, Users, Home, FileText } from "lucide-react";
import Agreements from  "./sections/Agreements";
import SUPPORT from  "./sections/HelpSupport";

// Import your setting sub-pages here
import PublicProfilePage from "./sections/Profile";
import AccountPage from "./sections/Account";
import BillingPage from "./sections/Billing";
import Projects from "./sections/Projects";

// 1. Declare all available page IDs
type PageKey = "account" | "billing" | "notifications" | "security" | "support" | "team" | "properties" | "documents";

interface UserSettingsProps {
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    avatar_url: string;
    fullName: string;
    metadata?: any;
  } | null;
}

export default function UserSettings({ user }: UserSettingsProps) {
  // 2. Strongly type the current page
  const [currentPage, setCurrentPage] = useState<PageKey>("account");

  // 3. Strongly type the pages object
  const pages: Record<PageKey, JSX.Element> = {
    "account": <AccountPage user={user ? { id: user.id, email: user.email } : null} />,
    "billing": <BillingPage />,
    "notifications": <div className="text-neutral-500 text-sm p-4">Notifications Settings - Coming Soon</div>,
    "security": <div className="text-neutral-500 text-sm p-4">Security Settings - Coming Soon</div>,
    "support": <div className="text-neutral-500 text-sm p-4"><SUPPORT/></div>,
    "team": <div className="text-neutral-500 text-sm p-4">Team Management - Coming Soon</div>,
    "properties": <div className="text-neutral-300"><Projects /></div>,
    "documents": <div className="text-neutral-300"><Agreements/></div>,
  };

  const menuSections = [
    {
      title: "ACCOUNT",
      items: [
        { id: "account" as PageKey, label: "Account", icon: User, description: "Personal information & preferences" },
        // { id: "security" as PageKey, label: "Security", icon: Shield, description: "Password & 2FA settings" },
        // { id: "notifications" as PageKey, label: "Notifications", icon: Bell, description: "Email & push notifications" },
      ]
    },
    {
      title: "BUSINESS",
      items: [
        { id: "billing" as PageKey, label: "Billing & Payments", icon: CreditCard, description: "Payment methods & invoices" },
        { id: "properties" as PageKey, label: "Projects", icon: Home, description: "Manage your projects" },
        // { id: "team" as PageKey, label: "Team", icon: Users, description: "Team members & permissions" },
        { id: "documents" as PageKey, label: "Agreements", icon: FileText, description: "Templates & agreements" },
      ]
    },
    {
      title: "SUPPORT",
      items: [
        { id: "support" as PageKey, label: "Help & Support", icon: HelpCircle, description: "Get help and contact support" },
      ]
    }
  ];

  return (
    <div className="flex w-full min-h-screen font-sans text-neutral-200 mt-[30px] overflow-y-hidden scrollbar-hide">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-80 pr-8 border-r border-[#222]">
        <div className="sticky top-6">
          <div className="mb-10 pl-2">
            <h2 className="text-xl font-medium mb-1 text-white/90">Settings</h2>
            <p className="text-xs text-neutral-500 font-medium">Manage your account and project preferences</p>
          </div>
          
          <nav className="space-y-10">
            {menuSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-3 pl-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
                        className={`group block w-full text-left p-3 rounded-xl cursor-pointer transition-all border ${
                          isActive
                            ? "bg-[#161616] border-[#2a2a2a] shadow-sm"
                            : "bg-transparent border-transparent hover:bg-[#111111] hover:border-[#222]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg border transition-colors ${
                            isActive 
                              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white" 
                              : "bg-[#111111] border-[#1a1a1a] text-neutral-500 group-hover:text-neutral-300 group-hover:border-[#2a2a2a]"
                          }`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium transition-colors ${
                                isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                              }`}>
                                {item.label}
                              </span>
                              {item.id === "documents" && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-medium">
                                  Legal
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] mt-0.5 leading-tight transition-colors ${
                                isActive ? "text-neutral-400" : "text-neutral-600 group-hover:text-neutral-500"
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 pl-10 pr-6">
        <div className="max-w-5xl">
          {pages[currentPage]}
        </div>
      </div>
    </div>
  );
}