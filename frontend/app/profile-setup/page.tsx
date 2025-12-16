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
  <div className="fixed inset-0 z-0 w-full h-full bg-[#0a0a0a] light:bg-gray-50">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] to-[#111111] light:from-white light:to-gray-100" />

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
  <div className="relative z-10 w-full max-w-md bg-[#111111] light:bg-white border border-[#222] light:border-gray-200 rounded-xl flex flex-col overflow-visible shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] light:shadow-lg hover:border-[#333] light:hover:border-gray-300 transition-colors">
    {/* Header */}
    <div className="px-5 py-4 border-b border-[#222] light:border-gray-200 flex items-center justify-between bg-[#141414] light:bg-gray-50 rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1a1a1a] light:bg-white rounded-md border border-[#2a2a2a] light:border-gray-200">
          <Icon size={14} className="text-neutral-400 light:text-neutral-500" />
        </div>
        <h3 className="text-sm font-medium text-neutral-300 light:text-neutral-700 tracking-wide">{title}</h3>
      </div>
      <MoreHorizontal size={16} className="text-neutral-600 light:text-neutral-400" />
    </div>

    {/* Content */}
    <div className="flex-1 p-8 bg-[#111111] light:bg-white min-h-0 relative flex flex-col rounded-b-xl">
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
      <div className="flex h-12 w-full bg-[#161616] light:bg-white border border-[#2a2a2a] light:border-gray-300 rounded-lg focus-within:border-neutral-600 light:focus-within:border-neutral-400 transition-colors overflow-visible items-stretch">

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-full items-center gap-2 px-3 border-r border-[#2a2a2a] light:border-gray-300 hover:bg-[#1a1a1a] light:hover:bg-gray-100 transition-colors bg-[#161616] light:bg-gray-50 min-w-[80px] rounded-l-lg"
        >
          <span className="text-neutral-300 light:text-neutral-700 text-sm font-medium">
            +{getCountryCallingCode(country)}
          </span>
          <ChevronDown size={14} className={`text-neutral-600 light:text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <input
          type="tel"
          placeholder="Phone number"
          value={value}
          onChange={handleInputChange}
          className="flex-1 h-full px-4 bg-transparent text-neutral-200 light:text-black outline-none placeholder:text-neutral-700 light:placeholder:text-neutral-400 rounded-r-lg"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-hidden bg-[#161616] light:bg-white border border-[#2a2a2a] light:border-gray-200 rounded-lg shadow-xl light:shadow-lg z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-[#2a2a2a] light:border-gray-200 sticky top-0 bg-[#161616] light:bg-white z-10">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 light:text-neutral-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search country..."
                className="w-full bg-[#0a0a0a] light:bg-gray-50 rounded-md py-1.5 pl-9 pr-3 text-xs text-neutral-300 light:text-black border border-[#2a2a2a] light:border-gray-200 focus:outline-none focus:border-neutral-600 light:focus:border-neutral-400 placeholder:text-neutral-700 light:placeholder:text-neutral-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-neutral-800 light:scrollbar-thumb-neutral-300 scrollbar-track-transparent">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${country === c.code ? 'bg-[#222] light:bg-gray-100 text-white light:text-black' : 'text-neutral-400 light:text-neutral-600 hover:bg-[#1a1a1a] light:hover:bg-gray-50 hover:text-neutral-200 light:hover:text-black'}`}
                  onClick={() => {
                    setCountry(c.code as CountryCode);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] font-mono opacity-40 w-6 text-center bg-[#222] light:bg-gray-200 rounded px-1">{c.code}</span>
                    <span className="truncate max-w-[140px]">{c.name}</span>
                  </span>
                  <span className="text-xs text-neutral-600 light:text-neutral-400">{c.dial_code}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-neutral-600 light:text-neutral-400">No countries found</div>
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
      <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a] light:bg-white">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
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
          iconColor="text-neutral-400 light:text-neutral-500"
        >
          <p className="text-neutral-500 light:text-neutral-600 text-sm mb-8">Please fill in your information to get started.</p>

          <div className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 mb-2 ml-1">
                  First Name <span className="text-red-900 light:text-red-600 text-sm">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 h-12 bg-[#161616] light:bg-white text-neutral-200 light:text-black border border-[#2a2a2a] light:border-gray-300 rounded-lg focus:border-neutral-600 light:focus:border-neutral-400 outline-none transition-all placeholder:text-neutral-700 light:placeholder:text-neutral-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 mb-2 ml-1">
                  Last Name <span className="text-red-900 light:text-red-600 text-sm">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 h-12 bg-[#161616] light:bg-white text-neutral-200 light:text-black border border-[#2a2a2a] light:border-gray-300 rounded-lg focus:border-neutral-600 light:focus:border-neutral-400 outline-none transition-all placeholder:text-neutral-700 light:placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 mb-2 ml-1">
                Phone Number <span className="text-red-900 light:text-red-600 text-sm">*</span>
              </label>
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                country={country}
                setCountry={setCountry}
              />
              {phoneNumber && !isValidPhoneNumber(phoneNumber, country) && (
                <p className="text-red-900 light:text-red-600 text-[10px] mt-2 ml-1 animate-pulse font-medium">Invalid phone number format</p>
              )}
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 light:text-neutral-600 mb-2 ml-1">
                Profile Picture
              </label>
              <div className="border border-[#2a2a2a] light:border-gray-300 rounded-lg p-4 bg-[#161616] light:bg-white">
                <AvatarUpload onFileSelect={setAvatarFile} />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-6 p-3 bg-red-900/10 light:bg-red-50 border border-red-900/20 light:border-red-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-900 light:bg-red-600"></div>
              <p className="text-red-900 light:text-red-600 text-xs">{errorMsg}</p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={loading || !name.trim() || !surname.trim()}
            className="w-full mt-8 bg-[#e5e5e5] light:bg-black hover:bg-white light:hover:bg-neutral-800 text-black light:text-white py-3 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </button>

          <div className="mt-8 text-center border-t border-[#222] light:border-gray-200 pt-6">
            <p className="text-neutral-600 light:text-neutral-500 text-xs">
              By continuing, you agree to our Terms of Service.
            </p>
          </div>
        </PageWidget>
      </div>
    </div>
  );
}