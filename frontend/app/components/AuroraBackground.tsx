'use client';

import React from 'react';

const AuroraBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-white">
        <style jsx>{`
      @keyframes sine-flow-1 {
        0%   { transform: translate(-20%, 10%) scale(1); opacity: 0.8; }
        25%  { transform: translate(10%, -10%) scale(1.1); opacity: 1; }
        50%  { transform: translate(40%, 10%) scale(0.8); opacity: 0.6; }
        75%  { transform: translate(10%, 30%) scale(0.9); opacity: 0.9; }
        100% { transform: translate(-20%, 10%) scale(1); opacity: 0.8; }
      }
      @keyframes sine-flow-2 {
        0%   { transform: translate(20%, -20%) scale(0.9); opacity: 0.7; }
        33%  { transform: translate(-10%, 0%) scale(1.1); opacity: 0.9; }
        66%  { transform: translate(30%, 20%) scale(1); opacity: 0.8; }
        100% { transform: translate(20%, -20%) scale(0.9); opacity: 0.7; }
      }
    `}</style>
        <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vh] bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-[100%] blur-[180px] mix-blend-multiply" style={{ animation: 'sine-flow-1 25s infinite ease-in-out' }} />
        <div className="absolute bottom-[-30%] right-[-10%] w-[70vw] h-[70vh] bg-gradient-to-l from-cyan-50/50 to-purple-200/50 rounded-[100%] blur-[150px] mix-blend-multiply" style={{ animation: 'sine-flow-2 30s infinite ease-in-out reverse' }} />
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{ backgroundImage: "url('/grainy.png')", backgroundRepeat: 'repeat', backgroundSize: '120px 120px' }} />
        <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-white via-white/90 to-transparent" />
    </div>
);

export default AuroraBackground;
