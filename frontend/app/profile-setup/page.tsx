"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import AvatarUpload from "../components/AvatarUpload";
import useRequireAuth from "@/hooks/useRequireAuth";
import { MoreHorizontal, Code, ChevronDown, Search } from "lucide-react";

// Libphonenumber imports
import { 
  getCountries, 
  getCountryCallingCode, 
  AsYouType, 
  isValidPhoneNumber,
  CountryCode
} from 'libphonenumber-js';

const supabase = createClient();

// --- 1. MATTE BACKGROUND COMPONENT ---
const NoiseBackground = () => (
  <div className="fixed inset-0 z-0 w-full h-full bg-[#0a0a0a]">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] to-[#111111]" />
    
    {/* Noise Overlay */}
    <div 
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  </div>
);

// --- 2. Page Widget (Matte Style) ---
const PageWidget = ({ title, icon: Icon, iconColor, children }: any) => (
  <div className="relative z-10 w-full max-w-md bg-[#111111] border border-[#222] rounded-xl flex flex-col overflow-visible shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] hover:border-[#333] transition-colors">
    {/* Header */}
    <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between bg-[#141414] rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
           <Icon size={14} className="text-neutral-400" />
        </div>
        <h3 className="text-sm font-medium text-neutral-300 tracking-wide">{title}</h3>
      </div>
      <MoreHorizontal size={16} className="text-neutral-600" />
    </div>
    
    {/* Content */}
    <div className="flex-1 p-8 bg-[#111111] min-h-0 relative flex flex-col rounded-b-xl">
      {children}
    </div>
  </div>
);

// --- 3. Phone Input (Matte Style) ---
const PhoneInput = ({ 
  value, 
  onChange, 
  country, 
  setCountry 
}: { 
  value: string, 
  onChange: (num: string) => void, 
  country: CountryCode,
  setCountry: (c: CountryCode) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allCountries = useMemo(() => {
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return getCountries().map((code) => ({
        code,
        name: regionNames.of(code) || code,
        dial_code: `+${getCountryCallingCode(code)}`
      }));
    } catch (e) {
      return getCountries().map((code) => ({
        code,
        name: code,
        dial_code: `+${getCountryCallingCode(code)}`
      }));
    }
  }, []);

  const filteredCountries = allCountries.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.dial_code.includes(searchTerm)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatter = new AsYouType(country);
    onChange(formatter.input(e.target.value));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex h-12 w-full bg-[#161616] border border-[#2a2a2a] rounded-lg focus-within:border-neutral-600 transition-colors overflow-visible items-stretch">
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-full items-center gap-2 px-3 border-r border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors bg-[#161616] min-w-[80px] rounded-l-lg"
        >
          <span className="text-neutral-300 text-sm font-medium">
             +{getCountryCallingCode(country)}
          </span>
          <ChevronDown size={14} className={`text-neutral-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <input
          type="tel"
          placeholder="Phone number"
          value={value}
          onChange={handleInputChange}
          className="flex-1 h-full px-4 bg-transparent text-neutral-200 outline-none placeholder:text-neutral-700 rounded-r-lg"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-hidden bg-[#161616] border border-[#2a2a2a] rounded-lg shadow-xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search country..." 
                className="w-full bg-[#0a0a0a] rounded-md py-1.5 pl-9 pr-3 text-xs text-neutral-300 border border-[#2a2a2a] focus:outline-none focus:border-neutral-600 placeholder:text-neutral-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${country === c.code ? 'bg-[#222] text-white' : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-neutral-200'}`}
                  onClick={() => {
                    setCountry(c.code as CountryCode);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] font-mono opacity-40 w-6 text-center bg-[#222] rounded px-1">{c.code}</span>
                    <span className="truncate max-w-[140px]">{c.name}</span>
                  </span>
                  <span className="text-xs text-neutral-600">{c.dial_code}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-neutral-600">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 4. Main Page Component ---
export default function ProfileSetupPage() {
  const router = useRouter();
  const { user: sessionUser, loading: authLoading } = useRequireAuth();
  
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [country, setCountry] = useState<CountryCode>("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check existing profile
  useEffect(() => {
    if (!sessionUser) return;
    const checkProfile = async () => {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("name, surname")
          .eq("id", sessionUser.id)
          .single();

        if (userData?.name && userData?.surname) {
          router.replace("/dashboard");
        } else {
          setIsCheckingProfile(false);
        }
      } catch (err) {
        setIsCheckingProfile(false);
      }
    };
    checkProfile();
  }, [sessionUser, router]);

  const handleSaveProfile = async () => {
    if (!sessionUser) return;
    
    if (!name.trim() || !surname.trim()) {
      setErrorMsg("Please fill in both name and surname.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      let finalPhone = null;

      // Validate Phone
      if (phoneNumber.trim()) {
        if (!isValidPhoneNumber(phoneNumber, country)) {
          throw new Error(`Invalid phone number for ${country}`);
        }
        
        const { parsePhoneNumber } = require('libphonenumber-js');
        const parsed = parsePhoneNumber(phoneNumber, country);
        if (parsed) {
          finalPhone = parsed.format('E.164');
        } else {
          throw new Error("Could not parse phone number");
        }
      }

      // Upload Avatar
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${sessionUser.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        avatarUrl = publicData.publicUrl;
      }

      // Update Database
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          surname: surname.trim(),
          phone_number: finalPhone,
          metadata: { 
            avatar_url: avatarUrl || null,
            phone_complete: !!finalPhone
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionUser.id);

      if (updateError) throw updateError;
      
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Profile setup error:", err.message);
      setErrorMsg(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isCheckingProfile) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      
      {/* Background */}
      <NoiseBackground />

      <div className="relative z-10 w-full max-w-md">
        <PageWidget 
          title="Complete Your Profile" 
          icon={Code} 
          iconColor="text-neutral-400"
        >
          <p className="text-neutral-500 text-sm mb-8">Please fill in your information to get started.</p>

          <div className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">
                  First Name <span className="text-red-900 text-sm">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 h-12 bg-[#161616] text-neutral-200 border border-[#2a2a2a] rounded-lg focus:border-neutral-600 outline-none transition-all placeholder:text-neutral-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">
                  Last Name <span className="text-red-900 text-sm">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 h-12 bg-[#161616] text-neutral-200 border border-[#2a2a2a] rounded-lg focus:border-neutral-600 outline-none transition-all placeholder:text-neutral-700"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">
                Phone Number <span className="text-red-900 text-sm">*</span>
              </label>
              <PhoneInput 
                value={phoneNumber}
                onChange={setPhoneNumber}
                country={country}
                setCountry={setCountry}
              />
              {phoneNumber && !isValidPhoneNumber(phoneNumber, country) && (
                <p className="text-red-900 text-[10px] mt-2 ml-1 animate-pulse font-medium">Invalid phone number format</p>
              )}
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">
                Profile Picture
              </label>
              <div className="border border-[#2a2a2a] rounded-lg p-4 bg-[#161616]">
                <AvatarUpload onFileSelect={setAvatarFile} /> 
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-6 p-3 bg-red-900/10 border border-red-900/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-900"></div>
              <p className="text-red-900 text-xs">{errorMsg}</p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={loading || !name.trim() || !surname.trim()}
            className="w-full mt-8 bg-[#e5e5e5] hover:bg-white text-black py-3 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </button>

          <div className="mt-8 text-center border-t border-[#222] pt-6">
            <p className="text-neutral-600 text-xs">
              By continuing, you agree to our Terms of Service.
            </p>
          </div>
        </PageWidget>
      </div>
    </div>
  );
}