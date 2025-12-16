import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Lock, ChevronDown, Zap } from "lucide-react";

export const ChatInput = ({
    onSend,
    isGenerating,
    isLocked,
    selectedModel,
    selectedModelBalance,
    tokenBalances, // <--- ADDED THIS PROP
    models,
    onModelSelect
}: any) => {
    const [input, setInput] = useState("");
    const [showModelMenu, setShowModelMenu] = useState(false);
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
    const effectiveLock = isLocked || isInputTooExpensive;

    return (
        <div className="absolute bottom-6 left-0 right-0 px-4 md:px-12 lg:px-24 pointer-events-none z-30">
            <div className="relative max-w-4xl mx-auto pointer-events-auto">
                <div className={`relative bg-[#18181B] light:bg-white rounded-xl border transition-all duration-200 shadow-2xl shadow-black/80 light:shadow-gray-200/50 ${effectiveLock ? 'border-red-900/50 opacity-80' : 'border-[#27272A] light:border-gray-200 focus-within:border-zinc-500 light:focus-within:border-gray-400'}`}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); } }}
                        placeholder={isInputTooExpensive ? `Input exceeds balance` : effectiveLock ? `Insufficient ${selectedModel.name} tokens.` : "Ask anything..."}
                        className={`w-full bg-transparent text-[#E4E4E7] light:text-black placeholder-zinc-600 light:placeholder-gray-400 resize-none focus:outline-none text-[15px] px-4 py-4 pr-12 max-h-[200px] leading-relaxed rounded-xl ${effectiveLock ? 'cursor-not-allowed text-zinc-500 light:text-gray-400' : ''}`}
                        rows={1}
                    />

                    <div className="flex items-center justify-between px-3 pb-3 pt-1">
                        <div className="flex items-center gap-2">
                            {/* Model Selector */}
                            <div className="relative">
                                <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#27272A]/50 light:bg-gray-100 hover:bg-[#27272A] light:hover:bg-gray-200 rounded-md text-xs text-zinc-400 light:text-gray-500 hover:text-zinc-200 light:hover:text-black transition-colors border border-transparent hover:border-zinc-700 light:hover:border-gray-300">
                                    <selectedModel.icon size={12} className={selectedModel.id.includes('flash') ? 'text-amber-400' : 'text-indigo-400'} />
                                    <span className="font-medium">{selectedModel.name}</span>
                                    <ChevronDown size={10} className="opacity-50" />
                                </button>
                                {showModelMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#18181B] light:bg-white border border-[#27272A] light:border-gray-200 rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                                            <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 light:text-gray-400 uppercase tracking-wider">Select Model</div>
                                            {models.map((model: any) => {
                                                // Calculate balance safely
                                                const bal = tokenBalances ? (tokenBalances[model.id] || 0) : 0;

                                                return (
                                                    <button key={model.id} onClick={() => { onModelSelect(model); setShowModelMenu(false); }} className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-zinc-400 light:text-gray-500 hover:bg-[#27272A] light:hover:bg-gray-100 hover:text-zinc-100 light:hover:text-black transition-colors">
                                                        <span className="flex items-center gap-2">
                                                            <model.icon size={14} className={model.id.includes('flash') ? 'text-amber-400' : 'text-indigo-400'} />
                                                            {model.name}
                                                        </span>
                                                        {/* Balance Display */}
                                                        <span className={`text-[10px] font-mono ${bal > 0 ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                                            {bal.toLocaleString()}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                            {input.length > 0 && !effectiveLock && <span className={`text-[10px] font-mono ${isInputTooExpensive ? 'text-red-500' : 'text-zinc-500'}`}>~{estimatedInputTokens} tok</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {effectiveLock && <div className="flex items-center gap-1 text-[10px] text-red-500 bg-red-950/20 px-2 py-1 rounded"><Lock size={10} /><span>{isInputTooExpensive ? 'Prompt too long' : 'No tokens'}</span></div>}
                            <button onClick={handleSendClick} disabled={!input.trim() || isGenerating || effectiveLock} className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${input.trim() && !isGenerating && !effectiveLock ? 'bg-zinc-100 light:bg-black text-black light:text-white hover:bg-white light:hover:bg-gray-800 shadow-[0_0_10px_rgba(255,255,255,0.1)] light:shadow-none' : 'bg-[#27272A] light:bg-gray-200 text-zinc-500 light:text-gray-400 cursor-not-allowed'}`}>
                                {isGenerating ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" /> : <CornerDownLeft size={16} strokeWidth={2.5} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};