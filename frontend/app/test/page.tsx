"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/hooks/useRequireAuth";
import {
  Home,
  Mail,
  Zap,
  BarChart,
  Settings,
  Bell,
  Search,
  Grid,
  HelpCircle,
  LogOut,
} from "lucide-react";

export default function testdashboard(){
  return (
    <>
      <div>
        <div className="project-logo">
          <img src="" alt="" />
           {/* // da cambiare in image  */}
        </div>
        <div>
          <div className="items">
              <a href="">Project Dashboard</a>
              <a href="">Calendar</a>
              <a href="">Issues</a>
              <a href="">Board</a>
              <a href="">Workflow</a>
              <a href="">Github</a>
              <a href="">Collaborators</a>
              <a href="">AI</a>
              <a href="">Code Review</a>
              <a href="">AI Direct Project</a>
              {/* hr */}
              <a href="">Manage Project</a>
              <a href="">Manage Collaborators</a>
              <a href="">Manage Workflow</a>
          </div>
          <div className="user">
                <div className="relative">
                <button 
                  // onClick={() => setActiveSection(SECTIONS.PROFILE_SETTINGS)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <img />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">
                      username
                    </p>
                    <label>Role</label>
                    <p className="text-xs text-white/50">
                      email
                    </p>
                  </div>
                  {/* <ChevronRight className="w-4 h-4 text-white/60" /> */}
                </button>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}