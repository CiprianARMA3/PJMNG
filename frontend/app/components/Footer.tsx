'use client';

import React from 'react';

interface FooterProps {
    minimal?: boolean;
}

const Footer = ({ minimal = false }: FooterProps) => (
    <footer className={`py-12 px-6 bg-white relative z-10 ${minimal ? 'border-t border-gray-100' : ''}`}>
        <div className={`flex justify-center align-center text-[10vw] md:text-[175px] font-extrabold leading-none select-none text-[#202124] ${minimal ? 'opacity-5' : ''}`}>
            <p>KAPRY.DEV</p>
        </div>
        {!minimal && (
            <div className='flex justify-center align-center mb-25 text-xl md:text-5xl font-bold text-center mt-4 leading-none select-none text-[#202124]'>
                <p>BY DEVELOPERS FOR DEVELOPERS</p>
            </div>
        )}
        <div className={`max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm ${minimal ? 'mt-12' : 'mt-20 border-t border-gray-100 pt-8'}`}>
            <div className="flex items-center gap-2 opacity-80">
                <span className="font-bold text-lg text-[#5f6368]">KAPRY</span>
                <span className="text-[#9aa0a6] text-lg">.DEV</span>
            </div>
            <div className="flex gap-8 text-[#5f6368] font-medium">
                <a href="#" className="hover:text-purple-600 transition-colors">Documentation</a>
                <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
                <a href="#" className="hover:text-purple-600 transition-colors">Legal</a>
            </div>
        </div>
    </footer>
);

export default Footer;
