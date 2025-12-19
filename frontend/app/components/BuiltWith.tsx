'use client';

import React from 'react';

const BuiltWith = () => (
    <section className="py-15 -mt-10 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 ">
            <p className='text-center mb-10 uppercase font-bold text-3xl '>built with</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 hover:opacity-100">
                <div className="h-10 md:h-12 w-auto flex items-center justify-center">
                    <img src="/react.png" alt="react" className='h-full w-auto object-contain' />
                </div>
                <div className="h-8 md:h-9 w-auto flex items-center justify-center">
                    <img src="/tailwind.png" alt="tailwind" className='h-full w-auto object-contain' />
                </div>
                <div className="h-10 md:h-12 w-auto flex items-center justify-center">
                    <img src="/supabase.png" alt="supabase" className='h-full w-auto object-contain' />
                </div>
                <div className="h-8 md:h-9 w-auto flex items-center justify-center">
                    <img src="/nextjs.svg" alt="nextjs" className='h-full w-auto object-contain' />
                </div>
            </div>
        </div>
    </section>
);

export default BuiltWith;
