"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { MoreHorizontal, Code, ChevronDown, Search } from "lucide-react";
import { 
  getCountries, 
  getCountryCallingCode, 
  AsYouType, 
  isValidPhoneNumber,
  CountryCode
} from 'libphonenumber-js';

// --- MATTE TEXTURE COMPONENT ---
const NoiseBackground = () => (
  <div className="fixed inset-0 z-0 w-full h-full bg-[#0a0a0a]">
    {/* Base Gradient - Deep and subtle */}
    <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] to-[#111111]" />
    
    {/* NOISE OVERLAY - This creates the "Matte" feel */}
    <div 
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  </div>
);

// --- MOCK AVATAR (Matte Style) ---
const MockAvatarUpload = () => (
  <div className="flex items-center gap-4 group cursor-pointer">
    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center group-hover:border-[#555] transition-colors">
      <span className="text-neutral-500 text-xs font-semibold">IMG</span>
    </div>
    <div className="flex flex-col">
      <span className="text-sm text-neutral-300 font-medium group-hover:text-white transition-colors">Upload photo</span>
      <span className="text-xs text-neutral-600">Max 2MB</span>
    </div>
  </div>
);

// --- PAGE WIDGET (Matte Style) ---
const PageWidget = ({ title, icon: Icon, iconColor, children }: any) => (
  // Removed backdrop-blur, added solid background and noise-compatible borders
  <div className="relative z-10 w-full max-w-md bg-[#111111] border border-[#222] rounded-xl flex flex-col overflow-visible shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] hover:border-[#333] transition-colors">
    
    {/* Header */}
    <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between bg-[#141414] rounded-t-xl">
      <div className="flex items-center gap-3">
        {/* Icon wrapper for depth */}
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

// --- PHONE INPUT (Matte Style) ---
const PhoneInput = ({ value, onChange, country, setCountry }: any) => {
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
      {/* Matte Input Logic:
          1. Darker background (#161616)
          2. Subtle border (#2a2a2a)
          3. Focus: Light Grey border (neutral-600) instead of glowing purple 
      */}
      <div className="flex h-12 w-full bg-[#161616] border border-[#2a2a2a] rounded-lg focus-within:border-neutral-600 transition-colors overflow-visible items-stretch">
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-full items-center gap-2 px-3 border-r border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors bg-[#161616] min-w-[80px] rounded-l-lg"
        >
          <span className="text-neutral-300 text-sm font-medium">+{getCountryCallingCode(country)}</span>
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
                autoFocus type="text" placeholder="Search..." 
                className="w-full bg-[#0a0a0a] rounded-md py-1.5 pl-9 pr-3 text-xs text-neutral-300 border border-[#2a2a2a] focus:outline-none focus:border-neutral-600 placeholder:text-neutral-700"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {filteredCountries.map((c) => (
              <button
                key={c.code} type="button"
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${country === c.code ? 'bg-[#222] text-white' : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-neutral-200'}`}
                onClick={() => { setCountry(c.code as CountryCode); setIsOpen(false); setSearchTerm(""); }}
              >
                <span className="flex items-center gap-3">
                  <span className="text-[10px] font-mono opacity-40 w-6 text-center bg-[#222] rounded px-1">{c.code}</span>
                  <span className="truncate max-w-[140px]">{c.name}</span>
                </span>
                <span className="text-xs text-neutral-600">{c.dial_code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- PREVIEW PAGE ---
export default function PreviewPage() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [country, setCountry] = useState<CountryCode>("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Sample: Profile Saved!");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      
      {/* Matte Background */}
      <NoiseBackground />

      <div className="relative z-10 w-full max-w-md">
        <PageWidget title="Complete Your Profile" icon={Code} iconColor="text-neutral-400">
          <p className="text-neutral-500 text-sm mb-8">Please fill in your information to get started.</p>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">First Name</label>
                <input
                  type="text" placeholder="John" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 h-12 bg-[#161616] text-neutral-200 border border-[#2a2a2a] rounded-lg focus:border-neutral-600 outline-none transition-all placeholder:text-neutral-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">Last Name</label>
                <input
                  type="text" placeholder="Doe" value={surname} onChange={(e) => setSurname(e.target.value)}
                  className="w-full px-4 h-12 bg-[#161616] text-neutral-200 border border-[#2a2a2a] rounded-lg focus:border-neutral-600 outline-none transition-all placeholder:text-neutral-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">
                Phone Number <span className="text-red-900">*</span>
              </label>
              <PhoneInput value={phoneNumber} onChange={setPhoneNumber} country={country} setCountry={setCountry} />
              {phoneNumber && !isValidPhoneNumber(phoneNumber, country) && (
                <p className="text-red-900 text-[10px] mt-2 ml-1 font-medium">Invalid phone number format</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2 ml-1">Profile Picture</label>
              <div className="border border-[#2a2a2a] rounded-lg p-4 bg-[#161616]">
                <MockAvatarUpload />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={loading}
            // Button: Deep Matte Purple (Desaturated) or White for contrast. 
            // Using a "Concrete" White for that high-end matte look.
            className="w-full mt-8 bg-[#e5e5e5] hover:bg-white text-black py-3 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </button>

          <div className="mt-8 text-center border-t border-[#222] pt-6">
            <p className="text-neutral-600 text-xs">By continuing, you agree to our Terms of Service.</p>
          </div>
        </PageWidget>
      </div>
    </div>
  );
}