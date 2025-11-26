"use client";

import { Plus, ChevronDown, FolderPlus, Users } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link"; 

export default function AddProjectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleJoin = () => {
    console.log("Join project clicked");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`
          flex 
          items-center 
          justify-center 
          gap-2
          px-4
          py-2
          bg-white/5 
          backdrop-blur-lg 
          border 
          border-white/10 
          rounded-full 
          text-white 
          hover:bg-white/10 
          hover:border-white/20
          shadow-lg 
          transition-all
          duration-200
          ${isOpen ? 'bg-white/10 border-white/20' : ''}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus size={20} />
        <span className="text-sm font-medium">Add Project</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="
          absolute 
          left-0 
          top-full 
          mt-2 
          w-64 
          bg-[#1a1a1a]
          backdrop-blur-xl
          border 
          border-white/10 
          rounded-xl 
          shadow-2xl 
          z-[100]
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        ">
          
          {/* Option 1: Create Project */}
          <Link
            href="/create-project" 
            className="
              w-full 
              px-4 
              py-3 
              text-left 
              text-white 
              hover:bg-white/10 
              transition-all 
              duration-150
              border-b 
              border-white/5
              flex
              items-start
              gap-3
            "
            onClick={() => setIsOpen(false)}
          >
            <FolderPlus size={18} className="text-purple-400 mt-1" />
            <div>
              <div className="font-medium text-sm">Create Project</div>
              <div className="text-xs text-white/50 mt-0.5">Start a new workspace</div>
            </div>
          </Link>
          
          {/* Option 2: Join Project */}
          <button
            onClick={handleJoin}
            className="
              w-full 
              px-4 
              py-3 
              text-left 
              text-white 
              hover:bg-white/10 
              transition-all 
              duration-150
              flex
              items-start
              gap-3
            "
          >
            <Users size={18} className="text-blue-400 mt-1" />
            <div>
              <div className="font-medium text-sm">Join Project</div>
              <div className="text-xs text-white/50 mt-0.5">Collaborate on existing</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}