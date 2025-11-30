"use client";

import React from 'react';
import { Phone } from 'lucide-react';
import { parsePhoneNumber, getCountryCallingCode, CountryCode } from 'libphonenumber-js';
//                                                             👆 Ensure CountryCode is imported


// --- COUNTRY NAME MAP (Partial List) ---
// Note: For a production app, consider importing a comprehensive list from a library like 'i18n-iso-countries' or using a separate JSON file.
const countryNameMap: Record<string, string> = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy', // Added Italy
    'JP': 'Japan',
    'IN': 'India',
    'AU': 'Australia',
    'BR': 'Brazil',
    // ... add more countries as needed
    'XX': 'Unknown Country', // Fallback for codes we don't map
};

// Helper function to map ISO 3166-1 alpha-2 code (e.g., 'US') to a flag emoji
const getFlagEmoji = (countryCode: string | undefined): string => {
// ... (rest of this function remains unchanged)
    if (!countryCode || countryCode.length !== 2) return '';
    
    // Convert the two letters into regional indicator symbols (the flag characters)
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0)); // 127397 is the base for 'Regional Indicator Symbol Letter A'
        
    return String.fromCodePoint(...codePoints);
};

interface PhoneNumberDisplayProps {
    phoneNumber: string | null;
}

export const PhoneNumberDisplay: React.FC<PhoneNumberDisplayProps> = ({ phoneNumber }) => {
    
    let countryCode: string | null = null;
    let countryFlag: string | null = null;
    let countryFullName: string | null = null; // 🆕 NEW variable
    let isValid: boolean = false;
    
    // Only attempt to parse if the number looks like an E.164 format
    if (phoneNumber && phoneNumber.startsWith('+')) {
        try {
            const parsed = parsePhoneNumber(phoneNumber);
            
            if (parsed.isValid()) {
                isValid = true;
                countryCode = parsed.country || null;
                
                if (countryCode) {
                    countryFlag = getFlagEmoji(countryCode);
                    // 🆕 Fetch the full name
                    countryFullName = countryNameMap[countryCode] || `Code: ${countryCode}`;
                }
            }
        } catch (e) {
            // Error handling for malformed input
            isValid = false;
        }
    }
    
    // Updated check to include the new variable (optional, as countryCode covers it)
    const hasCountryInfo = isValid && countryFlag && countryCode;

    return (
        <div 
            className="text-xs text-zinc-500 flex items-center gap-2 font-mono relative group" 
            title="Phone Number"
        >
            <span>
                {phoneNumber || <span className="text-zinc-600 italic">Not provided</span>}
            </span>

            {hasCountryInfo && countryCode && (
                <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-[#0a0a0a] border border-zinc-800 text-[12.5px] font-medium text-zinc-200 rounded shadow-xl opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                    {countryFlag} {countryFullName} 
                    <span className="ml-2 text-white">
                         (<b>+{getCountryCallingCode(countryCode as CountryCode)}</b>)
                    </span>
                </div>
            )}
            
            {phoneNumber && !hasCountryInfo && phoneNumber.startsWith('+') && (
                 <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-red-950/80 border border-red-800/80 text-[10px] font-medium text-red-300 rounded shadow-xl opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
                    ⚠️ Invalid E.164 Format
                </div>
            )}
        </div>
    );
};