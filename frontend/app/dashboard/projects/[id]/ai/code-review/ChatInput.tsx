"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Lock, Cpu, Sparkles, Zap } from "lucide-react";

interface ModelConfig {
  id: string;
  name: string;
  icon: typeof Cpu | typeof Sparkles | typeof Zap;
}

interface ChatInputProps {
  onSend: (text: string) => void;
  isGenerating: boolean;
  // This prop now represents the combined lock (Token + Config)
  isLocked: boolean; 
  selectedModel: ModelConfig;
  selectedModelBalance: number;
  // New props for specific page overrides (like GitHub Config alert)
  customPlaceholder?: string;
  customLockMessage?: string;
}

export const ChatInput = ({ 
  onSend, 
  isGenerating, 
  isLocked, 
  selectedModel, 
  selectedModelBalance,
  customPlaceholder,
  customLockMessage
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSendClick = () => {
    if (!input.trim() || isGenerating || isLocked) return;
    onSend(input);
    setInput(""); 
  };

  const estimatedInputTokens = Math.ceil(input.length / 4);
  const isInputTooExpensive = estimatedInputTokens > selectedModelBalance;
  // If globally locked by config/token or locally locked by large prompt
  const effectiveLock = isLocked || isInputTooExpensive;

  // Determine Placeholder Text
  let placeholderText = "Ask anything...";
  if (customPlaceholder) {
      placeholderText = customPlaceholder;
  } else if (isInputTooExpensive) {
      placeholderText = "Input exceeds balance";
  } else if (isLocked) {
      placeholderText = `Insufficient ${selectedModel.name} tokens.`;
  }

  // Determine Lock Message
  let lockMessage = 'No tokens';
  if (customLockMessage) {
      lockMessage = customLockMessage;
  } else if (isInputTooExpensive) {
      lockMessage = 'Prompt too long';
  }

  return (
    <div className="absolute bottom-6 left-0 right-0 px-4 md:px-12 lg:px-24 pointer-events-none z-30">
        <div className="relative max-w-4xl mx-auto pointer-events-auto">
            <div className={`relative bg-[#18181B] rounded-xl border transition-all duration-200 shadow-2xl shadow-black/80 ${effectiveLock ? 'border-red-900/50 opacity-80' : 'border-[#27272A] focus-within:border-zinc-500'}`}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); }}}
                    placeholder={placeholderText}
                    className={`w-full bg-transparent text-[#E4E4E7] placeholder-zinc-600 resize-none focus:outline-none text-[15px] px-4 py-4 pr-12 max-h-[200px] leading-relaxed rounded-xl ${effectiveLock ? 'cursor-not-allowed text-zinc-500' : ''}`}
                    rows={1}
                    disabled={effectiveLock}
                />
                
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div className="flex items-center gap-2">
                        {/* Static Model Badge */}
                        <div className="relative">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#27272A]/30 rounded-md text-xs text-zinc-500 cursor-default border border-transparent">
                                <selectedModel.icon size={12} className='text-indigo-400' />
                                <span className="font-medium">{selectedModel.name}</span>
                            </div>
                        </div>
                        {input.length > 0 && !effectiveLock && <span className={`text-[10px] font-mono ${isInputTooExpensive ? 'text-red-500' : 'text-zinc-500'}`}>~{estimatedInputTokens} tok</span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {effectiveLock && (
                            <div className="flex items-center gap-1 text-[10px] text-red-500 bg-red-950/20 px-2 py-1 rounded">
                                <Lock size={10} />
                                <span>{lockMessage}</span>
                            </div>
                        )}
                        <button onClick={handleSendClick} disabled={!input.trim() || isGenerating || effectiveLock} className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${input.trim() && !isGenerating && !effectiveLock ? 'bg-zinc-100 text-black hover:bg-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-[#27272A] text-zinc-500 cursor-not-allowed'}`}>
                            {isGenerating ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"/> : <CornerDownLeft size={16} strokeWidth={2.5} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};