'use client';

import React from 'react';

const BuiltWith = () => (
    <section className="py-20 border-y border-zinc-100 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
            {/* 1. Refined Typography: Smaller, lighter, and wider tracking */}
            <p className='text-center mb-12 text-[15px] uppercase font-bold tracking-[0.2em] text-[#9aa0a6]'>
                Powering our infrastructure with industry standards
            </p>
            
            {/* 2. Logo Grid: Consistent height, monochromatic, and smooth transitions */}
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
                <div className="h-7 md:h-8 flex items-center justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-in-out cursor-default">
                    <img src="/react.png" alt="React" className='h-full w-auto object-contain' />
                </div>
                <div className="h-6 md:h-7 flex items-center justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-in-out cursor-default">
                    <img src="/tailwind.png" alt="Tailwind CSS" className='h-full w-auto object-contain' />
                </div>
                <div className="h-7 md:h-8 flex items-center justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-in-out cursor-default">
                    <img src="/supabase.png" alt="Supabase" className='h-full w-auto object-contain' />
                </div>
                <div className="h-6 md:h-7 flex items-center justify-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 ease-in-out cursor-default">
                    <img src="/nextjs.svg" alt="Next.js" className='h-full w-auto object-contain' />
                </div>
            </div>
        </div>
    </section>
);

export default BuiltWith;