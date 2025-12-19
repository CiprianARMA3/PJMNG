'use client';

import React from 'react';
import { Github, Twitter, Linkedin, ArrowUpRight } from 'lucide-react';

interface FooterProps {
    minimal?: boolean;
}

const Footer = ({ minimal = false }: FooterProps) => {
    const currentYear = new Date().getFullYear();

    if (minimal) {
        return (
            <footer className="py-8 px-6 bg-white border-t border-gray-100">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="font-bold text-[#202124] tracking-tight">KAPRY.DEV</span>
                    <p className="text-sm text-[#5f6368]">© {currentYear} Kapry Inc.</p>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-white border-t border-gray-100 relative z-10 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 pb-12">
                
                {/* 1. THE MASSIVE BRANDING */}
                <div className="flex justify-center items-center py-12 md:py-24">
                    <h1 className="text-[13vw] leading-[0.8] font-extrabold tracking-tighter text-[#202124] select-none text-center">
                        KAPRY.DEV
                    </h1>
                </div>

                {/* 2. THE MANIFESTO */}
                <div className="flex justify-center mb-24">
                    <div className="text-xl md:text-5xl font-bold text-center leading-none select-none text-[#202124]">
                        <p>BY DEVELOPERS FOR DEVELOPERS</p>
                    </div>
                </div>

                {/* 3. PROFESSIONAL LINKS GRID (Clean, no fluff) */}
                <div className="border-t border-gray-100 pt-16 grid grid-cols-2 md:grid-cols-4 gap-10 mb-20">
                    <div>
                        <h3 className="font-bold text-[#202124] mb-6">Product</h3>
                        <ul className="space-y-4 text-sm text-[#5f6368] font-medium">
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors flex items-center gap-1">Changelog <ArrowUpRight size={14} className="opacity-50"/></a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#202124] mb-6">Resources</h3>
                        <ul className="space-y-4 text-sm text-[#5f6368] font-medium">
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Help Center</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#202124] mb-6">Company</h3>
                        <ul className="space-y-4 text-sm text-[#5f6368] font-medium">
                            <li><a href="#" className="hover:text-[#202124] transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#202124] mb-6">Legal</h3>
                        <ul className="space-y-4 text-sm text-[#5f6368] font-medium">
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors">European Union Compliance</a></li>
                            <li><a href="#" className="hover:text-[#202124] transition-colors">Security</a></li>
                        </ul>
                    </div>
                </div>

                {/* 4. BOTTOM BAR: Copyright, Socials, System Status */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <span className="text-sm text-[#9aa0a6] font-medium">© {currentYear} Kapry Inc.</span>
                        
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-[#5f6368]">All systems operational</span>
                        </div>
                    </div>

                    <div className="flex gap-6 text-[#5f6368]">
                        <a href="#" className="hover:text-[#202124] transition-colors"><Github size={20} /></a>
                        <a href="#" className="hover:text-[#202124] transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-[#202124] transition-colors"><Linkedin size={20} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;