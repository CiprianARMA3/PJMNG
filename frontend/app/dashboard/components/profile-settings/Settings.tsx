// settings.tsx
"use client";
import { JSX, useState } from "react";
import { User, CreditCard, Bell, Shield, HelpCircle, Users, Home, FileText } from "lucide-react";

// Import your setting sub-pages here
import PublicProfilePage from "./sections/Profile";
import AccountPage from "./sections/Account";
import BillingPage from "./sections/Billing";

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
    "notifications": <div className="text-gray-300">Notifications Settings - Coming Soon</div>,
    "security": <div className="text-gray-300">Security Settings - Coming Soon</div>,
    "support": <div className="text-gray-300">Support Center - Coming Soon</div>,
    "team": <div className="text-gray-300">Team Management - Coming Soon</div>,
    "properties": <div className="text-gray-300">Property Management - Coming Soon</div>,
    "documents": <div className="text-gray-300">Agreements</div>,
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
    <div className="flex w-full min-h-screen text-gray-200 bg-[#0f0f10] ml-[150px] mt-[30px]">
      {/* LEFT SIDEBAR */}
      <aside className="w-80 pr-6 border-r border-[#1e1e22] bg-[#0f0f10]">
        <div className="sticky top-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-white">Settings</h2>
            <p className="text-sm text-gray-400">Manage your account and projects preferences</p>
          </div>
          <nav className="space-y-8">
            {menuSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
                        className={`block w-full text-left p-4 rounded-xl cursor-pointer transition-all border ${
                          isActive
                            ? "bg-purple-600/20 text-purple-300 border-purple-500/30 shadow-lg shadow-purple-500/10"
                            : "text-gray-400 hover:bg-[#1a1a1d] hover:text-gray-200 border-transparent hover:border-[#2a2a2e]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            isActive 
                              ? "bg-purple-500/20 text-purple-300" 
                              : "bg-[#1e1e22] text-gray-400"
                          }`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                isActive ? "text-purple-300" : "text-gray-200"
                              }`}>
                                {item.label}
                              </span>
                              {item.id === "documents" && (
                                <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-md border border-blue-500/30">
                                  Legal
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 leading-tight">
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

          {/* Quick Stats Footer */}
          {/* <div className="mt-12 p-4 bg-[#141417] rounded-xl border border-[#1e1e22]">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">12</div>
              <div className="text-xs text-gray-400">Projects</div>
            </div>
          </div> */}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 pl-8 pr-8">
        <div className="max-w-4xl">
          {pages[currentPage]}
        </div>
      </div>
    </div>
  );
}